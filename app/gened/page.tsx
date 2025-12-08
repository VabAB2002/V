'use client'

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { fetchCourses } from '../actions';
import type { CourseOption } from '@/lib/utils';
import { parseTranscriptPDF, extractCourseCodesFromParsed, type ParsedCourse } from '../actions/parseTranscript';
import { getGenEdRequirements, type GenEdRequirements, type GenEdCategory } from '../actions/getGenEdRequirements';
import { getBatchCourseDetails } from '../actions/getBatchCourseDetails';
import PageTransition from '@/components/PageTransition';
import PageToggle from '@/components/PageToggle';
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

    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Load GenEd requirements and courses
    useEffect(() => {
        Promise.all([
            getGenEdRequirements(),
            fetchCourses()
        ]).then(([genEd, courseList]) => {
            setGenEdRequirements(genEd);
            setCourses(courseList);
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
            {/* App Shell: Fixed viewport, independent scroll panels */}
            <div className="h-screen flex overflow-hidden bg-white">
                {/* Left Panel - Course Input (60%) */}
                <main className="w-[60%] overflow-y-auto flex items-center">
                    <div className="px-12 py-10 max-w-3xl mx-auto w-full">
                        {/* Toggle */}
                        <div className="flex justify-center mb-8">
                            <PageToggle />
                        </div>

                        {/* Header */}
                        <div className="mb-8">
                            <h1 className="text-4xl font-semibold text-gray-900 mb-4 tracking-tight">
                                GenEd Planner
                            </h1>
                            <p className="text-lg text-gray-600">
                                Track your <span className="font-medium text-gray-900">45-credit</span> general education requirements.
                            </p>
                            <p className="text-lg text-gray-600">
                                Upload your transcript or add courses manually.
                            </p>
                        </div>

                        {/* Import from Transcript */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 text-center mb-5">
                                Import from Transcript
                            </h2>

                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 relative
                                        ${isDragging
                                        ? 'border-gray-400 bg-gray-50'
                                        : uploadedFile
                                            ? 'border-gray-300 bg-white'
                                            : 'border-gray-300 bg-white hover:border-gray-400'
                                    }`}
                            >
                                {uploadedFile ? (
                                    <div className="space-y-3">
                                        <div className="w-12 h-12 mx-auto">
                                            <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                                                <path d="M9 17.5v-8A2.5 2.5 0 0 1 11.5 7h8l7 7v10.5a2.5 2.5 0 0 1-2.5 2.5h-13a2.5 2.5 0 0 1-2.5-2.5z" />
                                                <path d="M19 7v7h7" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-base font-medium text-gray-900">{uploadedFile.name}</p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                            {isParsing && (
                                                <p className="text-sm text-gray-600 mt-2">Parsing transcript...</p>
                                            )}
                                            {!isParsing && parsedCourses.length > 0 && (
                                                <p className="text-sm text-green-600 mt-2">✓ Successfully parsed {parsedCourses.length} courses</p>
                                            )}
                                            {parseError && (
                                                <p className="text-sm text-red-600 mt-2">{parseError}</p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => {
                                                setUploadedFile(null);
                                                setParsedCourses([]);
                                                setParseError(null);
                                                setSelectedCourses([]);
                                            }}
                                            className="text-sm text-gray-500 hover:text-gray-900 transition-colors underline"
                                        >
                                            Remove file
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 mx-auto mb-3">
                                            <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                                                <path d="M24 14v8m0 0v8m0-8h8m-8 0h-8" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M9 17.5v-8A2.5 2.5 0 0 1 11.5 7h8l7 7v10.5a2.5 2.5 0 0 1-2.5 2.5h-13a2.5 2.5 0 0 1-2.5-2.5z" />
                                            </svg>
                                        </div>
                                        <p className="text-lg font-medium text-gray-900 mb-2">
                                            Drop your transcript PDF here
                                        </p>
                                        <p className="text-base text-gray-500 mb-4">
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
                            <span className="text-base text-gray-400 font-medium">OR ENTER MANUALLY</span>
                            <div className="flex-1 border-t border-gray-200"></div>
                        </div>

                        {/* Manual Course Entry with Autocomplete */}
                        <div className="mb-8">
                            <label className="block text-base text-gray-600 mb-4 text-center">
                                Type to search or paste multiple courses (e.g., "ENGL 15, MATH 140, CHEM 110")
                            </label>

                            {/* Selected Courses Pills */}
                            {selectedCourses.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {selectedCourses.map(courseCode => (
                                        <div
                                            key={courseCode}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-900 rounded-full text-sm"
                                        >
                                            <span>{courseCode}</span>
                                            <button
                                                onClick={() => handleRemoveCourse(courseCode)}
                                                className="text-gray-500 hover:text-gray-900 transition-colors"
                                            >
                                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M3 3l8 8M11 3l-8 8" strokeLinecap="round" strokeLinejoin="round" />
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
                                    placeholder="Type to search or paste courses..."
                                    className="w-full px-5 py-4 text-gray-900 bg-white border border-gray-200 rounded-full 
                                            focus:outline-none focus:border-gray-200
                                            transition-all duration-200 placeholder:text-gray-400"
                                />

                                {/* Search Icon */}
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400">
                                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="10" cy="10" r="7" />
                                        <path d="M15 15l3 3" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>

                                {/* Dropdown */}
                                {isDropdownOpen && searchQuery && filteredCourses.length > 0 && (
                                    <div
                                        ref={dropdownRef}
                                        className="absolute w-full mt-3 bg-white rounded-3xl 
                                                overflow-hidden z-10 animate-in fade-in slide-in-from-top-2 duration-200"
                                    >
                                        <div className="max-h-[380px] overflow-y-auto py-2">
                                            {filteredCourses.map((course, index) => (
                                                <button
                                                    key={course.code}
                                                    onClick={() => handleSelectCourse(course)}
                                                    className="w-full px-5 py-3.5 text-left transition-all duration-150"
                                                    onMouseEnter={() => setHighlightedIndex(index)}
                                                >
                                                    <div className="text-[15px] font-normal text-gray-900">
                                                        {course.code}
                                                    </div>
                                                    <div className="text-[13px] text-gray-500 mt-0.5">
                                                        {course.name}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* No results */}
                                {isDropdownOpen && searchQuery && filteredCourses.length === 0 && (
                                    <div className="absolute w-full mt-3 bg-white rounded-3xl py-4 px-5 text-center text-sm text-gray-500">
                                        No courses found
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>

                {/* Right Panel - GenEd Progress Display (40%) */}
                <aside className="w-[40%] overflow-y-auto bg-white">
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
                                            : `You've added ${selectedCourses.length} course${selectedCourses.length > 1 ? 's' : ''}. Keep adding to see your complete progress!`
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
