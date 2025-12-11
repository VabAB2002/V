'use server'

import fs from 'fs';
import path from 'path';

export interface MajorPlan {
    major_id: string;
    name: string;
    degree_type: string;
    department?: string;
    credits_required: number;
    entrance_requirements?: any;
    common_requirements?: any;
    sub_plans?: any;
}

// Fetch major plan details
export async function getMajorPlan(majorId: string): Promise<MajorPlan | null> {
    try {
        const dataPath = path.join(process.cwd(), 'lib', 'data', 'penn_state_majors.json');
        const fileContents = fs.readFileSync(dataPath, 'utf8');
        const data = JSON.parse(fileContents);

        // Normalize major ID (convert to lowercase with underscores)
        const normalizedId = majorId.toLowerCase().replace(/\s+/g, '_');

        // Look up major
        const major = data[normalizedId];

        if (!major) {
            console.warn(`Major not found: ${normalizedId}`);
            return null;
        }

        return major as MajorPlan;
    } catch (error) {
        console.error('Error fetching major plan:', error);
        return null;
    }
}
