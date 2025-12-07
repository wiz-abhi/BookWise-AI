'use client';

import { GraduationCap, Heart, Brain } from 'lucide-react';

interface PersonaSelectorProps {
    selected: 'scholar' | 'friend' | 'quizzer';
    onChange: (persona: 'scholar' | 'friend' | 'quizzer') => void;
    compact?: boolean;
}

const personas = [
    {
        id: 'scholar' as const,
        name: 'Scholar',
        icon: GraduationCap,
        description: 'Analytical & academic',
        color: 'from-blue-500 to-cyan-500',
    },
    {
        id: 'friend' as const,
        name: 'Friend',
        icon: Heart,
        description: 'Conversational & friendly',
        color: 'from-pink-500 to-rose-500',
    },
    {
        id: 'quizzer' as const,
        name: 'Quizzer',
        icon: Brain,
        description: 'Educational & thought-provoking',
        color: 'from-purple-500 to-violet-500',
    },
];

export function PersonaSelector({ selected, onChange, compact = false }: PersonaSelectorProps) {
    return (
        <div className={`flex gap-1 p-1 bg-white/5 backdrop-blur-md border border-white/10 ${compact ? 'rounded-lg' : 'rounded-2xl'}`}>
            {personas.map((persona) => {
                const Icon = persona.icon;
                const isSelected = selected === persona.id;

                return (
                    <button
                        key={persona.id}
                        onClick={() => onChange(persona.id)}
                        className={`relative group flex items-center gap-2 transition-all duration-300 ${compact
                                ? 'px-3 py-1.5 rounded-md'
                                : 'flex-1 md:flex-none md:w-40 flex flex-col p-3 rounded-xl'
                            } ${isSelected
                                ? 'bg-white/10 shadow-lg border border-white/20'
                                : 'hover:bg-white/5 border border-transparent'
                            }`}
                    >
                        {/* Selected Indicator/Background Gradient */}
                        {isSelected && (
                            <div className={`absolute inset-0 ${compact ? 'rounded-md' : 'rounded-xl'} bg-gradient-to-br ${persona.color} opacity-20`} />
                        )}

                        <div className={`relative flex items-center justify-center transition-colors ${compact ? '' : 'p-2 rounded-lg mb-1'
                            } ${!compact && isSelected ? `bg-gradient-to-br ${persona.color} text-white shadow-lg` : compact && isSelected ? 'text-white' : 'text-gray-400 group-hover:text-white'
                            }`}>
                            <Icon className={compact ? "w-4 h-4" : "w-5 h-5"} />
                        </div>

                        <div className="relative text-center">
                            <p className={`font-semibold transition-colors ${compact ? 'text-xs' : 'text-sm'} ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                                {persona.name}
                            </p>
                            {!compact && (
                                <p className="text-[10px] text-gray-500 group-hover:text-gray-400 hidden md:block mt-1">
                                    {persona.description}
                                </p>
                            )}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
