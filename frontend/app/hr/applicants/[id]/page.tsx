"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import { 
  ArrowLeft, Mail, Phone, MapPin, Briefcase, 
  Link as LinkIcon, Globe, Star, FileText, CheckCircle2, 
  XCircle, Loader2, User, ExternalLink
} from 'lucide-react'; 
import InterviewModal from "@/app/components/InterviewModal";

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;

  const [application, setApplication] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showInterviewModal, setShowInterviewModal] = useState(false);

  useEffect(() => {
    const fetchCandidateDetail = async () => {
      try {
        const { data, error } = await supabase
          .from('applications')
          .select(`
            application_id, status_application, ai_score,
            ai_summary, ai_strengths, ai_weaknesses, ai_recommendation, created_at,
            candidates ( name, email, phone_number, linkedin_url, portfolio_url, cv_file_url ),
            jobs ( title, department )
          `)
          .eq('application_id', applicationId)
          .single();

        if (error) throw error;
        setApplication(data);
      } catch (error) {
        console.error("Error fetching detail:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (applicationId) fetchCandidateDetail();
  }, [applicationId]);

  const updateStatus = async (newStatus: string, interviewData?: any) => {
    try {
      console.log(`[INTERVIEW SCHEDULING] Updating status to: ${newStatus}`, interviewData);
      
      const { error } = await supabase
        .from('applications')
        .update({ status_application: newStatus })
        .eq('application_id', applicationId);

      if (error) throw error;
      
      // Trigger ATS email automation if applicable
      if (['Interview', 'Technical Test', 'Hired', 'Rejected'].includes(newStatus)) {
        triggerAtsAutomation(applicationId, newStatus, interviewData).catch(err => 
          console.error('[ATS AUTOMATION] Error:', err)
        );
      }
      
      setApplication({ ...application, status_application: newStatus });
    } catch (err: any) {
      alert("Gagal update status: " + err.message);
    }
  };

  const triggerAtsAutomation = async (applicationId: string, newStatus: string, interviewData?: any) => {
    try {
      console.log('[ATS AUTOMATION] Triggering automation with interview data:', interviewData);
      
      const payload = {
        applicationId,
        newStatus,
        ...(interviewData && { interviewData })
      };

      console.log('[ATS AUTOMATION] Full payload:', payload);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/trigger-ats-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ATS AUTOMATION] Trigger failed:', errorText);
      } else {
        console.log('[ATS AUTOMATION] Successfully triggered automation');
      }
    } catch (err) {
      console.error('[ATS AUTOMATION] Network error:', err);
    }
  };

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

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="text-blue-600 animate-spin" />
        <p className="text-stone-400 font-black uppercase tracking-widest text-[10px] animate-pulse">Menyiapkan Data Kandidat...</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-20 bg-white rounded-[2rem] border border-stone-100 shadow-sm max-w-2xl mx-auto mt-10">
        <User size={48} className="mx-auto text-stone-300 mb-4" />
        <h2 className="text-2xl font-black text-stone-800">Kandidat Tidak Ditemukan</h2>
        <p className="text-stone-500 mt-2 font-medium">Data pelamar mungkin sudah dihapus dari database.</p>
        <button 
          onClick={() => router.back()} 
          className="mt-6 px-6 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-black rounded-xl text-xs uppercase tracking-widest transition-colors"
        >
          Kembali ke List
        </button>
      </div>
    );
  }

  const candidate = application.candidates;
  const currentStatus = application.status_application || 'Review AI';

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12 px-4">
      
      <div className="pt-2">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[11px] font-black text-stone-400 uppercase tracking-widest hover:text-blue-600 transition-colors w-fit"
        >
          <ArrowLeft size={16} /> Kembali ke List Pelamar
        </button>
      </div>

      <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-stone-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-[1.25rem] bg-stone-50 border border-stone-200 text-stone-500 flex items-center justify-center font-black text-3xl shadow-sm uppercase shrink-0">
            {candidate?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">{candidate?.name}</h1>
            <div className="flex items-center gap-2 mt-1.5">
              <Briefcase size={14} className="text-stone-400" />
              <p className="text-stone-600 font-bold text-sm">
                Melamar Posisi: <span className="text-blue-600">{application.jobs?.title}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col w-full md:w-auto gap-2 border-t md:border-t-0 md:border-l border-stone-100 pt-4 md:pt-0 md:pl-8">
          <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Ubah Status Kandidat</label>
          <select 
            value={currentStatus}
            onChange={(e) => {
              const selectedValue = (e.target.value || '').toString();
              console.log('[INTERVIEW SCHEDULING] Status dropdown changed to:', selectedValue, 'currentStatus=', currentStatus);

              // Intercept Interview status (case-insensitive) - show modal instead of updating immediately
              if (selectedValue.trim().toLowerCase() === 'interview') {
                console.log('[INTERVIEW SCHEDULING] Interview status selected - opening modal');
                setShowInterviewModal(true);
                return;
              }

              // For all other statuses, update immediately
              updateStatus(selectedValue);
            }}
            className={`
              w-full md:w-56 px-4 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest outline-none cursor-pointer transition-all appearance-none text-center shadow-sm border
              ${getStatusBadgeColor(currentStatus)}
            `}
          >
            {['Review AI', 'Shortlisted', 'Interview', 'Technical Test', 'Hired', 'Rejected'].map(s => (
              <option key={s} value={s} className="bg-white text-stone-700 font-bold">{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] p-8 border border-stone-200 shadow-sm">
            <h3 className="text-sm font-black text-stone-800 uppercase tracking-widest mb-6 flex items-center gap-2">
              <User size={18} className="text-stone-400"/> Data Pribadi
            </h3>
            
            <div className="space-y-5">
              <div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1.5">Email</p>
                <a href={`mailto:${candidate?.email}`} className="flex items-center gap-2.5 text-stone-700 font-bold hover:text-blue-600 transition-colors text-sm">
                  <Mail size={16} className="text-stone-300" /> <span className="truncate">{candidate?.email || '-'}</span>
                </a>
              </div>
              <div className="h-px w-full bg-stone-100"></div>
              <div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1.5">Nomor Telepon</p>
                <a href={`tel:${candidate?.phone_number}`} className="flex items-center gap-2.5 text-stone-700 font-bold hover:text-blue-600 transition-colors text-sm">
                  <Phone size={16} className="text-stone-300" /> {candidate?.phone_number || '-'}
                </a>
              </div>
              <div className="h-px w-full bg-stone-100"></div>
              <div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1.5">Lokasi</p>
                <p className="flex items-center gap-2.5 text-stone-700 font-bold text-sm">
                  <MapPin size={16} className="text-stone-300" /> Tidak disebutkan
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-8 border border-stone-200 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-stone-800 uppercase tracking-widest mb-6 flex items-center gap-2">
              <FileText size={18} className="text-stone-400"/> Dokumen & Tautan
            </h3>
            
            {candidate?.cv_file_url ? (
              <a 
                href={candidate.cv_file_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full py-4 bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 text-blue-700 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
              >
                <ExternalLink size={16} strokeWidth={2.5} /> Buka File CV
              </a>
            ) : (
              <button disabled className="w-full py-4 bg-stone-50 border border-stone-100 text-stone-400 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 cursor-not-allowed">
                <FileText size={16} /> CV Tidak Tersedia
              </button>
            )}

            {candidate?.linkedin_url && (
              <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer" className="w-full py-4 bg-[#0A66C2]/5 border border-[#0A66C2]/20 hover:bg-[#0A66C2]/10 text-[#0A66C2] rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
                <LinkIcon size={16} /> Profil LinkedIn
              </a>
            )}
            
            {candidate?.portfolio_url && (
              <a href={candidate.portfolio_url} target="_blank" rel="noopener noreferrer" className="w-full py-4 bg-stone-50 border border-stone-200 hover:bg-stone-100 text-stone-700 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
                <Globe size={16} /> Website / Portofolio
              </a>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2rem] p-8 border border-stone-200 shadow-sm h-full">
            
            {!application.ai_score ? (
              <div className="h-full flex flex-col items-center justify-center py-20 bg-stone-50 rounded-3xl border border-dashed border-stone-200">
                <div className="bg-white p-4 rounded-full shadow-sm border border-stone-100 mb-4">
                  <Star size={32} className="text-stone-300" />
                </div>
                <p className="font-black text-stone-700 text-lg">Belum Ada Evaluasi AI</p>
                <p className="text-stone-500 font-medium text-sm mt-2 text-center max-w-xs">Kandidat ini belum dianalisis oleh sistem AI SnapHire.</p>
              </div>
            ) : (
              <div className="space-y-8">
                
                <div className="bg-stone-50 rounded-3xl p-6 md:p-8 border border-stone-200 flex flex-col md:flex-row items-center gap-8">
                  <div className="flex flex-col items-center justify-center min-w-[140px] h-[140px] bg-white rounded-[1.5rem] border border-stone-100 shadow-sm">
                    <span className="text-5xl font-black text-blue-600 tracking-tighter">{application.ai_score}%</span>
                    <div className="flex items-center gap-1 mt-1 text-stone-400">
                      <Star size={10} className="fill-blue-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Match</span>
                    </div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 flex items-center justify-center md:justify-start gap-1.5">
                      <Star size={14} className="text-blue-500" /> Rekomendasi Sistem
                    </h4>
                    <p className="text-sm font-bold text-stone-700 leading-relaxed">
                      {application.ai_recommendation || 'Evaluasi manual disarankan untuk memastikan kecocokan budaya kerja.'}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <FileText size={16} className="text-stone-300"/> Ringkasan Eksekutif
                  </h4>
                  <p className="text-stone-600 text-sm leading-relaxed font-medium p-6 bg-white border border-stone-200 rounded-2xl shadow-sm">
                    {application.ai_summary || 'Tidak ada ringkasan tersedia dari CV ini.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm">
                    <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <CheckCircle2 size={16} /> Kelebihan (Strengths)
                    </h4>
                    <ul className="space-y-3">
                      {application.ai_strengths?.map((strength: string, i: number) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm font-medium text-stone-600 leading-relaxed">
                          <span className="text-emerald-500 mt-0.5">•</span> {strength}
                        </li>
                      )) || <li className="text-sm font-medium text-stone-400 italic">Tidak ada data terdeteksi.</li>}
                    </ul>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm">
                    <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <XCircle size={16} /> Kekurangan (Gaps)
                    </h4>
                    <ul className="space-y-3">
                      {application.ai_weaknesses?.map((weakness: string, i: number) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm font-medium text-stone-600 leading-relaxed">
                          <span className="text-rose-500 mt-0.5">•</span> {weakness}
                        </li>
                      )) || <li className="text-sm font-medium text-stone-400 italic">Tidak ada data terdeteksi.</li>}
                    </ul>
                  </div>

                </div>
              </div>
            )}
            
          </div>
        </div>

      </div>

      {/* Interview Scheduling Modal */}
      <InterviewModal
        isOpen={showInterviewModal}
        onClose={() => setShowInterviewModal(false)}
        onSubmit={async (interviewData) => {
          console.log('[INTERVIEW SCHEDULING] Modal submitted with data:', interviewData);
          // After modal submission, continue with the existing status update flow
          await updateStatus('Interview', interviewData);
          setShowInterviewModal(false);
        }}
      />
    </div>
  );
}