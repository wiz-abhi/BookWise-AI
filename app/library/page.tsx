'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Book as BookType, useChatStore } from '@/lib/store';
import { userAPI, uploadAPI } from '@/lib/api';
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
    GraduationCap
} from 'lucide-react';
import { motion } from 'framer-motion';

// Mock data extension since backend doesn't support these fields yet
interface EnhancedBook extends BookType {
    category?: string;
    progress?: number;
    coverColor?: string;
    lastRead?: Date;
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
            const data = await userAPI.getUserLibrary(userId);

            // Backend returns wrapped object { books: [...] }
            const enrichedBooks = (data.books || []).map((book: any, index: number) => ({
                ...book,
                // Randomly assign category for demo
                category: CATEGORIES[index % CATEGORIES.length].id,
                // Mock progress for some books
                progress: Math.random() > 0.3 ? Math.floor(Math.random() * 100) : 0,
                // Mock last read time
                lastRead: new Date(Date.now() - Math.random() * 10000000000),
            }));

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

    // Get recently read books (mock logic)
    const recentBooks = [...books]
        .filter(b => (b.progress || 0) > 0)
        .sort((a, b) => (b.lastRead?.getTime() || 0) - (a.lastRead?.getTime() || 0))
        .slice(0, 5);

    const handleOpenBook = (book: EnhancedBook) => {
        setSelectedBook(book);
        router.push(`/library/book/${book.id}`);
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
                                                    <div className="flex justify-between text-xs text-gray-400">
                                                        <span>Progress</span>
                                                        <span>{book.progress}%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                                            style={{ width: `${book.progress}%` }}
                                                        />
                                                    </div>
                                                </div>
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
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px] flex flex-col items-center justify-center p-4">
                                                    <button className="px-4 py-2 bg-white text-black text-xs font-bold rounded-full transform scale-90 group-hover:scale-100 transition-all">
                                                        Read Now
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
