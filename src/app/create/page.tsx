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
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-pink-600/10 blur-3xl pointer-events-none -z-10" />

      {/* Back button */}
      <div className="w-full max-w-md mb-6">
        <Link
          href="/"
          onClick={() => sounds.playClick()}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Form Card */}
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/40">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-indigo-500/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Create a Game</h1>
            <p className="text-xs text-slate-400 font-medium">Host a private Bingo room for your friends</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-semibold animate-in fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div>
            <label htmlFor="name-input" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
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
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-800/90 border border-slate-700/80 text-white placeholder-slate-500 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-indigo-600/30 transition-all hover:scale-102 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
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
