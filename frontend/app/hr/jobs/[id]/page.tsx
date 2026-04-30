"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import {
  Briefcase, MapPin, Calendar, FileText, Upload, Loader2, 
  ChevronLeft, User, Mail, Phone, Star, Download, ArrowRight
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
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
          .order('created_at', { ascending: false });

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

    if (jobId) fetchCandidates();
  }, [jobId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleUploadCV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      alert('Please select a file');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('job_id', jobId);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/cv/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      alert('CV uploaded successfully!');
      setShowUploadModal(false);
      setUploadFile(null);
      // Refresh candidates list
      const { data } = await supabase
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
        .order('created_at', { ascending: false });

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
    } catch (error: any) {
      alert(`Error: ${error.message}`);
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
          <button
            onClick={() => router.back()}
            className="p-3 hover:bg-stone-100 rounded-xl transition-colors"
          >
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
        <button
          onClick={() => router.back()}
          className="p-3 hover:bg-stone-100 rounded-xl transition-colors"
        >
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

      {/* JOB HEADER */}
      <div className="bg-white rounded-2xl border border-stone-200 p-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            {job.due_date && (
              <div className="flex items-start gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
                <Calendar size={20} className="text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Deadline</p>
                  <p className="text-stone-900 font-semibold">
                    {new Date(job.due_date).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
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
          <div className="hidden md:block">
            <div className="text-6xl opacity-10">📄</div>
          </div>
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
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
            <Loader2 size={32} className="mx-auto text-blue-600 animate-spin mb-3" />
            <p className="text-stone-600 font-medium">Loading candidates...</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
            <User size={48} className="mx-auto text-stone-300 mb-4" />
            <h3 className="text-lg font-bold text-stone-900 mb-2">No Candidates Yet</h3>
            <p className="text-stone-500">No one has applied for this position yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {candidates.map((candidate) => (
              <div
                key={candidate.application_id}
                className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm hover:shadow-md transition-all"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* CANDIDATE INFO */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-black text-stone-900">{candidate.candidate_name}</h3>
                      <p className="text-stone-500 text-sm font-medium mt-1">Applied {
                        candidate.created_at
                          ? new Date(candidate.created_at).toLocaleDateString('id-ID', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : 'N/A'
                      }</p>
                    </div>

                    <div className="space-y-2">
                      {candidate.email && (
                        <div className="flex items-center gap-2 text-stone-700">
                          <Mail size={16} className="text-blue-600" />
                          <a href={`mailto:${candidate.email}`} className="hover:text-blue-600 transition-colors font-medium">
                            {candidate.email}
                          </a>
                        </div>
                      )}
                      {candidate.phone_number && (
                        <div className="flex items-center gap-2 text-stone-700">
                          <Phone size={16} className="text-green-600" />
                          <a href={`tel:${candidate.phone_number}`} className="hover:text-green-600 transition-colors font-medium">
                            {candidate.phone_number}
                          </a>
                        </div>
                      )}
                    </div>

                    {candidate.cv_file_url && (
                      <a
                        href={candidate.cv_file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-sm"
                      >
                        <Download size={16} /> View CV
                      </a>
                    )}
                  </div>

                  {/* AI SCORING */}
                  <div className="space-y-4">
                    {candidate.ai_score !== undefined && (
                      <div className="bg-gradient-to-br from-stone-50 to-stone-100 p-4 rounded-xl border border-stone-200">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">AI Score</p>
                          <span className={`text-2xl font-black ${getScoreColor(candidate.ai_score)}`}>
                            {candidate.ai_score}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-stone-300 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              candidate.ai_score >= 80
                                ? 'bg-emerald-500'
                                : candidate.ai_score >= 60
                                ? 'bg-blue-500'
                                : candidate.ai_score >= 40
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${candidate.ai_score}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {candidate.ai_recommendation && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">AI Recommendation</p>
                        <p className="text-sm font-semibold text-stone-900">
                          {candidate.ai_recommendation}
                        </p>
                      </div>
                    )}

                    {candidate.status_application && (
                      <div>
                        <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Status</p>
                        <span className={`inline-block px-4 py-2 rounded-lg text-xs font-bold border ${getStatusBadgeColor(candidate.status_application)}`}>
                          {candidate.status_application.charAt(0).toUpperCase() + candidate.status_application.slice(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {candidate.ai_summary && (
                  <div className="mt-4 pt-4 border-t border-stone-200">
                    <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Summary</p>
                    <p className="text-sm text-stone-700 leading-relaxed">
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <h3 className="text-2xl font-black text-stone-900 mb-6">Upload CV</h3>
            <form onSubmit={handleUploadCV} className="space-y-4">
              <div className="border-2 border-dashed border-stone-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="cv-upload"
                />
                <label htmlFor="cv-upload" className="cursor-pointer">
                  <FileText size={32} className="mx-auto text-stone-400 mb-2" />
                  <p className="text-sm font-bold text-stone-900">
                    {uploadFile ? uploadFile.name : 'Click to select PDF'}
                  </p>
                  <p className="text-xs text-stone-500 mt-1">PDF files only</p>
                </label>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFile(null);
                  }}
                  className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-900 px-6 py-3 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadFile || isUploading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-stone-300 text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={18} /> Upload
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
