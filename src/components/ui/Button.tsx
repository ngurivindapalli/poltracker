import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-semibold rounded-[8px] transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-[#2563EB] text-white hover:bg-[#1D4ED8]",
    secondary: "bg-[#1E3A5F] text-white hover:bg-[#0F172A]",
    outline: "border border-[#E2E8F0] bg-white text-[#1E3A5F] hover:bg-[#F8FAFC]",
    ghost: "bg-transparent text-[#64748B] hover:text-[#1E3A5F] hover:bg-[#F1F5F9]",
  };

  const sizes = {
    sm: "text-[13px] px-3 py-1.5",
    md: "text-[14px] px-4 py-2",
    lg: "text-[16px] px-6 py-3",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
