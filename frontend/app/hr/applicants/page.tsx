"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { 
  Search, Star, Loader2, Briefcase 
} from 'lucide-react';

// Define Master Status agar filter selalu memiliki pilihan
const MASTER_STATUSES = ['Review AI', 'Shortlisted', 'Interview', 'Technical Test', 'Hired', 'Rejected'];

export default function ListPelamar() {
  const [applicants, setApplicants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Metadata untuk Dropdown Dinamis
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [availableStatuses] = useState<string[]>(MASTER_STATUSES);

  // State Filter (Tanpa Skill)
  const [filters, setFilters] = useState({
    name: '',
    status: '',
    jobId: ''
  });

  // --- FUNGSI UPDATE STATUS ---
  const updateStatus = async (applicationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status_application: newStatus }) // Pastikan kolomnya 'status_application'
        .eq('application_id', applicationId);

      if (error) throw error;
      
      // Berikan feedback sukses kecil (opsional)
      console.log("Status berhasil diperbarui!");
      
      fetchData(); // Refresh data agar UI tersinkronisasi
    } catch (err: any) {
      alert("Gagal update status: " + err.message);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Menarik data dari relasi ERD terbaru (candidates dan jobs)
      let query = supabase
        .from('applications')
        .select(`
          application_id, status_application, ai_score,
          candidates!inner ( name ),
          jobs!inner ( job_id, title )
        `)
        .order('ai_score', { ascending: false });

      // Logic Filter
      if (filters.name) query = query.ilike('candidates.name', `%${filters.name}%`);
      if (filters.status) query = query.eq('status_application', filters.status);
      if (filters.jobId) query = query.eq('job_id', filters.jobId);

      const { data: appData, error: appError } = await query;
      
      if (appError) throw appError;
      setApplicants(appData || []);

      // Ambil data lowongan untuk dropdown filter
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('job_id, title')
        .order('title', { ascending: true }); // Diurutkan sesuai abjad biar rapi
        
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-10 px-4">
      
      {/* HEADER */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-stone-900 tracking-tight uppercase">List Pelamar</h1>
        <p className="text-stone-500 font-medium">Data tersinkronisasi dengan kriteria AI Match Score.</p>
      </div>

      {/* SEARCH & FILTER (Grid disesuaikan menjadi 4 kolom karena skill dihapus) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white p-4 rounded-[32px] shadow-sm border border-stone-100">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Cari Nama Pelamar..." 
            className="w-full pl-5 pr-4 py-3.5 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-sm transition-all"
            value={filters.name}
            onChange={(e) => setFilters({...filters, name: e.target.value})}
          />
        </div>
        
        <select 
          className="px-5 py-3.5 bg-stone-50 border border-stone-100 rounded-2xl outline-none font-bold text-stone-600 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
        >
          <option value="">Status: Semua</option>
          {availableStatuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select 
          className="px-5 py-3.5 bg-stone-50 border border-stone-100 rounded-2xl outline-none font-bold text-stone-600 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
          value={filters.jobId}
          onChange={(e) => setFilters({...filters, jobId: e.target.value})}
        >
          <option value="">Lowongan: Semua</option>
          {availableJobs.map(j => <option key={j.job_id} value={j.job_id}>{j.title}</option>)}
        </select>

        <button 
          onClick={handleSearch}
          className="bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-600/20 text-xs tracking-widest uppercase"
        >
          <Search size={18} /> Terapkan Filter
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[32px] border border-stone-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              {/* Header Tabel dibuat lebih modern, terang, dan minimalis */}
              <tr className="bg-stone-50/80 border-b border-stone-100 text-stone-500">
                <th className="px-8 py-5 font-black uppercase text-[10px] tracking-[0.2em] text-center w-20">Rank</th>
                <th className="px-8 py-5 font-black uppercase text-[10px] tracking-[0.2em]">Nama Pelamar</th>
                <th className="px-8 py-5 font-black uppercase text-[10px] tracking-[0.2em]">Posisi Lowongan</th>
                <th className="px-8 py-5 font-black uppercase text-[10px] tracking-[0.2em] text-center">AI Score</th>
                <th className="px-8 py-5 font-black uppercase text-[10px] tracking-[0.2em] text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {isLoading ? (
                <tr><td colSpan={5} className="p-24 text-center"><Loader2 className="animate-spin inline text-blue-600" size={40} /></td></tr>
              ) : applicants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-24 text-center">
                    <p className="text-stone-400 font-bold uppercase text-xs tracking-widest">Data pelamar tidak ditemukan</p>
                    <p className="text-stone-300 text-xs mt-2">Ubah filter atau gunakan kata kunci lain.</p>
                  </td>
                </tr>
              ) : (
                applicants.map((app, index) => {
                  const candidateName = app.candidates?.name || 'Anonymous';
                  const currentStatus = app.status_application || 'Review AI';
                  
                  return (
                    <tr key={app.application_id} className="hover:bg-blue-50/20 transition-colors group">
                      <td className="px-8 py-6 text-center font-black text-stone-800 text-lg">{index + 1}</td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-600 group-hover:bg-blue-600 group-hover:text-white transition-all font-black uppercase text-xs">
                            {candidateName.charAt(0)}
                          </div>
                          <span className="font-bold text-stone-800 text-sm">{candidateName}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="font-bold text-stone-500 text-sm flex items-center gap-2">
                          <Briefcase size={14} className="text-blue-400" />
                          {app.jobs?.title || 'Posisi Dihapus'}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl font-black text-xs border border-blue-100">
                          <Star size={12} className="fill-blue-700" />
                          {app.ai_score || 0}%
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <select 
                          value={currentStatus}
                          onChange={(e) => updateStatus(app.application_id, e.target.value)}
                          className={`
                            text-[11px] font-bold uppercase tracking-wider px-4 py-2 rounded-xl border outline-none cursor-pointer transition-all w-full max-w-[160px] text-center appearance-none
                            ${currentStatus === 'Hired' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-500/20' : 
                              currentStatus === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200 focus:ring-rose-500/20' : 
                              'bg-stone-50 text-stone-700 border-stone-200 focus:ring-stone-500/20'}
                          `}
                        >
                          {MASTER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION */}
      <div className="flex items-center justify-between px-2 py-4">
        <button className="text-stone-400 font-black uppercase text-[10px] tracking-widest hover:text-blue-600 transition-colors">Previous</button>
        <div className="flex gap-2">
           <button className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black shadow-md shadow-blue-600/20 text-xs">1</button>
           <button className="w-10 h-10 rounded-xl text-stone-400 font-black text-xs hover:bg-stone-100 transition-colors">2</button>
        </div>
        <button className="text-stone-800 font-black uppercase text-[10px] tracking-widest hover:text-blue-600 transition-colors">Next</button>
      </div>

    </div>
  );
}