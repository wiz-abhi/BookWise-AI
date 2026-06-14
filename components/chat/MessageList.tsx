'use client';

import { Message } from '@/lib/store';
import { User, Bot, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface MessageListProps {
    messages: Message[];
    mode?: string;
    characterName?: string;
    isLoading?: boolean;
    onReaction?: (reaction: string) => void;
}

// Simple heuristic to infer mood from text
function inferMood(text: string): string | null {
    if (!text) return null;
    const lower = text.toLowerCase();
    if (lower.includes('!') && lower.includes('?')) return 'Incredulous';
    if (lower.includes('!')) return 'Passionate';
    if (lower.includes('...')) return 'Contemplative';
    if (lower.includes('perhaps') || lower.includes('maybe')) return 'Curious';
    if (lower.includes('never') || lower.includes('cannot')) return 'Guarded';
    if (lower.includes('alas') || lower.includes('sorrow')) return 'Melancholic';
    if (lower.includes('ha') || lower.includes('joy')) return 'Amused';
    return 'Conversational';
}

export function MessageList({ messages, mode, characterName, isLoading, onReaction }: MessageListProps) {
    if (messages.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-col space-y-4 pb-2">
            {messages.map((message, idx) => (
                <div
                    key={message.id || idx}
                    className={`flex gap-4 animate-fade-in ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                    {message.role === 'assistant' && (
                        mode === 'character_voice' ? (
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-700 to-red-900 border-2 border-[#3a3a5e] flex items-center justify-center shadow-lg shadow-amber-900/20 relative overflow-hidden">
                                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]" />
                                <span className="font-serif text-lg text-amber-50 relative z-10 drop-shadow-md">
                                    {characterName ? characterName.charAt(0) : '?'}
                                </span>
                            </div>
                        ) : mode === 'companion' ? (
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-teal-900/40 border border-teal-500/30 flex items-center justify-center shadow-lg shadow-teal-500/10 backdrop-blur-sm">
                                <span className="text-xl">☕</span>
                            </div>
                        ) : (
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shadow-lg backdrop-blur-sm">
                                <Bot className="w-5 h-5 text-indigo-400" />
                            </div>
                        )
                    )}

                    <div
                        className={`flex-1 max-w-3xl ${message.role === 'user' ? 'flex justify-end' : 'flex flex-col items-start'}`}
                    >
                        {mode === 'character_voice' && message.role === 'assistant' && (
                            <div className="flex items-center gap-2 mb-1.5 ml-1">
                                <span className="text-sm font-serif font-medium text-amber-200/80">{characterName || 'Character'}</span>
                                {message.content && (
                                    <span className="px-2 py-0.5 rounded-full bg-[#1a1a2e] border border-[#2a2a4e] text-[10px] text-amber-300/60 uppercase tracking-wider">
                                        {inferMood(message.content)}
                                    </span>
                                )}
                            </div>
                        )}
                        <div
                            className={`rounded-2xl p-3 sm:p-4 shadow-xl backdrop-blur-sm border ${
                                message.role === 'user'
                                    ? mode === 'character_voice'
                                        ? 'bg-gradient-to-br from-purple-700/80 to-rose-800/80 text-white border-white/10'
                                        : 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white border-white/10'
                                    : mode === 'character_voice'
                                        ? 'bg-[#1a1a2e] text-amber-50/90 border-[#3a3a5e] relative overflow-hidden'
                                        : mode === 'companion'
                                        ? 'bg-[#1e3a3a] text-teal-50 border-teal-500/20'
                                        : 'bg-white/5 text-gray-100 border-white/10 hover:bg-white/10 transition-colors'
                                }`}
                        >
                            {mode === 'character_voice' && message.role === 'assistant' && (
                                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] pointer-events-none mix-blend-overlay" />
                            )}
                            
                            {isLoading && message.role === 'assistant' && !message.content && idx === messages.length - 1 ? (
                                mode === 'character_voice' ? (
                                    <div className="flex items-center gap-2 text-amber-200/60 italic font-serif text-sm relative z-10">
                                        <span className="animate-pulse">{characterName || 'Character'} is thinking...</span>
                                    </div>
                                ) : mode === 'companion' ? (
                                    <div className="flex items-center gap-2 text-teal-200/60 italic text-sm relative z-10">
                                        <span className="animate-pulse">reading ahead...</span>
                                    </div>
                                ) : (
                                    <div className="flex space-x-1 items-center h-5">
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                )
                            ) : (
                                <div className={`relative z-10 prose prose-sm prose-invert max-w-none prose-p:leading-relaxed prose-headings:text-white ${mode === 'character_voice' && message.role === 'assistant' ? 'font-serif prose-a:text-amber-400' : mode === 'companion' && message.role === 'assistant' ? 'prose-a:text-teal-300' : 'prose-a:text-indigo-300'}`}>
                                    {mode === 'character_voice' ? (
                                        <ReactMarkdown>{message.content}</ReactMarkdown>
                                    ) : (
                                        <ReactMarkdown 
                                            components={{
                                                p: ({ children }: any) => <p className="mb-3.5 last:mb-0 leading-relaxed text-[14.5px] font-sans">{children}</p>,
                                                ul: ({ children }: any) => <ul className="list-disc pl-5 mb-3.5 space-y-1 text-[14.5px] font-sans">{children}</ul>,
                                                ol: ({ children }: any) => <ol className="list-decimal pl-5 mb-3.5 space-y-1 text-[14.5px] font-sans">{children}</ol>,
                                                li: ({ children }: any) => <li className="text-[14.5px] font-sans">{children}</li>,
                                                strong: ({ children }: any) => <strong className="font-semibold text-white">{children}</strong>,
                                                em: ({ children }: any) => <em className="italic text-gray-200">{children}</em>,
                                                a: ({ href, children, node, ...props }: any) => {
                                                    if (href?.startsWith('#citation-')) {
                                                        const num = href.replace('#citation-', '');
                                                        return (
                                                            <span className={`inline-flex items-center justify-center mx-0.5 px-1.5 py-0.5 text-[9px] font-bold font-mono rounded leading-none align-baseline -translate-y-1.5 ${
                                                                mode === 'companion' 
                                                                    ? 'bg-teal-500/20 border border-teal-500/30 text-teal-300 shadow-[0_0_8px_rgba(45,212,191,0.1)]' 
                                                                    : 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 shadow-[0_0_8px_rgba(99,102,241,0.1)]'
                                                            }`}>
                                                                {num}
                                                            </span>
                                                        );
                                                    }
                                                    return (
                                                        <a 
                                                            href={href} 
                                                            className={`underline transition-colors ${
                                                                mode === 'companion' ? 'text-teal-400 hover:text-teal-300' : 'text-indigo-400 hover:text-indigo-300'
                                                            }`} 
                                                            {...props}
                                                        >
                                                            {children}
                                                        </a>
                                                    );
                                                }
                                            }}
                                        >
                                            {(() => {
                                                if (!message.content) return '';
                                                // Replace [1], [2], etc. with Markdown links [1](#citation-1)
                                                return message.content.replace(/\[(\d+)\]/g, '[$1](#citation-$1)');
                                            })()}
                                        </ReactMarkdown>
                                    )}
                                </div>
                            )}

                            {message.confidence !== undefined && mode !== 'character_voice' && (
                                <div className="mt-4 pt-3 border-t border-white/10 relative z-10">
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
                            <div className="mt-3 pl-1 relative z-10 w-full">
                                <div className="flex flex-wrap gap-2 items-center text-xs text-gray-400">
                                    <span className={`font-medium uppercase tracking-wider flex items-center gap-1.5 ${mode === 'character_voice' ? 'text-amber-200/50' : mode === 'companion' ? 'text-teal-400/70' : 'text-gray-500'}`}>
                                        {mode === 'character_voice' ? '📖 From the book' : mode === 'companion' ? '👀 found in the book:' : <><Sparkles className="w-3 h-3" /> Sources:</>}
                                    </span>
                                    {message.citations.map((c, idx) => (
                                        <div
                                            key={idx}
                                            title={c.excerpt}
                                            className={`group/cite relative px-2.5 py-1 rounded-lg text-[10px] border flex items-center gap-1.5 transition-all cursor-help ${
                                                mode === 'companion'
                                                    ? 'bg-teal-950/30 border-teal-500/20 text-teal-200 hover:bg-teal-500/10'
                                                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                                            }`}
                                        >
                                            <span className={`font-bold font-mono text-[9px] ${mode === 'companion' ? 'text-teal-400/80' : 'text-indigo-400/80'}`}>
                                                [{idx + 1}]
                                            </span>
                                            <span className="truncate max-w-[120px] sm:max-w-[180px]">{c.bookTitle}</span>
                                            {c.page && <span className="opacity-60 font-mono">p.{c.page}</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {mode === 'companion' && message.role === 'assistant' && message.content && idx === messages.length - 1 && !isLoading && (
                            <div className="flex gap-2 mt-2 ml-1">
                                {['😭 same', '🤯 no way', 'explain more'].map(reaction => (
                                    <button
                                        key={reaction}
                                        onClick={() => onReaction?.(reaction)}
                                        className="px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-xs font-medium text-teal-300 hover:bg-teal-500/20 hover:scale-105 transition-all whitespace-nowrap"
                                    >
                                        {reaction}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {message.role === 'user' && (
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${mode === 'character_voice' ? 'bg-rose-900/30 border border-rose-500/30' : 'bg-purple-500/20 border border-purple-500/30'}`}>
                            <User className={`w-5 h-5 ${mode === 'character_voice' ? 'text-rose-300' : 'text-purple-300'}`} />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
