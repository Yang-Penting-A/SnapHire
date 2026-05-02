"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import { 
  ArrowLeft, Mail, Phone, MapPin, Briefcase, Download, 
  Link, Globe, Star, Sparkles, FileText, CheckCircle2, 
  XCircle, Loader2, User 
} from 'lucide-react'; 

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;

  const [application, setApplication] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCandidateDetail = async () => {
      try {
        const { data, error } = await supabase
          .from('applications')
          .select(`
            application_id, status_application, ai_score,
            ai_summary, ai_strengths, ai_weaknesses, ai_recommendation, created_at,
            candidates ( name, email, phone_number, linkedin_url, portfolio_url, cv_file_url, location ),
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

  const updateStatus = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status_application: newStatus })
        .eq('application_id', applicationId);

      if (error) throw error;
      setApplication({ ...application, status_application: newStatus });
      alert("Status berhasil diperbarui!");
    } catch (err: any) {
      alert("Gagal update status: " + err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="text-blue-600 animate-spin" />
        <p className="text-stone-400 font-black uppercase tracking-widest text-xs">Memuat Data Kandidat...</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-black text-stone-800">Kandidat Tidak Ditemukan</h2>
        <button onClick={() => router.back()} className="mt-4 text-blue-600 font-bold underline">Kembali</button>
      </div>
    );
  }

  const candidate = application.candidates;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-10">
      
      {/* 1. HEADER */}
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-[11px] font-black text-stone-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
      >
        <ArrowLeft size={16} /> Kembali ke List Pelamar
      </button>

      <div className="bg-white rounded-[2.5rem] p-8 border border-stone-100 shadow-sm flex flex-col md:flex-row justify-between items-start gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-50 pointer-events-none"></div>
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-4xl shadow-xl shadow-blue-600/30">
            {candidate?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h1 className="text-3xl font-black text-stone-900 tracking-tight">{candidate?.name}</h1>
            <p className="text-blue-600 font-black text-sm uppercase tracking-widest mt-1 mb-3">
              Melamar: {application.jobs?.title}
            </p>
            <div className="flex gap-2">
              <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                application.status_application === 'Shortlisted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                application.status_application === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' : 
                'bg-stone-50 text-stone-700 border-stone-200'
              }`}>
                {application.status_application}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full md:w-auto relative z-10">
          <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Ubah Status Kandidat</label>
          <select 
            value={application.status_application || 'Review AI'}
            onChange={(e) => updateStatus(e.target.value)}
            className="w-full md:w-48 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-700 outline-none focus:border-blue-500 capitalize"
          >
            <option value="Review AI">Review AI</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Interview">Interview</option>
            <option value="Technical Test">Technical Test</option>
            <option value="Hired">Hired</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. KOLOM KIRI (Profil & Kontak) */}
        <div className="space-y-8">
          <div className="bg-white rounded-[2.5rem] p-8 border border-stone-100 shadow-sm">
            <h3 className="text-lg font-black text-stone-900 mb-6 flex items-center gap-2"><User size={20} className="text-blue-600"/> Data Pribadi</h3>
            
            <div className="space-y-5">
              <div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Email</p>
                <a href={`mailto:${candidate?.email}`} className="flex items-center gap-2 text-stone-900 font-bold hover:text-blue-600 transition-colors">
                  <Mail size={16} className="text-stone-400" /> {candidate?.email || '-'}
                </a>
              </div>
              <div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Nomor Telepon</p>
                <a href={`tel:${candidate?.phone_number}`} className="flex items-center gap-2 text-stone-900 font-bold hover:text-blue-600 transition-colors">
                  <Phone size={16} className="text-stone-400" /> {candidate?.phone_number || '-'}
                </a>
              </div>
              <div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Lokasi</p>
                <p className="flex items-center gap-2 text-stone-900 font-bold">
                  <MapPin size={16} className="text-stone-400" /> {candidate?.location || 'Tidak disebutkan'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-stone-100 shadow-sm space-y-4">
            <h3 className="text-lg font-black text-stone-900 mb-4 flex items-center gap-2"><Briefcase size={20} className="text-blue-600"/> Dokumen & Link</h3>
            
            {candidate?.cv_file_url ? (
              <a href={candidate.cv_file_url} target="_blank" rel="noreferrer" className="w-full py-4 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
                <Download size={16} /> Lihat CV Asli
              </a>
            ) : (
              <button disabled className="w-full py-4 bg-stone-100 text-stone-400 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-not-allowed">
                <FileText size={16} /> CV Tidak Tersedia
              </button>
            )}

            {candidate?.linkedin_url && (
              <a href={candidate.linkedin_url} target="_blank" rel="noreferrer" className="w-full py-4 bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 text-[#0A66C2] rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
                <Link size={16} /> Profil LinkedIn
              </a>
            )}
            
            {candidate?.portfolio_url && (
              <a href={candidate.portfolio_url} target="_blank" rel="noreferrer" className="w-full py-4 bg-stone-50 border border-stone-200 hover:border-stone-300 text-stone-700 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
                <Globe size={16} /> Website/Portofolio
              </a>
            )}
          </div>
        </div>

        {/* 3. KOLOM KANAN (Hasil Analisis AI) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2.5rem] p-8 border border-stone-100 shadow-sm">
            
            {!application.ai_score ? (
              <div className="text-center py-20 bg-stone-50 rounded-3xl border border-dashed border-stone-200">
                <Sparkles size={48} className="mx-auto text-stone-300 mb-4" />
                <p className="font-black text-stone-800 text-lg">Belum Ada Evaluasi AI</p>
                <p className="text-stone-500 font-medium text-sm mt-2">Kandidat ini belum diproses oleh sistem AI SnapHire.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Score Banner */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-blue-900/20">
                  <Sparkles className="absolute top-4 right-4 text-white/20" size={120} />
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-2">AI Match Score</p>
                      <h3 className="text-6xl font-black tracking-tighter flex items-center gap-2">
                        {application.ai_score}% <Star size={32} className="fill-blue-200 text-blue-200" />
                      </h3>
                    </div>
                    <div className="text-left md:text-right w-full md:max-w-[250px] bg-black/20 p-4 rounded-2xl backdrop-blur-sm">
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-1">Rekomendasi AI</p>
                      <p className="text-sm font-bold text-blue-50 leading-relaxed">
                        {application.ai_recommendation || 'AI menyarankan untuk mereview lebih lanjut kandidat ini.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* AI Summary */}
                <div>
                  <h4 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-2"><FileText size={16}/> Ringkasan Eksekutif</h4>
                  <p className="text-stone-700 text-sm leading-relaxed font-medium p-6 bg-blue-50/50 rounded-3xl border border-blue-100">
                    {application.ai_summary || 'Tidak ada ringkasan tersedia.'}
                  </p>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-emerald-50/50 rounded-3xl p-6 border border-emerald-100">
                    <h4 className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <CheckCircle2 size={16} /> Kelebihan (Strengths)
                    </h4>
                    <ul className="space-y-3">
                      {application.ai_strengths?.map((strength: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm font-bold text-stone-700">
                          <span className="text-emerald-500 mt-0.5">•</span> {strength}
                        </li>
                      )) || <li className="text-sm font-medium text-stone-400 italic">Tidak ada data.</li>}
                    </ul>
                  </div>

                  <div className="bg-rose-50/50 rounded-3xl p-6 border border-rose-100">
                    <h4 className="text-xs font-black text-rose-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <XCircle size={16} /> Kekurangan (Gaps)
                    </h4>
                    <ul className="space-y-3">
                      {application.ai_weaknesses?.map((weakness: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm font-bold text-stone-700">
                          <span className="text-rose-500 mt-0.5">•</span> {weakness}
                        </li>
                      )) || <li className="text-sm font-medium text-stone-400 italic">Tidak ada data.</li>}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </div>

      </div>
    </div>
  );
}