"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { Clock, Search, Activity, User, RefreshCw, Loader2, ShieldAlert } from 'lucide-react';

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('log_id, activity, timestamp, users ( name, email )')
        .order('timestamp', { ascending: false });
      if (!error && data) setLogs(data);
    } catch (err) {
      console.error("Gagal mengambil log:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // FIX: Pencarian aman (Anti-Crash) + Bisa cari berdasarkan Email juga
  const filteredLogs = logs.filter(log => {
    const searchLower = search.toLowerCase();
    const activityText = log.activity?.toLowerCase() || '';
    const userName = log.users?.name?.toLowerCase() || 'sistem';
    const userEmail = log.users?.email?.toLowerCase() || 'automated@snaphire.com';

    return activityText.includes(searchLower) || 
           userName.includes(searchLower) || 
           userEmail.includes(searchLower);
  });

  // Helper buat bikin badge otomatis dari teks log
  const renderActivityContent = (activityStr: string) => {
    if (!activityStr) return '-';
    
    if (activityStr.includes(':')) {
      const parts = activityStr.split(':');
      const badgeType = parts[0].trim().toUpperCase();
      const content = parts.slice(1).join(':').trim();

      // Atur warna badge secara dinamis sesuai jenis aktivitas
      let badgeStyles = 'bg-stone-50 text-stone-700 border-stone-100'; // Default warna abu-abu
      
      if (badgeType === 'LOGIN') {
        badgeStyles = 'bg-blue-50 text-blue-700 border-blue-100'; // Biru untuk Login
      } else if (badgeType === 'JOB') {
        badgeStyles = 'bg-purple-50 text-purple-700 border-purple-100'; // Ungu untuk Lowongan
      } else if (badgeType === 'CV') {
        badgeStyles = 'bg-emerald-50 text-emerald-700 border-emerald-100'; // Hijau untuk Upload CV
      } else if (badgeType === 'ADMIN') {
        badgeStyles = 'bg-indigo-50 text-indigo-700 border-indigo-100'; // Indigo untuk Manajemen User
      } else if (badgeType === 'DELETE') {
        badgeStyles = 'bg-red-50 text-red-700 border-red-100'; // Red untuk penghapusan data
      }
      
      return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider w-fit border ${badgeStyles}`}>
            {badgeType}
          </span>
          <span className="text-stone-600 text-xs md:text-sm font-bold leading-relaxed">{content}</span>
        </div>
      );
    }

    return <span className="text-stone-600 text-xs md:text-sm font-bold leading-relaxed">{activityStr}</span>;
  };

  return (
    <div className="space-y-8 pb-10 max-w-7xl mx-auto">
      {/* HEADER AREA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-stone-900 text-white rounded-2xl shadow-xl shadow-stone-900/10">
            <Activity size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight">Activity Logs</h1>
            <p className="text-stone-500 text-sm font-medium">Monitoring aktivitas sistem snapHire secara real-time</p>
          </div>
        </div>

        <button 
          onClick={fetchLogs}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-white border border-stone-200 rounded-2xl font-black text-xs uppercase tracking-wider text-stone-600 hover:bg-stone-50 transition-all active:scale-95 shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={14} className={`text-stone-400 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* SEARCH BOX */}
      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-blue-600 transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="Cari kata kunci aktivitas, nama, atau email pengguna..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-14 pr-6 py-4.5 bg-white border border-stone-200 rounded-[1.5rem] text-stone-900 font-bold focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all outline-none shadow-sm placeholder:text-stone-300"
        />
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white rounded-[2rem] border border-stone-100 shadow-xl shadow-stone-200/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-stone-50/70 border-b border-stone-100 text-[10px] uppercase tracking-[0.2em] font-black text-stone-400">
                <th className="px-8 py-5 w-[25%]">Waktu Aktivitas</th>
                <th className="px-8 py-5 w-[35%]">Aktor / Pengguna</th>
                <th className="px-8 py-5 w-[40%]">Detail Aktivitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 size={32} className="text-blue-600 animate-spin" />
                      <p className="text-stone-400 font-black uppercase tracking-widest text-xs">Menarik data dari Supabase...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-stone-300">
                      <ShieldAlert size={40} />
                      <p className="text-stone-400 font-bold text-sm mt-1">Tidak ada log aktivitas yang cocok.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const hasUser = !!log.users;
                  const firstLetter = log.users?.name?.charAt(0).toUpperCase() || 'S';
                  
                  return (
                    <tr key={log.log_id} className="hover:bg-stone-50/40 transition-colors group">
                      {/* TIMESTAMP */}
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-stone-900 font-bold text-xs md:text-sm">
                          <Clock size={14} className="text-stone-300 group-hover:text-blue-500 transition-colors" />
                          {log.timestamp ? new Date(log.timestamp).toLocaleString('id-ID', { 
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
                          }) : '-'}
                        </div>
                      </td>

                      {/* USER DETAILS */}
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs transition-all ${
                            hasUser 
                              ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' 
                              : 'bg-stone-100 text-stone-500'
                          }`}>
                            {hasUser ? firstLetter : <User size={14} />}
                          </div>
                          <div className="leading-tight">
                            <p className="text-stone-900 font-black text-sm">{log.users?.name || 'Sistem'}</p>
                            <p className="text-stone-400 text-[10px] font-bold tracking-wide mt-0.5">{log.users?.email || 'automated@snaphire.com'}</p>
                          </div>
                        </div>
                      </td>

                      {/* ACTIVITY TEXT */}
                      <td className="px-8 py-6">
                        <div className="max-w-md">
                          {renderActivityContent(log.activity)}
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
    </div>
  );
}