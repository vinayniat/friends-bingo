'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Play, Sparkles, User } from 'lucide-react';
import { createRoom } from '@/lib/game-engine';
import { sounds } from '@/lib/sounds';

export default function CreateGamePage() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError('Please enter your player name.');
      sounds.playError();
      return;
    }

    setLoading(true);
    setError(null);
    sounds.playClick();

    try {
      const result = await createRoom(playerName.trim());
      if (result.success && result.data) {
        router.push(`/room/${result.data.room.roomCode}`);
      } else {
        setError(result.error || 'Failed to create room.');
        sounds.playError();
        setLoading(false);
      }
    } catch {
      setError('An unexpected error occurred while creating the room.');
      sounds.playError();
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#1E293B] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-100/60 blur-3xl pointer-events-none -z-10" />

      {/* Back button */}
      <div className="w-full max-w-md mb-6">
        <Link
          href="/"
          onClick={() => sounds.playClick()}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#64748B] hover:text-[#6366F1] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Form Card */}
      <div className="w-full max-w-md rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6366F1] text-xl font-black text-white shadow-lg shadow-indigo-200">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Create a Game</h1>
            <p className="text-xs font-medium text-[#64748B]">Host a private Bingo room for your friends</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-600">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div>
            <label htmlFor="name-input" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Your Name / Nickname
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="name-input"
                type="text"
                autoFocus
                maxLength={20}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="e.g. Vinay"
                className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F7F9FC] py-3 pl-10 pr-4 text-sm font-bold text-[#1E293B] placeholder-slate-400 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#6366F1] py-3.5 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-spin text-sm">⏳ Creating room...</span>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Create Game Room</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
