'use client';

import React, { useState } from 'react';
import { Copy, Check, Volume2, VolumeX, HelpCircle, Share2, Users, LogOut, Mic } from 'lucide-react';
import { sounds } from '@/lib/sounds';

interface RoomHeaderProps { roomCode: string; playerCount: number; playerName: string; isHost: boolean; onOpenRules: () => void; onLeaveRoom: () => void; onOpenVoiceChat: () => void; }

export const RoomHeader: React.FC<RoomHeaderProps> = ({ roomCode, playerCount, playerName, isHost, onOpenRules, onLeaveRoom, onOpenVoiceChat }) => {
  const [copied, setCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const copy = async (value: string) => { try { await navigator.clipboard.writeText(value); } finally { setCopied(true); setTimeout(() => setCopied(false), 1800); } };
  const share = async () => { sounds.playClick(); const url = `${window.location.origin}/join?code=${roomCode}`; if (navigator.share) { try { await navigator.share({ title: 'Join my Class Bingo room!', text: `Join with code ${roomCode}`, url }); return; } catch {} } await copy(url); };
  return (
    <header className="sticky top-0 z-40 border-b border-[#E2E8F0] bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6366F1] text-xl font-black text-white">B</span>
          <div className="hidden min-w-0 sm:block"><h1 className="text-base font-black">CLASS BINGO</h1><p className="truncate text-xs text-[#64748B]">Playing as <strong className="text-[#6366F1]">{playerName}</strong>{isHost && <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 font-bold text-[#F59E0B]">HOST</span>}</p></div>
          <div className="flex items-center gap-1 rounded-xl border border-[#E2E8F0] bg-[#F7F9FC] px-2.5 py-1.5"><span className="text-[10px] font-bold uppercase text-[#64748B]">Room</span><span className="font-mono font-black text-[#F59E0B]">{roomCode}</span><button onClick={() => copy(roomCode)} className="rounded p-1 text-[#64748B] hover:bg-white">{copied ? <Check className="h-4 w-4 text-[#22C55E]" /> : <Copy className="h-4 w-4" />}</button></div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1 rounded-xl bg-indigo-50 px-2.5 py-2 text-sm font-bold text-[#6366F1]"><Users className="h-4 w-4" /> {playerCount}</span>
          <button onClick={share} className="hidden items-center gap-1 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-bold text-[#6366F1] sm:flex"><Share2 className="h-4 w-4" /> Share</button>
          <button onClick={() => { const muted = sounds.toggleMute(); setIsMuted(muted); }} className="rounded-xl border border-[#E2E8F0] bg-white p-2 text-[#64748B]">{isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-[#22C55E]" />}</button>
          <button onClick={onOpenVoiceChat} aria-label="Open voice chat" className="rounded-xl border border-indigo-100 bg-indigo-50 p-2 text-[#6366F1]"><Mic className="h-4 w-4" /></button>
          <button onClick={onOpenRules} className="rounded-xl border border-[#E2E8F0] bg-white p-2 text-[#F59E0B]"><HelpCircle className="h-4 w-4" /></button>
          <button onClick={onLeaveRoom} className="rounded-xl border border-rose-100 bg-rose-50 p-2 text-rose-500"><LogOut className="h-4 w-4" /></button>
        </div>
      </div>
    </header>
  );
};
