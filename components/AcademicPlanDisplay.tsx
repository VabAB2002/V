'use client'

import { JSX, useEffect, useState } from 'react';
import { getMajorPlan, type MajorPlan } from '@/app/actions/getMajorPlan';
import CourseBadge from './CourseBadge';

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

    // Helper to check if a course is completed
    const isCompleted = (courseCode: string) => {
        return selectedCourses.some(
            selected => selected.toUpperCase() === courseCode.toUpperCase()
        );
    };

    // Helper to determine optimal grid columns based on item count
    const getGridColumns = (itemCount: number): number => {
        if (itemCount === 1) return 1;
        if (itemCount === 2) return 2;
        if (itemCount === 3) return 3;
        if (itemCount === 4) return 2; // 2×2
        if (itemCount === 5 || itemCount === 6) return 3; // 3×2
        return 3; // Max 3 columns for 40% width panel
    };

    // Helper to get full Tailwind grid class
    const getGridClass = (itemCount: number): string => {
        const cols = getGridColumns(itemCount);
        if (cols === 1) return 'grid grid-cols-1 gap-2';
        if (cols === 2) return 'grid grid-cols-2 gap-2';
        return 'grid grid-cols-3 gap-2'; // Max 3 columns
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
                <div key={key} className="mb-6">
                    {req.label && <h4 className="text-lg font-medium text-gray-900 mb-4">{req.label}</h4>}
                    <div className={getGridClass(req.courses?.length || 0)}>
                        {req.courses?.map((course: string, i: number) => (
                            <CourseBadge key={`${course}-${i}`} courseCode={course} isCompleted={isCompleted(course)} />
                        ))}
                    </div>
                </div>
            );
        }

        if (req.type === 'OR') {
            return (
                <div key={key} className="mb-6">
                    {req.label && <h4 className="text-lg font-medium text-gray-900 mb-4">{req.label}</h4>}
                    {req.description && <p className="text-xs text-gray-600 mb-2">{req.description}</p>}
                    <div className={getGridClass(1)}>
                        <div className="flex items-center gap-2">
                            {req.options?.map((course: string, i: number) => (
                                <div key={`${course}-${i}`} className="flex items-center gap-2">
                                    <CourseBadge courseCode={course} isCompleted={isCompleted(course)} />
                                    {i < req.options.length - 1 && <span className="text-gray-400 text-sm">or</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        if (req.type === 'PICK_FROM_LIST') {
            return (
                <div key={key} className="mb-6">
                    {req.label && <h4 className="text-lg font-medium text-gray-900 mb-4">{req.label}</h4>}
                    {req.description && <p className="text-xs text-gray-600 mb-2">{req.description}</p>}
                    <div className={getGridClass(req.valid_courses?.length || 0)}>
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
                    <div className={getGridClass(flatItems.length)}>
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

    // Render a requirements section
    const renderSection = (section: any, title: string) => {
        if (!section) return null;

        if (section.type === 'AND' && section.children) {
            return (
                <div className="mb-10">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-5 pb-3 border-b border-gray-200">
                        {title}
                    </h3>
                    <div className="space-y-6">
                        {section.children.map((child: any, i: number) => renderRequirement(child, i))}
                    </div>
                </div>
            );
        }

        return (
            <div className="mb-10">
                <h3 className="text-2xl font-semibold text-gray-900 mb-5 pb-3 border-b border-gray-200">
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
        <div className="h-full overflow-y-auto px-12 py-8">
            {/* Header */}
            <div className="mb-10">
                <h2 className="text-4xl font-semibold text-gray-900 mb-4">
                    Academic Plan
                </h2>
                <p className="text-xl text-gray-600">
                    {majorPlan.name}
                </p>
                <p className="text-lg text-gray-500 mt-3">
                    {majorPlan.credits_required} total credits required
                </p>
            </div>

            {/* Requirements */}
            <div className="space-y-6">
                {/* Entrance Requirements */}
                {majorPlan.entrance_requirements?.courses && majorPlan.entrance_requirements.courses.length > 0 && (() => {
                    const flatItems = flattenAndChildren(majorPlan.entrance_requirements.courses);
                    return (
                        <div className="mb-6">
                            <h3 className="text-base font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                                Entrance Requirements
                            </h3>
                            <div className={getGridClass(flatItems.length)}>
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
    );
}
