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
    <div className="w-full bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
          Players ({onlinePlayerCount})
        </span>
        <span className="text-[11px] font-semibold text-slate-500">
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
                  ? 'bg-gradient-to-r from-indigo-950/80 to-purple-950/80 border-indigo-500 shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-500/30'
                  : isMe
                  ? 'bg-slate-800/80 border-indigo-500/30'
                  : 'bg-slate-800/40 border-slate-800'
              }`}
            >
              {/* Player Avatar & Name */}
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center font-bold text-white text-xs shadow-inner">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  {/* Online indicator */}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                      p.isOnline ? 'bg-emerald-400' : 'bg-slate-500'
                    }`}
                  />
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white">
                      {p.name}
                    </span>
                    {isMe && (
                      <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20">
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
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
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
                          : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
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
