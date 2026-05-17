"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from 'react-dom';
import { X, Loader2 } from "lucide-react";

interface InterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export default function InterviewModal({
  isOpen,
  onClose,
  onSubmit,
}: InterviewModalProps) {
  const [formData, setFormData] = useState({
    interviewDate: "",
    interviewTime: "",
    interviewType: "Virtual",
    interviewLocation: "",
    interviewDuration: "45",
    additionalInstructions: "",
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      console.log("[Interview Modal] Submitting interview data:", formData);
      await onSubmit(formData);
      onClose();
    } catch (err) {
      console.error("[Interview Modal] Submission error:", err);
      alert("Gagal mengirim undangan interview");
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
            Jadwalkan Interview
            </h2>
            <p className="mt-1 text-[11px] font-medium text-stone-500">
              Lengkapi detail interview sebelum mengirim undangan ke kandidat.
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
          {/* Interview Date */}
          <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.22em] mb-2.5">
              Tanggal Interview
            </label>
            <input
              type="date"
              name="interviewDate"
              value={formData.interviewDate}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3.5 font-bold text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>

          {/* Interview Time */}
          <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.22em] mb-2.5">
              Waktu Interview
            </label>
            <input
              type="time"
              name="interviewTime"
              value={formData.interviewTime}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3.5 font-bold text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>

          {/* Interview Type */}
          <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.22em] mb-2.5">
              Tipe Interview
            </label>
            <select
              name="interviewType"
              value={formData.interviewType}
              onChange={handleChange}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3.5 font-bold text-stone-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm appearance-none cursor-pointer"
            >
              <option value="Virtual">Virtual (Google Meet / Zoom)</option>
              <option value="In Person">In Person</option>
              <option value="Phone">Phone Call</option>
            </select>
          </div>

          {/* Location / Meeting Link */}
          <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.22em] mb-2.5">
              Lokasi / Link Meeting
            </label>
            <input
              type="text"
              name="interviewLocation"
              value={formData.interviewLocation}
              onChange={handleChange}
              placeholder="Contoh: https://meet.google.com/xxx atau Ruang Rapat 3"
              required
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3.5 font-bold text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.22em] mb-2.5">
              Durasi (menit)
            </label>
            <input
              type="number"
              name="interviewDuration"
              value={formData.interviewDuration}
              onChange={handleChange}
              placeholder="45"
              min="15"
              max="180"
              required
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3.5 font-bold text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>

          {/* Additional Instructions */}
          <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.22em] mb-2.5">
              Instruksi Tambahan (Opsional)
            </label>
            <textarea
              name="additionalInstructions"
              value={formData.additionalInstructions}
              onChange={handleChange}
              placeholder="Tambahkan instruksi tambahan untuk kandidat jika diperlukan."
              rows={4}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3.5 font-bold text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm resize-none"
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
            disabled={isSubmitting || !formData.interviewDate || !formData.interviewTime || !formData.interviewLocation}
            className="px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Mengirim...
              </>
            ) : (
              "Kirim Undangan"
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}