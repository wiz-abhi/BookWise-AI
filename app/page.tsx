'use client';

import Link from 'next/link';
import { BookOpen, Upload, MessageSquare, Sparkles, ArrowRight, Theater, Eye, Brain, Wand2, Coffee } from 'lucide-react';
import { useEffect, useRef } from 'react';

const MODES = [
  {
    icon: Coffee,
    title: "Companion",
    desc: "A reading buddy who's read exactly as far as you. Gossip about characters, speculate together, and never get spoiled.",
    color: "from-amber-500 to-orange-500",
    textColor: "text-amber-400",
    cardClass: "mode-card-companion",
  },
  {
    icon: Theater,
    title: "Character Voice",
    desc: "Talk directly to any character — they'll respond in-character, grounded in the text. Ask Gatsby why he throws those parties.",
    color: "from-purple-500 to-violet-600",
    textColor: "text-purple-400",
    cardClass: "mode-card-character",
  },
  {
    icon: Eye,
    title: "Multi-POV Replay",
    desc: "Pick any scene and see it retold from multiple characters' perspectives. Same event, completely different stories.",
    color: "from-cyan-500 to-teal-500",
    textColor: "text-cyan-400",
    cardClass: "mode-card-pov",
  },
  {
    icon: Brain,
    title: "Motive Decoder",
    desc: "The \"why did they do that\" engine. Deep character psychology analysis backed by actual textual evidence.",
    color: "from-rose-500 to-red-500",
    textColor: "text-rose-400",
    cardClass: "mode-card-motive",
  },
  {
    icon: Wand2,
    title: "What If Explorer",
    desc: "Explore alternate paths. What would this character do if they'd chosen differently? Faithful to who they are.",
    color: "from-indigo-500 to-blue-600",
    textColor: "text-indigo-400",
    cardClass: "mode-card-whatif",
  },
];

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div
      ref={containerRef}
      className="min-h-screen relative overflow-hidden bg-black selection:bg-indigo-500/30 text-gray-100"
    >
      <div className="interactive-bg" />

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-5xl mx-auto space-y-8">

          <div className="inline-flex items-center justify-center p-2 rounded-full glass-panel mb-8 animate-fade-in">
            <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-medium border border-purple-500/20">
              ✨ Fiction reader? This is for you
            </span>
            <span className="ml-2 text-gray-400 text-sm flex items-center gap-1">
              Not a chatbot — an experience <ArrowRight className="w-3 h-3" />
            </span>
          </div>

          <h1 className="text-6xl md:text-8xl font-bold tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-white/50">
              Inhabit the
            </span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-white to-purple-300 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
              Story
            </span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed font-light">
            See every angle · Feel every motive · Live in the world.
            <br />
            <span className="text-gray-500">Upload a book, then talk to its characters, decode their motives, and explore the paths they didn't take.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
            <Link
              href="/upload"
              className="group relative px-8 py-4 bg-white text-black rounded-xl font-semibold transition-all hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5 transition-transform group-hover:-translate-y-1" />
              Upload a Book
            </Link>
            <Link
              href="/library"
              className="group px-8 py-4 glass-panel rounded-xl font-semibold transition-all hover:scale-105 hover:bg-white/10 flex items-center justify-center gap-2"
            >
              <BookOpen className="w-5 h-5 text-amber-400 group-hover:text-white transition-colors" />
              Explore Your Library
            </Link>
          </div>
        </div>

        {/* Experience Modes */}
        <div className="mt-32 space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold text-white tracking-tight">Five ways to inhabit the story</h2>
            <p className="text-gray-500 max-w-lg mx-auto">Pick a mode. Pick a character. Dive in.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MODES.map((mode, idx) => (
              <div
                key={idx}
                className={`card-3d p-8 rounded-3xl ${mode.cardClass} ${idx === 0 ? 'md:col-span-2 lg:col-span-1' : ''}`}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${mode.color} bg-opacity-20 flex items-center justify-center mb-6 border border-white/10 shadow-lg`}>
                  <mode.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3 tracking-wide">
                  {mode.title}
                </h3>
                <p className="text-gray-400 leading-relaxed text-sm">
                  {mode.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="mt-32 text-center space-y-12">
          <h2 className="text-3xl font-bold text-white">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "01", title: "Upload your book", desc: "PDF, EPUB, or TXT. We chunk it, embed it, and extract the characters automatically." },
              { step: "02", title: "Pick a mode", desc: "Companion, Character Voice, Multi-POV, Motive Decoder, or What-If — each gives you a different lens into the story." },
              { step: "03", title: "Inhabit the story", desc: "Every response is citation-backed from the actual text. No hallucinated book facts, no spoilers beyond your page." },
            ].map((item, idx) => (
              <div key={idx} className="space-y-4">
                <div className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white/20 to-white/5">{item.step}</div>
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
