"use client";

import React, { useState, useEffect } from 'react';
import {
  Users, Briefcase, FileCheck, Clock, CalendarCheck, TrendingUp,
  Loader2, CheckCircle, AlertCircle
} from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

interface DashboardStats {
  totalKandidat: number;
  lowonganAktif: number;
  cvTerproses: number;
  interviewHariIni: number;
  offerAcceptanceRate: number;
  avgAiScore: number;
  avgTimeToHire: number;
  ditolakMingguIni: number;
}

interface PipelineData {
  stage: string;
  count: number;
  color: string;
  textColor: string;
}

interface InterviewSchedule {
  jam: string;
  nama: string;
  posisi: string;
  tahap: string;
  status: 'confirmed' | 'pending';
}

interface CandidateRecent {
  initials: string;
  nama: string;
  posisi: string;
  stage: string;
  stageColor: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'gray';
}

interface JobStatus {
  title: string;
  count: number;
  status: 'active' | 'closing';
}

// Komponen Helper Internal
const Badge = ({ children, color }: { children: React.ReactNode; color: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'gray'; }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    purple: 'bg-violet-50 text-violet-700',
    gray: 'bg-stone-100 text-stone-600',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${colorMap[color] || colorMap.gray}`}>
      {children}
    </span>
  );
};

const MetricCard = ({ label, value, sub, subPositive, icon, iconBg, isLoading }: { label: string; value: string | number; sub?: string; subPositive?: boolean; icon: React.ReactNode; iconBg: string; isLoading?: boolean; }) => (
  <div className="bg-white rounded-2xl border border-stone-100 p-5 flex flex-col gap-3 hover:shadow-md hover:border-blue-100 transition-all">
    <div className="flex items-start justify-between">
      <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-tight">{label}</p>
      <div className={`p-2.5 rounded-xl ${iconBg}`}>{icon}</div>
    </div>
    {isLoading ? (
      <Loader2 size={22} className="text-stone-200 animate-spin" />
    ) : (
      <div>
        <p className="text-3xl font-black text-stone-800 tracking-tight">{value}</p>
        {sub && (
          <p className={`text-[11px] font-medium mt-1 ${subPositive === false ? 'text-red-500' : subPositive === true ? 'text-emerald-600' : 'text-stone-400'}`}>
            {sub}
          </p>
        )}
      </div>
    )}
  </div>
);

export default function HRDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalKandidat: 0, lowonganAktif: 0, cvTerproses: 0, interviewHariIni: 0,
    offerAcceptanceRate: 0, avgAiScore: 0, avgTimeToHire: 0, ditolakMingguIni: 0,
  });
  
  const [pipelineData, setPipelineData] = useState<PipelineData[]>([]);
  const [recentCandidates, setRecentCandidates] = useState<CandidateRecent[]>([]);
  const [activeJobs, setActiveJobs] = useState<JobStatus[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      try {
        const todayStr = new Date().toISOString().split('T')[0];

        // 1. Fetch Agregasi Dasar (Pisahkan Jobs agar lebih aman)
        const [
          kandidatRes,
          cvRes,
          interviewRes
        ] = await Promise.all([
          supabase.from('candidates').select('*', { count: 'exact', head: true }),
          supabase.from('applications').select('*', { count: 'exact', head: true }).not('ai_score', 'is', null),
          // Menggunakan ilike agar tidak peduli huruf besar/kecil
          supabase.from('applications').select('*', { count: 'exact', head: true }).ilike('status_application', 'interview') 
        ]);

        const countKandidat = kandidatRes.count || 0;
        const countCV = cvRes.count || 0;
        const countInterview = interviewRes.count || 0;

        // 2. Fetch Jobs secara Terpisah (Anti Gagal)
        const { data: rawJobs, error: jobsError } = await supabase
          .from('jobs')
          .select('*, applications(application_id)');

        let safeJobs = rawJobs || [];
        if (jobsError) {
          console.warn("Relasi applications gagal, mengambil data jobs saja...", jobsError);
          const { data: fallbackJobs } = await supabase.from('jobs').select('*');
          safeJobs = fallbackJobs || [];
        }

        // FILTER JAVASCRIPT: Kebal dari case-sensitive & due_date otomatis terfilter
        const validJobs = safeJobs.filter(job => {
          const isStatusActive = job.status_job?.toLowerCase() === 'active';
          const isNotExpired = !job.due_date || job.due_date >= todayStr;
          return isStatusActive && isNotExpired;
        });

        const countJobs = validJobs.length; // Angka ini akan 100% akurat untuk Card Metrik

        // 3. Pipeline Rekrutmen
        const stages = [
          { stage: 'Melamar', key: 'applied', color: '#BFDBFE', textColor: '#1e40af' },
          { stage: 'Screening', key: 'screening', color: '#60A5FA', textColor: '#fff' },
          { stage: 'Interview', key: 'interview', color: '#2563EB', textColor: '#fff' },
          { stage: 'Diterima', key: 'hired', color: '#065f46', textColor: '#fff' },
        ];

        const pipelineCounts = await Promise.all(
          stages.map(({ key }) =>
            // Gunakan ilike agar kebal huruf besar/kecil
            supabase.from('applications').select('*', { count: 'exact', head: true }).ilike('status_application', key)
          )
        );

        const pipeline: PipelineData[] = stages.map((s, i) => ({
          ...s, count: pipelineCounts[i].count || 0,
        }));
        setPipelineData(pipeline);

        // 4. Fetch Kandidat Terbaru 
        const { data: recentData } = await supabase
          .from('applications')
          .select(`application_id, status_application, created_at, candidates(name), jobs(title)`)
          .order('created_at', { ascending: false })
          .limit(5);

        if (recentData) {
          const colorMap: Record<string, 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'gray'> = {
            applied: 'blue', screening: 'amber', interview: 'purple', technical: 'amber', offered: 'green', hired: 'green', rejected: 'red'
          };
          const mappedRecent = recentData.map((app: any) => {
            const name = app.candidates?.name || 'Pelamar Baru';
            const stage = app.status_application?.toLowerCase() || 'applied'; // Paksa kecilkan huruf
            return {
              initials: name.substring(0, 2).toUpperCase(),
              nama: name,
              posisi: app.jobs?.title || 'Posisi Tidak Diketahui',
              stage: stage.charAt(0).toUpperCase() + stage.slice(1),
              stageColor: colorMap[stage] || 'gray'
            };
          });
          setRecentCandidates(mappedRecent);
        }

        // 5. Setup Lowongan Aktif List (Gunakan validJobs yang sudah bersih)
        const sortedJobs = [...validJobs]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);

        setActiveJobs(
          sortedJobs.map((job: any): JobStatus => ({
            title: job.title || 'Untitled Job',
            count: job.applications ? job.applications.length : 0,
            status: 'active'
          }))
        );

        // 6. Update State Statistik Utama
        setStats({
          totalKandidat: countKandidat,
          lowonganAktif: countJobs,
          cvTerproses: countCV,
          interviewHariIni: countInterview, 
          offerAcceptanceRate: 85, 
          avgAiScore: 74, 
          avgTimeToHire: 18, 
          ditolakMingguIni: 8,
        });

      } catch (err) {
        console.error('Gagal mengambil data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, []);

  const pipelineTotal = pipelineData.reduce((s, d) => s + d.count, 0) || 1;
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      
      {/* HEADER DASHBOARD */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight uppercase">Dashboard HR</h1>
          <p className="text-stone-400 text-sm mt-0.5 font-medium italic capitalize">{today}</p>
        </div>
        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full uppercase tracking-widest">
          Sistem aktif
        </span>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Kandidat" value={stats.totalKandidat} isLoading={isLoading} icon={<Users size={18} className="text-blue-600" />} iconBg="bg-blue-50" />
        <MetricCard label="Lowongan Aktif" value={stats.lowonganAktif} isLoading={isLoading} icon={<Briefcase size={18} className="text-emerald-600" />} iconBg="bg-emerald-50" />
        <MetricCard label="CV Diproses AI" value={stats.cvTerproses} isLoading={isLoading} icon={<FileCheck size={18} className="text-orange-500" />} iconBg="bg-orange-50" />
        <MetricCard label="Interview Hari Ini" value={stats.interviewHariIni} isLoading={isLoading} icon={<CalendarCheck size={18} className="text-violet-600" />} iconBg="bg-violet-50" />
      </div>

      {/* PIPELINE REKRUTMEN */}
      <div className="bg-white rounded-2xl border border-stone-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-black text-stone-400 uppercase tracking-widest">Pipeline Rekrutmen</h2>
          <span className="text-xs text-stone-400 font-medium">{pipelineTotal} kandidat total</span>
        </div>
        <div className="flex rounded-xl overflow-hidden h-8 gap-0.5 mb-3">
          {pipelineData.map((seg) => (
            <div key={seg.stage} style={{ flex: seg.count, backgroundColor: seg.color }} className="flex items-center justify-center text-[10px] font-bold">
              <span style={{ color: seg.textColor }}>{seg.count > 0 ? seg.count : ''}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RECENT DATA SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-stone-100 p-6">
          <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-4">Kandidat Terbaru</h3>
          <div className="space-y-0">
            {isLoading ? (
               <div className="py-4 flex justify-center"><Loader2 className="animate-spin text-stone-200" /></div>
            ) : recentCandidates.length > 0 ? recentCandidates.map((c, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-stone-50 last:border-0">
                <span className="text-sm font-bold">{c.nama}</span>
                <Badge color={c.stageColor}>{c.stage}</Badge>
              </div>
            )) : (
              <p className="text-xs text-stone-400 text-center py-4">Belum ada pelamar baru</p>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-2xl border border-stone-100 p-6">
          <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-4">Lowongan Aktif</h3>
          <div className="space-y-0">
            {isLoading ? (
               <div className="py-4 flex justify-center"><Loader2 className="animate-spin text-stone-200" /></div>
            ) : activeJobs.length > 0 ? activeJobs.map((j, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-stone-50 last:border-0">
                <span className="text-sm font-medium">{j.title}</span>
                <span className="text-xs text-stone-400">{j.count} pelamar</span>
              </div>
            )) : (
              <p className="text-xs text-stone-400 text-center py-4">Tidak ada lowongan aktif</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}