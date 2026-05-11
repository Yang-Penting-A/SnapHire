"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import { 
  Search, Star, Loader2, Briefcase, Filter, ChevronLeft, ChevronRight, Inbox, User
} from 'lucide-react';

const MASTER_STATUSES = ['Review AI', 'Shortlisted', 'Interview', 'Technical Test', 'Hired', 'Rejected'];

export default function ListPelamar() {
  const router = useRouter(); 
  const [applicants, setApplicants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [availableStatuses] = useState<string[]>(MASTER_STATUSES);

  const [filters, setFilters] = useState({
    name: '',
    status: '',
    jobId: ''
  });

  const updateStatus = async (applicationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status_application: newStatus })
        .eq('application_id', applicationId);

      if (error) throw error;
      
      console.log("Status berhasil diperbarui!");
      fetchData(); 
    } catch (err: any) {
      alert("Gagal update status: " + err.message);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('applications')
        .select(`
          application_id, status_application, ai_score,
          candidates!inner ( name ),
          jobs!inner ( job_id, title )
        `);

      if (filters.name.trim() !== '') query = query.ilike('candidates.name', `%${filters.name.trim()}%`);
      if (filters.status !== '') query = query.eq('status_application', filters.status);
      if (filters.jobId !== '') query = query.eq('job_id', filters.jobId);

      query = query.order('ai_score', { ascending: false });

      const { data: appData, error: appError } = await query;
      
      if (appError) throw appError;
      setApplicants(appData || []);

      const { data: jobsData } = await supabase
        .from('jobs')
        .select('job_id, title')
        .order('title', { ascending: true }); 
        
      if (jobsData) {
        setAvailableJobs(jobsData);
      }

    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = () => fetchData();

  // FUNGSI WARNA YANG SUDAH DIUPDATE
  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'hired': return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 focus:ring-emerald-500/20';
      case 'shortlisted': return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 focus:ring-blue-500/20';
      case 'interview': return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 focus:ring-purple-500/20';
      case 'technical test': return 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 focus:ring-orange-500/20';
      case 'rejected': return 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 focus:ring-rose-500/20';
      case 'review ai':
      default: return 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100 focus:ring-stone-500/10';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto pb-12 px-4">
      
      <div className="flex flex-col gap-1.5 pt-2">
        <h1 className="text-3xl font-black text-stone-900 tracking-tight uppercase">List Pelamar</h1>
        <p className="text-stone-500 font-medium">Data tersinkronisasi dengan kriteria AI Match Score.</p>
      </div>

      <div className="bg-white p-5 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-blue-500 transition-colors duration-300" size={18} />
            <input 
              type="text" 
              placeholder="Cari Nama Pelamar..." 
              className="w-full pl-12 pr-4 py-4 bg-stone-50 hover:bg-stone-100/50 focus:bg-white border border-stone-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-stone-700 placeholder:text-stone-400 text-sm transition-all duration-300"
              value={filters.name}
              onChange={(e) => setFilters({...filters, name: e.target.value})}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          
          <select 
            className="px-5 py-4 bg-stone-50 hover:bg-stone-100/50 focus:bg-white border border-stone-200 rounded-2xl outline-none font-bold text-stone-600 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 cursor-pointer appearance-none"
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="">Status: Semua</option>
            {availableStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select 
            className="px-5 py-4 bg-stone-50 hover:bg-stone-100/50 focus:bg-white border border-stone-200 rounded-2xl outline-none font-bold text-stone-600 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 cursor-pointer appearance-none"
            value={filters.jobId}
            onChange={(e) => setFilters({...filters, jobId: e.target.value})}
          >
            <option value="">Lowongan: Semua</option>
            {availableJobs.map(j => <option key={j.job_id} value={j.job_id}>{j.title}</option>)}
          </select>

          <button 
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/30 active:scale-95 text-xs tracking-widest uppercase"
          >
            <Filter size={16} strokeWidth={2.5} /> Terapkan Filter
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-stone-50/50 border-b border-stone-100 text-stone-400">
                <th className="px-8 py-7 font-extrabold uppercase text-[11px] tracking-[0.2em] text-center w-24">Rank</th>
                <th className="px-8 py-7 font-extrabold uppercase text-[11px] tracking-[0.2em]">Kandidat</th>
                <th className="px-8 py-7 font-extrabold uppercase text-[11px] tracking-[0.2em]">Posisi Lowongan</th>
                <th className="px-8 py-7 font-extrabold uppercase text-[11px] tracking-[0.2em] text-center">AI Score</th>
                <th className="px-8 py-7 font-extrabold uppercase text-[11px] tracking-[0.2em] text-center w-52">Status</th>
                <th className="px-8 py-7 font-extrabold uppercase text-[11px] tracking-[0.2em] text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <Loader2 className="animate-spin text-blue-600" size={40} />
                      <p className="text-stone-400 font-bold uppercase tracking-widest text-[10px] animate-pulse">Menyelaraskan data AI...</p>
                    </div>
                  </td>
                </tr>
              ) : applicants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-32 text-center">
                    <div className="flex flex-col items-center justify-center text-stone-400">
                      <div className="bg-stone-50 w-20 h-20 rounded-full flex items-center justify-center mb-6">
                        <Inbox size={32} className="text-stone-300" />
                      </div>
                      <p className="text-lg font-black text-stone-800 mb-2">Pelamar tidak ditemukan</p>
                      <p className="text-sm font-medium text-stone-500">Ubah filter atau gunakan kata kunci lain untuk mencari.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                applicants.map((app, index) => {
                  const candidateName = app.candidates?.name || 'Anonymous';
                  const currentStatus = app.status_application || 'Review AI';
                  
                  return (
                    <tr key={app.application_id} className="hover:bg-blue-50/30 transition-colors duration-300 group">
                      <td className="px-8 py-7 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-sm text-stone-400 transition-colors duration-300">
                          {index + 1}
                        </span>
                      </td>

                      <td className="px-8 py-7">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-500 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-md transition-all duration-300 font-black uppercase text-sm border border-stone-200 group-hover:border-blue-600 shrink-0">
                            {candidateName.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-stone-800 text-[15px] group-hover:text-blue-700 transition-colors line-clamp-1">{candidateName}</span>
                            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1 mt-0.5 whitespace-nowrap">
                              <User size={10} /> Kandidat
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-8 py-7">
                        <div className="font-bold text-stone-600 text-sm flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-stone-100 text-stone-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                            <Briefcase size={14} strokeWidth={2.5} />
                          </div>
                          <span className="line-clamp-1">{app.jobs?.title || 'Posisi Dihapus'}</span>
                        </div>
                      </td>

                      <td className="px-8 py-7 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-stone-50 text-stone-700 rounded-xl font-black text-[13px] border border-stone-200 shadow-sm transition-all duration-300">
                          <Star size={14} className="text-stone-400" />
                          {app.ai_score || 0}%
                        </div>
                      </td>

                      <td className="px-8 py-7 text-center">
                        <div className="relative w-full min-w-[180px] max-w-[200px] mx-auto">
                          <select 
                            value={currentStatus}
                            onChange={(e) => updateStatus(app.application_id, e.target.value)}
                            className={`
                              w-full text-[10px] font-black uppercase tracking-wider px-3 py-2.5 rounded-xl border outline-none cursor-pointer transition-all duration-300 text-center appearance-none shadow-sm
                              ${getStatusBadgeColor(currentStatus)}
                            `}
                          >
                            {MASTER_STATUSES.map(s => <option key={s} value={s} className="bg-white text-stone-700 font-bold">{s}</option>)}
                          </select>
                        </div>
                      </td>

                      <td className="px-8 py-7 text-center whitespace-nowrap">
                        <button 
                          onClick={() => router.push(`/hr/applicants/${app.application_id}`)}
                          className="px-5 py-2.5 bg-white border border-stone-200 text-stone-600 hover:border-blue-600 hover:bg-blue-600 hover:text-white hover:shadow-md rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 active:scale-95"
                        >
                          Buka Profil
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-2">
        <button className="flex items-center gap-2 text-stone-400 font-black uppercase text-[11px] tracking-widest hover:text-blue-600 transition-colors duration-300">
          <ChevronLeft size={16} /> Previous
        </button>
        <div className="flex gap-2">
           <button className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black shadow-lg shadow-blue-600/30 text-xs transition-transform hover:scale-105">1</button>
           <button className="w-10 h-10 rounded-xl text-stone-500 font-black text-xs hover:bg-stone-100 border border-transparent hover:border-stone-200 transition-all">2</button>
        </div>
        <button className="flex items-center gap-2 text-stone-800 font-black uppercase text-[11px] tracking-widest hover:text-blue-600 transition-colors duration-300">
          Next <ChevronRight size={16} />
        </button>
      </div>

    </div>
  );
}