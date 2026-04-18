"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import Link from "next/link";

export default function ApplyJobPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [jobTitle, setJobTitle] = useState("Memuat Posisi...");
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    portfolioLink: "",
    coverLetter: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tarik nama lowongan berdasarkan Job ID
  useEffect(() => {
    const fetchJobTitle = async () => {
      const { data } = await supabase
        .from("Job")
        .select("title")
        .eq("job_id", jobId)
        .single();
      
      if (data) setJobTitle(data.title);
    };
    if (jobId) fetchJobTitle();
  }, [jobId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
      } else {
        alert("Formatnya harus PDF ya!");
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert("Upload CV dulu ya!");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Simulasi proses upload file ke Storage & Insert ke tabel Application
      // (Di project asli, lu upload 'file' ke Supabase Storage dulu dapet URL)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Belum login!");

      // 2. Tarik Candidate ID berdasarkan user yang login
      const { data: candidateData } = await supabase
        .from("Candidate")
        .select("candidate_id")
        .eq("user_id", user.id)
        .single();

      // 3. Insert lamaran ke tabel Application
      const { error } = await supabase
        .from("Application")
        .insert([{
            job_id: jobId,
            candidate_id: candidateData?.candidate_id,
            status_application: "Screening AI", // Default status
            ai_rank: 0,
            // IDEALNYA: ada kolom buat nyimpen Cover Letter & URL CV di tabel Application lu
        }]);

      if (error) throw error;

      alert("Lamaran berhasil dikirim!");
      router.push("/dashboard");

    } catch (error: any) {
      console.error("Gagal ngirim lamaran:", error.message);
      alert("Gagal ngirim lamaran!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 bg-[#FAFAFA] min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 uppercase tracking-wide">
        {jobTitle}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
        
        {/* BAGIAN 1: UPLOAD CV */}
        <div className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-4">1. Upload CV-mu</h2>
          
          <div className="relative border-2 border-dashed border-[#1C5bcf] bg-[#EAEFF6] rounded-xl p-10 flex flex-col items-center justify-center transition-colors">
            <input 
              type="file" 
              accept=".pdf"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              required
            />
            
            {!file ? (
              <div className="text-center pointer-events-none">
                <p className="text-gray-900 font-bold mb-1">Upload File CV</p>
                <p className="text-gray-500 text-sm mb-4">Upload CV dengan format: PDF, Max 5MB.</p>
                <button type="button" className="bg-[#D3E1F5] text-[#1C5bcf] font-medium px-6 py-2 rounded-lg text-sm pointer-events-none">
                  Browse
                </button>
              </div>
            ) : (
              <div className="text-center z-20">
                <p className="text-[#1C5bcf] font-bold text-lg mb-1">{file.name}</p>
                <p className="text-gray-500 text-sm">Klik area ini untuk mengganti file</p>
              </div>
            )}
          </div>
        </div>

        {/* BAGIAN 2: ISI (Link & Cover Letter) */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">2. Isi</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Link Portofolio / GitHub</label>
              <input
                type="text"
                name="portfolioLink"
                value={formData.portfolioLink}
                onChange={handleChange}
                placeholder="https://dribbble.com/username"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Pesan Singkat (Cover Letter)</label>
              <textarea
                name="coverLetter"
                value={formData.coverLetter}
                onChange={handleChange}
                rows={4}
                placeholder="Lorem ipsum dolor sit amet consectetur..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>
        </div>

        <hr className="border-gray-200 my-8" />

        {/* ACTION BUTTONS */}
        <div className="flex justify-end gap-4">
          <button 
            type="button"
            onClick={() => router.back()}
            className="px-8 py-2.5 bg-[#EAEFF6] text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
          >
            Batal
          </button>
          <button 
            type="submit"
            disabled={!file || isSubmitting}
            className="px-8 py-2.5 bg-[#1C5bcf] text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Mengirim..." : "Kirim"}
          </button>
        </div>

      </form>
    </div>
  );
}