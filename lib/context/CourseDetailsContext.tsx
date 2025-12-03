'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getBatchCourseDetails } from '@/app/actions/getBatchCourseDetails';
import type { CourseDetails } from '@/app/actions/getCourseDetails';

interface CourseDetailsContextType {
    getCourseDetails: (courseCode: string) => CourseDetails | null;
    isLoading: boolean;
}

const CourseDetailsContext = createContext<CourseDetailsContextType | undefined>(undefined);

interface CourseDetailsProviderProps {
    courseCodes: string[];
    children: ReactNode;
}

/**
 * Provider that batch-fetches course details for all specified course codes
 * and provides them to child components via context
 */
export function CourseDetailsProvider({ courseCodes, children }: CourseDetailsProviderProps) {
    const [courseDetailsMap, setCourseDetailsMap] = useState<Record<string, CourseDetails>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAllDetails = async () => {
            if (courseCodes.length === 0) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            const details = await getBatchCourseDetails(courseCodes);
            setCourseDetailsMap(details);
            setIsLoading(false);
        };

        fetchAllDetails();
    }, [courseCodes]);

    const getCourseDetails = (courseCode: string): CourseDetails | null => {
        const normalizedCode = courseCode.trim().toUpperCase();
        return courseDetailsMap[normalizedCode] || null;
    };

    return (
        <CourseDetailsContext.Provider value={{ getCourseDetails, isLoading }}>
            {children}
        </CourseDetailsContext.Provider>
    );
}

/**
 * Hook to access course details from the context
 */
export function useCourseDetails() {
    const context = useContext(CourseDetailsContext);
    if (context === undefined) {
        throw new Error('useCourseDetails must be used within a CourseDetailsProvider');
    }
    return context;
}
