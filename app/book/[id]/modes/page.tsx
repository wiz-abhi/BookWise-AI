'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChatStore, Character, ExperienceMode } from '@/lib/store';
import { modeAPI, progressAPI } from '@/app/lib/api';
import { useAuth } from '@/app/components/AuthProvider';
import { Coffee, Theater, Eye, Brain, Wand2, BookOpen, Loader2, Users, ArrowLeft, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const MODE_CONFIG: Array<{
    id: ExperienceMode;
    icon: any;
    title: string;
    tagline: string;
    description: string;
    color: string;
    gradient: string;
    cardClass: string;
    needsCharacter: boolean;
}> = [
    {
        id: 'companion',
        icon: Coffee,
        title: 'Companion',
        tagline: 'Your reading buddy',
        description: 'A friend who\'s reading alongside you — gossip about characters, speculate about what happens next, and get help understanding confusing parts. Never spoils beyond your current page.',
        color: 'text-amber-400',
        gradient: 'from-amber-500 to-orange-500',
        cardClass: 'mode-card-companion',
        needsCharacter: false,
    },
    {
        id: 'character_voice',
        icon: Theater,
        title: 'Character Voice',
        tagline: 'Become the character',
        description: 'Talk directly to any character from the book. They respond in-character, using their own voice, personality, and worldview — all grounded in the actual text.',
        color: 'text-purple-400',
        gradient: 'from-purple-500 to-violet-600',
        cardClass: 'mode-card-character',
        needsCharacter: true,
    },
    {
        id: 'multi_pov',
        icon: Eye,
        title: 'Multi-POV Replay',
        tagline: 'Every perspective',
        description: 'Pick any scene and see it retold from multiple characters\' eyes. Same event, completely different internal worlds.',
        color: 'text-cyan-400',
        gradient: 'from-cyan-500 to-teal-500',
        cardClass: 'mode-card-pov',
        needsCharacter: true,
    },
    {
        id: 'motive_decoder',
        icon: Brain,
        title: 'Motive Decoder',
        tagline: 'Why they did it',
        description: 'Deep character psychology analysis. Every claim backed by textual evidence — no generic assessments, just the evidence trail from the book.',
        color: 'text-rose-400',
        gradient: 'from-rose-500 to-red-500',
        cardClass: 'mode-card-motive',
        needsCharacter: true,
    },
    {
        id: 'what_if',
        icon: Wand2,
        title: 'What If Explorer',
        tagline: 'Alternate paths',
        description: 'Explore what would happen if a character chose differently at a pivotal moment. Stays faithful to their psychology and the book\'s world.',
        color: 'text-indigo-400',
        gradient: 'from-indigo-500 to-blue-600',
        cardClass: 'mode-card-whatif',
        needsCharacter: true,
    },
];

export default function ModeHubPage() {
    const params = useParams();
    const router = useRouter();
    const { selectedBook, setSelectedBook, setActiveMode, readingProgress, setReadingProgress } = useChatStore();
    const { isAuthenticated, loading: authLoading } = useAuth();

    const [characters, setCharacters] = useState<Character[]>([]);
    const [loadingChars, setLoadingChars] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    const bookId = params.id as string;

    // Mouse spotlight
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

    // Auth redirect
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    // Load characters and progress
    useEffect(() => {
        if (!bookId) return;

        const loadData = async () => {
            setLoadingChars(true);
            try {
                const [charData, progressData] = await Promise.all([
                    modeAPI.getCharacters(bookId),
                    progressAPI.get(bookId).catch(() => ({ progress: null })),
                ]);
                setCharacters(charData.characters || []);
                if (progressData.progress) {
                    setReadingProgress({
                        currentPage: progressData.progress.currentPage,
                        totalPages: progressData.progress.totalPages,
                    });
                }
            } catch (error) {
                console.error('Failed to load mode hub data:', error);
            } finally {
                setLoadingChars(false);
            }
        };
        loadData();
    }, [bookId, setReadingProgress]);

    if (authLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    const handleSelectMode = (mode: ExperienceMode) => {
        setActiveMode(mode);
        router.push(`/book/${bookId}/modes/${mode}`);
    };

    return (
        <div ref={containerRef} className="min-h-screen bg-black text-gray-100 pt-28 pb-20 px-4 sm:px-6 relative">
            <div className="interactive-bg" />

            <div className="max-w-6xl mx-auto space-y-10 relative z-10">
                {/* Header */}
                <div className="space-y-4">
                    <button
                        onClick={() => router.push('/library')}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Library
                    </button>

                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-white tracking-tight">
                                {selectedBook?.title || 'Choose Your Experience'}
                            </h1>
                            {selectedBook?.author && (
                                <p className="text-gray-500 mt-1">by {selectedBook.author}</p>
                            )}
                        </div>

                        <div className="flex items-center gap-4">
                            {readingProgress && (
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Reading Progress</p>
                                    <p className="text-lg font-mono text-white">
                                        Page {readingProgress.currentPage}
                                        {readingProgress.totalPages && <span className="text-gray-500"> / {readingProgress.totalPages}</span>}
                                    </p>
                                </div>
                            )}
                            <button
                                onClick={() => router.push(`/library/book/${bookId}`)}
                                className="px-4 py-2 glass-panel rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
                            >
                                <BookOpen className="w-4 h-4" />
                                Read Book
                            </button>
                        </div>
                    </div>

                    {/* Characters preview */}
                    {!loadingChars && characters.length > 0 && (
                        <div className="flex items-center gap-3 animate-fade-in">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-500">Characters detected:</span>
                            <div className="flex gap-2 flex-wrap">
                                {characters.slice(0, 6).map((char) => (
                                    <span
                                        key={char.id}
                                        className="px-2.5 py-1 text-xs font-medium rounded-full bg-white/5 border border-white/10 text-gray-300"
                                    >
                                        {char.name}
                                    </span>
                                ))}
                                {characters.length > 6 && (
                                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-white/5 border border-white/10 text-gray-500">
                                        +{characters.length - 6} more
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Mode Cards Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {MODE_CONFIG.map((mode, idx) => {
                        const Icon = mode.icon;
                        const disabled = mode.needsCharacter && characters.length === 0 && !loadingChars;

                        return (
                            <motion.div
                                key={mode.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                onClick={() => !disabled && handleSelectMode(mode.id)}
                                className={`card-3d p-8 rounded-3xl cursor-pointer group ${mode.cardClass} ${
                                    disabled ? 'opacity-40 cursor-not-allowed' : ''
                                } ${idx === 0 ? 'md:col-span-2 lg:col-span-1' : ''}`}
                            >
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${mode.gradient} flex items-center justify-center mb-5 border border-white/10 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon className="w-7 h-7 text-white" />
                                </div>

                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-xl font-semibold text-white tracking-wide">{mode.title}</h3>
                                    <span className={`text-xs font-medium ${mode.color} opacity-60`}>{mode.tagline}</span>
                                </div>

                                <p className="text-gray-400 leading-relaxed text-sm mb-4">
                                    {mode.description}
                                </p>

                                {disabled && (
                                    <p className="text-xs text-yellow-500/70 flex items-center gap-1.5">
                                        <Sparkles className="w-3 h-3" />
                                        Characters still extracting...
                                    </p>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
