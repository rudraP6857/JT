import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col gap-1.5 w-full text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[13px] font-medium text-[#86868B] dark:text-[#8E8E93]"
          >
            {label}
            {props.required && <span className="text-[#FF453A] ml-1">*</span>}
          </label>
        )}

        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-[#86868B] dark:text-[#8E8E93]">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            className={`w-full h-12 rounded-[12px] bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-[#F5F5F7] text-[15px] placeholder:text-[#86868B] dark:placeholder:text-[#8E8E93] outline-none focus:ring-2 focus:ring-[#0A84FF] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              leftIcon ? 'pl-10' : 'px-4'
            } ${rightIcon ? 'pr-10' : 'px-4'} ${
              error ? 'ring-2 ring-[#FF453A]' : ''
            } ${className}`}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3.5 flex items-center text-[#86868B] dark:text-[#8E8E93]">
              {rightIcon}
            </div>
          )}
        </div>

        {error ? (
          <p className="text-xs text-[#FF453A] mt-0.5">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[#86868B] dark:text-[#8E8E93] mt-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
