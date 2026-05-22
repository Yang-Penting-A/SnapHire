"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import { 
  Users, Briefcase, FileCheck, Calendar, Sparkles, TrendingUp, 
  Clock, Plus, ScanSearch, Target, UserMinus, Loader2, ArrowRight, CheckCircle2, Megaphone
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

export default function HRDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  
  // Stats State
  const [stats, setStats] = useState({
    totalCandidates: 0,
    activeJobs: 0,
    aiProcessed: 0,
    interviewsToday: 0,
    avgAiScore: 0,
    offerRate: 0,
    timeToHire: 14,
    rejectedCount: 0,
    weeklyCandidates: 0
  });

  // Data Lists State
  const [pipeline, setPipeline] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [topPositions, setTopPositions] = useState<any[]>([]);
  const [recentCandidates, setRecentCandidates] = useState<any[]>([]);
  const [activeJobsList, setActiveJobsList] = useState<any[]>([]);
  const [interviewSchedule, setInterviewSchedule] = useState<any[]>([]);
  const lastRealtimeRefreshRef = useRef(0);

  const normalizeStatus = (status?: string) => {
    return String(status || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');
  };

  const statusMatches = (actualStatus?: string, expectedStatus?: string) => {
    const actual = normalizeStatus(actualStatus);
    const expected = normalizeStatus(expectedStatus);

    if (!actual || !expected) {
      return false;
    }

    return actual === expected || actual.includes(expected) || expected.includes(actual);
  };

  const fetchDashboardData = useCallback(async (isBackgroundRefresh = false) => {
    if (!isBackgroundRefresh) {
      setIsLoading(true);
    }

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const lastWeekDate = new Date();
      lastWeekDate.setDate(lastWeekDate.getDate() - 7);

      // 1. FETCH DATA (Ambil semua jobs tanpa filter status 'active' saja untuk analisis)
      const [kandidatRes, jobsRes, appsRes, announcementsRes] = await Promise.all([
        supabase.from('candidates').select('*', { count: 'exact', head: true }),
        supabase.from('jobs').select('job_id, title, status_job, due_date, created_at, applications(count)'),
        supabase.from('applications').select(`
          application_id, status_application, ai_score, created_at,
          confirmation_status, interview_date, interview_location, interview_meeting_link,
          candidates(name), jobs(title)
        `).order('created_at', { ascending: false }),
        supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(3)
      ]);

      // FIX: Handle retry query properly - ensure allApps has data even if first query fails
      let allApps: any[] = [];
      let allJobs = jobsRes.data || [];

      if (appsRes.error) {
        // Retry applications query if initial failed
        const { data: retryData, error: retryError } = await supabase.from('applications').select(`
          application_id, status_application, ai_score, created_at,
          confirmation_status, interview_date, interview_location, interview_meeting_link,
          candidates(name), jobs(title)
        `);
        allApps = retryError ? [] : (retryData || []);
        if (retryError) console.warn("Applications fetch retry failed:", retryError);
      } else {
        allApps = appsRes.data || [];
      }

      // 2. CALCULATE KPI STATS
      // Filter untuk angka kartu (yang benar-benar aktif)
      const trulyActiveJobsCount = allJobs.filter(j => j.status_job === 'active' && (!j.due_date || j.due_date >= todayStr)).length;
      
      const scores = allApps.map(a => a.ai_score).filter(s => s !== null) as number[];
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      const rejected = allApps.filter(a => statusMatches(a.status_application, 'Rejected')).length;
      const hiredCount = allApps.filter(a => statusMatches(a.status_application, 'Hired')).length;
      const todayInterviews = allApps.filter(a =>
        statusMatches(a.status_application, 'Interview') ||
        Boolean(a.interview_date) ||
        Boolean(a.confirmation_status)
      );
      const latestInterviews = [...todayInterviews].sort((a, b) => {
        const aSortValue = new Date(a.interview_date || a.created_at || 0).getTime();
        const bSortValue = new Date(b.interview_date || b.created_at || 0).getTime();
        return bSortValue - aSortValue;
      });

      // 3. RECRUITMENT PIPELINE
      const stages = [
        { label: 'Review', key: 'Review AI', color: '#bcbec1' },
        { label: 'Screening', key: 'Shortlisted', color: '#60A5FA' },
        { label: 'Interview', key: 'Interview', color: '#8b5cf6' },
        { label: 'Technical Test', key: 'Technical Test', color: '#f59e0b' },
        { label: 'Hired', key: 'Hired', color: '#10b981' },
        { label: 'Rejected', key: 'Rejected', color: '#ef4444' }
      ];
      
      const pipelineMapped = stages.map(s => ({
        name: s.label,
        count: allApps.filter(a => statusMatches(a.status_application, s.key)).length,
        color: s.color
      }));

      // 4. TREND PELAMAR (Last 7 Days)
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date(); d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        return {
          date: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
          count: allApps.filter(a => a.created_at.startsWith(dateStr)).length,
        };
      }).reverse();

      // ANALISIS: Gunakan allJobs (Active + Expired)
      const sortedPositions = [...allJobs]
        .map(j => ({ name: j.title, count: (j.applications as any)[0]?.count || 0 }))
        .sort((a, b) => b.count - a.count).slice(0, 5);

      const weeklyCandidates = allApps.filter(app => {
        return new Date(app.created_at) >= lastWeekDate;
      }).length;

      setStats({
        totalCandidates: kandidatRes.count || 0,
        activeJobs: trulyActiveJobsCount,
        aiProcessed: scores.length,
        interviewsToday: todayInterviews.length,
        avgAiScore: avgScore,
        offerRate: Math.round((hiredCount / Math.max(1, allApps.length)) * 100),
        timeToHire: 14,
        rejectedCount: rejected,
        weeklyCandidates
      });

      setPipeline(pipelineMapped);
      setTrendData(last7Days);
      setTopPositions(sortedPositions);
      setRecentCandidates(allApps.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5));
      setActiveJobsList(allJobs.slice(0, 5));
      setInterviewSchedule(latestInterviews.slice(0, 4));
      setAnnouncements(announcementsRes.data || []);

    } catch (err) {
      console.error("Dashboard Sync Error:", err);
    } finally {
      if (!isBackgroundRefresh) {
        setIsLoading(false);
      }
    }
  }, []);

  // FIX: Empty dependency array to avoid infinite re-runs since fetchDashboardData is stable via useCallback
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // FIX: Empty dependency array to prevent stale event listener references
  // fetchDashboardData is stable via useCallback, no need to re-attach listeners
  useEffect(() => {
    const handleRealtimeApplicant = (event: Event) => {
      const now = Date.now();
      if (now - lastRealtimeRefreshRef.current < 300) {
        return;
      }

      lastRealtimeRefreshRef.current = now;
      console.log('Dashboard refresh triggered from realtime event');
      console.log(event.type);
      fetchDashboardData(true);
    };

    window.addEventListener('snaphire:new-applicant', handleRealtimeApplicant);
    window.addEventListener('snaphire:hr-applicant-updated', handleRealtimeApplicant);

    const handleWindowFocus = () => {
      fetchDashboardData(true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchDashboardData(true);
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('snaphire:new-applicant', handleRealtimeApplicant);
      window.removeEventListener('snaphire:hr-applicant-updated', handleRealtimeApplicant);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // FIX: Empty dependency array for realtime subscription
  // This prevents unnecessary unsubscribe/resubscribe and potential data loss
  useEffect(() => {
    const channel = supabase
      .channel('hr-dashboard-applications-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'applications' },
        () => {
          fetchDashboardData(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="text-blue-600 animate-spin" />
        <p className="text-stone-400 font-black uppercase tracking-widest text-[10px]">Menyusun Dashboard Real-Time...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden">
      
      {/* FIXED HEADER */}
      <div className="shrink-0 bg-[#FFFAF5]/80 backdrop-blur-md px-4 pb-6 pt-2 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-100/50">
        <div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight uppercase">Dashboard HR</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-stone-500 font-medium text-md flex items-center gap-2">
              snapHire — {today}
            </p>
            <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full uppercase border border-emerald-100 shadow-sm">Sistem Aktif</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.push('/hr/scan-cv')} className="bg-white border border-stone-200 hover:border-blue-600 text-stone-700 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 shadow-sm">
            <ScanSearch size={18} /> Scan CV AI
          </button>
          <button onClick={() => router.push('/hr/jobs')} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-600/20">
            <Plus size={18} strokeWidth={3} /> Lowongan Baru
          </button>
        </div>
      </div>

      {/* WORKSPACE AREA SCROLLABLE */}
      <div className="flex-1 overflow-y-auto px-4 py-8 space-y-12 custom-scrollbar">
        
        {/* PAPAN PENGUMUMAN DARI ADMIN */}
        {announcements.length > 0 && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50/20 p-6 md:p-8 rounded-[2.5rem] border border-amber-100/70 shadow-inner space-y-5 animate-in slide-in-from-top duration-500">
            <div className="flex items-center gap-2.5 text-amber-800">
              <Megaphone size={18} className="animate-bounce" />
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em]">Papan Pengumuman Internal Admin</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {announcements.map((ann: any) => (
                <div key={ann.id} className="bg-white p-5 rounded-2xl border border-amber-100/50 shadow-sm space-y-3 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="space-y-1">
                    <h3 className="font-black text-stone-900 text-sm tracking-tight truncate">{ann.title}</h3>
                    <p className="text-stone-600 text-xs font-medium line-clamp-3 leading-relaxed whitespace-pre-line">{ann.content}</p>
                  </div>
                  <span className="text-[9px] font-black text-stone-400 uppercase tracking-wider block pt-1">
                    📢 {new Date(ann.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ROW 1: KPI CARDS */}
        <div className="space-y-5">
          <h2 className="text-[11px] font-black text-stone-400 uppercase tracking-[0.3em] ml-1">Ringkasan Hari Ini</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard label="Total Pelamar" value={stats.totalCandidates} sub={`+${stats.weeklyCandidates} minggu ini`} color="blue" />
            <StatCard label="Lowongan Aktif" value={stats.activeJobs} sub="Posisi sedang dibuka" color="emerald" />
            <StatCard label="CV Diproses AI" value={stats.aiProcessed} sub={`${Math.round((stats.aiProcessed/Math.max(1, stats.totalCandidates))*100)}% dari total`} color="orange" />
            <StatCard label="Jadwal Interview" value={stats.interviewsToday} sub="Kandidat terpilih" color="purple" />
          </div>
        </div>

        {/* ROW 2: PIPELINE REKRUTMEN */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-10">
            <h3 className="font-black text-stone-900 uppercase text-[12px] tracking-[0.2em] flex items-center gap-3">
              <TrendingUp size={20} className="text-blue-600" /> Pipeline Rekrutmen Aktif
            </h3>
            <p className="text-stone-700 text-[10px] font-black uppercase bg-stone-100 px-4 py-1.5 rounded-full border border-stone-100">Total {stats.totalCandidates} Pelamar</p>
          </div>
          
          <div className="flex w-full h-12 rounded-2xl gap-0.5 mb-6 border border-stone-50 p-1 bg-stone-50 relative">
            {pipeline.map((stage: any, i: number) => (
              <div 
                key={i} 
                style={{ width: `${(stage.count / Math.max(1, stats.totalCandidates)) * 100}%`, backgroundColor: stage.color }}
                className={`h-full flex items-center justify-center text-white font-black text-xs transition-all hover:brightness-110 group relative cursor-pointer
                  ${i === 0 ? 'rounded-l-xl' : ''} 
                  ${i === pipeline.length - 1 ? 'rounded-r-xl' : ''}
                `}
              >
                {stage.count > 0 && <span>{stage.count}</span>}
                <div className="absolute bottom-full mb-3 hidden group-hover:block bg-stone-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap z-[100] shadow-xl">
                    {stage.name}: {stage.count} Pelamar
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-2">
            {pipeline.map((stage: any, i: number) => (
               <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stage.color }}></div>
                  <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">{stage.name} ({stage.count})</span>
               </div>
            ))}
          </div>
        </div>

        {/* ROW 3: CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartBox title="Tren Pelamar (7 Hari Terakhir)">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                        <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: '900', fill: '#a8a29e'}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: '900', fill: '#a8a29e'}} />
                        <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                        <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={5} fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                </ResponsiveContainer>
            </ChartBox>

            <ChartBox title="Posisi Dengan Pelamar Terbanyak">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topPositions} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: '900', fill: '#57534e'}} width={110} />
                        <Tooltip cursor={{fill: '#f8fafc'}} />
                        <Bar dataKey="count" radius={[0, 10, 10, 0]} barSize={28} fill="#3b82f6" />
                    </BarChart>
                </ResponsiveContainer>
            </ChartBox>
        </div>

        {/* ROW 4: DATA METRICS & TABLES */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="space-y-4">
                <h3 className="text-[11px] font-black text-stone-400 uppercase tracking-widest ml-1 mb-4">Metrik Kualitas</h3>
                <QualityMini label="Avg Time-to-hire" value={`${stats.timeToHire} Hari`} trend="-2 hari" icon={<Clock />} />
                <QualityMini label="Avg AI Score" value={`${stats.avgAiScore}%`} trend="+4% QoQ" icon={<Sparkles />} />
                <QualityMini label="Success Rate" value={`${stats.offerRate}%`} trend="Target 80%" icon={<Target />} />
                <QualityMini label="Rejected" value={stats.rejectedCount} trend="+3 hari ini" icon={<UserMinus />} />
            </div>

            <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="font-black text-stone-900 uppercase text-[11px] tracking-[0.2em] mb-8">Kandidat Terbaru</h3>
                <div className="space-y-6">
                    {recentCandidates.length > 0 ? recentCandidates.map((c: any, i: number) => (
                        <div key={i} className="flex items-center justify-between group cursor-pointer" onClick={() => router.push(`/hr/applicants/${c.application_id}`)}>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm border border-blue-100 transition-transform group-hover:scale-110">
                                    {c.candidates?.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-black text-stone-800 text-sm leading-tight group-hover:text-blue-600 transition-colors">{c.candidates?.name}</p>
                                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-tight mt-1">{c.jobs?.title}</p>
                                </div>
                            </div>
                            <span className={`text-[9px] font-black px-3 py-1.5 rounded-xl uppercase border ${getStatusBadgeColor(c.status_application)}`}>
                                {c.status_application}
                            </span>
                        </div>
                    )) : <p className="text-center text-stone-400 font-bold py-10">Belum ada pelamar.</p>}
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="font-black text-stone-900 uppercase text-[11px] tracking-[0.2em] mb-8 text-center">Status Lowongan</h3>
                <div className="space-y-7">
                  {activeJobsList.map((j: any, i: number) => (
                    <div key={i} className="space-y-2.5">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase">
                        <span className="text-stone-800 truncate w-2/3">● {j.title}</span>
                        <span className="text-blue-600">{(j.applications as any)[0]?.count || 0} Pelamar</span>
                      </div>
                      <div className="w-full h-2 bg-stone-50 rounded-full overflow-hidden shadow-inner">
                        <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" style={{ width: `${Math.min(((j.applications as any)[0]?.count || 0) * 10, 100)}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
            </div>
        </div>

        {/* ROW 5: INTERVIEW SCHEDULES */}
        <div className="space-y-6">
            <h3 className="text-[11px] font-black text-stone-400 uppercase tracking-[0.3em] ml-1">Jadwal Interview Mendatang</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 pb-10">
                {interviewSchedule.length > 0 ? interviewSchedule.map((item: any, i: number) => (
                    <div key={i} className="bg-white p-7 rounded-[2rem] border border-stone-100 shadow-sm flex flex-col justify-between hover:shadow-xl hover:border-blue-200 transition-all group">
                        <div>
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Clock size={12} /> {item.interview_date || item.created_at}
                            </span>
                            <p className="font-black text-stone-900 text-lg mt-3 group-hover:text-blue-600 transition-colors">{item.candidates?.name}</p>
                            <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">{item.jobs?.title}</p>
                            {item.interview_location && (
                              <p className="mt-2 text-[11px] font-medium text-stone-500 leading-relaxed">
                                {item.interview_location}
                              </p>
                            )}
                            {item.interview_duration ? (
                              <p className="mt-3 inline-flex items-center rounded-full border border-stone-100 bg-stone-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-stone-500">
                                Duration: {item.interview_duration}
                              </p>
                            ) : null}
                            {item.confirmation_status ? (
                              <p className={`mt-3 inline-flex items-center rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-widest ${item.confirmation_status.toUpperCase() === 'CONFIRMED' ? 'border-emerald-100 bg-emerald-50 text-emerald-600' : item.confirmation_status.toUpperCase() === 'DECLINED' ? 'border-rose-100 bg-rose-50 text-rose-600' : 'border-amber-100 bg-amber-50 text-amber-600'}`}>
                                {item.confirmation_status}
                              </p>
                            ) : null}
                        </div>
                        <div className="mt-8 flex items-center justify-between">
                            <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${item.confirmation_status?.toUpperCase() === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : item.confirmation_status?.toUpperCase() === 'DECLINED' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-stone-50 text-stone-500 border-stone-100'}`}>
                                <CheckCircle2 size={10} /> {item.confirmation_status || 'Pending'}
                            </span>
                            <ArrowRight size={16} className="text-stone-300 group-hover:text-blue-600 transition-colors" />
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full py-16 bg-white rounded-[2rem] border border-stone-100 border-dashed text-center">
                        <Users size={32} className="mx-auto text-stone-200 mb-3" />
                        <p className="text-stone-400 font-bold uppercase text-xs">Tidak ada jadwal interview hari ini</p>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}

// --- HELPER COMPONENTS ---
function StatCard({ label, value, sub, color }: any) {
  const colors: any = { blue: 'text-blue-600 bg-blue-50', emerald: 'text-emerald-600 bg-emerald-50', orange: 'text-orange-600 bg-orange-50', purple: 'text-purple-600 bg-purple-50' };
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm hover:shadow-md transition-all group">
      <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">{label}</p>
      <h2 className="text-5xl font-black text-stone-900 tracking-tighter">{value}</h2>
      <p className={`text-[10px] font-black mt-5 px-3 py-1 rounded-full inline-block uppercase tracking-tighter ${colors[color]}`}>{sub}</p>
    </div>
  );
}

function QualityMini({ label, value, trend, icon }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm flex items-center gap-5 hover:border-blue-300 transition-all hover:shadow-md">
      <div className="w-12 h-12 rounded-2xl bg-stone-50 text-stone-400 flex items-center justify-center shrink-0 shadow-inner">
        {React.cloneElement(icon, { size: 22 })}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-stone-400 uppercase tracking-tighter leading-tight">{label}</p>
        <p className="font-black text-stone-900 text-base">{value}</p>
        <p className="text-[9px] font-bold text-blue-600 uppercase italic mt-0.5">{trend}</p>
      </div>
    </div>
  );
}

function ChartBox({ title, children }: any) {
  return (
    <div className="bg-white rounded-[2.5rem] p-10 border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-[450px] flex flex-col hover:shadow-lg transition-shadow">
      <h3 className="font-black text-stone-900 uppercase text-[12px] tracking-[0.3em] mb-10 border-l-4 border-blue-600 pl-4">{title}</h3>
      <div className="flex-1 w-full">{children}</div>
    </div>
  );
}

// 🔥 FIX: Parameter status diberikan type explicit string
function getStatusBadgeColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'hired': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    case 'rejected': return 'bg-rose-50 text-rose-700 border-rose-100';
    case 'interview': return 'bg-purple-50 text-purple-700 border-purple-100';
    case 'shortlisted': return 'bg-blue-50 text-blue-700 border-blue-100';
    case 'technical test': return 'bg-orange-50 text-orange-700 border-orange-100';
    default: return 'bg-stone-50 text-stone-500 border-stone-100';
  }
}