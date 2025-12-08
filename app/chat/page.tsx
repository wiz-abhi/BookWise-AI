'use client';

import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '@/lib/store';
import { queryAPI } from '@/lib/api';
import { MessageList } from '@/components/chat/MessageList';
import { ChatInput } from '@/components/chat/ChatInput';
import { PersonaSelector } from '@/components/chat/PersonaSelector';
import { BookOpen, Menu, Sparkles } from 'lucide-react';

export default function ChatPage() {
    const {
        messages,
        addMessage,
        selectedBook,
        persona,
        setPersona,
        isLoading,
        setIsLoading,
        userId,
        conversationId,
        setConversationId,
    } = useChatStore();

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Mouse tracking for spotlight effect
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (containerRef.current) {
                const { left, top } = containerRef.current.getBoundingClientRect();
                const x = e.clientX - left;
                const y = e.clientY - top;
                containerRef.current.style.setProperty('--mouse-x', `${x}px`);
                containerRef.current.style.setProperty('--mouse-y', `${y}px`);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Generate conversation ID if not exists
    useEffect(() => {
        if (!conversationId) {
            setConversationId(`conv-${Date.now()}-${Math.random().toString(36).substring(7)}`);
        }
    }, [conversationId, setConversationId]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (message: string) => {
        // Add user message
        addMessage({
            role: 'user',
            content: message,
        });

        setIsLoading(true);

        try {
            if (conversationId) {
                // Send message with conversation context
                const response = await queryAPI.sendMessage(conversationId, {
                    message,
                    userId,
                    bookId: selectedBook?.id,
                    persona,
                });

                // Add assistant response
                addMessage({
                    role: 'assistant',
                    content: response.message.content,
                    citations: response.message.citations,
                    confidence: response.message.confidence,
                });
            } else {
                // Standalone query (no conversation context)
                const response = await queryAPI.query({
                    query: message,
                    userId,
                    bookId: selectedBook?.id,
                    persona,
                    k: 5,
                });

                addMessage({
                    role: 'assistant',
                    content: response.answer,
                    citations: response.citations,
                    confidence: response.confidence,
                });
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            addMessage({
                role: 'assistant',
                content: 'Sorry, I encountered an error processing your request. Please try again.',
                confidence: 0,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            ref={containerRef}
            className="flex flex-col h-screen bg-black text-gray-100 overflow-hidden relative"
        >
            <div className="interactive-bg" />

            {/* Header */}
            <header className="fixed top-24 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl z-40 glass-panel rounded-xl px-4 py-3 border-white/10 shadow-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center shadow-inner">
                        {selectedBook ? (
                            <BookOpen className="w-4 h-4 text-indigo-400" />
                        ) : (
                            <Sparkles className="w-4 h-4 text-purple-400" />
                        )}
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-white tracking-wide">
                            {selectedBook ? selectedBook.title : 'General Chat'}
                        </h1>
                        <p className="text-[10px] text-gray-400 flex items-center gap-1">
                            {selectedBook ? `by ${selectedBook.author || 'Unknown'}` : 'Ask anything about your library'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center">
                    {/* Compact Persona Selector in Header */}
                    <PersonaSelector selected={persona} onChange={setPersona} compact={true} />
                </div>
            </header>

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col h-full pt-32 pb-6 max-w-5xl mx-auto w-full px-4 sm:px-6 relative z-10 overflow-hidden">

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto min-h-0 space-y-6 pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-50 space-y-4">
                            <Sparkles className="w-12 h-12 text-indigo-400/50" />
                            <p className="text-gray-500 font-light">Start a conversation...</p>
                        </div>
                    ) : (
                        <div className="pb-4">
                            <MessageList messages={messages} />
                            <div ref={messagesEndRef} className="pt-2" />
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="mt-4">
                    <ChatInput
                        onSend={handleSendMessage}
                        isLoading={isLoading}
                        placeholder={
                            selectedBook
                                ? `Ask about "${selectedBook.title}"...`
                                : 'Ask about your books...'
                        }
                    />
                </div>
            </main>
        </div>
    );
}
