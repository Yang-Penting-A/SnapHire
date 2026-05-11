"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { Clock, Search, Activity, User, RefreshCw, Loader2 } from 'lucide-react';

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('activity_logs')
      .select('log_id, activity, timestamp, users ( name, email )')
      .order('timestamp', { ascending: false });
    
    if (!error && data) setLogs(data);
    setIsLoading(false);
  };

  // UPGRADE 1 & 2: Tambah filter email & dikasih pengaman (optional chaining) biar ga crash kalau user null
  const filteredLogs = logs.filter(log => {
    const searchLower = search.toLowerCase();
    const activityMatch = log.activity?.toLowerCase().includes(searchLower);
    const nameMatch = log.users?.name?.toLowerCase().includes(searchLower);
    const emailMatch = log.users?.email?.toLowerCase().includes(searchLower);
    
    return activityMatch || nameMatch || emailMatch;
  });

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      {/* HEADER AREA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-stone-900 text-white rounded-2xl shadow-lg">
            <Activity size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight">Activity Logs</h1>
            <p className="text-stone-500 text-sm font-medium">Monitoring aktivitas sistem snapHire</p>
          </div>
        </div>

        <button 
          onClick={fetchLogs}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-white border border-stone-200 rounded-2xl font-bold text-stone-600 hover:bg-stone-50 transition-all active:scale-95 shadow-sm"
        >
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
          <span>Refresh Data</span>
        </button>
      </div>

      {/* SEARCH BOX */}
      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-blue-600 transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="Cari aktivitas, nama, atau email pengguna..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-14 pr-6 py-4 bg-white border border-stone-100 rounded-[1.5rem] text-stone-900 font-bold focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all outline-none shadow-sm"
        />
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl shadow-stone-200/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-stone-50/50 border-b border-stone-100 text-[10px] uppercase tracking-[0.2em] font-black text-stone-400">
                <th className="px-8 py-5">Waktu</th>
                <th className="px-8 py-5">Pengguna</th>
                <th className="px-8 py-5">Aktivitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {isLoading ? (
                <tr><td colSpan={3} className="px-8 py-20 text-center text-stone-400 font-bold flex items-center justify-center gap-3"><Loader2 className="animate-spin" size={20} /> Menarik data...</td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr><td colSpan={3} className="px-8 py-20 text-center text-stone-400 font-bold">Tidak ada aktivitas yang ditemukan.</td></tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.log_id} className="hover:bg-stone-50/50 transition-colors group">
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-stone-900 font-bold text-xs md:text-sm">
                        <Clock size={14} className="text-stone-300" />
                        {new Date(log.timestamp).toLocaleString('id-ID', { 
                          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                        })}
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-blue-600 group-hover:text-white transition-all font-black text-xs">
                          {log.users?.name ? log.users.name.charAt(0).toUpperCase() : <User size={14} />}
                        </div>
                        <div className="leading-tight">
                          <p className="text-stone-900 font-black text-sm">{log.users?.name || 'Sistem'}</p>
                          <p className="text-stone-400 text-[10px] font-bold">{log.users?.email || 'automated@snaphire.com'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-stone-600 text-xs md:text-sm font-bold leading-relaxed max-w-md">
                        {log.activity}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}