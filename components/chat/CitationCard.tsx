'use client';

import { Citation } from '@/lib/store';
import { BookOpen, Quote, FileText } from 'lucide-react';

interface CitationCardProps {
    citation: Citation;
    index: number;
}

export function CitationCard({ citation, index }: CitationCardProps) {
    return (
        <div className="group glass-panel rounded-xl p-4 border-white/5 hover:border-indigo-500/30 hover:bg-white/5 transition-all duration-300 cursor-pointer">
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-mono text-xs border border-indigo-500/20 group-hover:bg-indigo-500/20 group-hover:scale-110 transition-all">
                    {index + 1}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-3.5 h-3.5 text-gray-500 group-hover:text-indigo-400 transition-colors" />
                        <h4 className="font-medium text-sm text-gray-200 truncate group-hover:text-white transition-colors">
                            {citation.bookTitle}
                        </h4>
                    </div>

                    {citation.page && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3 font-mono">
                            <span className="bg-white/5 px-1.5 py-0.5 rounded border border-white/5">Pg {citation.page}</span>
                            {citation.chapter && <span className="truncate opacity-70 border-l border-white/10 pl-2">{citation.chapter}</span>}
                        </div>
                    )}

                    <div className="relative pl-3 border-l-2 border-white/10 group-hover:border-indigo-500/50 transition-colors">
                        <Quote className="absolute -left-1 -top-1 w-3 h-3 text-white/5 hidden" />
                        <p className="text-sm text-gray-400 italic line-clamp-3 group-hover:text-gray-300 leading-relaxed">
                            "{citation.excerpt}"
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
