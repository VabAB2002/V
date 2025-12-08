'use client'

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { fetchMajors } from './actions';
import type { MajorOption } from '@/lib/utils';
import PageTransition from '@/components/PageTransition';
import PageToggle from '@/components/PageToggle';
import NProgress from 'nprogress';

export default function HomePage() {
  const router = useRouter();
  const [majors, setMajors] = useState<MajorOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedMajor, setSelectedMajor] = useState<MajorOption | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load majors on mount
  useEffect(() => {
    fetchMajors().then(setMajors);
  }, []);

  // Filter majors based on search query
  const filteredMajors = majors.filter(major =>
    major.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 8); // Limit to 8 results for clean UI

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredMajors.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredMajors[highlightedIndex]) {
          handleSelect(filteredMajors[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsDropdownOpen(false);
        break;
    }
  };

  // Handle major selection
  const handleSelect = (major: MajorOption) => {
    setSelectedMajor(major);
    setIsDropdownOpen(false);

    // Start progress bar
    NProgress.start();

    // Navigate
    router.push(`/transcript-upload?major=${major.id}`);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsDropdownOpen(true);
    setHighlightedIndex(0);
    setSelectedMajor(null);
  };

  // Handle click outside
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

  return (
    <PageTransition>
      <div className="min-h-screen w-full bg-white flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Page Toggle */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2">
            <PageToggle />
          </div>

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-semibold text-gray-900 mb-3 tracking-tight">
              Select Your Major
            </h1>
            <p className="text-lg text-gray-500 font-normal">
              Begin your academic planning journey
            </p>
          </div>

          {/* Search Container */}
          <div className="relative">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder="Search for your major..."
                className="w-full px-6 py-5 text-lg text-gray-900 bg-white border border-gray-200 rounded-full 
                         focus:outline-none focus:border-gray-200
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
            </div>

            {/* Dropdown */}
            {isDropdownOpen && searchQuery && filteredMajors.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute w-full mt-3 bg-white rounded-3xl 
                         overflow-hidden z-10 animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <div className="max-h-[380px] overflow-y-auto py-2">
                  {filteredMajors.map((major, index) => (
                    <button
                      key={major.id}
                      onClick={() => handleSelect(major)}
                      className="w-full px-5 py-3.5 text-left transition-all duration-150"
                      onMouseEnter={() => setHighlightedIndex(index)}
                    >
                      <div className="text-[15px] font-normal text-gray-900">
                        {major.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No results message */}
            {isDropdownOpen && searchQuery && filteredMajors.length === 0 && (
              <div
                ref={dropdownRef}
                className="absolute w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg 
                         p-6 text-center animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <p className="text-gray-500">No majors found</p>
              </div>
            )}
          </div>

          {/* Selected Major Display */}
          {selectedMajor && (
            <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 rounded-full">
                <svg
                  width="16"
                  height="16"
                  fill="currentColor"
                  className="text-green-600"
                >
                  <circle cx="8" cy="8" r="8" />
                  <path
                    d="M6 8l2 2 4-4"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-sm font-medium text-gray-900">
                  {selectedMajor.name}
                </span>
              </div>
            </div>
          )}

          {/* Helper Text */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">
              {majors.length} majors available
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}