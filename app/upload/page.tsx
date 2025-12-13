'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadAPI } from '@/lib/api';
import { useChatStore } from '@/lib/store';
import { Upload, FileText, Loader2, CheckCircle2, XCircle, BookOpen, Sparkles, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../components/AuthProvider';

export default function UploadPage() {
    const router = useRouter();
    const { isAuthenticated, loading: authLoading } = useAuth();
    const { userId, setSelectedBook } = useChatStore();

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    if (authLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) return null;
    const [uploading, setUploading] = useState(false);
    const [ingestionStatus, setIngestionStatus] = useState<{
        jobId: string;
        status: string;
        progress: number;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [uploadedBook, setUploadedBook] = useState<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Mouse tracking for spotlight effect
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (containerRef.current) {
                const { left, top } = containerRef.current.getBoundingClientRect();
                const x = e.clientX - left;
                const y = e.clientY - top;
                containerRef.current.style.setProperty('--mouse-x', `${x}px`);
                containerRef.current.style.setProperty('--mouse-y', `${y}px`);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setUploading(true);
        setError(null);
        setIngestionStatus(null);

        try {
            // Upload file
            const response = await uploadAPI.uploadBook(file, {
                userId,
                title: file.name.replace(/\.[^/.]+$/, ''),
            });

            setUploadedBook(response.book);
            setIngestionStatus({
                jobId: response.ingestionJobId,
                status: 'processing',
                progress: 0,
            });

            // Poll for ingestion status
            const pollInterval = setInterval(async () => {
                try {
                    const status = await uploadAPI.getIngestionStatus(response.ingestionJobId);
                    setIngestionStatus({
                        jobId: status.jobId,
                        status: status.status,
                        progress: status.progress,
                    });

                    if (status.status === 'completed' || status.status === 'failed') {
                        clearInterval(pollInterval);
                        setUploading(false);

                        if (status.status === 'completed') {
                            // Set as selected book
                            setSelectedBook({
                                id: response.book.id,
                                title: response.book.title,
                                author: response.book.author,
                                language: 'en',
                                totalPages: null,
                                createdAt: response.book.createdAt,
                            });
                        }
                    }
                } catch (err) {
                    clearInterval(pollInterval);
                    setError('Failed to check ingestion status');
                    setUploading(false);
                }
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to upload file');
            setUploading(false);
        }
    }, [userId, setSelectedBook]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/epub+zip': ['.epub'],
            'text/plain': ['.txt'],
        },
        maxFiles: 1,
        disabled: uploading,
    });

    const handleStartChat = () => {
        router.push('/chat');
    };

    return (
        <div
            ref={containerRef}
            className="min-h-screen bg-black text-gray-100 pt-32 pb-12 px-4 sm:px-6 relative overflow-hidden flex flex-col items-center justify-center"
        >
            <div className="interactive-bg" />

            <div className="max-w-3xl w-full relative z-10 space-y-8 animate-fade-in">

                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl mb-4">
                        <BookOpen className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500">
                        Upload Your Book
                    </h1>
                    <p className="text-gray-400 font-light text-lg max-w-xl mx-auto">
                        Add PDF, EPUB, or TXT files to your library. We'll process them instantly for AI-powered conversations.
                    </p>
                </div>

                {/* Upload Area */}
                {!ingestionStatus ? (
                    <div
                        {...getRootProps()}
                        className={`group relative rounded-3xl p-12 text-center cursor-pointer transition-all duration-500 border-2 border-dashed overflow-hidden ${isDragActive
                            ? 'border-indigo-500 bg-indigo-500/10'
                            : 'border-white/10 hover:border-indigo-500/50 bg-white/5 hover:bg-white/10'
                            } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <input {...getInputProps()} />

                        {/* Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                        <div className="relative z-10 flex flex-col items-center gap-6">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ${isDragActive ? 'bg-indigo-500 text-white scale-110 shadow-lg shadow-indigo-500/40' : 'bg-white/5 text-gray-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-400'
                                }`}>
                                {uploading ? (
                                    <Loader2 className="w-10 h-10 animate-spin" />
                                ) : (
                                    <Upload className="w-10 h-10" />
                                )}
                            </div>

                            <div className="space-y-2">
                                <p className="text-xl font-bold text-white group-hover:text-indigo-200 transition-colors">
                                    {isDragActive ? 'Drop it like it\'s hot!' : 'Drag & drop a book file'}
                                </p>
                                <p className="text-sm text-gray-500 group-hover:text-gray-400 transition-colors">
                                    or click to browse from your device
                                </p>
                            </div>

                            <div className="flex items-center gap-2 text-xs font-mono text-gray-600 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                                <span>PDF</span>
                                <span className="w-1 h-1 rounded-full bg-gray-600" />
                                <span>EPUB</span>
                                <span className="w-1 h-1 rounded-full bg-gray-600" />
                                <span>TXT</span>
                                <span className="w-1 h-1 rounded-full bg-gray-600" />
                                <span>MAX 100MB</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Ingestion Progress */
                    <div className="glass-panel rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
                        {/* Background Glow */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />

                        <div className="relative z-10 flex items-start gap-6">
                            <div className="flex-shrink-0">
                                {ingestionStatus.status === 'completed' ? (
                                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                                    </div>
                                ) : ingestionStatus.status === 'failed' ? (
                                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
                                        <XCircle className="w-8 h-8 text-red-400" />
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                                        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 space-y-4">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1">
                                        {ingestionStatus.status === 'completed'
                                            ? 'Book Processed Successfully!'
                                            : ingestionStatus.status === 'failed'
                                                ? 'Processing Failed'
                                                : 'Analyze & Ingest...'}
                                    </h3>
                                    {uploadedBook && (
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <FileText className="w-3.5 h-3.5" />
                                            <span className="truncate max-w-[200px] font-medium text-gray-300">{uploadedBook.title}</span>
                                        </div>
                                    )}
                                </div>

                                {ingestionStatus.status === 'processing' && (
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-xs font-medium text-indigo-300 uppercase tracking-widest">
                                            <span>System Progress</span>
                                            <span>{Math.round(ingestionStatus.progress)}%</span>
                                        </div>
                                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden border border-white/5">
                                            <div
                                                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300 relative"
                                                style={{ width: `${ingestionStatus.progress}%` }}
                                            >
                                                <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 animate-pulse">
                                            Generating embeddings and linguistic index...
                                        </p>
                                    </div>
                                )}

                                {ingestionStatus.status === 'completed' && (
                                    <div className="pt-2 animate-fade-in">
                                        <button
                                            onClick={handleStartChat}
                                            className="group flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-bold shadow-[0_0_20px_-5px_rgba(255,255,255,0.4)] hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.6)] hover:scale-105 transition-all"
                                        >
                                            <Sparkles className="w-4 h-4 text-indigo-600 group-hover:rotate-12 transition-transform" />
                                            Start Conversation
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                {ingestionStatus.status === 'failed' && (
                                    <div className="pt-2">
                                        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                                            {error || "An error occurred during processing. Please try again."}
                                        </p>
                                        <button
                                            onClick={() => setIngestionStatus(null)}
                                            className="mt-4 text-sm text-gray-400 hover:text-white underline decoration-gray-600 underline-offset-4 hover:decoration-white transition-all"
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* File Error Toast */}
                {error && !ingestionStatus && (
                    <div className="mx-auto max-w-md p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 animate-fade-in">
                        <XCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm">{error}</p>
                    </div>
                )}
            </div>

            <div className="absolute bottom-8 text-xs text-gray-600 font-mono">
                SECURE UPLOAD • ENCRYPTED STORAGE
            </div>
        </div>
    );
}
