import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { sleep } from "../utils/sleep";
import { parseGeminiJson } from "../utils/jsonSanitizer";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

// Retry helper dengan exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const is503 = error.status === 503;
      const isLastAttempt = attempt === maxRetries;
      
      if (is503 && !isLastAttempt) {
        const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } else {
        throw error;
      }
    }
  }
  throw new Error("Retry failed");
}

export const extractResumeData = async (textContent: string) => {
  // Rate limiting: avoid exceeding Gemini RPM (15/minute) quota
  await sleep(2000);
  
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
      "linkedin_url": "string",
      "portofolio_url": "string",
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
  
  console.log(`[Gemini] Making API call...`);
  const result = await retryWithBackoff(() => model.generateContent(prompt), 3, 2000);
  
  // Use robust JSON sanitizer instead of basic markdown stripping
  const responseText = result.response.text();
  const parsedData = parseGeminiJson(responseText);
  
  console.log(`[Gemini] Resume extraction success`);
  return parsedData;
};

export const calculateMatchScore = async (resumeJSON: any, jobRequirements: string) => {
  // Rate limiting: avoid exceeding Gemini RPM (15/minute) quota
  await sleep(2000);
  
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

  console.log(`[Gemini] Making API call...`);
  const result = await retryWithBackoff(() => model.generateContent(prompt), 3, 2000);
  
  // Use robust JSON sanitizer instead of basic markdown stripping
  const responseText = result.response.text();
  const parsedData = parseGeminiJson(responseText);
  
  console.log(`[Gemini] Match score: ${parsedData.score}%`);
  return parsedData;
};