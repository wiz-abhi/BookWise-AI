import { X, ArrowLeft } from 'lucide-react';
import { ReactNode } from 'react';

interface ModeConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBack: () => void;
    title: string;
    description?: string;
    children?: ReactNode;
}

export function ModeConfigModal({ isOpen, onClose, onBack, title, description, children }: ModeConfigModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-md glass-panel rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[85vh]">
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                    <button 
                        onClick={onBack}
                        className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Exit Mode
                    </button>
                    <button 
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto min-h-0 flex-1 scrollbar-thin">
                    <div className="mb-6 text-center">
                        <h2 className="text-xl font-bold text-white mb-1">{title}</h2>
                        {description && (
                            <p className="text-sm text-gray-400">{description}</p>
                        )}
                    </div>

                    <div className="space-y-6">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
