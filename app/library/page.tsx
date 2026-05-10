'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Book as BookType, useChatStore } from '@/lib/store';
import { userAPI } from '@/lib/api';
import { progressAPI, modeAPI } from '@/app/lib/api';
import {
    BookOpen,
    Plus,
    Search,
    Clock,
    MoreVertical,
    Sparkles,
    PlayCircle,
    Book,
    Heart,
    Feather,
    Rocket,
    GraduationCap,
    MoreHorizontal,
    Compass,
    Users,
    Trash2
} from 'lucide-react';
import { motion } from 'framer-motion';

// Mock data extension since backend doesn't support these fields yet
export interface EnhancedBook extends BookType {
    category?: string;
    progress?: { currentPage: number, totalPages: number | null };
    lastRead?: Date;
    characterCount?: number;
}

const CATEGORIES = [
    { id: 'fiction', name: 'Fiction', icon: Book, color: 'from-blue-500 to-indigo-600' },
    { id: 'romance', name: 'Romance', icon: Heart, color: 'from-pink-500 to-rose-500' },
    { id: 'poetry', name: 'Poetry', icon: Feather, color: 'from-purple-500 to-fuchsia-600' },
    { id: 'scifi', name: 'Sci-Fi', icon: Rocket, color: 'from-cyan-500 to-blue-600' },
    { id: 'academic', name: 'Academic', icon: GraduationCap, color: 'from-emerald-500 to-teal-600' },
];

