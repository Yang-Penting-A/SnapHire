"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from 'react-dom';
import { X, Loader2 } from "lucide-react";

interface HiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export default function HiredModal({
  isOpen,
  onClose,
  onSubmit,
}: HiredModalProps) {
  const [formData, setFormData] = useState({
    jobTitle: "",
    startDate: "",
    salary: "",
    department: "",
    manager: "",
    additionalMessage: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      console.log("[Hired Modal] Submitting data:", formData);
      await onSubmit(formData);
      onClose();
    } catch (err) {
      console.error("[Hired Modal] Submission error:", err);
      alert("Gagal mengirim penawaran pekerjaan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-[2px] animate-in fade-in duration-300 p-4 md:p-6">
      <div className="w-full max-w-2xl rounded-[2.5rem] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-stone-100 animate-in zoom-in-95 duration-300 flex max-h-[90vh] flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-5 md:px-8 md:py-6 shrink-0 bg-white">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight uppercase">
              Penawaran Pekerjaan
            </h2>
            <p className="mt-1 text-[11px] font-medium text-stone-500">
              Lengkapi detail penawaran untuk dikirim ke kandidat yang diterima.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-stone-100 rounded-2xl transition-colors text-stone-400 hover:text-stone-600 shrink-0"
            aria-label="Close modal"
          >
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body - scrollable */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5 md:px-8 md:py-6 custom-scrollbar bg-white">
          
          {/* Job Title */}
          <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.22em] mb-2.5">
              Posisi Pekerjaan
            </label>
            <input
              type="text"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleChange}
              placeholder="posisi atau jabatan yang ditawarkan"
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3.5 font-bold text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm"
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.22em] mb-2.5">
              Tanggal Mulai
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3.5 font-bold text-stone-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm"
            />
          </div>

          {/* Salary */}
          <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.22em] mb-2.5">
              Gaji (Opsional)
            </label>
            <input
              type="text"
              name="salary"
              value={formData.salary}
              onChange={handleChange}
              placeholder="gaji atau rentang gaji yang ditawarkan"
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3.5 font-bold text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm"
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.22em] mb-2.5">
              Departemen (Opsional)
            </label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              placeholder="departemen atau divisi"
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3.5 font-bold text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm"
            />
          </div>

          {/* Manager */}
          <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.22em] mb-2.5">
              Nama Manager (Opsional)
            </label>
            <input
              type="text"
              name="manager"
              value={formData.manager}
              onChange={handleChange}
              placeholder="Nama manager atau lead yang akan mengawasi"
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3.5 font-bold text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm"
            />
          </div>

          {/* Additional Message */}
          <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.22em] mb-2.5">
              Pesan Tambahan (Opsional)
            </label>
            <textarea
              name="additionalMessage"
              value={formData.additionalMessage}
              onChange={handleChange}
              placeholder="Tambahkan pesan personal atau informasi onboarding khusus untuk kandidat..."
              rows={5}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3.5 font-bold text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm resize-none"
            />
          </div>
        </div>

        {/* Action Buttons - footer (sticky) */}
        <div className="flex gap-3 justify-end border-t border-stone-100 px-6 py-4 md:px-8 shrink-0 bg-white">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest text-stone-700 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-stone-200 shadow-sm"
          >
            Batal
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Mengirim...
              </>
            ) : (
              "Kirim Penawaran"
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
