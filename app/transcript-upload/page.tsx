'use client'

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { fetchCourses } from '../actions';
import type { CourseOption } from '@/lib/utils';
import { parseTranscriptPDF, extractCourseCodesFromParsed, type ParsedCourse } from '../actions/parseTranscript';
import { getMinorRecommendations } from '../actions/getRecommendations';
import PageTransition from '@/components/PageTransition';
import NProgress from 'nprogress';

export default function TranscriptUploadPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const majorId = searchParams.get('major');

    const [majorName, setMajorName] = useState('');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    // PDF parsing state
    const [isParsing, setIsParsing] = useState(false);
    const [parseError, setParseError] = useState<string | null>(null);
    const [parsedCourses, setParsedCourses] = useState<ParsedCourse[]>([]);

    // Course autocomplete state
    const [courses, setCourses] = useState<CourseOption[]>([]);
    const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!majorId) {
            router.push('/');
            return;
        }

        const formatted = majorId
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        setMajorName(formatted);

        // Fetch all courses
        fetchCourses().then(setCourses);

        // Trigger fade-in animation
        setTimeout(() => setIsVisible(true), 50);
    }, [majorId, router]);

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

    // Parse PDF and extract courses
    const parsePDF = async (file: File) => {
        setIsParsing(true);
        setParseError(null);

        try {
            // Convert file to ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();

            // Parse the PDF
            const courses = await parseTranscriptPDF(arrayBuffer);
            setParsedCourses(courses);

            // Extract course codes and populate selected courses
            const courseCodes = await extractCourseCodesFromParsed(courses);
            setSelectedCourses(courseCodes);

            console.log(`Successfully parsed ${courses.length} courses from transcript`);
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

    // Handle paste event for bulk course input
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text');

        // Parse pasted text - support comma, space, newline separated
        const potentialCourses = pastedText
            .split(/[\s,;\n]+/)
            .map(c => c.trim().toUpperCase())
            .filter(c => c.length > 0);

        // Check if it looks like multiple courses (more than 1 valid-looking course code)
        const coursePattern = /^[A-Z]{2,6}\s*\d{1,4}[A-Z]?$/; // Matches patterns like "CMPSC 131", "MATH140", etc.
        const validLookingCourses = potentialCourses.filter(c => coursePattern.test(c));

        if (validLookingCourses.length > 1) {
            // Bulk paste detected - add all valid courses
            const newCourses: string[] = [];

            validLookingCourses.forEach(potentialCode => {
                // Normalize the course code (add space if missing)
                const normalized = potentialCode.replace(/([A-Z]+)(\d+)/, '$1 $2');

                // Check if it exists in our course database
                const matchedCourse = courses.find(c =>
                    c.code.toUpperCase() === normalized ||
                    c.code.toUpperCase().replace(/\s/g, '') === potentialCode.replace(/\s/g, '')
                );

                if (matchedCourse && !selectedCourses.includes(matchedCourse.code)) {
                    newCourses.push(matchedCourse.code);
                }
            });

            if (newCourses.length > 0) {
                setSelectedCourses([...selectedCourses, ...newCourses]);
                setSearchQuery('');
                setIsDropdownOpen(false);

                // Optional: Show feedback about how many were added
                console.log(`Added ${newCourses.length} courses`);
            }
        } else {
            // Single course or just text - allow normal autocomplete
            setSearchQuery(pastedText.trim());
            setIsDropdownOpen(true);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isDropdownOpen && filteredCourses.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex((prev) =>
                prev < filteredCourses.length - 1 ? prev + 1 : prev
            );
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

    const handleContinue = async () => {
        if (!majorId) return;

        // Get recommendations using parsed courses
        const recommendations = await getMinorRecommendations(parsedCourses, majorId, 6);

        // Navigate to results page with recommendations
        const params = new URLSearchParams({
            major: majorId,
            recommendations: JSON.stringify(recommendations)
        });
        router.push(`/results?${params.toString()}`);
    };

    if (!majorName) return null;

    return (
        <PageTransition>
            <div className={`min-h-screen w-full bg-white flex items-center justify-center p-6 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                <div className="w-full max-w-2xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-semibold text-gray-900 mb-4 tracking-tight">
                            Course Input
                        </h1>
                        <p className="text-lg text-gray-600">
                            Great! You're majoring in <span className="font-medium text-gray-900">{majorName}</span>.
                        </p>
                        <p className="text-lg text-gray-600">
                            Now, let's look at what you've completed so far.
                        </p>
                    </div>

                    {/* Import from Transcript */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 text-center mb-4">
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
                                    <p className="text-base font-medium text-gray-900 mb-1">
                                        Drop your transcript PDF here
                                    </p>
                                    <p className="text-sm text-gray-500 mb-4">
                                        or click to browse
                                    </p>
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        id="file-upload"
                                    />
                                </>
                            )}
                            {!uploadedFile && (
                                <label
                                    htmlFor="file-upload"
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
                            Type to search or paste multiple courses (e.g., "CMPSC 461, ECON 102, MATH 140")
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
                                onPaste={handlePaste}
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

                    {/* Analyze Button */}
                    <button
                        onClick={handleContinue}
                        disabled={!uploadedFile && selectedCourses.length === 0}
                        className="w-full py-4 px-6 bg-gray-900 text-white rounded-full text-base font-medium
                   hover:bg-gray-800 transition-all duration-200
                   disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-900"
                    >
                        Analyze My Progress
                    </button>

                    {/* Back Link */}
                    <button
                        onClick={() => router.push('/')}
                        className="w-full mt-6 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        ← Back to major selection
                    </button>
                </div>
            </div>
        </PageTransition>
    );
}
