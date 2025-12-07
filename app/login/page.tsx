'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '../components/AuthProvider';
import { apiRequest } from '../lib/api';
import { Sparkles, ArrowRight, BookOpen } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await apiRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            login(data.token, data.user);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            ref={containerRef}
            className="min-h-screen bg-black text-gray-100 flex items-center justify-center p-4 pt-28 relative overflow-hidden"
        >
            <div className="interactive-bg" />

            <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center relative z-10">

                {/* Visual Section (Right side on desktop, top on mobile) */}
                <div className="hidden lg:flex flex-col items-center justify-center space-y-8 animate-float order-2">
                    <div className="relative w-80 h-96 group perspective-1000">
                        {/* Abstract Book/Card Visualization */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl blur-2xl transform group-hover:scale-110 transition-transform duration-700" />
                        <div className="relative w-full h-full glass-panel rounded-2xl border-white/10 flex flex-col items-center justify-center p-8 transform rotate-y-12 group-hover:rotate-y-0 transition-all duration-700 shadow-2xl shadow-indigo-500/10">
                            <Sparkles className="w-16 h-16 text-indigo-400 mb-6" />
                            <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-purple-200 text-center mb-4">
                                Deep Knowledge
                            </h3>
                            <p className="text-gray-400 text-center leading-relaxed">
                                "A book is a dream that you hold in your hand."
                            </p>
                            <div className="mt-8 flex gap-2">
                                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse delay-75" />
                                <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse delay-150" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Login Form Section */}
                <div className="order-1 w-full max-w-md mx-auto">
                    <div className="glass-panel rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden animate-fade-in">

                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                        <div className="mb-10">
                            <Link href="/" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors mb-6 group">
                                <BookOpen className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                <span className="font-medium">Back to Home</span>
                            </Link>
                            <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">Welcome Back</h2>
                            <p className="text-gray-400">Enter your credentials to access your library.</p>
                        </div>

                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">Example Email</label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all hover:bg-white/10"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">Password</label>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all hover:bg-white/10"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full group relative flex justify-center items-center py-3.5 px-4 rounded-xl text-white font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-indigo-500 transition-all shadow-lg hover:shadow-indigo-500/25 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Sign in
                                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-gray-400 text-sm">
                                Don't have an account?{' '}
                                <Link href="/signup" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                                    Create account
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
