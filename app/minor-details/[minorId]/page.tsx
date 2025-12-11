'use client'

import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import type { MinorRecommendation } from '../../actions/getRecommendations';
import PageTransition from '@/components/common/PageTransition';
import NProgress from 'nprogress';

function MinorDetailsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const params = useParams();

    const [recommendation, setRecommendation] = useState<MinorRecommendation | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const recParam = searchParams.get('recommendation');

        if (!recParam) {
            router.push('/');
            return;
        }

        try {
            const rec = JSON.parse(recParam);
            setRecommendation(rec);
        } catch (error) {
            console.error('Error parsing recommendation:', error);
            router.push('/');
            return;
        }

        setTimeout(() => setIsVisible(true), 50);
    }, [searchParams, router]);

    if (!recommendation) return null;

    return (
        <PageTransition>
            <div className={`min-h-screen w-full bg-white p-6 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                <div className="w-full max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <button
                            onClick={() => router.back()}
                            className="mb-6 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            ← Back to recommendations
                        </button>
                        <h1 className="text-4xl font-semibold text-gray-900 mb-3 tracking-tight">
                            {recommendation.minor_name}
                        </h1>
                        <p className="text-lg text-gray-600">
                            Minor Requirements & Progress
                        </p>
                    </div>

                    {/* Credit Summary */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
                            <p className="text-sm text-gray-600 mb-2">Total Credits Required</p>
                            <p className="text-3xl font-bold text-gray-900">{recommendation.total_credits_required}</p>
                        </div>
                        <div className="p-6 bg-green-50 rounded-2xl border border-green-200">
                            <p className="text-sm text-green-700 mb-2">Credits Completed</p>
                            <p className="text-3xl font-bold text-green-800">{recommendation.completed_credits}</p>
                        </div>
                        <div className="p-6 bg-orange-50 rounded-2xl border border-orange-200">
                            <p className="text-sm text-orange-700 mb-2">Credits Remaining</p>
                            <p className="text-3xl font-bold text-orange-800">{recommendation.gap_credits}</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-8 p-6 bg-white rounded-2xl border border-gray-200">
                        <div className="flex justify-between mb-3">
                            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                            <span className="text-sm font-semibold text-gray-900">
                                {recommendation.completion_percentage.toFixed(1)}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-4">
                            <div
                                className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-500"
                                style={{ width: `${recommendation.completion_percentage}%` }}
                            />
                        </div>
                    </div>

                    {/* Completed Courses - Grouped by Sections */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                <span className="text-xl">✓</span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-900">
                                    Completed Courses
                                </h2>
                                <p className="text-sm text-gray-600">
                                    {recommendation.completed_credits} credits completed
                                </p>
                            </div>
                        </div>

                        {recommendation.sections && recommendation.sections.length > 0 ? (
                            <div className="space-y-4">
                                {recommendation.sections
                                    .filter(section => section.completed_courses.length > 0)
                                    .map((section, index) => (
                                        <div key={index} className="border border-green-200 rounded-xl bg-green-50/50 p-4">
                                            <div className="flex justify-between items-center mb-3">
                                                <h3 className="font-semibold text-green-900">{section.section_name}</h3>
                                                <span className="text-sm text-green-700">
                                                    {section.completed_courses.length} {section.completed_courses.length === 1 ? 'course' : 'courses'} | {section.credits_completed} credits
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {section.completed_courses.map(course => (
                                                    <div key={course} className="px-3 py-2 bg-white border border-green-200 text-green-900 rounded-lg text-sm">
                                                        {course}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <div className="p-6 bg-gray-50 rounded-lg text-center text-gray-500">
                                No completed courses found for this minor
                            </div>
                        )}
                    </div>

                    {/* Needed Courses - Grouped by Sections */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                                <span className="text-xl">📝</span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-900">
                                    Courses Needed
                                </h2>
                                <p className="text-sm text-gray-600">
                                    {recommendation.gap_credits} credits remaining
                                </p>
                            </div>
                        </div>

                        {recommendation.gap_credits > 0 ? (
                            recommendation.sections && recommendation.sections.length > 0 ? (
                                <div className="space-y-4">
                                    {recommendation.sections
                                        .filter(section => section.needed_courses.length > 0)
                                        .map((section, index) => {
                                            const creditsRemaining = section.credits_needed - section.credits_completed;
                                            return (
                                                <div key={index} className="border border-orange-200 rounded-xl bg-orange-50/50 p-4">
                                                    <div className="mb-3">
                                                        <h3 className="font-semibold text-orange-900 mb-1">{section.section_name}</h3>
                                                        <p className="text-sm text-orange-700">
                                                            📌 Choose {creditsRemaining} {creditsRemaining === 1 ? 'credit' : 'credits'} from the following options:
                                                        </p>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        {section.needed_courses.map((course, idx) => (
                                                            <div key={idx} className="px-3 py-2 bg-white border border-orange-200 text-orange-900 rounded-lg text-sm">
                                                                {course}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            ) : (
                                <div className="p-6 bg-orange-50 border border-orange-200 rounded-xl text-center text-orange-800">
                                    Contact your advisor for approved elective courses.
                                </div>
                            )
                        ) : (
                            <div className="p-6 bg-green-50 rounded-lg text-center">
                                <p className="text-green-800 font-medium">
                                    🎉 All required courses completed!
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Info Note */}
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <p className="text-sm text-blue-900">
                            <strong>Note:</strong> The courses listed show what applies toward this specific minor based on your completed coursework and planned major requirements.
                        </p>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
}

export default function MinorDetailsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen w-full bg-white flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center">
                <div className="h-8 w-32 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 w-48 bg-gray-200 rounded"></div>
            </div>
        </div>}>
            <MinorDetailsContent />
        </Suspense>
    );
}
