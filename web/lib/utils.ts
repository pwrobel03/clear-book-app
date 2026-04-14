import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Łączy klasy Tailwind z obsługą konfliktów (wymagane przez shadcn). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
