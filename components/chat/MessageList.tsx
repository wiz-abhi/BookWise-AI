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
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Start a Conversation
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        Ask me anything about your uploaded books. I'll provide answers with citations!
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {messages.map((message) => (
                <div
                    key={message.id}
                    className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                >
                    {message.role === 'assistant' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                    )}

                    <div
                        className={`flex-1 max-w-3xl ${message.role === 'user' ? 'flex justify-end' : ''
                            }`}
                    >
                        <div
                            className={`rounded-2xl p-4 ${message.role === 'user'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                                }`}
                        >
                            <div className="prose dark:prose-invert max-w-none">
                                <ReactMarkdown>{message.content}</ReactMarkdown>
                            </div>

                            {message.confidence !== undefined && (
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                        <span>Confidence:</span>
                                        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-green-500 rounded-full transition-all"
                                                style={{ width: `${message.confidence * 100}%` }}
                                            />
                                        </div>
                                        <span>{Math.round(message.confidence * 100)}%</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {message.citations && message.citations.length > 0 && (
                            <div className="mt-3 space-y-2">
                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                    Sources
                                </p>
                                {message.citations.map((citation, idx) => (
                                    <CitationCard key={idx} citation={citation} index={idx} />
                                ))}
                            </div>
                        )}
                    </div>

                    {message.role === 'user' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
