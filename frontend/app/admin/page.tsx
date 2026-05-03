"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { Users, UserCheck, ShieldCheck, Briefcase, ArrowUpRight, TrendingUp, Loader2, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const [counts, setCounts] = useState({
    totalUsers: 0,
    totalCandidates: 0,
    totalHR: 0,
    totalJobs: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
        const { count: candidateCount } = await supabase.from('candidates').select('*', { count: 'exact', head: true });
        const { count: hrCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'hr');
        const { count: jobCount } = await supabase.from('jobs').select('*', { count: 'exact', head: true });

        setCounts({
          totalUsers: userCount || 0,
          totalCandidates: candidateCount || 0,
          totalHR: hrCount || 0,
          totalJobs: jobCount || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statsConfig = [
    { label: 'Total User', value: counts.totalUsers, icon: Users, color: 'bg-blue-600', light: 'bg-blue-50', text: 'text-blue-600' },
    { label: 'Pelamar', value: counts.totalCandidates, icon: UserCheck, color: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-600' },
    { label: 'Tim HR', value: counts.totalHR, icon: ShieldCheck, color: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-600' },
    { label: 'Lowongan', value: counts.totalJobs, icon: Briefcase, color: 'bg-purple-600', light: 'bg-purple-50', text: 'text-purple-600' },
  ];

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 size={32} className="text-blue-600 animate-spin" />
        <p className="font-black text-stone-400 uppercase tracking-widest text-[10px]">Sinkronisasi Data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-10 animate-in fade-in duration-500">
      
      {/* HEADER: Lebih rapat di mobile */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-1">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-stone-900 tracking-tight">Halo, Admin!</h1>
          <p className="text-stone-500 text-sm md:text-base font-medium">Ringkasan aktivitas snapHire hari ini.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-stone-100 shadow-sm">
          <TrendingUp size={16} className="text-emerald-500" />
          <span className="text-[11px] font-black text-stone-700 uppercase tracking-wider">Live System</span>
        </div>
      </div>

      {/* STATS GRID: 2 Kolom di mobile, 4 di desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {statsConfig.map((stat, index) => (
          <div key={index} className="bg-white p-4 md:p-6 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-center mb-4">
              <div className={`p-2.5 md:p-3 ${stat.light} ${stat.text} rounded-xl`}>
                <stat.icon size={20} className="md:w-6 md:h-6" />
              </div>
              <ArrowUpRight size={14} className="text-stone-300 md:hidden" />
            </div>
            <div>
              <p className="text-[10px] md:text-xs font-black text-stone-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-xl md:text-3xl font-black text-stone-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* BOTTOM SECTION: Stack di mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-stone-100 p-6 md:p-8 shadow-sm">
           <h2 className="text-lg font-black text-stone-900 mb-6 flex items-center gap-2">
             <Activity size={18} className="text-blue-600" /> Monitoring Aktivitas
           </h2>
           <div className="h-48 md:h-60 w-full bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center text-stone-400 gap-2">
             <p className="text-sm font-bold">Grafik sedang dipersiapkan...</p>
           </div>
        </div>
        
        <div className="bg-stone-900 rounded-[2rem] p-6 md:p-8 text-white">
           <h2 className="text-lg font-black mb-6">Quick Actions</h2>
           <div className="grid grid-cols-1 gap-2">
             <button className="w-full py-3.5 px-5 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm transition-all text-center">
               Kelola User
             </button>
             <button className="w-full py-3.5 px-5 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm transition-all text-center">
               Lihat Logs
             </button>
             <button className="w-full py-4 px-5 bg-blue-600 hover:bg-blue-500 rounded-xl font-black text-sm transition-all text-center mt-2">
               Buat Pengumuman
             </button>
           </div>
        </div>
      </div>

    </div>
  );
}