"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase';
import { 
  Plus, Search, Edit2, Trash2, 
  MapPin, Loader2, X, CheckCircle2, Calendar, FileText, Sparkles 
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
    requirement: '',
    required_skills: '' 
  });

  const fetchJobs = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
    if (!error) setJobs(data || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchJobs(); }, []);

  // --- LOGIKA WARNA ---
  const getStatusStyles = (job: any) => {
    const today = new Date().toISOString().split('T')[0];
    const isExpired = job.due_date && job.due_date < today && job.status_job === 'active';
    if (job.status_job === 'draft') return 'bg-amber-100 text-amber-700 border-amber-200';
    if (isExpired) return 'bg-rose-100 text-rose-700 border-rose-200';
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  };

  const getWorkTypeStyles = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'on-site': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'remote': return 'bg-yellow-50 text-yellow-600 border-yellow-100';
      case 'hybrid': return 'bg-sky-50 text-sky-600 border-sky-100';
      default: return 'bg-stone-50 text-stone-600 border-stone-100';
    }
  };

  const getEmpTypeStyles = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'full-time': return 'bg-teal-50 text-teal-600 border-teal-100';
      case 'part-time': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'contract': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'internship': return 'bg-pink-50 text-pink-600 border-pink-100';
      default: return 'bg-stone-100 text-stone-600 border-stone-200';
    }
  };

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openModal = (job: any = null) => {
    if (job) {
      setEditingId(job.job_id);
      setFormData({
        title: job.title,
        department: job.department || '',
        location: job.location || '',
        work_type: job.work_type || 'On-site',
        employment_type: job.employment_type || 'Full-time',
        status_job: job.status_job || 'active',
        due_date: job.due_date || '',
        salary_min: job.salary_min?.toString() || '',
        salary_max: job.salary_max?.toString() || '',
        description: job.description || '',
        requirement: job.requirement || '',
        // Join array skill dari DB menjadi string dipisah koma untuk input
        required_skills: job.required_skills ? job.required_skills.join(', ') : ''
      });
    } else {
      setEditingId(null);
      setFormData({ 
        title: '', department: '', location: '', work_type: 'On-site', 
        employment_type: 'Full-time', status_job: 'active', due_date: '', 
        salary_min: '', salary_max: '', description: '', requirement: '', required_skills: '' 
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent, targetStatus: string) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const payload = { 
        ...formData, 
        status_job: targetStatus,
        created_by: user.id,
        salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
        due_date: formData.due_date || null,
        // Convert string koma ke Array sebelum simpan ke Supabase
        required_skills: formData.required_skills 
          ? formData.required_skills.split(',').map(s => s.trim()).filter(s => s !== "") 
          : []
      };

      if (editingId) await supabase.from('jobs').update(payload).eq('job_id', editingId);
      else await supabase.from('jobs').insert([payload]);

      setIsModalOpen(false);
      fetchJobs();
    } catch (err) { alert("Error saving data"); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Yakin mau hapus lowongan ini?")) {
      await supabase.from('jobs').delete().eq('job_id', id);
      fetchJobs();
    }
  };

  const filteredJobs = jobs.filter(j => j.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-10">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight uppercase">Kelola Lowongan</h1>
          <p className="text-stone-500 mt-1 font-medium italic">Atur strategi rekrutmen dan deadline lowongan.</p>
        </div>
        <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-blue-600/20 uppercase text-xs tracking-widest transition-all active:scale-95 flex items-center gap-2">
          <Plus size={18} /> Tambah Lowongan
        </button>
      </div>

      {/* SEARCH */}
      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-blue-500 transition-colors" size={20} />
        <input 
          type="text" placeholder="Cari lowongan..." 
          className="w-full pl-14 pr-6 py-5 bg-white border border-stone-200 rounded-[32px] outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 shadow-sm font-medium"
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[48px] border border-stone-100 shadow-sm overflow-hidden p-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-stone-400 font-bold text-[11px] uppercase tracking-[0.2em]">
                <th className="px-10 py-6">Informasi Lowongan</th>
                <th className="px-10 py-6 text-right pr-14">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {isLoading ? (
                <tr><td colSpan={2} className="p-32 text-center"><Loader2 className="animate-spin inline text-blue-600" size={40} /></td></tr>
              ) : filteredJobs.map((job) => {
                const today = new Date().toISOString().split('T')[0];
                const isExpired = job.due_date && job.due_date < today && job.status_job === 'active';
                return (
                  <tr key={job.job_id} className="hover:bg-stone-50/40 group transition-all duration-300">
                    <td className="px-10 py-8">
                      <Link href={`/hr/jobs/${job.job_id}`}>
                        <div className="flex items-center gap-8 justify-between w-full">
                          <div className="flex flex-col gap-2 flex-1">
                            <div className="flex items-center gap-3">
                              <div className="font-black text-stone-800 text-xl tracking-tight leading-none group-hover:text-blue-600 transition-colors">{job.title}</div>
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyles(job)}`}>
                                {isExpired ? 'Expired' : job.status_job}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-stone-400 font-bold text-xs uppercase">
                              <div className="flex items-center gap-1"><MapPin size={14} className="text-blue-400" /> {job.location}</div>
                              <span className="text-stone-200">•</span>
                              <div className="flex items-center gap-1 tracking-tighter"><Calendar size={14} /> {job.due_date || 'No Limit'}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase border ${getWorkTypeStyles(job.work_type)}`}>{job.work_type}</span>
                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase border ${getEmpTypeStyles(job.employment_type)}`}>{job.employment_type}</span>
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-10 py-8 text-right pr-12">
                      <div className="flex items-center justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal(job)} className="p-3 text-stone-400 hover:text-blue-600 hover:bg-white hover:shadow-md rounded-2xl transition-all"><Edit2 size={18}/></button>
                        <button onClick={() => handleDelete(job.job_id)} className="p-3 text-stone-400 hover:text-red-600 hover:bg-white hover:shadow-md rounded-2xl transition-all"><Trash2 size={18}/></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end bg-stone-900/60 backdrop-blur-md">
          <div className="w-full max-w-2xl h-full bg-white shadow-2xl animate-in slide-in-from-right duration-500 p-12 overflow-y-auto">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black text-stone-900 tracking-tight uppercase">{editingId ? 'Edit Data' : 'Buat Lowongan'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-stone-100 rounded-full"><X size={28} /></button>
            </div>

            <form className="space-y-8 pb-40">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Judul Pekerjaan</label>
                <input required name="title" value={formData.title} onChange={handleChange} className="w-full p-5 bg-stone-50 border border-stone-100 rounded-3xl font-bold" placeholder="e.g. Senior Frontend Engineer" />
              </div>

              {/* NEW: REQUIRED SKILLS SECTION */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={14} /> Required Skills (Pisahkan dengan koma)
                </label>
                <input 
                  name="required_skills" 
                  value={formData.required_skills} 
                  onChange={handleChange} 
                  className="w-full p-5 bg-blue-50/30 border border-blue-100 rounded-3xl font-bold text-blue-900 placeholder:text-blue-200 outline-none focus:border-blue-400 transition-all" 
                  placeholder="e.g. React, TypeScript, Tailwind CSS, Figma" 
                />
                <p className="text-[10px] text-stone-400 italic px-2">Skill ini akan digunakan AI snapHire untuk mencocokkan kandidat secara otomatis.</p>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Departemen</label>
                  <input name="department" value={formData.department} onChange={handleChange} className="w-full p-5 bg-stone-50 border border-stone-100 rounded-3xl" placeholder="Design / IT" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Deadline (Due Date)</label>
                  <input type="date" name="due_date" value={formData.due_date} onChange={handleChange} className="w-full p-5 bg-stone-50 border border-stone-100 rounded-3xl font-bold text-stone-600" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Lokasi (Kota, Negara)</label>
                  <input name="location" value={formData.location} onChange={handleChange} className="w-full p-5 bg-stone-50 border border-stone-100 rounded-3xl" placeholder="Jakarta, Indonesia" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Sistem Kerja</label>
                  <select name="work_type" value={formData.work_type} onChange={handleChange} className="w-full p-5 bg-stone-50 border border-stone-100 rounded-3xl font-bold outline-none">
                    <option value="On-site">On-site</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Tipe Pekerjaan</label>
                <select name="employment_type" value={formData.employment_type} onChange={handleChange} className="w-full p-5 bg-stone-50 border border-stone-100 rounded-3xl font-black text-stone-700 outline-none">
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Gaji Minimal (IDR)</label>
                  <input type="number" name="salary_min" value={formData.salary_min} onChange={handleChange} className="w-full p-5 bg-stone-50 border border-stone-100 rounded-3xl" placeholder="5.000.000" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Gaji Maksimal (IDR)</label>
                  <input type="number" name="salary_max" value={formData.salary_max} onChange={handleChange} className="w-full p-5 bg-stone-50 border border-stone-100 rounded-3xl" placeholder="15.000.000" />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Deskripsi Lowongan</label>
                <textarea rows={4} name="description" value={formData.description} onChange={handleChange} className="w-full p-5 bg-stone-50 border border-stone-100 rounded-3xl outline-none" placeholder="Jelaskan peran ini secara detail..." />
              </div>

              {/* ACTION BUTTONS */}
              <div className="fixed bottom-0 right-0 w-full max-w-2xl p-8 bg-white/80 backdrop-blur-md border-t border-stone-100 flex gap-4">
                <button 
                  type="button" disabled={isSubmitting}
                  onClick={(e) => handleSubmit(e, 'draft')}
                  className="flex-1 py-5 bg-stone-100 text-stone-600 font-black rounded-3xl hover:bg-stone-200 uppercase text-[12px] tracking-widest flex items-center justify-center gap-2 transition-all"
                >
                  <FileText size={16} /> Simpan Draft
                </button>
                <button 
                  type="button" disabled={isSubmitting}
                  onClick={(e) => handleSubmit(e, 'active')}
                  className="flex-[2] py-5 bg-blue-600 text-white font-black rounded-[32px] hover:bg-blue-700 shadow-xl shadow-blue-600/30 uppercase text-[12px] tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={16} />}
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