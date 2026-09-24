'use client';

import React from 'react';
import { History, Sparkles } from 'lucide-react';

interface CalledNumbersProps {
  calledNumbers: number[];
}

export const CalledNumbers: React.FC<CalledNumbersProps> = ({ calledNumbers }) => {
  const latestNumber = calledNumbers.length > 0 ? calledNumbers[calledNumbers.length - 1] : null;
  const history = [...calledNumbers].reverse();

  return (
    <div className="w-full rounded-3xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-1.5 text-xs uppercase font-extrabold tracking-wider text-slate-400">
          <History className="w-3.5 h-3.5 text-[#6366F1]" />
          <span>Called Numbers</span>
        </div>
        <span className="text-xs font-bold text-slate-400">
          {calledNumbers.length} / 25
        </span>
      </div>

      {calledNumbers.length === 0 ? (
        <div className="py-4 text-center text-xs font-medium text-[#64748B]">
          No numbers called yet. Current player will call first!
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {/* Latest Number Featured Spotlight */}
          {latestNumber !== null && (
            <div className="flex items-center justify-between rounded-2xl border border-pink-100 bg-pink-50 px-3.5 py-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#EC4899]">
                <Sparkles className="w-3.5 h-3.5 text-[#EC4899]" />
                <span>Latest Call:</span>
              </div>
              <span className="rounded-xl border border-pink-200 bg-white px-3 py-0.5 text-2xl font-black text-[#EC4899] shadow-sm">
                {latestNumber}
              </span>
            </div>
          )}

          {/* History stream */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-700">
            {history.map((num, i) => {
              const isFirst = i === 0;
              return (
                <div
                  key={`history-${num}-${i}`}
                  className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-xl font-bold text-xs ${
                    isFirst
                      ? 'bg-[#EC4899] text-white font-black shadow-md shadow-pink-100'
                      : 'border border-[#E2E8F0] bg-[#F7F9FC] text-[#64748B]'
                  }`}
                >
                  {num}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
