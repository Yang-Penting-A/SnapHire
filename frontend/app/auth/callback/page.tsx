"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import sessionManager from '@/app/lib/sessionManager';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('[OAUTH CALLBACK] Processing callback...');
        console.log('[OAUTH CALLBACK] Full URL:', window.location.href);
        console.log('[OAUTH CALLBACK] Search params:', window.location.search);

        // Check for OAuth error in URL
        const error = searchParams.get('error');
        const errorCode = searchParams.get('error_code');
        const errorDesc = searchParams.get('error_description');

        console.log('[OAUTH CALLBACK] URL params:', { error, errorCode, errorDesc });

        if (error) {
          console.error('[OAUTH CALLBACK] OAuth error from Supabase:', { error, errorCode, errorDesc });
          throw new Error(`OAuth Error: ${errorDesc || error}`);
        }

        // Wait a moment for Supabase to process the OAuth code
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Get the session from URL/Supabase
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[OAUTH CALLBACK] Session error:', sessionError.message);
          throw new Error(sessionError.message || 'Gagal mendapatkan session');
        }

        if (!sessionData?.session) {
          console.warn('[OAUTH CALLBACK] No session found after 1s, waiting for auth state change...');
          console.log('[OAUTH CALLBACK] Session data:', sessionData);
          
          // Try listening to auth state change
          const { data: authData } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('[OAUTH CALLBACK] Auth state change event:', event, session?.user?.email);
            if (event === 'SIGNED_IN' && session) {
              console.log('[OAUTH CALLBACK] ✅ Auth state changed, session found');
              processSession(session);
            }
          });

          // If still no session after 2 seconds, throw error
          await new Promise(resolve => setTimeout(resolve, 2000));
          authData?.subscription.unsubscribe();
          
          if (!sessionData?.session) {
            throw new Error('Session tidak ditemukan. Redirect URL mungkin tidak sesuai di Supabase config atau Google OAuth belum properly configured.');
          }
          return;
        }

        processSession(sessionData.session);

      } catch (error: any) {
        console.error('[OAUTH CALLBACK] Error:', error.message);
        setErrorMsg(error.message || 'Terjadi kesalahan saat memproses login. Silahkan coba lagi.');
        setIsProcessing(false);

        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    };

    const processSession = async (session: any) => {
      try {
        const user = session.user;
        const token = session.access_token;

        console.log('[OAUTH CALLBACK] ✅ Session found for:', user.email);

        const email = user.email || '';

        // CRITICAL: Direct database check BEFORE calling backend to prevent Supabase auto-insert
        console.log('[OAUTH CALLBACK] Checking if user exists in database...');
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('user_id, name, email, role')
          .eq('email', email)
          .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('[OAUTH CALLBACK] Database check error:', checkError.message);
          throw new Error('Gagal melakukan verifikasi. Silahkan coba lagi.');
        }

        if (!existingUser) {
          console.warn('[OAUTH CALLBACK] ❌ User not registered in database:', email);
          
          // CRITICAL: Sign out immediately to prevent unauthorized access
          await supabase.auth.signOut();
          
          setErrorMsg(`Email ${email} belum terdaftar. Hubungi administrator untuk didaftarkan.`);
          setIsProcessing(false);
          
          setTimeout(() => {
            router.push('/login?error=unauthorized');
          }, 3000);
          
          return;
        }

        console.log('[OAUTH CALLBACK] ✅ User found in database:', existingUser.name, `(${existingUser.role})`);

        // Verify role is valid (only HR or ADMIN allowed)
        if (!['hr', 'admin'].includes(existingUser.role?.toLowerCase() || '')) {
          console.error('[OAUTH CALLBACK] ❌ User has invalid role:', existingUser.role);
          await supabase.auth.signOut();
          
          setErrorMsg('Akun Anda tidak memiliki akses ke sistem ini.');
          setIsProcessing(false);
          
          setTimeout(() => {
            router.push('/login?error=invalid_role');
          }, 3000);
          
          return;
        }

        // Call backend to finalize login
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
          const errorData = await response.json();
          console.error('[OAUTH CALLBACK] Backend error:', errorData);
          
          // CRITICAL: Sign out user if validation fails
          console.log('[OAUTH CALLBACK] Signing out user due to backend validation failure');
          await supabase.auth.signOut();
          
          throw new Error(errorData.message || 'Gagal memproses login. Silahkan coba lagi.');
        }

        const responseData = await response.json();
        const userData = responseData.data;

        console.log('[OAUTH CALLBACK] ✅ User synced:', userData);

        // Store session with expiration timestamp
        sessionManager.storeSession(token, userData);

        const { error: logError } = await supabase.from('activity_logs').insert({
          user_id: existingUser.user_id, 
          activity: `LOGIN: ${userData?.name || existingUser.name} masuk menggunakan Google OAuth`
        });

        if (logError) {
          console.error('[LOG ERROR] Gagal mencatat log Google:', logError.message);
        } else {
          console.log('[LOG SUCCESS] Log Google Auth berhasil dicatat!');
        }

        if (logError) console.warn('Gagal mencatat log:', logError.message);

        console.log('[OAUTH CALLBACK] ✅ Login successful, redirecting...');

        // Redirect based on role
        const role = userData?.role?.toLowerCase();
        
        if (role === 'admin') {
          router.push('/admin');
        } else if (role === 'hr') {
          router.push('/hr');
        } else {
          // This should never happen due to earlier validation, but as fallback
          await supabase.auth.signOut();
          throw new Error('Role tidak dikenali');
        }
      } catch (error: any) {
        console.error('[OAUTH CALLBACK] Process error:', error.message);
        
        // CRITICAL: Always sign out on error to prevent unauthorized access
        try {
          await supabase.auth.signOut();
        } catch (signOutError) {
          console.warn('[OAUTH CALLBACK] Sign out failed during error handling:', signOutError);
        }
        
        setErrorMsg(error.message || 'Terjadi kesalahan saat memproses login.');
        setIsProcessing(false);

        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    };

    handleCallback();
  }, [router, searchParams]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-[#F4F7FE] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone-600 font-medium">Processing login...</p>
          <p className="text-stone-500 text-sm mt-2">Tunggu sebentar...</p>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen bg-[#F4F7FE] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/5 border border-white p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-black text-stone-900">Login Gagal</h1>
        </div>

        <p className="text-stone-600 text-sm mb-6 font-medium">{errorMsg}</p>
        <p className="text-stone-500 text-xs mb-6">Anda akan diarahkan ke halaman login dalam beberapa detik...</p>

        <button
          onClick={() => router.push('/login')}
          className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}