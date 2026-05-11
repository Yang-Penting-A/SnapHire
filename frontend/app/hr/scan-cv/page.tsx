"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import { 
  UploadCloud, FileText, Loader2, CheckCircle2, AlertCircle, 
  Briefcase, Sparkles, ChevronRight, Bot, FileCheck, Info
} from 'lucide-react';

export default function ScanCVPage() {
  const router = useRouter();
  
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE_MB = 10;

  // Logika Status Real-time
  const getJobStatusLabel = (job: any) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const dueDate = job.due_date ? new Date(job.due_date) : null;
    const isPastDue = dueDate && dueDate < today;

    if (job.status_job?.toLowerCase() === 'draft') return 'DRAFT';
    if (isPastDue && job.status_job?.toLowerCase() === 'active') return 'EXPIRED';
    return 'ACTIVE';
  };

  useEffect(() => {
    const fetchAllJobs = async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('job_id, title, department, status_job, due_date')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setAllJobs(data);
      }
    };
    fetchAllJobs();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validasi Ukuran File (10MB)
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setUploadError(`Ukuran file terlalu besar! Maksimal ${MAX_FILE_SIZE_MB}MB.`);
        setUploadFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setUploadFile(file);
      setUploadError('');
    }
  };

  const handleUploadCV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobId) {
      setUploadError('Pilih lowongan tujuan terlebih dahulu!');
      return;
    }
    if (!uploadFile) {
      setUploadError('Pilih file PDF CV terlebih dahulu!');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('job_id', selectedJobId);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/cv/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (!response.ok) throw new Error('Gagal memproses CV. Pastikan server aktif.');

      setUploadFile(null);
      setShowSuccessModal(true);
    } catch (error: any) {
      setUploadError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto pb-12 px-4">
      
      {/* HEADER (Konsisten dengan Kelola Lowongan & List Pelamar) */}
      <div className="flex flex-col gap-1.5 pt-2">
        <h1 className="text-3xl font-black text-stone-900 tracking-tight uppercase">Scan CV AI</h1>
        <p className="text-stone-500 font-medium">Unggah CV kandidat dan biarkan AI menganalisis kecocokan secara otomatis.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50/50 rounded-full blur-3xl -mr-32 -mt-32 opacity-70 pointer-events-none"></div>

        <form onSubmit={handleUploadCV} className="relative z-10 space-y-10 max-w-4xl mx-auto">
          
          {uploadError && (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-black uppercase tracking-widest rounded-2xl flex items-center gap-3 animate-in shake duration-300">
              <AlertCircle size={18} /> {uploadError}
            </div>
          )}

          {/* 1. PILIH LOWONGAN */}
          <div className="space-y-4">
            <label className="text-[11px] font-black text-stone-400 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
              <Briefcase size={14} className="text-blue-500" /> Posisi Pekerjaan Tujuan
            </label>
            <div className="relative group">
              <select 
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full pl-6 pr-12 py-5 bg-stone-50 hover:bg-stone-100/50 focus:bg-white border border-stone-200 rounded-2xl outline-none font-bold text-stone-800 text-sm md:text-base focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all duration-300 cursor-pointer appearance-none shadow-sm"
                disabled={isUploading}
              >
                <option value="" disabled>-- Pilih Lowongan --</option>
                {allJobs.map(job => (
                  <option key={job.job_id} value={job.job_id} className="font-bold">
                    {job.title} {job.department ? `(${job.department})` : ''} — [{getJobStatusLabel(job)}]
                  </option>
                ))}
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400 group-hover:text-blue-600 transition-colors">
                <ChevronRight size={20} className="rotate-90" />
              </div>
            </div>
          </div>

          {/* 2. UPLOAD AREA */}
          <div className="space-y-4">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[11px] font-black text-stone-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <FileText size={14} className="text-blue-500" /> Dokumen CV Pelamar
              </label>
              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-tighter flex items-center gap-1">
                <Info size={10} /> Max {MAX_FILE_SIZE_MB}MB
              </span>
            </div>
            
            <div className={`border-2 border-dashed rounded-[2rem] p-10 text-center transition-all duration-500 cursor-pointer group relative ${
              uploadFile 
                ? 'border-blue-600 bg-blue-50/30' 
                : 'border-stone-200 bg-stone-50/50 hover:border-blue-400 hover:bg-white hover:shadow-xl hover:shadow-blue-600/5'
            }`}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                disabled={isUploading}
              />
              
              <div className="relative z-10 pointer-events-none">
                <div className={`w-20 h-20 shadow-lg rounded-3xl flex items-center justify-center mx-auto mb-6 transition-all duration-500 border-4 border-white ${
                  uploadFile ? 'bg-blue-600 text-white scale-110 rotate-[360deg]' : 'bg-white text-stone-300 group-hover:text-blue-500'
                }`}>
                  {uploadFile ? <FileCheck size={32} /> : <UploadCloud size={32} />}
                </div>
                
                {uploadFile ? (
                  <div className="animate-in fade-in zoom-in-95">
                    <p className="text-lg font-black text-stone-900 mb-1 truncate px-8 max-w-full">
                      {uploadFile.name}
                    </p>
                    <p className="text-xs font-black text-blue-600 uppercase tracking-widest">
                      {(uploadFile.size / 1024 / 1024).toFixed(2)} MB • PDF Ready
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-lg font-black text-stone-800 mb-2">
                      Klik untuk Unggah atau Seret File
                    </p>
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center justify-center gap-2">
                      Hanya format .PDF diperbolehkan
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={isUploading || !uploadFile || !selectedJobId}
              className="w-full bg-stone-900 hover:bg-blue-600 disabled:bg-stone-100 disabled:text-stone-300 text-white py-6 rounded-2xl font-black transition-all duration-500 shadow-xl shadow-stone-900/10 disabled:shadow-none active:scale-[0.98] flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] group"
            >
              {isUploading ? (
                <><Loader2 size={20} className="animate-spin" /> Sedang Menganalisis...</>
              ) : (
                <>
                  <Bot size={20} className="group-hover:scale-110 transition-transform" /> 
                  Proses dengan AI
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-4">
              AI akan membaca teks, mengekstrak data, dan menghitung AI Match Score
            </p>
          </div>
        </form>
      </div>

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-stone-900/80 z-[110] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-300 border border-stone-100">
            <div className="relative mx-auto w-24 h-24 mb-8">
              <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-20"></div>
              <div className="relative w-full h-full bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                <CheckCircle2 size={48} strokeWidth={2.5} />
              </div>
            </div>
            
            <h3 className="text-3xl font-black text-stone-900 mb-3 tracking-tight">Berhasil!</h3>
            <p className="text-stone-500 font-medium text-sm mb-10 leading-relaxed">
              Kandidat telah berhasil masuk ke sistem. Hasil evaluasi AI sudah bisa dilihat sekarang.
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => router.push(`/hr/applicants?jobId=${selectedJobId}`)} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl transition-all uppercase tracking-widest text-[10px] shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 active:scale-95"
              >
                Lihat Hasil Skor <ChevronRight size={14} />
              </button>
              <button 
                onClick={() => {
                  setShowSuccessModal(false);
                  setUploadFile(null);
                }} 
                className="w-full bg-stone-100 hover:bg-stone-200 text-stone-600 font-black py-4 rounded-2xl transition-colors uppercase tracking-widest text-[10px]"
              >
                Scan CV Lainnya
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}