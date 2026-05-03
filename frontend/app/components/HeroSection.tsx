import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="max-w-7xl mx-auto px-5 md:px-8 pt-10 md:pt-16 pb-16 md:pb-24 grid md:grid-cols-2 gap-12 items-center relative">
      
      <div className="flex flex-col gap-5 md:gap-6 z-10 text-center md:text-left items-center md:items-start">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.2] md:leading-[1.1] tracking-tight text-slate-900">
          Temukan Karir <br className="hidden md:block" />
          Impianmu di <br className="hidden md:block" />
          Perusahaan Kami
        </h1>
        <p className="text-slate-500 text-base md:text-lg leading-relaxed max-w-md">
          Cukup upload CV kamu satu kali, dan biarkan sistem cerdas kami mencocokkan profilmu dengan posisi terbaik yang tersedia.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 sm:gap-4 mt-4 w-full md:w-auto">
          <Link href="/login" className="text-center block w-full sm:w-auto whitespace-nowrap shrink-0 bg-blue-600 text-white px-8 py-3.5 rounded-full font-semibold hover:bg-blue-700 transition-shadow shadow-lg shadow-blue-600/20">
            Buat Akun Sekarang
          </Link>
          <Link href="/jobs" className="w-full sm:w-auto whitespace-nowrap shrink-0 bg-white text-slate-700 border border-slate-200 px-8 py-3.5 rounded-full font-semibold hover:bg-slate-50 transition-colors">
            Lihat Lowongan
          </Link>
        </div>
      </div>

      <div className="relative h-[400px] w-full hidden md:block">
        <div className="absolute right-0 top-0 w-4/5 h-4/5 bg-slate-100 rounded-3xl shadow-sm border border-white/50 -rotate-3 z-0"></div>
        <div className="absolute right-4 top-4 w-4/5 h-4/5 bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-50 p-6 z-10 flex flex-col gap-4">
           <div className="w-1/3 h-6 bg-slate-100 rounded-full"></div>
           <div className="flex gap-4">
             <div className="w-1/2 h-32 bg-slate-100 rounded-2xl"></div>
             <div className="w-1/2 h-32 bg-slate-100 rounded-2xl"></div>
           </div>
           <div className="w-full h-24 bg-slate-100 rounded-2xl"></div>
        </div>
        
        <div className="absolute -left-8 bottom-20 bg-white p-4 rounded-2xl shadow-xl border border-slate-50 flex items-center gap-4 z-20">
          <div className="bg-blue-50 p-2 rounded-full text-blue-600">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Terverifikasi</p>
            <p className="font-bold text-sm">1.2k+ Pelamar</p>
          </div>
        </div>
      </div>
    </section>
  );
}