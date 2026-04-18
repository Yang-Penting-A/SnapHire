"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { 
  Search, User, Star, Loader2, ChevronLeft, ChevronRight, 
  MapPin, Briefcase, Sparkles
} from 'lucide-react';

// Define Master Status agar filter selalu memiliki pilihan
const MASTER_STATUSES = ['Review AI', 'Shortlisted', 'Interview', 'Technical Test', 'Hired', 'Rejected'];

export default function ListPelamar() {
  const [applicants, setApplicants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Metadata untuk Dropdown Dinamis
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  
  // Menggunakan Master Status agar dropdown tidak kosong saat data pelamar belum ada
  const [availableStatuses] = useState<string[]>(MASTER_STATUSES);

  // State Filter
  const [filters, setFilters] = useState({
    name: '',
    status: '',
    jobId: '',
    skill: ''
  });

  // --- FUNGSI TAMBAHAN: UPDATE STATUS KE SUPABASE ---
  const updateStatus = async (applicationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('application_id', applicationId);

      if (error) throw error;
      
      // Refresh data agar UI tersinkronisasi
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
          application_id, status, ai_score,
          users ( name ),
          jobs ( job_id, title, required_skills )
        `)
        .order('ai_score', { ascending: false });

      // Logic Filter
      if (filters.name) query = query.ilike('users.name', `%${filters.name}%`);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.jobId) query = query.eq('job_id', filters.jobId);
      
      // Filter Skill
      if (filters.skill) {
        query = query.contains('jobs.required_skills', [filters.skill]);
      }

      const { data: appData } = await query;
      setApplicants(appData || []);

      const { data: jobsData } = await supabase.from('jobs').select('job_id, title, required_skills');
      
      if (jobsData) {
        setAvailableJobs(jobsData);
        
        // Ambil semua skill unik dari semua lowongan, lalu bersihkan
        const allSkills = jobsData.flatMap(j => j.required_skills || []);
        const uniqueSkills = Array.from(new Set(allSkills)).filter(Boolean).sort();
        setAvailableSkills(uniqueSkills as string[]);
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-10 px-4">
      
      {/* HEADER */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-stone-900 tracking-tight uppercase">List Pelamar</h1>
        <p className="text-stone-500 font-medium italic">Data tersinkronisasi dengan kriteria AI Match Score.</p>
      </div>

      {/* SEARCH & FILTER - SYNCED WITH MASTER STATUS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-white p-4 rounded-[32px] shadow-sm border border-stone-100">
        <div className="lg:col-span-1">
          <input 
            type="text" 
            placeholder="Cari Nama Pelamar..." 
            className="w-full px-5 py-3.5 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-blue-500 font-medium text-sm transition-all"
            value={filters.name}
            onChange={(e) => setFilters({...filters, name: e.target.value})}
          />
        </div>
        
        <select 
          className="px-5 py-3.5 bg-stone-50 border border-stone-100 rounded-2xl outline-none font-bold text-stone-600 text-sm"
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
        >
          <option value="">Status: Semua</option>
          {availableStatuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select 
          className="px-5 py-3.5 bg-stone-50 border border-stone-100 rounded-2xl outline-none font-bold text-stone-600 text-sm"
          value={filters.skill}
          onChange={(e) => setFilters({...filters, skill: e.target.value})}
        >
          <option value="">Skill: Semua</option>
          {availableSkills.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select 
          className="px-5 py-3.5 bg-stone-50 border border-stone-100 rounded-2xl outline-none font-bold text-stone-600 text-sm"
          value={filters.jobId}
          onChange={(e) => setFilters({...filters, jobId: e.target.value})}
        >
          <option value="">Lowongan: Semua</option>
          {availableJobs.map(j => <option key={j.job_id} value={j.job_id}>{j.title}</option>)}
        </select>

        <button 
          onClick={handleSearch}
          className="sm:col-span-2 lg:col-span-1 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-blue-600/20 text-xs tracking-widest uppercase"
        >
          <Search size={18} /> Search
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[40px] border border-stone-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-[#5c7c9c] text-white">
                <th className="px-8 py-5 font-bold uppercase text-[10px] tracking-widest text-center w-20">Rank</th>
                <th className="px-8 py-5 font-bold uppercase text-[10px] tracking-widest border-l border-white/10">Nama Pelamar</th>
                <th className="px-8 py-5 font-bold uppercase text-[10px] tracking-widest border-l border-white/10">Posisi Lowongan</th>
                <th className="px-8 py-5 font-bold uppercase text-[10px] tracking-widest border-l border-white/10 text-center">AI Score</th>
                <th className="px-8 py-5 font-bold uppercase text-[10px] tracking-widest border-l border-white/10 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {isLoading ? (
                <tr><td colSpan={5} className="p-24 text-center"><Loader2 className="animate-spin inline text-blue-600" size={40} /></td></tr>
              ) : applicants.length === 0 ? (
                <tr><td colSpan={5} className="p-24 text-center text-stone-400 font-bold uppercase text-xs">Data pelamar tidak ditemukan</td></tr>
              ) : (
                applicants.map((app, index) => (
                  <tr key={app.application_id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-8 py-7 text-center font-black text-stone-800 text-lg italic">{index + 1}</td>
                    <td className="px-8 py-7">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm font-black uppercase text-xs">
                          {app.users?.name?.charAt(0) || 'K'}
                        </div>
                        <span className="font-bold text-stone-800">{app.users?.name || 'Anonymous'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-7">
                      <div className="font-bold text-stone-500 text-sm flex items-center gap-2 uppercase tracking-tight">
                        <Briefcase size={14} className="text-blue-400" />
                        {app.jobs?.title || 'Posisi Dihapus'}
                      </div>
                    </td>
                    <td className="px-8 py-7 text-center">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full font-black text-xs border border-blue-100 shadow-sm">
                        <Star size={12} className="fill-blue-700" />
                        {app.ai_score || 0}%
                      </div>
                    </td>
                    <td className="px-8 py-7 text-center">
                      <select 
                        value={app.status || 'Review AI'}
                        onChange={(e) => updateStatus(app.application_id, e.target.value)}
                        className={`
                          text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border outline-none cursor-pointer transition-all
                          ${app.status === 'Hired' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                            app.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' : 
                            'bg-stone-50 text-stone-700 border-stone-200'}
                        `}
                      >
                        {MASTER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-6">
        <button className="text-stone-400 font-black uppercase text-[10px] tracking-widest hover:text-blue-600 transition-colors">Previous</button>
        <div className="flex gap-2">
           <button className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black shadow-lg text-xs">1</button>
           <button className="w-10 h-10 rounded-xl text-stone-400 font-black text-xs hover:bg-stone-100">2</button>
        </div>
        <button className="text-stone-800 font-black uppercase text-[10px] tracking-widest hover:text-blue-600 transition-colors">Next</button>
      </div>

    </div>
  );
}