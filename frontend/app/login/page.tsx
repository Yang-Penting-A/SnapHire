"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [activeUser, setActiveUser] = useState<any>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // check session di LocalStorage 
  useEffect(() => {
    const checkExistingSession = () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          console.log('[LOGIN] ✅ Found active session:', userData.email);
          setHasActiveSession(true);
          setActiveUser(userData);
        } catch (err) {
          console.log('[LOGIN] Invalid stored user data');
          setHasActiveSession(false);
          setActiveUser(null);
        }
      }
      setIsCheckingSession(false);
    };

    checkExistingSession();
  }, []);

  // Detect logout/login di tab lain
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // Jika token dihapus/berubah di tab lain, auto refresh page
      if (event.key === 'token' && !event.newValue) {
        console.log('[LOGIN] Token dihapus di tab lain, refresh page...');
        window.location.href = '/login';
      }
      // Jika user berubah di tab lain (login user berbeda)
      if (event.key === 'user' && event.newValue !== event.oldValue) {
        console.log('[LOGIN] User berbeda login di tab lain, refresh page...');
        window.location.href = '/login';
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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

      // Backend akan verify token dan return user role via middleware
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
        console.log(`[LOGIN] ✅ Token saved for: ${userData?.email} (${userData?.role})`);
      }

      // catat activity log login
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
      console.error('[REGISTER] Error:', error.message);
      setErrorMsg(error.message || 'Terjadi kesalahan saat registrasi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      // Clear localStorage dulu
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      // logout dari Supabase
      await supabase.auth.signOut();
      console.log('[LOGIN] ✅ Session cleared');
      setHasActiveSession(false);
      setActiveUser(null);
      setEmail('');
      setPassword('');
    } catch (error) {
      console.error('[LOGIN] Logout error:', error);
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

  // tampilan saat ada session active
  if (hasActiveSession && activeUser) {
    return (
      <div className="min-h-screen bg-[#F4F7FE] flex items-center justify-center p-4 md:p-8 font-sans">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/5 border border-white p-8 sm:p-10">
            
            <div className="flex flex-col items-center mb-10 text-center">
              <Link href="/">
                <Image src="/SmallLogo.png" alt="Logo" width={150} height={40} className="w-auto h-9 mb-4" priority />
              </Link>
              <h1 className="text-xl font-black text-stone-900 tracking-tight">Session Aktif</h1>
              <div className="h-1.5 w-10 bg-blue-600 rounded-full mt-3"></div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {activeUser.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="text-left">
                  <p className="font-black text-stone-900">{activeUser.name}</p>
                  <p className="text-sm text-stone-600">{activeUser.email}</p>
                </div>
              </div>
              <div className="px-3 py-1.5 bg-blue-600 text-white rounded-full inline-block text-xs font-bold">
                {activeUser.role?.toUpperCase()}
              </div>
            </div>

            <p className="text-center text-sm text-stone-600 mb-6">
              Anda sedang login dengan akun <span className="font-black">{activeUser.name}</span>. 
              <br />
              <span className="text-xs">Untuk login dengan akun berbeda, silakan logout terlebih dahulu.</span>
            </p>

            <button 
              onClick={() => {
                const role = activeUser.role?.toLowerCase();
                if (role === 'admin') {
                  router.push('/admin');
                } else if (role === 'hr') {
                  router.push('/hr');
                } else {
                  router.push('/dashboard');
                }
              }}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white font-black py-3.5 rounded-2xl hover:bg-blue-700 transition-all mb-3 shadow-xl shadow-blue-600/25"
            >
              Lanjutkan sebagai {activeUser.name}
            </button>

            <button 
              onClick={handleLogout}
              disabled={isLoading}
              className="w-full bg-red-50 text-red-600 font-bold py-3.5 rounded-2xl hover:bg-red-100 transition-all border border-red-200"
            >
              {isLoading ? 'Logout...' : 'Logout & Login Akun Lain'}
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/5 border border-white p-8 sm:p-10">
            
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
                  <Link href="#" className="text-xs font-bold text-blue-600 hover:underline">Lupa sandi?</Link>
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

            <p className="text-center text-sm text-stone-500 font-medium">
              Belum punya akun? <Link href="/register" className="text-blue-600 font-black hover:underline underline-offset-4">Daftar di sini</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}