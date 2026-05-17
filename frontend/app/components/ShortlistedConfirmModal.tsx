"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from 'react-dom';
import { X, Loader2, CheckCircle } from "lucide-react";

interface ShortlistedConfirmModalProps {
  candidateName?: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (additionalMessage?: string) => Promise<void>;
}

export default function ShortlistedConfirmModal({
  candidateName = "Kandidat",
  isOpen,
  onClose,
  onConfirm,
}: ShortlistedConfirmModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      await onConfirm(message?.trim() || undefined);
      onClose();
    } catch (err) {
      console.error('[Shortlisted Modal] Error:', err);
      alert('Gagal mengirim email shortlisted');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-[2px] animate-in fade-in duration-300 p-4 md:p-6">
      <div className="w-full max-w-md rounded-[2.5rem] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-stone-100 animate-in zoom-in-95 duration-300 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-5 md:px-8 md:py-6 shrink-0 bg-white">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <CheckCircle size={24} className="text-blue-600" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight uppercase">Konfirmasi</h2>
              <p className="mt-1 text-[11px] font-medium text-stone-500">Pemberitahuan lolos tahap screening awal</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-stone-100 rounded-2xl transition-colors text-stone-400 hover:text-stone-600 shrink-0" aria-label="Close modal">
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 px-6 py-6 md:px-8 md:py-8 bg-white">
          <p className="text-base leading-relaxed text-stone-700">Kirim email pemberitahuan bahwa kandidat <strong className="text-blue-600">{candidateName}</strong> telah lolos tahap seleksi awal?</p>

          <div className="mt-4">
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.22em] mb-2.5">Pesan tambahan (opsional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tambahkan pesan tambahan untuk kandidat..."
              rows={4}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3.5 font-bold text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm resize-none"
            />
            <p className="text-xs text-stone-400 mt-2">Catatan tambahan ini akan disertakan dalam email kandidat.</p>
          </div>
        </div>

        <div className="flex gap-3 border-t border-stone-100 px-6 py-4 md:px-8 shrink-0 bg-white">
          <button onClick={onClose} disabled={isSubmitting} className="flex-1 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest text-stone-700 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-stone-200 shadow-sm">Batal</button>
          <button onClick={handleConfirm} disabled={isSubmitting} className="flex-1 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
            {isSubmitting ? (<><Loader2 size={16} className="animate-spin"/> Mengirim...</>) : ('Kirim Email')}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
