"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Efek transisi saat halaman di-scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/70 backdrop-blur-lg border-b border-slate-200/50 shadow-sm py-3 md:py-4' 
          : 'bg-white/40 backdrop-blur-md border-b border-transparent py-5 md:py-6'
      }`}
    >
      <div className="w-full px-5 md:px-8 flex items-center justify-between max-w-7xl mx-auto relative z-50">
        
        {/* LOGO */}
        <div className="flex items-center cursor-pointer relative z-50">
          <Link href="/">
            <Image 
              src="/SmallLogo.png" 
              alt="snapHire Logo" 
              width={140} 
              height={36} 
              priority 
              className="w-auto h-7 md:h-9 transition-all duration-300 hover:opacity-90" 
            />
          </Link>
        </div>
        
        {/* DESKTOP NAV */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600">
          <a href="#" className="hover:text-blue-600 transition-colors">Cari Lowongan</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Tips Karir</a>
        </nav>

        {/* DESKTOP ACTIONS */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-blue-600 px-4 transition-colors">
            Login
          </Link>
          <Link href="/login" className="bg-blue-600 text-white px-7 py-3 rounded-full text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 active:scale-95 transition-all">
            Register
          </Link>
        </div>

        {/* MOBILE MENU TOGGLE */}
        <button 
          className="md:hidden text-slate-800 hover:text-blue-600 transition-colors relative z-50 bg-white/50 p-2 rounded-xl backdrop-blur-md"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

      </div>

      {/* MOBILE MENU BACKDROP */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* MOBILE MENU DROPDOWN */}
      {isMobileMenuOpen && (
        <div className="fixed top-[80px] left-5 right-5 bg-white/95 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-slate-100 z-50 md:hidden flex flex-col gap-4 animate-in slide-in-from-top-8 fade-in duration-300">
          <nav className="flex flex-col gap-2 text-base font-bold text-slate-700">
            <a href="#" className="hover:text-blue-600 transition-colors py-3 border-b border-slate-100/50">Cari Lowongan</a>
            <a href="#" className="hover:text-blue-600 transition-colors py-3 border-b border-slate-100/50">Tips Karir</a>
          </nav>
          
          <div className="flex flex-col gap-3 mt-4">
            <Link href="/login" className="w-full border-2 border-slate-100 text-slate-700 px-6 py-4 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-colors text-center block">
              Login
            </Link>
            <Link href="/login" className="w-full bg-blue-600 text-white px-6 py-4 rounded-2xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 text-center block">
              Register
            </Link>
          </div>
        </div>
      )}
      
    </header>
  );
}