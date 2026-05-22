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
    <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden bg-[#FFFAF5]/20">
      <div className="shrink-0 bg-[#FFFAF5]/80 backdrop-blur-md px-4 pb-6 pt-2 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-100/50">
        <div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight uppercase">Pengaturan</h1>
          <p className="mt-1 text-stone-500 font-medium">Konfigurasi akun dan keamanan sistem.</p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-white border border-stone-200 hover:border-rose-200 text-stone-700 hover:text-rose-600 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 shadow-sm"
        >
          <LogOut size={18} strokeWidth={2.5} />
          Keluar Akun
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-10 animate-in fade-in duration-700">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 shrink-0 flex items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
                <User size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-[12px] font-black text-stone-900 uppercase tracking-[0.2em]">Informasi Akun</h2>
                <p className="mt-1 text-stone-500 text-sm font-medium">Data profil yang tersimpan untuk akses HR.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.22em] ml-1">Nama Lengkap</p>
                <div className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3.5 font-bold text-stone-700 text-sm">
                  {profileData.name}
                </div>
              </div>
              <div className="space-y-2">
                <p className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.22em] ml-1">Alamat Email</p>
                <div className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3.5 font-bold text-stone-700 text-sm break-all">
                  {profileData.email}
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <p className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.22em] ml-1">Role / Hak Akses</p>
                <div className="inline-flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2.5 font-black text-[11px] uppercase tracking-widest text-blue-700">
                  <ShieldCheck size={14} />
                  {profileData.role}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-10 animate-in fade-in duration-700">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 shrink-0 flex items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 shadow-sm">
                <Lock size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-[12px] font-black text-stone-900 uppercase tracking-[0.2em]">Keamanan & Sandi</h2>
                <p className="mt-1 text-stone-500 text-sm font-medium">Perbarui kata sandi akun HR dari halaman ini.</p>
              </div>
            </div>

            {passwordMessage && (
              <div
                className={`mb-8 rounded-2xl border px-4 py-3 text-[11px] font-black uppercase tracking-wider animate-in fade-in ${
                  passwordMessage.includes('✅')
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {passwordMessage}
              </div>
            )}

            <div className="max-w-2xl space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.22em] ml-1">Kata Sandi Baru</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3.5 font-bold text-stone-700 placeholder:text-stone-400 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.22em] ml-1">Konfirmasi Sandi Baru</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3.5 font-bold text-stone-700 placeholder:text-stone-400 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div className="pt-2 flex justify-start">
                <button
                  onClick={handleUpdatePassword}
                  disabled={isUpdatingPassword}
                  className="bg-stone-900 hover:bg-blue-600 disabled:bg-stone-300 text-white px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-stone-900/10"
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