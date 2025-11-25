'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadAPI } from '@/lib/api';
import { useChatStore } from '@/lib/store';
import { Upload, FileText, Loader2, CheckCircle2, XCircle, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
    const router = useRouter();
    const { userId, setSelectedBook } = useChatStore();
    const [uploading, setUploading] = useState(false);
    const [ingestionStatus, setIngestionStatus] = useState<{
        jobId: string;
        status: string;
        progress: number;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [uploadedBook, setUploadedBook] = useState<any>(null);

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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
            <div className="container mx-auto px-4 py-16">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                                Upload a Book
                            </h1>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">
                            Upload PDF, EPUB, or TXT files to start chatting with your books
                        </p>
                    </div>

                    {/* Upload Area */}
                    {!ingestionStatus && (
                        <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${isDragActive
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-gray-800'
                                } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <input {...getInputProps()} />

                            <div className="flex flex-col items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    {uploading ? (
                                        <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
                                    ) : (
                                        <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                    )}
                                </div>

                                <div>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                        {isDragActive ? 'Drop your book here' : 'Drag & drop a book file'}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        or click to browse • PDF, EPUB, TXT • Max 100MB
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Ingestion Progress */}
                    {ingestionStatus && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                    {ingestionStatus.status === 'completed' ? (
                                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                                    ) : ingestionStatus.status === 'failed' ? (
                                        <XCircle className="w-12 h-12 text-red-500" />
                                    ) : (
                                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                                    )}
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                        {ingestionStatus.status === 'completed'
                                            ? 'Book Ready!'
                                            : ingestionStatus.status === 'failed'
                                                ? 'Processing Failed'
                                                : 'Processing Your Book...'}
                                    </h3>

                                    {uploadedBook && (
                                        <div className="flex items-center gap-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
                                            <FileText className="w-4 h-4" />
                                            <span>{uploadedBook.title}</span>
                                        </div>
                                    )}

                                    {ingestionStatus.status === 'processing' && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                                <span>Progress</span>
                                                <span>{ingestionStatus.progress}%</span>
                                            </div>
                                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 transition-all duration-500"
                                                    style={{ width: `${ingestionStatus.progress}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Extracting text, chunking, and generating embeddings...
                                            </p>
                                        </div>
                                    )}

                                    {ingestionStatus.status === 'completed' && (
                                        <div className="space-y-3">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Your book has been processed and is ready for conversations!
                                            </p>
                                            <button
                                                onClick={handleStartChat}
                                                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                                            >
                                                Start Chatting
                                            </button>
                                        </div>
                                    )}

                                    {ingestionStatus.status === 'failed' && (
                                        <p className="text-sm text-red-600 dark:text-red-400">
                                            There was an error processing your book. Please try again.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Supported Formats */}
                    <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                            Supported Formats
                        </h4>
                        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span><strong>PDF</strong> - Portable Document Format</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span><strong>EPUB</strong> - Electronic Publication</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span><strong>TXT</strong> - Plain Text</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
