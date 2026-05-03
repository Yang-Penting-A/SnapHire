"use client";

import React, { useState } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import Link from 'next/link';

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSearch = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="max-w-4xl mx-auto px-5 md:px-8 relative z-20 mt-8 md:-mt-10 mb-16 md:mb-20">
        <div className="bg-white p-5 md:p-2.5 rounded-3xl md:rounded-full shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row items-center gap-4 md:gap-2">
          
          {/* Input 1: Posisi */}
          <div className="flex items-center gap-3 px-2 md:px-4 py-2 w-full">
            <Search className="text-slate-400 shrink-0" size={20} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Posisi, skill, atau perusahaan..." 
              className="w-full bg-transparent outline-none text-sm placeholder:text-slate-400 text-slate-900"
            />
          </div>
          
          {/* Garis Pembatas */}
          <div className="hidden md:block w-px h-8 bg-slate-200 shrink-0"></div>
          <div className="md:hidden w-full h-px bg-slate-100"></div>
          
          {/* Input 2: Lokasi */}
          <div className="flex items-center gap-3 px-2 md:px-4 py-2 w-full">
            <MapPin className="text-slate-400 shrink-0" size={20} />
            <input 
              type="text" 
              placeholder="Lokasi (Jakarta, Remote...)" 
              className="w-full bg-transparent outline-none text-sm placeholder:text-slate-400 text-slate-900"
            />
          </div>
          
          {/* Tombol Cari - Memicu Pop-up */}
          <button 
            onClick={handleSearch}
            className="bg-blue-600 text-white px-8 py-3.5 md:py-3 rounded-2xl md:rounded-full text-sm font-semibold hover:bg-blue-700 w-full md:w-auto transition-colors mt-2 md:mt-0 whitespace-nowrap shrink-0"
          >
            Cari Sekarang
          </button>
        </div>
      </div>

      {/* MODAL POP-UP */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200 text-center">
            
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-5">
              <Search size={32} />
            </div>

            <h3 className="text-2xl font-bold text-slate-900 mb-3">Wah, Posisi Menarik!</h3>
            <p className="text-slate-600 mb-8 leading-relaxed">
              Ada <span className="font-bold text-blue-600">15+ lowongan</span> {searchQuery ? `untuk posisi "${searchQuery}"` : 'menarik'} menunggumu! Login dulu yuk untuk melihatnya secara detail.
            </p>

            <div className="flex flex-col gap-3">
              <Link href="/login" className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-xl hover:bg-blue-700 transition-colors">
                Login ke Akun
              </Link>
              <Link href="/login" className="w-full bg-white text-slate-700 border border-slate-200 font-semibold py-3.5 rounded-xl hover:bg-slate-50 transition-colors">
                Daftar Akun Baru
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}