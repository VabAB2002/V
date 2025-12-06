
'use client'

import { JSX, useEffect, useState, useMemo } from 'react';
import { getMajorPlan, type MajorPlan } from '@/app/actions/getMajorPlan';
import { CourseDetailsProvider } from '@/lib/context/CourseDetailsContext';
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

        // Handle FIXED type - single required course
        if (req.type === 'FIXED') {
            return (
                <div key={key} className="mb-3">
                    {req.label && <p className="text-sm text-gray-600 mb-1">{req.label}</p>}
                    <CourseBadge courseCode={req.course} isCompleted={isCompleted(req.course)} />
                    {req.min_grade && (
                        <span className="ml-2 text-xs text-gray-500">
                            (Min Grade: {req.min_grade})
                        </span>
                    )}
                </div>
            );
        }

        // Handle FIXED_LIST type - list of required courses
        if (req.type === 'FIXED_LIST') {
            return (
                <div key={key} className="mb-6">
                    {req.label && <h4 className="text-lg font-medium text-gray-900 mb-4">{req.label}</h4>}
                    <div className={getGridClass(req.courses?.length || 0)}>
                        {req.courses?.map((course: string, i: number) => (
                            <CourseBadge key={`${course}-${i}`} courseCode={course} isCompleted={isCompleted(course)} />
                        ))}
                    </div>
                    {req.min_grade && (
                        <p className="text-xs text-gray-500 mt-2">
                            Minimum Grade Required: {req.min_grade}
                        </p>
                    )}
                </div>
            );
        }

        // Handle OR with children (nested requirements) 
        if (req.type === 'OR' && req.children && !req.options) {
            return (
                <div key={key} className="mb-6">
                    {req.label && <h4 className="text-lg font-medium text-gray-900 mb-4">{req.label}</h4>}
                    {req.description && <p className="text-xs text-gray-600 mb-2">{req.description}</p>}
                    <div className="space-y-3">
                        {req.children.map((child: any, i: number) => (
                            <div key={i}>
                                {i > 0 && <div className="text-center text-gray-400 text-sm my-2">OR</div>}
                                {child.type === 'AND' && child.courses ? (
                                    // Handle AND with courses array
                                    <div className="flex items-center gap-2">
                                        {child.courses.map((course: string, j: number) => (
                                            <div key={j} className="flex items-center gap-2">
                                                <CourseBadge courseCode={course} isCompleted={isCompleted(course)} />
                                                {j < child.courses.length - 1 && <span className="text-gray-400 text-sm">and</span>}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    renderRequirement(child, i)
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // Handle OR type - choose one from options
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
                    {req.min_grade && (
                        <p className="text-xs text-gray-500 mt-2">
                            Minimum Grade: {req.min_grade}
                        </p>
                    )}
                </div>
            );
        }

        // Handle PICK_FROM_LIST type - pick N courses from a list
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

        // Handle PICK_FROM_DEPT type - pick N credits from department
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

        // Handle PICK_FROM_CATEGORY type - pick N credits from Gen Ed categories
        if (req.type === 'PICK_FROM_CATEGORY') {
            return (
                <div key={key} className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    {req.label && (
                        <h4 className="text-lg font-medium text-blue-900 mb-2">
                            {req.label}
                        </h4>
                    )}
                    
                    {req.description && (
                        <p className="text-sm text-gray-700 mb-3">
                            {req.description}
                        </p>
                    )}
                    
                    <div className="text-sm text-gray-800 mb-2">
                        <strong>Required:</strong> {req.credits_needed} credits
                    </div>
                    
                    <div className="mt-2 flex flex-wrap gap-2">
                        {req.categories?.map((category: string, i: number) => (
                            <span 
                                key={i} 
                                className="px-3 py-1 bg-white border border-blue-300 rounded-md text-sm text-blue-800 font-medium"
                            >
                                {category}
                            </span>
                        ))}
                    </div>
                    
                    {req.exclude_major_subject && (
                        <p className="text-xs text-gray-600 mt-3 italic">
                            ⓘ Cannot use courses from your major department
                        </p>
                    )}
                    
                    {req.min_grade && (
                        <p className="text-xs text-gray-600 mt-2">
                            Minimum Grade: {req.min_grade}
                        </p>
                    )}
                </div>
            );
        }

        // Handle PROFICIENCY type - language or skill proficiency
        if (req.type === 'PROFICIENCY') {
            return (
                <div key={key} className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    {req.label && (
                        <h4 className="text-lg font-medium text-purple-900 mb-2">
                            {req.label}
                        </h4>
                    )}
                    
                    <div className="text-sm text-gray-800 mb-2">
                        <strong>Skill Required:</strong>{' '}
                        {req.skill
                            ? req.skill.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
                            : 'Not specified'}
                    </div>
                    
                    {req.level && (
                        <div className="text-sm text-gray-700 mb-2">
                            <strong>Proficiency Level:</strong> {req.level}
                        </div>
                    )}
                    
                    {req.description && (
                        <p className="text-sm text-gray-600 mt-2 italic">
                            {req.description}
                        </p>
                    )}
                    
                    {req.credits_count_towards_degree === 0 && (
                        <div className="mt-3 p-2 bg-purple-100 rounded text-xs text-purple-800">
                            ⓘ Note: Credits for proficiency courses do not count toward degree
                        </div>
                    )}
                </div>
            );
        }

        // Handle BALANCE_TO_DEGREE type - electives to fill remaining credits
        if (req.type === 'BALANCE_TO_DEGREE') {
            return (
                <div key={key} className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    {req.label && (
                        <h4 className="text-lg font-medium text-gray-900 mb-2">
                            {req.label}
                        </h4>
                    )}
                    
                    <div className="text-sm text-gray-700">
                        Additional credits to reach {req.target_credits} total credits
                    </div>
                    
                    {req.description && (
                        <p className="text-sm text-gray-600 mt-2">
                            {req.description}
                        </p>
                    )}
                </div>
            );
        }

        // Handle CUSTOM_FOCUS_AREA type - focus area selections
        if (req.type === 'CUSTOM_FOCUS_AREA') {
            return (
                <div key={key} className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                    {req.label && (
                        <h4 className="text-lg font-medium text-indigo-900 mb-2">
                            {req.label}
                        </h4>
                    )}
                    
                    {req.description && (
                        <p className="text-sm text-gray-700 mb-3">
                            {req.description}
                        </p>
                    )}
                    
                    <div className="text-sm text-gray-800 mb-2">
                        <strong>Required:</strong> {req.credits_needed} credits
                    </div>
                    
                    {req.focus_areas && (
                        <div className="mt-3">
                            <p className="text-sm font-medium text-gray-800 mb-2">Available Focus Areas:</p>
                            <div className="flex flex-wrap gap-2">
                                {req.focus_areas.map((area: string, i: number) => (
                                    <span 
                                        key={i} 
                                        className="px-3 py-1 bg-white border border-indigo-300 rounded-md text-sm text-indigo-800 font-medium"
                                    >
                                        {area}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {req.constraints && (
                        <div className="mt-3 text-xs text-gray-600">
                            {req.constraints.single_area_only && (
                                <p>• Must select courses from a single focus area</p>
                            )}
                            {req.constraints.min_400_level_credits && (
                                <p>• Minimum {req.constraints.min_400_level_credits} credits at 400-level</p>
                            )}
                        </div>
                    )}
                </div>
            );
        }

        // Handle AND type - all children required
        if (req.type === 'AND' && req.children) {
            return (
                <div key={key} className="space-y-4">
                    {req.label && <h4 className="text-lg font-medium text-gray-900 mb-4">{req.label}</h4>}
                    {req.description && <p className="text-xs text-gray-600 mb-3">{req.description}</p>}
                    {req.children.map((child: any, i: number) => renderRequirement(child, i))}
                </div>
            );
        }

        // Handle ANY_COURSE type 
        if (req.type === 'ANY_COURSE') {
            return (
                <div key={key} className="mb-4">
                    {req.label && <h4 className="text-sm font-medium text-gray-900 mb-2">{req.label}</h4>}
                    
                    {req.description && (
                        <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
                            {req.description}
                        </p>
                    )}
                    
                    {!req.description && req.credits_needed !== undefined && (
                        <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
                            Select {req.credits_needed} credits of any courses
                        </p>
                    )}
                </div>
            );
        }

        // Handle CUSTOM_PLAN type 
        if (req.type === 'CUSTOM_PLAN') {
            return (
                <div key={key} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h5 className="text-md font-medium text-blue-900 mb-2">
                        Custom Plan
                    </h5>
                    <p className="text-sm text-gray-700">
                        {req.description}
                    </p>
                    {req.constraints && (
                        <div className="mt-3 text-xs text-gray-600 space-y-1">
                            <p className="font-semibold">Constraints:</p>
                            {Object.entries(req.constraints).map(([key, value]) => (
                                <p key={key}>
                                    • {key.replace(/_/g, ' ')}: {value}
                                </p>
                            ))}
                        </div>
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
        <CourseDetailsProvider courseCodes={allCourseCodes}>
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

                    {/* Bachelor of Arts Degree Requirements */}
                    {majorPlan.common_requirements?.ba_requirements && (
                        <div className="mb-6">
                            <h3 className="text-2xl font-semibold text-gray-900 mb-5 pb-3 border-b border-gray-200">
                                Bachelor of Arts Degree Requirements
                            </h3>
                            {renderRequirement(majorPlan.common_requirements.ba_requirements, 0)}
                        </div>
                    )}

                    {/* Bachelor of Science Degree Requirements */}
                    {majorPlan.common_requirements?.bs_requirements && (
                        <div className="mb-6">
                            <h3 className="text-2xl font-semibold text-gray-900 mb-5 pb-3 border-b border-gray-200">
                                Bachelor of Science Degree Requirements
                            </h3>
                            {renderRequirement(majorPlan.common_requirements.bs_requirements, 0)}
                        </div>
                    )}

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

                    {/* Electives */}
                    {majorPlan.common_requirements?.electives &&
                        renderSection(majorPlan.common_requirements.electives, 'Electives')}

                    {/* Sub-Plans/Degree Options */}
                    {majorPlan.sub_plans?.options && (
                        <div className="mb-10">
                            <h3 className="text-2xl font-semibold text-gray-900 mb-5 pb-3 border-b border-gray-200">
                                Degree Options
                            </h3>
                            {majorPlan.sub_plans.type === 'SELECT_ONE' && (
                                <p className="text-sm text-gray-600 mb-6 italic">
                                    Select one of the following options:
                                </p>
                            )}
                            <div className="space-y-8">
                                {Object.entries(majorPlan.sub_plans.options).map(([optionId, option]: [string, any]) => (
                                    <div key={optionId} className="border border-gray-300 rounded-lg p-6 bg-gray-50">
                                        <div className="mb-4">
                                            <h4 className="text-xl font-semibold text-gray-900 mb-2">
                                                {option.name}
                                            </h4>
                                            {option.credits_added && (
                                                <p className="text-sm text-gray-600">
                                                    Credits: {option.credits_added}
                                                </p>
                                            )}
                                            {option.note && (
                                                <p className="text-sm text-amber-700 mt-2 italic">
                                                    ⓘ {option.note}
                                                </p>
                                            )}
                                        </div>
                                        
                                        {/* Option Requirements */}
                                        <div className="space-y-4">
                                            {option.requirements?.prescribed_courses && (
                                                <div>
                                                    <h5 className="text-md font-medium text-gray-800 mb-3">
                                                        Prescribed Courses
                                                    </h5>
                                                    {renderRequirement(option.requirements.prescribed_courses, 0)}
                                                </div>
                                            )}
                                            
                                            {option.requirements?.additional_courses && (
                                                <div>
                                                    <h5 className="text-md font-medium text-gray-800 mb-3">
                                                        Additional Courses
                                                    </h5>
                                                    {renderRequirement(option.requirements.additional_courses, 0)}
                                                </div>
                                            )}
                                            
                                            {option.requirements?.supporting_courses && (
                                                <div>
                                                    <h5 className="text-md font-medium text-gray-800 mb-3">
                                                        Supporting Courses
                                                    </h5>
                                                    {renderRequirement(option.requirements.supporting_courses, 0)}
                                                </div>
                                            )}
                                            
                                            {option.requirements?.custom_plan && (
                                                <div>
                                                    {renderRequirement(option.requirements.custom_plan, 0)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </CourseDetailsProvider>
    );
}
