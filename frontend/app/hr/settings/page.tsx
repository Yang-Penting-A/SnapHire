"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import { 
  Lock, LogOut, Loader2, User, Briefcase
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  
  // State Data Profil
  const [profileData, setProfileData] = useState({ name: '', email: '', role: '' });

  // State buat Update Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');

  useEffect(() => {
    const loadUserData = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setProfileData({
            name: userData.name || 'HR Admin',
            email: userData.email || 'hr@snaphire.com',
            role: userData.role?.toUpperCase() || 'HR'
          });
        } catch (error) {
          console.error("Gagal parse data user", error);
        }
      }
      setIsLoading(false);
    };
    loadUserData();
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    await supabase.auth.signOut();
    router.push('/login');
  };

  // FUNGSI BUAT BENERAN UPDATE PASSWORD KE SUPABASE
  const handleUpdatePassword = async () => {
    setPasswordMessage('');

    if (!newPassword || !confirmPassword) {
      setPasswordMessage('❌ Harap isi kedua kolom password!');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage('❌ Konfirmasi password tidak cocok!');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setPasswordMessage('✅ Kata sandi berhasil diperbarui!');
      setNewPassword(''); // Kosongin inputan lagi
      setConfirmPassword('');
      
    } catch (error: any) {
      setPasswordMessage(`❌ Gagal update: ${error.message}`);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="text-blue-600 animate-spin" />
        <p className="text-stone-400 font-black uppercase tracking-widest text-xs">Memuat Pengaturan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-3xl mx-auto pb-10">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight uppercase">Pengaturan</h1>
          <p className="text-stone-500 font-medium mt-1">Konfigurasi akun dan keamanan sistem.</p>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors border border-rose-100"
        >
          <LogOut size={16} /> Keluar
        </button>
      </div>

      <div className="space-y-6">
        
        {/* 1. INFORMASI AKUN (READ ONLY) */}
        <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-stone-100">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><User size={24} /></div>
            <div>
              <h2 className="text-xl font-black text-stone-900">Informasi Akun</h2>
              <p className="text-sm font-medium text-stone-500">Data profil internal Anda (Tidak dapat diubah).</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Nama Lengkap</p>
              <p className="font-bold text-stone-800 bg-stone-50 px-4 py-3 rounded-xl border border-stone-100">{profileData.name}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Alamat Email</p>
              <p className="font-bold text-stone-800 bg-stone-50 px-4 py-3 rounded-xl border border-stone-100">{profileData.email}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Role / Hak Akses</p>
              <div className="inline-flex items-center gap-2 font-black text-blue-700 bg-blue-50 px-4 py-3 rounded-xl border border-blue-100">
                <Briefcase size={16} /> {profileData.role}
              </div>
            </div>
          </div>
        </div>

        {/* 2. GANTI PASSWORD */}
        <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-stone-100">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Lock size={24} /></div>
            <div>
              <h2 className="text-xl font-black text-stone-900">Keamanan & Sandi</h2>
              <p className="text-sm font-medium text-stone-500">Perbarui kata sandi Anda secara berkala.</p>
            </div>
          </div>

          {/* Munculin pesan sukses atau error di sini */}
          {passwordMessage && (
            <div className={`mb-4 p-3 rounded-xl text-sm font-bold border ${
              passwordMessage.includes('✅') 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {passwordMessage}
            </div>
          )}

          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Kata Sandi Baru</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl font-bold text-stone-700 focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Konfirmasi Sandi Baru</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl font-bold text-stone-700 focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
            <div className="flex justify-end pt-2">
              <button 
                onClick={handleUpdatePassword}
                disabled={isUpdatingPassword}
                className="bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white px-6 py-3 rounded-xl font-black text-sm transition-all active:scale-95 flex items-center gap-2"
              >
                {isUpdatingPassword ? <Loader2 size={16} className="animate-spin" /> : null}
                {isUpdatingPassword ? 'Memproses...' : 'Update Sandi'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}