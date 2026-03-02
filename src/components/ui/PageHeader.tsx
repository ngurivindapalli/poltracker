import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, className = "", action }: PageHeaderProps) {
  return (
    <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#E2E8F0] ${className}`}>
      <div>
        <h1 className="text-[32px] font-bold text-[#1E3A5F] leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-[18px] text-[#64748B] max-w-3xl">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
