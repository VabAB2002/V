/**
 * Actions Module Barrel Export
 * 
 * Re-exports all server actions for clean imports throughout the app.
 * Usage: import { fetchMajors, parseTranscript } from '@/app/actions'
 */

// Data fetching actions
export { fetchMajors, fetchCourses } from './fetchData';

// Transcript parsing
export { parseTranscriptPDF, extractCourseCodesFromParsed } from './parseTranscript';
export type { ParsedCourse } from './parseTranscript';

// Course details
export { getCourseDetails } from './getCourseDetails';
export { getBatchCourseDetails } from './getBatchCourseDetails';

// Recommendations
export { getMinorRecommendations } from './getRecommendations';
export type { MinorRecommendation } from './getRecommendations';
export { getCertificateRecommendations } from './getCertificateRecommendations';
export type { CertificateRecommendation } from './getCertificateRecommendations';
export { getGenEdRecommendations } from './getGenEdRecommendations';

// Major/GenEd plans
export { getMajorPlan } from './getMajorPlan';
export { getGenEdRequirements } from './getGenEdRequirements';

// Chat
export { sendChatMessage, checkChatHealth } from './chat';
