'use client'

import { useEffect } from 'react';
import { formatCredits, formatPrerequisites } from '@/lib/courseUtils';
import type { CourseDetails } from '@/app/actions/getCourseDetails';

interface CourseModalProps {
    course: CourseDetails;
    isOpen: boolean;
    onClose: () => void;
}

export default function CourseModal({ course, isOpen, onClose }: CourseModalProps) {
    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                {course.course_code}
                            </h2>
                            <h3 className="text-lg text-gray-700 mt-1">
                                {course.course_name}
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-4 space-y-4">
                    {/* Credits */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Credits</h4>
                        <p className="text-sm text-gray-700">{formatCredits(course.credits)}</p>
                    </div>

                    {/* Description */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Description</h4>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                            {course.description}
                        </p>
                    </div>

                    {/* Prerequisites */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Prerequisites</h4>
                        <p className="text-sm text-gray-700">
                            {formatPrerequisites(course.prerequisites)}
                        </p>
                    </div>

                    {/* Department & Level */}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                        <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-1">Department</h4>
                            <p className="text-sm text-gray-700">{course.department}</p>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-1">Level</h4>
                            <p className="text-sm text-gray-700">{course.level}</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="w-full py-2 px-4 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
