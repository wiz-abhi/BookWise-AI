'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChatStore, Character } from '@/lib/store';
import { modeAPI } from '@/app/lib/api';
import { useAuth } from '@/app/components/AuthProvider';
import { Eye, ArrowLeft, Loader2, Send, Check, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function MultiPOVModePage() {
    const params = useParams();
    const router = useRouter();
    const { selectedBook } = useChatStore();
    const { isAuthenticated, loading: authLoading } = useAuth();

    const [characters, setCharacters] = useState<Character[]>([]);
    const [selectedChars, setSelectedChars] = useState<string[]>([]);
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
        setResult(null);
        try {
            const response = await modeAPI.multiPOV({
                bookId,
                characterIds: selectedChars,
                sceneDescription: sceneDescription.trim(),
            });
            setResult({ answer: response.answer, citations: response.citations });
        } catch (error) {
            console.error('Multi-POV error:', error);
            setResult({ answer: 'Something went wrong generating the perspectives. Please try again.', citations: [] });
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loadingChars) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            </div>
        );
    }

    return (
        <div ref={containerRef} className="min-h-screen bg-black text-gray-100 pt-28 pb-20 px-4 sm:px-6 relative">
            <div className="interactive-bg" />

            <div className="max-w-4xl mx-auto space-y-8 relative z-10">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push(`/book/${bookId}/modes`)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <ArrowLeft className="w-4 h-4 text-gray-400" />
                    </button>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg">
                        <Eye className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Multi-POV Replay</h1>
                        <p className="text-xs text-gray-500">One scene, every perspective — {selectedBook?.title}</p>
                    </div>
                </div>

                {/* Input Panel */}
                {!result && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Scene Description */}
                        <div className="glass-panel rounded-2xl p-6 border-white/10 space-y-3">
                            <label className="text-sm font-semibold text-white flex items-center gap-2">
                                <Eye className="w-4 h-4 text-cyan-400" />
                                Describe the scene
                            </label>
                            <textarea
                                value={sceneDescription}
                                onChange={(e) => setSceneDescription(e.target.value)}
                                placeholder='e.g. "The dinner party scene where Tom confronts Gatsby about his past"'
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/30 resize-none transition-all"
                            />
                        </div>

                        {/* Character Selection */}
                        <div className="glass-panel rounded-2xl p-6 border-white/10 space-y-4">
                            <label className="text-sm font-semibold text-white">
                                Select 2-4 characters for perspectives
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {characters.map((char) => {
                                    const isSelected = selectedChars.includes(char.id);
                                    return (
                                        <button
                                            key={char.id}
                                            onClick={() => toggleCharacter(char.id)}
                                            className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                                                isSelected
                                                    ? 'bg-cyan-500/10 border-cyan-500/30 ring-1 ring-cyan-500/20'
                                                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                                            }`}
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                                isSelected ? 'bg-gradient-to-br from-cyan-500 to-teal-500 text-white' : 'bg-white/10 text-gray-400'
                                            }`}>
                                                {isSelected ? <Check className="w-4 h-4" /> : char.name.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className={`text-sm font-medium truncate ${isSelected ? 'text-cyan-300' : 'text-gray-300'}`}>{char.name}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-gray-600">{selectedChars.length}/4 characters selected (minimum 2)</p>
                        </div>

                        {/* Submit */}
                        <button
                            onClick={handleSubmit}
                            disabled={selectedChars.length < 2 || !sceneDescription.trim() || loading}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 disabled:from-gray-700 disabled:to-gray-800 disabled:opacity-50 text-white font-semibold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-cyan-500/20"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Eye className="w-5 h-5" />}
                            {loading ? 'Generating perspectives...' : 'Generate Multi-POV Replay'}
                        </button>
                    </div>
                )}

                {/* Result */}
                {result && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="glass-panel rounded-2xl p-8 border-white/10">
                            <div className="prose prose-invert max-w-none prose-headings:text-cyan-300 prose-p:leading-relaxed prose-hr:border-white/10">
                                <ReactMarkdown>{result.answer}</ReactMarkdown>
                            </div>
                        </div>

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
