import { Router } from "express";
import multer from "multer";
import pdf from "pdf-parse"; // Cara paling standar
import { extractResumeData, calculateMatchScore } from "../services/gemini";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "File PDF tidak ditemukan" });

    const { jobDesc } = req.body;
    if (!jobDesc) return res.status(400).json({ message: "Mohon masukkan jobDesc" });

    // Handle jika library di-import sebagai objek Module (seperti log kamu tadi)
    const parsePdf = typeof pdf === 'function' ? pdf : (pdf as any).default;

    if (typeof parsePdf !== 'function') {
      throw new Error("Library pdf-parse gagal dimuat sebagai fungsi. Pastikan versi 1.1.1 terinstall.");
    }

    // Eksekusi parsing teks
    const pdfData = await parsePdf(req.file.buffer);
    const rawText = pdfData.text;

    // Proses AI
    const resumeData = await extractResumeData(rawText);
    const scoringResult = await calculateMatchScore(resumeData, jobDesc);

    res.status(200).json({
      status: "success",
      candidate: resumeData,
      analysis: scoringResult
    });

  } catch (error: any) {
    console.error("ERROR SNAPHIRE:", error.message);
    res.status(500).json({ status: "error", message: error.message });
  }
});

export default router;