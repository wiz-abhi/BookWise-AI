'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChatStore, Character } from '@/lib/store';
import { modeAPI } from '@/app/lib/api';
import { useAuth } from '@/app/components/AuthProvider';
import { ChatInput } from '@/components/chat/ChatInput';
import { MessageList } from '@/components/chat/MessageList';
import { Loader2, Settings, ArrowLeft } from 'lucide-react';
import { ModeConfigModal } from '@/components/chat/ModeConfigModal';

export default function CharacterVoiceModePage() {
    const params = useParams();
    const router = useRouter();
    const { selectedBook, messages, addMessage, updateLastMessage, setLastMessageCitations, clearMessages, isLoading, setIsLoading, selectedCharacter, setSelectedCharacter } = useChatStore();
    const { isAuthenticated, loading: authLoading } = useAuth();

    const [characters, setCharacters] = useState<Character[]>([]);
    const [loadingChars, setLoadingChars] = useState(true);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
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
        addMessage({ role: 'assistant', content: '', citations: [] });

        try {
            await modeAPI.characterVoice(
                {
                    bookId,
                    characterId: selectedCharacter.id,
                    query: message,
                    conversationId: conversationId || undefined,
                },
                (chunk) => updateLastMessage(chunk),
                (metadata) => { if (metadata.citations) setLastMessageCitations(metadata.citations); }
            );
        } catch (error) {
            console.error('Character voice error:', error);
            updateLastMessage("\n\nI seem to have lost my voice for a moment. Try again?");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectCharacter = (char: Character) => {
        setSelectedCharacter(char);
        setIsConfigOpen(false);
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

            <button
                onClick={() => router.push(`/book/${bookId}/modes`)}
                className="fixed top-6 left-6 z-50 p-3 rounded-full glass-panel border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all hover:scale-110 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                title="Back to Modes"
            >
                <ArrowLeft className="w-5 h-5" />
            </button>

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
                title="Character Voice"
                description={`Speaking as a character from ${selectedBook?.title || 'your book'}`}
            >
                <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-300 px-1">Select Character</p>
                    <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                        {characters.map((char) => (
                            <button
                                key={char.id}
                                onClick={() => handleSelectCharacter(char)}
                                className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 ${
                                    selectedCharacter?.id === char.id 
                                        ? 'bg-gradient-to-r from-purple-500/20 to-violet-600/20 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
                                        : 'bg-white/5 border border-white/5 hover:bg-white/10'
                                }`}
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 mt-0.5 shadow-inner">
                                    {char.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-medium text-white truncate">{char.name}</p>
                                    <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">{char.description}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </ModeConfigModal>

            {/* Main Chat */}
            <main className="flex-1 flex flex-col h-full pt-6 pb-6 max-w-5xl mx-auto w-full px-4 sm:px-6 relative z-10 overflow-hidden">
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
