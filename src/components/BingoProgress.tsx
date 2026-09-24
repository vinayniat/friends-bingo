'use client';

import React from 'react';
import { BINGO_LETTERS, ALL_LINES, WINNING_LINE_COUNT } from '@/lib/bingo';
import { LineId } from '@/types/game';
import { CheckCircle2 } from 'lucide-react';

export const BingoProgress: React.FC<{ completedLines: LineId[] }> = ({ completedLines }) => {
  const count = completedLines.length;
  const lineMetaMap = new Map(ALL_LINES.map((line) => [line.id, line]));
  return (
    <div className="w-full rounded-3xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-widest text-[#64748B]">Bingo progress</span>
        <span className="text-sm font-black text-[#6366F1]">{Math.min(count, 5)} / {WINNING_LINE_COUNT} Lines Completed</span>
      </div>
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {BINGO_LETTERS.map((letter, index) => {
          const crossed = index < count;
          return (
            <div key={letter} className={`relative flex flex-col items-center justify-center rounded-2xl border py-3 transition-all ${crossed ? 'border-amber-300 bg-amber-50 text-[#F59E0B] shadow-sm' : 'border-[#E2E8F0] bg-[#F7F9FC] text-[#94A3B8]'}`}>
              <span className={`text-3xl font-black ${crossed ? 'line-through decoration-2' : ''}`}>{letter}</span>
              {crossed && <CheckCircle2 className="mt-1 h-4 w-4 text-[#22C55E]" />}
              {!crossed && <span className="mt-1 text-[9px] font-bold uppercase tracking-wider">Line {index + 1}</span>}
            </div>
          );
        })}
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-indigo-50">
        <div className="h-full rounded-full bg-[#6366F1] transition-all duration-500" style={{ width: `${Math.min(100, (count / WINNING_LINE_COUNT) * 100)}%` }} />
      </div>
      {completedLines.length > 0 && <div className="mt-4 flex flex-wrap justify-center gap-2">{completedLines.map((id) => <span key={id} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-[#22C55E]">✓ {lineMetaMap.get(id)?.label || id}</span>)}</div>}
    </div>
  );
};
