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

  useEffect(() => {
    const checkHR = async () => {
      try {
        // Use sessionManager to validate session with expiration checks
        const validation = sessionManager.validateSession();
        
        if (!validation.isValid) {
          console.log('[HR] Session invalid:', validation.reason);
          sessionManager.clearSession();
          await supabase.auth.signOut();
          router.replace('/login');
          return;
        }
        
        const session = sessionManager.getSession();
        if (!session?.user) {
          console.warn('[HR] Session found but no user data');
          sessionManager.clearSession();
          await supabase.auth.signOut();
          router.replace('/login');
          return;
        }

        if (session.user?.role?.toLowerCase() !== 'hr') {
          console.log('[HR] Role bukan HR:', session.user.role);
          sessionManager.clearSession();
          await supabase.auth.signOut();
          router.replace('/login');
          return;
        }

        console.log('[HR] ✅ Authorized via sessionManager', {
          user: session.user.email,
          expiresIn: validation.expiresIn
        });
        setHrName(session.user.name || 'HR snapHire');
        setIsAuthorized(true);
      } catch (err) {
        console.error('[HR] Security check error:', err);
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
    const INACTIVITY_WARNING_THRESHOLD = 60; // Show warning 60 seconds before logout
    
    const resetInactivityTimer = () => {
      // Record activity
      sessionManager.recordActivity();
      
      // Clear existing timers
      if (inactivityTimer) clearTimeout(inactivityTimer);
      if (warningTimeout) clearTimeout(warningTimeout);
      
      const inactivityRemaining = sessionManager.getInactivityTimeRemaining();
      if (inactivityRemaining === null || inactivityRemaining <= 0) {
        handleInactivityLogout();
        return;
      }
      
      // Set warning timeout (before actual logout)
      if (inactivityRemaining > INACTIVITY_WARNING_THRESHOLD) {
        warningTimeout = setTimeout(() => {
          console.warn('[HR] ⏰ Inactivity warning - will logout soon');
        }, (inactivityRemaining - INACTIVITY_WARNING_THRESHOLD) * 1000);
      }
      
      // Set logout timeout
      inactivityTimer = setTimeout(() => {
        handleInactivityLogout();
      }, inactivityRemaining * 1000);
    };
    
    const handleInactivityLogout = async () => {
      console.warn('[HR] 🔴 Inactivity timeout - logging out');
      sessionManager.clearSession();
      await supabase.auth.signOut();
      router.replace('/login?reason=inactivity_timeout');
    };
    
    // Track user activity on various events
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    const listeners = events.map(event => 
      addEventListener(event, resetInactivityTimer, true)
    );
    
    // Initial setup
    resetInactivityTimer();
    
    return () => {
      // Cleanup
      if (inactivityTimer) clearTimeout(inactivityTimer);
      if (warningTimeout) clearTimeout(warningTimeout);
      events.forEach(event => 
        removeEventListener(event, resetInactivityTimer, true)
      );
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

  if (!isAuthorized) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#FFFAF5]">
        <Loader2 size={40} className="text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#FFFAF5] font-sans text-stone-900 overflow-hidden">
      
      {/* MOBILE HEADER */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-stone-200 z-[40] flex items-center justify-between px-5 shadow-sm">
        <Image src="/SmallLogo.png" alt="snapHire" width={100} height={25} className="w-auto h-6" priority />
        <button onClick={toggleMenu} className="p-2 text-stone-900 bg-stone-50 rounded-xl active:scale-95 transition-all">
          <Menu size={24} />
        </button>
      </header>

      {/* BACKDROP MOBILE */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[50] lg:hidden" onClick={closeMenu}></div>
      )}

      {/* SIDEBAR HR */}
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
            className="group flex items-center gap-3 w-full px-4 py-4 rounded-2xl font-black text-stone-400 hover:text-red-600 hover:bg-red-100 hover:pl-6 transition-all duration-200"
          >
            <div className="p-2 bg-stone-50 group-hover:bg-red-100 rounded-lg transition-colors">
              <LogOut size={20} />
            </div>
            <span className="text-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 h-screen flex flex-col relative overflow-y-auto">
        
        {/* TOPBAR PROFILE (Desktop Only) */}
        <div className="hidden lg:flex h-24 items-center justify-end px-12 pt-4">
          <div className="flex items-center gap-4 bg-white px-5 py-2.5 rounded-full border border-stone-200 shadow-sm">
            <span className="font-bold text-stone-700">{hrName}</span>
            <div className="w-10 h-10 bg-[#0F172A] rounded-full flex items-center justify-center text-white font-bold">
              {hrName.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        <div className="h-16 lg:hidden"></div> {/* Spacer Mobile */}
        
        {/* DASHBOARD CONTENT (children) INJECTED HERE */}
        <div className="p-5 md:p-8 lg:p-12 lg:pt-4 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
      
    </div>
  );
}