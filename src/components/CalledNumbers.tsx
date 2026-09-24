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
    <div className="w-full bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-1.5 text-xs uppercase font-extrabold tracking-wider text-slate-400">
          <History className="w-3.5 h-3.5 text-indigo-400" />
          <span>Called Numbers</span>
        </div>
        <span className="text-xs font-bold text-slate-400">
          {calledNumbers.length} / 25
        </span>
      </div>

      {calledNumbers.length === 0 ? (
        <div className="py-4 text-center text-xs text-slate-500 font-medium">
          No numbers called yet. Current player will call first!
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {/* Latest Number Featured Spotlight */}
          {latestNumber !== null && (
            <div className="flex items-center justify-between bg-gradient-to-r from-pink-950/60 to-purple-950/60 border border-pink-500/40 rounded-2xl px-3.5 py-2">
              <div className="flex items-center gap-1.5 text-xs text-pink-300 font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                <span>Latest Call:</span>
              </div>
              <span className="text-2xl font-black text-white px-3 py-0.5 rounded-xl bg-pink-500/30 border border-pink-400/50 shadow-md">
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
                      ? 'bg-pink-500 text-white font-black shadow-md shadow-pink-500/30'
                      : 'bg-slate-800/90 text-slate-300 border border-slate-700/60'
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
