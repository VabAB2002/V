'use server'

import { promises as fs } from 'fs';
import path from 'path';

export interface GenEdCategory {
    label: string;
    credits_needed: number;
    attribute: string;
    description?: string;
}

export interface GenEdSection {
    label: string;
    total_credits: number;
    categories: GenEdCategory[];
}

export interface GenEdRequirements {
    total_credits: number;
    sections: GenEdSection[];
}

export async function getGenEdRequirements(): Promise<GenEdRequirements> {
    const filePath = path.join(process.cwd(), 'lib', 'data', 'gen_ed_requirements.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    const genEd = data.gen_ed_requirements;

    // Transform the data into a simpler structure for the UI
    const sections: GenEdSection[] = [
        {
            label: 'Foundations',
            total_credits: 15,
            categories: [
                {
                    label: 'Writing/Speaking (GWS)',
                    credits_needed: 9,
                    attribute: 'GWS',
                    description: 'All courses require a grade of C or better'
                },
                {
                    label: 'Quantification (GQ)',
                    credits_needed: 6,
                    attribute: 'GQ',
                    description: '3-6 credits from math/stats; 0-3 from CS or symbolic logic'
                }
            ]
        },
        {
            label: 'Knowledge Domains',
            total_credits: 15,
            categories: [
                { label: 'Health and Wellness (GHW)', credits_needed: 3, attribute: 'GHW' },
                { label: 'Natural Sciences (GN)', credits_needed: 3, attribute: 'GN' },
                { label: 'Arts (GA)', credits_needed: 3, attribute: 'GA' },
                { label: 'Humanities (GH)', credits_needed: 3, attribute: 'GH' },
                { label: 'Social and Behavioral Sciences (GS)', credits_needed: 3, attribute: 'GS' }
            ]
        },
        {
            label: 'Integrative Studies',
            total_credits: 6,
            categories: [
                {
                    label: 'Inter-Domain',
                    credits_needed: 6,
                    attribute: 'interdomain',
                    description: 'Courses integrating multiple knowledge domains'
                }
            ]
        },
        {
            label: 'Exploration',
            total_credits: 9,
            categories: [
                {
                    label: 'Natural Sciences (GN)',
                    credits_needed: 3,
                    attribute: 'GN',
                    description: 'May be Inter-Domain'
                },
                {
                    label: 'GA, GH, GN, GS, or Inter-Domain',
                    credits_needed: 6,
                    attribute: 'exploration',
                    description: 'May include 3 credits of World Language beyond degree requirements'
                }
            ]
        }
    ];

    return {
        total_credits: 45,
        sections
    };
}
