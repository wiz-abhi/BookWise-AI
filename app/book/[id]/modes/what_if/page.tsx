'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChatStore, Character } from '@/lib/store';
import { modeAPI } from '@/app/lib/api';
import { useAuth } from '@/app/components/AuthProvider';
import { Wand2, Loader2, GitBranch, Settings, ArrowLeft } from 'lucide-react';
import { ModeConfigModal } from '@/components/chat/ModeConfigModal';
import { WhatIfStreamRenderer } from '@/components/chat/WhatIfStreamRenderer';

export default function WhatIfModePage() {
    const params = useParams();
    const router = useRouter();
    const { selectedBook } = useChatStore();
    const { isAuthenticated, loading: authLoading } = useAuth();
    const [characters, setCharacters] = useState<Character[]>([]);
    const [selectedChar, setSelectedChar] = useState<Character | null>(null);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [scenario, setScenario] = useState('');
    const [result, setResult] = useState<{ answer: string; citations: any[] } | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingChars, setLoadingChars] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const bookId = params.id as string;

    useEffect(() => { if (!authLoading && !isAuthenticated) router.push('/login'); }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        const h = (e: MouseEvent) => { if (containerRef.current) { const r = containerRef.current.getBoundingClientRect(); containerRef.current.style.setProperty('--mouse-x', `${e.clientX - r.left}px`); containerRef.current.style.setProperty('--mouse-y', `${e.clientY - r.top}px`); } };
        window.addEventListener('mousemove', h); return () => window.removeEventListener('mousemove', h);
    }, []);

    useEffect(() => {
        if (!bookId) return;
        modeAPI.getCharacters(bookId).then((d) => { setCharacters(d.characters || []); if (d.characters?.length > 0) setSelectedChar(d.characters[0]); }).catch(console.error).finally(() => setLoadingChars(false));
    }, [bookId]);

    const handleSubmit = async () => {
        if (!selectedChar || !scenario.trim()) return;
        setLoading(true); 
        setResult({ answer: '', citations: [] });
        try {
            await modeAPI.whatIf(
                { bookId, characterId: selectedChar.id, scenario: scenario.trim() },
                (chunk) => {
                    setResult(prev => prev ? { ...prev, answer: prev.answer + chunk } : { answer: chunk, citations: [] });
                },
                (metadata) => {
                    if (metadata.citations) {
                        setResult(prev => prev ? { ...prev, citations: metadata.citations } : { answer: '', citations: metadata.citations });
                    }
                }
            );
        } catch { 
            setResult({ answer: 'Failed to explore this path. Try again.', citations: [] }); 
        } finally { 
            setLoading(false); 
        }
    };

    if (authLoading || loadingChars) return <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center"><Loader2 className="w-8 h-8 text-amber-500 animate-spin" /></div>;

    return (
        <div ref={containerRef} className="min-h-screen bg-[#0d0d0d] text-gray-100 pt-16 sm:pt-28 pb-32 px-4 sm:px-6 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 to-black pointer-events-none" />

            {/* Floating Back Button */}
            <button
                onClick={() => router.push(`/book/${bookId}/modes`)}
                className="fixed top-6 left-6 z-50 p-3 rounded-full glass-panel border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all hover:scale-110 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                title="Back to Modes"
            >
                <ArrowLeft className="w-5 h-5" />
            </button>

            <button
                onClick={() => setIsConfigOpen(true)}
                className="fixed top-6 right-6 z-50 p-3 rounded-full glass-panel border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all hover:scale-110 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                title="Configure Mode"
            >
                <Settings className="w-5 h-5" />
            </button>

            <ModeConfigModal
                isOpen={isConfigOpen}
                onClose={() => setIsConfigOpen(false)}
                onBack={() => router.push(`/book/${bookId}/modes`)}
                title="What If Explorer"
                description={`Alternate paths — ${selectedBook?.title || 'your book'}`}
            >
                <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-300 px-1">Which character's path?</p>
                    <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                        {characters.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => { setSelectedChar(c); setIsConfigOpen(false); }}
                                className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 ${
                                    selectedChar?.id === c.id 
                                        ? 'bg-gradient-to-r from-amber-500/20 to-orange-600/20 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]' 
                                        : 'bg-white/5 border border-white/5 hover:bg-white/10'
                                }`}
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 mt-0.5 shadow-inner">
                                    {c.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-medium text-white truncate">{c.name}</p>
                                    <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">{c.description}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </ModeConfigModal>

            <div className="max-w-4xl mx-auto space-y-8 relative z-10 pt-10">
                {!result && (
                    <div className="space-y-6 animate-fade-in flex flex-col items-center max-w-2xl mx-auto">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-4">
                            <Wand2 className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white text-center">What If?</h2>
                        <p className="text-sm text-gray-400 text-center max-w-md">Explore how the story would change if a different choice was made.</p>

                        {/* Scenario Input */}
                        <div className="glass-panel rounded-2xl p-6 border-white/10 space-y-3 w-full">
                            <label className="text-sm font-semibold text-white flex items-center gap-2"><GitBranch className="w-4 h-4 text-amber-400" />What if {selectedChar?.name || 'they'} had...</label>
                            <textarea value={scenario} onChange={(e) => setScenario(e.target.value)} placeholder={`e.g. "told the truth instead of lying?"`} rows={4} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50 resize-none transition-all" />
                        </div>

                        <button onClick={handleSubmit} disabled={!selectedChar || !scenario.trim() || loading} className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:from-gray-700 disabled:to-gray-800 disabled:opacity-50 text-white font-semibold transition-all flex items-center justify-center gap-2 shadow-lg">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                            {loading ? 'Exploring the alternate path...' : 'Explore This What-If'}
                        </button>
                    </div>
                )}

                {result && (
                    <div className="space-y-6 animate-fade-in w-full max-w-none">
                        <WhatIfStreamRenderer content={result.answer} />
                        {result.citations?.length > 0 && (
                            <div className="glass-panel rounded-xl p-4 border-white/10">
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">Textual Evidence</p>
                                <div className="flex flex-wrap gap-2">{result.citations.map((c: any, i: number) => (<span key={i} className="px-2.5 py-1 text-xs rounded-lg bg-white/5 border border-white/10 text-gray-400">{c.bookTitle} · p.{c.page || '?'}</span>))}</div>
                            </div>
                        )}
                        <button onClick={() => { setResult(null); setScenario(''); }} className="text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-2 mt-8 mx-auto"><ArrowLeft className="w-3 h-3" /> Explore another what-if</button>
                    </div>
                )}
            </div>
        </div>
    );
}
