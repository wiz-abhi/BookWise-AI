'use client';

import Link from 'next/link';
import { BookOpen, Upload, MessageSquare, Sparkles, ArrowRight } from 'lucide-react';
import { useEffect, useRef } from 'react';

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
            <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-medium border border-indigo-500/20">
              New: Gemini 2.0 Integration
            </span>
            <span className="ml-2 text-gray-400 text-sm flex items-center gap-1">
              Experienced intelligent conversations <ArrowRight className="w-3 h-3" />
            </span>
          </div>

          <h1 className="text-6xl md:text-8xl font-bold tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-white/50">
              Your AI-Powered
            </span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white to-purple-300 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
              Book Companion
            </span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed font-light">
            Upload your library and engage in deep, citation-backed conversations.
            Experience literature and documentation in a completely new dimension.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
            <Link
              href="/upload"
              className="group relative px-8 py-4 bg-white text-black rounded-xl font-semibold transition-all hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5 transition-transform group-hover:-translate-y-1" />
              Upload Document
            </Link>
            <Link
              href="/chat"
              className="group px-8 py-4 glass-panel rounded-xl font-semibold transition-all hover:scale-105 hover:bg-white/10 flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-5 h-5 text-indigo-400 group-hover:text-white transition-colors" />
              Start Conversation
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-32">
          {[
            {
              icon: Upload,
              title: "Multi-Format Ingestion",
              desc: "Seamlessly parse PDF, EPUB, and TXT files with advanced OCR capabilities for scanned documents.",
              color: "text-blue-400"
            },
            {
              icon: Sparkles,
              title: "Context-Aware Intelligence",
              desc: "Powered by Gemini 2.0 Flash for pinpoint accuracy and deep contextual understanding of your content.",
              color: "text-purple-400"
            },
            {
              icon: MessageSquare,
              title: "Adaptive Personas",
              desc: "Switch between Scholar, Friend, or Quizzer modes to tailor the interaction to your learning style.",
              color: "text-pink-400"
            }
          ].map((feature, idx) => (
            <div
              key={idx}
              className="card-3d p-8 rounded-3xl"
            >
              <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 ${feature.color}`}>
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 tracking-wide">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
