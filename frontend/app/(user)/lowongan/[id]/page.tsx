"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase"; 
import { useParams } from "next/navigation"; 
import Link from "next/link";
// Jangan lupa import icon-nya!
import { Rocket, FileText } from "lucide-react"; 

interface JobDetail {
  job_id: string;
  title: string;
  description: string;
  requirement: string;
  status_job: string;
}

export default function DetailLowongan() {
  const params = useParams();
  const id = params.id; 

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  
  // STATE BUAT MODAL POP-UP
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchJobDetail = async () => {
      const { data, error } = await supabase
        .from("Job") 
        .select("*")
        .eq("job_id", id) 
        .single(); 

      if (error) {
        console.error("Waduh error narik detail:", error.message);
      } else {
        setJob(data);
      }
      setLoading(false);
    };

    fetchJobDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <p className="text-gray-500 animate-pulse text-xl font-semibold">Memuat detail lowongan...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800">Lowongan tidak ditemukan</h1>
        <Link href="/lowongan">
          <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Kembali ke Daftar Lowongan</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8 relative">
      {/* Header Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
          <p className="text-gray-500 mb-4">Departemen Desain Produk • Status: {job.status_job}</p>
          
          <div className="flex gap-2">
            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">Hybrid</span>
            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">Yogyakarta</span>
            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">Full-time</span>
          </div>
        </div>
        
        {/* TOMBOL LAMAR SEKARANG BUKA MODAL */}
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg w-full md:w-auto"
        >
          Lamar Posisi Ini
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kolom Kiri: Deskripsi & Kualifikasi */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 border-b pb-4 mb-6">Deskripsi Pekerjaan</h2>
          <div className="text-gray-600 whitespace-pre-wrap leading-relaxed mb-8">
            {job.description}
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-4">Kualifikasi Minimum</h2>
          <div className="text-gray-600 whitespace-pre-wrap leading-relaxed">
            {job.requirement}
          </div>
        </div>

        {/* Kolom Kanan: Ringkasan Sidebar */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm h-fit">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-4 mb-6">Ringkasan Lowongan</h2>
          
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Status</p>
              <p className="text-gray-900 font-medium">{job.status_job}</p>
            </div>
            
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Rentang Gaji</p>
              <p className="text-gray-900 font-medium">Dirahasiakan</p>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Pengalaman</p>
              <p className="text-gray-900 font-medium">1 - 3 Tahun (Junior/Mid)</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* MODAL POP-UP KONFIRMASI */}
      {/* ========================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header Modal */}
            <div className="bg-blue-50 p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 text-[#1C5bcf] rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Rocket size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Siap mengirimkan lamaran?</h3>
            </div>

            {/* Body Modal */}
            <div className="p-6">
              <p className="text-gray-600 text-center mb-8 text-sm leading-relaxed">
                Hai! Sebelum melanjutkan, pastikan profil dan CV utamamu sudah yang paling <span className="font-semibold text-gray-900">up-to-date</span> ya. Kalau semuanya sudah sesuai, yuk langsung kirim lamaranmu!
              </p>

              <div className="flex flex-col gap-3">
                {/* TOMBOL 1: Lanjut Apply (Bawa job_id nya) */}
                <Link 
                  href={`/lowongan/${job.job_id}/apply`}
                  className="w-full py-3 bg-[#1C5bcf] text-white font-medium rounded-xl hover:bg-blue-700 transition text-center shadow-md shadow-blue-200"
                >
                  Lanjut lamar yuk!
                </Link>

                {/* TOMBOL 2: Update CV */}
                <Link 
                  href="/profil/upload-cv"
                  className="w-full py-3 bg-white border-2 border-gray-100 text-[#1C5bcf] font-medium rounded-xl hover:bg-blue-50 hover:border-blue-100 transition text-center flex items-center justify-center gap-2"
                >
                  <FileText size={18} />
                  Cek CV dulu yuk!
                </Link>

                {/* TOMBOL 3: Batal */}
                <button 
                  onClick={() => setShowModal(false)}
                  className="w-full py-2.5 text-gray-400 font-medium rounded-xl hover:text-gray-600 transition text-center mt-2 text-sm"
                >
                  Nanti dulu deh
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}