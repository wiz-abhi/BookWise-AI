'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../components/AuthProvider';
import { apiRequest, libraryAPI } from '../lib/api';
import { FileText, Book as BookIcon, File, Trash2, Plus, ArrowRight, Loader } from 'lucide-react';

interface Book {
    id: string;
    title: string;
    author: string | null;
    language: string;
    fileType: string;
    totalPages: number | null;
    createdAt: string;
    isOwner: boolean;
    uploadedBy: string;
}

export default function LibraryPage() {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const router = useRouter();
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

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
            return;
        }

        if (isAuthenticated) {
            fetchLibrary();
        }
    }, [isAuthenticated, authLoading, router]);

    const fetchLibrary = async () => {
        try {
            const response = await apiRequest('/user/library');
            if (!response.ok) {
                throw new Error('Failed to fetch library');
            }
            const data = await response.json();
            setBooks(data.books);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (bookId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Stop event bubbling to card link
        if (!confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
            return;
        }

        setDeletingId(bookId);
        try {
            await libraryAPI.deleteBook(bookId);
            setBooks(books.filter(b => b.id !== bookId));
        } catch (err: any) {
            alert(err.message);
        } finally {
            setDeletingId(null);
        }
    };

    const getFileIcon = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'pdf':
                return <FileText className="h-6 w-6 text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]" />;
            case 'epub':
                return <BookIcon className="h-6 w-6 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />;
            case 'txt':
                return <File className="h-6 w-6 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" />;
            default:
                return <BookIcon className="h-6 w-6 text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]" />;
        }
    };

    const getFileLabel = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'pdf': return 'PDF';
            case 'epub': return 'EPUB';
            case 'txt': return 'TXT';
            default: return 'BOOK';
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="flex flex-col items-center gap-4">
                    <Loader className="w-8 h-8 text-indigo-500 animate-spin" />
                    <div className="text-xl text-gray-400 font-light">Loading your collection...</div>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="min-h-screen bg-black text-gray-100 pt-32 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
        >
            <div className="interactive-bg" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex justify-between items-end mb-12 animate-fade-in">
                    <div>
                        <h1 className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400 mb-2">
                            Your Library
                        </h1>
                        <p className="text-gray-400 font-light">
                            Manage and organize your personal knowledge base.
                        </p>
                    </div>
                    <Link
                        href="/upload"
                        className="hidden sm:inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium shadow-lg hover:shadow-indigo-500/30 transition-all hover:-translate-y-0.5"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Upload New Book
                    </Link>
                </div>

                {error && (
                    <div className="glass-panel border-red-500/30 bg-red-500/10 p-4 mb-8 rounded-xl text-red-200 animate-fade-in">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-500/20 rounded-lg">!</div>
                            <p>{error}</p>
                        </div>
                    </div>
                )}

                {books.length === 0 ? (
                    <div className="text-center py-20 glass-panel rounded-3xl animate-fade-in">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/10">
                            <BookIcon className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Your library is empty</h3>
                        <p className="text-gray-400 mb-8 max-w-md mx-auto">
                            Start building your personal AI-powered knowledge base by uploading your first book or document.
                        </p>
                        <Link
                            href="/upload"
                            className="inline-flex items-center px-8 py-3 rounded-xl bg-white text-black font-bold hover:scale-105 transition-transform shadow-[0_0_20px_-5px_rgba(255,255,255,0.4)]"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Upload Now
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {books.map((book, idx) => (
                            <Link
                                href={`/chat?bookId=${book.id}`}
                                key={book.id}
                                className="group block h-full animate-fade-in"
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <div className="card-3d h-full rounded-2xl glass-panel border-white/5 p-6 flex flex-col hover:border-indigo-500/30 hover:bg-white/5 transition-all duration-300">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md group-hover:bg-indigo-500/10 group-hover:border-indigo-500/30 transition-colors">
                                            {getFileIcon(book.fileType)}
                                        </div>
                                        {book.isOwner && (
                                            <button
                                                onClick={(e) => handleDelete(book.id, e)}
                                                disabled={deletingId === book.id}
                                                className="p-2 text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-white/5"
                                                title="Delete book"
                                            >
                                                {deletingId === book.id ? (
                                                    <Loader className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex-1 mb-6">
                                        <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-indigo-300 transition-colors" title={book.title}>
                                            {book.title}
                                        </h3>
                                        <p className="text-sm text-gray-400 line-clamp-1">
                                            {book.author || 'Unknown Author'}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs text-gray-500">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-1 rounded bg-white/5 border border-white/5 uppercase font-medium tracking-wider">
                                                {getFileLabel(book.fileType)}
                                            </span>
                                            <span>{book.totalPages ? `${book.totalPages} pgs` : 'Processing...'}</span>
                                        </div>
                                        <div className="flex items-center gap-1 group-hover:text-indigo-400 transition-colors">
                                            Chat <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>

                                    {/* Hover Glow Effect */}
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-500 pointer-events-none" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Mobile Upload Button (FAB) */}
            <Link
                href="/upload"
                className="fixed bottom-6 right-6 sm:hidden w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-500/40 z-40 active:scale-95 transition-transform"
            >
                <Plus className="w-6 h-6" />
            </Link>
        </div>
    );
}
