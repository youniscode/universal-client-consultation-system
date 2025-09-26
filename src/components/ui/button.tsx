"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "subtle" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

export default function Button({
  className,
  variant = "primary",
  size = "md",
  disabled,
  loading,
  // IMPORTANT: do NOT default `type` here; let callers pass "submit" etc.
  type,
  children,
  ...props
}: ButtonProps) {
  const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-3.5 py-2 text-sm",
    lg: "px-4 py-2.5",
  };

  const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary:
      "bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 shadow-sm",
    subtle:
      "bg-white text-gray-900 border hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-indigo-500",
    ghost:
      "bg-transparent text-gray-900 border border-transparent hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-indigo-500",
    destructive:
      "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-2 focus-visible:ring-rose-500",
  };

  const isDisabled = disabled || !!loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-live="polite"
      className={cn(
        "relative inline-flex items-center justify-center gap-2 rounded-md transition-colors",
        "focus:outline-none focus-visible:outline-none focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "whitespace-nowrap leading-normal",
        sizes[size],
        variants[variant],
        className
      )}
      {...props}
    >
      {loading && (
        <svg
          className="h-4 w-4 animate-spin shrink-0"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            d="M4 12a8 8 0 018-8v4"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
        </svg>
      )}
      <span className="relative z-[1]">{children}</span>
    </button>
  );
}
