"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="w-full px-5 md:px-8 py-4 md:py-6 flex items-center justify-between max-w-7xl mx-auto relative z-50">
      
      <div className="flex items-center cursor-pointer relative z-50">
        <Link href="/">
          <Image 
            src="/SmallLogo.png" 
            alt="snapHire Logo" 
            width={140} 
            height={36} 
            priority 
            className="w-auto h-7 md:h-10" 
          />
        </Link>
      </div>
      
      <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
        <a href="#" className="hover:text-blue-600 transition-colors">Cari Lowongan</a>
        <a href="#" className="hover:text-blue-600 transition-colors">Tips Karir</a>
      </nav>

      <div className="hidden md:flex items-center gap-4">
        <Link href="/login" className="text-sm font-semibold hover:text-blue-600 px-4">
          Login
        </Link>
        <Link href="/login" className="bg-blue-600 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-blue-700 transition-colors">
          Register
        </Link>
      </div>

      <button 
        className="md:hidden text-slate-900 hover:text-blue-600 transition-colors relative z-50"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {isMobileMenuOpen && (
        <div className="absolute top-[80px] left-5 right-5 bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 z-50 md:hidden flex flex-col gap-4 animate-in slide-in-from-top-4 fade-in duration-200">
          <nav className="flex flex-col gap-2 text-base font-medium text-slate-700">
            <a href="#" className="hover:text-blue-600 transition-colors py-3 border-b border-slate-50">Cari Lowongan</a>
            <a href="#" className="hover:text-blue-600 transition-colors py-3 border-b border-slate-50">Tips Karir</a>
          </nav>
          
          <div className="flex flex-col gap-3 mt-2">
            <Link href="/login" className="w-full border border-slate-200 text-slate-700 px-6 py-3.5 rounded-2xl text-sm font-semibold hover:bg-slate-50 transition-colors text-center block">
              Login
            </Link>
            <Link href="/login" className="w-full bg-blue-600 text-white px-6 py-3.5 rounded-2xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 text-center block">
              Register
            </Link>
          </div>
        </div>
      )}
      
    </header>
  );
}