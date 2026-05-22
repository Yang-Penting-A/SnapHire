"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from 'react-dom';
import { X, Loader2 } from "lucide-react";

interface TechnicalTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export default function TechnicalTestModal({
  isOpen,
  onClose,
  onSubmit,
}: TechnicalTestModalProps) {
  const [testType, setTestType] = useState<string>("Assessment");
  const [formData, setFormData] = useState({
    testType: "Assessment",
    // Assessment / Take Home
    assessmentLink: "",
    deadlineDate: "",
    deadlineTime: "",
    estimatedDuration: "",
    // Live Coding
    meetingLink: "",
    scheduleDate: "",
    scheduleTime: "",
    duration: "",
    // General
    instructions: "",
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

  const handleTestTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    setTestType(newType);
    setFormData({ ...formData, testType: newType });
  };

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
      console.log("[Technical Test Modal] Submitting data:", formData);
      await onSubmit(formData);
      onClose();
    } catch (err) {
      console.error("[Technical Test Modal] Submission error:", err);
      alert("Gagal mengirim undangan tes teknis");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAssessmentOrTakeHome = ['Assessment', 'Take Home Project'].includes(testType);
  const isLiveOrOnline = ['Live Coding', 'Online Interview'].includes(testType);

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-[2px] animate-in fade-in duration-300 p-4 md:p-6">
      <div className="w-full max-w-2xl rounded-[2.5rem] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-stone-100 animate-in zoom-in-95 duration-300 flex max-h-[90vh] flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-5 md:px-8 md:py-6 shrink-0 bg-white">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight uppercase">
              Undang Tes Teknis
            </h2>
            <p className="mt-1 text-[11px] font-medium text-stone-500">
              Lengkapi detail tes teknis sebelum mengirim undangan ke kandidat.
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
          
          {/* Test Type */}
          <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.22em] mb-2.5">
              Jenis Tes Teknis
            </label>
            <select
              value={testType}
              onChange={handleTestTypeChange}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3.5 font-bold text-stone-700 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all shadow-sm appearance-none cursor-pointer"
            >
              <option value="Assessment">Assessment / Kuis Online</option>
              <option value="Live Coding">Live Coding Session</option>
              <option value="Take Home Project">Take Home Project</option>
              <option value="Online Interview">Online Technical Interview</option>
              <option value="Offline Interview">Offline Technical Interview</option>
              <option value="Other">Lainnya</option>
            </select>
          </div>

          {/* Assessment / Take Home Fields */}
          {isAssessmentOrTakeHome && (
            <>
              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.22em] mb-2.5">
                  Link Tes / Assessment
                </label>
                <input
                  type="url"
                  name="assessmentLink"
                  value={formData.assessmentLink}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3.5 font-bold text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.22em] mb-2.5">
                    Tanggal Deadline
                  </label>
                  <input
                    type="date"
                    name="deadlineDate"
                    value={formData.deadlineDate}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3.5 font-bold text-stone-700 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.22em] mb-2.5">
                    Waktu Deadline (Opsional)
                  </label>
                  <input
                    type="time"
                    name="deadlineTime"
                    value={formData.deadlineTime}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3.5 font-bold text-stone-700 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.22em] mb-2.5">
                  Durasi Perkiraan (menit)
                </label>
                <input
                  type="number"
                  name="estimatedDuration"
                  value={formData.estimatedDuration}
                  onChange={handleChange}
                  placeholder="60"
                  min="15"
                  max="480"
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3.5 font-bold text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all shadow-sm"
                />
              </div>
            </>
          )}

          {/* Live Coding / Online Interview Fields */}
          {isLiveOrOnline && (
            <>
              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.22em] mb-2.5">
                  Link Meeting / Lokasi
                </label>
                <input
                  type="text"
                  name="meetingLink"
                  value={formData.meetingLink}
                  onChange={handleChange}
                  placeholder="https://meet.google.com/xxx atau Ruang Rapat"
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3.5 font-bold text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.22em] mb-2.5">
                    Tanggal Jadwal
                  </label>
                  <input
                    type="date"
                    name="scheduleDate"
                    value={formData.scheduleDate}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3.5 font-bold text-stone-700 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.22em] mb-2.5">
                    Waktu Jadwal
                  </label>
                  <input
                    type="time"
                    name="scheduleTime"
                    value={formData.scheduleTime}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3.5 font-bold text-stone-700 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.22em] mb-2.5">
                  Durasi Sesi (menit)
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder="60"
                  min="15"
                  max="180"
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3.5 font-bold text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all shadow-sm"
                />
              </div>
            </>
          )}

          {/* Instructions */}
          <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.22em] mb-2.5">
              Instruksi (Opsional)
            </label>
            <textarea
              name="instructions"
              value={formData.instructions}
              onChange={handleChange}
              placeholder="Tambahkan instruksi khusus untuk kandidat, requirements yang diperlukan, atau informasi penting lainnya."
              rows={4}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3.5 font-bold text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all shadow-sm resize-none"
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
            disabled={isSubmitting || !formData.testType}
            className="px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2"
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
