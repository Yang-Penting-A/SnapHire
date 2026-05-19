"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import sessionManager from '@/app/lib/sessionManager';
import Image from 'next/image';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('[OAUTH CALLBACK] Processing callback...');
        
        // Check for OAuth error in URL
        const error = searchParams.get('error');
        const errorCode = searchParams.get('error_code');
        const errorDesc = searchParams.get('error_description');

        if (error) {
          console.error('[OAUTH CALLBACK] OAuth error:', { error, errorCode, errorDesc });
          throw new Error(`OAuth Error: ${errorDesc || error}`);
        }

        // Wait a moment for Supabase to process the OAuth code
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Get the session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw new Error(sessionError.message || 'Gagal mendapatkan session');
        }

        if (!sessionData?.session) {
          console.warn('[OAUTH CALLBACK] No session found, waiting for auth state change...');
          
          // Try listening to auth state change
          const { data: authData } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
              processSession(session);
            }
          });

          // Timeout after 2 seconds
          await new Promise(resolve => setTimeout(resolve, 2000));
          authData?.subscription.unsubscribe();
          
          if (!sessionData?.session) {
            throw new Error('Session tidak ditemukan. Pastikan konfigurasi Google OAuth sudah benar.');
          }
          return;
        }

        processSession(sessionData.session);

      } catch (error: any) {
        console.error('[OAUTH CALLBACK] Error:', error.message);
        setErrorMsg(error.message || 'Terjadi kesalahan saat memproses login.');
        setIsProcessing(false);
        setTimeout(() => router.push('/login'), 3000);
      }
    };

    const processSession = async (session: any) => {
      try {
        const user = session.user;
        const token = session.access_token;
        const email = user.email || '';

        // Check Database
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('user_id, name, email, role')
          .eq('email', email)
          .single();

        if (checkError && checkError.code !== 'PGRST116') { 
          throw new Error('Gagal melakukan verifikasi database.');
        }

        if (!existingUser) {
          await supabase.auth.signOut();
          setErrorMsg(`Email ${email} belum terdaftar di sistem.`);
          setIsProcessing(false);
          setTimeout(() => router.push('/login?error=unauthorized'), 3000);
          return;
        }

        // Verify Role
        if (!['hr', 'admin'].includes(existingUser.role?.toLowerCase() || '')) {
          await supabase.auth.signOut();
          setErrorMsg('Akun Anda tidak memiliki akses ke sistem ini.');
          setIsProcessing(false);
          setTimeout(() => router.push('/login?error=invalid_role'), 3000);
          return;
        }

        // Call Backend
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
        const response = await fetch(`${backendUrl}/auth/oauth-callback`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            name: user.user_metadata?.full_name || existingUser.name,
            provider: 'google',
            provider_id: user.id,
          }),
        });

        if (!response.ok) {
          await supabase.auth.signOut();
          throw new Error('Gagal melakukan validasi backend.');
        }

        const responseData = await response.json();
        const userData = responseData.data;

        // Store Session & Log Activity
        sessionManager.storeSession(token, userData);
        await supabase.auth.signOut(); // Clean up if needed based on your arch
        
        const role = userData?.role?.toLowerCase();
        if (role === 'admin') router.push('/admin');
        else if (role === 'hr') router.push('/hr');
        else throw new Error('Role tidak dikenali');

      } catch (error: any) {
        await supabase.auth.signOut();
        setErrorMsg(error.message || 'Gagal memproses sesi login.');
        setIsProcessing(false);
        setTimeout(() => router.push('/login'), 3000);
      }
    };

    handleCallback();
  }, [router, searchParams]);

  // --- UI RENDER ---
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 font-sans overflow-hidden">
      {/* BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/bg-login.png" 
          alt="Background" 
          fill 
          priority 
          className="object-cover object-center" 
        />
        <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[2px]"></div>
      </div>

      {/* CONTENT CARD */}
      <div className="relative z-10 w-full max-w-[420px]">
        {isProcessing ? (
          // LOADING STATE (Matches your reference image)
          <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-black/5 border border-white/60 p-10 text-center animate-in zoom-in-95 duration-500">
            <div className="flex justify-center mb-6">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" strokeWidth={2.5} />
            </div>
            <h1 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-2">
              Signing You In
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Preparing your SnapHire workspace...
            </p>
          </div>
        ) : (
          // ERROR STATE
          <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-red-900/5 border border-white/60 p-10 text-center animate-in fade-in duration-300">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center shadow-sm">
                <AlertCircle className="w-8 h-8 text-red-500" strokeWidth={2.5} />
              </div>
            </div>
            <h1 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-3">
              Login Failed
            </h1>
            <p className="text-sm text-slate-600 font-semibold mb-2">
              {errorMsg}
            </p>
            <p className="text-xs text-slate-400 font-medium mb-8">
              Redirecting back to login...
            </p>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-all text-sm shadow-md"
            >
              Return to Login Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}