'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Zap } from 'lucide-react';

interface WhatIfStreamRendererProps {
    content: string;
}

export function WhatIfStreamRenderer({ content }: WhatIfStreamRendererProps) {
    const [canon, setCanon] = useState('');
    const [alternate, setAlternate] = useState('');

    useEffect(() => {
        if (!content) return;

        // Parse Canon
        const canonMatch = content.match(/### CANON([\s\S]*?)(?=### ALTERNATE|$)/);
        if (canonMatch) {
            setCanon(canonMatch[1].trim());
        }

        // Parse Alternate
        const altMatch = content.match(/### ALTERNATE([\s\S]*)/);
        if (altMatch) {
            setAlternate(altMatch[1].trim());
        }
    }, [content]);

    if (!content) return null;

    if (!canon && !alternate) {
        return (
            <div className="flex justify-center items-center h-32 animate-pulse">
                <span className="text-amber-500/50 italic text-sm">Simulating alternate timelines...</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row w-full min-h-[60vh] gap-8 lg:gap-0 animate-fade-in relative max-w-6xl mx-auto">
            {/* Canon Panel (Left/Top) */}
            <div className="flex-1 bg-[#111118] border border-white/5 rounded-2xl lg:rounded-r-none lg:border-r-0 p-6 sm:p-8 shadow-inner opacity-90 transition-all hover:opacity-100 flex flex-col">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                    <div className="px-2.5 py-1 rounded-md bg-gray-800 text-[10px] font-bold text-gray-400 uppercase tracking-widest border border-gray-700">
                        Reality
                    </div>
                    <h3 className="text-xl font-serif text-gray-300">What actually happened</h3>
                </div>
                <div className="prose prose-sm sm:prose-base prose-invert max-w-none prose-p:leading-relaxed prose-p:text-gray-400 font-serif flex-1">
                    <ReactMarkdown>{canon}</ReactMarkdown>
                </div>
            </div>

            {/* The Fork Divider */}
            <div className="flex lg:flex-col items-center justify-center -my-4 lg:my-0 lg:-mx-6 z-10">
                <div className="h-[1px] w-full lg:h-full lg:w-[1px] bg-gradient-to-r lg:bg-gradient-to-b from-transparent via-amber-500/30 to-transparent flex-1" />
                <div className="mx-4 lg:mx-0 lg:my-4 flex flex-col items-center justify-center p-2 rounded-full bg-black border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                    <Zap className="w-5 h-5 text-amber-500" />
                </div>
                <div className="h-[1px] w-full lg:h-full lg:w-[1px] bg-gradient-to-r lg:bg-gradient-to-b from-transparent via-amber-500/30 to-transparent flex-1" />
            </div>

            {/* Alternate Panel (Right/Bottom) */}
            <div className="flex-1 bg-gradient-to-br from-amber-950/20 to-orange-950/20 border border-amber-500/20 rounded-2xl lg:rounded-l-none p-6 sm:p-8 shadow-2xl shadow-amber-500/5 relative overflow-hidden flex flex-col">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-screen pointer-events-none" />
                
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-amber-500/10 relative z-10">
                    <div className="px-2.5 py-1 rounded-md bg-amber-500/20 text-[10px] font-bold text-amber-400 uppercase tracking-widest border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)] animate-pulse" style={{ animationDuration: '3s' }}>
                        Alternate Path
                    </div>
                    <h3 className="text-xl font-serif text-amber-100">What could have happened</h3>
                </div>
                
                <div className="prose prose-sm sm:prose-base prose-invert max-w-none prose-p:leading-relaxed prose-p:text-amber-50/90 font-serif relative z-10 flex-1">
                    <ReactMarkdown>{alternate}</ReactMarkdown>
                </div>
            </div>
        </div>
    );
}
