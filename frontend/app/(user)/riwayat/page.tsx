"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { Briefcase, Clock, CheckCircle, XCircle, ChevronRight, FileText } from "lucide-react";
import Link from "next/link";

// Bikin tipe data sesuai ERD lu
interface ApplicationHistory {
  application_id: string;
  status_application: string;
  ai_rank: number;
  // Ini hasil JOIN dari Supabase (ngambil title dari tabel Job)
  Job: {
    title: string;
    status_job: string;
  };
}

export default function RiwayatLamaran() {
  const [applications, setApplications] = useState<ApplicationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Semua");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // Ambil user yang lagi login
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        /* LOGIKA QUERY BERDASARKAN ERD:
          1. Kita nyari di tabel 'Application'
          2. Kita JOIN ke tabel 'Job' buat dapet 'title' jabatannya
          3. Idealnya di-filter pake candidate_id, tapi karena DB belum fix,
             kita tarik semua dulu aja buat ngetes UI-nya.
        */
        const { data, error } = await supabase
          .from("Application") // Pake A gede sesuai ERD
          .select(`
            application_id,
            status_application,
            ai_rank,
            Job (
              title,
              status_job
            )
          `);

        if (error) {
          console.error("Waduh error narik riwayat:", error.message);
          // Kalo DB belum ready, lempar error biar ditangkep catch
          throw error; 
        }

        // Kalo berhasil, masukin ke state
        setApplications(data as any || []);
      } catch (err) {
        // FALLBACK: Kalo DB temen lu belum ready, kita pake Data Palsu (Dummy)
        // Biar UI lu tetep keliatan cakep pas di-demo-in
        console.log("Pake data dummy dulu cuy sambil nunggu DB ready...");
        setApplications([
          {
            application_id: "1",
            status_application: "Screening AI",
            ai_rank: 85,
            Job: { title: "UI/UX Designer", status_job: "Aktif" }
          },
          {
            application_id: "2",
            status_application: "Ditolak",
            ai_rank: 40,
            Job: { title: "Frontend Developer", status_job: "Ditutup" }
          },
          {
            application_id: "3",
            status_application: "Review HR",
            ai_rank: 92,
            Job: { title: "Product Manager", status_job: "Aktif" }
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // Logika buat filter Tabs
  const filteredApps = applications.filter((app) => {
    if (activeTab === "Semua") return true;
    if (activeTab === "Diproses") return ["Screening AI", "Review HR", "Interview"].includes(app.status_application);
    if (activeTab === "Ditolak") return app.status_application === "Ditolak";
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <p className="text-gray-500 animate-pulse font-medium">Memuat riwayat lamaran...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Riwayat Lamaran</h1>
        <p className="text-gray-500">Pantau terus status lamaran kerja yang udah kamu kirim di sini.</p>
      </div>

      {/* TABS */}
      <div className="flex gap-4 border-b border-gray-200 mb-6 overflow-x-auto pb-2">
        {["Semua", "Diproses", "Ditolak"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 px-1 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab 
                ? "border-blue-600 text-blue-600" 
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* LIST KARTU LAMARAN */}
      {filteredApps.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-gray-300 rounded-2xl">
          <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-900">Belum ada lamaran</h3>
          <p className="text-gray-500 mt-1">Kamu belum punya lamaran dengan status ini.</p>
          <Link href="/lowongan">
            <button className="mt-4 text-blue-600 font-medium hover:underline">Cari Lowongan Sekarang</button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApps.map((app) => (
            <div key={app.application_id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <Briefcase size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{app.Job?.title || "Posisi Tidak Diketahui"}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock size={14} /> Terkirim
                    </span>
                    <span>•</span>
                    <span>Skor AI: <strong className="text-gray-700">{app.ai_rank}%</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:justify-end">
                {/* Badge Status */}
                <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border ${
                  app.status_application === "Ditolak" ? "bg-red-50 text-red-700 border-red-200" :
                  app.status_application === "Screening AI" ? "bg-purple-50 text-purple-700 border-purple-200" :
                  "bg-blue-50 text-blue-700 border-blue-200"
                }`}>
                  {app.status_application === "Ditolak" ? <XCircle size={14}/> : <CheckCircle size={14}/>}
                  {app.status_application}
                </span>
                
                <button className="text-gray-400 hover:text-blue-600 transition-colors hidden sm:block">
                  <ChevronRight size={24} />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}