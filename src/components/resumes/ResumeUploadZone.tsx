import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, FileText, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ResumeUploadZoneProps {
  onFileSelect: (file: File) => Promise<any>;
  isLoading?: boolean;
}

export const ResumeUploadZone: React.FC<ResumeUploadZoneProps> = ({
  onFileSelect,
  isLoading = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleProcessFile = async (file: File) => {
    setErrorMessage(null);

    // Validation
    if (file.type !== 'application/pdf') {
      setStatus('error');
      setErrorMessage('Only PDF documents are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setStatus('error');
      setErrorMessage('File exceeds the 5MB size limit');
      return;
    }

    setSelectedFileName(file.name);
    setStatus('uploading');
    setProgress(25);

    try {
      // Simulate progress progression for smooth UX
      const timer = setInterval(() => {
        setProgress((prev) => (prev < 85 ? prev + 20 : prev));
      }, 150);

      await onFileSelect(file);

      clearInterval(timer);
      setProgress(100);
      setStatus('success');

      setTimeout(() => {
        setStatus('idle');
        setProgress(0);
        setSelectedFileName(null);
      }, 2500);
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Upload failed');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => status !== 'uploading' && fileInputRef.current?.click()}
      className={`relative overflow-hidden rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center cursor-pointer transition-all duration-200 select-none ${
        isDragging
          ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30 scale-[1.01]'
          : status === 'error'
          ? 'border-rose-400 bg-rose-50/40 dark:bg-rose-950/20'
          : status === 'success'
          ? 'border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20'
          : 'border-[#E8EAF2] dark:border-[#1F2437] hover:border-indigo-400 dark:hover:border-indigo-600 bg-white/70 dark:bg-[#121626]/70'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleProcessFile(e.target.files[0]);
          }
        }}
      />

      <div className="flex flex-col items-center max-w-sm mx-auto">
        {/* Animated Icon State */}
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3.5 transition-colors ${
            status === 'success'
              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
              : status === 'error'
              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
              : status === 'uploading'
              ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
              : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
          }`}
        >
          {status === 'success' ? (
            <CheckCircle2 className="w-7 h-7" />
          ) : status === 'error' ? (
            <AlertCircle className="w-7 h-7" />
          ) : status === 'uploading' ? (
            <Loader2 className="w-7 h-7 animate-spin" />
          ) : (
            <UploadCloud className="w-7 h-7" />
          )}
        </div>

        {/* Text prompt */}
        {status === 'uploading' ? (
          <div className="w-full space-y-2">
            <p className="text-sm font-bold text-slate-900 dark:text-[#E8EBF5]">
              Uploading {selectedFileName}…
            </p>
            {/* Animated Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-[#1f2437] overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </div>
        ) : status === 'success' ? (
          <div>
            <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
              Resume uploaded successfully!
            </h4>
            <p className="text-xs text-slate-500 dark:text-[#8B93AB] mt-0.5">
              Added to your private Supabase storage
            </p>
          </div>
        ) : status === 'error' ? (
          <div>
            <h4 className="text-sm font-bold text-rose-700 dark:text-rose-300">
              Upload Failed
            </h4>
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">
              {errorMessage}
            </p>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 inline-block font-medium hover:underline">
              Click to try again
            </span>
          </div>
        ) : (
          <div>
            <h4 className="text-sm sm:text-base font-bold font-heading text-slate-900 dark:text-[#E8EBF5]">
              Drop your PDF here or browse
            </h4>
            <p className="text-xs text-slate-500 dark:text-[#8B93AB] mt-1">
              Supports standard PDF format up to 5MB (stored securely in private bucket)
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
