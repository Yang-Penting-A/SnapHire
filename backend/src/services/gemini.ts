import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

// 1. Fungsi Ekstraksi (Pake Flash-Lite: Cepat & Kuota Gede)
export const extractResumeData = async (textContent: string) => {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash-lite",
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `Ekstrak data CV berikut ke JSON: {nama, email, phone, skills:[], experience:[]}. Teks: ${textContent}`;
  
  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
};

// 2. Fungsi Scoring (Pake Pro: Jenius & Akurat)
export const calculateMatchScore = async (resumeJSON: any, jobDesc: string) => {
  const model = genAI.getGenerativeModel({ 
    // GANTI 'gemini-2.5-pro' MENJADI 'gemini-2.5-flash'
    model: "gemini-2.5-flash", 
    generationConfig: { responseMimeType: "application/json" } 
  });

  const prompt = `
    Bandingkan data kandidat ini dengan kualifikasi pekerjaan (Job Description).
    Kandidat: ${JSON.stringify(resumeJSON)}
    Job Description: ${jobDesc}

    Berikan output JSON: 
    {
      "score": number (0-100), 
      "reason": "alasan singkat kenapa skor tersebut diberikan",
      "missing_skills": ["apa saja yang kurang dari kandidat"]
    }
  `;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
};