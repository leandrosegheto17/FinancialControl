import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCents(cents: number, currency = "BRL"): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(cents / 100);
}

const MASKED_VALUE = "R$ ••••••";

export function formatCentsOrMask(cents: number, hidden: boolean, currency = "BRL"): string {
  return hidden ? MASKED_VALUE : formatCents(cents, currency);
}
