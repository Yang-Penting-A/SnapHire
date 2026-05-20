"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { Mail, Lock, LogIn, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import sessionManager from '../lib/sessionManager';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // LOGIC BARU: CHECK SESSION YANG LEBIH STABIL & AUTO-REDIRECT
  useEffect(() => {
    // Check for error in URL parameters
    const error = searchParams.get('error');
    if (error) {
      const errorMessages: Record<string, string> = {
        'unauthorized': 'Email Anda belum terdaftar. Hubungi administrator untuk didaftarkan.',
        'invalid_role': 'Akun Anda tidak memiliki akses ke sistem ini.',
      };
      setErrorMsg(errorMessages[error] || 'Terjadi kesalahan saat login. Silahkan coba lagi.');
    }

    const checkExistingSession = async () => {
      // Use sessionManager to validate session with expiration checks
      const validation = sessionManager.validateSession();
      
      if (validation.isValid) {
        try {
          const session = sessionManager.getSession();
          if (session?.user) {
            const userData = session.user;
            console.log('[LOGIN] ✅ Valid session found, redirecting...', {
              expiresIn: validation.expiresIn,
              user: userData.email
            });
            
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
              sessionManager.clearSession();
              router.push('/login');
            }
            return; // Stop render form login
          }
        } catch (err) {
          console.error('[LOGIN] Error validating session:', err);
          sessionManager.clearSession();
        }
      } else {
        // Session invalid or expired
        console.log('[LOGIN] ❌ Session invalid:', validation.reason);
        sessionManager.clearSession();
        await supabase.auth.signOut();
      }
      setIsCheckingSession(false);
    };

    checkExistingSession();
  }, [router, searchParams]);

  // Detect logout/login di tab lain
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // If token or timestamp is removed/changed in another tab
      if (event.key === 'token' || 
          event.key === 'session_timestamp' || 
          event.key === 'user' && event.newValue !== event.oldValue) {
        console.log('[LOGIN] Storage changed in another tab, redirecting to login...');
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
            prompt: 'select_account',
          },
        },
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

      // Store session with expiration timestamp
      sessionManager.storeSession(token, userData);

      // catat activity log
      const { error: logError } = await supabase.from('activity_logs').insert({
        user_id: userData.user_id,
        activity: `LOGIN: ${userData?.name || 'User'} masuk sebagai ${userData?.role || 'user'}`
      });

      if (logError) {
        console.error('[LOG ERROR] Gagal mencatat log manual:', logError.message);
      } else {
        console.log('[LOG SUCCESS] Log Manual berhasil dicatat!');
      }

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
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Checking session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-8 font-sans overflow-hidden">
      
      {/* FULLSCREEN BACKGROUND IMAGE */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/bg-login.png" // Ganti menjadi .jpg jika file aslinya berekstensi .jpg
          alt="Background" 
          fill 
          priority 
          className="object-cover object-center" 
        />
        {/* Overlay tipis agar card login tetap terbaca jelas */}
        <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px]"></div>
      </div>

      {/* CENTERED FORM CARD (Light Mode Glassmorphism) */}
      <div className="relative z-10 w-full max-w-[460px]">
        <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-black/10 border border-white/60 p-8 sm:p-12 animate-in zoom-in-95 duration-500">
          
          <div className="flex flex-col items-center mb-10 text-center">
            <Link href="/">
              <Image src="/SmallLogo.png" alt="Logo" width={150} height={40} className="w-auto h-9 mb-6" priority />
            </Link>
            <h1 className="text-[26px] font-black text-slate-800 tracking-tight leading-tight">
              Welcome Back
            </h1>
            <p className="text-slate-500 font-medium text-sm mt-2">
              Log in to your account to continue
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50/90 backdrop-blur-sm border border-red-100 text-red-600 text-sm rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-slate-700 ml-1">Email Address</label>
              <div className="relative flex items-center group">
                <Mail size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com" 
                  className="w-full pl-11 pr-4 py-4 bg-slate-50/80 border border-slate-200 rounded-2xl text-slate-800 font-semibold focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all placeholder:text-slate-400 placeholder:font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-slate-700 ml-1">Password</label>
              <div className="relative flex items-center group">
                <Lock size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full pl-11 pr-12 py-4 bg-slate-50/80 border border-slate-200 rounded-2xl text-slate-800 font-semibold focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all placeholder:text-slate-400 placeholder:font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer focus:outline-none"
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-1 px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 focus:ring-2 focus:ring-offset-1 cursor-pointer" />
                <span className="text-[13px] text-slate-600 font-semibold group-hover:text-slate-800 transition-colors">Remember me</span>
              </label>
              <button 
                type="button" 
                onClick={() => router.push('/auth/forgot-password')} 
                className="text-[13px] font-bold text-blue-600 hover:underline transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            <button 
              type="submit" 
              disabled={isLoading || isGoogleLoading}
              className="w-full mt-2 bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-600/20 disabled:bg-blue-400 flex justify-center items-center gap-2 text-[15px]"
            >
              {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <LogIn size={18} />}
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-[11px] font-black text-slate-400 tracking-[0.2em] uppercase">Or</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading || isLoading}
            className="w-full bg-white border-2 border-slate-100 text-slate-700 font-bold py-3.5 rounded-2xl hover:border-slate-200 hover:bg-slate-50 active:scale-[0.98] transition-all flex justify-center items-center gap-3 disabled:opacity-50 text-[14px]"
          >
            {isGoogleLoading ? (
              <Loader2 size={18} className="animate-spin text-blue-600" />
            ) : (
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {isGoogleLoading ? 'Redirecting...' : 'Sign in with Google'}
          </button>

          {/* <p className="text-center text-[13px] text-slate-500 font-medium mt-8">
            Don't have an account? <Link href="/auth/register" className="text-blue-600 font-bold hover:underline">Create here</Link>
          </p> */}

        </div>
      </div>

    </div>
  );
}