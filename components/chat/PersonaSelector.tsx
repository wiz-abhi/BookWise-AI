'use client';

import { GraduationCap, Heart, Brain } from 'lucide-react';

interface PersonaSelectorProps {
    selected: 'scholar' | 'friend' | 'quizzer';
    onChange: (persona: 'scholar' | 'friend' | 'quizzer') => void;
}

const personas = [
    {
        id: 'scholar' as const,
        name: 'Scholar',
        icon: GraduationCap,
        description: 'Analytical & academic',
        color: 'blue',
    },
    {
        id: 'friend' as const,
        name: 'Friend',
        icon: Heart,
        description: 'Conversational & friendly',
        color: 'pink',
    },
    {
        id: 'quizzer' as const,
        name: 'Quizzer',
        icon: Brain,
        description: 'Educational & thought-provoking',
        color: 'purple',
    },
];

export function PersonaSelector({ selected, onChange }: PersonaSelectorProps) {
    return (
        <div className="flex gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
            {personas.map((persona) => {
                const Icon = persona.icon;
                const isSelected = selected === persona.id;

                return (
                    <button
                        key={persona.id}
                        onClick={() => onChange(persona.id)}
                        className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${isSelected
                                ? `bg-${persona.color}-600 text-white shadow-lg scale-105`
                                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                            }`}
                    >
                        <Icon className="w-5 h-5" />
                        <div className="text-center">
                            <p className="text-sm font-semibold">{persona.name}</p>
                            <p className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                                {persona.description}
                            </p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
