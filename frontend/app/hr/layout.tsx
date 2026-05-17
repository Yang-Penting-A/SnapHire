"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import sessionManager from '@/app/lib/sessionManager';
import { LayoutDashboard, Briefcase, Users, Settings, LogOut, Menu, X, Loader2, ScanSearch, Bell } from 'lucide-react';

export default function HRLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [hrName, setHrName] = useState("HR Name");
  const [realtimeToast, setRealtimeToast] = useState<{ title: string; description: string } | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  // State untuk deteksi scroll
  const [isScrolled, setIsScrolled] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const checkHR = async () => {
      try {
        const validation = sessionManager.validateSession();
        
        if (!validation.isValid) {
          sessionManager.clearSession();
          await supabase.auth.signOut();
          router.replace('/login');
          return;
        }
        
        const session = sessionManager.getSession();
        if (!session?.user || session.user?.role?.toLowerCase() !== 'hr') {
          sessionManager.clearSession();
          await supabase.auth.signOut();
          router.replace('/login');
          return;
        }

        setHrName(session.user.name || 'HR snapHire');
        setIsAuthorized(true);
      } catch (err) {
        sessionManager.clearSession();
        await supabase.auth.signOut();
        router.replace('/login');
      }
    };
    checkHR();
  }, [router]);

  useEffect(() => {
    if (!isAuthorized) return;

    const showToast = (title: string, description: string) => {
      setRealtimeToast({ title, description });

      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }

      toastTimerRef.current = setTimeout(() => {
        setRealtimeToast(null);
      }, 5000);
    };

    const channel = supabase
      .channel('hr-dashboard-applications-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'applications' },
        async (payload) => {
          console.log('Global realtime applicant received');
          console.log(payload);

          const applicationId = payload.new?.application_id;

          try {
            if (applicationId) {
              const candidateId = payload.new?.candidate_id;
              const jobId = payload.new?.job_id;

              const [candidateResult, jobResult] = await Promise.all([
                candidateId
                  ? supabase.from('candidates').select('name').eq('candidate_id', candidateId).single()
                  : Promise.resolve({ data: null, error: null }),
                jobId
                  ? supabase.from('jobs').select('title').eq('job_id', jobId).single()
                  : Promise.resolve({ data: null, error: null }),
              ]);

              const candidateName = candidateResult.data?.name || 'New applicant';
              const jobTitle = jobResult.data?.title || 'selected position';

              showToast('New Applicant Received', `${candidateName} applied for ${jobTitle}`);
            } else {
              showToast('New Applicant Received', 'A new application was added');
            }
          } catch (error) {
            console.error('[REALTIME] Failed to build notification details:', error);
            showToast('New Applicant Received', 'A new application was added');
          }

          window.dispatchEvent(new CustomEvent('snaphire:hr-applicant-updated'));
          window.dispatchEvent(new CustomEvent('snaphire:new-applicant'));
        }
      )
      .subscribe((status) => {
        console.log('[REALTIME] HR dashboard subscription status:', status);
      });

    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }

      supabase.removeChannel(channel);
    };
  }, [isAuthorized]);

  useEffect(() => {
    if (realtimeToast) {
      console.log('Toast state updated');
      console.log(realtimeToast);
    }
  }, [realtimeToast]);

  // ACTIVITY TRACKING & INACTIVITY MONITORING
  useEffect(() => {
    if (!isAuthorized) return;

    let inactivityTimer: NodeJS.Timeout | null = null;
    let warningTimeout: NodeJS.Timeout | null = null;
    const INACTIVITY_WARNING_THRESHOLD = 60; 
    
    const resetInactivityTimer = () => {
      sessionManager.recordActivity();
      
      if (inactivityTimer) clearTimeout(inactivityTimer);
      if (warningTimeout) clearTimeout(warningTimeout);
      
      const inactivityRemaining = sessionManager.getInactivityTimeRemaining();
      if (inactivityRemaining === null || inactivityRemaining <= 0) {
        handleInactivityLogout();
        return;
      }
      
      if (inactivityRemaining > INACTIVITY_WARNING_THRESHOLD) {
        warningTimeout = setTimeout(() => {}, (inactivityRemaining - INACTIVITY_WARNING_THRESHOLD) * 1000);
      }
      
      inactivityTimer = setTimeout(() => {
        handleInactivityLogout();
      }, inactivityRemaining * 1000);
    };
    
    const handleInactivityLogout = async () => {
      sessionManager.clearSession();
      await supabase.auth.signOut();
      router.replace('/login?reason=inactivity_timeout');
    };
    
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    const listeners = events.map(event => addEventListener(event, resetInactivityTimer, true));
    
    resetInactivityTimer();
    
    return () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      if (warningTimeout) clearTimeout(warningTimeout);
      events.forEach(event => removeEventListener(event, resetInactivityTimer, true));
    };
  }, [isAuthorized, router]);

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMenu = () => setIsMobileMenuOpen(false);

  const getMenuClass = (path: string) => {
    const isActive = pathname === path;
    const baseClass = "flex items-center gap-3 px-4 py-4 rounded-2xl font-black transition-all duration-200 group";
    const activeClass = "bg-blue-600 text-white shadow-xl shadow-blue-600/30 scale-[1.02]";
    const inactiveClass = "text-stone-500 hover:text-blue-600 hover:bg-blue-100/50 hover:pl-6";
    return `${baseClass} ${isActive ? activeClass : inactiveClass}`;
  };

  // FUNGSI PENDETEKSI SCROLL PADA MAIN AREA
  const handleMainScroll = (e: React.UIEvent<HTMLElement>) => {
    setIsScrolled(e.currentTarget.scrollTop > 20);
  };

  if (!isAuthorized) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#FFFAF5]">
        <Loader2 size={40} className="text-blue-600 animate-spin" />
      </div>
    );
  }

  const toastMarkup = realtimeToast ? (
    <div className="fixed top-6 right-6 z-9999 w-[min(92vw,24rem)] pointer-events-none">
      <div className="pointer-events-auto animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="rounded-3xl border border-blue-100 bg-white/95 backdrop-blur-xl shadow-[0_24px_80px_rgba(15,23,42,0.12)] p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
                <Bell size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">{realtimeToast.title}</p>
                    <p className="mt-1 text-sm font-bold text-stone-800 leading-relaxed">{realtimeToast.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRealtimeToast(null)}
                    className="rounded-xl p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                    aria-label="Dismiss notification"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="flex min-h-screen bg-[#FFFAF5] font-sans text-stone-900 overflow-hidden relative">
      {isClient && toastMarkup ? createPortal(toastMarkup, document.body) : null}
      
      {/* =========================================
          MOBILE & TABLET HEADER (Floating Glassmorphism) 
          ========================================= */}
      <div className={`lg:hidden fixed top-0 left-0 right-0 z-40 pointer-events-none transition-all duration-300 ease-in-out flex justify-center 
        ${isScrolled ? 'pt-3 px-4 md:px-8' : 'pt-0 px-0'}
      `}>
        <header className={`pointer-events-auto flex items-center justify-between transition-all duration-300 ease-in-out w-full
          ${isScrolled 
            ? 'bg-white/80 backdrop-blur-xl border border-stone-200/50 shadow-md rounded-4xl py-3 px-6' 
            : 'bg-[#FFFAF5]/90 backdrop-blur-md border-b border-stone-200/50 py-4 px-5 rounded-none'
          }
        `}>
          <Image src="/SmallLogo.png" alt="snapHire" width={100} height={25} className="w-auto h-6 md:h-7" priority />
          <button onClick={toggleMenu} className="p-2 text-stone-900 bg-stone-100/50 hover:bg-stone-100 rounded-xl active:scale-95 transition-all">
            <Menu size={24} />
          </button>
        </header>
      </div>

      {/* BACKDROP MOBILE */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 lg:hidden" onClick={closeMenu}></div>
      )}

      {/* =========================================
          SIDEBAR HR 
          ========================================= */}
      <aside className={`
        fixed lg:sticky top-0 h-screen w-70 bg-white border-r border-stone-200 flex flex-col shrink-0 z-60 
        transition-transform duration-500 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 h-20 lg:h-24 flex items-center justify-between border-b border-stone-50">
          <Image src="/SmallLogo.png" alt="snapHire" width={120} height={30} className="h-8 w-auto" />
          <button onClick={closeMenu} className="lg:hidden p-2 text-stone-400 hover:text-red-600 transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <nav className="p-4 flex flex-col gap-2 flex-1 overflow-y-auto">
          <Link href="/hr" onClick={closeMenu} className={getMenuClass('/hr')}>
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link href="/hr/jobs" onClick={closeMenu} className={getMenuClass('/hr/jobs')}>
            <Briefcase size={20} /> Kelola Lowongan
          </Link>
          <Link href="/hr/applicants" onClick={closeMenu} className={getMenuClass('/hr/applicants')}>
            <Users size={20} /> List Pelamar
          </Link>
          <Link href="/hr/scan-cv" onClick={closeMenu} className={getMenuClass('/hr/scan-cv')}>
            <ScanSearch size={20} /> Scan CV
          </Link>
          <Link href="/hr/settings" onClick={closeMenu} className={getMenuClass('/hr/settings')}>
            <Settings size={20} /> Pengaturan
          </Link>
        </nav>

        {/* LOGOUT */}
        <div className="p-4 border-t border-stone-50">
          <button 
            onClick={async () => {
              sessionManager.clearSession();
              await supabase.auth.signOut();
              router.replace('/login');
            }}
            className="group flex items-center gap-3 w-full px-4 py-4 rounded-2xl font-black text-stone-400 hover:text-red-600 hover:bg-red-50 hover:pl-6 transition-all duration-200"
          >
            <div className="p-2 bg-stone-50 group-hover:bg-red-100 rounded-lg transition-colors">
              <LogOut size={20} />
            </div>
            <span className="text-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* =========================================
          MAIN CONTENT AREA 
          ========================================= */}
      <main 
        className="flex-1 min-w-0 h-screen flex flex-col relative overflow-y-auto scroll-smooth"
        onScroll={handleMainScroll}
      >
        
        {/* Spacer agar konten tidak tertabrak Header Tablet/Mobile */}
        {/* Di Desktop (lg) hanya perlu padding tipis karena tidak ada topbar */}
        <div className="h-20 md:h-24 lg:h-8 shrink-0 w-full pointer-events-none"></div>
        
        {/* DASHBOARD CONTENT (children) INJECTED HERE */}
        <div className="p-5 md:p-8 lg:p-12 lg:pt-0 max-w-7xl mx-auto w-full">
          {children}
        </div>
        
      </main>
      
    </div>
  );
}