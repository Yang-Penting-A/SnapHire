"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

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
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${backendUrl}/auth/reset-password`, {
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
    <div className="min-h-screen bg-[#F4F7FE] flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/5 border border-white p-8 sm:p-10 animate-in fade-in duration-500">
          
          <div className="flex flex-col items-center mb-10 text-center">
            <Link href="/">
              <Image src="/SmallLogo.png" alt="Logo" width={150} height={40} className="w-auto h-9 mb-4" priority />
            </Link>
            <h1 className="text-xl font-black text-stone-900 tracking-tight">Lupa Kata Sandi</h1>
            <div className="h-1.5 w-10 bg-blue-600 rounded-full mt-3"></div>
          </div>

          {successMsg && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm rounded-r-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
              <AlertCircle size={18} className="shrink-0" />
              <span className="font-bold">{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
              <AlertCircle size={18} className="shrink-0" />
              <span className="font-bold">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleResetPassword} className="flex flex-col gap-6">
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-stone-800 flex items-center gap-2">
                <Mail size={14} className="text-blue-600" /> Alamat Email
              </label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@snaphire.com" 
                className="w-full px-5 py-4 rounded-2xl border border-stone-200 text-stone-900 font-bold focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all placeholder:text-stone-300"
                disabled={isLoading}
              />
            </div>

            {/* New Password Input */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-stone-800 flex items-center gap-2">
                <Lock size={14} className="text-blue-600" /> Password Baru
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 8 karakter" 
                  className="w-full px-5 py-4 pr-14 rounded-2xl border border-stone-200 text-stone-900 font-bold focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all placeholder:text-stone-300"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-700 transition-colors p-1 cursor-pointer disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <Eye size={20} className="stroke-[1.5]" />
                  ) : (
                    <EyeOff size={20} className="stroke-[1.5]" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-stone-800 flex items-center gap-2">
                <Lock size={14} className="text-blue-600" /> Konfirmasi Password
              </label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Konfirmasi password" 
                  className="w-full px-5 py-4 pr-14 rounded-2xl border border-stone-200 text-stone-900 font-bold focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all placeholder:text-stone-300"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-700 transition-colors p-1 cursor-pointer disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <Eye size={20} className="stroke-[1.5]" />
                  ) : (
                    <EyeOff size={20} className="stroke-[1.5]" />
                  )}
                </button>
              </div>
            </div>

            {/* Reset Password Button */}
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 active:scale-[0.98] transition-all mt-2 shadow-xl shadow-blue-600/25 disabled:bg-blue-400 flex justify-center items-center gap-2 text-lg"
            >
              {isLoading ? <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div> : 'Reset Password'}
            </button>
          </form>

          {/* Back to Login Link */}
          <div className="text-center mt-8">
            <p className="text-stone-600 text-sm">
              Ingat passwordnya?{' '}
              <Link
                href="/login"
                className="text-blue-600 hover:underline font-bold transition"
              >
                Kembali ke Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
