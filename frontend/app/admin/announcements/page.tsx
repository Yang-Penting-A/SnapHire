"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import sessionManager from '@/app/lib/sessionManager';
import { Megaphone, FileText, Send, Loader2, Trash2, Calendar } from 'lucide-react';

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setAnnouncements(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    const testAuth = await supabase.auth.getUser();

    try {
      const currentAdmin = sessionManager.getSession()?.user;

      // 1. Insert ke tabel announcements
      const { error: insertError } = await supabase
        .from('announcements')
        .insert([
          { title: formData.title, content: formData.content }
        ]);

      if (insertError) throw insertError;

      // 2. Catat log aktivitas Admin
      if (currentAdmin) {
        await supabase.from('activity_logs').insert({
          user_id: currentAdmin.user_id,
          activity: `ADMIN: Menyiarkan pengumuman baru [${formData.title}]`
        });
      }

      setMessage({ type: 'success', text: 'Pengumuman berhasil disiarkan ke dashboard HR!' });
      setFormData({ title: '', content: '' });
      fetchAnnouncements();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`Hapus pengumuman "${title}"?`)) return;
    
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (!error) {
      fetchAnnouncements();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 p-4 animate-in fade-in duration-500">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-black text-stone-900 tracking-tight uppercase">Broadcast Center</h1>
        <p className="text-stone-500 font-medium mt-1">Kelola papan pengumuman internal untuk tim HR snapHire</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* KIRI: FORM INPUT */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-xl shadow-stone-200/30">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Megaphone size={20} />
            </div>
            <h2 className="text-lg font-black text-stone-900">Buat Pengumuman</h2>
          </div>

          {message.text && (
            <div className={`mb-6 p-4 rounded-xl text-xs font-bold ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Judul Info</label>
              <input 
                type="text" required value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-5 py-3.5 bg-stone-50 border border-stone-100 rounded-xl text-stone-900 font-bold focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-sm"
                placeholder="Misal: Maintenance Server AI"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Isi Pengumuman</label>
              <textarea 
                required rows={5} value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-xl text-stone-900 font-medium focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-sm resize-none leading-relaxed"
                placeholder="Tulis detail pesan informasi di sini secara jelas..."
              />
            </div>

            <button 
              type="submit" disabled={isLoading}
              className="w-full bg-stone-900 text-white font-black py-4 rounded-xl hover:bg-stone-800 transition-all flex justify-center items-center gap-2 text-xs uppercase tracking-widest disabled:opacity-50"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <><Send size={14} /> Siarkan Sekarang</>}
            </button>
          </form>
        </div>

        {/* KANAN: HISTORY LIST */}
        <div className="lg:col-span-3 space-y-4">
          <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1">Riwayat Siaran</h3>
          
          {announcements.length === 0 ? (
            <div className="p-12 text-center text-stone-400 font-bold text-xs bg-white rounded-[2.5rem] border border-stone-100 shadow-sm uppercase">
              Belum ada pengumuman yang aktif.
            </div>
          ) : (
            announcements.map((ann) => (
              <div key={ann.id} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-md hover:shadow-lg transition-all flex gap-4 items-start group">
                <div className="p-3 bg-stone-50 text-stone-500 rounded-2xl shrink-0">
                  <FileText size={20} />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-black text-stone-900 text-base truncate">{ann.title}</h4>
                    <button 
                      onClick={() => handleDelete(ann.id, ann.title)}
                      className="text-stone-300 hover:text-red-500 p-1 rounded-lg transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-line">{ann.content}</p>
                  <div className="flex items-center gap-1.5 text-stone-400 text-[10px] font-bold uppercase pt-2">
                    <Calendar size={12} /> {new Date(ann.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}