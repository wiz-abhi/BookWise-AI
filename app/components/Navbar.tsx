'use client';

import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { BookOpen, LogOut, User } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const { user, logout, isAuthenticated } = useAuth();
    const pathname = usePathname();
    const navRef = useRef<HTMLElement>(null);
    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
    const [isHoveringNav, setIsHoveringNav] = useState(false);
    const [isHoveringLink, setIsHoveringLink] = useState(false);

    useEffect(() => {
        const nav = navRef.current;
        if (!nav) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = nav.getBoundingClientRect();
            setCursorPosition({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
        };

        const handleMouseEnter = () => setIsHoveringNav(true);
        const handleMouseLeave = () => setIsHoveringNav(false);

        // Add event listeners to all interactive elements to trigger "magnify" state
        const handleLinkEnter = () => setIsHoveringLink(true);
        const handleLinkLeave = () => setIsHoveringLink(false);

        nav.addEventListener('mousemove', handleMouseMove);
        nav.addEventListener('mouseenter', handleMouseEnter);
        nav.addEventListener('mouseleave', handleMouseLeave);

        // Attach listeners to interactive children using delegation
        // In a real app we might do this more granularly, but this works for the contained navbar
        const interactiveElements = nav.querySelectorAll('a, button');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', handleLinkEnter);
            el.addEventListener('mouseleave', handleLinkLeave);
        });

        // Re-attach if DOM changes (simplified for this scope, ideally utilize MutationObserver or specific Link wrappers)
        // For this specific static navbar structure, one-time attach is mostly fine, 
        // but let's wrap logic in a function if we needed re-runs. 
        // Given React re-renders, we might miss dynamic updates. 
        // Better approach: Pass `onMouseEnter={() => setIsHoveringLink(true)}` to NavLink components.

        return () => {
            nav.removeEventListener('mousemove', handleMouseMove);
            nav.removeEventListener('mouseenter', handleMouseEnter);
            nav.removeEventListener('mouseleave', handleMouseLeave);
            interactiveElements.forEach(el => {
                el.removeEventListener('mouseenter', handleLinkEnter);
                el.removeEventListener('mouseleave', handleLinkLeave);
            });
        };
    }, []); // Hook dependency is empty, but we'll handle the event attachment better in the JSX for children.

    // Hide navbar on book reader page
    if (pathname?.startsWith('/library/book/')) {
        return null;
    }

    return (
        <>
            {/* Scroll Fade Mask */}
            <div
                className="fixed top-0 left-0 right-0 h-32 bg-gradient-to-b from-black via-black/80 to-transparent z-40 pointer-events-none transition-opacity duration-300"
                aria-hidden="true"
            />

            <nav
                ref={navRef}
                className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-5xl transition-all duration-500 ease-out ${isHoveringNav ? 'cursor-none' : ''}`}
            >
                {/* Custom Cursor Element - Magnifying Glass Style */}
                <div
                    className="pointer-events-none absolute bg-white/10 border border-white/40 rounded-full z-50 transition-all duration-150 ease-out flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)] opacity-0 data-[visible=true]:opacity-100"
                    data-visible={isHoveringNav}
                    style={{
                        width: isHoveringLink ? '48px' : '32px', // Expands slightly on links
                        height: isHoveringLink ? '48px' : '32px',
                        transform: `translate(${cursorPosition.x - (isHoveringLink ? 24 : 16)}px, ${cursorPosition.y - (isHoveringLink ? 24 : 16)}px)`,
                    }}
                />

                {/* "Radiant" Navbar Container */}
                <div className="glass-nav rounded-2xl px-6 py-3 transition-all duration-500 hover:bg-white/10 border border-white/20 shadow-[0_0_20px_-5px_rgba(255,255,255,0.5)] hover:shadow-[0_0_40px_-5px_rgba(255,255,255,0.7)] group">
                    {/* Simulated "Sparkles" or "Rays" via pseudo-elements can be tricky in Tailwind, keeping it clean with strong shadows */}

                    <div className="flex justify-between items-center relative z-10">
                        {/* Logo Section */}
                        <Link
                            href="/"
                            className="flex items-center gap-3 group/logo"
                            onMouseEnter={() => setIsHoveringLink(true)}
                            onMouseLeave={() => setIsHoveringLink(false)}
                        >
                            <div className="p-2 rounded-lg bg-indigo-500/20 group-hover/logo:bg-indigo-500/40 transition-colors border border-indigo-400/30">
                                <BookOpen className="w-5 h-5 text-indigo-300 group-hover/logo:text-white transition-colors" />
                            </div>
                            <span className="text-xl font-bold text-white tracking-wide drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                                BookBuddy
                            </span>
                        </Link>

                        {/* Navigation Links - Desktop */}
                        <div className="hidden md:flex items-center gap-2">
                            <NavLink href="/" setHover={setIsHoveringLink}>Home</NavLink>
                            <NavLink href="/chat" setHover={setIsHoveringLink}>Chat</NavLink>
                            <NavLink href="/upload" setHover={setIsHoveringLink}>Upload</NavLink>
                            {isAuthenticated && <NavLink href="/library" setHover={setIsHoveringLink}>Library</NavLink>}
                        </div>

                        {/* Auth Section */}
                        <div className="flex items-center gap-4">
                            {isAuthenticated ? (
                                <div className="flex items-center gap-4 pl-4 border-l border-white/20">
                                    <div className="hidden sm:flex items-center gap-2 text-sm text-white/80 font-medium">
                                        <User className="w-4 h-4" />
                                        <span className="truncate max-w-[150px]">{user?.name || user?.email}</span>
                                    </div>
                                    <button
                                        onClick={logout}
                                        onMouseEnter={() => setIsHoveringLink(true)}
                                        onMouseLeave={() => setIsHoveringLink(false)}
                                        className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-red-400 transition-colors"
                                        title="Logout"
                                    >
                                        <LogOut className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 pl-4 border-l border-white/20">
                                    <Link
                                        href="/login"
                                        onMouseEnter={() => setIsHoveringLink(true)}
                                        onMouseLeave={() => setIsHoveringLink(false)}
                                        className="text-sm font-medium text-white/80 hover:text-white transition-all hover:scale-105 hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        href="/signup"
                                        onMouseEnter={() => setIsHoveringLink(true)}
                                        onMouseLeave={() => setIsHoveringLink(false)}
                                        className="px-5 py-2 rounded-xl bg-white text-black text-sm font-bold transition-all shadow-[0_0_15px_-3px_rgba(255,255,255,0.4)] hover:shadow-[0_0_20px_0px_rgba(255,255,255,0.6)] hover:scale-105"
                                    >
                                        Sign up
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
        </>
    );
}

function NavLink({ href, children, setHover }: { href: string; children: React.ReactNode; setHover: (v: boolean) => void }) {
    return (
        <Link
            href={href}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            className="relative px-4 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white transition-all duration-200 group overflow-hidden hover:scale-110"
        >
            <span className="relative z-10 drop-shadow-sm group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">{children}</span>
        </Link>
    );
}
