'use client'

import { useState } from 'react';
import { useCourseDetails } from '@/lib/context/CourseDetailsContext';
import type { CourseDetails } from '@/app/actions/getCourseDetails';
import CourseTooltip from './CourseTooltip';
import CourseModal from './CourseModal';

interface CourseBadgeProps {
    courseCode: string;
    isCompleted: boolean;
}

export default function CourseBadge({ courseCode, isCompleted }: CourseBadgeProps) {
    const { getCourseDetails: getDetails, isLoading } = useCourseDetails();
    const courseDetails = getDetails(courseCode);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleClick = () => {
        if (courseDetails) {
            setIsModalOpen(true);
        }
    };

    const badge = (
        <button
            onClick={handleClick}
            disabled={isLoading || !courseDetails}
            className={`
        inline-block px-2.5 py-1 rounded-md text-sm font-medium transition-all
        ${isCompleted
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300'
                }
        ${courseDetails ? 'cursor-pointer hover:shadow-sm' : 'cursor-default'}
        disabled:opacity-50
      `}
        >
            {courseCode}
        </button>
    );

    return (
        <>
            {courseDetails ? (
                <CourseTooltip course={courseDetails}>
                    {badge}
                </CourseTooltip>
            ) : (
                badge
            )}

            {courseDetails && (
                <CourseModal
                    course={courseDetails}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </>
    );
}
