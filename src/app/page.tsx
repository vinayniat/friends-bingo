'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Users, Trophy, Play, ArrowRight, Grid3X3, Volume2 } from 'lucide-react';
import { sounds } from '@/lib/sounds';
import { RulesModal } from '@/components/RulesModal';

export default function HomePage() {
  const [showRules, setShowRules] = useState(false);

  // Decorative preview board numbers
  const previewCells = [
    { num: 12, called: true, line: true },
    { num: 5, called: true, line: true },
    { num: 21, called: true, line: true },
    { num: 3, called: true, line: true },
    { num: 17, called: true, line: true }, // Row 1 complete!
    { num: 8, called: false, line: false },
    { num: 24, called: true, line: false },
    { num: 1, called: false, line: false },
    { num: 19, called: true, line: false },
    { num: 10, called: false, line: false },
    { num: 15, called: true, line: false },
    { num: 7, called: true, line: false },
    { num: 23, called: false, line: false },
    { num: 11, called: false, line: false },
    { num: 4, called: false, line: false },
    { num: 20, called: false, line: false },
    { num: 2, called: true, line: false },
    { num: 14, called: false, line: false },
    { num: 25, called: true, line: false },
    { num: 6, called: false, line: false },
    { num: 18, called: false, line: false },
    { num: 9, called: false, line: false },
    { num: 16, called: false, line: false },
    { num: 13, called: true, line: false },
    { num: 22, called: false, line: false },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500 selection:text-white flex flex-col justify-between relative overflow-hidden">
      {/* Background Neon Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-indigo-600/20 via-purple-600/10 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-pink-600/10 blur-3xl pointer-events-none -z-10" />
      <div className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-emerald-600/10 blur-3xl pointer-events-none -z-10" />

      {/* Top Navbar */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-indigo-500/30">
            B
          </span>
          <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
            FRIENDS BINGO
          </span>
        </div>

        <button
          onClick={() => {
            sounds.playClick();
            setShowRules(true);
          }}
          className="px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-xs font-bold text-slate-300 hover:text-white transition-all hover:scale-105 active:scale-95"
        >
          Game Rules
        </button>
      </header>

      {/* Hero Section */}
      <main className="w-full max-w-6xl mx-auto px-6 py-8 flex flex-col lg:flex-row items-center justify-between gap-12 my-auto">
        {/* Left Column: Headline & CTA */}
        <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold tracking-wider uppercase mb-5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Real-Time Multiplayer Experience</span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-[1.08] text-white">
            FRIENDS{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              BINGO
            </span>
          </h1>

          <p className="mt-3 text-xl sm:text-2xl font-bold text-amber-400 tracking-wide">
            Arrange. Call. Complete. BINGO!
          </p>

          <p className="mt-4 text-sm sm:text-base text-slate-400 leading-relaxed max-w-md">
            Create a private room, arrange numbers 1–25 your way, and take turns calling numbers.
            Complete five lines to spell <strong className="text-white">BINGO</strong> and take the crown!
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3.5 mt-8 w-full sm:w-auto">
            <Link
              href="/create"
              onClick={() => sounds.playClick()}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Create Game</span>
            </Link>

            <Link
              href="/join"
              onClick={() => sounds.playClick()}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-750 text-white font-black text-sm uppercase tracking-wider border border-slate-700 shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Join Game</span>
            </Link>
          </div>

          {/* Quick Perks */}
          <div className="grid grid-cols-3 gap-3 mt-10 w-full pt-8 border-t border-slate-800/80">
            <div className="flex flex-col items-center lg:items-start">
              <span className="text-xl font-black text-white">1–25</span>
              <span className="text-[11px] text-slate-400 font-medium">Custom Card</span>
            </div>
            <div className="flex flex-col items-center lg:items-start">
              <span className="text-xl font-black text-white">Turn-Based</span>
              <span className="text-[11px] text-slate-400 font-medium">No Random Caller</span>
            </div>
            <div className="flex flex-col items-center lg:items-start">
              <span className="text-xl font-black text-amber-400">5 Lines</span>
              <span className="text-[11px] text-slate-400 font-medium">Spells B-I-N-G-O</span>
            </div>
          </div>
        </div>

        {/* Right Column: Animated Interactive Preview Board */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
          <div className="relative p-4 rounded-3xl bg-slate-900/90 border border-indigo-500/30 shadow-2xl shadow-indigo-950/60 backdrop-blur-xl max-w-[380px] w-full">
            {/* Header info */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-extrabold uppercase text-slate-300">Live Demo Board</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                1 / 5 Lines
              </span>
            </div>

            {/* 5x5 Preview Board */}
            <div className="grid grid-cols-5 gap-1.5 aspect-square w-full">
              {previewCells.map((cell, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col items-center justify-center rounded-xl font-black text-base select-none transition-all duration-300 aspect-square ${
                    cell.line
                      ? 'bg-amber-500/30 border-2 border-amber-400 text-amber-200 shadow-md shadow-amber-500/20 scale-105'
                      : cell.called
                      ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-800/90 border border-slate-700/60 text-slate-300'
                  }`}
                >
                  <span className={cell.called ? 'line-through decoration-emerald-400' : ''}>
                    {cell.num}
                  </span>
                </div>
              ))}
            </div>

            {/* B-I-N-G-O progress demo */}
            <div className="mt-3.5 pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Progress:
              </span>
              <div className="flex gap-1.5 font-black text-sm">
                <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 line-through">B</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">I</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">N</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">G</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">O</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <span>FRIENDS BINGO — Custom Multiplayer Game</span>
        <span>Built for friends &amp; family</span>
      </footer>

      {/* Rules Modal */}
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
}
