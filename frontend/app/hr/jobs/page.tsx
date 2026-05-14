"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import { 
  Plus, Search, Edit2, Trash2, 
  MapPin, Loader2, X, CheckCircle2, Calendar, FileText, Sparkles,
  Briefcase, Inbox, ChevronLeft, ChevronRight, Link as LinkIcon
} from 'lucide-react';

export default function KelolaLowongan() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [formData, setFormData] = useState({
    title: '', department: '', location: '', work_type: 'On-site', employment_type: 'Full-time',
    status_job: 'active', due_date: '', salary_min: '', salary_max: '', description: '',
    requirements: '', required_skills: '' 
  });

  const fetchJobs = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
    if (!error) setJobs(data || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchJobs(); }, []);

  const getJobStatusInfo = (job: any) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const dueDate = job.due_date ? new Date(job.due_date) : null;
    const isPastDue = dueDate && dueDate < today;
    if (job.status_job?.toLowerCase() === 'draft') return { label: 'DRAFT', styles: 'bg-stone-100 text-stone-600 border-stone-200' };
    if (isPastDue && job.status_job?.toLowerCase() === 'active') return { label: 'EXPIRED', styles: 'bg-rose-50 text-rose-600 border-rose-200' };
    return { label: 'ACTIVE', styles: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
  };

  const getBadgeStyles = (val: string, type: 'work' | 'emp') => {
    const v = val?.toLowerCase();
    if (type === 'work') {
      if (v === 'on-site') return 'bg-purple-50 text-purple-600 border-purple-100';
      if (v === 'remote') return 'bg-blue-50 text-blue-600 border-blue-100';
      return 'bg-sky-50 text-sky-600 border-sky-100'; // hybrid
    }
    if (v === 'full-time') return 'bg-teal-50 text-teal-600 border-teal-100';
    if (v === 'part-time') return 'bg-yellow-50 text-yellow-600 border-yellow-100';
    if (v === 'contract') return 'bg-orange-50 text-orange-600 border-orange-100';
    return 'bg-pink-50 text-pink-600 border-pink-100'; // internship
  };

  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const openModal = (job: any = null) => {
    if (job) {
      setEditingId(job.job_id);
      setFormData({
        title: job.title || '', department: job.department || '', location: job.location || '',
        work_type: job.work_type || 'On-site', employment_type: job.employment_type || 'Full-time',
        status_job: job.status_job || 'active', due_date: job.due_date || '', salary_min: job.salary_min?.toString() || '',
        salary_max: job.salary_max?.toString() || '', description: job.description || '', requirements: job.requirements || '',
        required_skills: job.required_skills ? job.required_skills.join(', ') : ''
      });
    } else {
      setEditingId(null);
      setFormData({ title: '', department: '', location: '', work_type: 'On-site', employment_type: 'Full-time', status_job: 'active', due_date: '', salary_min: '', salary_max: '', description: '', requirements: '', required_skills: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent, targetStatus: string) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { 
        ...formData, 
        status_job: targetStatus.toLowerCase(),
        salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
        due_date: formData.due_date ? formData.due_date : null,
        required_skills: formData.required_skills ? formData.required_skills.split(',').map(s => s.trim()).filter(s => s !== '') : []
      };

      if (editingId) {
        const { error } = await supabase.from('jobs').update(payload).eq('job_id', editingId);
        if (error) throw error;
      } else {
        // Fix: Hapus created_by dari insert frontend untuk mencegah error Foreign Key
        const { error } = await supabase.from('jobs').insert([payload]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchJobs();
    } catch (err: any) { 
      console.error("Gagal simpan data:", err);
      alert("Gagal menyimpan lowongan: " + err.message);
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const filteredJobs = jobs.filter(j => (j.title || '').toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const currentJobs = filteredJobs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex flex-col max-w-7xl mx-auto px-4 animate-in fade-in duration-700">
      
      {/* FIXED TOP SECTION */}
      <div className="space-y-6 mb-6">
        <div className="flex justify-between items-center pt-2">
          <div>
            <h1 className="text-3xl font-black text-stone-900 uppercase tracking-tight">Kelola Lowongan</h1>
            <p className="text-stone-500 font-medium">Atur strategi rekrutmen dan optimasi pencarian bakat.</p>
          </div>
          <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all">
            <Plus size={18} strokeWidth={3} /> TAMBAH LOWONGAN
          </button>
        </div>

        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-blue-600 transition-colors" size={20} />
          <input 
            type="text" placeholder="Cari posisi pekerjaan..." 
            className="w-full pl-14 pr-6 py-4 bg-white border border-stone-200 rounded-[2rem] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-stone-700 placeholder:text-stone-400"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden h-fit max-h-[calc(100vh-20rem)] flex flex-col">
        <div className="overflow-x-auto overflow-y-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
            <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-20 border-b border-stone-100">
              <tr>
                <th className="px-10 py-6 text-stone-400 font-black text-[10px] uppercase tracking-[0.2em] w-[60%]">Informasi Lowongan</th>
                <th className="px-4 py-6 text-stone-400 font-black text-[10px] uppercase tracking-[0.2em] w-[25%] text-center">Sistem & Tipe Kontrak</th>
                <th className="px-10 py-6 text-stone-400 font-black text-[10px] uppercase tracking-[0.2em] w-[15%] text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {isLoading ? (
                <tr><td colSpan={3} className="p-20 text-center"><Loader2 className="animate-spin text-blue-600 mx-auto" size={40} /></td></tr>
              ) : currentJobs.length === 0 ? (
                <tr><td colSpan={3} className="p-20 text-center text-stone-400 font-bold">Tidak ada lowongan.</td></tr>
              ) : currentJobs.map((job) => {
                const status = getJobStatusInfo(job);
                return (
                  <tr key={job.job_id} onClick={() => router.push(`/hr/jobs/${job.job_id}`)} className="group hover:bg-stone-50/50 transition-colors cursor-pointer">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 shrink-0 rounded-2xl bg-stone-50 border border-stone-100 text-stone-400 flex items-center justify-center group-hover:bg-white group-hover:text-stone-800 transition-all shadow-sm">
                          <Briefcase size={22} strokeWidth={2.2} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-black text-stone-900 text-lg group-hover:text-blue-600 transition-colors truncate">{job.title}</h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border ${status.styles}`}>{status.label}</span>
                          </div>
                          <div className="flex items-center gap-3 text-stone-400 font-bold text-xs uppercase tracking-wider">
                            <span className="flex items-center gap-1"><MapPin size={14} /> {job.location || 'N/A'}</span>
                            <span className="w-1 h-1 rounded-full bg-stone-200"></span>
                            <span className="flex items-center gap-1"><Calendar size={14} /> {job.due_date || 'NO LIMIT'}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border whitespace-nowrap ${getBadgeStyles(job.work_type, 'work')}`}>{job.work_type}</span>
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border whitespace-nowrap ${getBadgeStyles(job.employment_type, 'emp')}`}>{job.employment_type}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={(e) => { e.stopPropagation(); openModal(job); }} className="p-2.5 text-stone-300 border border-stone-100 rounded-xl hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all bg-white"><Edit2 size={16} strokeWidth={2.5}/></button>
                        <button onClick={(e) => { e.stopPropagation(); if(confirm('Hapus lowongan?')) supabase.from('jobs').delete().eq('job_id', job.job_id).then(() => fetchJobs()); }} className="p-2.5 text-stone-300 border border-stone-100 rounded-xl hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all bg-white"><Trash2 size={16} strokeWidth={2.5}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        {totalPages > 1 && (
          <div className="px-10 py-4 bg-white border-t border-stone-100 flex items-center justify-between shrink-0">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className="flex items-center gap-1 text-[10px] font-black uppercase text-stone-400 hover:text-blue-600 disabled:opacity-30 transition-colors"><ChevronLeft size={14} /> Prev</button>
            <div className="flex gap-2">
              {[...Array(totalPages)].map((_, i) => (
                <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-7 h-7 rounded-lg font-black text-[10px] transition-all ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-md' : 'text-stone-400 hover:bg-stone-50'}`}>{i + 1}</button>
              ))}
            </div>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} className="flex items-center gap-1 text-[10px] font-black uppercase text-stone-800 hover:text-blue-600 disabled:opacity-30 transition-colors">Next <ChevronRight size={14} /></button>
          </div>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end bg-stone-900/40 backdrop-blur-sm transition-all duration-500">
          <div className="w-full max-w-2xl h-full bg-white shadow-2xl p-8 sm:p-12 overflow-y-auto animate-in slide-in-from-right duration-500 custom-scrollbar">
            
            <div className="flex justify-between items-center mb-10 sticky top-0 bg-white/90 backdrop-blur-md py-4 z-10 border-b border-stone-100">
              <h2 className="text-2xl font-black text-stone-900 tracking-tight uppercase">
                {editingId ? 'EDIT DATA' : 'BUAT LOWONGAN'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-3 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-full transition-colors">
                <X size={24} strokeWidth={2.5} />
              </button>
            </div>

            <form className="space-y-6 pb-32">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Judul Pekerjaan</label>
                <input required name="title" value={formData.title} onChange={handleChange} className="w-full p-4 bg-white border border-stone-200 rounded-2xl font-bold text-stone-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" placeholder="e.g. Senior Frontend Engineer" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <LinkIcon size={14} className="text-blue-500" /> Required Skills (Pisahkan dengan koma)
                </label>
                <input name="required_skills" value={formData.required_skills} onChange={handleChange} className="w-full p-4 bg-blue-50/50 border border-blue-200 rounded-2xl font-bold text-blue-900 outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-blue-300" placeholder="e.g. React, TypeScript, Tailwind CSS, Figma" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Departemen</label>
                  <input name="department" value={formData.department} onChange={handleChange} className="w-full p-4 bg-white border border-stone-200 rounded-2xl font-bold text-stone-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" placeholder="Design/IT" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Deadline (Due Date)</label>
                  <input type="date" name="due_date" value={formData.due_date} onChange={handleChange} className="w-full p-4 bg-white border border-stone-200 rounded-2xl font-bold text-stone-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all uppercase" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Lokasi (Kota, Negara)</label>
                  <input name="location" value={formData.location} onChange={handleChange} className="w-full p-4 bg-white border border-stone-200 rounded-2xl font-bold text-stone-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" placeholder="Jakarta, Indonesia" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Sistem Kerja</label>
                  <select name="work_type" value={formData.work_type} onChange={handleChange} className="w-full p-4 bg-white border border-stone-200 rounded-2xl font-bold text-stone-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer">
                    <option value="On-site">On-site</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Tipe Pekerjaan</label>
                <select name="employment_type" value={formData.employment_type} onChange={handleChange} className="w-full p-4 bg-white border border-stone-200 rounded-2xl font-bold text-stone-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer">
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Gaji Minimal (IDR)</label>
                  <input type="number" name="salary_min" value={formData.salary_min} onChange={handleChange} className="w-full p-4 bg-white border border-stone-200 rounded-2xl font-bold text-stone-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" placeholder="5000000" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Gaji Maksimal (IDR)</label>
                  <input type="number" name="salary_max" value={formData.salary_max} onChange={handleChange} className="w-full p-4 bg-white border border-stone-200 rounded-2xl font-bold text-stone-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" placeholder="15000000" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Deskripsi Lowongan</label>
                <textarea rows={4} name="description" value={formData.description} onChange={handleChange} className="w-full p-4 bg-white border border-stone-200 rounded-2xl font-medium text-stone-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-y" placeholder="Jelaskan peran ini secara detail..." />
              </div>

              <div className="fixed bottom-0 right-0 w-full max-w-2xl p-6 sm:p-8 bg-white/95 backdrop-blur-xl border-t border-stone-100 flex gap-4 z-20">
                <button type="button" disabled={isSubmitting} onClick={(e) => handleSubmit(e, 'draft')} className="flex-1 py-4 bg-stone-50 border border-stone-200 text-stone-600 font-black rounded-2xl hover:bg-stone-100 uppercase text-[11px] tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm">
                  SIMPAN DRAFT
                </button>
                <button type="button" disabled={isSubmitting} onClick={(e) => handleSubmit(e, 'active')} className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-600/20 uppercase text-[11px] tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95">
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : null}
                  POSTING SEKARANG
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}