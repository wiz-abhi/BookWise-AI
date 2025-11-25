'use client';

import { Citation } from '@/lib/store';
import { BookOpen, Quote } from 'lucide-react';

interface CitationCardProps {
    citation: Citation;
    index: number;
}

export function CitationCard({ citation, index }: CitationCardProps) {
    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-sm">
                    {index + 1}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-4 h-4 text-gray-500" />
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                            {citation.bookTitle}
                        </h4>
                    </div>

                    {citation.page && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            Page {citation.page}
                            {citation.chapter && ` • ${citation.chapter}`}
                        </p>
                    )}

                    <div className="relative">
                        <Quote className="absolute -left-1 -top-1 w-4 h-4 text-gray-300 dark:text-gray-600" />
                        <p className="text-sm text-gray-700 dark:text-gray-300 pl-4 italic line-clamp-3">
                            {citation.excerpt}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
