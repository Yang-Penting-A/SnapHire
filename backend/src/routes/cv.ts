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
    const { job_id } = req.body;

    // Validate file
    if (!req.file) {
      console.error("[ERROR] No file provided");
      return res.status(400).json({ status: 'error', message: "File PDF tidak ditemukan", step: "file_validation" });
    }

    // Validate job_id
    if (!job_id) {
      console.error("[ERROR] No job_id provided");
      return res.status(400).json({ status: 'error', message: "job_id wajib disertakan", step: "job_id_validation" });
    }
    console.log("[UPLOAD] File: " + req.file.originalname + " (" + req.file.size + " bytes)");

    // Fetch job from database
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('job_id', job_id)
      .single();

    if (jobError || !job) {
      console.error("[ERROR] Job not found: " + job_id);
      return res.status(404).json({ 
        status: 'error',
        message: "Pekerjaan tidak ditemukan di database", 
        step: "job_not_found",
        job_id: job_id
      });
    }

    // Upload to Azure
    const fileExtension = req.file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

    const azureResponse = await azureService.uploadFile(
      fileName, 
      req.file.buffer, 
      'application/pdf'
    );

    if (!azureResponse.success || !azureResponse.data) {
      console.error("[ERROR] Azure upload failed");
      return res.status(500).json({ 
        status: 'error',
        message: "Gagal upload file ke Azure", 
        step: "azure_upload",
        details: azureResponse.message
      });
    }
    const publicUrl = azureResponse.data.url;
    console.log("[UPLOAD] ✓ Azure upload success");

    // Parse PDF
    const parsePdf = typeof pdf === 'function' ? pdf : pdf.default;
    const pdfData = await parsePdf(req.file.buffer);
    const rawText = pdfData.text;

    // Extract resume data with Gemini
    
    let resumeData;
    try {
      resumeData = await extractResumeData(rawText);
      console.log("[AI] ✓ Resume extraction success");
    } catch (extractError: any) {
      console.error("[ERROR] Resume extraction failed: " + extractError.message);
      return res.status(500).json({ 
        status: 'error',
        message: "Gagal mengekstrak data resume dengan AI", 
        step: "resume_extraction",
        details: extractError.message
      });
    }

    // Calculate match score with Gemini
    const jobRequirements = job.requirements || job.description || job.title || '';
    
    let scoringResult = {
      score: 0,
      summary: "AI scoring unavailable",
      strengths: [],
      weaknesses: [],
      recommendation: "manual review"
    };
    
    try {
      scoringResult = await calculateMatchScore(resumeData, jobRequirements);
      console.log("[AI] ✓ Match score: " + scoringResult.score + "%");
    } catch (scoringError: any) {
      console.warn("[AI] ⚠ Scoring unavailable, using manual review");
    }

    const normalizeUrl = (url?: string) => {
      if (!url) return null;

      const trimmed = url.trim();

      if (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://")
      ) {
        return trimmed;
      }

      return `https://${trimmed}`;
    };

    // Insert candidate to database
    const candidateData = {
      name: resumeData.nama,
      email: resumeData.email,
      phone_number: resumeData.phone,
      linkedin_url: normalizeUrl(resumeData.linkedin_url),
      portfolio_url: normalizeUrl(resumeData.portfolio_url),
      cv_text: rawText.substring(0, 1000) + '...',
      cv_file_url: publicUrl
    };
    
    const { data: candidate, error: candError } = await supabase
      .from('candidates')
      .insert([{
        name: resumeData.nama,
        email: resumeData.email,
        phone_number: resumeData.phone,
        linkedin_url: normalizeUrl(resumeData.linkedin_url),
        portfolio_url: normalizeUrl(resumeData.portfolio_url),
        cv_text: rawText,
        cv_file_url: publicUrl
      }])
      .select()
      .single();

    if (candError) {
      console.error("[ERROR] Candidate insert failed: " + candError.message);
      return res.status(500).json({ 
        status: 'error',
        message: "Gagal menyimpan data kandidat", 
        step: "candidate_insert",
        details: candError.message
      });
    }
    console.log("[DB] ✓ Candidate inserted: " + candidate.name);

    // Insert application to database
    const applicationData = {
      candidate_id: candidate.candidate_id,
      job_id: job_id,
      ai_score: scoringResult.score,
      ai_summary: scoringResult.summary,
      ai_strengths: scoringResult.strengths,
      ai_weaknesses: scoringResult.weaknesses,
      ai_recommendation: scoringResult.recommendation,
      status_application: 'Review AI'
    };
    
    const { error: appError } = await supabase
      .from('applications')
      .insert([applicationData]);

    if (appError) {
      console.error("[ERROR] Application insert failed: " + appError.message);
      return res.status(500).json({ 
        status: 'error',
        message: "Gagal menyimpan data aplikasi", 
        step: "application_insert",
        details: appError.message
      });
    }
    console.log("[SUCCESS] CV processed successfully");
    res.status(200).json({
      status: "success",
      message: "Proses screening selesai",
      candidate_name: candidate.name,
      candidate_id: candidate.candidate_id,
      score: scoringResult.score,
      file_url: publicUrl
    });

  } catch (error: any) {
    console.error("[ERROR] Unhandled exception: " + error.message);
    
    res.status(500).json({ 
      status: "error", 
      message: error.message || "Terjadi kesalahan yang tidak terduga",
      step: "unhandled_exception",
      error_type: error.constructor.name,
      details: error.stack
    });
  }
});

export default router;