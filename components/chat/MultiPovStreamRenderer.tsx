'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface MultiPovStreamRendererProps {
    content: string;
}

interface PovTab {
    character: string;
    text: string;
}

export function MultiPovStreamRenderer({ content }: MultiPovStreamRendererProps) {
    const [tabs, setTabs] = useState<PovTab[]>([]);
    const [activeTab, setActiveTab] = useState<string | null>(null);

    useEffect(() => {
        if (!content) return;

        // Split by "### POV: "
        const parts = content.split('### POV: ');
        const newTabs: PovTab[] = [];

        parts.forEach(part => {
            if (!part.trim()) return;
            const lines = part.split('\n');
            const character = lines[0].trim();
            const text = lines.slice(1).join('\n').trim();
            
            if (character) {
                newTabs.push({ character, text });
            }
        });

        setTabs(newTabs);
        
        // Auto-select first tab if none selected
        if (newTabs.length > 0 && !activeTab) {
            setActiveTab(newTabs[0].character);
        }
    }, [content]);

    if (!content) return null;
    
    // If we haven't matched any tabs yet, just show a loading or parsing state
    if (tabs.length === 0) {
        return (
            <div className="flex justify-center items-center h-32 animate-pulse">
                <span className="text-indigo-400/50 italic text-sm">Synchronizing perspectives...</span>
            </div>
        );
    }

    const activeContent = tabs.find(t => t.character === activeTab)?.text || tabs[0]?.text;

    return (
        <div className="flex flex-col h-full space-y-4 animate-fade-in w-full max-w-3xl mx-auto">
            {/* Tab Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {tabs.map((tab) => (
                    <button
                        key={tab.character}
                        onClick={() => setActiveTab(tab.character)}
                        className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                            activeTab === tab.character 
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                            : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                        }`}
                    >
                        {tab.character}
                    </button>
                ))}
            </div>

            {/* Card Content */}
            <div className="bg-[#0d0d0d] border border-indigo-500/20 rounded-2xl p-5 sm:p-8 shadow-2xl relative">
                <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                    <span className="text-8xl font-serif text-indigo-400">"</span>
                </div>
                
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-indigo-500/10">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-blue-800 flex items-center justify-center text-white font-serif shadow-lg">
                        {activeTab?.charAt(0)}
                    </div>
                    <div>
                        <h3 className="text-lg font-serif text-indigo-100">
                            {activeTab}'s Retelling
                        </h3>
                        <p className="text-xs text-indigo-400/60 uppercase tracking-widest mt-0.5">Perspective</p>
                    </div>
                </div>
                
                <div className="prose prose-sm sm:prose-base prose-invert max-w-none prose-p:leading-relaxed prose-p:text-gray-300 font-serif">
                    <ReactMarkdown>{activeContent}</ReactMarkdown>
                </div>
            </div>
        </div>
    );
}
