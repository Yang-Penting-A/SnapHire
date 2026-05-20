"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { UserPlus, Users, Mail, User, ShieldCheck, Search, BadgeCheck, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';

export default function AdminUserManagement() {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({ fullName: '', email: '' });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) setUsers(data);
    setIsLoading(false);
  };

  const handleCreateHR = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let autoPassword = "";
      for (let i = 0; i < 10; i++) {
        autoPassword += charset.charAt(Math.floor(Math.random() * charset.length));
      }
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: autoPassword, 
        options: {
          data: { full_name: formData.fullName, role: 'hr' }
        }
      });

      if (authError) throw authError;

      const { error: dbError } = await supabase.from('users').insert({
        user_id: authData.user!.id, 
        name: formData.fullName,
        email: formData.email,
        role: 'hr',
        is_active: true 
      });

      if (dbError) throw dbError;

      // FIX INJEKSI: TRIGGER TELEPORT DATA KE BACKEND NODEMAILER
      try {
        const backendUrl = "http://localhost:8000/api"; 
        const emailResponse = await fetch(`${backendUrl}/auth/send-credential`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            name: formData.fullName,
            password: autoPassword
          }),
        });

        const emailResult = await emailResponse.json();
        if (!emailResponse.ok) {
          console.warn("⚠️ Akun terbuat, tapi backend gagal ngirim email:", emailResult.error || emailResult.message);
        } else {
          console.log("✅ Email sukses terkirim:", emailResult.message);
        }
      } catch (mailErr: any) {
        console.error("❌ Gagal terhubung ke server backend mailer:", mailErr.message);
      }

      setMessage({ 
        type: 'success', 
        text: `Akun HR untuk ${formData.fullName} berhasil diaktifkan! Kredensial login otomatis dikirim ke email tujuan.` 
      });
      
      setFormData({ fullName: '', email: '' }); 
      fetchUsers(); 
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (targetUserId: string, currentStatus: boolean, targetUserEmail: string) => {
    setIsLoading(true);
    try {
      const nextStatus = !currentStatus;
      
      const { error } = await supabase
        .from('users')
        .update({ is_active: nextStatus })
        .eq('user_id', targetUserId);

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          activity: `ADMIN: Mengubah status akun ${targetUserEmail} menjadi ${nextStatus ? 'AKTIF' : 'NONAKTIF'}`
        });
      }

      fetchUsers(); 
    } catch (error: any) {
      alert(`Gagal mengubah status: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter((u: any) => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER & TAB SWITCHER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">Manajemen User</h1>
          <p className="text-stone-500 font-medium mt-1">Kelola hak akses dan status tim recruitment snapHire</p>
        </div>

        <div className="flex bg-stone-100 p-1.5 rounded-2xl w-fit">
          <button 
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
          >
            <Users size={18} /> Daftar User
          </button>
          <button 
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'create' ? 'bg-white text-blue-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
          >
            <UserPlus size={18} /> Registrasi HR
          </button>
        </div>
      </div>


      {/* VIEW: DAFTAR USER */}
      {activeTab === 'list' && (
        <div className="space-y-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
            <input 
              type="text" placeholder="Cari nama atau email..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-stone-200 focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none font-bold text-stone-900 transition-all shadow-sm"
            />
          </div>

          <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl shadow-stone-200/30 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed min-w-[600px]">
                <thead className="bg-stone-50/50 border-b border-stone-100">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] w-[40%]">Profil User</th>
                    <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] w-[20%]">Role Akses</th>
                    <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] w-[20%]">Status Absolut</th>
                    <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] w-[20%] text-center">Akses Sistem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {filteredUsers.map((user: any) => (
                    <tr key={user.user_id} className={`transition-colors group ${user.is_active === false ? 'bg-stone-50/70 opacity-60' : 'hover:bg-stone-50/50'}`}>
                      <td className="px-8 py-5 truncate">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black shrink-0 transition-all ${user.is_active === false ? 'bg-stone-200 text-stone-400' : 'bg-stone-100 text-stone-500 group-hover:bg-blue-600 group-hover:text-white'}`}>
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-stone-900 font-black text-sm truncate">{user.name}</p>
                            <p className="text-stone-400 text-xs font-bold truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                          user.role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        {user.is_active !== false ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase">
                            <BadgeCheck size={14} /> Terverifikasi
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-red-500 font-black text-[10px] uppercase">
                            <User className="opacity-40" size={14} /> Ditangguhkan
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-5 text-center">
                        <button 
                          type="button"
                          disabled={isLoading || user.role === 'admin'} 
                          onClick={() => handleToggleStatus(user.user_id, user.is_active !== false, user.email)}
                          className={`inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                            user.is_active !== false 
                              ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' 
                              : 'text-stone-400 bg-stone-100 hover:bg-stone-200'
                          }`}
                        >
                          {user.is_active !== false ? (
                            <>ON <ToggleRight size={20} className="text-emerald-500" /></>
                          ) : (
                            <>OFF <ToggleLeft size={20} className="text-stone-400" /></>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: REGISTRASI HR */}
      {activeTab === 'create' && (
        <div className="max-w-2xl mx-auto py-4">
          <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-stone-100 shadow-2xl shadow-blue-900/5">
            <div className="flex flex-col items-center mb-10 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-5 shadow-inner">
                <ShieldCheck size={32} />
              </div>
              <h2 className="text-2xl font-black text-stone-900 tracking-tight">Aktifkan Akun HR</h2>
              <p className="text-stone-500 font-medium mt-2">Sistem akan otomatis merender password acak dan menyimpannya ke database.</p>
            </div>

            {message.text && (
              <div className={`mb-8 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
              }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleCreateHR} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300" size={20} />
                  <input 
                    type="text" required value={formData.fullName} 
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="w-full pl-14 pr-6 py-4 bg-stone-50 border-none rounded-2xl text-stone-900 font-bold focus:ring-4 focus:ring-blue-600/10 transition-all outline-none"
                    placeholder="nama lengkap"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1">Email Perusahaan</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300" size={20} />
                  <input 
                    type="email" required value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full pl-14 pr-6 py-4 bg-stone-50 border-none rounded-2xl text-stone-900 font-bold focus:ring-4 focus:ring-blue-600/10 transition-all outline-none"
                    placeholder="hr@snaphire.com"
                  />
                </div>
              </div>

              <button 
                type="submit" disabled={isLoading}
                className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl hover:bg-blue-700 transition-all disabled:bg-stone-200 flex justify-center items-center gap-3 text-lg mt-4"
              >
                {isLoading ? <Loader2 size={24} className="animate-spin" /> : 'Aktifkan & Simpan Akun'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}