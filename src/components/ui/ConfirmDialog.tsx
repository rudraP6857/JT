import React from 'react';
import { Modal } from './Modal.tsx';
import { Button } from './Button.tsx';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  message?: string;
  confirmText?: string;
  confirmLabel?: string;
  cancelText?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  variant?: 'danger' | 'primary' | 'secondary' | string;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  title,
  description,
  message,
  confirmText,
  confirmLabel,
  cancelText = 'Cancel',
  cancelLabel,
  isDestructive = false,
  variant,
  isLoading = false,
}) => {
  const handleClose = onCancel || onClose || (() => {});
  const resolvedConfirmText = confirmLabel || confirmText || 'Confirm';
  const resolvedCancelText = cancelLabel || cancelText || 'Cancel';
  const resolvedDesc = message || description || '';
  const isDanger = isDestructive || variant === 'danger';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="sm">
      <div className="flex flex-col items-center text-center">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center mb-3.5 ${
            isDanger
              ? 'bg-[#FF453A]/12 text-[#FF453A]'
              : 'bg-[#0A84FF]/12 text-[#0A84FF]'
          }`}
        >
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-[18px] font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight">
          {title}
        </h3>
        {resolvedDesc && (
          <p className="text-[14px] text-[#86868B] dark:text-[#8E8E93] mt-1.5 mb-6 leading-relaxed">
            {resolvedDesc}
          </p>
        )}
        <div className="flex items-center gap-2.5 w-full mt-4">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={handleClose}
            disabled={isLoading}
          >
            {resolvedCancelText}
          </Button>
          <Button
            variant={isDanger ? 'danger' : 'primary'}
            className="flex-1"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {resolvedConfirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
