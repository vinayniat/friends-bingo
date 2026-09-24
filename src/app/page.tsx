'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Grid3X3, Sparkles, Trophy, Users, Zap } from 'lucide-react';
import { sounds } from '@/lib/sounds';
import { RulesModal } from '@/components/RulesModal';

const features = [
  { icon: Trophy, title: '5 Lines to Win', text: 'Complete every letter in B-I-N-G-O.' },
  { icon: Users, title: 'Multiplayer', text: 'Play together in one cheerful room.' },
  { icon: Grid3X3, title: 'Numbers 1–25', text: 'Arrange your own winning board.' },
  { icon: Zap, title: 'Real-time Game', text: 'Every call syncs instantly.' },
];

export default function HomePage() {
  const [showRules, setShowRules] = useState(false);
  const preview = Array.from({ length: 25 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#1E293B]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#6366F1] text-2xl font-black text-white shadow-lg shadow-indigo-200">B</span>
          <span className="text-lg font-black tracking-tight sm:text-xl">CLASS BINGO</span>
        </Link>
        <button onClick={() => { sounds.playClick(); setShowRules(true); }} className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-bold text-[#64748B] shadow-sm transition hover:border-indigo-200 hover:text-[#6366F1]">
          How to play
        </button>
      </header>

      <main className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-12 pt-8 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:pt-16">
        <section>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-[#6366F1]">
            <Sparkles className="h-4 w-4" /> Classroom challenge
          </div>
          <h1 className="max-w-xl text-5xl font-black leading-[1.02] tracking-tight sm:text-7xl">
            Your next <span className="text-[#6366F1]">BINGO</span> adventure starts here.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-[#64748B]">
            Arrange your numbers, complete 5 lines, cross B-I-N-G-O and win!
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/create" onClick={() => sounds.playClick()} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#6366F1] px-7 py-4 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-500">
              Play Bingo <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/join" onClick={() => sounds.playClick()} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#E2E8F0] bg-white px-7 py-4 text-sm font-black uppercase tracking-wide text-[#6366F1] shadow-sm transition hover:border-indigo-200">
              Join a room
            </Link>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
                <Icon className="mb-3 h-5 w-5 text-[#F59E0B]" />
                <p className="text-sm font-extrabold">{title}</p>
                <p className="mt-1 text-xs leading-5 text-[#64748B]">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-[#E2E8F0] bg-white p-5 shadow-xl shadow-slate-200/70 sm:p-7">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#6366F1]">Live classroom</p>
              <h2 className="mt-1 text-xl font-black">Arrange. Call. Complete.</h2>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-[#22C55E]">Demo board</span>
          </div>
          <div className="mb-4 grid grid-cols-5 gap-2">
            {preview.map((number, index) => (
              <div key={number} className={`flex aspect-square items-center justify-center rounded-xl border text-base font-black sm:text-xl ${index < 5 ? 'border-amber-300 bg-amber-50 text-[#F59E0B]' : index % 3 === 0 ? 'border-emerald-200 bg-emerald-50 text-[#22C55E]' : 'border-[#E2E8F0] bg-[#F7F9FC] text-[#1E293B]'}`}>
                {number}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-indigo-50 px-4 py-3">
            <span className="text-xs font-black uppercase tracking-wider text-[#64748B]">Progress</span>
            <div className="flex gap-1.5">
              {['B', 'I', 'N', 'G', 'O'].map((letter, i) => <span key={letter} className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black ${i === 0 ? 'bg-[#F59E0B] text-white line-through' : 'bg-white text-[#94A3B8]'}`}>{letter}</span>)}
            </div>
          </div>
          <div className="mt-5 flex items-center gap-2 text-sm font-bold text-[#22C55E]"><CheckCircle2 className="h-5 w-5" /> One line complete!</div>
        </section>
      </main>
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
}
