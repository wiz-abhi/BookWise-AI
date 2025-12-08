'use client';

import { Message } from '@/lib/store';
import { CitationCard } from './CitationCard';
import { User, Bot, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface MessageListProps {
    messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
    if (messages.length === 0) {
        // Handled by parent container empty state, but keeping safe fallback
        return null;
    }

    return (
        <div className="flex flex-col space-y-6 pb-2">
            {messages.map((message, idx) => (
                <div
                    key={message.id || idx}
                    className={`flex gap-4 animate-fade-in ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                    {message.role === 'assistant' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shadow-lg backdrop-blur-sm">
                            <Bot className="w-5 h-5 text-indigo-400" />
                        </div>
                    )}

                    <div
                        className={`flex-1 max-w-3xl ${message.role === 'user' ? 'flex justify-end' : ''}`}
                    >
                        <div
                            className={`rounded-2xl p-5 shadow-xl backdrop-blur-sm border ${message.role === 'user'
                                ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white border-white/10'
                                : 'bg-white/5 text-gray-100 border-white/10 hover:bg-white/10 transition-colors'
                                }`}
                        >
                            <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-headings:text-white prose-a:text-indigo-300">
                                <ReactMarkdown>{message.content}</ReactMarkdown>
                            </div>

                            {message.confidence !== undefined && (
                                <div className="mt-4 pt-3 border-t border-white/10">
                                    <div className="flex items-center gap-3 text-xs text-gray-400">
                                        <span className="font-medium tracking-wide uppercase">Confidence</span>
                                        <div className="flex-1 h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${message.confidence > 0.8 ? 'bg-emerald-500' :
                                                    message.confidence > 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                                                    }`}
                                                style={{ width: `${message.confidence * 100}%` }}
                                            />
                                        </div>
                                        <span className="font-mono">{Math.round(message.confidence * 100)}%</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {message.citations && message.citations.length > 0 && (
                            <div className="mt-3 pl-1">
                                <div className="flex flex-wrap gap-2 items-center text-xs text-gray-400">
                                    <span className="font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Sparkles className="w-3 h-3" /> Sources:
                                    </span>
                                    {Array.from(new Set(message.citations.map(c => c.bookTitle))).map((title, idx) => (
                                        <span
                                            key={idx}
                                            className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors"
                                        >
                                            {title}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {message.role === 'user' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                            <User className="w-5 h-5 text-indigo-300" />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
