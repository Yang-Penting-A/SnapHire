"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Kata sandi dan konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsLoading(true);

    try {
      // Signup ke Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) throw error;

      // Catat ke Activity Logs setelah signup berhasil
      const userId = data.user?.id;
      if (userId) {
        const { error: logError } = await supabase
          .from('activity_logs')
          .insert({
            user_id: userId,
            activity: `SYSTEM: Akun user telah dibuat (${fullName})`
          });

        // Log error jika insert gagal 
        if (logError) {
          console.warn('Gagal mencatat activity log:', logError.message);
        } else {
          console.log('[REGISTER] Activity log recorded for new user:', email);
        }
      }

      alert('Registrasi berhasil! Silakan login.');
      router.push('/login');
      
    } catch (error: any) {
      console.error('[REGISTER] Error:', error.message);
      setErrorMsg(error.message || 'Terjadi kesalahan saat registrasi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-12 items-center">
        
        <div className="hidden md:flex flex-col items-center justify-center w-full">
          <div className="relative w-full max-w-[550px] aspect-square flex items-center justify-center">
            <Image 
              src="/ilustrasi.png" 
              alt="Ilustrasi Daftar" 
              fill priority 
              className="object-contain" />
          </div>
        </div>

        <div className="w-full max-w-md mx-auto">
          <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sm:p-10">
            
            <div className="flex flex-col items-center mb-8">
              <Link href="/">
                <Image 
                  src="/SmallLogo.png" 
                  alt="SnapHire Logo" 
                  width={150}
                  height={40} 
                  className="w-auto h-8 mb-3 cursor-pointer"
                  priority />
              </Link>
              <p className="text-slate-500 text-sm font-medium">Buat akun Kandidat baru</p>
            </div>

            {errorMsg && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl text-center font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleRegister} className="flex flex-col gap-5">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-800">Nama Lengkap</label>
                <input 
                  type="text" 
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Sesuai KTP / Identitas" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-800">Alamat Email</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contoh@email.com" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-800">Kata Sandi</label>
                <input 
                  type="password" 
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-800">Konfirmasi Kata Sandi</label>
                <input 
                  type="password" 
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-xl hover:bg-blue-700 transition-colors mt-2 shadow-lg shadow-blue-600/20 disabled:bg-blue-400 disabled:cursor-not-allowed flex justify-center items-center"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Daftar'
                )}
              </button>

            </form>

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-slate-200"></div>
              <span className="text-xs font-semibold text-slate-400 tracking-wider">ATAU</span>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>

            <p className="text-center text-sm text-slate-500 mt-4">
              Sudah punya akun? <Link href="/login" className="text-blue-600 font-bold hover:underline">Masuk di sini</Link>
            </p>

          </div>
        </div>

      </div>
    </div>
  );
}