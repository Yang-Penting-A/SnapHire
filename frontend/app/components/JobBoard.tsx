"use client";

import React, { useEffect, useState } from 'react';
import { 
  MapPin, Briefcase, DollarSign, Clock, Building2, 
  Palette, Code, Database, X, Lock 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

interface Job {
  job_id: string;
  title: string;
  location: string;
  employment_type: string;
  additional_tag: string;
  salary_min: number;
  salary_max: number;
  department: string;
  description: string;
  requirement: string;
}

export default function JobBoard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .in('status_job', ['open', 'active']) 
          .order('created_at', { ascending: false })
          .limit(3); 

        if (error) {
          console.error('Supabase query error:', error);
          throw error;
        }
        
        if (data && data.length > 0) {
          setJobs(data);
        } else {
          setJobs([]);
        }
      } catch (error) {
        setJobs([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const formatSalary = (amount: number) => {
    return `${amount / 1000000} Jt`;
  };

  const getDepartmentIcon = (department: string) => {
    switch (department.toLowerCase()) {
      case 'design': return <Palette size={24} />;
      case 'engineering': return <Code size={24} />;
      case 'data': return <Database size={24} />;
      default: return <Building2 size={24} />;
    }
  };

  const openDetailModal = (e: React.MouseEvent, job: Job) => {
    e.preventDefault();
    setSelectedJob(job);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setTimeout(() => setSelectedJob(null), 200);
  };

  return (
    <>
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Lowongan Terbaru</h2>
            <p className="text-slate-500">Temukan posisi yang pas untuk mengembangkan karirmu.</p>
          </div>
          <Link href="/register" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
            Lihat Semua Lowongan &rarr;
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <div key={job.job_id} className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all hover:-translate-y-1 group flex flex-col">
                
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {getDepartmentIcon(job.department)}
                  </div>
                  <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    {job.department}
                  </span>
                </div>

                <button 
                  onClick={(e) => openDetailModal(e, job)} 
                  className="text-left block text-xl font-bold text-slate-900 mb-3 hover:text-blue-600 transition-colors"
                >
                  {job.title}
                </button>
                
                <div className="flex flex-col gap-3 mb-6">
                  <div className="flex items-center text-slate-500 text-sm gap-2">
                    <MapPin size={16} className="text-slate-400" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center text-slate-500 text-sm gap-2">
                    <Briefcase size={16} className="text-slate-400" />
                    <span>{job.employment_type} • {job.additional_tag}</span>
                  </div>
                  <div className="flex items-center text-slate-500 text-sm gap-2">
                    <DollarSign size={16} className="text-slate-400" />
                    <span>IDR {formatSalary(job.salary_min)} - {formatSalary(job.salary_max)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                  <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                    <Clock size={14} /> Baru saja
                  </span>
                  <Link href="/login" className="bg-slate-50 text-blue-600 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-600 hover:text-white transition-colors text-center inline-block">
                    Lamar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && jobs.length === 0 && (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <p className="text-slate-500">Belum ada lowongan yang tersedia saat ini.</p>
          </div>
        )}
      </section>

      {isDetailModalOpen && selectedJob && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200"
          onClick={closeDetailModal}
        >
          
          <div 
            className="bg-white rounded-[2rem] max-w-3xl w-full shadow-2xl relative animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-start shrink-0">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                  {getDepartmentIcon(selectedJob.department)}
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-1">{selectedJob.title}</h2>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                    <span className="flex items-center text-slate-500 text-sm gap-1.5 font-medium bg-slate-50 px-3 py-1 rounded-lg">
                      <MapPin size={14} className="text-slate-400" /> {selectedJob.location}
                    </span>
                    <span className="flex items-center text-slate-500 text-sm gap-1.5 font-medium bg-slate-50 px-3 py-1 rounded-lg">
                      <DollarSign size={14} className="text-slate-400" /> IDR {formatSalary(selectedJob.salary_min)} - {formatSalary(selectedJob.salary_max)}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={closeDetailModal}
                className="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto relative">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Deskripsi Pekerjaan</h3>
              
              <div className="relative h-[200px] overflow-hidden">
                <p className="text-slate-600 leading-relaxed mb-6 whitespace-pre-line">
                  {selectedJob.description}
                  <br/><br/>
                  <span className="font-bold text-slate-800">Persyaratan:</span><br/>
                  {selectedJob.requirement}
                  <br/><br/>
                  Bergabunglah dengan tim kami yang dinamis. Kami menawarkan jenjang karir yang jelas, asuransi kesehatan yang komprehensif, dan fleksibilitas kerja untuk menjaga work-life balance Anda...
                </p>
                
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white via-white/90 to-white/0"></div>
              </div>

              <div className="mt-2 flex flex-col items-center justify-center text-center relative z-10 -mt-10">
                <div className="bg-white/90 backdrop-blur-md px-6 py-8 w-full border border-blue-100 rounded-2xl shadow-xl shadow-blue-900/5 text-center">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock size={20} />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2">Ingin membaca rincian lengkapnya?</h4>
                  <p className="text-slate-500 mb-6 text-sm max-w-sm mx-auto">
                    Buat akun sekarang untuk membuka akses ke seluruh detail pekerjaan, persyaratan, dan langsung melamar.
                  </p>
                  
                  <Link href="/register" className="inline-flex w-full sm:w-auto items-center justify-center bg-blue-600 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                    Daftar untuk Membaca Selengkapnya
                  </Link>
                  <p className="mt-4 text-xs text-slate-400">
                    Sudah punya akun? <Link href="/login" className="text-blue-600 font-bold hover:underline">Masuk</Link>
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}