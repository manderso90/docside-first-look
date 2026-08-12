"use client";

import type { ButtonHTMLAttributes, TextareaHTMLAttributes } from "react";

export function PrimaryButton({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  // Vocabulary .btn-primary values (Stage A3): 13.5px / 10×18 padding /
  // :active scale, brand hover ramp kept.
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-control bg-deep-ocean px-[18px] py-2.5 text-[13.5px] font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-ocean-700 active:bg-midnight-slate active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-muted disabled:text-surface-2 disabled:active:scale-100 ${className}`}
    />
  );
}

export function QuietLinkButton({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`text-[13px] text-ink-3 underline decoration-line underline-offset-2 transition-colors hover:text-ink disabled:cursor-not-allowed disabled:text-muted ${className}`}
    />
  );
}

export function TextArea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  // Vocabulary survey-input treatment (Stage A3): 1.5px soft hairline, 12px
  // radius, Deep Ocean focus ring.
  return (
    <textarea
      {...props}
      className={`w-full rounded-[12px] border-[1.5px] border-line-soft bg-surface px-[15px] py-[13px] text-[14px] leading-[1.55] text-ink placeholder:text-ink-soft focus:border-deep-ocean focus:shadow-[0_0_0_1px_var(--color-deep-ocean)] focus:outline-none disabled:bg-surface-2 disabled:text-muted ${className}`}
    />
  );
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="mt-3 text-[13px] text-conflict">
      {children}
    </p>
  );
}
