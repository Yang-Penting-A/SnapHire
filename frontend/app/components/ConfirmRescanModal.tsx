"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Loader2, X } from "lucide-react";

interface ConfirmRescanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isBulk?: boolean;
  candidateName?: string;
  isLoading?: boolean;
}

export default function ConfirmRescanModal({
  isOpen,
  onClose,
  onConfirm,
  isBulk = false,
  candidateName,
  isLoading = false,
}: ConfirmRescanModalProps) {

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    await onConfirm();
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-[2px] animate-in fade-in duration-300 p-4">

      <div className="w-full max-w-md rounded-[2.5rem] bg-white border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden animate-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-5">

          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
              <AlertTriangle
                size={26}
                className="text-blue-600"
              />
            </div>

            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-stone-900">
                Konfirmasi Rescan
              </h2>

              <p className="mt-1 text-[11px] font-medium text-stone-500 leading-relaxed">
                {isBulk
                  ? "Proses ini akan menjalankan ulang AI scoring untuk seluruh kandidat."
                  : `AI akan menjalankan ulang scoring untuk ${candidateName}.`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2.5 rounded-2xl hover:bg-stone-100 transition-colors text-stone-400 hover:text-stone-600"
          >
            <X size={22} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <div className="rounded-3xl border border-blue-100 bg-blue-50/60 px-5 py-4">
            <p className="text-sm font-semibold text-stone-700 leading-relaxed">
              Apakah anda yakin ingin melanjutkan proses rescan AI?
            </p>

            <p className="mt-2 text-xs text-stone-500">
              Proses ini mungkin membutuhkan beberapa saat tergantung jumlah data kandidat.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-stone-100 px-6 py-4 bg-white">

          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest text-stone-700 bg-stone-100 hover:bg-stone-200 transition-all border border-stone-200 shadow-sm disabled:opacity-50"
          >
            Batal
          </button>

          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Processing...
              </>
            ) : (
              "Ya, Lanjutkan"
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
}