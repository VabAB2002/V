'use client'

import { useState } from 'react';
import { formatCredits, formatPrerequisites, truncateDescription } from '@/lib/courseUtils';
import type { CourseDetails } from '@/app/actions/getCourseDetails';

interface CourseTooltipProps {
    course: CourseDetails;
    children: React.ReactNode;
}

export default function CourseTooltip({ course, children }: CourseTooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouseEnter = (e: React.MouseEvent) => {
        setIsVisible(true);
        updatePosition(e);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        updatePosition(e);
    };

    const handleMouseLeave = () => {
        setIsVisible(false);
    };

    const updatePosition = (e: React.MouseEvent) => {
        const offset = 15;
        setPosition({
            x: e.clientX + offset,
            y: e.clientY + offset,
        });
    };

    return (
        <>
            <span
                onMouseEnter={handleMouseEnter}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                {children}
            </span>

            {isVisible && (
                <div
                    className="fixed z-50 pointer-events-none"
                    style={{
                        left: `${position.x}px`,
                        top: `${position.y}px`,
                    }}
                >
                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-md">
                        {/* Course Name */}
                        <h3 className="font-semibold text-gray-900 text-sm mb-2">
                            {course.course_name}
                        </h3>

                        {/* Credits */}
                        <p className="text-xs text-gray-600 mb-2">
                            {formatCredits(course.credits)}
                        </p>

                        {/* Description (truncated) */}
                        <p className="text-xs text-gray-700 leading-relaxed mb-2">
                            {truncateDescription(course.description, 3)}
                        </p>

                        {/* Prerequisites */}
                        <div className="text-xs text-gray-600 border-t border-gray-100 pt-2">
                            <span className="font-medium">Prerequisites: </span>
                            <span>{formatPrerequisites(course.prerequisites)}</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
