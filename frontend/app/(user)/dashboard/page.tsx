"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import Link from "next/link";

// Tipe data ini gabungan Application dan relasi ke Job
interface ApplicationData {
  application_id: string;
  status_application: string;
  ai_rank: number;
  // Ini hasil JOIN dari Supabase
  Job: {
    title: string;
  };
}

export default function DashboardUser() {
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // IDEALNYA: Lu harus dapet ID user yang lagi login.
      // Tapi karena ini nyoba UI, kita tarik aja data dari tabel Application di-JOIN sama Job
      const { data, error } = await supabase
        .from("Application")
        .select(`
          application_id,
          status_application,
          ai_rank,
          Job ( title )
        `); 
        // Penulisan Join di Supabase: NamaTabelTujuan ( kolom_yang_dimau )

      if (error) {
        console.error("Error narik dashboard:", error.message);
      } else {
        // Abaikan error TS kalo Supabase ngereturn array of objects
        setApplications(data as any || []);
      }
      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Kandidat</h1>
          <p className="text-gray-500">Pantau status lamaran aktif dan posisi ranking kamu saat ini.</p>
        </div>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
          
          <Link 
            href="/lowongan" 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-block"
            >
            Cari Lowongan Baru
            </Link>
          
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 animate-pulse mt-10">Memuat data lamaranmu...</p>
      ) : applications.length === 0 ? (
        <p className="text-center text-gray-500 mt-10">Belum ada lamaran nih, yuk cari lowongan!</p>
      ) : (
        <div className="space-y-6">
          {applications.map((app) => (
            <div key={app.application_id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{app.Job?.title || "Posisi Tidak Diketahui"}</h3>
                  <p className="text-sm text-gray-500 mt-1">Status: {app.status_application}</p>
                </div>
                {/* Ranking AI Sesuai ERD */}
                <div className="bg-[#48D1CC] text-white px-4 py-2 rounded-full text-center">
                  <p className="text-[10px] font-bold tracking-wider uppercase opacity-90">Posisi Ranking AI</p>
                  <p className="text-lg font-bold">#{app.ai_rank || "?"}</p>
                </div>
              </div>

              {/* Progress Bar Sederhana */}
              <div className="relative pt-4">
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-100">
                  <div style={{ width: "50%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-400"></div>
                </div>
                <div className="flex justify-between text-xs font-medium text-gray-500">
                  <span className="text-green-500">CV Dikirim</span>
                  <span className="text-green-500">AI Screening</span>
                  <span className="text-blue-600 font-bold">Review HR</span>
                  <span>Interview</span>
                </div>
              </div>

              <div className="mt-6 bg-blue-50 text-blue-800 text-sm p-4 rounded-xl border border-blue-100">
                <span className="font-bold">Status Saat Ini:</span> Menunggu update lebih lanjut dari tim HR.
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}