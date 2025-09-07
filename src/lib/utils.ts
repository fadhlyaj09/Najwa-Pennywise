import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRupiah(
  amount: number,
  options: { short?: boolean } = {}
) {
  if (options.short) {
    if (Math.abs(amount) >= 1_000_000_000) {
      return `Rp${(amount / 1_000_000_000).toFixed(1)}B`;
    }
    if (Math.abs(amount) >= 1_000_000) {
      return `Rp${(amount / 1_000_000).toFixed(1)}M`;
    }
    if (Math.abs(amount) >= 1000) {
      return `Rp${(amount / 1000).toFixed(0)}K`;
    }
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