export default function LibraryPage() {
    const router = useRouter();
    const { setSelectedBook, userId } = useChatStore();
    const [books, setBooks] = useState<EnhancedBook[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Mouse spotlight effect
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

    const fetchBooks = async () => {
        try {
            setLoading(true);
            const [data, progressData] = await Promise.all([
                userAPI.getUserLibrary(userId),
                progressAPI.getAll().catch(() => ({ progress: [] }))
            ]);

            const progressMap = new Map<string, { currentPage: number, totalPages: number | null, lastReadAt: string }>(
                progressData.progress?.map((p: any) => [p.bookId, p]) || []
            );

            // Fetch character counts concurrently for all books
            const characterCounts = await Promise.all(
                (data.books || []).map((book: any) => 
                    modeAPI.getCharacters(book.id)
                        .then(res => ({ bookId: book.id, count: res.characters?.length || 0 }))
                        .catch(() => ({ bookId: book.id, count: 0 }))
                )
            );
            const countMap = new Map(characterCounts.map(c => [c.bookId, c.count]));

            const enrichedBooks = (data.books || []).map((book: any, index: number) => {
                const prog = progressMap.get(book.id);
                return {
                    ...book,
                    category: CATEGORIES[index % CATEGORIES.length].id, // Still demo category
                    progress: prog ? { currentPage: prog.currentPage, totalPages: prog.totalPages } : undefined,
                    lastRead: prog?.lastReadAt ? new Date(prog.lastReadAt) : new Date(book.createdAt),
                    characterCount: countMap.get(book.id) || 0,
                };
            });

            setBooks(enrichedBooks);
        } catch (error) {
            console.error('Failed to fetch library:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBooks();
    }, [userId]);

    // Group books by category
    const categorizedBooks = CATEGORIES.reduce((acc, category) => {
        acc[category.id] = books.filter(book => book.category === category.id);
        return acc;
    }, {} as Record<string, EnhancedBook[]>);

    // Get recently read books (actual logic)
    const recentBooks = [...books]
        .filter(b => b.progress !== undefined)
        .sort((a, b) => (b.lastRead?.getTime() || 0) - (a.lastRead?.getTime() || 0))
        .slice(0, 5);

    const handleOpenBook = (book: EnhancedBook) => {
        setSelectedBook(book);
        router.push(`/library/book/${book.id}`);
    };

    const handleDeleteBook = async (e: React.MouseEvent, bookId: string) => {
        e.stopPropagation(); // Prevent opening book
        if (!confirm('Are you sure you want to delete this book? This cannot be undone.')) return;

        try {
            await userAPI.deleteBook(bookId);
            setBooks(books.filter(b => b.id !== bookId));
            // Also update selected book if it's the one being deleted
            // if (selectedBook?.id === bookId) setSelectedBook(null); 
        } catch (error) {
            console.error('Failed to delete book:', error);
            alert('Failed to delete book. Please try again.');
        }
    };

    return (
        <div
            ref={containerRef}
            className="min-h-screen bg-black text-gray-100 pt-32 pb-12 px-4 sm:px-6 relative overflow-x-hidden"
        >
            <div className="interactive-bg" />

            <div className="max-w-7xl mx-auto space-y-12 relative z-10">

                {/* Header & Search */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Library</h1>
                        <p className="text-gray-400">Your personal collection of knowledge.</p>
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search title, author..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:bg-white/10 focus:border-indigo-500/50 transition-all text-sm text-gray-200 placeholder-gray-500"
                            />
                        </div>
                        <button
                            onClick={() => router.push('/upload')}
                            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium shadow-lg hover:shadow-indigo-500/25 transition-all active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Add Book</span>
                        </button>
                    </div>
                </div>

                {/* Continue Reading Section */}
                {recentBooks.length > 0 && (
                    <section className="space-y-4 animate-fade-in">
                        <div className="flex items-center gap-2 text-xl font-bold text-white">
                            <Clock className="w-5 h-5 text-indigo-400" />
                            <h2>Continue Reading</h2>
                        </div>

                        <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent snap-x">
                            {recentBooks.map((book) => (
                                <div
                                    key={book.id}
                                    onClick={() => handleOpenBook(book)}
                                    className="flex-shrink-0 w-72 group cursor-pointer snap-start"
                                >
                                    <div className="glass-panel p-4 rounded-2xl border-white/5 hover:border-indigo-500/30 hover:bg-white/5 transition-all duration-300 relative overflow-hidden h-full">
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                                        <div className="flex gap-4">
                                            {/* Minimal Cover */}
                                            <div className="w-20 h-28 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl flex items-center justify-center border border-white/10 group-hover:scale-105 transition-transform duration-500">
                                                <BookOpen className="w-8 h-8 text-gray-600 group-hover:text-indigo-400 transition-colors" />
                                            </div>

                                            <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                                <div>
                                                    <h3 className="font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                                                        {book.title}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 truncate">
                                                        {book.author || 'Unknown Author'}
                                                    </p>
                                                </div>

                                                <div className="space-y-2">
                                                    {book.progress && (
                                                        <div className="flex-1 max-w-[200px]">
                                                            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                                                                <span>pg {book.progress.currentPage}{book.progress.totalPages ? ` / ${book.progress.totalPages}` : ''}</span>
                                                                <span>{book.progress.totalPages ? Math.round((book.progress.currentPage / book.progress.totalPages) * 100) : 0}%</span>
                                                            </div>
                                                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                                                    style={{ width: `${book.progress.totalPages ? (book.progress.currentPage / book.progress.totalPages) * 100 : 5}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}</div>
                                            </div>
                                        </div>

                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0 duration-300">
                                            <PlayCircle className="w-8 h-8 text-white drop-shadow-lg" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Categorized Bookshelves */}
                <div className="space-y-12 pb-20">
                    {CATEGORIES.map((category) => {
                        const categoryBooks = categorizedBooks[category.id] || [];
                        if (categoryBooks.length === 0) return null;

                        const Icon = category.icon;

                        return (
                            <section key={category.id} className="space-y-6 animate-fade-in">
                                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                                    <div className={`p-2 rounded-lg bg-gradient-to-br ${category.color} bg-opacity-20`}>
                                        <Icon className="w-5 h-5 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">{category.name}</h2>
                                    <span className="text-sm text-gray-500 font-mono ml-auto">
                                        {categoryBooks.length} Books
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                    {categoryBooks.map((book) => (
                                        <motion.div
                                            key={book.id}
                                            whileHover={{ y: -5 }}
                                            onClick={() => handleOpenBook(book)}
                                            className="group cursor-pointer"
                                        >
                                            <div className="relative aspect-[2/3] mb-4 rounded-lg bg-gray-900 border border-white/10 shadow-lg overflow-hidden transition-all group-hover:shadow-[0_0_30px_-10px_rgba(255,255,255,0.2)]">
                                                {/* Gradient Cover Mock */}
                                                <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-20 group-hover:opacity-30 transition-opacity`} />

                                                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                                                    <BookOpen className="w-8 h-8 text-white/50 mb-2 group-hover:scale-110 transition-transform duration-300" />
                                                    <h3 className="text-sm font-bold text-white/90 line-clamp-3 leading-tight">
                                                        {book.title}
                                                    </h3>
                                                </div>

                                                {/* Hover Overlay */}
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px] flex flex-col items-center justify-center p-4 gap-3">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); router.push(`/book/${book.id}/modes`); }}
                                                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full transform scale-90 group-hover:scale-100 transition-all hover:scale-105 flex items-center gap-1.5"
                                                    >
                                                        <Compass className="w-3.5 h-3.5" /> Explore
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleOpenBook(book); }}
                                                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-full transform scale-90 group-hover:scale-100 transition-all border border-white/20"
                                                    >
                                                        Read
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDeleteBook(e, book.id)}
                                                        className="p-2 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all transform scale-90 group-hover:scale-100"
                                                        title="Delete Book"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <h3 className="text-sm font-medium text-gray-200 truncate group-hover:text-white transition-colors">
                                                    {book.title}
                                                </h3>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {book.author || 'Unknown'}
                                                </p>
                                                {book.characterCount ? (
                                                    <p className="text-[10px] text-gray-600 flex items-center gap-1 mt-1">
                                                        <Users className="w-3 h-3" /> {book.characterCount} chars
                                                    </p>
                                                ) : null}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </section>
                        );
                    })}

                    {/* Fallback for Uncategorized / Others if needed */}
                    {/* ... */}
                </div>
            </div>
        </div>
    );
}
