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
    Square,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

// Dynamically import PDFViewer with no SSR to avoid DOMMatrix error
const PDFViewer = dynamic(() => import('@/components/library/PDFViewer'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-white/5 flex flex-col items-center justify-center text-gray-400 animate-pulse border border-white/10">
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

    // Sidebar State
    const [aiResponse, setAiResponse] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Refs
    const recognitionRef = useRef<any>(null);
    const stopTypingRef = useRef<boolean>(false);

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

    const stopAI = () => {
        // Stop Speaking
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
        setIsProcessing(false);
        stopTypingRef.current = true;
    };

    // AI Query Handler
    const handleAiQuery = async (query: string, context?: string) => {
        setIsProcessing(true);
        setAiResponse(''); // Reset text
        setIsSidebarOpen(true); // Open sidebar
        stopTypingRef.current = false;

        try {
            const fullQuery = context
                ? `Context: "${context}". Question: ${query}`
                : query;

            const response = await queryAPI.query({
                query: fullQuery,
                userId,
                bookId: selectedBook?.id,
                k: 3
            });

            if (stopTypingRef.current) return;

            // Stream text effect to sidebar
            typeWriterEffect(response.answer);

            // Speak response
            speakResponse(response.answer);

        } catch (error) {
            console.error('AI Query failed:', error);
            setAiResponse("Sorry, I couldn't process that request.");
        } finally {
            setIsProcessing(false);
            setSelectionCoords(null); // Clear menu
        }
    };

    const typeWriterEffect = (text: string) => {
        let i = 0;
        const speed = 30; // ms per char

        const type = () => {
            if (stopTypingRef.current) return;

            if (i < text.length) {
                setAiResponse(prev => prev + text.charAt(i));
                i++;
                setTimeout(type, speed);
            }
        };
        type();
    };

    const speakResponse = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Cancel previous
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);
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
        <div className="h-screen bg-neutral-900 text-gray-100 flex flex-col overflow-hidden" onMouseUp={handleTextSelection}>

            {/* Top Bar */}
            <header className="h-16 bg-neutral-900/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-6 z-50 shrink-0">
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

                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${isSidebarOpen ? 'bg-indigo-600 text-white' : 'bg-white/5 hover:bg-white/10 text-gray-300'
                            }`}
                    >
                        <MessageSquare className="w-4 h-4" />
                        <span className="hidden sm:inline">AI Panel</span>
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

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* PDF Viewer */}
                <main className="flex-1 overflow-auto bg-neutral-900 scrollbar-thin scrollbar-thumb-white/10 flex justify-center p-8">
                    <div className="relative shadow-2xl h-fit">
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

                {/* Right Sidebar - AI Panel */}
                <AnimatePresence>
                    {isSidebarOpen && (
                        <motion.aside
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 350, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="bg-neutral-900 border-l border-white/10 flex flex-col z-40"
                        >
                            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-neutral-900/50 backdrop-blur-sm">
                                <h2 className="font-semibold text-indigo-400 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    AI Insight
                                </h2>
                                <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-white/10 rounded-lg text-gray-400">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {aiResponse ? (
                                    <div className="prose prose-invert prose-sm max-w-none">
                                        <p>{aiResponse}</p>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-3 opacity-60">
                                        <MessageSquare className="w-10 h-10" />
                                        <p className="text-center text-sm px-8">
                                            Select text in the book or use voice to start a discussion.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Control Bar */}
                            {(isSpeaking || isProcessing) && (
                                <div className="p-4 border-t border-white/10 bg-neutral-900/50 backdrop-blur-sm">
                                    <button
                                        onClick={stopAI}
                                        className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg flex items-center justify-center gap-2 transition-colors border border-red-500/20"
                                    >
                                        <Square className="w-4 h-4 fill-current" />
                                        Stop Generation
                                    </button>
                                </div>
                            )}
                        </motion.aside>
                    )}
                </AnimatePresence>
            </div>

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

            {/* Bottom Navigation Overlay (Centered on Main Area Only) */}
            <div className={`fixed bottom-6 transition-all duration-300 z-30 ${isSidebarOpen ? 'left-[calc(50%-175px)]' : 'left-1/2'} -translate-x-1/2 px-4 py-2 bg-neutral-900/80 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-6 shadow-xl`}>
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
