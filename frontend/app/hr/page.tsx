"use client";

import React, { useState, useEffect } from 'react';
import { Users, Briefcase, FileCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, 
  BarChart, Bar 
} from 'recharts';

export default function HRDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [dataStats, setDataStats] = useState({
    totalKandidat: 0,
    lowonganAktif: 0,
    cvTerproses: 0
  });
  const [chartDataTren, setChartDataTren] = useState<{tanggal: string, pelamar: number}[]>([]);
  const [chartDataPosisi, setChartDataPosisi] = useState<{posisi: string, jumlah: number}[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const { count: countKandidat } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'applicant');
        const { count: countJobs } = await supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status_job', 'active');
        const { count: countCV } = await supabase.from('applications').select('*', { count: 'exact', head: true }).not('ai_score', 'is', null);

        setDataStats({
          totalKandidat: countKandidat || 0,
          lowonganAktif: countJobs || 0,
          cvTerproses: countCV || 0
        });

        const { data: trendData } = await supabase.from('applications').select('created_at');
        
        const processTrend = trendData?.reduce((acc: any, curr) => {
          const date = new Date(curr.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {});

        const formattedTrend = Object.keys(processTrend || {}).map(key => ({
          tanggal: key,
          pelamar: processTrend[key]
        })).slice(-7);

        setChartDataTren(formattedTrend.length > 0 ? formattedTrend : [{tanggal: 'No Data', pelamar: 0}]);

        const { data: positionData } = await supabase.from('applications').select(`job_id, jobs ( title )`);

        const processPos = positionData?.reduce((acc: any, curr: any) => {
          const title = curr.jobs?.title || 'Unknown';
          acc[title] = (acc[title] || 0) + 1;
          return acc;
        }, {});

        const formattedPos = Object.keys(processPos || {}).map(key => ({
          posisi: key,
          jumlah: processPos[key]
        })).sort((a, b) => b.jumlah - a.jumlah).slice(0, 5);

        setChartDataPosisi(formattedPos.length > 0 ? formattedPos : [{posisi: 'No Data', jumlah: 0}]);

      } catch (error) {
        console.error("Gagal mengambil data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // List Stats 
  const stats = [
    { title: "Total Kandidat", value: dataStats.totalKandidat, icon: <Users size={24} className="text-blue-600" />, bg: "bg-blue-50" },
    { title: "Lowongan Aktif", value: dataStats.lowonganAktif, icon: <Briefcase size={24} className="text-emerald-600" />, bg: "bg-emerald-50" },
    { title: "CV Terproses AI", value: dataStats.cvTerproses, icon: <FileCheck size={24} className="text-orange-600" />, bg: "bg-orange-50" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight uppercase">Dashboard</h1>
          <p className="text-stone-500 mt-1 font-medium italic">Ringkasan aktivitas rekrutmen snapHire hari ini.</p>
        </div>
      </div>

      {/* CARDS - Diubah ke grid-cols-3 agar simetris */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-[32px] p-8 border border-stone-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-[10px] font-black text-stone-400 mb-2 uppercase tracking-widest">{stat.title}</p>
                {isLoading ? (
                  <Loader2 size={28} className="text-stone-200 animate-spin mt-2" />
                ) : (
                  <h3 className="text-4xl font-black text-stone-800 tracking-tighter group-hover:text-blue-600 transition-colors">{stat.value}</h3>
                )}
              </div>
              <div className={`p-4 rounded-2xl ${stat.bg} transition-transform group-hover:scale-110`}>{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* SECTION STATISTIK */}
      <div className="pt-4">
        <h2 className="text-2xl font-black text-stone-800 mb-6 uppercase tracking-tight">Statistik Rekrutmen</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* GRAFIK 1: AREA CHART */}
          <div className="bg-white rounded-[40px] p-8 border border-stone-100 shadow-sm h-[400px] flex flex-col">
            <h3 className="text-sm font-black text-stone-400 uppercase tracking-widest mb-8">Grafik Tren Pelamar Harian</h3>
            <div className="flex-1 w-full h-full min-h-0">
              {isLoading ? (
                <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-stone-300" /></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartDataTren} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPelamar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                    <XAxis dataKey="tanggal" axisLine={false} tickLine={false} tick={{fill: '#a8a29e', fontSize: 11, fontWeight: 700}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#a8a29e', fontSize: 11, fontWeight: 700}} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                    />
                    <Area type="monotone" dataKey="pelamar" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorPelamar)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* GRAFIK 2: BAR CHART */}
          <div className="bg-white rounded-[40px] p-8 border border-stone-100 shadow-sm h-[400px] flex flex-col">
            <h3 className="text-sm font-black text-stone-400 uppercase tracking-widest mb-8">Posisi Paling Diminati</h3>
            <div className="flex-1 w-full h-full min-h-0">
              {isLoading ? (
                <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-stone-300" /></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataPosisi} margin={{ top: 10, right: 30, left: 20, bottom: 10 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f5f5f4" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#a8a29e', fontSize: 11, fontWeight: 700}} />
                    <YAxis 
                      dataKey="posisi" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#44403c', fontSize: 10, fontWeight: 800}} 
                      width={100} 
                    />
                    <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '20px', border: 'none' }} />
                    <Bar dataKey="jumlah" fill="#3b82f6" radius={[0, 12, 12, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}