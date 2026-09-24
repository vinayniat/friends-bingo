'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Player } from '@/types/game';
import { ALL_LINES, BINGO_LETTERS } from '@/lib/bingo';
import { sounds } from '@/lib/sounds';
import { Trophy, RotateCcw, Home, Sparkles, Award } from 'lucide-react';

interface WinnerModalProps {
  winnerPlayer?: Player;
  players: Player[];
  isHost: boolean;
  onPlayAgain: () => void;
  onReturnHome: () => void;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  winnerPlayer,
  players,
  isHost,
  onPlayAgain,
  onReturnHome,
}) => {
  const lineMetaMap = new Map(ALL_LINES.map((l) => [l.id, l]));

  useEffect(() => {
    // Play celebratory sound
    sounds.playBingoWin();

    // Launch multi-burst confetti
    const duration = 3.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#f59e0b', '#ec4899', '#6366f1', '#10b981'],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#f59e0b', '#ec4899', '#6366f1', '#10b981'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  // Sort players by lines completed descending
  const sortedPlayers = [...players].sort((a, b) => b.linesCompleted - a.linesCompleted);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/70 p-6 sm:p-8 shadow-2xl shadow-amber-500/30 text-center flex flex-col items-center max-h-[92vh] overflow-y-auto">
        {/* Glow backdrop */}
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-purple-500/20 blur-2xl -z-10 pointer-events-none" />

        {/* Big Trophy Badge */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-500/40 mb-4 animate-bounce">
          <Trophy className="w-10 h-10 text-slate-950 fill-slate-950" />
        </div>

        {/* Title */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black tracking-widest uppercase mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>BINGO VICTORY</span>
          <Sparkles className="w-3.5 h-3.5" />
        </div>

        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
          {winnerPlayer?.name || 'Someone'} Wins!
        </h2>
        <p className="text-sm font-semibold text-amber-400 mt-1">
          First to complete 5 unique lines!
        </p>

        {/* Crossed B-I-N-G-O letters */}
        <div className="flex items-center justify-center gap-2 my-5">
          {BINGO_LETTERS.map((letter) => (
            <div
              key={letter}
              className="relative w-11 h-12 rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg shadow-amber-500/30"
            >
              <span>{letter}</span>
              <div className="absolute inset-x-1 top-1/2 -translate-y-1/2 h-1 bg-white rounded-full shadow-md" />
            </div>
          ))}
        </div>

        {/* Winning Player Lines Breakdown */}
        {winnerPlayer?.completedLines && winnerPlayer.completedLines.length > 0 && (
          <div className="w-full bg-slate-800/60 rounded-2xl p-3 border border-slate-700/60 mb-5">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
              Completed Lines Breakdown
            </span>
            <div className="flex flex-wrap justify-center gap-1.5">
              {winnerPlayer.completedLines.map((id) => (
                <span
                  key={id}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30"
                >
                  ✓ {lineMetaMap.get(id)?.label || id}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="w-full bg-slate-800/40 rounded-2xl p-3.5 border border-slate-700/50 mb-6">
          <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider block mb-2.5">
            Final Standings
          </span>
          <div className="flex flex-col gap-2">
            {sortedPlayers.map((p, idx) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs font-semibold"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 text-slate-400 font-bold">#{idx + 1}</span>
                  <span className="text-white font-bold">{p.name}</span>
                  {idx === 0 && <Award className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <span className="text-amber-400 font-black">
                  {p.linesCompleted} / 5 Lines
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
          {isHost ? (
            <button
              onClick={() => {
                sounds.playClick();
                onPlayAgain();
              }}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/30 transition-all hover:scale-105 active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Again</span>
            </button>
          ) : (
            <div className="w-full sm:w-auto flex-1 text-xs text-slate-400 font-medium py-2">
              Waiting for host to start a new round...
            </div>
          )}

          <button
            onClick={() => {
              sounds.playClick();
              onReturnHome();
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-sm border border-slate-700 transition-all hover:scale-105 active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </button>
        </div>
      </div>
    </div>
  );
};
