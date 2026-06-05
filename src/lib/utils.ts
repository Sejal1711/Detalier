import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function formatHeight(cm: number): string {
  const totalInches = Math.round(cm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}'${inches}" (${cm} cm)`;
}

export function formatIncome(lakhs: number): string {
  if (lakhs >= 100) return `₹${(lakhs / 100).toFixed(1)} Cr/yr`;
  return `₹${lakhs} LPA`;
}

const avatarColors = [
  "linear-gradient(135deg, #fb7185, #ec4899)",
  "linear-gradient(135deg, #a78bfa, #8b5cf6)",
  "linear-gradient(135deg, #60a5fa, #6366f1)",
  "linear-gradient(135deg, #34d399, #14b8a6)",
  "linear-gradient(135deg, #fb923c, #fb7185)",
  "linear-gradient(135deg, #22d3ee, #3b82f6)",
  "linear-gradient(135deg, #e879f9, #ec4899)",
  "linear-gradient(135deg, #fbbf24, #f97316)",
];

export function getAvatarColor(id: number): string {
  return avatarColors[id % avatarColors.length];
}
