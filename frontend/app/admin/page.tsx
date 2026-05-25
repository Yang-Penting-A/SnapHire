"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // 🔥 IMPORT: Untuk navigasi tombol pintasan
import { supabase } from '@/app/lib/supabase';
import { 
  Users, Briefcase, Brain, Star, BarChart3, 
  TrendingUp, Award, Layers, Loader2, RefreshCw,
  UserPlus, Megaphone, ArrowUpRight // Icon pelengkap pintasan
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter(); // Inisialisasi router
  const [isLoading, setIsLoading] = useState(true);
  
  // State data ringkasan angka (Counter Cards)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalJobs: 0,
    totalApplicants: 0,
    avgAiScore: 0
  });

  // State data grafik Funnel Status Pelamar
  const [funnelData, setFunnelData] = useState<any>({
    reviewAI: 0,
    shortlisted: 0,
    interview: 0,
    techTest: 0,
    hired: 0,
    rejected: 0
  });

  // State data grafik AI Match Score Distribution
  const [aiDistribution, setAiDistribution] = useState({
    high: 0,   // 80 - 100%
    medium: 0, // 50 - 79%
    low: 0     // < 50%
  });

  // State data Leaderboard Tim HR Teraktif
  const [hrLeaderboard, setHrLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardAnalytics();
  }, []);

  const loadDashboardAnalytics = async () => {
    setIsLoading(true);
    try {
      // 1. FETCH TOTAL DATA COUNTER
      const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
      const { count: jobCount } = await supabase.from('jobs').select('*', { count: 'exact', head: true });
      
      // 2. FETCH DATA APLIKASI PELAMAR
      const { data: apps, error: appsError } = await supabase
        .from('applications')
        .select('ai_score, status_application');
      
      if (appsError) throw appsError;

      let totalScore = 0;
      let validScoreCount = 0;
      
      const funnel = { reviewAI: 0, shortlisted: 0, interview: 0, techTest: 0, hired: 0, rejected: 0 };
      const dist = { high: 0, medium: 0, low: 0 };

      if (apps && apps.length > 0) {
        apps.forEach((app) => {
          if (app.ai_score !== null && app.ai_score !== undefined) {
            totalScore += app.ai_score;
            validScoreCount++;

            if (app.ai_score >= 80) dist.high++;
            else if (app.ai_score >= 50) dist.medium++;
            else dist.low++;
          }

          const status = app.status_application?.toLowerCase();
          if (status === 'review ai') funnel.reviewAI++;
          else if (status === 'shortlisted') funnel.shortlisted++;
          else if (status === 'interview') funnel.interview++;
          else if (status === 'technical test') funnel.techTest++;
          else if (status === 'hired') funnel.hired++;
          else if (status === 'rejected') funnel.rejected++;
        });
      }

      // 3. FETCH LEADERBOARD HR
      const { data: logs } = await supabase
        .from('activity_logs')
        .select(`
          user_id,
          users ( name, email )
        `);

      const hrMap: Record<string, { name: string; email: string; count: number }> = {};
      
      if (logs) {
        logs.forEach((log: any) => {
          if (log.user_id && log.users) {
            const hrId = log.user_id;
            if (!hrMap[hrId]) {
              hrMap[hrId] = {
                name: log.users.name || 'HR Team',
                email: log.users.email || '',
                count: 0
              };
            }
            hrMap[hrId].count++;
          }
        });
      }

      const sortedLeaderboard = Object.values(hrMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setStats({
        totalUsers: userCount || 0,
        totalJobs: jobCount || 0,
        totalApplicants: apps?.length || 0,
        avgAiScore: validScoreCount > 0 ? Math.round(totalScore / validScoreCount) : 0
      });
      setFunnelData(funnel);
      setAiDistribution(dist);
      setHrLeaderboard(sortedLeaderboard);

    } catch (err) {
      console.error("[ANALYTICS ERROR]:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[75vh] flex flex-col items-center justify-center gap-4 animate-in fade-in">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-stone-400 font-bold text-xs uppercase tracking-widest">Mengkalkulasi Matriks Data...</p>
      </div>
    );
  }

  const maxFunnelValue = Math.max(...Object.values(funnelData) as number[], 1);
  const totalAiDist = (aiDistribution.high + aiDistribution.medium + aiDistribution.low) || 1;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER DASHBOARD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">System Overview</h1>
          <p className="text-stone-500 font-medium mt-1">Metrik performa mesin kecerdasan buatan dan produktivitas snapHire</p>
        </div>
        <button 
          onClick={loadDashboardAnalytics}
          className="flex items-center gap-2 px-5 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-2xl font-bold text-sm transition-all active:scale-95 self-end sm:self-center"
        >
          <RefreshCw size={16} /> Refresh Data
        </button>
      </div>

      {/* BLOCK 1: COUNTER CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-xl shadow-stone-200/20 flex items-center gap-5">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <Users size={28} />
          </div>
          <div>
            <p className="text-stone-400 font-black text-[10px] uppercase tracking-wider">Total Pelamar</p>
            <h3 className="text-2xl font-black text-stone-900 mt-0.5">{stats.totalApplicants} <span className="text-xs font-bold text-stone-400">Berkas</span></h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-xl shadow-stone-200/20 flex items-center gap-5">
          <div className="w-14 h-14 bg-purple-50 text-purple-700 rounded-2xl flex items-center justify-center shrink-0">
            <Briefcase size={28} />
          </div>
          <div>
            <p className="text-stone-400 font-black text-[10px] uppercase tracking-wider">Lowongan Dibuka</p>
            <h3 className="text-2xl font-black text-stone-900 mt-0.5">{stats.totalJobs} <span className="text-xs font-bold text-stone-400">Posisi</span></h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-xl shadow-stone-200/20 flex items-center gap-5">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center shrink-0">
            <Brain size={28} />
          </div>
          <div>
            <p className="text-stone-400 font-black text-[10px] uppercase tracking-wider">Avg AI Match Score</p>
            <h3 className="text-2xl font-black text-stone-900 mt-0.5">{stats.avgAiScore}%</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-xl shadow-stone-200/20 flex items-center gap-5">
          <div className="w-14 h-14 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center shrink-0">
            <Award size={28} />
          </div>
          <div>
            <p className="text-stone-400 font-black text-[10px] uppercase tracking-wider">Internal Team</p>
            <h3 className="text-2xl font-black text-stone-900 mt-0.5">{stats.totalUsers} <span className="text-xs font-bold text-stone-400">Akun</span></h3>
          </div>
        </div>
      </div>

      {/* 🔥 KOTAK PINTASAN (QUICK ACTIONS PANEL) - SUDAH DIUBAH KE TEMA TERANG */}
      <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-stone-100 shadow-xl shadow-stone-200/30 relative overflow-hidden group">
        {/* Efek glow biru di pojok kanan atas tetep dipertahankan biar manis */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em]">Quick Actions</h2>
            <p className="text-lg font-bold text-stone-900 mt-1">Pintasan Akses Cepat Administrator</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pintasan A: Tambah User */}
            <button 
              type="button"
              onClick={() => router.push('/admin/users?tab=create')} 
              className="flex items-center justify-between p-5 bg-stone-50/60 hover:bg-stone-50 rounded-2xl border border-stone-100 hover:border-blue-300 transition-all text-left active:scale-[0.99] group/btn"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover/btn:bg-blue-600 group-hover/btn:text-white transition-all shadow-inner border border-blue-100 group-hover/btn:border-transparent">
                  <UserPlus size={22} />
                </div>
                <div>
                  <h4 className="font-black text-sm text-stone-900">Registrasi HR Baru</h4>
                  <p className="text-stone-500 text-xs font-medium mt-0.5">Buka manajemen hak akses tim rekrutmen</p>
                </div>
              </div>
              <ArrowUpRight size={18} className="text-stone-300 group-hover/btn:text-blue-600 transition-colors mr-1" />
            </button>

            {/* Pintasan B: Buat Pengumuman */}
            <button 
              type="button"
              onClick={() => router.push('/admin/announcements')} 
              className="flex items-center justify-between p-5 bg-stone-50/60 hover:bg-stone-50 rounded-2xl border border-stone-100 hover:border-purple-300 transition-all text-left active:scale-[0.99] group/btn"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center group-hover/btn:bg-purple-600 group-hover/btn:text-white transition-all shadow-inner border border-purple-100 group-hover/btn:border-transparent">
                  <Megaphone size={22} />
                </div>
                <div>
                  <h4 className="font-black text-sm text-stone-900">Siarkan Pengumuman</h4>
                  <p className="text-stone-500 text-xs font-medium mt-0.5">Buat info siaran broadcast untuk seluruh HR</p>
                </div>
              </div>
              <ArrowUpRight size={18} className="text-stone-300 group-hover/btn:text-purple-600 transition-colors mr-1" />
            </button>
          </div>
        </div>
      </div>

      {/* BLOCK 3: VISUAL ANALYTICS GRAPHICS CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* CHART A: FUNNEL TAHAPAN REKRUTMEN */}
        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-stone-100 shadow-xl shadow-stone-200/30 space-y-6">
          <div className="flex items-center gap-3">
            <Layers className="text-blue-600" size={22} />
            <h2 className="text-lg font-black text-stone-900 tracking-tight">Recruitment Funnel Stage</h2>
          </div>
          
          <div className="space-y-4 pt-2">
            {[
              { label: 'Review AI', count: funnelData.reviewAI, color: 'bg-stone-400' },
              { label: 'Shortlisted', count: funnelData.shortlisted, color: 'bg-blue-600' },
              { label: 'Interview', count: funnelData.interview, color: 'bg-purple-600' },
              { label: 'Technical Test', count: funnelData.techTest, color: 'bg-orange-500' },
              { label: 'Hired', count: funnelData.hired, color: 'bg-emerald-500' },
              { label: 'Rejected', count: funnelData.rejected, color: 'bg-rose-500' }
            ].map((stage) => {
              const widthPct = Math.max((stage.count / maxFunnelValue) * 100, 3);
              return (
                <div key={stage.label} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-stone-600">
                    <span className="uppercase tracking-wider text-[10px] text-stone-400 font-black">{stage.label}</span>
                    <span>{stage.count} Pelamar</span>
                  </div>
                  <div className="w-full h-3 bg-stone-50 rounded-full overflow-hidden border border-stone-100/50">
                    <div 
                      className={`h-full ${stage.color} rounded-full transition-all duration-1000`} 
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHART B: DISTRIBUSI INTEGRASI AI SCORE METER */}
        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-stone-100 shadow-xl shadow-stone-200/30 flex flex-col justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <BarChart3 className="text-blue-600" size={22} />
              <h2 className="text-lg font-black text-stone-900 tracking-tight">AI Match Score Distribution</h2>
            </div>
            <p className="text-stone-400 text-xs font-medium">Pengelompokan kandidat berdasarkan tingkat akurasi kecerdasan AI.</p>
          </div>

          <div className="space-y-6 py-4">
            <div className="w-full h-8 bg-stone-100 rounded-xl overflow-hidden flex shadow-inner">
              <div 
                className="bg-emerald-500 h-full transition-all duration-1000" 
                style={{ width: `${(aiDistribution.high / totalAiDist) * 100}%` }}
                title={`High Match: ${aiDistribution.high}`}
              />
              <div 
                className="bg-amber-400 h-full transition-all duration-1000" 
                style={{ width: `${(aiDistribution.medium / totalAiDist) * 100}%` }}
                title={`Medium Match: ${aiDistribution.medium}`}
              />
              <div 
                className="bg-stone-300 h-full transition-all duration-1000" 
                style={{ width: `${(aiDistribution.low / totalAiDist) * 100}%` }}
                title={`Low Match: ${aiDistribution.low}`}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                <div className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase">
                  <Star size={12} className="fill-emerald-600" /> High (≥80%)
                </div>
                <p className="text-stone-900 font-black text-lg mt-1">{aiDistribution.high} <span className="text-[10px] font-bold text-stone-400">CV</span></p>
              </div>

              <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                <div className="flex items-center gap-1.5 text-amber-500 font-black text-[10px] uppercase">
                  <Star size={12} className="fill-amber-500" /> Med (50-79%)
                </div>
                <p className="text-stone-900 font-black text-lg mt-1">{aiDistribution.medium} <span className="text-[10px] font-bold text-stone-400">CV</span></p>
              </div>

              <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                <div className="flex items-center gap-1.5 text-stone-400 font-black text-[10px] uppercase">
                  <Star size={12} className="fill-stone-400" /> Low (&lt;50%)
                </div>
                <p className="text-stone-900 font-black text-lg mt-1">{aiDistribution.low} <span className="text-[10px] font-bold text-stone-400">CV</span></p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 flex items-start gap-3">
            <TrendingUp className="text-blue-600 shrink-0 mt-0.5" size={16} />
            <p className="text-blue-900 text-xs font-bold leading-relaxed">
              Sistem mendeteksi mayoritas kandidat berada pada kluster kualifikasi tingkat <span className="underline decoration-wavy decoration-blue-500">
                {aiDistribution.high >= aiDistribution.medium && aiDistribution.high >= aiDistribution.low ? 'Tinggi (High)' : aiDistribution.medium >= aiDistribution.low ? 'Menengah (Medium)' : 'Rendah (Low)'}
              </span>.
            </p>
          </div>
        </div>

      </div>

      {/* BLOCK 4: STAFF PRODUCTIVITY LEADERBOARD */}
      <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-stone-100 shadow-xl shadow-stone-200/30">
        <div className="mb-6">
          <h2 className="text-xl font-black text-stone-900 tracking-tight uppercase">HR Recruiter Performance Leaderboard</h2>
          <p className="text-stone-400 text-xs font-medium mt-1">Daftar anggota tim HR paling aktif berdasarkan kalkulasi riwayat log sistem publik.</p>
        </div>

        {hrLeaderboard.length === 0 ? (
          <div className="p-12 text-center text-stone-400 font-bold text-xs bg-stone-50 rounded-2xl border border-dashed border-stone-200 uppercase">
            Belum ada aktivitas terekam dari tim HR.
          </div>
        ) : (
          <div className="space-y-4">
            {hrLeaderboard.map((hr, idx) => (
              <div key={hr.email} className="flex items-center justify-between p-4 bg-stone-50/60 rounded-2xl border border-stone-100 hover:bg-stone-50 transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-stone-900 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                    #{idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-stone-900 font-black text-sm truncate">{hr.name}</p>
                    <p className="text-stone-400 text-xs font-bold truncate">{hr.email}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl text-xs font-black">
                    {hr.count} Actions
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}