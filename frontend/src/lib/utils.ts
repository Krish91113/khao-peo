import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extract a human-readable message from an axios/JS error without using `any`.
 */
export function errorMessage(error: unknown, fallback: string): string {
  const e = error as {
    response?: { data?: { message?: string; error?: { message?: string } } };
    message?: string;
  };
  return (
    e?.response?.data?.message ?? e?.response?.data?.error?.message ?? e?.message ?? fallback
  );
}
