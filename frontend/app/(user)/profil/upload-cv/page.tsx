"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import { UploadCloud, FileText, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function UploadCVProfilPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Nangkep file pas user milih PDF
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg("");
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validasi tipe file
      if (selectedFile.type !== "application/pdf") {
        setErrorMsg("Format file harus PDF ya cuy!");
        return;
      }
      
      // Validasi ukuran (Max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setErrorMsg("Ukuran file maksimal 5MB!");
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleSaveCV = async () => {
    if (!file) {
      setErrorMsg("Pilih file CV-nya dulu dong!");
      return;
    }

    setIsUploading(true);
    setErrorMsg("");

    try {
      // 1. Ambil data User yang lagi login
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Gagal mengambil data user. Coba login ulang.");

      // Ambil user_id dari tabel User kita
      const { data: userData } = await supabase
        .from("User")
        .select("user_id")
        .eq("email", user.email)
        .single();

      if (!userData) throw new Error("Data user tidak ditemukan di database.");

      // 2. Upload file ke Supabase Storage (Bucket: dokumen_cv)
      const fileExt = file.name.split('.').pop();
      const fileName = `cv-utama-${userData.user_id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("dokumen_cv")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw new Error("Gagal mengunggah file ke Storage.");

      // 3. Dapatkan Public URL
      const { data: publicUrlData } = supabase.storage
        .from("dokumen_cv")
        .getPublicUrl(fileName);
      
      const publicUrl = publicUrlData.publicUrl;

      // 4. Update / Insert URL ke tabel Candidate
      // Cek dulu apakah dia udah punya record di Candidate
      const { data: existingCandidate } = await supabase
        .from("Candidate")
        .select("candidate_id")
        .eq("user_id", userData.user_id)
        .single();

      if (existingCandidate) {
        // Kalo ada, tinggal update kolom cv_url
        const { error: updateError } = await supabase
          .from("Candidate")
          .update({ cv_url: publicUrl })
          .eq("user_id", userData.user_id);
          
        if (updateError) throw updateError;
      } else {
        // Kalo belum ada record candidate sama sekali, bikin baru
        const { error: insertError } = await supabase
          .from("Candidate")
          .insert([{ user_id: userData.user_id, cv_url: publicUrl }]);
          
        if (insertError) throw insertError;
      }

      // 5. Kalo sukses, balik ke halaman Profil
      alert("CV Utama berhasil diperbarui!");
      router.push("/profil");
      
    } catch (err: any) {
      console.error("Error upload CV:", err);
      setErrorMsg(err.message || "Terjadi kesalahan saat menyimpan CV.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        
        {/* Header Sederhana */}
        <div className="mb-8">
          <Link href="/profil" className="inline-flex items-center text-gray-500 hover:text-blue-600 transition mb-4 text-sm font-medium">
            <ArrowLeft size={16} className="mr-2" /> Kembali ke Profil
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Perbarui CV Utama</h1>
          <p className="text-gray-500 mt-1 text-sm">
            CV ini akan digunakan sebagai lampiran default setiap kali kamu melamar pekerjaan.
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">1. Upload Dokumen CV</h2>
          
          {/* Area Dropzone File */}
          <div className="relative border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/50 rounded-xl p-10 flex flex-col items-center justify-center transition-colors mb-4">
            <input 
              type="file" 
              accept=".pdf"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              disabled={isUploading}
            />
            
            {!file ? (
              <div className="text-center pointer-events-none">
                <UploadCloud size={40} className="text-[#1C5bcf] mx-auto mb-3" />
                <p className="text-gray-900 font-bold mb-1">Klik atau seret file CV ke sini</p>
                <p className="text-gray-500 text-sm">Upload CV dengan format: PDF, Max 5MB.</p>
                <div className="mt-4 inline-block px-4 py-2 bg-blue-100 text-blue-700 font-medium rounded-lg text-sm">
                  Browse File
                </div>
              </div>
            ) : (
              <div className="text-center z-20">
                <FileText size={40} className="text-[#1C5bcf] mx-auto mb-3" />
                <p className="text-blue-700 font-bold text-lg mb-1">{file.name}</p>
                <p className="text-gray-500 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <p className="text-[#1C5bcf] text-sm mt-3 underline cursor-pointer pointer-events-none">Pilih file lain untuk mengganti</p>
              </div>
            )}
          </div>

          {/* Pesan Error Kalo Ada */}
          {errorMsg && (
            <div className="p-3 mb-6 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
              {errorMsg}
            </div>
          )}

          <hr className="border-gray-100 my-8" />

          {/* Tombol Aksi */}
          <div className="flex justify-end gap-3">
            <Link 
              href="/profil"
              className="px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition text-sm"
            >
              Batal
            </Link>
            <button 
              onClick={handleSaveCV}
              disabled={isUploading}
              className="px-6 py-2.5 bg-[#1C5bcf] text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isUploading && <Loader2 size={16} className="animate-spin" />}
              {isUploading ? "Menyimpan..." : "Simpan CV Utama"}
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
}