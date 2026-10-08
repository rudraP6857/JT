import React, { useState, useRef } from 'react';
import { Modal, Button, EmptyState } from './ui/index.ts';
import { useJobTracker } from '../context/JobTrackerContext.tsx';
import { Resume } from '../types/index.ts';
import { UploadCloud, FileText, Trash2, ExternalLink, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ResumeManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResume?: (resume: Resume) => void;
}

export const ResumeManagerModal: React.FC<ResumeManagerModalProps> = ({
  isOpen,
  onClose,
  onSelectResume,
}) => {
  const { resumes, uploadResume, deleteResume, getResumeUrl } = useJobTracker();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFileProcess = async (file: File) => {
    setUploadError(null);
    if (file.type !== 'application/pdf') {
      setUploadError('Only PDF files are supported');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File exceeds 5MB size limit');
      return;
    }

    try {
      setIsUploading(true);
      const newResume = await uploadResume(file);
      if (newResume && onSelectResume) {
        onSelectResume(newResume);
      }
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleOpenResume = async (filePath: string) => {
    const url = await getResumeUrl(filePath);
    if (url && url !== '#') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Resume Management"
      description="Store, attach, and manage versioned PDF resumes in Supabase Storage"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Upload Dropzone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
            dragActive
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
              : 'border-[#E8EAF2] dark:border-[#1F2437] hover:border-indigo-400 bg-slate-50/50 dark:bg-[#121626]/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileProcess(e.target.files[0]);
              }
            }}
          />
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-[#E8EBF5]">
              {isUploading ? 'Uploading to Supabase Storage...' : 'Click to browse or drop PDF here'}
            </p>
            <p className="text-xs text-slate-500 dark:text-[#8B93AB] mt-1">
              Supports PDF documents up to 5MB (stored securely in private bucket)
            </p>
          </div>
        </div>

        {uploadError && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Resumes List */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            Stored Resumes ({resumes.length})
          </h4>

          {resumes.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No resumes uploaded"
              description="Upload your tailored resume versions to attach them to job applications."
            />
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {resumes.map((resume) => (
                <div
                  key={resume.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-[#E8EAF2] dark:border-[#1F2437] bg-white dark:bg-[#121626] hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-[#E8EBF5] truncate">
                        {resume.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-[#8B93AB]">
                        {formatFileSize(resume.size_bytes)} &bull; Uploaded{' '}
                        {resume.created_at ? format(new Date(resume.created_at), 'MMM d, yyyy') : 'recently'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    {onSelectResume && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          onSelectResume(resume);
                          onClose();
                        }}
                      >
                        Select
                      </Button>
                    )}
                    <button
                      onClick={() => handleOpenResume(resume.file_path)}
                      title="Open / Download resume"
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1f2437] transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteResume(resume.id)}
                      title="Delete resume"
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-[#E8EAF2] dark:border-[#1F2437]">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
