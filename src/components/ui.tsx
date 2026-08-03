"use client";

import type { ButtonHTMLAttributes, TextareaHTMLAttributes } from "react";

export function PrimaryButton({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-control bg-deep-ocean px-5 py-2.5 text-[14px] font-semibold text-white transition-colors duration-150 hover:bg-ocean-700 active:bg-midnight-slate disabled:cursor-not-allowed disabled:bg-muted disabled:text-surface-2 ${className}`}
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
  return (
    <textarea
      {...props}
      className={`w-full rounded-control border border-line bg-surface px-3.5 py-2.5 text-[14px] text-ink placeholder:text-muted focus:border-verified-line disabled:bg-surface-2 disabled:text-muted ${className}`}
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
