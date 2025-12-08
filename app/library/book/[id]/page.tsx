'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChatStore } from '@/lib/store';
import { queryAPI, userAPI } from '@/lib/api';
import {
    ChevronLeft,
    ChevronRight,
    ZoomIn,
    ZoomOut,
    MessageSquare,
    Mic,
    MicOff,
    Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

// Dynamically import PDFViewer with no SSR to avoid DOMMatrix error
const PDFViewer = dynamic(() => import('@/components/library/PDFViewer'), {
    ssr: false,
    loading: () => (
        <div className="w-[600px] h-[800px] bg-white/5 rounded-lg flex flex-col items-center justify-center text-gray-400 animate-pulse border border-white/10">
            <p>Loading PDF Viewer...</p>
        </div>
    )
});

export default function BookReaderPage() {
    const params = useParams();
    const router = useRouter();
    const { selectedBook, setSelectedBook, userId } = useChatStore();

    // PDF State
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);

    // AI Interaction State
    const [isVoiceActive, setIsVoiceActive] = useState(false);
    const [selectedText, setSelectedText] = useState('');
    const [selectionCoords, setSelectionCoords] = useState<{ x: number, y: number } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Falling Text Animation State
    const [fallingText, setFallingText] = useState<string[]>([]);

    // Refs
    const recognitionRef = useRef<any>(null);

    // Restore selectedBook on reload
    useEffect(() => {
        const loadBook = async () => {
            if (!selectedBook && params.id) {
                try {
                    // Fetch library to find the book
                    // In a real app, use a specific getBook endpoint
                    const data = await userAPI.getUserLibrary(userId);
                    const books = data.books || [];
                    const book = books.find((b: any) => b.id === params.id);
                    if (book) {
                        setSelectedBook(book);
                    } else {
                        console.error('Book not found in library');
                    }
                } catch (error) {
                    console.error('Failed to load book details:', error);
                }
            }
        };
        loadBook();
    }, [selectedBook, params.id, userId, setSelectedBook]);

    // Initialize Speech Recognition
    useEffect(() => {
        if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                handleAiQuery(transcript);
                setIsVoiceActive(false);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setIsVoiceActive(false);
            };
        }
    }, []);

    // Handle Text Selection
    const handleTextSelection = () => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            setSelectedText(selection.toString());
            setSelectionCoords({
                x: rect.left + (rect.width / 2),
                y: rect.top - 10
            });
        } else {
            setSelectionCoords(null);
        }
    };

    // AI Query Handler
    const handleAiQuery = async (query: string, context?: string) => {
        setIsProcessing(true);
        setFallingText([]); // Reset animation

        try {
            // Simulate AI stream for "falling text" effect
            // In a real app, this would be the actual response from the AI
            const fullQuery = context
                ? `Context: "${context}". Question: ${query}`
                : query;

            const response = await queryAPI.query({
                query: fullQuery,
                userId,
                bookId: selectedBook?.id,
                k: 3
            });

            // Start animation loop
            animateFallingText(response.answer);

            // Speak response
            speakResponse(response.answer);

        } catch (error) {
            console.error('AI Query failed:', error);
        } finally {
            setIsProcessing(false);
            setSelectionCoords(null); // Clear menu
        }
    };

    const animateFallingText = (text: string) => {
        const words = text.split(' ');
        let currentIndex = 0;

        const interval = setInterval(() => {
            if (currentIndex >= words.length) {
                clearInterval(interval);
                setTimeout(() => setFallingText([]), 5000); // Clear after delay
                return;
            }
            setFallingText(prev => [...prev, words[currentIndex]]);
            currentIndex++;
        }, 100); // Speed of falling words
    };

    const speakResponse = (text: string) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        }
    };

    const toggleVoice = () => {
        if (isVoiceActive) {
            recognitionRef.current?.stop();
            setIsVoiceActive(false);
        } else {
            recognitionRef.current?.start();
            setIsVoiceActive(true);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-900 text-gray-100 relative overflow-hidden flex flex-col" onMouseUp={handleTextSelection}>

            {/* Top Bar */}
            <header className="h-16 bg-neutral-900/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-6 z-50 fixed top-0 w-full">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h1 className="font-semibold truncate max-w-xs md:max-w-md">
                        {selectedBook?.title || 'Book Reader'}
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleVoice}
                        className={`p-2.5 rounded-full transition-all ${isVoiceActive
                                ? 'bg-red-500/20 text-red-500 animate-pulse ring-2 ring-red-500/50'
                                : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white'
                            }`}
                    >
                        {isVoiceActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                    </button>

                    <button className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-full text-sm font-medium transition-colors">
                        <MessageSquare className="w-4 h-4" />
                        <span className="hidden sm:inline">Discuss</span>
                    </button>

                    <div className="w-px h-6 bg-white/10 mx-1" />

                    <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white">
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono text-gray-500 w-12 text-center">{Math.round(scale * 100)}%</span>
                    <button onClick={() => setScale(s => Math.min(2.0, s + 0.1))} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white">
                        <ZoomIn className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {/* Falling Text Animation Layer */}
            <div className="fixed inset-0 pointer-events-none z-40 flex justify-center pt-20">
                <div className="flex flex-wrap gap-2 justify-center max-w-3xl px-8">
                    <AnimatePresence>
                        {fallingText.map((word, i) => (
                            <motion.span
                                key={`${word}-${i}`}
                                initial={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, y: 50, transition: { duration: 0.5 } }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                className="text-2xl font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                            >
                                {word}
                            </motion.span>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Main Viewer Area */}
            <main className="flex-1 pt-20 pb-20 px-4 flex justify-center overflow-auto bg-neutral-900 scrollbar-thin scrollbar-thumb-white/10">
                <div className="relative shadow-2xl">
                    <PDFViewer
                        fileUrl={selectedBook ? `http://localhost:3001/api/book/${selectedBook.id}/file` : null}
                        scale={scale}
                        setScale={setScale}
                        pageNumber={pageNumber}
                        setPageNumber={setPageNumber}
                        onNumPagesLoad={setNumPages}
                    />
                </div>
            </main>

            {/* Floating Selection Menu */}
            <AnimatePresence>
                {selectionCoords && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        style={{ top: selectionCoords.y, left: selectionCoords.x }}
                        className="fixed z-50 -translate-x-1/2 -translate-y-full mb-2 flex gap-1 p-1 bg-neutral-900/90 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl"
                    >
                        <button
                            onClick={() => handleAiQuery("Explain this", selectedText)}
                            className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-lg text-sm text-white transition-colors"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                            Explain
                        </button>
                        <div className="w-px bg-white/10 my-1" />
                        <button
                            onClick={() => handleAiQuery("Discuss this", selectedText)}
                            className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-lg text-sm text-white transition-colors"
                        >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                            Discuss
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Navigation */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-neutral-900/80 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-6 shadow-xl z-50">
                <button
                    disabled={pageNumber <= 1}
                    onClick={() => setPageNumber(p => p - 1)}
                    className="p-2 hover:bg-white/10 rounded-full disabled:opacity-30 disabled:hover:bg-transparent"
                >
                    <ChevronLeft className="w-5 h-5 text-white" />
                </button>

                <span className="text-sm font-mono text-gray-300 min-w-[80px] text-center">
                    Page {pageNumber} of {numPages || '--'}
                </span>

                <button
                    disabled={numPages ? pageNumber >= numPages : false}
                    onClick={() => setPageNumber(p => p + 1)}
                    className="p-2 hover:bg-white/10 rounded-full disabled:opacity-30 disabled:hover:bg-transparent"
                >
                    <ChevronRight className="w-5 h-5 text-white" />
                </button>
            </div>
        </div>
    );
}
