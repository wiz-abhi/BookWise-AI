'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChatStore } from '@/lib/store';
import { modeAPI, progressAPI } from '@/app/lib/api';
import { useAuth } from '@/app/components/AuthProvider';
import { ChatInput } from '@/components/chat/ChatInput';
import { MessageList } from '@/components/chat/MessageList';
import {
    Coffee, ArrowLeft, BookOpen, Loader2, Sparkles,
    MessageSquare, HelpCircle, Compass, Lightbulb, Settings
} from 'lucide-react';
import { ModeConfigModal } from '@/components/chat/ModeConfigModal';

const QUICK_ACTIONS = [
    { label: "What just happened?", icon: HelpCircle, prompt: "Can you explain what just happened in the part I just read? I want to make sure I understood it correctly." },
    { label: "Gossip time", icon: Coffee, prompt: "Let's gossip! What do you think about the characters so far? Who's your favorite? Anyone annoying you?" },
    { label: "What might happen next?", icon: Compass, prompt: "What do you think is going to happen next? I have some theories but I want to hear yours first!" },
    { label: "Explain context", icon: Lightbulb, prompt: "Can you help me understand the context or historical/cultural background of what's happening in the story right now?" },
];

export default function CompanionModePage() {
    const params = useParams();
    const router = useRouter();
    const { selectedBook, messages, addMessage, clearMessages, isLoading, setIsLoading, readingProgress, setReadingProgress } = useChatStore();
    const { isAuthenticated, loading: authLoading } = useAuth();

    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [conversationId] = useState(`comp-${Date.now()}-${Math.random().toString(36).substring(7)}`);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const bookId = params.id as string;

    // Auth guard
    useEffect(() => {
        if (!authLoading && !isAuthenticated) router.push('/login');
    }, [authLoading, isAuthenticated, router]);

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

    // Load progress and clear messages for new session
    useEffect(() => {
        clearMessages();
        if (!bookId) return;
        progressAPI.get(bookId).then((data) => {
            if (data.progress) {
                setReadingProgress({
                    currentPage: data.progress.currentPage,
                    totalPages: data.progress.totalPages,
                });
            }
        }).catch(() => {});
    }, [bookId, clearMessages, setReadingProgress]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (message: string) => {
        addMessage({ role: 'user', content: message });
        setIsLoading(true);

        try {
            const response = await modeAPI.companion({
                bookId,
                query: message,
                conversationId,
            });

            addMessage({
                role: 'assistant',
                content: response.answer,
                citations: response.citations,
                confidence: response.confidence,
            });
        } catch (error) {
            console.error('Companion mode error:', error);
            addMessage({
                role: 'assistant',
                content: "Oops, something went wrong on my end. Try asking again? 😅",
                confidence: 0,
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
        );
    }

    return (
        <div ref={containerRef} className="flex flex-col h-screen bg-black text-gray-100 overflow-hidden relative">
            <div className="interactive-bg" />

            {/* Floating Back Button */}
            <button
                onClick={() => router.push(`/book/${bookId}/modes`)}
                className="fixed top-6 left-6 z-50 p-3 rounded-full glass-panel border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all hover:scale-110 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                title="Back to Modes"
            >
                <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Floating Config Button */}
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
                title="Companion Mode"
                description={`Reading ${selectedBook?.title || 'your book'} together${readingProgress ? ` · pg ${readingProgress.currentPage}${readingProgress.totalPages ? `/${readingProgress.totalPages}` : ''}` : ''}`}
            >
                <div className="space-y-4">
                    <button
                        onClick={() => router.push(`/library/book/${bookId}`)}
                        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 transition-all font-medium shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                    >
                        <BookOpen className="w-4 h-4" />
                        Open Book to Read
                    </button>
                    <p className="text-xs text-gray-400 text-center px-4">
                        Your companion will automatically sync with your reading progress. No spoilers ahead!
                    </p>
                </div>
            </ModeConfigModal>

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col h-full pt-6 pb-6 max-w-5xl mx-auto w-full px-4 sm:px-6 relative z-10 overflow-hidden">

                {/* Messages */}
                <div className="flex-1 overflow-y-auto min-h-0 space-y-6 pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-8">
                            {/* Welcome message */}
                            <div className="text-center space-y-4 max-w-lg">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center mx-auto">
                                    <Coffee className="w-8 h-8 text-amber-400" />
                                </div>
                                <h2 className="text-xl font-bold text-white">Hey! Ready to chat about the book? 📖</h2>
                                <p className="text-gray-500 text-sm leading-relaxed">
                                    I've read up to the same page as you. Let's discuss what's happened, gossip about the characters, or try to figure out what's coming next. No spoilers, I promise!
                                </p>
                            </div>

                            {/* Quick Actions */}
                            <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
                                {QUICK_ACTIONS.map((action, idx) => {
                                    const Icon = action.icon;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleSendMessage(action.prompt)}
                                            className="flex items-center gap-3 p-4 rounded-xl glass-panel border-white/5 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all text-left group"
                                        >
                                            <Icon className="w-5 h-5 text-amber-400/60 group-hover:text-amber-400 transition-colors flex-shrink-0" />
                                            <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors">{action.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="pb-4">
                            <MessageList messages={messages} />
                            <div ref={messagesEndRef} className="pt-2" />
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="mt-4">
                    <ChatInput
                        onSend={handleSendMessage}
                        isLoading={isLoading}
                        placeholder="Ask your reading buddy anything..."
                    />
                </div>
            </main>
        </div>
    );
}
