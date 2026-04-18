"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase"; // Sesuaikan path kalo beda
import { User, Mail, Phone, MapPin, Edit2, Save, X, FileText, Loader2 } from "lucide-react";

export default function ProfilPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // State buat nyimpen data form
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "", // Kalo di ERD lu belum ada kolom phone, biarin aja jadi pemanis UI dulu
    address: "", // Sama kayak phone
    bio: "",
  });

  // Tarik data pas halaman dibuka
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user?.email) {
          const { data, error } = await supabase
            .from("User") // Pake U gede sesuai ERD
            .select("*")
            .eq("email", user.email)
            .single();

          if (data) {
            setFormData({
              name: data.name || "",
              email: data.email || user.email,
              // Fallback string kosong kalo kolomnya belum ada di database
              phone: data.phone || "", 
              address: data.address || "",
              bio: data.bio || "",
            });
          } else {
            setFormData((prev) => ({ ...prev, email: user.email || "" }));
          }
        }
      } catch (err) {
        console.error("Gagal narik profil:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Fungsi buat nyimpen data ke Supabase
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) throw new Error("Belum login!");

      // Update data di tabel User
      // Note: Pastiin kolom phone, address, bio udah dibikin temen lu di DB.
      // Kalo belum, hapus aja properti itu di bawah ini, sisain 'name' doang.
      const { error } = await supabase
        .from("User")
        .update({
          name: formData.name,
          // phone: formData.phone,
          // address: formData.address,
          // bio: formData.bio
        })
        .eq("email", user.email);

      if (error) throw error;
      
      setIsEditing(false);
      alert("Profil berhasil diupdate cuy!");
      
      // Reload halaman biar nama di Navbar ikutan ke-update
      window.location.reload(); 
    } catch (err: any) {
      console.error("Gagal nyimpen:", err.message);
      alert("Gagal nyimpen data! Cek console.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="animate-spin text-blue-600 h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-500">
      
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Profil Saya</h1>
          <p className="text-gray-500 mt-1">Kelola informasi pribadi dan CV utama kamu di sini.</p>
        </div>
        
        {/* Tombol Toggle Edit / Save */}
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Edit2 size={18} /> Edit Profil
          </button>
        ) : (
          <div className="flex gap-3">
            <button 
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              <X size={18} /> Batal
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:bg-blue-400"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Simpan
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Sidebar Kiri: Foto Profil & CV Default */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col items-center text-center">
            <div className="w-32 h-32 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-5xl font-bold mb-4 border-4 border-white shadow-lg">
              {formData.name ? formData.name.charAt(0).toUpperCase() : "U"}
            </div>
            <h2 className="text-xl font-bold text-gray-900">{formData.name || "Nama Belum Diisi"}</h2>
            <p className="text-gray-500 text-sm mb-4">Kandidat</p>
          </div>

          {/* Bagian Dokumen (Opsional buat pemanis UI) */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={18} className="text-blue-600" /> CV Utama
            </h3>
            <p className="text-sm text-gray-500 mb-4">CV ini akan digunakan sebagai default saat melamar.</p>
            <button className="w-full py-2 px-4 border border-dashed border-blue-400 text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition-colors text-sm">
              <Link 
                    href="/profil/upload-cv" 
                    className="block w-full text-center py-2 border border-[#1C5bcf] text-[#1C5bcf] font-medium rounded-lg hover:bg-blue-50 text-sm transition">
                    + Upload CV Baru
                </Link>
            </button>
          </div>
        </div>

        {/* Form Sebelah Kanan */}
        <div className="md:col-span-2 bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Informasi Pribadi</h3>
          
          <div className="space-y-5">
            {/* Nama Lengkap */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                <User size={16} className="text-gray-400" /> Nama Lengkap
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600 transition-colors"
                placeholder="Masukkan nama lengkap"
              />
            </div>

            {/* Email (Biasanya ga bisa diedit karena nyambung auth) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                <Mail size={16} className="text-gray-400" /> Email Akun
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled={true} // Email dilock
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Email tidak dapat diubah karena terikat dengan akun.</p>
            </div>

            {/* Nomor HP */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                <Phone size={16} className="text-gray-400" /> Nomor Handphone
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600 transition-colors"
                placeholder="Contoh: 08123456789"
              />
            </div>

            {/* Domisili / Alamat */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                <MapPin size={16} className="text-gray-400" /> Domisili
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600 transition-colors"
                placeholder="Contoh: Jakarta Selatan"
              />
            </div>

            {/* Bio / Tentang Saya */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Tentang Saya (Bio)
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                disabled={!isEditing}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600 transition-colors resize-none"
                placeholder="Ceritakan singkat tentang diri kamu, pengalaman, dan keahlianmu..."
              />
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}