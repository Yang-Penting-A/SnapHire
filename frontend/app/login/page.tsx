"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { Mail, Lock, LogIn, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  
  // STATE hasActiveSession dan activeUser DIHAPUS karena udah ngga pakai page session aktif

  // LOGIC BARU: CHECK SESSION YANG LEBIH STABIL & AUTO-REDIRECT
  useEffect(() => {
    // Check for error in URL parameters
    const error = searchParams.get('error');
    if (error) {
      const errorMessages: Record<string, string> = {
        'unauthorized': 'Email Anda belum terdaftar. Hubungi administrator untuk didaftarkan.',
        'invalid_domain': 'Hanya email @mail.ugm.ac.id yang diizinkan.',
        'invalid_role': 'Akun Anda tidak memiliki akses ke sistem ini.',
      };
      setErrorMsg(errorMessages[error] || 'Terjadi kesalahan saat login. Silahkan coba lagi.');
    }

    const checkExistingSession = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          // Cross-check ke Supabase biar stabil (ngecek tokennya udah expired atau belum)
          const { data: sessionData } = await supabase.auth.getSession();
          
          if (sessionData?.session) {
            const userData = JSON.parse(storedUser);
            console.log('[LOGIN] ✅ Active session found, redirecting...');
            
            // Redirect berdasarkan role
            const role = userData.role?.toLowerCase();
            if (role === 'admin') {
              router.push('/admin');
            } else if (role === 'hr') {
              router.push('/hr');
            } else {
              // Invalid role - sign out dan redirect to login
              console.warn('[LOGIN] Invalid role:', userData.role);
              await supabase.auth.signOut();
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              router.push('/login');
            }
            return; // Stop render form login
          } else {
            // Kalau di localStorage ada tapi di Supabase expired, bersihin!
            console.log('[LOGIN] ❌ Session expired in Supabase, clearing local storage.');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } catch (err) {
          console.log('[LOGIN] Invalid stored user data');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setIsCheckingSession(false);
    };

    checkExistingSession();
  }, [router]);

  // Detect logout/login di tab lain
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'token' && !event.newValue) {
        window.location.href = '/login';
      }
      if (event.key === 'user' && event.newValue !== event.oldValue) {
        window.location.href = '/login';
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Handle Google OAuth Login
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            hd: 'ugm.ac.id', // Only allow UGM domain
          }
        }
      });

      if (error) throw error;
      console.log('[GOOGLE LOGIN] ✅ OAuth initiated:', data);
    } catch (error: any) {
      console.error('[GOOGLE LOGIN] Error:', error.message);
      setErrorMsg(error.message || 'Gagal memulai login dengan Google. Silahkan coba lagi.');
      setIsGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (authError) throw authError;

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session?.access_token) {
        throw new Error('Gagal mendapatkan token dari Supabase');
      }

      const token = sessionData.session.access_token;

      // Backend verify token
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${backendUrl}/login`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const loginData = await response.json();
      const userData = loginData.data;

      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
      }

      // catat activity log
      const { error: logError } = await supabase.from('activity_logs').insert({
        user_id: authData.user.id,
        activity: `LOGIN: ${userData?.name || 'User'} masuk sebagai ${userData?.role || 'user'}`
      });

      if (logError) console.error("Gagal mencatat log:", logError.message);

      const role = userData?.role?.toLowerCase();
      router.refresh();

      if (role === 'admin') {
        router.push('/admin');
      } else if (role === 'hr') {
        router.push('/hr');
      } else {
        router.push('/dashboard');
      }

    } catch (error: any) {
      console.error('[LOGIN] Error:', error.message);
      setErrorMsg(error.message || 'Email atau Password salah.');
    } finally {
      setIsLoading(false);
    }
  };

  // loading state
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-[#F4F7FE] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone-600 font-medium">Checking session...</p>
        </div>
      </div>
    );
  }

  // BLOK IF (hasActiveSession) UDAH DIHAPUS TOTAL DI SINI

  // view saat belum ada session, tampilkan form login
  return (
    <div className="min-h-screen bg-[#F4F7FE] flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-12 items-center">
        
        {/* ILUSTRASI SISI KIRI */}
        <div className="hidden md:flex flex-col items-center justify-center w-full">
          <div className="relative w-full max-w-[500px] aspect-square">
            <Image 
              src="/ilustrasi.png" 
              alt="Ilustrasi Login" 
              fill priority 
              className="object-contain drop-shadow-2xl" 
            />
          </div>
          <div className="mt-8 text-center px-6">
            <h2 className="text-2xl font-black text-stone-800 tracking-tight">Cepat. Tepat. Transparan.</h2>
            <p className="text-stone-500 mt-2 font-medium">Platform HR automation paling cerdas untuk tim kamu.</p>
          </div>
        </div>

        {/* FORM SISI KANAN */}
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/5 border border-white p-8 sm:p-10 animate-in fade-in duration-500">
            
            <div className="flex flex-col items-center mb-10 text-center">
              <Link href="/">
                <Image src="/SmallLogo.png" alt="Logo" width={150} height={40} className="w-auto h-9 mb-4" priority />
              </Link>
              <h1 className="text-xl font-black text-stone-900 tracking-tight">Selamat datang kembali</h1>
              <div className="h-1.5 w-10 bg-blue-600 rounded-full mt-3"></div>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                <AlertCircle size={18} className="shrink-0" />
                <span className="font-bold">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="flex flex-col gap-6">
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
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-stone-800 flex items-center gap-2">
                    <Lock size={14} className="text-blue-600" /> Kata Sandi
                  </label>
                  {/* Link lupa sandi udah gw benerin sekalian arahin ke /reset-password */}
                  <button type="button" onClick={() => router.push('/reset-password')} className="text-xs font-bold text-blue-600 hover:underline">
                    Lupa sandi?
                  </button>
                </div>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full px-5 py-4 rounded-2xl border border-stone-200 text-stone-900 font-bold focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all placeholder:text-stone-300"
                />
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-blue-600 text-white font-black py-4.5 rounded-2xl hover:bg-blue-700 active:scale-[0.98] transition-all mt-2 shadow-xl shadow-blue-600/25 disabled:bg-blue-400 flex justify-center items-center gap-2 text-lg"
              >
                {isLoading ? <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div> : <><LogIn size={20} /> Masuk Sekarang</>}
              </button>
            </form>

            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-stone-100"></div>
              <span className="text-[10px] font-black text-stone-300 tracking-[0.2em]">ATAU</span>
              <div className="flex-1 h-px bg-stone-100"></div>
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isLoading}
              className="w-full bg-white border-2 border-stone-200 text-stone-700 font-bold py-4 rounded-2xl hover:border-blue-600 hover:bg-blue-50 active:scale-[0.98] transition-all shadow-md flex justify-center items-center gap-3 mb-6"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin text-blue-600" />
                  <span>Redirecting...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>Login dengan Google</span>
                </>
              )}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}