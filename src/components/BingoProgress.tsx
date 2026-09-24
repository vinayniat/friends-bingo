'use client';

import React from 'react';
import { BINGO_LETTERS, ALL_LINES, WINNING_LINE_COUNT } from '@/lib/bingo';
import { LineId } from '@/types/game';
import { Sparkles } from 'lucide-react';

interface BingoProgressProps {
  completedLines: LineId[];
}

export const BingoProgress: React.FC<BingoProgressProps> = ({ completedLines }) => {
  const count = completedLines.length;
  const isWinner = count >= WINNING_LINE_COUNT;
  const lineMetaMap = new Map(ALL_LINES.map((l) => [l.id, l]));

  return (
    <div className="w-full flex flex-col items-center bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between w-full mb-3 px-1">
        <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
          Bingo Progress
        </span>
        <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
          {count >= 5 ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : null}
          {Math.min(count, 5)} / {WINNING_LINE_COUNT} Lines
        </span>
      </div>

      {/* B-I-N-G-O 5 Letter Cards */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3 w-full max-w-[380px]">
        {BINGO_LETTERS.map((letter, idx) => {
          const isCrossed = idx < count;

          return (
            <div
              key={letter}
              className={`relative flex flex-col items-center justify-center py-2.5 sm:py-3 rounded-2xl font-black text-2xl sm:text-3xl transition-all duration-300 select-none ${
                isCrossed
                  ? 'bg-gradient-to-b from-amber-500 via-orange-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/30 scale-105'
                  : 'bg-slate-800/80 border border-slate-700/60 text-slate-500'
              }`}
            >
              {/* Letter */}
              <span className="relative z-10">{letter}</span>

              {/* Strikethrough neon slash */}
              {isCrossed && (
                <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-1 bg-white rounded-full shadow-md shadow-white/80 z-20" />
              )}

              {/* Sub-label */}
              <span
                className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${
                  isCrossed ? 'text-slate-900' : 'text-slate-600'
                }`}
              >
                Line {idx + 1}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-[380px] mt-3.5">
        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/50">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-orange-400 to-emerald-400 transition-all duration-500 rounded-full"
            style={{ width: `${Math.min(100, (count / WINNING_LINE_COUNT) * 100)}%` }}
          />
        </div>
      </div>

      {/* Completed Lines Chips */}
      {completedLines.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 max-w-sm">
          {completedLines.map((id) => {
            const meta = lineMetaMap.get(id);
            return (
              <span
                key={id}
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-950/70 border border-indigo-500/40 text-indigo-300"
              >
                ✓ {meta?.label || id}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};
