"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import { 
  Lock, LogOut, Loader2, User, ShieldCheck
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
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setPasswordMessage(`❌ Gagal update: ${error.message}`);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="text-blue-600 animate-spin" />
        <p className="text-stone-400 font-black uppercase tracking-widest text-[10px]">Memuat Pengaturan...</p>
      </div>
    );
  }

  return (
    // Parent Container: No-scroll global, fixed height layout
    <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden">
      
      {/* =========================================
          FIXED HEADER (Identik dengan List Pelamar)
          ========================================= */}
      <div className="shrink-0 bg-[#FFFAF5]/80 backdrop-blur-md px-4 pb-6 pt-2 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-100/50">
        <div>
          <h1 className="text-4xl font-black text-stone-900 tracking-tight uppercase">Pengaturan</h1>
          <p className="text-stone-500 font-medium">Konfigurasi akun dan keamanan sistem.</p>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-5 py-3 bg-white border border-rose-100 text-rose-600 hover:bg-rose-50 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-sm"
        >
          <LogOut size={16} strokeWidth={2.5} /> Keluar Akun
        </button>
      </div>

      {/* =========================================
          CONTENT AREA (No Internal Scroll / Fixed)
          ========================================= */}
      <div className="flex-1 px-4 py-8">
        
        <div className="max-w-3xl space-y-6"> {/* max-w-3xl supaya lebih compact */}
          
          {/* 1. INFORMASI AKUN */}
          <div className="bg-white rounded-[2rem] p-7 border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <User size={20} strokeWidth={2.5} />
              </div>
              <h2 className="text-lg font-black text-stone-900 uppercase tracking-tight">Informasi Akun</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <p className="text-[9px] font-black text-stone-400 uppercase tracking-[0.2em] ml-1">Nama Lengkap</p>
                <div className="font-bold text-stone-800 bg-stone-50/50 px-4 py-3 rounded-xl border border-stone-100 text-sm">
                  {profileData.name}
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-[9px] font-black text-stone-400 uppercase tracking-[0.2em] ml-1">Alamat Email</p>
                <div className="font-bold text-stone-800 bg-stone-50/50 px-4 py-3 rounded-xl border border-stone-100 text-sm">
                  {profileData.email}
                </div>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <p className="text-[9px] font-black text-stone-400 uppercase tracking-[0.2em] ml-1">Role / Hak Akses</p>
                <div className="inline-flex items-center gap-2 font-black text-blue-700 bg-blue-50/50 px-4 py-2.5 rounded-xl border border-blue-100 text-[10px] uppercase">
                  <ShieldCheck size={14} /> {profileData.role}
                </div>
              </div>
            </div>
          </div>

          {/* 2. GANTI PASSWORD */}
          <div className="bg-white rounded-[2rem] p-7 border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Lock size={20} strokeWidth={2.5} />
              </div>
              <h2 className="text-lg font-black text-stone-900 uppercase tracking-tight">Keamanan & Sandi</h2>
            </div>

            {passwordMessage && (
              <div className={`mb-6 p-3 rounded-xl text-[10px] font-black uppercase tracking-wider border animate-in fade-in ${
                passwordMessage.includes('✅') 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {passwordMessage}
              </div>
            )}

            <div className="max-w-md space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-stone-400 uppercase tracking-[0.2em] ml-1">Kata Sandi Baru</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-stone-400 uppercase tracking-[0.2em] ml-1">Konfirmasi Sandi Baru</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm"
                />
              </div>
              <div className="flex justify-start pt-2">
                <button 
                  onClick={handleUpdatePassword}
                  disabled={isUpdatingPassword}
                  className="bg-stone-900 hover:bg-blue-600 disabled:bg-stone-300 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2"
                >
                  {isUpdatingPassword ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                  {isUpdatingPassword ? 'Memproses...' : 'Perbarui Kata Sandi'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}