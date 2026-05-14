import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

// --- HELPER: Retry dengan Exponential Backoff ---
// Berguna agar sistem tidak langsung crash jika API Gemini sedang limit/sibuk
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Gemini] Attempt ${attempt}/${maxRetries}...`);
      return await fn();
    } catch (error: any) {
      const is503 = error.status === 503 || error.status === 429;
      const isLastAttempt = attempt === maxRetries;
      
      if (is503 && !isLastAttempt) {
        const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
        console.log(`[Gemini] Server Sibuk (503/429) - retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } else {
        throw error;
      }
    }
  }
  throw new Error("Retry failed");
}

// --- FUNGSI 1: EKSTRAKSI DATA CV ---
export const extractResumeData = async (textContent: string) => {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash-lite", // Pakai versi lite biar lebih cepat dan hemat cost
    generationConfig: { 
      responseMimeType: "application/json",
      temperature: 0.1 // Tetap rendah agar ekstraksi data faktual (tidak mengarang)
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
  
  const result = await retryWithBackoff(() => model.generateContent(prompt), 3, 2000);
  return JSON.parse(result.response.text());
};

// --- FUNGSI 2: ANALISIS & PENILAIAN MATCH SCORE ---
export const calculateMatchScore = async (resumeJSON: any, jobRequirements: string) => {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash", 
    generationConfig: { 
      responseMimeType: "application/json",
      temperature: 0.1 // SUDAH DIPERKETAT: AI menjadi kaku, rasional, dan tidak bias
    } 
  });

  const prompt = `
    Kamu adalah Senior Technical Recruiter yang sangat tajam, kritis, dan objektif. 
    Tugasmu adalah melakukan screening CV secara ketat dan memberikan skor kecocokan yang realistis tanpa bias (jangan bermurah hati).

    LOGIKA PENILAIAN SUPER KETAT:
    1. Validasi Hard-Skills: Jika requirement wajib (mandatory) tidak ditemukan eksplisit di CV, POTONG SKOR SECARA SIGNIFIKAN. Jangan berasumsi kandidat bisa jika tidak tertulis.
    2. Kedalaman Pengalaman: Jangan tertipu oleh keyword. Cek durasi dan deskripsi kerja. Apakah kandidat benar-benar mempraktikkan skill tersebut, atau hanya sekadar menempelkan nama tools di list skill?
    3. Zero Tolerance untuk Mismatch: Jika level posisi tidak sesuai (misal: butuh Senior tapi pengalaman Junior), skor maksimal adalah 60.
    4. Objektivitas Mutlak: Skor 80+ hanya berhak diberikan kepada kandidat yang 100% "ready-to-work" sesuai requirement, bukan sekadar "berpotensi".
    
    PANDUAN SKOR REALISTIS:
    - 90-100: Exceptional (Sangat Langka). Memenuhi seluruh requirement wajib dan opsional dengan rekam jejak yang sangat kuat.
    - 75-89: Solid Fit. Memenuhi requirement utama dengan pengalaman yang relevan.
    - 50-74: Marginal Fit. Kehilangan beberapa skill teknis wajib atau pengalaman dirasa kurang dalam.
    - < 50: Poor Fit. Mismatch fundamental pada tech stack, role, atau pengalaman.

    DATA KANDIDAT:
    ${JSON.stringify(resumeJSON)}

    JOB REQUIREMENTS:
    ${jobRequirements}

    HASIL DALAM FORMAT JSON:
    {
      "score": number,
      "summary": "Analisis tajam dan kritis maksimal 2 kalimat yang menjustifikasi alasan utama pemberian/pemotongan skor.",
      "strengths": ["list keahlian kandidat yang benar-benar relevan dengan job requirement"],
      "weaknesses": ["list fatal gap, skill wajib yang absen, atau pengalaman yang dirasa kurang tajam"],
      "recommendation": "Lanjut Interview / Pertimbangkan / Tolak"
    }
  `;

  const result = await retryWithBackoff(() => model.generateContent(prompt), 3, 2000);
  return JSON.parse(result.response.text());
};