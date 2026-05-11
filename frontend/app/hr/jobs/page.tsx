"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase';
import { 
  Plus, Search, Edit2, Trash2, 
  MapPin, Loader2, X, CheckCircle2, Calendar, FileText, Sparkles,
  Briefcase, Inbox
} from 'lucide-react';

export default function KelolaLowongan() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    work_type: 'On-site',
    employment_type: 'Full-time',
    status_job: 'active',
    due_date: '',
    salary_min: '',
    salary_max: '',
    description: '',
    requirements: '', 
    required_skills: '' 
  });

  const fetchJobs = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (!error) setJobs(data || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchJobs(); }, []);

  const getJobStatusInfo = (job: any) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    
    const dueDate = job.due_date ? new Date(job.due_date) : null;
    const isPastDue = dueDate && dueDate < today;

    if (job.status_job?.toLowerCase() === 'draft') {
      return { label: 'Draft', styles: 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm' };
    }

    if (isPastDue && job.status_job?.toLowerCase() === 'active') {
      return { label: 'Expired', styles: 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm' };
    }

    return { label: 'Active', styles: 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm' };
  };

  const getWorkTypeStyles = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'on-site': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'remote': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'hybrid': return 'bg-sky-50 text-sky-700 border-sky-200';
      default: return 'bg-stone-50 text-stone-700 border-stone-200';
    }
  };

  const getEmpTypeStyles = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'full-time': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'part-time': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'contract': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'internship': return 'bg-pink-50 text-pink-700 border-pink-200';
      default: return 'bg-stone-50 text-stone-700 border-stone-200';
    }
  };

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openModal = (job: any = null) => {
    if (job) {
      setEditingId(job.job_id);
      setFormData({
        title: job.title || '',
        department: job.department || '',
        location: job.location || '',
        work_type: job.work_type || 'On-site',
        employment_type: job.employment_type || 'Full-time',
        status_job: job.status_job || 'active',
        due_date: job.due_date || '',
        salary_min: job.salary_min?.toString() || '',
        salary_max: job.salary_max?.toString() || '',
        description: job.description || '',
        requirements: job.requirements || '',
        required_skills: job.required_skills ? job.required_skills.join(', ') : ''
      });
    } else {
      setEditingId(null);
      setFormData({ 
        title: '', department: '', location: '', work_type: 'On-site', 
        employment_type: 'Full-time', status_job: 'active', due_date: '', 
        salary_min: '', salary_max: '', description: '', requirements: '', required_skills: '' 
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent, targetStatus: string) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Sesi HR tidak valid.");

      const basePayload = { 
        title: formData.title,
        department: formData.department,
        location: formData.location,
        work_type: formData.work_type,
        employment_type: formData.employment_type,
        status_job: targetStatus.toLowerCase(),
        due_date: formData.due_date || null,
        salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
        description: formData.description,
        requirements: formData.requirements,
        required_skills: formData.required_skills 
          ? formData.required_skills.split(',').map(s => s.trim()).filter(s => s !== "") 
          : []
      };

      if (editingId) {
        const { error } = await supabase.from('jobs').update(basePayload).eq('job_id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('jobs').insert([{ ...basePayload, created_by: user.id }]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchJobs();
    } catch (err: any) { 
      console.error(err);
      alert(err.message);
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Yakin mau hapus lowongan ini?")) {
      await supabase.from('jobs').delete().eq('job_id', id);
      fetchJobs();
    }
  };

  const filteredJobs = jobs.filter(j => 
    (j.title || '').toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-in fade-in duration-700">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 px-4">
        <div>
          <h1 className="text-3xl font-black text-stone-900 uppercase tracking-tight">Kelola Lowongan</h1>
          <p className="text-stone-500 font-medium mt-1">Atur strategi rekrutmen dan optimasi pencarian bakat.</p>
        </div>
        <button 
          onClick={() => openModal()} 
          className="group bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-3 transition-all duration-300 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 active:scale-95 whitespace-nowrap"
        >
          <div className="bg-white/20 p-1.5 rounded-full group-hover:rotate-90 transition-transform duration-300">
            <Plus size={16} strokeWidth={3} />
          </div>
          Tambah Lowongan
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative group px-4">
        <Search className="absolute left-9 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-blue-600 transition-colors duration-300" size={20} />
        <input 
          type="text" placeholder="Cari posisi pekerjaan..." 
          className="w-full pl-16 pr-6 py-5 bg-white border border-stone-200 hover:border-stone-300 rounded-[2rem] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm transition-all duration-300 font-bold text-stone-700 placeholder:text-stone-400"
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mx-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-stone-50/50 border-b border-stone-100">
                <th className="px-10 py-7 text-stone-400 font-black text-[11px] uppercase tracking-[0.2em]">Informasi Lowongan</th>
                <th className="px-10 py-7 text-right text-stone-400 font-black text-[11px] uppercase tracking-[0.2em]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {isLoading ? (
                <tr>
                  <td colSpan={2} className="p-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <Loader2 className="animate-spin text-blue-600" size={40} />
                      <p className="text-stone-400 font-bold uppercase tracking-widest text-[10px] animate-pulse">Memuat Data Lowongan...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={2} className="p-32 text-center">
                    <div className="flex flex-col items-center justify-center text-stone-400">
                      <div className="bg-stone-50 w-20 h-20 rounded-full flex items-center justify-center mb-6">
                        <Inbox size={32} className="text-stone-300" />
                      </div>
                      <p className="text-lg font-black text-stone-800 mb-2">Tidak ada lowongan ditemukan</p>
                      <p className="text-sm font-medium text-stone-500">Coba sesuaikan kata kunci pencarian Anda atau buat lowongan baru.</p>
                    </div>
                  </td>
                </tr>
              ) : filteredJobs.map((job) => {
                const statusInfo = getJobStatusInfo(job);
                return (
                  <tr key={job.job_id} className="group hover:bg-blue-50/40 transition-colors duration-300 cursor-pointer">
                    <td className="px-10 py-8">
                      <Link href={`/hr/jobs/${job.job_id}`}>
                        <div className="flex items-center gap-6 justify-between w-full">
                          
                          {/* JOB INFO LEFT */}
                          <div className="flex items-center gap-6 flex-1">
                            <div className="hidden sm:flex items-center justify-center min-w-[56px] w-14 h-14 rounded-2xl bg-stone-50 border border-stone-100 text-stone-400 group-hover:bg-white group-hover:text-blue-600 group-hover:border-blue-200 group-hover:shadow-md transition-all duration-300">
                              <Briefcase size={24} strokeWidth={2} />
                            </div>
                            
                            <div className="flex flex-col gap-2.5">
                              <div className="flex flex-wrap items-center gap-3">
                                <h3 className="font-black text-stone-900 text-xl tracking-tight group-hover:text-blue-700 transition-colors duration-300 line-clamp-1">
                                  {job.title}
                                </h3>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusInfo.styles} transition-colors duration-300 whitespace-nowrap`}>
                                  {statusInfo.label}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-4 text-stone-500 font-bold text-xs uppercase tracking-wider">
                                <div className="flex items-center gap-1.5 whitespace-nowrap"><MapPin size={14} className="text-stone-400 group-hover:text-blue-500 transition-colors" /> {job.location}</div>
                                <span className="w-1.5 h-1.5 rounded-full bg-stone-200 hidden sm:block"></span>
                                <div className="flex items-center gap-1.5 whitespace-nowrap"><Calendar size={14} className="text-stone-400 group-hover:text-blue-500 transition-colors" /> {job.due_date || 'No Limit'}</div>
                              </div>
                            </div>
                          </div>

                          {/* TAGS RIGHT */}
                          <div className="hidden md:flex items-center gap-2.5">
                            <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border whitespace-nowrap ${getWorkTypeStyles(job.work_type)}`}>{job.work_type}</span>
                            <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border whitespace-nowrap ${getEmpTypeStyles(job.employment_type)}`}>{job.employment_type}</span>
                          </div>

                        </div>
                      </Link>
                    </td>
                    
                    {/* ACTIONS */}
                    <td className="px-10 py-8 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button 
                          onClick={() => openModal(job)} 
                          className="p-3 text-stone-400 hover:text-blue-600 bg-white border border-stone-100 hover:border-blue-200 shadow-sm hover:shadow-md rounded-2xl transition-all duration-300 hover:-translate-y-1"
                          title="Edit Lowongan"
                        >
                          <Edit2 size={18} strokeWidth={2.5}/>
                        </button>
                        <button 
                          onClick={() => handleDelete(job.job_id)} 
                          className="p-3 text-stone-400 hover:text-rose-600 bg-white border border-stone-100 hover:border-rose-200 shadow-sm hover:shadow-md rounded-2xl transition-all duration-300 hover:-translate-y-1"
                          title="Hapus Lowongan"
                        >
                          <Trash2 size={18} strokeWidth={2.5}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL / SLIDE OVER */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end bg-stone-900/60 backdrop-blur-sm transition-all duration-500">
          <div className="w-full max-w-2xl h-full bg-white shadow-2xl p-8 sm:p-12 overflow-y-auto animate-in slide-in-from-right duration-500">
            <div className="flex justify-between items-center mb-10 sticky top-0 bg-white/90 backdrop-blur-md py-4 z-10 border-b border-stone-100">
              <h2 className="text-2xl font-black text-stone-900 tracking-tight uppercase">
                {editingId ? 'Edit Lowongan' : 'Buat Lowongan'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-3 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-full transition-colors"
              >
                <X size={24} strokeWidth={2.5} />
              </button>
            </div>

            <form className="space-y-8 pb-40">
              {/* CORE INFO */}
              <div className="bg-stone-50/50 p-8 rounded-[2rem] border border-stone-100 space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Judul Pekerjaan</label>
                  <input required name="title" value={formData.title} onChange={handleChange} 
                    className="w-full p-5 bg-white border border-stone-200 rounded-2xl font-bold text-stone-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm transition-all" 
                    placeholder="e.g. Senior Frontend Engineer"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <Sparkles size={14} /> Required Skills
                  </label>
                  <input name="required_skills" value={formData.required_skills} onChange={handleChange} 
                    className="w-full p-5 bg-blue-50/50 border border-blue-200 rounded-2xl font-bold text-blue-900 outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all placeholder:text-blue-300" 
                    placeholder="e.g. React, TypeScript, Figma" 
                  />
                  <p className="text-[10px] font-bold text-stone-400 ml-1">Pisahkan dengan koma (,)</p>
                </div>
              </div>

              {/* GRID INFO 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Departemen</label>
                  <input name="department" value={formData.department} onChange={handleChange} 
                    className="w-full p-5 bg-white border border-stone-200 rounded-2xl font-bold text-stone-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm transition-all" 
                    placeholder="e.g. Engineering"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Deadline (Due Date)</label>
                  <input type="date" name="due_date" value={formData.due_date} onChange={handleChange} 
                    className="w-full p-5 bg-white border border-stone-200 rounded-2xl font-bold text-stone-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm transition-all uppercase" 
                  />
                </div>
              </div>

              {/* GRID INFO 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Lokasi</label>
                  <input name="location" value={formData.location} onChange={handleChange} 
                    className="w-full p-5 bg-white border border-stone-200 rounded-2xl font-bold text-stone-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm transition-all" 
                    placeholder="e.g. Jakarta, Indonesia"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Sistem Kerja</label>
                  <select name="work_type" value={formData.work_type} onChange={handleChange} 
                    className="w-full p-5 bg-white border border-stone-200 rounded-2xl font-bold text-stone-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm transition-all appearance-none cursor-pointer"
                  >
                    <option value="On-site">On-site</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              {/* GRID INFO 3 (SALARY) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Gaji Minimal (Opsional)</label>
                  <input type="number" name="salary_min" value={formData.salary_min} onChange={handleChange} 
                    className="w-full p-5 bg-white border border-stone-200 rounded-2xl font-bold text-stone-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm transition-all" 
                    placeholder="e.g. 5000000"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Gaji Maksimal (Opsional)</label>
                  <input type="number" name="salary_max" value={formData.salary_max} onChange={handleChange} 
                    className="w-full p-5 bg-white border border-stone-200 rounded-2xl font-bold text-stone-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm transition-all" 
                    placeholder="e.g. 10000000"
                  />
                </div>
              </div>

              {/* TIPE PEKERJAAN */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Tipe Pekerjaan</label>
                <select name="employment_type" value={formData.employment_type} onChange={handleChange} 
                  className="w-full p-5 bg-white border border-stone-200 rounded-2xl font-bold text-stone-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm transition-all appearance-none cursor-pointer"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              {/* DESKRIPSI & PERSYARATAN */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Deskripsi Pekerjaan</label>
                <textarea rows={4} name="description" value={formData.description} onChange={handleChange} 
                  className="w-full p-5 bg-white border border-stone-200 rounded-2xl font-medium text-stone-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm transition-all resize-y" 
                  placeholder="Detail mengenai posisi ini..."
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Persyaratan Kualifikasi</label>
                <textarea rows={5} name="requirements" value={formData.requirements} onChange={handleChange} 
                  className="w-full p-5 bg-white border border-stone-200 rounded-2xl font-medium text-stone-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm transition-all resize-y" 
                  placeholder="Kualifikasi yang dibutuhkan kandidat..."
                />
              </div>

              {/* ACTION BUTTONS */}
              <div className="fixed bottom-0 right-0 w-full max-w-2xl p-6 sm:p-8 bg-white/95 backdrop-blur-xl border-t border-stone-100 flex gap-4 z-20">
                <button 
                  type="button" disabled={isSubmitting} onClick={(e) => handleSubmit(e, 'draft')} 
                  className="flex-1 py-5 bg-stone-50 border border-stone-200 text-stone-600 font-black rounded-2xl hover:bg-stone-100 hover:border-stone-300 uppercase text-[11px] tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <FileText size={16} /> Draft
                </button>
                <button 
                  type="button" disabled={isSubmitting} onClick={(e) => handleSubmit(e, 'active')} 
                  className="flex-[2] py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 uppercase text-[11px] tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={18} />}
                  Posting Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}