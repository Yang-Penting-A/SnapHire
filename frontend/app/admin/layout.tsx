"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import { LayoutDashboard, Users, Menu, X, FileText, LogOut, Loader2 } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            if (userData?.role?.toLowerCase() === 'admin') {
              console.log('[ADMIN] Authorized via localStorage');
              setIsAuthorized(true);
              return; 
            } else {
              console.log('[ADMIN] Role bukan admin, redirect to dashboard');
              router.replace('/dashboard');
              return;
            }
          } catch (e) {
            console.warn('[ADMIN] Stored user data invalid, checking session...');
          }
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          console.warn('[ADMIN] Session invalid, clearing auth...');
          await supabase.auth.signOut();
          router.replace('/login'); 
          return; 
        }

        // Query database untuk cek role 
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (userData?.role?.toLowerCase() !== 'admin') { 
          console.log('[ADMIN] Database: Role bukan admin');
          router.replace('/dashboard'); 
        } else { 
          console.log('[ADMIN] Authorized via database');
          setIsAuthorized(true); 
        }
      } catch (err) {
        console.error('[ADMIN] Security check error:', err);
        await supabase.auth.signOut();
        router.replace('/login');
      }
    };
    checkAdmin();
  }, [router]);

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMenu = () => setIsMobileMenuOpen(false);

  const getMenuClass = (path: string) => {
    const isActive = pathname === path;
    const baseClass = "flex items-center gap-3 px-4 py-4 rounded-2xl font-black transition-all duration-200 group";
    
    // Warna saat Aktif (Biru Solid)
    const activeClass = "bg-blue-600 text-white shadow-xl shadow-blue-600/30 scale-[1.02]";
    
    // Warna saat TIDAK Aktif (Hover ditingkatkan kontrasnya)
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
      
      {/* MOBILE & TABLET HEADER */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-stone-200 z-[40] flex items-center justify-between px-5 shadow-sm">
        <Link href="/admin" onClick={closeMenu}>
          <Image src="/SmallLogo.png" alt="snapHire" width={100} height={25} className="w-auto h-6" priority />
        </Link>
        <button onClick={toggleMenu} className="p-2 text-stone-900 bg-stone-50 rounded-xl active:scale-95 transition-all">
          <Menu size={24} />
        </button>
      </header>

      {/* BACKDROP */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[50] lg:hidden" onClick={closeMenu}></div>
      )}

      {/* SIDEBAR */}
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
          <Link href="/admin" onClick={closeMenu} className={getMenuClass('/admin')}>
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link href="/admin/users" onClick={closeMenu} className={getMenuClass('/admin/users')}>
            <Users size={20} /> User Management
          </Link>
          <Link href="/admin/logs" onClick={closeMenu} className={getMenuClass('/admin/logs')}>
            <FileText size={20} /> Activity Logs
          </Link>
        </nav>

        {/* LOGOUT BUTTON DENGAN HOVER MERAH TEGAS */}
        <div className="p-4 border-t border-stone-50">
          <button 
            onClick={async () => {
              // Clear localStorage dulu sebelum logout
              if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
              }
              // logout dari Supabase
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
      <main className="flex-1 min-w-0 h-screen flex flex-col relative">
        <div className="flex-1 overflow-y-auto bg-[#FFFAF5]">
          <div className="h-16 lg:hidden"></div> 
          <div className="p-5 md:p-8 lg:p-12 lg:pt-10 max-w-6xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
      
    </div>
  );
}