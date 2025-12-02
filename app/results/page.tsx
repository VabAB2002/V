'use client'

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import type { MinorRecommendation } from '../actions/getRecommendations';
import PageTransition from '@/components/PageTransition';
import NProgress from 'nprogress';

function ResultsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [majorId, setMajorId] = useState('');
    const [majorName, setMajorName] = useState('');
    const [recommendations, setRecommendations] = useState<MinorRecommendation[]>([]);
    const [isVisible, setIsVisible] = useState(false);
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

    const toggleDetails = (minorId: string) => {
        setExpandedCards(prev => {
            const newSet = new Set(prev);
            if (newSet.has(minorId)) {
                newSet.delete(minorId);
            } else {
                newSet.add(minorId);
            }
            return newSet;
        });
    };

    useEffect(() => {
        const major = searchParams.get('major');
        const recsParam = searchParams.get('recommendations');

        if (!major || !recsParam) {
            router.push('/');
            return;
        }

        setMajorId(major);

        // Format major name
        const formatted = major
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        setMajorName(formatted);

        // Parse recommendations
        try {
            const recs = JSON.parse(recsParam);
            setRecommendations(recs);
        } catch (error) {
            console.error('Error parsing recommendations:', error);
            router.push('/');
            return;
        }

        // Trigger fade-in animation
        setTimeout(() => setIsVisible(true), 50);
    }, [searchParams, router]);

    if (!majorName) return null;

    return (
        <PageTransition>
            <div className={`min-h-screen w-full bg-white p-6 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                <div className="w-full max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="mb-12">
                        <button
                            onClick={() => router.push('/')}
                            className="mb-6 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            ← Back to home
                        </button>
                        <h1 className="text-4xl font-semibold text-gray-900 mb-3 tracking-tight">
                            Minor Recommendations
                        </h1>
                        <p className="text-lg text-gray-600">
                            Based on your progress in <span className="font-medium text-gray-900">{majorName}</span>
                        </p>
                    </div>

                    {/* Recommendations Grid */}
                    {recommendations.length === 0 ? (
                        <div className="text-center py-16">
                            <p className="text-gray-500">No recommendations available</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {recommendations.map((rec, index) => (
                                <div
                                    key={rec.minor_id}
                                    className="border border-gray-200 rounded-2xl p-6 hover:border-gray-300 transition-all duration-200"
                                >
                                    {/* Ranking Badge */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-semibold">
                                                {index + 1}
                                            </div>
                                            <h2 className="text-xl font-semibold text-gray-900">
                                                {rec.minor_name}
                                            </h2>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="space-y-3 mb-4">
                                        {/* Completion Bar */}
                                        <div>
                                            <div className="flex justify-between mb-2 text-sm">
                                                <span className="text-gray-600">Completion</span>
                                                <span className="font-medium text-gray-900">
                                                    {rec.completion_percentage.toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2">
                                                <div
                                                    className="bg-gray-900 h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${rec.completion_percentage}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Credits Info */}
                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Completed</p>
                                                <p className="text-lg font-semibold text-gray-900">
                                                    {rec.completed_credits} credits
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Gap</p>
                                                <p className="text-lg font-semibold text-gray-900">
                                                    {rec.gap_credits} credits
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* View Details Button */}
                                    <button
                                        onClick={() => {
                                            const params = new URLSearchParams({
                                                recommendation: JSON.stringify(rec)
                                            });
                                            router.push(`/minor-details/${rec.minor_id}?${params.toString()}`);
                                        }}
                                        className="w-full mt-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium rounded-lg transition-colors"
                                    >
                                        View Details →
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Info Note */}
                    {recommendations.length > 0 && (
                        <div className="mt-12 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-sm text-gray-600">
                                <strong className="text-gray-900">Note:</strong> Gap credits show the additional work needed beyond your major requirements. Recommendations are ranked by strategic score, considering completion percentage and credit requirements.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </PageTransition>
    );
}

export default function ResultsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen w-full bg-white flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center">
                <div className="h-8 w-32 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 w-48 bg-gray-200 rounded"></div>
            </div>
        </div>}>
            <ResultsContent />
        </Suspense>
    );
}

