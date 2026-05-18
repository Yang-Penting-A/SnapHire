"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import sessionManager from '@/app/lib/sessionManager';
import { LayoutDashboard, Briefcase, Users, Settings, LogOut, Menu, X, Loader2, ScanSearch } from 'lucide-react';

export default function HRLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [hrName, setHrName] = useState("HR Name");
  
  // State untuk deteksi scroll
  const [isScrolled, setIsScrolled] = useState(false);

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

        // 🔥 INJEKSI PENGECEKAN SAKLAR AKUN (ANTI-USER DITANGGUHKAN)
        // Mengecek status is_active langsung ke database secara real-time saat layout dimuat
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('is_active')
          .eq('user_id', session.user.user_id || session.user.id)
          .single();

        // Jika data profile tidak ketemu atau is_active bernilai FALSE, auto-tendang saat itu juga!
        if (profileError || (userProfile && userProfile.is_active === false)) {
          sessionManager.clearSession();
          await supabase.auth.signOut();
          router.replace('/login?reason=suspended'); // Mengirim alasan penangguhan ke halaman login
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

  return (
    <div className="flex min-h-screen bg-[#FFFAF5] font-sans text-stone-900 overflow-hidden relative">
      
      {/* =========================================
          MOBILE & TABLET HEADER (Floating Glassmorphism) 
          ========================================= */}
      <div className={`lg:hidden fixed top-0 left-0 right-0 z-[40] pointer-events-none transition-all duration-300 ease-in-out flex justify-center 
        ${isScrolled ? 'pt-3 px-4 md:px-8' : 'pt-0 px-0'}
      `}>
        <header className={`pointer-events-auto flex items-center justify-between transition-all duration-300 ease-in-out w-full
          ${isScrolled 
            ? 'bg-white/80 backdrop-blur-xl border border-stone-200/50 shadow-md rounded-[2rem] py-3 px-6' 
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
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[50] lg:hidden" onClick={closeMenu}></div>
      )}

      {/* =========================================
          SIDEBAR HR 
          ========================================= */}
      <aside className={`
        fixed lg:sticky top-0 h-screen w-[280px] bg-white border-r border-stone-200 flex flex-col shrink-0 z-[60] 
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
        <div className="h-20 md:h-24 lg:h-8 shrink-0 w-full pointer-events-none"></div>
        
        {/* DASHBOARD CONTENT (children) INJECTED HERE */}
        <div className="p-5 md:p-8 lg:p-12 lg:pt-0 max-w-7xl mx-auto w-full">
          {children}
        </div>
        
      </main>
      
    </div>
  );
}