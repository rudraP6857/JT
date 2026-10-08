import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangular' | 'circular' | 'rounded';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rounded',
  className = '',
  ...props
}) => {
  const variantStyles = {
    circular: 'rounded-full',
    rounded: 'rounded-xl',
    rectangular: 'rounded-none',
  }[variant];

  return (
    <div
      className={`animate-pulse bg-slate-200/80 dark:bg-[#1f2437] ${variantStyles} ${className}`}
      {...props}
    />
  );
};
