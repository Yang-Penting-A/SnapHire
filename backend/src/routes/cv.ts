import { Router } from "express";
import multer from "multer";
const pdf = require("pdf-parse"); 
import { supabase } from "../services/supabase";
import { azureService } from "../services/azure";
import { extractResumeData, calculateMatchScore } from "../services/gemini";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    console.log("\n=== CV UPLOAD STARTED ===");
    const { job_id } = req.body;
    console.log("[1] Received job_id:", job_id);
    console.log("[1] File received:", req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'NO FILE');

    // STEP 1: VALIDATE FILE
    if (!req.file) {
      console.error("[ERROR] No file provided");
      return res.status(400).json({ message: "File PDF tidak ditemukan", step: "file_validation" });
    }
    console.log("[1] ✓ File validation passed");

    // STEP 2: VALIDATE JOB_ID
    if (!job_id) {
      console.error("[ERROR] No job_id provided");
      return res.status(400).json({ message: "job_id wajib disertakan", step: "job_id_validation" });
    }
    console.log("[2] ✓ Job ID validation passed");

    // STEP 3: FETCH JOB FROM DATABASE
    console.log("[3] Fetching job from database...");
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('job_id', job_id)
      .single();

    if (jobError) {
      console.error("[ERROR] Database error fetching job:", jobError.message);
      return res.status(404).json({ 
        message: "Gagal mengambil data pekerjaan dari database", 
        step: "job_fetch",
        details: jobError.message
      });
    }
    
    if (!job) {
      console.error("[ERROR] Job not found for job_id:", job_id);
      return res.status(404).json({ 
        message: "Pekerjaan tidak ditemukan di database", 
        step: "job_not_found",
        job_id: job_id
      });
    }
    console.log("[3] ✓ Job fetched successfully", { 
      title: job.title,
      available_columns: Object.keys(job).join(', ')
    });

    // STEP 4: UPLOAD TO AZURE
    console.log("[4] Uploading to Azure Blob Storage...");
    const fileExtension = req.file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    console.log("[4] Generated filename:", fileName);

    const azureResponse = await azureService.uploadFile(
      fileName, 
      req.file.buffer, 
      'application/pdf'
    );

    if (!azureResponse.success || !azureResponse.data) {
      console.error("[ERROR] Azure upload failed:", azureResponse.message);
      return res.status(500).json({ 
        message: "Gagal upload file ke Azure", 
        step: "azure_upload",
        details: azureResponse.message
      });
    }
    const publicUrl = azureResponse.data.url;
    console.log("[4] ✓ Azure upload successful. URL:", publicUrl);

    // STEP 5: PARSE PDF
    console.log("[5] Parsing PDF content...");
    const parsePdf = typeof pdf === 'function' ? pdf : pdf.default;
    const pdfData = await parsePdf(req.file.buffer);
    const rawText = pdfData.text;
    console.log("[5] ✓ PDF parsed. Text length:", rawText.length);

    // STEP 6: EXTRACT RESUME DATA WITH GEMINI (CRITICAL)
    console.log("[6] Extracting resume data with Gemini AI...");
    let resumeData;
    try {
      resumeData = await extractResumeData(rawText);
      console.log("[6] ✓ Resume extraction successful:", { 
        nama: resumeData.nama, 
        email: resumeData.email,
        skills_count: resumeData.skills?.length || 0
      });
    } catch (extractError: any) {
      console.error("[ERROR] Resume extraction failed (CRITICAL):", extractError.message);
      return res.status(500).json({ 
        message: "Gagal mengekstrak data resume dengan AI", 
        step: "resume_extraction",
        details: extractError.message
      });
    }

    // STEP 7: CALCULATE MATCH SCORE WITH GEMINI (NON-CRITICAL - USE FALLBACK IF FAILS)
    console.log("[7] Calculating match score with Gemini AI...");
    const jobRequirements = job.requirements || job.description || job.title || '';
    console.log("[7] Job requirements source:", {
      has_requirements: !!job.requirements,
      has_description: !!job.description,
      using: job.requirements ? 'requirements' : (job.description ? 'description' : 'title')
    });
    
    let scoringResult = {
      score: 0,
      summary: "AI scoring unavailable",
      strengths: [],
      weaknesses: [],
      recommendation: "manual review"
    };
    
    try {
      scoringResult = await calculateMatchScore(resumeData, jobRequirements);
      console.log("[7] ✓ Scoring successful:", { 
        score: scoringResult.score,
        recommendation: scoringResult.recommendation
      });
    } catch (scoringError: any) {
      console.warn("[7] ⚠️  Gemini AI scoring failed - using fallback scoring");
      console.warn("[7] Gemini error:", scoringError.message);
      console.log("[7] ℹ️  Continuing with fallback score (0) - manual review required");
    }

    // STEP 8: INSERT CANDIDATE TO SUPABASE
    console.log("[8] Inserting candidate to database...");
    const { data: candidate, error: candError } = await supabase
      .from('candidates')
      .insert([{
        name: resumeData.nama,
        email: resumeData.email,
        phone_number: resumeData.phone,
        linkedin_url: resumeData.linkedin_url,
        portfolio_url: resumeData.portfolio_url,
        cv_text: rawText,
        cv_file_url: publicUrl
      }])
      .select()
      .single();

    if (candError) {
      console.error("[ERROR] Candidate insert failed:", candError.message);
      return res.status(500).json({ 
        message: "Gagal menyimpan data kandidat", 
        step: "candidate_insert",
        details: candError.message
      });
    }
    console.log("[8] ✓ Candidate inserted. ID:", candidate.candidate_id);

    // STEP 9: INSERT APPLICATION TO SUPABASE
    console.log("[9] Inserting application to database...");
    const { error: appError } = await supabase
      .from('applications')
      .insert([{
        candidate_id: candidate.candidate_id,
        job_id: job_id,
        ai_score: scoringResult.score,
        ai_summary: scoringResult.summary,
        ai_strengths: scoringResult.strengths,
        ai_weaknesses: scoringResult.weaknesses,
        ai_recommendation: scoringResult.recommendation,
        status_application: 'Review AI'
      }]);

    if (appError) {
      console.error("[ERROR] Application insert failed:", appError.message);
      return res.status(500).json({ 
        message: "Gagal menyimpan data aplikasi", 
        step: "application_insert",
        details: appError.message
      });
    }
    console.log("[9] ✓ Application inserted successfully");

    console.log("\n=== CV UPLOAD COMPLETED SUCCESSFULLY ===");
    res.status(200).json({
      status: "success",
      message: "Proses screening selesai",
      candidate_name: candidate.name,
      candidate_id: candidate.candidate_id,
      score: scoringResult.score,
      file_url: publicUrl
    });

  } catch (error: any) {
    console.error("\n[FATAL ERROR] Unhandled exception:", error);
    console.error("[FATAL ERROR] Stack:", error.stack);
    res.status(500).json({ 
      status: "error", 
      message: error.message || "Terjadi kesalahan yang tidak terduga",
      step: "unhandled_exception",
      details: error.stack
    });
  }
});

export default router;