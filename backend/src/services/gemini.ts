import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export const extractResumeData = async (textContent: string) => {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash-lite",
    generationConfig: { 
      responseMimeType: "application/json",
      temperature: 0.1
    }
  });

  const prompt = `
    Ekstrak data dari teks CV berikut ke dalam format JSON.
    Teks CV: ${textContent}

    Format JSON:
    {
      "nama": "string",
      "email": "string",
      "phone": "string",
      "skills": ["string"],
      "experience": [
        {
          "title": "string",
          "organization": "string",
          "period": "string",
          "description": "string"
        }
      ]
    }
  `;
  
  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
};

export const calculateMatchScore = async (resumeJSON: any, jobRequirements: string) => {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash", 
    generationConfig: { 
      responseMimeType: "application/json",
      temperature: 0.3 
    } 
  });

  const prompt = `
    Kamu adalah Recruitment Assistant yang cerdas, objektif, dan suportif. 
    Tugasmu adalah memberikan skor kecocokan kandidat untuk tahap awal screening CV.

    LOGIKA PENILAIAN:
    1. Fokus pada Kemampuan Inti: Berikan apresiasi skor yang baik jika skill utama (mandatory) terpenuhi.
    2. Toleransi Tahap Awal: Jangan langsung memberikan skor rendah jika kriteria opsional tidak ada.
    3. Analisis Pengalaman: Berikan poin tambahan jika deskripsi pengalaman kerja menunjukkan relevansi dengan posisi.
    
    PANDUAN SKOR:
    - 90-100: Sangat cocok, memenuhi hampir semua kriteria utama.
    - 70-89: Potensial, memiliki pondasi kuat meski ada beberapa skill pendukung yang absen.
    - 50-69: Cukup, ada potensi namun perlu pelatihan atau review lebih mendalam.
    - < 50: Kurang sesuai, bidang keahlian tidak relevan dengan posisi.

    DATA KANDIDAT:
    ${JSON.stringify(resumeJSON)}

    JOB REQUIREMENTS:
    ${jobRequirements}

    HASIL DALAM FORMAT JSON:
    {
      "score": number,
      "summary": "Analisis objektif maksimal 2 kalimat",
      "strengths": ["list kelebihan utama"],
      "weaknesses": ["list kekurangan atau skill yang perlu ditingkatkan"],
      "recommendation": "Layak dipertimbangkan / Review lebih lanjut / Kurang sesuai"
    }
  `;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
};