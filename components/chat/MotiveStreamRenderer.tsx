'use client';

import { useState, useEffect } from 'react';
import { Brain, BookmarkPlus, ShieldAlert, ShieldCheck, Shield } from 'lucide-react';

interface MotiveStreamRendererProps {
    content: string;
    characterName: string;
}

interface Evidence {
    claim: string;
    quote: string;
    strength: string;
}

export function MotiveStreamRenderer({ content, characterName }: MotiveStreamRendererProps) {
    const [coreMotive, setCoreMotive] = useState('');
    const [traits, setTraits] = useState<string[]>([]);
    const [evidences, setEvidences] = useState<Evidence[]>([]);

    useEffect(() => {
        if (!content) return;

        // Parse Psych Profile
        const psychMatch = content.match(/### PSYCH PROFILE([\s\S]*?)(?=### EVIDENCE|$)/);
        if (psychMatch) {
            const psychLines = psychMatch[1].split('\n').map(l => l.trim()).filter(l => l);
            const core = psychLines.find(l => l.startsWith('Core Motivation:'))?.replace('Core Motivation:', '').trim() || '';
            const traitsStr = psychLines.find(l => l.startsWith('Traits:'))?.replace('Traits:', '').trim() || '';
            
            if (core) setCoreMotive(core);
            if (traitsStr) setTraits(traitsStr.split(',').map(t => t.trim()).filter(t => t));
        }

        // Parse Evidence blocks
        const evidenceBlocks = content.split('### EVIDENCE').slice(1);
        const parsedEvidences = evidenceBlocks.map(block => {
            const lines = block.split('\n').map(l => l.trim()).filter(l => l);
            return {
                claim: lines.find(l => l.startsWith('Claim:'))?.replace('Claim:', '').trim() || '',
                quote: lines.find(l => l.startsWith('Quote:'))?.replace('Quote:', '').trim() || '',
                strength: lines.find(l => l.startsWith('Strength:'))?.replace('Strength:', '').trim() || 'Inferred'
            };
        }).filter(e => e.claim); // Only keep if it has a claim parsed

        setEvidences(parsedEvidences);

    }, [content]);

    if (!content) return null;

    if (!coreMotive && evidences.length === 0) {
        return (
            <div className="flex justify-center items-center h-32 animate-pulse">
                <span className="text-rose-400/50 italic text-sm">Extracting psychological profile...</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full space-y-6 animate-fade-in w-full max-w-2xl mx-auto">
            {/* Pinned Psych Card */}
            {(coreMotive || traits.length > 0) && (
                <div className="bg-[#111118] border border-rose-500/30 rounded-2xl p-5 shadow-2xl relative overflow-hidden sticky top-4 z-20">
                    <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none">
                        <Brain className="w-40 h-40 text-rose-500" />
                    </div>
                    
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/30 shadow-inner">
                            <Brain className="w-4 h-4 text-rose-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white tracking-wide uppercase">{characterName}</h3>
                    </div>
                    
                    {coreMotive && (
                        <p className="text-rose-100 font-serif mb-4 text-lg">"{coreMotive}"</p>
                    )}
                    
                    {traits.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {traits.map(trait => (
                                <span key={trait} className="px-2.5 py-1 rounded-md bg-rose-950/40 border border-rose-500/20 text-xs font-medium text-rose-300 uppercase tracking-wider shadow-sm">
                                    {trait}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Evidence Stack */}
            <div className="space-y-4">
                {evidences.map((evidence, idx) => (
                    <div key={idx} className="bg-[#0a0a0f] border border-white/5 rounded-xl p-5 shadow-lg relative group transition-all hover:border-rose-500/20">
                        
                        {/* Save chip */}
                        <button className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] text-gray-400 uppercase tracking-wider">
                            <BookmarkPlus className="w-3 h-3" /> Save
                        </button>

                        <div className="pr-16 mb-4">
                            <h4 className="text-white font-medium text-base mb-1 leading-snug">{evidence.claim}</h4>
                        </div>
                        
                        {evidence.quote && (
                            <blockquote className="border-l-2 border-rose-500/50 bg-rose-950/10 py-3 px-4 rounded-r-lg mb-4 italic font-serif text-gray-300 text-sm">
                                "{evidence.quote.replace(/^"|"$/g, '')}"
                            </blockquote>
                        )}
                        
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                            {evidence.strength.toLowerCase().includes('strong') ? (
                                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            ) : evidence.strength.toLowerCase().includes('moderate') ? (
                                <Shield className="w-4 h-4 text-yellow-400" />
                            ) : (
                                <ShieldAlert className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="text-xs uppercase tracking-widest font-medium text-gray-500">
                                Evidence: <span className={
                                    evidence.strength.toLowerCase().includes('strong') ? 'text-emerald-400' :
                                    evidence.strength.toLowerCase().includes('moderate') ? 'text-yellow-400' : 'text-gray-400'
                                }>{evidence.strength}</span>
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
