'use client';

import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '@/lib/store';
import { queryAPI } from '@/lib/api';
import { MessageList } from '@/components/chat/MessageList';
import { ChatInput } from '@/components/chat/ChatInput';
import { PersonaSelector } from '@/components/chat/PersonaSelector';
import { BookOpen, Menu } from 'lucide-react';

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
        <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
            {/* Header */}
            <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                BookBuddy
                            </h1>
                            {selectedBook && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {selectedBook.title}
                                    {selectedBook.author && ` by ${selectedBook.author}`}
                                </p>
                            )}
                        </div>
                    </div>

                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                        <Menu className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>
            </header>

            {/* Persona Selector */}
            <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
                <div className="max-w-4xl mx-auto">
                    <PersonaSelector selected={persona} onChange={setPersona} />
                </div>
            </div>

            {/* Messages */}
            <MessageList messages={messages} />
            <div ref={messagesEndRef} />

            {/* Input */}
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
    );
}
