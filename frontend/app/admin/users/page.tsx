"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { UserPlus, Users, Mail, Lock, User, ShieldCheck, Search, Trash2, BadgeCheck, Loader2 } from 'lucide-react';

export default function AdminUserManagement() {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // State untuk Form Registrasi HR
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });
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
    
    if (!error) setUsers(data);
    setIsLoading(false);
  };

  const handleCreateHR = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { data: { user: currentAdmin } } = await supabase.auth.getUser();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: 'hr' 
          }
        }
      });

      if (authError) throw authError;
      if (currentAdmin) {
        await supabase.from('activity_logs').insert({
          user_id: currentAdmin.id,
          activity: `ADMIN: Berhasil mendaftarkan akun HR baru (${formData.email})`
        });
      }

      setMessage({ type: 'success', text: `Akun HR untuk ${formData.fullName} berhasil diaktifkan!` });
      setFormData({ fullName: '', email: '', password: '' });
      fetchUsers(); 
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER & TAB SWITCHER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">Manajemen User</h1>
          <p className="text-stone-500 font-medium mt-1">Kelola hak akses dan tim recruitment snapHire</p>
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
              <table className="w-full text-left border-collapse">
                <thead className="bg-stone-50/50 border-b border-stone-100">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Profil User</th>
                    <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Role Akses</th>
                    <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {filteredUsers.map((user) => (
                    <tr key={user.user_id} className="hover:bg-stone-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-500 group-hover:bg-blue-600 group-hover:text-white transition-all flex items-center justify-center font-black">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-stone-900 font-black text-sm">{user.name}</p>
                            <p className="text-stone-400 text-xs font-bold">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                          user.role === 'admin' ? 'bg-purple-50 text-purple-700' :
                          user.role === 'hr' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase">
                          <BadgeCheck size={14} /> Terverifikasi
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <button className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                          <Trash2 size={18} />
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
              <p className="text-stone-500 font-medium mt-2">Sistem akan secara otomatis memberikan role HR pada email ini.</p>
            </div>

            {message.text && (
              <div className={`mb-8 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in slide-in-from-top-2 ${
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
                    placeholder="Contoh: HR Manager snapHire"
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

              <div className="space-y-2">
                <label className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1">Password Sementara</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300" size={20} />
                  <input 
                    type="password" required value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full pl-14 pr-6 py-4 bg-stone-50 border-none rounded-2xl text-stone-900 font-bold focus:ring-4 focus:ring-blue-600/10 transition-all outline-none"
                    placeholder="Minimal 6 karakter"
                  />
                </div>
              </div>

              <button 
                type="submit" disabled={isLoading}
                className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-xl shadow-blue-600/25 disabled:bg-stone-200 flex justify-center items-center gap-3 text-lg mt-4"
              >
                {isLoading ? <Loader2 size={24} className="animate-spin" /> : 'Aktifkan Akses HR'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}