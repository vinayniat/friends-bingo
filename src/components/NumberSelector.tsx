'use client';

import React from 'react';
import { sounds } from '@/lib/sounds';
import { TOTAL_CELLS } from '@/lib/bingo';
import { Flame, Clock, Check } from 'lucide-react';

interface NumberSelectorProps {
  isMyTurn: boolean;
  currentTurnPlayerName: string;
  calledNumbers: number[];
  onCallNumber: (num: number) => void;
  disabled?: boolean;
}

export const NumberSelector: React.FC<NumberSelectorProps> = ({
  isMyTurn,
  currentTurnPlayerName,
  calledNumbers,
  onCallNumber,
  disabled = false,
}) => {
  const calledSet = new Set(calledNumbers);
  const allNumbers = Array.from({ length: TOTAL_CELLS }, (_, i) => i + 1);

  const handleSelectNumber = (num: number) => {
    if (!isMyTurn || calledSet.has(num) || disabled) {
      if (!isMyTurn) sounds.playError();
      return;
    }
    sounds.playCall();
    onCallNumber(num);
  };

  return (
    <div
      className={`w-full rounded-3xl p-4 transition-all duration-300 ${
        isMyTurn
          ? 'bg-gradient-to-b from-indigo-950/70 via-slate-900/90 to-slate-950 border-2 border-indigo-500/80 shadow-2xl shadow-indigo-500/20'
          : 'bg-slate-900/60 backdrop-blur-md border border-slate-800'
      }`}
    >
      {/* Header Banner */}
      <div className="flex items-center justify-between mb-3 px-1">
        {isMyTurn ? (
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500" />
            </span>
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-pink-400" />
              <span className="text-sm font-black tracking-wide text-white uppercase">
                YOUR TURN — Pick a Number!
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="w-4 h-4 animate-spin text-slate-500" />
            <span className="text-xs font-semibold">
              Waiting for <strong className="text-amber-300">{currentTurnPlayerName}</strong> to call...
            </span>
          </div>
        )}

        <span className="text-[11px] font-bold text-slate-500">
          {TOTAL_CELLS - calledNumbers.length} Left
        </span>
      </div>

      {/* 1-25 Grid of Buttons */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2 max-w-[380px] mx-auto">
        {allNumbers.map((num) => {
          const isCalled = calledSet.has(num);

          return (
            <button
              key={`call-btn-${num}`}
              type="button"
              disabled={isCalled || !isMyTurn || disabled}
              onClick={() => handleSelectNumber(num)}
              className={`relative py-2 sm:py-2.5 rounded-xl font-black text-sm sm:text-base transition-all duration-150 select-none ${
                isCalled
                  ? 'bg-slate-800/40 text-slate-600 border border-slate-800/60 cursor-not-allowed opacity-40 line-through'
                  : isMyTurn
                  ? 'bg-gradient-to-b from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-md shadow-indigo-600/30 hover:scale-105 active:scale-95 border border-indigo-400/50 cursor-pointer'
                  : 'bg-slate-800/80 text-slate-400 border border-slate-700/60 cursor-not-allowed'
              }`}
            >
              <span>{num}</span>
              {isCalled && (
                <span className="absolute top-1 right-1 text-slate-500">
                  <Check className="w-2.5 h-2.5" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
