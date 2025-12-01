import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import fs from 'fs'
import path from 'path'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface MajorOption {
  id: string;
  name: string;
}

export interface CourseOption {
  code: string;
  name: string;
}

/**
 * Server-side utility to extract a simplified list of majors
 * Returns an array of {id, name} objects from penn_state_majors.json
 */
export function getMajorList(): MajorOption[] {
  const filePath = path.join(process.cwd(), 'lib', 'data', 'penn_state_majors.json');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const majorsData = JSON.parse(fileContents);

  return Object.entries(majorsData).map(([id, data]: [string, any]) => ({
    id,
    name: data.name
  }));
}

export function getCourseList(): CourseOption[] {
  const filePath = path.join(process.cwd(), 'lib', 'data', 'penn_state_courses.json');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const coursesData = JSON.parse(fileContents);

  return Object.entries(coursesData.courses).map(([code, data]: [string, any]) => ({
    code: code,
    name: data.course_name
  }));
}
