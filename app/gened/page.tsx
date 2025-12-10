'use client'

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { fetchCourses } from '@/app/actions';
import type { CourseOption } from '@/lib/utils';
import { parseTranscriptPDF, extractCourseCodesFromParsed, type ParsedCourse } from '../actions/parseTranscript';
import { getGenEdRequirements, type GenEdRequirements, type GenEdCategory } from '../actions/getGenEdRequirements';
import { getBatchCourseDetails } from '../actions/getBatchCourseDetails';
import { getAllMajors, getGenEdRecommendations, type MajorOption, type GenEdRecommendation, type GenEdRecommendationResult } from '../actions/getGenEdRecommendations';
import PageTransition from '@/components/common/PageTransition';
import PageToggle from '@/components/common/PageToggle';
import NProgress from 'nprogress';

interface CourseWithGenEd {
    code: string;
    genEdAttributes: string[];
    culturalDiversity: string[];
}

export default function GenEdPage() {
    const router = useRouter();

    // GenEd requirements state
    const [genEdRequirements, setGenEdRequirements] = useState<GenEdRequirements | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Course state
    const [courses, setCourses] = useState<CourseOption[]>([]);
    const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
    const [courseDetails, setCourseDetails] = useState<Map<string, CourseWithGenEd>>(new Map());

    // Upload/search state
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [parseError, setParseError] = useState<string | null>(null);
    const [parsedCourses, setParsedCourses] = useState<ParsedCourse[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    // Section collapse state
    const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

    // Recommendations state
    const [majors, setMajors] = useState<MajorOption[]>([]);
    const [selectedMajor, setSelectedMajor] = useState<string | null>(null);
    const [recommendations, setRecommendations] = useState<GenEdRecommendationResult>({});
    const [isLoadingRecs, setIsLoadingRecs] = useState(false);

    // Major search state (for homepage-style search)
    const [majorSearchQuery, setMajorSearchQuery] = useState('');
    const [isMajorDropdownOpen, setIsMajorDropdownOpen] = useState(false);
    const [majorHighlightedIndex, setMajorHighlightedIndex] = useState(0);
    const majorInputRef = useRef<HTMLInputElement>(null);
    const majorDropdownRef = useRef<HTMLDivElement>(null);

    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Load GenEd requirements, courses, and majors
    useEffect(() => {
        Promise.all([
            getGenEdRequirements(),
            fetchCourses(),
            getAllMajors()
        ]).then(([genEd, courseList, majorList]) => {
            setGenEdRequirements(genEd);
            setCourses(courseList);
            setMajors(majorList);
            setIsLoading(false);
        });
    }, []);

    // Fetch course details when selected courses change
    useEffect(() => {
        if (selectedCourses.length > 0) {
            getBatchCourseDetails(selectedCourses).then(details => {
                const detailsMap = new Map<string, CourseWithGenEd>();
                Object.entries(details).forEach(([code, detail]) => {
                    if (detail) {
                        detailsMap.set(code, {
                            code,
                            genEdAttributes: detail.attributes?.gen_ed || [],
                            culturalDiversity: detail.attributes?.cultural_diversity || []
                        });
                    }
                });
                setCourseDetails(detailsMap);
            });
        }
    }, [selectedCourses]);

    // Filter courses based on search
    const filteredCourses = courses.filter(course =>
        course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 8);

    // File upload handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === 'application/pdf') {
            setUploadedFile(file);
            await parsePDF(file);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') {
            setUploadedFile(file);
            await parsePDF(file);
        }
    };

    const parsePDF = async (file: File) => {
        setIsParsing(true);
        setParseError(null);
        try {
            const arrayBuffer = await file.arrayBuffer();
            const courses = await parseTranscriptPDF(arrayBuffer);
            setParsedCourses(courses);
            const courseCodes = await extractCourseCodesFromParsed(courses);
            setSelectedCourses(courseCodes);
        } catch (error) {
            console.error('Error parsing PDF:', error);
            setParseError('Failed to parse transcript. Please try entering courses manually.');
        } finally {
            setIsParsing(false);
        }
    };

    // Course selection handlers
    const handleSelectCourse = (course: CourseOption) => {
        if (!selectedCourses.includes(course.code)) {
            setSelectedCourses([...selectedCourses, course.code]);
        }
        setSearchQuery('');
        setIsDropdownOpen(false);
        inputRef.current?.focus();
    };

    const handleRemoveCourse = (courseCode: string) => {
        setSelectedCourses(selectedCourses.filter(c => c !== courseCode));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setIsDropdownOpen(true);
        setHighlightedIndex(0);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isDropdownOpen && filteredCourses.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex((prev) => prev < filteredCourses.length - 1 ? prev + 1 : prev);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex((prev) => prev > 0 ? prev - 1 : 0);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredCourses[highlightedIndex]) {
                handleSelectCourse(filteredCourses[highlightedIndex]);
            }
        } else if (e.key === 'Escape') {
            setIsDropdownOpen(false);
        }
    };

    // Click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Toggle section collapse
    const toggleSection = (sectionLabel: string) => {
        setCollapsedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(sectionLabel)) {
                newSet.delete(sectionLabel);
            } else {
                newSet.add(sectionLabel);
            }
            return newSet;
        });
    };

    // Calculate credits earned for a category
    const getCreditsEarned = (attribute: string): { credits: number; courses: string[] } => {
        const matchingCourses: string[] = [];
        let credits = 0;

        // Special handling for 'exploration' which matches GA, GH, GN, GS, or interdomain
        const explorationAttributes = ['GA', 'GH', 'GN', 'GS', 'interdomain'];
        const attributesToMatch = attribute === 'exploration' ? explorationAttributes : [attribute];

        courseDetails.forEach((detail, code) => {
            const hasAttribute = attributesToMatch.some(attr =>
                detail.genEdAttributes.includes(attr)
            );

            if (hasAttribute) {
                matchingCourses.push(code);
                credits += 3; // Assuming 3 credits per course
            }
        });

        return { credits, courses: matchingCourses };
    };

    // Calculate section progress
    const getSectionProgress = (categories: GenEdCategory[]): { earned: number; needed: number } => {
        let earned = 0;
        let needed = 0;

        categories.forEach(cat => {
            const result = getCreditsEarned(cat.attribute);
            earned += Math.min(result.credits, cat.credits_needed);
            needed += cat.credits_needed;
        });

        return { earned, needed };
    };

    // Get missing GenEd attributes for recommendations
    const getMissingAttributes = (): string[] => {
        if (!genEdRequirements) return [];
        const missing: string[] = [];
        genEdRequirements.sections.forEach(section => {
            section.categories.forEach(cat => {
                const result = getCreditsEarned(cat.attribute);
                if (result.credits < cat.credits_needed) {
                    missing.push(cat.attribute);
                }
            });
        });
        return missing;
    };

    // Fetch recommendations when major or courses change
    useEffect(() => {
        const missingAttrs = getMissingAttributes();
        if (missingAttrs.length === 0) {
            setRecommendations({});
            return;
        }
        setIsLoadingRecs(true);
        getGenEdRecommendations(missingAttrs, selectedMajor, selectedCourses, 5)
            .then(recs => {
                setRecommendations(recs);
                setIsLoadingRecs(false);
            })
            .catch(() => setIsLoadingRecs(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedMajor, selectedCourses, courseDetails]);

    if (isLoading) {
        return (
            <PageTransition>
                <div className="min-h-screen w-full bg-white flex items-center justify-center">
                    <div className="animate-pulse space-y-4 text-center">
                        <div className="h-6 w-48 bg-gray-200 rounded mx-auto"></div>
                        <div className="h-4 w-32 bg-gray-200 rounded mx-auto"></div>
                    </div>
                </div>
            </PageTransition>
        );
    }

    return (
        <PageTransition>
            {/* App Shell: Fixed viewport, 3-panel layout */}
            <div className="h-screen flex overflow-hidden bg-white relative">
                {/* Fixed Top Navigation */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50">
                    <PageToggle />
                </div>

                {/* LEFT PANEL - Smart Recommendations (25%) */}
                <aside className="w-[25%] overflow-y-auto bg-white border-r border-gray-100">
                    <div className="px-8 py-16">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-3xl">🎯</span>
                            <h2 className="text-2xl font-semibold text-gray-900">Smart Recommendations</h2>
                        </div>
                        <p className="text-base text-gray-600 mb-6">
                            Select your major to find courses that count toward <strong>both</strong> GenEd and your major.
                        </p>

                        {/* Major Search Box - Homepage Style */}
                        <div className="relative">
                            <input
                                ref={majorInputRef}
                                type="text"
                                value={majorSearchQuery}
                                onChange={(e) => {
                                    setMajorSearchQuery(e.target.value);
                                    setIsMajorDropdownOpen(true);
                                    setMajorHighlightedIndex(0);
                                }}
                                onKeyDown={(e) => {
                                    if (!isMajorDropdownOpen) return;
                                    const filteredMajors = majors.filter(m =>
                                        m.name.toLowerCase().includes(majorSearchQuery.toLowerCase())
                                    ).slice(0, 8);
                                    switch (e.key) {
                                        case 'ArrowDown':
                                            e.preventDefault();
                                            setMajorHighlightedIndex(prev =>
                                                prev < filteredMajors.length - 1 ? prev + 1 : prev
                                            );
                                            break;
                                        case 'ArrowUp':
                                            e.preventDefault();
                                            setMajorHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
                                            break;
                                        case 'Enter':
                                            e.preventDefault();
                                            if (filteredMajors[majorHighlightedIndex]) {
                                                setSelectedMajor(filteredMajors[majorHighlightedIndex].id);
                                                setMajorSearchQuery(filteredMajors[majorHighlightedIndex].name);
                                                setIsMajorDropdownOpen(false);
                                            }
                                            break;
                                        case 'Escape':
                                            setIsMajorDropdownOpen(false);
                                            break;
                                    }
                                }}
                                onFocus={() => setIsMajorDropdownOpen(true)}
                                placeholder="Search for your major..."
                                className="w-full px-5 py-4 text-base text-gray-900 bg-white border border-gray-200 rounded-full 
                                         focus:outline-none focus:border-gray-300
                                         transition-all duration-200 placeholder:text-gray-400 shadow-sm"
                            />

                            {/* Search Icon */}
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400">
                                <svg
                                    width="20"
                                    height="20"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <circle cx="9" cy="9" r="7" />
                                    <path d="M14 14l5 5" />
                                </svg>
                            </div>

                            {/* Major Dropdown */}
                            {isMajorDropdownOpen && majorSearchQuery && (() => {
                                const filteredMajors = majors.filter(m =>
                                    m.name.toLowerCase().includes(majorSearchQuery.toLowerCase())
                                ).slice(0, 8);
                                return filteredMajors.length > 0 ? (
                                    <div
                                        ref={majorDropdownRef}
                                        className="absolute w-full mt-3 bg-white rounded-3xl shadow-lg
                                                 overflow-hidden z-10 border border-gray-100"
                                    >
                                        <div className="max-h-[300px] overflow-y-auto py-2">
                                            {filteredMajors.map((major, index) => (
                                                <button
                                                    key={major.id}
                                                    onClick={() => {
                                                        setSelectedMajor(major.id);
                                                        setMajorSearchQuery(major.name);
                                                        setIsMajorDropdownOpen(false);
                                                    }}
                                                    className={`w-full px-5 py-3 text-left transition-all duration-150 ${index === majorHighlightedIndex ? 'bg-gray-50' : ''
                                                        }`}
                                                    onMouseEnter={() => setMajorHighlightedIndex(index)}
                                                >
                                                    <div className="text-base font-normal text-gray-900">
                                                        {major.name}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="absolute w-full mt-3 bg-white rounded-3xl shadow-lg p-4 text-center border border-gray-100">
                                        <p className="text-gray-500">No majors found</p>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Selected Major Badge */}
                        {selectedMajor && (
                            <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="flex items-center gap-2">
                                    <svg width="16" height="16" fill="currentColor" className="text-green-600">
                                        <circle cx="8" cy="8" r="8" />
                                        <path d="M6 8l2 2 4-4" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-900 truncate">
                                        {majors.find(m => m.id === selectedMajor)?.name || selectedMajor}
                                    </span>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedMajor(null);
                                        setMajorSearchQuery('');
                                    }}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                                    </svg>
                                </button>
                            </div>
                        )}

                        {/* Course Recommendations */}
                        {Object.keys(recommendations).length > 0 && (
                            <div className="mt-8">
                                <div className="flex items-center gap-2 mb-5">
                                    <span className="text-xl">📚</span>
                                    <span className="text-lg font-semibold text-gray-900">Recommended Courses</span>
                                    {isLoadingRecs && <span className="text-sm text-gray-400">(updating...)</span>}
                                </div>
                                <div className="space-y-5">
                                    {Object.entries(recommendations).map(([attribute, courses]) => (
                                        <div key={attribute} className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                                            <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
                                                <span className="text-sm font-semibold text-gray-700">
                                                    {attribute === 'interdomain' ? 'Inter-Domain' : attribute}
                                                </span>
                                            </div>
                                            <div className="divide-y divide-gray-100">
                                                {courses.map((course: GenEdRecommendation) => (
                                                    <div key={course.course_code} className="px-4 py-3 hover:bg-gray-100 transition-colors bg-white">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="text-base font-medium text-gray-900">{course.course_code}</span>
                                                                    {course.is_major_course && (
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                                            ✓ Major
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-gray-500 mt-1 truncate">{course.course_name}</p>
                                                            </div>
                                                            <span className="text-sm text-gray-400 whitespace-nowrap">{course.credits} cr</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty state */}
                        {Object.keys(recommendations).length === 0 && selectedMajor && (
                            <div className="mt-8 p-5 bg-gray-50 rounded-xl border border-gray-100 text-center">
                                <p className="text-base text-gray-500">No recommendations yet. Add courses to see suggestions.</p>
                            </div>
                        )}

                        {/* Tip for left panel */}
                        {!selectedMajor && (
                            <div className="mt-8 p-5 bg-gray-50 rounded-xl border border-gray-100">
                                <p className="text-sm text-gray-600">
                                    💡 <strong>Tip:</strong> Selecting your major helps find "double-dipping" courses that count for both GenEd and your degree!
                                </p>
                            </div>
                        )}
                    </div>
                </aside>

                {/* MIDDLE PANEL - Import Transcript (40%) */}
                <main className="w-[40%] overflow-y-auto flex items-center border-r border-gray-100">
                    <div className="px-8 py-16 w-full">
                        {/* Header */}
                        <div className="mb-8 text-center">
                            <h1 className="text-3xl font-semibold text-gray-900 mb-3 tracking-tight">
                                GenEd Tool
                            </h1>
                            <p className="text-base text-gray-600">
                                Track your <span className="font-medium text-gray-900">45-credit</span> general education requirements.
                            </p>
                        </div>

                        {/* Import from Transcript */}
                        <div className="mb-8">
                            <h2 className="text-xl font-semibold text-gray-900 text-center mb-5">
                                Import from Transcript
                            </h2>

                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 relative
                                        ${isDragging
                                        ? 'border-gray-400 bg-gray-50'
                                        : uploadedFile
                                            ? 'border-gray-300 bg-white'
                                            : 'border-gray-300 bg-white hover:border-gray-400'
                                    }`}
                            >
                                {uploadedFile ? (
                                    <div className="space-y-3">
                                        <div className="w-10 h-10 mx-auto">
                                            <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                                                <path d="M9 17.5v-8A2.5 2.5 0 0 1 11.5 7h8l7 7v10.5a2.5 2.5 0 0 1-2.5 2.5h-13a2.5 2.5 0 0 1-2.5-2.5z" />
                                                <path d="M19 7v7h7" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{uploadedFile.name}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                            {isParsing && (
                                                <p className="text-xs text-gray-600 mt-2">Parsing transcript...</p>
                                            )}
                                            {!isParsing && parsedCourses.length > 0 && (
                                                <p className="text-xs text-green-600 mt-2">✓ Successfully parsed {parsedCourses.length} courses</p>
                                            )}
                                            {parseError && (
                                                <p className="text-xs text-red-600 mt-2">{parseError}</p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => {
                                                setUploadedFile(null);
                                                setParsedCourses([]);
                                                setParseError(null);
                                                setSelectedCourses([]);
                                            }}
                                            className="text-xs text-gray-500 hover:text-gray-900 transition-colors underline"
                                        >
                                            Remove file
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-10 h-10 mx-auto mb-3">
                                            <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                                                <path d="M24 14v8m0 0v8m0-8h8m-8 0h-8" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M9 17.5v-8A2.5 2.5 0 0 1 11.5 7h8l7 7v10.5a2.5 2.5 0 0 1-2.5 2.5h-13a2.5 2.5 0 0 1-2.5-2.5z" />
                                            </svg>
                                        </div>
                                        <p className="text-base font-medium text-gray-900 mb-2">
                                            Drop your transcript PDF here
                                        </p>
                                        <p className="text-sm text-gray-500 mb-3">
                                            or click to browse
                                        </p>
                                        <input
                                            type="file"
                                            accept="application/pdf"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                            id="gened-file-upload"
                                        />
                                    </>
                                )}
                                {!uploadedFile && (
                                    <label
                                        htmlFor="gened-file-upload"
                                        className="absolute inset-0 cursor-pointer"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-4 mb-8">
                            <div className="flex-1 border-t border-gray-200"></div>
                            <span className="text-sm text-gray-400 font-medium">OR ENTER MANUALLY</span>
                            <div className="flex-1 border-t border-gray-200"></div>
                        </div>

                        {/* Manual Course Entry with Autocomplete */}
                        <div className="mb-6">
                            <label className="block text-sm text-gray-600 mb-3 text-center">
                                Type to search or paste multiple courses
                            </label>

                            {/* Selected Courses Pills */}
                            {selectedCourses.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {selectedCourses.map(courseCode => (
                                        <div
                                            key={courseCode}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-900 rounded-full text-xs"
                                        >
                                            <span>{courseCode}</span>
                                            <button
                                                onClick={() => handleRemoveCourse(courseCode)}
                                                className="text-gray-500 hover:text-gray-900 transition-colors"
                                            >
                                                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M3 3l6 6M9 3l-6 6" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Autocomplete Input */}
                            <div className="relative">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyDown}
                                    onFocus={() => setIsDropdownOpen(true)}
                                    placeholder="Search courses..."
                                    className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-200 rounded-full 
                                            focus:outline-none focus:border-gray-300
                                            transition-all duration-200 placeholder:text-gray-400 text-sm"
                                />

                                {/* Search Icon */}
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="8" cy="8" r="6" />
                                        <path d="M13 13l3 3" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>

                                {/* Dropdown */}
                                {isDropdownOpen && searchQuery && filteredCourses.length > 0 && (
                                    <div
                                        ref={dropdownRef}
                                        className="absolute w-full mt-2 bg-white rounded-2xl shadow-lg
                                                overflow-hidden z-10 border border-gray-100"
                                    >
                                        <div className="max-h-[280px] overflow-y-auto py-2">
                                            {filteredCourses.map((course, index) => (
                                                <button
                                                    key={course.code}
                                                    onClick={() => handleSelectCourse(course)}
                                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-all duration-150"
                                                    onMouseEnter={() => setHighlightedIndex(index)}
                                                >
                                                    <div className="text-sm font-normal text-gray-900">
                                                        {course.code}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-0.5">
                                                        {course.name}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* No results */}
                                {isDropdownOpen && searchQuery && filteredCourses.length === 0 && (
                                    <div className="absolute w-full mt-2 bg-white rounded-2xl py-3 px-4 text-center text-sm text-gray-500 shadow-lg border border-gray-100">
                                        No courses found
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>

                {/* RIGHT PANEL - GenEd Progress Display (35%) */}
                <aside className="w-[35%] overflow-y-auto bg-white">
                    <div className="px-10 py-10">
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
                                        strokeDashoffset={
                                            2 * Math.PI * 56 * (1 - Math.min(1, (genEdRequirements?.sections.reduce((acc, section) => {
                                                const progress = getSectionProgress(section.categories);
                                                return acc + progress.earned;
                                            }, 0) || 0) / (genEdRequirements?.total_credits || 1)))
                                        }
                                        className="transition-all duration-700 ease-out"
                                    />
                                </svg>
                                {/* Center text */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-semibold text-gray-900">
                                        {Math.round(((genEdRequirements?.sections.reduce((acc, section) => {
                                            const progress = getSectionProgress(section.categories);
                                            return acc + progress.earned;
                                        }, 0) || 0) / (genEdRequirements?.total_credits || 1)) * 100)}%
                                    </span>
                                </div>
                            </div>

                            {/* Credits summary */}
                            <div className="text-center">
                                <p className="text-2xl font-light text-gray-900">
                                    <span className="font-medium">
                                        {genEdRequirements?.sections.reduce((acc, section) => {
                                            const progress = getSectionProgress(section.categories);
                                            return acc + progress.earned;
                                        }, 0) || 0}
                                    </span>
                                    <span className="text-gray-400"> of </span>
                                    <span>{genEdRequirements?.total_credits || 0}</span>
                                    <span className="text-gray-400"> credits</span>
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {(genEdRequirements?.total_credits || 0) - (genEdRequirements?.sections.reduce((acc, section) => {
                                        const progress = getSectionProgress(section.categories);
                                        return acc + progress.earned;
                                    }, 0) || 0)} credits remaining
                                </p>
                            </div>
                        </div>

                        {/* GenEd Sections */}
                        <div className="space-y-6">
                            {genEdRequirements?.sections.map(section => {
                                const isCollapsed = collapsedSections.has(section.label);
                                const progress = getSectionProgress(section.categories);
                                const isComplete = progress.earned >= progress.needed;

                                return (
                                    <div key={section.label} className="bg-white rounded-2xl p-5">
                                        {/* Section Header */}
                                        <button
                                            onClick={() => toggleSection(section.label)}
                                            className="w-full flex items-center justify-between group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`text-sm text-gray-400 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`}>
                                                    ▸
                                                </span>
                                                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-600 transition-colors">
                                                    {section.label}
                                                </h3>
                                            </div>
                                            <span className={`text-base font-medium ${isComplete ? 'text-green-600' : 'text-gray-400'}`}>
                                                {progress.earned}/{progress.needed}
                                            </span>
                                        </button>

                                        {/* Section Content */}
                                        {!isCollapsed && (
                                            <div className="mt-4 space-y-3 ml-6">
                                                {section.categories.map(category => {
                                                    const result = getCreditsEarned(category.attribute);
                                                    const earned = Math.min(result.credits, category.credits_needed);
                                                    const catComplete = earned >= category.credits_needed;

                                                    return (
                                                        <div
                                                            key={category.attribute}
                                                            className="flex items-start justify-between py-2"
                                                        >
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    {catComplete ? (
                                                                        <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                                                                            <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                            </svg>
                                                                        </span>
                                                                    ) : (
                                                                        <span className="w-5 h-5 rounded-full border-2 border-gray-300" />
                                                                    )}
                                                                    <span className={`text-base ${catComplete ? 'text-gray-500' : 'text-gray-900'}`}>
                                                                        {category.label}
                                                                    </span>
                                                                </div>
                                                                {result.courses.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1.5 mt-2 ml-7">
                                                                        {result.courses.map(code => (
                                                                            <span
                                                                                key={code}
                                                                                className="px-2 py-0.5 bg-gray-100 text-xs text-gray-600 rounded-full"
                                                                            >
                                                                                {code}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className={`text-sm tabular-nums ${catComplete ? 'text-green-600' : 'text-gray-400'}`}>
                                                                {earned}/{category.credits_needed}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Helpful Tip */}
                        <div className="mt-8 p-4 bg-white rounded-2xl border border-gray-100">
                            <div className="flex items-start gap-3">
                                <span className="text-xl">💡</span>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 mb-1">Quick Tip</p>
                                    <p className="text-sm text-gray-500">
                                        {selectedCourses.length === 0
                                            ? "Upload your transcript to automatically track your GenEd progress, or search for courses manually."
                                            : selectedMajor
                                                ? "Courses with the green badge count toward both GenEd AND your major - that's double-dipping!"
                                                : `You've added ${selectedCourses.length} course${selectedCourses.length > 1 ? 's' : ''}. Select your major for smarter recommendations!`
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </PageTransition>
    );
}
