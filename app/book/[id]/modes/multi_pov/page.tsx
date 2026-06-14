'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChatStore, Character } from '@/lib/store';
import { modeAPI } from '@/app/lib/api';
import { useAuth } from '@/app/components/AuthProvider';
import { Eye, Loader2, Check, Settings, ArrowLeft } from 'lucide-react';
import { ModeConfigModal } from '@/components/chat/ModeConfigModal';
import { MultiPovStreamRenderer } from '@/components/chat/MultiPovStreamRenderer';

export default function MultiPOVModePage() {
    const params = useParams();
    const router = useRouter();
    const { selectedBook } = useChatStore();
    const { isAuthenticated, loading: authLoading } = useAuth();

    const [characters, setCharacters] = useState<Character[]>([]);
    const [selectedChars, setSelectedChars] = useState<string[]>([]);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [sceneDescription, setSceneDescription] = useState('');
    const [result, setResult] = useState<{ answer: string; citations: any[] } | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingChars, setLoadingChars] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    const bookId = params.id as string;

    useEffect(() => {
        if (!authLoading && !isAuthenticated) router.push('/login');
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (containerRef.current) {
                const { left, top } = containerRef.current.getBoundingClientRect();
                containerRef.current.style.setProperty('--mouse-x', `${e.clientX - left}px`);
                containerRef.current.style.setProperty('--mouse-y', `${e.clientY - top}px`);
            }
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    useEffect(() => {
        if (!bookId) return;
        modeAPI.getCharacters(bookId)
            .then((data) => setCharacters(data.characters || []))
            .catch(console.error)
            .finally(() => setLoadingChars(false));
    }, [bookId]);

    const toggleCharacter = (id: string) => {
        setSelectedChars(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : prev.length < 4 ? [...prev, id] : prev
        );
    };

    const handleSubmit = async () => {
        if (selectedChars.length < 2 || !sceneDescription.trim()) return;
        setLoading(true);
        setResult({ answer: '', citations: [] });
        try {
            await modeAPI.multiPOV(
                {
                    bookId,
                    characterIds: selectedChars,
                    sceneDescription: sceneDescription.trim(),
                },
                (chunk) => {
                    setResult(prev => prev ? { ...prev, answer: prev.answer + chunk } : { answer: chunk, citations: [] });
                },
                (metadata) => {
                    if (metadata.citations) {
                        setResult(prev => prev ? { ...prev, citations: metadata.citations } : { answer: '', citations: metadata.citations });
                    }
                }
            );
        } catch (error) {
            console.error('Multi-POV error:', error);
            setResult({ answer: 'Failed to analyze perspectives. Please try again.', citations: [] });
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loadingChars) {
        return (
            <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div ref={containerRef} className="min-h-screen bg-[#0d0d0d] text-gray-100 pt-16 sm:pt-28 pb-32 px-4 sm:px-6 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-black pointer-events-none" />

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
                title="Multi-POV Replay"
                description={`One scene, every perspective — ${selectedBook?.title || 'your book'}`}
            >
                <div className="space-y-4">
                    <label className="text-sm font-semibold text-gray-300">
                        Select 2-4 characters for perspectives
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {characters.map((char) => {
                            const isSelected = selectedChars.includes(char.id);
                            return (
                                <button
                                    key={char.id}
                                    onClick={() => toggleCharacter(char.id)}
                                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                                        isSelected
                                            ? 'bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border-indigo-500/40 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                                    }`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-inner ${
                                        isSelected ? 'bg-gradient-to-br from-indigo-500 to-blue-500 text-white' : 'bg-white/10 text-gray-400'
                                    }`}>
                                        {isSelected ? <Check className="w-4 h-4" /> : char.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-gray-300'}`}>{char.name}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-xs text-gray-500 text-center">{selectedChars.length}/4 characters selected (minimum 2)</p>
                </div>
            </ModeConfigModal>

            <div className="max-w-4xl mx-auto space-y-8 relative z-10 pt-10">

                {/* Input Panel */}
                {!result && (
                    <div className="space-y-6 animate-fade-in flex flex-col items-center max-w-2xl mx-auto">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4 relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-screen" />
                            <Eye className="w-10 h-10 text-white relative z-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-white text-center">Multi-POV Replay</h2>
                        <p className="text-sm text-gray-400 text-center max-w-md">Experience the same scene from the perspectives of your selected characters.</p>

                        {/* Scene Description */}
                        <div className="glass-panel rounded-2xl p-6 border-white/10 space-y-3 w-full">
                            <label className="text-sm font-semibold text-white flex items-center gap-2">
                                <Eye className="w-4 h-4 text-indigo-400" />
                                Describe the scene
                            </label>
                            <textarea
                                value={sceneDescription}
                                onChange={(e) => setSceneDescription(e.target.value)}
                                placeholder='e.g. "The dinner party scene where Tom confronts Gatsby"'
                                rows={4}
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/30 resize-none transition-all"
                            />
                        </div>



                        {/* Submit */}
                        <button
                            onClick={handleSubmit}
                            disabled={selectedChars.length < 2 || !sceneDescription.trim() || loading}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:from-gray-700 disabled:to-gray-800 disabled:opacity-50 text-white font-semibold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-500/20"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Eye className="w-5 h-5" />}
                            {loading ? 'Generating perspectives...' : 'Generate Multi-POV Replay'}
                        </button>
                    </div>
                )}

                {/* Result */}
                {result && (
                    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
                        <MultiPovStreamRenderer content={result.answer} />

                        {result.citations?.length > 0 && (
                            <div className="glass-panel rounded-xl p-4 border-white/10">
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">Sources</p>
                                <div className="flex flex-wrap gap-2">
                                    {result.citations.map((c: any, i: number) => (
                                        <span key={i} className="px-2.5 py-1 text-xs rounded-lg bg-white/5 border border-white/10 text-gray-400">
                                            {c.bookTitle} · p.{c.page || '?'}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => { setResult(null); setSelectedChars([]); setSceneDescription(''); }}
                            className="text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-2"
                        >
                            <ArrowLeft className="w-3 h-3" /> Try another scene
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
