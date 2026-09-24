'use client';

import React from 'react';
import { X, CheckCircle, ShieldAlert, Sparkles } from 'lucide-react';
import { sounds } from '@/lib/sounds';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-indigo-500/40 p-6 shadow-2xl shadow-indigo-950/50 max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-xl font-black text-white">How Friends Bingo Works</h3>
        </div>

        <div className="flex flex-col gap-4 text-xs text-slate-300 leading-relaxed">
          <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex gap-3">
            <CheckCircle className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-white font-bold block mb-0.5">1. You Arrange Your Own Card</strong>
              Everyone gets numbers 1 through 25. Before the game begins, drag and drop or tap-to-swap to place them in your own secret order.
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex gap-3">
            <CheckCircle className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-white font-bold block mb-0.5">2. Take Turns Calling Numbers</strong>
              There is NO random caller. Players take turns choosing any uncalled number (1–25). When called, it is marked on EVERY player&apos;s board!
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex gap-3">
            <CheckCircle className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-white font-bold block mb-0.5">3. Complete 5 Lines to Spell B-I-N-G-O</strong>
              Lines can be horizontal (5 rows), vertical (5 columns), or diagonal (2 diagonals). Each complete line strikes through one letter:
              <div className="flex gap-2 font-mono font-bold text-amber-300 mt-1">
                <span>B (1)</span> • <span>I (2)</span> • <span>N (3)</span> • <span>G (4)</span> • <span>O (5)</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex gap-3 text-amber-200">
            <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-white font-bold block mb-0.5">Custom Rule: 5 Unique Lines Needed</strong>
              You do NOT win with 1 line. The first player to complete 5 unique lines wins the round!
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="w-full mt-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all"
        >
          Got It, Let&apos;s Play!
        </button>
      </div>
    </div>
  );
};
