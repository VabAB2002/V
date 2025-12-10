'use client'

import { JSX, useEffect, useState, useMemo } from 'react';
import { getMajorPlan, type MajorPlan } from '@/app/actions/getMajorPlan';
import { CourseDetailsProvider } from '@/components/context/CourseDetailsContext';
import { isCourseCompleted } from '@/lib/courseEquivalencies';
import CourseBadge from '@/components/course/CourseBadge';

interface AcademicPlanDisplayProps {
    majorId: string;
    selectedCourses: string[];
}

export default function AcademicPlanDisplay({ majorId, selectedCourses }: AcademicPlanDisplayProps) {
    const [majorPlan, setMajorPlan] = useState<MajorPlan | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPlan = async () => {
            setIsLoading(true);
            const plan = await getMajorPlan(majorId);
            setMajorPlan(plan);
            setIsLoading(false);
        };

        fetchPlan();
    }, [majorId]);

    // Helper to recursively extract all course codes from the major plan
    const extractAllCourseCodes = (obj: any): string[] => {
        const codes: string[] = [];

        const traverse = (node: any) => {
            if (!node) return;

            // Handle different node types
            if (node.course) {
                codes.push(node.course);
            }
            if (node.courses && Array.isArray(node.courses)) {
                node.courses.forEach((course: any) => {
                    if (typeof course === 'string') {
                        codes.push(course);
                    } else {
                        traverse(course);
                    }
                });
            }
            if (node.options && Array.isArray(node.options)) {
                node.options.forEach((option: string) => codes.push(option));
            }
            if (node.valid_courses && Array.isArray(node.valid_courses)) {
                node.valid_courses.forEach((course: string) => codes.push(course));
            }
            if (node.children && Array.isArray(node.children)) {
                node.children.forEach(traverse);
            }

            // Traverse nested objects
            if (typeof node === 'object') {
                Object.values(node).forEach(value => {
                    if (typeof value === 'object') {
                        traverse(value);
                    }
                });
            }
        };

        traverse(obj);
        return [...new Set(codes)]; // Remove duplicates
    };

    // Extract all course codes from the major plan
    const allCourseCodes = useMemo(() => {
        if (!majorPlan) return [];
        return extractAllCourseCodes(majorPlan);
    }, [majorPlan]);

    // Helper to check if a course is completed (includes equivalency check)
    const isCompleted = (courseCode: string) => {
        return isCourseCompleted(courseCode, selectedCourses);
    };

    // Calculate progress statistics
    const progressStats = useMemo(() => {
        const totalCourses = allCourseCodes.length;
        const completedCourses = allCourseCodes.filter(code => isCompleted(code)).length;
        const percentage = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;
        const totalCredits = majorPlan?.credits_required || 0;
        const estimatedCompletedCredits = completedCourses * 3; // Assuming 3 credits per course

        return {
            totalCourses,
            completedCourses,
            percentage,
            totalCredits,
            estimatedCompletedCredits: Math.min(estimatedCompletedCredits, totalCredits),
            remainingCourses: totalCourses - completedCourses
        };
    }, [allCourseCodes, selectedCourses, majorPlan]);

    // Pro approach: Use flex-wrap for natural badge flow
    const getBadgeContainerClass = (): string => {
        return 'flex flex-wrap gap-2';
    };

    // Helper to flatten AND children into displayable items
    const flattenAndChildren = (children: any[]): any[] => {
        const items: any[] = [];
        children.forEach((child: any) => {
            if (child.type === 'FIXED') {
                items.push(child);
            } else if (child.type === 'OR') {
                items.push(child); // OR counts as 1 item
            } else if (child.type === 'FIXED_LIST' && child.courses) {
                child.courses.forEach((course: string) => {
                    items.push({ type: 'FIXED', course });
                });
            } else if (child.type === 'AND' && child.children) {
                // Recursively flatten nested AND
                items.push(...flattenAndChildren(child.children));
            }
        });
        return items;
    };

    // Render a requirement node
    const renderRequirement = (req: any, index: number): JSX.Element | null => {
        if (!req) return null;

        const key = `req-${index}`;

        // Handle different requirement types
        if (req.type === 'FIXED') {
            return (
                <div key={key} className="mb-3">
                    {req.label && <p className="text-sm text-gray-600 mb-1">{req.label}</p>}
                    <CourseBadge courseCode={req.course} isCompleted={isCompleted(req.course)} />
                </div>
            );
        }

        if (req.type === 'FIXED_LIST') {
            return (
                <div key={key} className="mb-4">
                    {req.label && <h4 className="text-base font-medium text-gray-900 mb-3">{req.label}</h4>}
                    <div className={getBadgeContainerClass()}>
                        {req.courses?.map((course: string, i: number) => (
                            <CourseBadge key={`${course}-${i}`} courseCode={course} isCompleted={isCompleted(course)} />
                        ))}
                    </div>
                </div>
            );
        }

        if (req.type === 'OR') {
            return (
                <div key={key} className="mb-4">
                    {req.label && <h4 className="text-base font-medium text-gray-900 mb-3">{req.label}</h4>}
                    {req.description && <p className="text-sm text-gray-600 mb-2">{req.description}</p>}
                    <div className="flex flex-wrap items-center gap-2">
                        {req.options?.map((course: string, i: number) => (
                            <div key={`${course}-${i}`} className="flex items-center gap-2">
                                <CourseBadge courseCode={course} isCompleted={isCompleted(course)} />
                                {i < req.options.length - 1 && <span className="text-gray-400 text-sm">or</span>}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (req.type === 'PICK_FROM_LIST') {
            return (
                <div key={key} className="mb-4">
                    {req.label && <h4 className="text-base font-medium text-gray-900 mb-3">{req.label}</h4>}
                    {req.description && <p className="text-sm text-gray-600 mb-2">{req.description}</p>}
                    <div className={getBadgeContainerClass()}>
                        {req.valid_courses?.map((course: string, i: number) => (
                            <CourseBadge key={`${course}-${i}`} courseCode={course} isCompleted={isCompleted(course)} />
                        ))}
                    </div>
                </div>
            );
        }

        if (req.type === 'PICK_FROM_DEPT') {
            return (
                <div key={key} className="mb-4">
                    {req.label && <h4 className="text-sm font-medium text-gray-900 mb-2">{req.label}</h4>}
                    {req.description && (
                        <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
                            {req.description}
                        </p>
                    )}
                </div>
            );
        }

        if (req.type === 'AND' && req.children) {
            const flatItems = flattenAndChildren(req.children);
            return (
                <div key={key} className="mb-4">
                    {req.label && <h4 className="text-sm font-medium text-gray-900 mb-2">{req.label}</h4>}
                    {req.description && <p className="text-xs text-gray-600 mb-2">{req.description}</p>}
                    <div className={getBadgeContainerClass()}>
                        {flatItems.map((item: any, i: number) => {
                            if (item.type === 'FIXED') {
                                return <CourseBadge key={`${item.course}-${i}`} courseCode={item.course} isCompleted={isCompleted(item.course)} />;
                            } else if (item.type === 'OR') {
                                return (
                                    <div key={`or-${i}`} className="flex items-center gap-2">
                                        {item.options?.map((course: string, j: number) => (
                                            <div key={`${course}-${j}`} className="flex items-center gap-2">
                                                <CourseBadge courseCode={course} isCompleted={isCompleted(course)} />
                                                {j < item.options.length - 1 && <span className="text-gray-400 text-sm">or</span>}
                                            </div>
                                        ))}
                                    </div>
                                );
                            }
                            return null;
                        })}
                    </div>
                </div>
            );
        }


        if (req.type === 'ANY_COURSE') {
            return (
                <div key={key} className="mb-4">
                    {req.label && <h4 className="text-sm font-medium text-gray-900 mb-2">{req.label}</h4>}
                    {req.description && (
                        <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
                            {req.description}
                        </p>
                    )}
                </div>
            );
        }

        return null;
    };

    // Render a requirements section as a card
    const renderSection = (section: any, title: string) => {
        if (!section) return null;

        if (section.type === 'AND' && section.children) {
            return (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <h3 className="text-xl font-semibold text-gray-900 mb-5">
                        {title}
                    </h3>
                    <div className="space-y-6">
                        {section.children.map((child: any, i: number) => renderRequirement(child, i))}
                    </div>
                </div>
            );
        }

        return (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-5">
                    {title}
                </h3>
                {renderRequirement(section, 0)}
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-pulse space-y-3">
                        <div className="h-4 w-48 bg-gray-200 rounded mx-auto"></div>
                        <div className="h-4 w-32 bg-gray-200 rounded mx-auto"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!majorPlan) {
        return (
            <div className="h-full flex items-center justify-center">
                <p className="text-gray-500">Unable to load academic plan</p>
            </div>
        );
    }

    return (
        <CourseDetailsProvider courseCodes={allCourseCodes}>
            <div className="h-full overflow-y-auto px-10 py-10">
                {/* Circular Progress Ring */}
                <div className="flex flex-col items-center mb-10">
                    <div className="relative w-32 h-32 mb-4">
                        {/* Background circle */}
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="#e5e7eb"
                                strokeWidth="8"
                                fill="none"
                            />
                            {/* Progress circle */}
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="#111827"
                                strokeWidth="8"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray={2 * Math.PI * 56}
                                strokeDashoffset={2 * Math.PI * 56 * (1 - progressStats.percentage / 100)}
                                className="transition-all duration-700 ease-out"
                            />
                        </svg>
                        {/* Center text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-semibold text-gray-900">
                                {progressStats.percentage}%
                            </span>
                        </div>
                    </div>

                    {/* Progress summary */}
                    <div className="text-center">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            {majorPlan.name}
                        </h2>
                        <p className="text-2xl font-light text-gray-900">
                            <span className="font-medium">{progressStats.completedCourses}</span>
                            <span className="text-gray-400"> of </span>
                            <span>{progressStats.totalCourses}</span>
                            <span className="text-gray-400"> major courses</span>
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            {progressStats.remainingCourses} remaining
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                            Excludes GenEd (45 cr) & electives
                        </p>
                    </div>
                </div>

                {/* Requirements */}
                <div className="flex flex-col gap-6">
                    {/* Entrance Requirements */}
                    {majorPlan.entrance_requirements?.courses && majorPlan.entrance_requirements.courses.length > 0 && (() => {
                        const flatItems = flattenAndChildren(majorPlan.entrance_requirements.courses);
                        return (
                            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                                <h3 className="text-xl font-semibold text-gray-900 mb-5">
                                    Entrance Requirements
                                </h3>
                                <div className={getBadgeContainerClass()}>
                                    {flatItems.map((item: any, i: number) => {
                                        if (item.type === 'FIXED') {
                                            return <CourseBadge key={`${item.course}-${i}`} courseCode={item.course} isCompleted={isCompleted(item.course)} />;
                                        } else if (item.type === 'OR') {
                                            return (
                                                <div key={`or-${i}`} className="flex items-center gap-2">
                                                    {item.options?.map((course: string, j: number) => (
                                                        <div key={`${course}-${j}`} className="flex items-center gap-2">
                                                            <CourseBadge courseCode={course} isCompleted={isCompleted(course)} />
                                                            {j < item.options.length - 1 && <span className="text-gray-400 text-sm">or</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        }
                                        return null;
                                    })}
                                </div>
                            </div>
                        );
                    })()}

                    {/* Prescribed Courses */}
                    {majorPlan.common_requirements?.prescribed_courses &&
                        renderSection(majorPlan.common_requirements.prescribed_courses, 'Prescribed Courses')}

                    {/* Additional Courses */}
                    {majorPlan.common_requirements?.additional_courses &&
                        renderSection(majorPlan.common_requirements.additional_courses, 'Additional Courses')}

                    {/* Supporting Courses */}
                    {majorPlan.common_requirements?.supporting_courses &&
                        renderSection(majorPlan.common_requirements.supporting_courses, 'Supporting Courses')}

                    {/* Specialization Courses */}
                    {majorPlan.common_requirements?.specialization_courses &&
                        renderSection(majorPlan.common_requirements.specialization_courses, 'Specialization Courses')}
                </div>
            </div>
        </CourseDetailsProvider>
    );
}
