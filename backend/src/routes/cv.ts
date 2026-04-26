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

    if (!req.file) return res.status(400).json({ message: "File PDF tidak ditemukan" });
    if (!job_id) return res.status(400).json({ message: "job_id wajib disertakan" });

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('requirements')
      .eq('job_id', job_id)
      .single();

    if (jobError || !job) {
      return res.status(404).json({ message: "Pekerjaan tidak ditemukan di database" });
    }

    const fileExtension = req.file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

    const azureResponse = await azureService.uploadFile(
      fileName, 
      req.file.buffer, 
      'application/pdf'
    );

    if (!azureResponse.success || !azureResponse.data) {
      throw new Error(azureResponse.message);
    }

    const publicUrl = azureResponse.data.url;

    const parsePdf = typeof pdf === 'function' ? pdf : pdf.default;
    const pdfData = await parsePdf(req.file.buffer);
    const rawText = pdfData.text;

    const resumeData = await extractResumeData(rawText);
    const scoringResult = await calculateMatchScore(resumeData, job.requirements);

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

    if (candError) throw candError;

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
        status_application: 'pending'
      }]);

    if (appError) throw appError;

    res.status(200).json({
      status: "success",
      message: "Proses screening selesai",
      candidate_name: candidate.name,
      score: scoringResult.score,
      file_url: publicUrl
    });

  } catch (error: any) {
    console.error("Error Detail:", error.message);
    res.status(500).json({ status: "error", message: error.message });
  }
});

export default router;