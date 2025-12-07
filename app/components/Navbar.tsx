'use client';

import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { BookOpen, LogOut, User } from 'lucide-react';

export default function Navbar() {
    const { user, logout, isAuthenticated } = useAuth();

    return (
        <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-5xl">
            <div className="glass-nav rounded-2xl px-6 py-3 transition-all duration-300 hover:bg-black/40">
                <div className="flex justify-between items-center">
                    {/* Logo Section */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="p-2 rounded-lg bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors">
                            <BookOpen className="w-5 h-5 text-indigo-400" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent group-hover:from-indigo-300 group-hover:to-purple-300 transition-all">
                            BookBuddy
                        </span>
                    </Link>

                    {/* Navigation Links - Desktop */}
                    <div className="hidden md:flex items-center gap-1">
                        <NavLink href="/">Home</NavLink>
                        <NavLink href="/chat">Chat</NavLink>
                        <NavLink href="/upload">Upload</NavLink>
                        {isAuthenticated && <NavLink href="/library">Library</NavLink>}
                    </div>

                    {/* Auth Section */}
                    <div className="flex items-center gap-4">
                        {isAuthenticated ? (
                            <div className="flex items-center gap-4 pl-4 border-l border-white/10">
                                <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
                                    <User className="w-4 h-4" />
                                    <span className="truncate max-w-[150px]">{user?.name || user?.email}</span>
                                </div>
                                <button
                                    onClick={logout}
                                    className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-red-400 transition-colors"
                                    title="Logout"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                                <Link
                                    href="/login"
                                    className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/signup"
                                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-lg hover:shadow-indigo-500/25"
                                >
                                    Sign up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            className="relative px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-all duration-300 group overflow-hidden"
        >
            <span className="relative z-10">{children}</span>
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
        </Link>
    );
}
