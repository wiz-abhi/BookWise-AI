'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../components/AuthProvider';
import { apiRequest, libraryAPI } from '../lib/api';
import { FileText, Book as BookIcon, File, Trash2 } from 'lucide-react';

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
        e.preventDefault(); // Prevent navigation if inside a link
        if (!confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
            return;
        }

        setDeletingId(bookId);
        try {
            await libraryAPI.deleteBook(bookId);
            // Remove from state
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
                return <FileText className="h-6 w-6 text-red-500" />;
            case 'epub':
                return <BookIcon className="h-6 w-6 text-green-500" />;
            case 'txt':
                return <File className="h-6 w-6 text-gray-500" />;
            default:
                return <BookIcon className="h-6 w-6 text-indigo-600" />;
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
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-xl text-gray-600">Loading library...</div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Library</h1>
                <Link
                    href="/upload"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Upload New Book
                </Link>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {books.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            vectorEffect="non-scaling-stroke"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No books yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by uploading a new book.</p>
                    <div className="mt-6">
                        <Link
                            href="/upload"
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Upload Book
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {books.map((book) => (
                        <div key={book.id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200 relative group">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center overflow-hidden">
                                        <div className={`flex-shrink-0 rounded-md p-3 ${book.fileType === 'pdf' ? 'bg-red-50' :
                                                book.fileType === 'epub' ? 'bg-green-50' :
                                                    'bg-gray-50'
                                            }`}>
                                            {getFileIcon(book.fileType)}
                                        </div>
                                        <div className="ml-5 flex-1 min-w-0">
                                            <h3 className="text-lg font-medium text-gray-900 truncate" title={book.title}>
                                                {book.title}
                                            </h3>
                                            <p className="text-sm text-gray-500 truncate">
                                                {book.author || 'Unknown Author'}
                                            </p>
                                        </div>
                                    </div>
                                    {book.isOwner && (
                                        <button
                                            onClick={(e) => handleDelete(book.id, e)}
                                            disabled={deletingId === book.id}
                                            className="ml-2 p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                                            title="Delete book"
                                        >
                                            {deletingId === book.id ? (
                                                <div className="h-5 w-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Trash2 className="h-5 w-5" />
                                            )}
                                        </button>
                                    )}
                                </div>
                                <div className="mt-4">
                                    <div className="flex justify-between text-sm text-gray-500">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                            {getFileLabel(book.fileType)}
                                        </span>
                                        <span>{book.totalPages ? `${book.totalPages} pages` : 'Processing...'}</span>
                                    </div>
                                    <div className="mt-2 text-xs text-gray-400">
                                        Added {new Date(book.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-4 sm:px-6 flex justify-end space-x-3">
                                <Link
                                    href={`/chat?bookId=${book.id}`}
                                    className="text-indigo-600 hover:text-indigo-900 font-medium text-sm"
                                >
                                    Chat
                                </Link>
                                <Link
                                    href={`/book/${book.id}`}
                                    className="text-gray-600 hover:text-gray-900 font-medium text-sm"
                                >
                                    Details
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
