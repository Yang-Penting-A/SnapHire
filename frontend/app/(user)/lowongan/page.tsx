"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase"; 
import Link from "next/link";

interface Job {
  job_id: string; // Sesuai ERD
  title: string;
  description: string;
  requirement: string;
  status_job: string;
}

export default function DaftarLowongan() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      // Narik data dari tabel 'Job' sesuai ERD. 
      // (Catatan: Pastiin nama tabel di Supabase lu huruf besarnya persis ya, kadang Supabase defaultnya huruf kecil misal 'job')
      const { data, error } = await supabase
        .from("Job") 
        .select("*")
        .eq("status_job", "Active"); // Asumsi kita cuma nampilin loker yang masih buka

      if (error) {
        console.error("Waduh error narik data Job:", error.message);
      } else {
        setJobs(data || []);
      }
      setLoading(false);
    };

    fetchJobs();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Eksplorasi Lowongan</h1>
        <p className="text-gray-500">Temukan posisi yang sesuai dengan keahlian dan minatmu.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-500 animate-pulse">Sabar yaa, lagi loading data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div key={job.job_id} className="group bg-white border border-gray-200 rounded-2xl p-6 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-blue-600 group-hover:text-blue-800 transition-colors mb-2">
                  {job.title}
                </h3>
                {/* Kita potong deskripsinya biar ngga kepanjangan di card */}
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                  {job.description}
                </p>

                {/* Badges sementara di-hardcode karena di ERD belum ada kolomnya */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">Full-time</span>
                  <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">Yogyakarta</span>
                </div>
              </div>

              <Link href={`/lowongan/${job.job_id}`}>
                <button className="w-full bg-white text-blue-600 border-2 border-blue-600 font-semibold py-2 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                  Lihat Detail
                </button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}