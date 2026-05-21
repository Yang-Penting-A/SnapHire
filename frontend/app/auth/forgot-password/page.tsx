"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, AlertCircle, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { buildApiUrl } from '@/app/lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const validateForm = () => {
    if (!email) {
      setErrorMsg('Email wajib diisi');
      return false;
    }
    
    if (!email.includes('@')) {
      setErrorMsg('Format email tidak valid');
      return false;
    }

    if (!newPassword) {
      setErrorMsg('Password baru wajib diisi');
      return false;
    }

    if (newPassword.length < 8) {
      setErrorMsg('Password minimal 8 karakter');
      return false;
    }

    if (!confirmPassword) {
      setErrorMsg('Konfirmasi password wajib diisi');
      return false;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Password tidak cocok');
      return false;
    }

    return true;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(buildApiUrl('/auth/reset-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          newPassword: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal mereset password');
      }

      setSuccessMsg('Password berhasil diperbarui!');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      console.error('[RESET PASSWORD] Error:', error.message);
      setErrorMsg(error.message || 'Terjadi kesalahan saat mereset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-8 font-sans overflow-hidden">
      
      {/* FULLSCREEN BACKGROUND IMAGE */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/bg-login.png" 
          alt="Background" 
          fill 
          priority 
          className="object-cover object-center" 
        />
        <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px]"></div>
      </div>

      {/* CENTERED FORM CARD (Light Mode Glassmorphism) */}
      <div className="relative z-10 w-full max-w-[460px]">
        <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-black/10 border border-white/60 p-8 sm:p-12 animate-in zoom-in-95 duration-500">
          
          {/* HEADER / LOGO */}
          <div className="flex flex-col items-center mb-10 text-center">
            <Link href="/">
              <Image src="/SmallLogo.png" alt="Logo" width={150} height={40} className="w-auto h-9 mb-6" priority />
            </Link>
            <h1 className="text-[26px] font-black text-slate-800 tracking-tight leading-tight">
              Lupa Kata Sandi
            </h1>
            <p className="text-slate-500 font-medium text-sm mt-2">
              Perbarui kata sandi sistem admin Anda
            </p>
          </div>

          {/* ALERTS */}
          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm rounded-2xl flex items-start gap-3 animate-in fade-in">
              <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50/90 backdrop-blur-sm border border-red-100 text-red-600 text-sm rounded-2xl flex items-start gap-3 animate-in fade-in">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
            
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 ml-1">Alamat Email</label>
              <div className="relative flex items-center group">
                <Mail size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@snaphire.com" 
                  className="w-full pl-11 pr-4 py-4 bg-slate-50/80 border border-slate-200 rounded-2xl text-slate-800 font-semibold focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all placeholder:text-slate-400 placeholder:font-medium"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* New Password Input */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 ml-1">Password Baru</label>
              <div className="relative flex items-center group">
                <Lock size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 8 karakter" 
                  className="w-full pl-11 pr-12 py-4 bg-slate-50/80 border border-slate-200 rounded-2xl text-slate-800 font-semibold focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all placeholder:text-slate-400 placeholder:font-medium"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer focus:outline-none"
                  disabled={isLoading}
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 ml-1">Konfirmasi Password</label>
              <div className="relative flex items-center group">
                <Lock size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru" 
                  className="w-full pl-11 pr-12 py-4 bg-slate-50/80 border border-slate-200 rounded-2xl text-slate-800 font-semibold focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all placeholder:text-slate-400 placeholder:font-medium"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer focus:outline-none"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>

            {/* Reset Button */}
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full mt-4 bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-600/20 disabled:bg-blue-400 flex justify-center items-center gap-2 text-[15px]"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
              {isLoading ? 'Memproses...' : 'Reset Password'}
            </button>
          </form>

          {/* Footer Link */}
          <p className="text-center text-[13px] text-slate-500 font-medium mt-8">
            Ingat passwordnya?{' '}
            <Link href="/login" className="text-blue-600 font-bold hover:underline">Kembali ke Login</Link>
          </p>

        </div>
      </div>

    </div>
  );
}