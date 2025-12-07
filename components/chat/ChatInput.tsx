'use client';

import { useState } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';

interface ChatInputProps {
    onSend: (message: string) => void;
    isLoading: boolean;
    placeholder?: string;
}

export function ChatInput({ onSend, isLoading, placeholder }: ChatInputProps) {
    const [input, setInput] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onSend(input.trim());
            setInput('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="relative z-20">
            <div className="glass-panel rounded-2xl p-2 border-white/10 shadow-2xl relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur opacity-30 transition-opacity duration-500" />

                <div className="relative flex gap-2 items-end">
                    <div className="flex-1 relative">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder || "Ask about your books..."}
                            disabled={isLoading}
                            rows={1}
                            className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/5 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:bg-white/10 focus:border-indigo-500/30 resize-none disabled:opacity-50 disabled:cursor-not-allowed transition-all scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                            style={{ minHeight: '52px', maxHeight: '150px' }}
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = target.scrollHeight + 'px';
                            }}
                        />
                        <div className="absolute right-3 bottom-3">
                            <Sparkles className="w-4 h-4 text-white/20" />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all shadow-lg hover:shadow-indigo-500/25 hover:scale-105 active:scale-95"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-white/70" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>

            <p className="text-[10px] text-gray-500 text-center mt-2 font-medium tracking-wide">
                AI can make mistakes. Check important info.
            </p>
        </form>
    );
}
