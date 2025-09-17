"use client";

import * as React from "react";
import cx from "clsx";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "subtle" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  type = "button",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
    sm: "text-sm px-3 py-1.5",
    md: "text-sm px-3.5 py-2",
    lg: "text-base px-4 py-2.5",
  };

  const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary:
      "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm",
    subtle:
      "bg-white text-ink-800 ring-1 ring-ink-200 hover:bg-ink-50 active:bg-ink-100 dark:bg-ink-900 dark:text-ink-100 dark:ring-ink-800 dark:hover:bg-ink-800",
    ghost:
      "bg-transparent text-ink-800 hover:bg-ink-50 active:bg-ink-100 dark:text-ink-100 dark:hover:bg-ink-800",
    destructive:
      "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm",
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      {...props}
      disabled={isDisabled}
      className={cx(base, sizes[size], variants[variant], className)}
      aria-live="polite"
    >
      {loading && (
        <svg
          className="h-4 w-4 animate-spin"
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
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
