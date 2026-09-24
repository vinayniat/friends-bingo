'use client';

import React, { useState } from 'react';
import { Copy, Check, Volume2, VolumeX, HelpCircle, Share2, Users, LogOut } from 'lucide-react';
import { sounds } from '@/lib/sounds';

interface RoomHeaderProps {
  roomCode: string;
  playerCount: number;
  playerName: string;
  isHost: boolean;
  onOpenRules: () => void;
  onLeaveRoom: () => void;
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({
  roomCode,
  playerCount,
  playerName,
  isHost,
  onOpenRules,
  onLeaveRoom,
}) => {
  const [copied, setCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(sounds.getMuted());

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      sounds.playClick();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareLink = async () => {
    sounds.playClick();
    const url = typeof window !== 'undefined' ? `${window.location.origin}/join?code=${roomCode}` : '';
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Friends Bingo room!',
          text: `Join Friends Bingo game with code ${roomCode}`,
          url,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  const toggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
    if (!muted) sounds.playClick();
  };

  return (
    <header className="w-full bg-slate-900/80 backdrop-blur-md border-b border-indigo-900/40 sticky top-0 z-40 px-4 py-3 shadow-lg shadow-black/20">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Logo & Room Code */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center font-black text-white text-lg shadow-md shadow-indigo-500/25">
              B
            </span>
            <div className="hidden sm:block">
              <h1 className="text-base font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                FRIENDS BINGO
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>Playing as <strong className="text-indigo-300">{playerName}</strong></span>
                {isHost && (
                  <span className="px-1.5 py-0.2 text-[10px] uppercase font-bold tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded">
                    Host
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Room Code Badge */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-indigo-500/30 rounded-xl px-2.5 py-1.5 shadow-inner">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Room:</span>
            <span className="font-mono text-base font-black text-amber-400 tracking-wider">
              {roomCode}
            </span>
            <button
              onClick={handleCopyCode}
              title="Copy Room Code"
              className="p-1 hover:bg-slate-700/80 rounded-lg text-slate-300 hover:text-white transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Active Players Counter */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs font-medium text-slate-300">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>{playerCount}</span>
          </div>

          {/* Share Button */}
          <button
            onClick={handleShareLink}
            title="Share Room Link"
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-xs font-semibold text-indigo-200 transition-all hover:scale-105 active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white transition-all hover:scale-105"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Rules Button */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenRules();
            }}
            title="Game Rules"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white transition-all hover:scale-105"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
          </button>

          {/* Leave Room Button */}
          <button
            onClick={() => {
              sounds.playClick();
              onLeaveRoom();
            }}
            title="Leave Game"
            className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 hover:text-white transition-all hover:scale-105"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
