'use client';

import React from 'react';
import { Player, GameStatus } from '@/types/game';
import { Crown, CheckCircle2, Circle, Flame, Trophy } from 'lucide-react';

interface PlayerListProps {
  players: Player[];
  hostId: string;
  currentTurnPlayerId?: string;
  gameStatus: GameStatus;
  myPlayerId: string;
}

export const PlayerList: React.FC<PlayerListProps> = ({
  players,
  hostId,
  currentTurnPlayerId,
  gameStatus,
  myPlayerId,
}) => {
  const onlinePlayerCount = players.filter((player) => player.isOnline).length;

  return (
    <div className="w-full rounded-3xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs uppercase font-extrabold tracking-wider text-[#64748B]">
          Players ({onlinePlayerCount})
        </span>
        <span className="text-[11px] font-semibold text-[#64748B]">
          {gameStatus === 'lobby'
            ? 'Waiting in Lobby'
            : gameStatus === 'setup'
            ? 'Card Setup'
            : gameStatus === 'playing'
            ? 'Active Match'
            : 'Match Finished'}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {players.map((p) => {
          const isMe = p.id === myPlayerId;
          const isTurn = gameStatus === 'playing' && p.id === currentTurnPlayerId;
          const isHost = p.id === hostId || p.isHost;

          return (
            <div
              key={p.id}
              className={`flex items-center justify-between p-2.5 rounded-2xl transition-all duration-200 border ${
                isTurn
                  ? 'bg-indigo-50 border-indigo-200 shadow-sm ring-2 ring-indigo-100'
                  : isMe
                  ? 'bg-indigo-50 border-indigo-100'
                  : 'bg-[#F7F9FC] border-[#E2E8F0]'
              }`}
            >
              {/* Player Avatar & Name */}
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-xs font-bold text-[#6366F1] shadow-inner">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  {/* Online indicator */}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                      p.isOnline ? 'bg-[#22C55E]' : 'bg-slate-300'
                    }`}
                  />
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-[#1E293B]">
                      {p.name}
                    </span>
                    {isMe && (
                      <span className="rounded border border-indigo-100 bg-indigo-50 px-1.5 py-0.2 text-[10px] font-bold text-[#6366F1]">
                        YOU
                      </span>
                    )}
                    {isHost && (
                      <span title="Host">
                        <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      </span>
                    )}
                  </div>

                  {/* Subtext info */}
                  {gameStatus === 'playing' && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      {isTurn ? (
                        <span className="text-pink-400 font-bold flex items-center gap-1">
                          <Flame className="w-3 h-3" /> Calling now
                        </span>
                      ) : (
                        <span>Waiting</span>
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* Status / Line Badges */}
              <div>
                {gameStatus === 'setup' ? (
                  p.isReady ? (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-xl border border-[#E2E8F0] bg-[#F7F9FC] px-2.5 py-1 text-xs font-semibold text-[#64748B]">
                      <Circle className="w-3.5 h-3.5" /> Arranging...
                    </span>
                  )
                ) : gameStatus === 'playing' || gameStatus === 'ended' ? (
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2.5 py-1 rounded-xl text-xs font-black tracking-wide border ${
                        p.linesCompleted >= 5
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30'
                          : p.linesCompleted > 0
                          ? 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40'
                          : 'bg-[#F7F9FC] text-[#64748B] border-[#E2E8F0]'
                      }`}
                    >
                      {p.linesCompleted >= 5 ? (
                        <span className="flex items-center gap-1">
                          <Trophy className="w-3.5 h-3.5" /> BINGO!
                        </span>
                      ) : (
                        `${p.linesCompleted} / 5 Lines`
                      )}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
