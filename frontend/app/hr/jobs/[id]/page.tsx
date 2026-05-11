"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import {
  Briefcase, MapPin, Calendar, FileText, Loader2, 
  ChevronLeft, DollarSign, CheckCircle2, Users, ScanSearch, ChevronRight
} from 'lucide-react';

interface JobDetail {
  job_id: string;
  title: string;
  department?: string;
  location: string;
  due_date?: string;
  requirement?: string;
  description?: string;
  work_type?: string;
  employment_type?: string;
  salary_min?: number;
  salary_max?: number;
  required_skills?: string[];
  status_job?: string;
}

export default function JobDetailHR() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Job Details
  useEffect(() => {
    const fetchJobDetail = async () => {
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('job_id', jobId)
          .single();

        if (error) {
          console.error('Error fetching job:', error);
          return;
        }
        setJob(data);
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (jobId) fetchJobDetail();
  }, [jobId]);

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-10 px-4">
        <div className="flex items-center gap-4 pt-2">
          <div className="h-6 w-32 bg-stone-200 rounded-lg animate-pulse"></div>
        </div>
        <div className="h-64 bg-stone-100 rounded-[2.5rem] animate-pulse border border-stone-200"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto pb-10 px-4">
        <button onClick={() => router.push('/hr/jobs')} className="flex items-center gap-2 text-stone-500 hover:text-blue-600 text-xs font-black uppercase tracking-widest pt-2">
          <ChevronLeft size={16} /> Kembali ke Kelola Lowongan
        </button>
        <div className="bg-white rounded-[2.5rem] p-12 text-center border border-stone-100 shadow-sm">
          <Briefcase size={48} className="mx-auto text-stone-300 mb-4" />
          <h2 className="text-2xl font-black text-stone-800 mb-2">Lowongan Tidak Ditemukan</h2>
          <p className="text-stone-500">Data lowongan yang Anda cari mungkin sudah dihapus.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12 px-4">
      
      {/* 1. BACK BUTTON */}
      <div className="pt-2">
        <button
          onClick={() => router.push('/hr/jobs')}
          className="flex items-center gap-2 text-[11px] font-black text-stone-400 uppercase tracking-widest hover:text-blue-600 transition-colors w-fit group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Kembali ke Kelola Lowongan
        </button>
      </div>

      {/* 2. JOB HEADER */}
      <div className="bg-white rounded-[2rem] border border-stone-200 p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-stone-900 mb-2 tracking-tight">{job.title}</h1>
            <p className="text-stone-500 font-bold mb-6 flex items-center gap-2 text-sm">
              <Briefcase size={16}/> {job.department || 'General Department'}
            </p>
            
            <div className="flex flex-wrap gap-3 mb-6">
              {job.work_type && (
                <span className="bg-purple-50 text-purple-700 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border border-purple-100">
                  {job.work_type}
                </span>
              )}
              {job.employment_type && (
                <span className="bg-teal-50 text-teal-700 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border border-teal-100">
                  {job.employment_type}
                </span>
              )}
              <span className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border ${
                job.status_job === 'active'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {job.status_job || 'Active'}
              </span>
            </div>

            {/* REQUIRED SKILLS */}
            {job.required_skills && job.required_skills.length > 0 && (
              <div className="mt-8 border-t border-stone-100 pt-6">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3">Required Skills</p>
                <div className="flex flex-wrap gap-2">
                  {job.required_skills.map((skill, i) => (
                    <span key={i} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100 shadow-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {job.location && (
              <div className="flex items-center gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-100">
                <div className="p-2 bg-white rounded-xl shadow-sm"><MapPin size={18} className="text-blue-500" /></div>
                <div>
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-0.5">Lokasi</p>
                  <p className="text-stone-800 font-bold text-sm">{job.location}</p>
                </div>
              </div>
            )}

            {(job.salary_min || job.salary_max) && (
              <div className="flex items-center gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-100">
                <div className="p-2 bg-white rounded-xl shadow-sm"><DollarSign size={18} className="text-emerald-500" /></div>
                <div>
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-0.5">Kisaran Gaji</p>
                  <p className="text-stone-800 font-bold text-sm">
                    Rp {job.salary_min?.toLocaleString('id-ID') || '0'} - Rp {job.salary_max?.toLocaleString('id-ID') || '0'}
                  </p>
                </div>
              </div>
            )}

            {job.due_date && (
              <div className="flex items-center gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-100">
                <div className="p-2 bg-white rounded-xl shadow-sm"><Calendar size={18} className="text-rose-500" /></div>
                <div>
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-0.5">Deadline</p>
                  <p className="text-stone-800 font-bold text-sm">
                    {new Date(job.due_date).toLocaleDateString('id-ID', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* JOB REQUIREMENTS & DESCRIPTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {job.requirement && (
          <div className="bg-white rounded-[2rem] border border-stone-200 p-6 sm:p-8 shadow-sm">
            <h2 className="text-sm font-black text-stone-800 uppercase tracking-widest mb-4 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-stone-400" /> Persyaratan
            </h2>
            <div className="whitespace-pre-wrap leading-relaxed text-stone-600 text-sm font-medium">
              {job.requirement}
            </div>
          </div>
        )}

        {job.description && (
          <div className="bg-white rounded-[2rem] border border-stone-200 p-6 sm:p-8 shadow-sm">
            <h2 className="text-sm font-black text-stone-800 uppercase tracking-widest mb-4 flex items-center gap-2">
              <FileText size={18} className="text-stone-400" /> Deskripsi Pekerjaan
            </h2>
            <div className="whitespace-pre-wrap leading-relaxed text-stone-600 text-sm font-medium">
              {job.description}
            </div>
          </div>
        )}
      </div>

      {/* PINTASAN QUICK ACTIONS (Menggantikan Upload & List Pelamar) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <button
          onClick={() => router.push(`/hr/applicants?jobId=${job.job_id}`)}
          className="bg-white border border-stone-200 hover:border-blue-300 hover:shadow-lg p-6 rounded-[2rem] transition-all duration-300 group flex items-center justify-between text-left active:scale-[0.98]"
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-[1.25rem] flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shrink-0">
              <Users size={24} />
            </div>
            <div>
              <h3 className="font-black text-stone-900 text-base">Lihat Pelamar</h3>
              <p className="text-xs text-stone-500 font-medium mt-1">Cek daftar kandidat untuk posisi ini</p>
            </div>
          </div>
          <ChevronRight size={24} className="text-stone-300 group-hover:text-blue-600 transition-colors" />
        </button>

        <button
          onClick={() => router.push(`/hr/scan-cv`)}
          className="bg-white border border-stone-200 hover:border-blue-300 hover:shadow-lg p-6 rounded-[2rem] transition-all duration-300 group flex items-center justify-between text-left active:scale-[0.98]"
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-[1.25rem] flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shrink-0">
              <ScanSearch size={24} />
            </div>
            <div>
              <h3 className="font-black text-stone-900 text-base">Scan CV AI</h3>
              <p className="text-xs text-stone-500 font-medium mt-1">Mulai proses unggah CV pelamar baru</p>
            </div>
          </div>
          <ChevronRight size={24} className="text-stone-300 group-hover:text-emerald-600 transition-colors" />
        </button>
      </div>

    </div>
  );
}