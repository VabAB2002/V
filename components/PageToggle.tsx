'use client'

import { useRouter, usePathname } from 'next/navigation';
import NProgress from 'nprogress';

interface PageToggleProps {
    className?: string;
}

export default function PageToggle({ className = '' }: PageToggleProps) {
    const router = useRouter();
    const pathname = usePathname();

    const currentPage = pathname === '/gened' ? 'gened' : pathname === '/chat' ? 'chat' : 'major';

    const handleToggle = (page: 'major' | 'gened' | 'chat') => {
        const targetPath = page === 'gened' ? '/gened' : page === 'chat' ? '/chat' : '/';
        if (pathname !== targetPath) {
            NProgress.start();
            router.push(targetPath);
        }
    };

    return (
        <div className={`inline-flex items-center bg-gray-100 rounded-full p-1 ${className}`}>
            <button
                onClick={() => handleToggle('major')}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${currentPage === 'major'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
            >
                Major Planner
            </button>
            <button
                onClick={() => handleToggle('gened')}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${currentPage === 'gened'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
            >
                GenEd Tool
            </button>
            <button
                onClick={() => handleToggle('chat')}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${currentPage === 'chat'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
            >
                Chat
            </button>
        </div>
    );
}
