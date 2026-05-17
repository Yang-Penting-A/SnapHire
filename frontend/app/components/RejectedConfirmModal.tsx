"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from 'react-dom';
import { X, Loader2, AlertCircle } from "lucide-react";

interface RejectedConfirmModalProps {
  candidateName?: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function RejectedConfirmModal({
  candidateName = "Kandidat",
  isOpen,
  onClose,
  onConfirm,
}: RejectedConfirmModalProps) {
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

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      console.log("[Rejected Confirm Modal] Sending rejection email");
      await onConfirm();
      onClose();
    } catch (err) {
      console.error("[Rejected Confirm Modal] Error:", err);
      alert("Gagal mengirim email penolakan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-[2px] animate-in fade-in duration-300 p-4 md:p-6">
      <div className="w-full max-w-md rounded-[2.5rem] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-stone-100 animate-in zoom-in-95 duration-300 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-5 md:px-8 md:py-6 shrink-0 bg-white">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-rose-50 rounded-xl">
              <AlertCircle size={24} className="text-rose-600" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight uppercase">
                Konfirmasi
              </h2>
              <p className="mt-1 text-[11px] font-medium text-stone-500">
                Penolakan kandidat
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-stone-100 rounded-2xl transition-colors text-stone-400 hover:text-stone-600 shrink-0"
            aria-label="Close modal"
          >
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 px-6 py-6 md:px-8 md:py-8 bg-white">
          <p className="text-base text-stone-700 leading-relaxed">
            Apakah Anda yakin ingin mengirim email penolakan kepada{' '}
            <strong className="text-rose-600">{candidateName}</strong>?
          </p>
          
          <div className="mt-6 p-4 bg-rose-50 rounded-2xl border border-rose-100 shadow-sm">
            <p className="text-sm text-rose-900 leading-relaxed">
              <strong>Catatan:</strong> Email penolakan profesional akan dikirim ke kandidat. Aksi ini tidak dapat dibatalkan setelah dikonfirmasi.
            </p>
          </div>
        </div>

        {/* Action Buttons - footer */}
        <div className="flex gap-3 border-t border-stone-100 px-6 py-4 md:px-8 shrink-0 bg-white">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            Batal
          </button>

          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Mengirim...
              </>
            ) : (
              "Kirim Email"
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
