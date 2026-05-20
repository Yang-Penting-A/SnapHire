"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import InterviewModal from '@/app/components/InterviewModal';
import TechnicalTestModal from '@/app/components/TechnicalTestModal';
import HiredModal from '@/app/components/HiredModal';
import RejectedConfirmModal from '@/app/components/RejectedConfirmModal';
import ShortlistedConfirmModal from '@/app/components/ShortlistedConfirmModal';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import ConfirmRescanModal from "@/app/components/ConfirmRescanModal";
import sessionManager from '@/app/lib/sessionManager';
import { 
  Search, Star, Loader2, Briefcase, Filter, Inbox, RefreshCw
} from 'lucide-react';

const MASTER_STATUSES = ['Review AI', 'Shortlisted', 'Interview', 'Technical Test', 'Hired', 'Rejected'];

function ListPelamarContent() {
  const router = useRouter(); 
  const searchParams = useSearchParams();
  
  const initialJobId = searchParams.get('jobId') || '';

  const [applicants, setApplicants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [availableStatuses] = useState<string[]>(MASTER_STATUSES);

  // State untuk proses Re-scan AI
  const [scanningIds, setScanningIds] = useState<string[]>([]);
  const [isBulkScanning, setIsBulkScanning] = useState(false);
  const fetchDataRef = useRef<() => void>(() => {});

  const [openConfirm, setOpenConfirm] = useState(false); 
  const [isBulkRescan, setIsBulkRescan] = useState(false); 
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null); 
  const [isRescanning, setIsRescanning] = useState(false);

  const [filters, setFilters] = useState({
    name: '',
    status: '',
    jobId: initialJobId
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('applications')
        .select(`
          application_id, status_application, ai_score, confirmation_status,
          candidates!inner ( name ),
          jobs!inner ( job_id, title )
        `);

      if (filters.name.trim() !== '') query = query.ilike('candidates.name', `%${filters.name.trim()}%`);
      if (filters.status !== '') query = query.eq('status_application', filters.status);
      if (filters.jobId !== '') query = query.eq('job_id', filters.jobId);

      query = query.order('ai_score', { ascending: false });

      const { data: appData, error: appError } = await query;
      if (appError) throw appError;
      setApplicants(appData || []);

      const { data: jobsData } = await supabase
        .from('jobs')
        .select('job_id, title')
        .order('title', { ascending: true }); 
        
      if (jobsData) setAvailableJobs(jobsData);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  useEffect(() => {
    const handleApplicantUpdated = () => {
      fetchDataRef.current();
    };

    window.addEventListener('snaphire:hr-applicant-updated', handleApplicantUpdated);

    return () => {
      window.removeEventListener('snaphire:hr-applicant-updated', handleApplicantUpdated);
    };
  }, []);

  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [modalApplicationId, setModalApplicationId] = useState<string | null>(null);
  const [selectedCandidateEmail, setSelectedCandidateEmail] = useState<string | null>(null);
  const [selectedCandidateName, setSelectedCandidateName] = useState<string | null>(null);

  // Technical Test Modal State
  const [showTechnicalTestModal, setShowTechnicalTestModal] = useState(false);
  const [technicalTestApplicationId, setTechnicalTestApplicationId] = useState<string | null>(null);

  // Hired Modal State
  const [showHiredModal, setShowHiredModal] = useState(false);
  const [hiredApplicationId, setHiredApplicationId] = useState<string | null>(null);

  // Rejected Confirm Modal State
  const [showRejectedModal, setShowRejectedModal] = useState(false);
  const [rejectedApplicationId, setRejectedApplicationId] = useState<string | null>(null);

  // Shortlisted Confirm Modal State
  const [showShortlistedModal, setShowShortlistedModal] = useState(false);
  const [shortlistedApplicationId, setShortlistedApplicationId] = useState<string | null>(null);

  const openInterviewModal = (applicationId: string) => {
    console.log('Interview modal opened');
    setModalApplicationId(applicationId);
    setShowInterviewModal(true);
  };

  const openTechnicalTestModal = (applicationId: string, candidateName: string) => {
    console.log('Technical Test modal opened');
    setTechnicalTestApplicationId(applicationId);
    setSelectedCandidateName(candidateName);
    setShowTechnicalTestModal(true);
  };

  const openHiredModal = (applicationId: string, candidateName: string) => {
    console.log('Hired modal opened');
    setHiredApplicationId(applicationId);
    setSelectedCandidateName(candidateName);
    setShowHiredModal(true);
  };

  const openRejectedModal = (applicationId: string, candidateName: string) => {
    console.log('Rejected confirm modal opened');
    setRejectedApplicationId(applicationId);
    setSelectedCandidateName(candidateName);
    setShowRejectedModal(true);
  };

  const openShortlistedModal = (applicationId: string, candidateName: string) => {
    console.log('Shortlisted confirm modal opened');
    setShortlistedApplicationId(applicationId);
    setSelectedCandidateName(candidateName);
    setShowShortlistedModal(true);
  };

  const updateStatus = async (applicationId: string, newStatus: string, interviewData?: any) => {
    try {
      console.log('[LIST] updateStatus called', { applicationId, newStatus, interviewData });

      const { error } = await supabase
        .from('applications')
        .update({ status_application: newStatus })
        .eq('application_id', applicationId);

      if (error) throw error;
      
      // Trigger ATS email automation if applicable
      if (['Interview', 'Technical Test', 'Hired', 'Rejected', 'Shortlisted'].includes(newStatus)) {
        triggerAtsAutomation(applicationId, newStatus, interviewData).catch(err =>
          console.error('[ATS AUTOMATION] Error:', err)
        );
      }
      
      // 🔥 LOGS: Tangkap pelaku (HR) yang ngubah status pelamar
      const currentUser = sessionManager.getSession()?.user;
      if (currentUser) {
        // Cari nama kandidatnya dari state biar log-nya informatif
        const targetApp = applicants.find(a => a.application_id === applicationId);
        const candidateName = targetApp?.candidates?.name || 'Kandidat';

        await supabase.from('activity_logs').insert({
          user_id: currentUser.user_id,
          activity: `CV: ${currentUser.name} mengubah status "${candidateName}" menjadi [${newStatus}]`
        });
      }

      fetchData();
    } catch (err: any) {
      alert("Gagal update status: " + err.message);
    }
  };

  const triggerAtsAutomation = async (applicationId: string, newStatus: string, interviewData?: any) => {
    try {
      const payload: any = { applicationId, newStatus };
      if (interviewData) payload.interviewData = interviewData;

      console.log('[LIST] triggerAtsAutomation payload:', payload);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/trigger-ats-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Interview Email] Trigger failed:', errorText);
      }
    } catch (err) {
      console.error('[ATS AUTOMATION] Network error:', err);
    }
  };

  // --- FUNGSI RE-SCAN AI INDIVIDU ---
  const handleRescan = async (e: React.MouseEvent, appId: string) => {
    e.stopPropagation(); // Mencegah baris ter-klik
    setScanningIds(prev => [...prev, appId]);
    
    // 🔥 LOGS: Tangkap aksi HR pas nge-scan ulang CV orang tertentu
    const currentUser = sessionManager.getSession()?.user;
    if (currentUser) {
      const targetApp = applicants.find(a => a.application_id === appId);
      const candidateName = targetApp?.candidates?.name || 'Kandidat';

      await supabase.from('activity_logs').insert({
        user_id: currentUser.user_id,
        activity: `CV: ${currentUser.name} memproses ulang kecocokan AI untuk "${candidateName}"`
      });
    }

    // Simulasi delay proses AI (3 detik)
    setTimeout(() => {
      setScanningIds(prev => prev.filter(id => id !== appId));
      // fetchData(); // Tarik data terbaru setelah AI selesai update skor
    }, 3000);
  };

  // FUNGSI RE-SCAN AI MASSAL 
  const handleBulkRescan = async () => {
    if (applicants.length === 0) return;
    setIsBulkScanning(true);
    
    const allIds = applicants.map(a => a.application_id);
    setScanningIds(prev => [...new Set([...prev, ...allIds])]);

    // 🔥 LOGS: Tangkap aksi HR pas melakukan scan massal di page ini
    const currentUser = sessionManager.getSession()?.user;
    if (currentUser) {
      await supabase.from('activity_logs').insert({
        user_id: currentUser.user_id,
        activity: `CV: ${currentUser.name} melakukan Re-scan AI massal terhadap ${applicants.length} pelamar`
      });
    }

    // Simulasi delay proses AI Massal (5 detik)
    setTimeout(() => {
      setScanningIds([]);
      setIsBulkScanning(false);
      // fetchData(); // Tarik data terbaru setelah AI selesai update skor
    }, 5000);
  };

  const handleConfirmRescan = async () => {
  try {
    setIsRescanning(true);

    if (isBulkRescan) {
      await handleBulkRescan();
    } else if (selectedCandidate) {
      await handleRescan(
        {
          stopPropagation: () => {},
        } as React.MouseEvent,
        selectedCandidate.application_id
      );
    }

    setOpenConfirm(false);

  } catch (err) {
    console.error("Rescan confirmation error:", err);
  } finally {
    setIsRescanning(false);
  }
};

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'hired': return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
      case 'shortlisted': return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
      case 'interview': return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100';
      case 'technical test': return 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100';
      case 'rejected': return 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100';
      case 'review ai':
      default: return 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100';
    }
  };

  const getConfirmationStatusBadge = (confirmationStatus: string) => {
    switch (confirmationStatus?.toUpperCase()) {
      case 'CONFIRMED':
        return { text: '✓ Confirmed', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'DECLINED':
        return { text: '✗ Declined', class: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'PENDING':
        return { text: '⏱ Pending', class: 'bg-amber-50 text-amber-700 border-amber-200' };
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-7xl mx-auto px-4 pb-6 animate-in fade-in duration-700">
      {/* FIXED HEADER & FILTERS */}
      <div className="shrink-0 space-y-6 mb-6">
        <div className="flex flex-col gap-1.5 pt-2">
          <h1 className="text-3xl font-black text-stone-900 tracking-tight uppercase">List Pelamar</h1>
          <p className="text-stone-500 font-medium">Data tersinkronisasi dengan kriteria AI Match Score.</p>
        </div>

          {/* Interview Scheduling Modal (shared for list view) */}
          <InterviewModal
            isOpen={showInterviewModal}
            onClose={() => { setShowInterviewModal(false); setModalApplicationId(null); }}
            onSubmit={async (interviewData) => {
              console.log('Interview submitted:', interviewData);
              console.log('[LIST] Interview modal submitted for application:', modalApplicationId, interviewData);
              if (modalApplicationId) {
                await updateStatus(modalApplicationId, 'Interview', interviewData);
              }
              setShowInterviewModal(false);
              setModalApplicationId(null);
            }}
          />

          {/* Technical Test Modal */}
          <TechnicalTestModal
            isOpen={showTechnicalTestModal}
            onClose={() => { setShowTechnicalTestModal(false); setTechnicalTestApplicationId(null); }}
            onSubmit={async (testData) => {
              console.log('[LIST] Technical Test modal submitted:', testData);
              if (technicalTestApplicationId) {
                await updateStatus(technicalTestApplicationId, 'Technical Test', testData);
              }
              setShowTechnicalTestModal(false);
              setTechnicalTestApplicationId(null);
            }}
          />

          {/* Hired Modal */}
          <HiredModal
            isOpen={showHiredModal}
            onClose={() => { setShowHiredModal(false); setHiredApplicationId(null); }}
            onSubmit={async (hiredData) => {
              console.log('[LIST] Hired modal submitted:', hiredData);
              if (hiredApplicationId) {
                await updateStatus(hiredApplicationId, 'Hired', hiredData);
              }
              setShowHiredModal(false);
              setHiredApplicationId(null);
            }}
          />

          {/* Rejected Confirm Modal */}
          <RejectedConfirmModal
            isOpen={showRejectedModal}
            candidateName={selectedCandidateName || 'Kandidat'}
            onClose={() => { setShowRejectedModal(false); setRejectedApplicationId(null); }}
            onConfirm={async () => {
              console.log('[LIST] Rejection confirmed for application:', rejectedApplicationId);
              if (rejectedApplicationId) {
                await updateStatus(rejectedApplicationId, 'Rejected');
              }
              setShowRejectedModal(false);
              setRejectedApplicationId(null);
            }}
          />

          {/* Shortlisted Confirm Modal */}
          <ShortlistedConfirmModal
            isOpen={showShortlistedModal}
            candidateName={selectedCandidateName || 'Kandidat'}
            onClose={() => { setShowShortlistedModal(false); setShortlistedApplicationId(null); }}
            onConfirm={async (additionalMessage) => {
              console.log('[LIST] Shortlisted confirmed for application:', shortlistedApplicationId, additionalMessage);
              if (shortlistedApplicationId) {
                await updateStatus(shortlistedApplicationId, 'Shortlisted', { additionalMessage });
              }
              setShowShortlistedModal(false);
              setShortlistedApplicationId(null);
            }}
          />

        <div className="bg-white p-4 rounded-4xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
            <div className="relative group lg:col-span-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-blue-600 transition-colors" size={18} />
              <input 
                type="text" placeholder="Nama..." 
                className="w-full pl-11 pr-4 py-3.5 bg-stone-50 border border-stone-200 rounded-xl outline-none font-bold text-stone-700 text-sm focus:ring-4 focus:ring-blue-500/10 transition-all"
                value={filters.name}
                onChange={(e) => setFilters({...filters, name: e.target.value})}
              />
            </div>
            
            <select 
              className="px-4 py-3.5 bg-stone-50 border border-stone-200 rounded-xl outline-none font-bold text-stone-600 text-sm transition-all cursor-pointer appearance-none lg:col-span-1"
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
            >
              <option value="">Status: Semua</option>
              {availableStatuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select 
              className="px-4 py-3.5 bg-stone-50 border border-stone-200 rounded-xl outline-none font-bold text-stone-600 text-sm transition-all cursor-pointer appearance-none lg:col-span-1"
              value={filters.jobId}
              onChange={(e) => setFilters({...filters, jobId: e.target.value})}
            >
              <option value="">Lowongan: Semua</option>
              {availableJobs.map(j => <option key={j.job_id} value={j.job_id}>{j.title}</option>)}
            </select>

            <button 
              onClick={() => fetchData()}
              className="bg-stone-900 hover:bg-stone-800 text-white py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 lg:col-span-1"
            >
              <Filter size={16} /> Filter
            </button>

            {/* TOMBOL BULK RE-SCAN */}
            <button 
              onClick={() => {
                setIsBulkRescan(true);
                setSelectedCandidate(null);
                setOpenConfirm(true);
              }}
              disabled={isBulkScanning || applicants.length === 0}
              className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 lg:col-span-1"
            >
              <RefreshCw size={16} className={isBulkScanning ? "animate-spin" : ""} /> 
              {isBulkScanning ? 'Scanning...' : 'Rescan AI'}
            </button>
          </div>
        </div>
      </div>

      {/* SCROLLABLE TABLE CONTAINER */}
      <div className="flex-1 min-h-0 bg-white rounded-[2.5rem] border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col">
        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse table-fixed min-w-250">
            <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-20 border-b border-stone-100">
              <tr>
                <th className="px-6 py-6 text-stone-400 font-black text-[10px] uppercase tracking-[0.2em] w-20 text-center">Rank</th>
                <th className="px-10 py-6 text-stone-400 font-black text-[10px] uppercase tracking-[0.2em] w-[30%]">Kandidat</th>
                <th className="px-8 py-6 text-stone-400 font-black text-[10px] uppercase tracking-[0.2em] w-[22%]">Posisi Lowongan</th>
                <th className="px-4 py-6 text-stone-400 font-black text-[10px] uppercase tracking-[0.2em] w-32 text-center">AI Score</th>
                <th className="px-4 py-6 text-stone-400 font-black text-[10px] uppercase tracking-[0.2em] w-48 text-center">Update Status</th>
                <th className="px-4 py-6 text-stone-400 font-black text-[10px] uppercase tracking-[0.2em] w-40 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {isLoading ? (
                <tr><td colSpan={6} className="p-32 text-center"><Loader2 className="animate-spin text-blue-600 mx-auto" size={40} /></td></tr>
              ) : applicants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-32 text-center">
                    <div className="bg-stone-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Inbox size={24} className="text-stone-300" />
                    </div>
                    <p className="font-bold text-stone-400 uppercase text-xs">Belum ada data pelamar</p>
                  </td>
                </tr>
              ) : (
                applicants.map((app: any, index: number) => {
                  const candidateName = app.candidates?.name || 'Anonymous';
                  const currentStatus = app.status_application || 'Review AI';
                  const isScanning = scanningIds.includes(app.application_id);

                  return (
                    <tr 
                      key={app.application_id} 
                      onClick={() => router.push(`/hr/applicants/${app.application_id}`)}
                      className="group hover:bg-stone-50/60 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-6 text-center">
                        <span className="font-black text-stone-300 group-hover:text-stone-500 transition-colors text-sm">#{index + 1}</span>
                      </td>

                      <td className="px-10 py-6">
                        <div className="min-w-0">
                          <p className="font-black text-stone-900 text-[15px] truncate group-hover:text-blue-600 transition-colors">
                            {candidateName}
                          </p>
                          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">
                            Applicant
                          </p>
                        </div>
                      </td>

                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2.5 text-stone-600 font-bold text-sm min-w-0">
                          <Briefcase size={14} className="text-stone-300 shrink-0" />
                          <span className="truncate">{app.jobs?.title || 'Unknown Position'}</span>
                        </div>
                      </td>

                      <td className="px-4 py-6 text-center">
                        {app.ai_score === null || app.ai_score === undefined || isScanning ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg font-black text-[10px] border border-blue-100 uppercase tracking-widest animate-pulse">
                            <Loader2 size={12} className="animate-spin" /> Proses...
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 text-stone-700 rounded-lg font-black text-xs border border-stone-200">
                            <Star size={12} className={app.ai_score > 70 ? "text-amber-400 fill-amber-400" : "text-stone-400 fill-stone-400"} />
                            {app.ai_score}%
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-6 text-center">
                        <div
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          className="inline-block w-full max-w-42.5"
                        >
                          <select 
                            value={currentStatus}
                            onChange={(e) => {
                              const value = (e.target.value || '').toString();
                              console.log('[LIST] status changed for', app.application_id, 'to', value);
                              
                              // Handle Interview status
                              if (value.trim().toLowerCase() === 'interview') {
                                openInterviewModal(app.application_id);
                                return;
                              }

                              // Handle Technical Test status
                              if (value.trim().toLowerCase() === 'technical test') {
                                openTechnicalTestModal(app.application_id, candidateName);
                                return;
                              }

                                                      // Handle Hired status
                              if (value.trim().toLowerCase() === 'hired') {
                                openHiredModal(app.application_id, candidateName);
                                return;
                              }

                                                      // Handle Rejected status
                              if (value.trim().toLowerCase() === 'rejected') {
                                openRejectedModal(app.application_id, candidateName);
                                return;
                              }

                                                      // Handle Shortlisted status
                                                      if (value.trim().toLowerCase() === 'shortlisted') {
                                                        openShortlistedModal(app.application_id, candidateName);
                                                        return;
                                                      }

                              // For other statuses, update directly
                              updateStatus(app.application_id, value);
                            }}
                            className={`w-full text-[9px] font-black uppercase tracking-widest px-3 py-2.5 rounded-lg border outline-none cursor-pointer appearance-none text-center transition-all shadow-sm ${getStatusBadgeColor(currentStatus)}`}
                          >
                            {MASTER_STATUSES.map(s => <option key={s} value={s} className="bg-white text-stone-700">{s}</option>)}
                          </select>
                          
                          {/* Confirmation status intentionally not shown in list view to keep UI clean */}
                        </div>
                      </td>

                      <td className="px-4 py-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* TOMBOL RE-SCAN INDIVIDU */}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();

                              setSelectedCandidate(app);
                              setIsBulkRescan(false);
                              setOpenConfirm(true);
                            }}
                            disabled={isScanning}
                            title="Proses Ulang AI"
                            className="p-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50"
                          >
                            <RefreshCw size={14} className={isScanning ? "animate-spin" : ""} strokeWidth={3} />
                          </button>
                          
                          <button className="px-5 py-2.5 bg-white border border-stone-200 text-stone-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-stone-900 hover:text-white hover:border-stone-900 active:scale-95">
                            Profil
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    <ConfirmRescanModal
      isOpen={openConfirm}
      onClose={() => setOpenConfirm(false)}
      onConfirm={handleConfirmRescan}
      isBulk={isBulkRescan}
      candidateName={selectedCandidate?.candidates?.name}
      isLoading={isRescanning}
    />
    </div>
  );
}

export default function ListPelamar() {
  return (
    <Suspense fallback={<div className="h-[80vh] flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>}>
      <ListPelamarContent />
    </Suspense>
  );
}