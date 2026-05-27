"use client";

import { type InputHTMLAttributes, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Input({
  label,
  error,
  hint,
  id,
  type = "text",
  className = "",
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const resolvedType = isPassword ? (showPassword ? "text" : "password") : type;
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {/* Label — style LABEL : uppercase, tracking, 12px medium */}
      {label && (
        <label
          htmlFor={inputId}
          className="text-[12px] font-medium uppercase tracking-[0.06em] text-primary"
        >
          {label}
        </label>
      )}

      {/* Input wrapper */}
      <div className="relative">
        <input
          id={inputId}
          type={resolvedType}
          className={[
            "w-full h-11 px-3.5 rounded-lg",
            "text-[14px] text-primary placeholder:text-primary/30",
            "bg-white border transition-colors duration-150",
            "focus:outline-none focus:ring-2",
            error
              ? "border-danger focus:ring-danger/25 focus:border-danger"
              : "border-[#E5E7EB] hover:border-primary/30 focus:ring-secondary/30 focus:border-secondary/60",
            isPassword ? "pr-10" : "",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={
            error
              ? `${inputId}-error`
              : hint
              ? `${inputId}-hint`
              : undefined
          }
          {...props}
        />

        {/* Password toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2
                       text-primary/40 hover:text-primary/70 transition-colors"
            aria-label={
              showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"
            }
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff size={16} aria-hidden="true" />
            ) : (
              <Eye size={16} aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p
          id={`${inputId}-error`}
          role="alert"
          className="text-[12px] text-danger leading-tight"
        >
          {error}
        </p>
      )}

      {/* Hint (only shown when no error) */}
      {hint && !error && (
        <p
          id={`${inputId}-hint`}
          className="text-[12px] text-primary/45 leading-tight"
        >
          {hint}
        </p>
      )}
    </div>
  );
}
