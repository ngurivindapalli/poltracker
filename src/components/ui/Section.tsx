import React from "react";

interface SectionProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function Section({ title, subtitle, children, className = "", id }: SectionProps) {
  return (
    <section id={id} className={`section ${className}`}>
      {(title || subtitle) && (
        <div className="mb-6">
          {title && (
            <h2 className="text-[24px] font-semibold text-foreground mb-2">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-[16px] text-muted-foreground">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
