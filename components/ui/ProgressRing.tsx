'use client';

interface ProgressRingProps {
    percentage: number;
    size?: number;
    strokeWidth?: number;
}

export default function ProgressRing({
    percentage,
    size = 128,
    strokeWidth = 8
}: ProgressRingProps) {
    const radius = size / 2 - strokeWidth;
    const circumference = 2 * Math.PI * radius;
    const center = size / 2;
    const offset = circumference * (1 - percentage / 100);

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg
                className="w-full h-full transform -rotate-90"
                width={size}
                height={size}
            >
                {/* Background circle */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke="#e5e7eb"
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                {/* Progress circle */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke="#111827"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-700 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-semibold text-gray-900">
                    {Math.round(percentage)}%
                </span>
            </div>
        </div>
    );
}
