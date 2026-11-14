import React from 'react';

interface WireframeSlotProps {
  title: string;
  subtitle?: string;
  badge?: string;
  aspectClass?: string;
  children?: React.ReactNode;
}

export const WireframeSlot: React.FC<WireframeSlotProps> = ({
  title,
  subtitle,
  badge,
  aspectClass = 'min-h-[160px]',
  children,
}) => {
  return (
    <div
      className={`relative border border-[#789575] bg-[#C7CFA3] rounded-lg p-5 flex flex-col justify-between ${aspectClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#192418]">{title}</p>
          {subtitle && (
            <p className="text-xs text-[#2C3D2B] mt-1 leading-relaxed max-w-md">
              {subtitle}
            </p>
          )}
        </div>
        {badge && (
          <span className="text-[11px] font-mono font-medium text-[#3F523E] whitespace-nowrap shrink-0">
            {badge}
          </span>
        )}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
};
