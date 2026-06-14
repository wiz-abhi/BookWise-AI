'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChatStore, Character } from '@/lib/store';
import { modeAPI } from '@/app/lib/api';
import { useAuth } from '@/app/components/AuthProvider';
import { Brain, Loader2, Search, Settings, ArrowLeft } from 'lucide-react';
import { ModeConfigModal } from '@/components/chat/ModeConfigModal';
import ReactMarkdown from 'react-markdown';

export default function MotiveDecoderModePage() {
    const params = useParams();
    const router = useRouter();
    const { selectedBook } = useChatStore();
    const { isAuthenticated, loading: authLoading } = useAuth();
    const [characters, setCharacters] = useState<Character[]>([]);
    const [selectedChar, setSelectedChar] = useState<Character | null>(null);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [actionQuery, setActionQuery] = useState('');
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
        if (!selectedChar || !actionQuery.trim()) return;
        setLoading(true); setResult(null);
        try {
            const r = await modeAPI.motiveDecoder({ bookId, characterId: selectedChar.id, action: actionQuery.trim() });
            setResult({ answer: r.answer, citations: r.citations });
        } catch { setResult({ answer: 'Failed to analyze. Please try again.', citations: [] }); } finally { setLoading(false); }
    };

    if (authLoading || loadingChars) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 text-rose-500 animate-spin" /></div>;

    return (
        <div ref={containerRef} className="min-h-screen bg-black text-gray-100 pt-28 pb-20 px-4 sm:px-6 relative">
            <div className="interactive-bg" />

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
                title="Motive Decoder"
                description={`Why they did it — ${selectedBook?.title || 'your book'}`}
            >
                <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-300 px-1">Select Character to Analyze</p>
                    <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                        {characters.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => { setSelectedChar(c); setIsConfigOpen(false); }}
                                className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 ${
                                    selectedChar?.id === c.id 
                                        ? 'bg-gradient-to-r from-rose-500/20 to-red-600/20 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)]' 
                                        : 'bg-white/5 border border-white/5 hover:bg-white/10'
                                }`}
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 mt-0.5 shadow-inner">
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
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center shadow-lg shadow-rose-500/20 mb-4">
                            <Brain className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white text-center">Decoding {selectedChar?.name || 'Motives'}</h2>
                        <p className="text-sm text-gray-400 text-center max-w-md">What puzzling action or decision do you want to analyze?</p>
                        <div className="glass-panel rounded-2xl p-6 border-white/10 space-y-3 w-full">
                            <label className="text-sm font-semibold text-white flex items-center gap-2"><Brain className="w-4 h-4 text-rose-400" />Describe the action</label>
                            <textarea value={actionQuery} onChange={(e) => setActionQuery(e.target.value)} placeholder={`e.g. "Why did ${selectedChar?.name || 'they'} choose to lie?"`} rows={4} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-rose-500/50 resize-none transition-all" />
                        </div>
                        <button onClick={handleSubmit} disabled={!selectedChar || !actionQuery.trim() || loading} className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 disabled:from-gray-700 disabled:to-gray-800 disabled:opacity-50 text-white font-semibold transition-all flex items-center justify-center gap-2 shadow-lg">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                            {loading ? 'Analyzing...' : 'Decode Their Motive'}
                        </button>
                    </div>
                )}

                {result && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="glass-panel rounded-2xl p-6 border-white/10">
                            <div className="prose prose-sm prose-invert max-w-none prose-headings:text-rose-300 prose-p:leading-relaxed prose-strong:text-rose-200"><ReactMarkdown>{result.answer}</ReactMarkdown></div>
                        </div>
                        {result.citations?.length > 0 && (
                            <div className="glass-panel rounded-xl p-4 border-white/10">
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">Evidence Sources</p>
                                <div className="flex flex-wrap gap-2">{result.citations.map((c: any, i: number) => (<span key={i} className="px-2.5 py-1 text-xs rounded-lg bg-white/5 border border-white/10 text-gray-400">{c.bookTitle} · p.{c.page || '?'}</span>))}</div>
                            </div>
                        )}
                        <button onClick={() => { setResult(null); setActionQuery(''); }} className="text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-2"><ArrowLeft className="w-3 h-3" /> Decode another</button>
                    </div>
                )}
            </div>
        </div>
    );
}
