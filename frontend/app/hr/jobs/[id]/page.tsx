"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import {
  Briefcase, MapPin, Calendar, FileText, Upload, Loader2, 
  ChevronLeft, User, Mail, Phone, Star, Download, ArrowRight,
  DollarSign, CheckCircle2, AlertCircle
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

interface Candidate {
  application_id: string;
  candidate_id: string;
  candidate_name: string;
  email: string;
  phone_number?: string;
  cv_file_url?: string;
  ai_score?: number;
  ai_summary?: string;
  ai_recommendation?: string;
  status_application?: string;
  created_at?: string;
}

export default function JobDetailHR() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobDetail | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCandidatesLoading, setIsCandidatesLoading] = useState(false);
  
  // Modal States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false); // MODAL BARU PENGGANTI ALERT
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

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

  // Fetch Candidates for this Job
  useEffect(() => {
    fetchCandidates();
  }, [jobId]);

  const fetchCandidates = async () => {
    setIsCandidatesLoading(true);
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          application_id,
          candidate_id,
          ai_score,
          ai_summary,
          ai_recommendation,
          status_application,
          created_at,
          candidates (
            name,
            email,
            phone_number,
            cv_file_url
          )
        `)
        .eq('job_id', jobId)
        .order('ai_score', { ascending: false });

      if (error) {
        console.error('Error fetching candidates:', error);
        return;
      }

      const formattedData = data?.map((app: any) => ({
        application_id: app.application_id,
        candidate_id: app.candidate_id,
        candidate_name: app.candidates?.name || 'Unknown',
        email: app.candidates?.email,
        phone_number: app.candidates?.phone_number,
        cv_file_url: app.candidates?.cv_file_url,
        ai_score: app.ai_score,
        ai_summary: app.ai_summary,
        ai_recommendation: app.ai_recommendation,
        status_application: app.status_application,
        created_at: app.created_at
      })) || [];

      setCandidates(formattedData);
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setIsCandidatesLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadFile(e.target.files[0]);
      setUploadError('');
    }
  };

  // LOGIC UPLOAD BARU: SUPABASE STORAGE + DUMMY INSERT BIAR SINKRON KE LIST PELAMAR
  const handleUploadCV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Pilih file PDF terlebih dahulu!');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('job_id', jobId);

      // Tembak API Azure persis kayak kode awal temen lu
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/cv/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (!response.ok) {
        throw new Error('Upload ke server Azure gagal!');
      }

      // Hilangin loading, tutup modal upload, buka modal sukses
      setShowUploadModal(false);
      setUploadFile(null);
      setShowSuccessModal(true);
      
      // Refresh list kandidat
      fetchCandidates(); 

    } catch (error: any) {
      setUploadError(`Gagal upload: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };


  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-amber-600 bg-amber-50';
    return 'text-rose-600 bg-rose-50';
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'review ai':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'shortlisted':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'interview':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'technical test':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'hired':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-10">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-3 hover:bg-stone-100 rounded-xl transition-colors">
            <ChevronLeft size={24} className="text-stone-600" />
          </button>
          <div className="h-10 w-96 bg-stone-200 rounded-xl animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-stone-100 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto pb-10">
        <button onClick={() => router.back()} className="p-3 hover:bg-stone-100 rounded-xl transition-colors">
          <ChevronLeft size={24} className="text-stone-600" />
        </button>
        <div className="bg-white rounded-2xl p-8 text-center border border-stone-200">
          <Briefcase size={48} className="mx-auto text-stone-400 mb-4" />
          <h2 className="text-xl font-bold text-stone-900 mb-2">Job Not Found</h2>
          <p className="text-stone-500">The job posting you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-10">
      {/* BACK BUTTON */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-stone-600 hover:text-blue-600 font-semibold transition-colors group"
      >
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        Back to Jobs
      </button>

      {/* JOB HEADER - DILENGKAPI KETERANGAN GAJI & SKILLS */}
      <div className="bg-white rounded-[2rem] border border-stone-200 p-8 shadow-sm relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div>
            <h1 className="text-4xl font-black text-stone-900 mb-3">{job.title}</h1>
            <p className="text-stone-500 font-medium mb-6">
              {job.department || 'General Department'}
            </p>
            <div className="flex flex-wrap gap-3 mb-6">
              {job.work_type && (
                <span className="bg-purple-100 text-purple-700 px-4 py-2 rounded-xl text-xs font-bold border border-purple-200">
                  {job.work_type}
                </span>
              )}
              {job.employment_type && (
                <span className="bg-teal-100 text-teal-700 px-4 py-2 rounded-xl text-xs font-bold border border-teal-200">
                  {job.employment_type}
                </span>
              )}
              <span className={`px-4 py-2 rounded-xl text-xs font-bold border ${
                job.status_job === 'active'
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  : 'bg-amber-100 text-amber-700 border-amber-200'
              }`}>
                {job.status_job || 'Active'}
              </span>
            </div>

            {/* KETERANGAN SKILL DITAMBAHKAN */}
            {job.required_skills && job.required_skills.length > 0 && (
              <div className="mt-8 border-t border-stone-100 pt-6">
                <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">Required Skills</p>
                <div className="flex flex-wrap gap-2">
                  {job.required_skills.map((skill, i) => (
                    <span key={i} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {job.location && (
              <div className="flex items-start gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
                <MapPin size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Location</p>
                  <p className="text-stone-900 font-semibold">{job.location}</p>
                </div>
              </div>
            )}

            {/* KETERANGAN GAJI DITAMBAHKAN */}
            {(job.salary_min || job.salary_max) && (
              <div className="flex items-start gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
                <DollarSign size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Salary Range</p>
                  <p className="text-stone-900 font-semibold">
                    Rp {job.salary_min?.toLocaleString('id-ID') || '0'} - Rp {job.salary_max?.toLocaleString('id-ID') || '0'}
                  </p>
                </div>
              </div>
            )}

            {job.due_date && (
              <div className="flex items-start gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
                <Calendar size={20} className="text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Deadline</p>
                  <p className="text-stone-900 font-semibold">
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

      {/* JOB REQUIREMENTS */}
      {job.requirement && (
        <div className="bg-white rounded-2xl border border-stone-200 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <FileText size={24} className="text-blue-600" />
            <h2 className="text-2xl font-black text-stone-900">Job Requirements</h2>
          </div>
          <div className="prose prose-sm max-w-none text-stone-700">
            <div className="whitespace-pre-wrap leading-relaxed bg-stone-50 p-6 rounded-xl border border-stone-200">
              {job.requirement}
            </div>
          </div>
        </div>
      )}

      {/* JOB DESCRIPTION */}
      {job.description && (
        <div className="bg-white rounded-2xl border border-stone-200 p-8 shadow-sm">
          <h2 className="text-2xl font-black text-stone-900 mb-6">Job Description</h2>
          <div className="whitespace-pre-wrap leading-relaxed text-stone-700 bg-stone-50 p-6 rounded-xl border border-stone-200">
            {job.description}
          </div>
        </div>
      )}

      {/* UPLOAD CV SECTION */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-8 shadow-sm">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Upload size={24} className="text-blue-600" />
              <h3 className="text-2xl font-black text-stone-900">Upload CV</h3>
            </div>
            <p className="text-stone-700 font-medium mb-4">
              Manually upload candidate CVs for this position. They will be processed with AI screening.
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-2 text-sm uppercase tracking-widest"
            >
              <Upload size={18} /> Upload CV
            </button>
          </div>
          <div className="hidden md:block text-6xl opacity-10">📄</div>
        </div>
      </div>

      {/* CANDIDATE LIST */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-stone-900">Candidate List</h2>
            <p className="text-stone-500 font-medium mt-1">
              {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} applied for this position
            </p>
          </div>
        </div>

        {isCandidatesLoading ? (
          <div className="bg-white rounded-[2rem] border border-stone-200 p-8 text-center">
            <Loader2 size={32} className="mx-auto text-blue-600 animate-spin mb-3" />
            <p className="text-stone-600 font-medium">Loading candidates...</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-stone-200 p-8 text-center py-20">
            <User size={48} className="mx-auto text-stone-300 mb-4" />
            <h3 className="text-lg font-bold text-stone-900 mb-2">No Candidates Yet</h3>
            <p className="text-stone-500">No one has applied for this position yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* FITUR RANKING: Udah diurutin berdasarkan skor dari query, ditambahin label Ranking di UI */}
            {candidates.map((candidate, index) => (
              <div
                key={candidate.application_id}
                className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all relative overflow-hidden"
              >
                {/* Badge Rank */}
                <div className="absolute top-0 right-0 bg-stone-100 text-stone-400 font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-bl-2xl">
                  Rank #{index + 1}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                  {/* CANDIDATE INFO */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-black text-stone-900">{candidate.candidate_name}</h3>
                      <p className="text-stone-500 text-sm font-medium mt-1">Applied {
                        candidate.created_at
                          ? new Date(candidate.created_at).toLocaleDateString('id-ID', {
                              weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                            })
                          : 'N/A'
                      }</p>
                    </div>

                    <div className="space-y-2">
                      {candidate.email && (
                        <div className="flex items-center gap-2 text-stone-700">
                          <Mail size={16} className="text-blue-600" />
                          <a href={`mailto:${candidate.email}`} className="hover:text-blue-600 transition-colors font-medium text-sm">
                            {candidate.email}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* FITUR VIEW CV YANG BENER */}
                    {candidate.cv_file_url ? (
                      <a
                        href={candidate.cv_file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-xl hover:bg-stone-800 font-bold text-xs uppercase tracking-widest transition-colors mt-2"
                      >
                        <Download size={14} /> Lihat File CV
                      </a>
                    ) : (
                      <p className="text-xs font-bold text-stone-400 italic">File CV tidak tersedia</p>
                    )}
                  </div>

                  {/* AI SCORING */}
                  <div className="space-y-4">
                    {candidate.ai_score !== undefined && candidate.ai_score !== null && (
                      <div className="bg-gradient-to-br from-stone-50 to-stone-100 p-4 rounded-xl border border-stone-200">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">AI Score</p>
                          <span className={`text-2xl font-black ${getScoreColor(candidate.ai_score)}`}>
                            {candidate.ai_score}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              candidate.ai_score >= 80 ? 'bg-emerald-500' : candidate.ai_score >= 60 ? 'bg-blue-500' : candidate.ai_score >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${candidate.ai_score}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {candidate.status_application && (
                      <div>
                        <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Status</p>
                        <span className={`inline-block px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest border ${getStatusBadgeColor(candidate.status_application)}`}>
                          {candidate.status_application}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {candidate.ai_summary && (
                  <div className="mt-6 pt-4 border-t border-stone-100">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">AI Summary</p>
                    <p className="text-sm text-stone-700 leading-relaxed font-medium bg-stone-50 p-4 rounded-xl border border-stone-100">
                      {candidate.ai_summary}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* UPLOAD CV MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-stone-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-stone-900 mb-6">Upload CV</h3>
            
            {uploadError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold rounded-xl flex items-center gap-2">
                <AlertCircle size={16} /> {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadCV} className="space-y-4">
              <div className="border-2 border-dashed border-stone-200 rounded-2xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer bg-stone-50 group">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="cv-upload"
                />
                <label htmlFor="cv-upload" className="cursor-pointer block">
                  <div className="w-16 h-16 bg-white shadow-sm rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Upload size={24} />
                  </div>
                  <p className="text-sm font-black text-stone-900 mb-1">
                    {uploadFile ? uploadFile.name : 'Pilih File PDF'}
                  </p>
                  <p className="text-xs text-stone-500 font-medium">Hanya menerima format PDF</p>
                </label>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFile(null);
                    setUploadError('');
                  }}
                  className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-600 py-3.5 rounded-xl font-bold transition-colors text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!uploadFile || isUploading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-stone-300 disabled:shadow-none text-white py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2 text-sm"
                >
                  {isUploading ? (
                    <><Loader2 size={16} className="animate-spin" /> Uploading...</>
                  ) : (
                    <><Upload size={16} /> Upload CV</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUCCESS UPLOAD MODAL (PENGGANTI ALERT) */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-stone-900/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-2xl font-black text-stone-900 mb-2">Upload Berhasil!</h3>
            <p className="text-stone-500 font-medium text-sm mb-8 leading-relaxed">
              Data pelamar telah tersinkronisasi ke sistem dan masuk ke dalam Global Talent Pool.
            </p>
            <button 
              onClick={() => setShowSuccessModal(false)} 
              className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-black py-4 rounded-2xl transition-colors uppercase tracking-widest text-xs"
            >
              Tutup Modal
            </button>
          </div>
        </div>
      )}

    </div>
  );
}