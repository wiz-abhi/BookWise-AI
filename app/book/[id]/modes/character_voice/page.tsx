'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChatStore, Character } from '@/lib/store';
import { modeAPI } from '@/app/lib/api';
import { useAuth } from '@/app/components/AuthProvider';
import { ChatInput } from '@/components/chat/ChatInput';
import { MessageList } from '@/components/chat/MessageList';
import { Theater, ArrowLeft, Loader2, ChevronDown, User, Sparkles } from 'lucide-react';

export default function CharacterVoiceModePage() {
    const params = useParams();
    const router = useRouter();
    const { selectedBook, messages, addMessage, clearMessages, isLoading, setIsLoading, selectedCharacter, setSelectedCharacter } = useChatStore();
    const { isAuthenticated, loading: authLoading } = useAuth();

    const [characters, setCharacters] = useState<Character[]>([]);
    const [loadingChars, setLoadingChars] = useState(true);
    const [showCharPicker, setShowCharPicker] = useState(false);
    const [conversationId] = useState(`cv-${Date.now()}-${Math.random().toString(36).substring(7)}`);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const bookId = params.id as string;

    useEffect(() => {
        if (!authLoading && !isAuthenticated) router.push('/login');
    }, [authLoading, isAuthenticated, router]);

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

    useEffect(() => {
        clearMessages();
        if (!bookId) return;
        setLoadingChars(true);
        modeAPI.getCharacters(bookId).then((data) => {
            setCharacters(data.characters || []);
            if (data.characters?.length > 0 && !selectedCharacter) {
                setSelectedCharacter(data.characters[0]);
            }
        }).catch(console.error).finally(() => setLoadingChars(false));
    }, [bookId, clearMessages, setSelectedCharacter]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (message: string) => {
        if (!selectedCharacter) return;
        addMessage({ role: 'user', content: message });
        setIsLoading(true);

        try {
            const response = await modeAPI.characterVoice({
                bookId,
                characterId: selectedCharacter.id,
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
            console.error('Character voice error:', error);
            addMessage({ role: 'assistant', content: "I seem to have lost my voice for a moment. Try again?", confidence: 0 });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectCharacter = (char: Character) => {
        setSelectedCharacter(char);
        setShowCharPicker(false);
        clearMessages();
    };

    if (authLoading || loadingChars) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        );
    }

    return (
        <div ref={containerRef} className="flex flex-col h-screen bg-black text-gray-100 overflow-hidden relative">
            <div className="interactive-bg" />

            {/* Header */}
            <header className="fixed top-24 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl z-40 glass-panel rounded-xl px-4 py-3 border-white/10 shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.push(`/book/${bookId}/modes`)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <ArrowLeft className="w-4 h-4 text-gray-400" />
                        </button>
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500/20 to-violet-600/20 border border-purple-500/30 flex items-center justify-center">
                            <Theater className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-white">Character Voice</h1>
                            <p className="text-[10px] text-gray-400">
                                Speaking as a character from {selectedBook?.title || 'your book'}
                            </p>
                        </div>
                    </div>

                    {/* Character Picker */}
                    <div className="relative">
                        <button
                            onClick={() => setShowCharPicker(!showCharPicker)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all text-sm"
                        >
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-[10px] font-bold text-white">
                                {selectedCharacter?.name?.charAt(0) || '?'}
                            </div>
                            <span className="text-purple-300 font-medium max-w-[120px] truncate">{selectedCharacter?.name || 'Select...'}</span>
                            <ChevronDown className="w-3 h-3 text-purple-400" />
                        </button>

                        {showCharPicker && (
                            <div className="absolute right-0 top-full mt-2 w-72 glass-panel rounded-xl border border-white/10 shadow-2xl z-50 p-2 max-h-80 overflow-y-auto">
                                {characters.map((char) => (
                                    <button
                                        key={char.id}
                                        onClick={() => handleSelectCharacter(char)}
                                        className={`w-full text-left p-3 rounded-lg hover:bg-white/5 transition-all flex items-start gap-3 ${
                                            selectedCharacter?.id === char.id ? 'bg-purple-500/10 border border-purple-500/20' : ''
                                        }`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5">
                                            {char.name.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-white text-sm truncate">{char.name}</p>
                                            <p className="text-xs text-gray-500 line-clamp-2">{char.description}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Chat */}
            <main className="flex-1 flex flex-col h-full pt-40 pb-6 max-w-5xl mx-auto w-full px-4 sm:px-6 relative z-10 overflow-hidden">
                <div className="flex-1 overflow-y-auto min-h-0 space-y-6 pr-2 scrollbar-thin">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-6">
                            <div className="text-center space-y-4 max-w-md">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center mx-auto shadow-lg shadow-purple-500/20 text-2xl font-bold text-white">
                                    {selectedCharacter?.name?.charAt(0) || '?'}
                                </div>
                                <h2 className="text-xl font-bold text-white">
                                    You're speaking with {selectedCharacter?.name || 'a character'}
                                </h2>
                                <p className="text-sm text-gray-500 leading-relaxed italic">
                                    "{selectedCharacter?.description || 'A character from this book.'}"
                                </p>
                                {selectedCharacter?.traits?.personality && (
                                    <div className="flex flex-wrap gap-2 justify-center mt-3">
                                        {selectedCharacter.traits.personality.slice(0, 4).map((trait, i) => (
                                            <span key={i} className="px-2.5 py-1 text-xs rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300">
                                                {trait}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-gray-600 max-w-xs text-center">
                                Ask them anything — about their motivations, feelings, relationships, or decisions. They'll respond in character.
                            </p>
                        </div>
                    ) : (
                        <div className="pb-4">
                            <MessageList messages={messages} />
                            <div ref={messagesEndRef} className="pt-2" />
                        </div>
                    )}
                </div>

                <div className="mt-4">
                    <ChatInput
                        onSend={handleSendMessage}
                        isLoading={isLoading}
                        placeholder={`Ask ${selectedCharacter?.name || 'the character'} anything...`}
                    />
                </div>
            </main>
        </div>
    );
}
