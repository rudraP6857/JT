import React from 'react';
import { Stage, STAGES_CONFIG } from '../../types/index.ts';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'stage' | 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline';
  stage?: Stage;
  dot?: boolean;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  stage,
  dot = false,
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-[12px]';

  if (variant === 'stage' && stage) {
    const config = STAGES_CONFIG[stage] || STAGES_CONFIG.saved;
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-full ${sizeClasses} ${config.pillBgLight} ${config.pillTextLight} ${config.pillBgDark} ${config.pillTextDark} ${className}`}
        {...props}
      >
        {dot && (
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: config.dotColor }}
          />
        )}
        <span>{children || config.label}</span>
      </span>
    );
  }

  const variantMap: Record<string, string> = {
    default:
      'bg-[#8E8E93]/12 text-[#636366] dark:bg-[#8E8E93]/20 dark:text-[#AEAEB2]',
    primary:
      'bg-[#0A84FF]/12 text-[#0066CC] dark:bg-[#0A84FF]/20 dark:text-[#64D2FF]',
    success:
      'bg-[#30D158]/14 text-[#1E8A38] dark:bg-[#30D158]/20 dark:text-[#70FF94]',
    warning:
      'bg-[#FF9F0A]/14 text-[#C97800] dark:bg-[#FF9F0A]/20 dark:text-[#FFD60A]',
    danger:
      'bg-[#FF453A]/12 text-[#D70015] dark:bg-[#FF453A]/20 dark:text-[#FF6961]',
    outline:
      'border border-[#E5E5EA] dark:border-[#38383A] text-[#86868B] dark:text-[#8E8E93]',
  };
  const variantClasses = variantMap[variant] || variantMap.default;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />}
      <span>{children}</span>
    </span>
  );
};
