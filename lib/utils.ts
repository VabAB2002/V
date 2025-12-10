import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Re-export types from the centralized types file for backwards compatibility
export type { MajorOption, CourseOption } from './types';
