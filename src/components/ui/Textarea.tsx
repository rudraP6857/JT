import React, { forwardRef } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', id, rows = 3, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-[13px] font-medium text-[#86868B] dark:text-[#8E8E93]"
          >
            {label}
            {props.required && <span className="text-[#FF453A] ml-1">*</span>}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          className={`w-full rounded-[12px] bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-[#F5F5F7] text-[15px] placeholder:text-[#86868B] dark:placeholder:text-[#8E8E93] p-3.5 transition-all outline-none focus:ring-2 focus:ring-[#0A84FF] disabled:opacity-50 resize-y ${
            error ? 'ring-2 ring-[#FF453A]' : ''
          } ${className}`}
          {...props}
        />
        {error ? (
          <p className="text-xs text-[#FF453A] mt-0.5">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[#86868B] dark:text-[#8E8E93] mt-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
