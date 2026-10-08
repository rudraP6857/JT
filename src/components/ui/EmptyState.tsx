import React from 'react';
import { LucideIcon, FolderSearch } from 'lucide-react';
import { Button } from './Button.tsx';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FolderSearch,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center py-10 px-4 text-center ${className}`}
    >
      {/* One soft icon container */}
      <div className="w-12 h-12 rounded-full bg-[#E5E5EA]/70 dark:bg-[#2C2C2E] text-[#86868B] dark:text-[#8E8E93] flex items-center justify-center mb-3">
        <Icon className="w-5 h-5" strokeWidth={1.75} />
      </div>

      {/* One clean title */}
      <h3 className="text-[17px] font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight">
        {title}
      </h3>

      {/* One concise description line */}
      <p className="text-[13px] text-[#86868B] dark:text-[#8E8E93] max-w-sm mt-1 mb-5">
        {description}
      </p>

      {/* One clean button */}
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
