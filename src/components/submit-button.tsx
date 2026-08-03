"use client";

import { useFormStatus } from "react-dom";
import { PrimaryButton } from "@/components/ui";

/** Primary form button with a quiet pending state (loading state rule §5). */
export function SubmitButton({
  children,
  disabled,
}: {
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <PrimaryButton type="submit" disabled={disabled || pending} aria-busy={pending}>
      {pending ? "One moment…" : children}
    </PrimaryButton>
  );
}
