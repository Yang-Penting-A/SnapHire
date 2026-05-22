"use client";

import React, { useState, useRef } from 'react';
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { buildApiUrl } from '@/app/lib/api';

interface CVUploadComponentProps {
  jobId: string;
  onUploadSuccess?: () => void;
  onUploadError?: (error: string) => void;
  variant?: 'modal' | 'inline';
}

export default function CVUploadComponent({
  jobId,
  onUploadSuccess,
  onUploadError,
  variant = 'inline'
}: CVUploadComponentProps) {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setUploadFile(file);
        setUploadStatus('idle');
        setErrorMessage('');
      } else {
        setErrorMessage('Only PDF files are allowed');
        setUploadStatus('error');
        setUploadFile(null);
      }
    }
  };

  const handleUploadCV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setErrorMessage('Please select a file');
      setUploadStatus('error');
      return;
    }

    setIsUploading(true);
    setUploadStatus('loading');

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('job_id', jobId);

      console.log('[Frontend] CV Upload - Starting upload for job:', jobId);
      console.log('[Frontend] File details:', { name: uploadFile.name, size: uploadFile.size, type: uploadFile.type });

      const apiUrl = buildApiUrl('/cv/upload');
      console.log('[Frontend] API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      console.log('[Frontend] Response status:', response.status);

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
          console.error('[Frontend] Error response from server:', errorData);
        } catch (e) {
          console.error('[Frontend] Could not parse error response');
        }
        
        // Build detailed error message
        const step = errorData.step || 'unknown';
        const details = errorData.details || errorData.message || 'Unknown error';
        const fullMessage = `Upload failed at [${step}]: ${errorData.message || details}`;
        
        throw new Error(fullMessage);
      }

      const data = await response.json();
      console.log('[Frontend] Upload successful:', data);
      setUploadStatus('success');
      setSuccessMessage(`CV uploaded successfully! Candidate: ${data.candidate_name || 'New Candidate'} (Score: ${data.score})`);
      setUploadFile(null);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (onUploadSuccess) {
        onUploadSuccess();
      }

      // Reset success message after 5 seconds
      setTimeout(() => {
        setUploadStatus('idle');
        setSuccessMessage('');
      }, 5000);
    } catch (error: any) {
      const errMsg = error.message || 'An error occurred while uploading CV';
      console.error('[Frontend] Full error:', errMsg);
      
      setUploadStatus('error');
      setErrorMessage(errMsg);
      
      if (onUploadError) {
        onUploadError(errMsg);
      }

      console.error('CV Upload Error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setUploadFile(null);
    setUploadStatus('idle');
    setErrorMessage('');
    setSuccessMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // MODAL VARIANT
  if (variant === 'modal') {
    return (
      <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-black text-stone-900">Upload CV</h3>
          {uploadStatus === 'success' && (
            <button onClick={resetUpload} className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
              <X size={20} className="text-stone-400" />
            </button>
          )}
        </div>

        <form onSubmit={handleUploadCV} className="space-y-4">
          {/* FILE INPUT */}
          <div className="border-2 border-dashed border-stone-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
              id="cv-upload-modal"
              disabled={isUploading}
            />
            <label htmlFor="cv-upload-modal" className="cursor-pointer block">
              <FileText size={32} className="mx-auto text-stone-400 mb-2" />
              <p className="text-sm font-bold text-stone-900">
                {uploadFile ? uploadFile.name : 'Click to select PDF'}
              </p>
              <p className="text-xs text-stone-500 mt-1">PDF files only • Max 10MB</p>
            </label>
          </div>

          {/* STATUS MESSAGES */}
          {uploadStatus === 'loading' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
              <Loader2 size={20} className="text-blue-600 animate-spin" />
              <p className="text-sm font-bold text-blue-900">Processing CV with AI...</p>
            </div>
          )}

          {uploadStatus === 'success' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-bold text-emerald-900">{successMessage}</p>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-bold text-red-900">{errorMessage}</p>
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="flex gap-3 pt-2">
            {uploadStatus === 'success' ? (
              <button
                type="button"
                onClick={resetUpload}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-900 px-6 py-3 rounded-xl font-bold transition-colors"
              >
                Upload Another CV
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={resetUpload}
                  className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-900 px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-50"
                  disabled={isUploading}
                >
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={!uploadFile || isUploading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-stone-300 text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={18} /> Upload
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    );
  }

  // INLINE VARIANT (DEFAULT)
  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-8 shadow-sm">
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <Upload size={24} className="text-blue-600" />
            <h3 className="text-2xl font-black text-stone-900">Upload CV</h3>
          </div>
          <p className="text-stone-700 font-medium mb-6">
            Manually upload candidate CVs for this position. They will be processed with AI screening.
          </p>

          <form onSubmit={handleUploadCV} className="space-y-4">
            {/* FILE INPUT */}
            <div className="border-2 border-dashed border-blue-300 rounded-xl p-6 text-center hover:border-blue-500 transition-colors bg-white/50">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                id="cv-upload-inline"
                disabled={isUploading}
              />
              <label htmlFor="cv-upload-inline" className="cursor-pointer block">
                <FileText size={28} className="mx-auto text-blue-400 mb-2" />
                <p className="text-sm font-bold text-stone-900">
                  {uploadFile ? uploadFile.name : 'Click to select PDF'}
                </p>
                <p className="text-xs text-stone-500 mt-1">PDF files only • Max 10MB</p>
              </label>
            </div>

            {/* STATUS MESSAGES */}
            {uploadStatus === 'loading' && (
              <div className="bg-white border border-blue-200 rounded-xl p-4 flex items-center gap-3">
                <Loader2 size={20} className="text-blue-600 animate-spin" />
                <p className="text-sm font-bold text-blue-900">Processing CV with AI...</p>
              </div>
            )}

            {uploadStatus === 'success' && (
              <div className="bg-white border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-emerald-900">{successMessage}</p>
                </div>
                <button
                  type="button"
                  onClick={resetUpload}
                  className="text-emerald-600 hover:text-emerald-700 font-bold text-sm"
                >
                  Upload More
                </button>
              </div>
            )}

            {uploadStatus === 'error' && (
              <div className="bg-white border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-bold text-red-900">{errorMessage}</p>
              </div>
            )}

            {/* ACTION BUTTONS */}
            {uploadStatus !== 'success' && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={resetUpload}
                  className="px-6 py-3 bg-white/70 hover:bg-white text-blue-600 rounded-xl font-bold transition-colors border border-blue-200 disabled:opacity-50"
                  disabled={isUploading}
                >
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={!uploadFile || isUploading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-stone-300 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase text-sm tracking-widest"
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={18} /> Upload CV
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>

        <div className="hidden md:block text-6xl opacity-10">📄</div>
      </div>
    </div>
  );
}
