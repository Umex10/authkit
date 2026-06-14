import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge conditional class names and de-duplicate conflicting Tailwind classes.
 * Same helper as the web app — lets NativeWind components accept a `className`
 * override that wins over the defaults.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
