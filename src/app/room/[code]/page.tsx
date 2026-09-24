'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  getLocalRoomState,
  getPlayerSession,
  savePlayerSession,
  leaveRoom,
  subscribeToRoom,
  joinRoom,
  startCardSetup,
  updatePlayerCard,
  setPlayerReady,
  callNumber,
  playAgain,
} from '@/lib/game-engine';
import { RoomState, Player } from '@/types/game';
import { RoomHeader } from '@/components/RoomHeader';
import { BingoBoard } from '@/components/BingoBoard';
import { BingoProgress } from '@/components/BingoProgress';
import { NumberSelector } from '@/components/NumberSelector';
import { CalledNumbers } from '@/components/CalledNumbers';
import { PlayerList } from '@/components/PlayerList';
import { CallAnnouncement } from '@/components/CallAnnouncement';
import { WinnerModal } from '@/components/WinnerModal';
import { RulesModal } from '@/components/RulesModal';
import { sounds } from '@/lib/sounds';
import { Sparkles, Users, Crown, Play, ExternalLink, AlertCircle } from 'lucide-react';

interface RoomPageProps {
  params: Promise<{ code: string }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  const resolvedParams = use(params);
  const roomCode = resolvedParams.code.toUpperCase();
  const router = useRouter();

  const [room, setRoom] = useState<RoomState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [joinNameInput, setJoinNameInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Initial State Load & Reconnection
  useEffect(() => {
    const existingRoom = getLocalRoomState(roomCode);
    if (existingRoom) {
      setRoom(existingRoom);

      // Check session
      const session = getPlayerSession(roomCode);
      if (session) {
        const found = existingRoom.players.find((p) => p.id === session.playerId);
        if (found) {
          setCurrentPlayer(found);
        }
      }
    }
    setLoading(false);

    // Subscribe to real-time updates
    const unsubscribe = subscribeToRoom(roomCode, (updatedRoom) => {
      setRoom(updatedRoom);
      // Synchronize current player
      setCurrentPlayer((prev) => {
        if (!prev) return null;
        return updatedRoom.players.find((p) => p.id === prev.id) || prev;
      });
    });

    return () => {
      unsubscribe();
    };
  }, [roomCode]);

  // Join if not yet connected
  const handleDirectJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinNameInput.trim()) return;
    setErrorMsg(null);
    sounds.playClick();

    const res = await joinRoom(roomCode, joinNameInput.trim());
    if (res.success && res.data) {
      setRoom(res.data.room);
      setCurrentPlayer(res.data.player);
    } else {
      setErrorMsg(res.error || 'Failed to join room.');
      sounds.playError();
    }
  };

  // Host: Start Card Setup from Lobby
  const handleHostStartSetup = () => {
    if (!currentPlayer || !room) return;
    sounds.playClick();
    const res = startCardSetup(roomCode, currentPlayer.id);
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to start game.');
      sounds.playError();
    }
  };

  // Card update during setup
  const handleCardChange = (newCard: number[]) => {
    if (!currentPlayer || !room) return;
    updatePlayerCard(roomCode, currentPlayer.id, newCard);
  };

  // Toggle ready in setup
  const handleToggleReady = (ready: boolean) => {
    if (!currentPlayer || !room) return;
    const res = setPlayerReady(roomCode, currentPlayer.id, ready);
    if (!res.success) {
      setErrorMsg(res.error || 'Could not ready up.');
      sounds.playError();
    }
  };

  // Call number during playing phase
  const handleCallNumber = (num: number) => {
    if (!currentPlayer || !room) return;
    const res = callNumber(roomCode, currentPlayer.id, num);
    if (!res.success) {
      setErrorMsg(res.error || 'Could not call number.');
      sounds.playError();
    }
  };

  // Play again
  const handlePlayAgain = () => {
    if (!currentPlayer || !room) return;
    sounds.playClick();
    const res = playAgain(roomCode, currentPlayer.id);
    if (!res.success) {
      setErrorMsg(res.error || 'Could not restart game.');
    }
  };

  const handleReturnHome = () => {
    sounds.playClick();
    if (currentPlayer) {
      void leaveRoom(roomCode, currentPlayer.id);
    }
    router.push('/');
  };

  // Open second player in new tab for instant testing
  const handleOpenTestPlayer = () => {
    sounds.playClick();
    const testNames = ['Rahul', 'Akhil', 'Karthik', 'Sneha', 'Pooja', 'Rohan'];
    const randomName = testNames[Math.floor(Math.random() * testNames.length)];
    window.open(`/join?code=${roomCode}`, '_blank');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold text-slate-400">Connecting to Room {roomCode}...</span>
        </div>
      </div>
    );
  }

  // Room not found
  if (!room) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
          <h2 className="text-2xl font-black mb-1">Room Not Found</h2>
          <p className="text-xs text-slate-400 mb-6">
            Room <span className="font-mono text-amber-400 font-bold">{roomCode}</span> does not exist or has expired.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Not yet joined this room
  if (!currentPlayer) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 blur-3xl pointer-events-none -z-10" />
        <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-white text-lg">
              B
            </span>
            <div>
              <h2 className="text-xl font-black text-white">Join Room {roomCode}</h2>
              <p className="text-xs text-slate-400">Enter your name to jump into the game</p>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleDirectJoin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                Your Nickname
              </label>
              <input
                type="text"
                autoFocus
                maxLength={20}
                value={joinNameInput}
                onChange={(e) => setJoinNameInput(e.target.value)}
                placeholder="e.g. Vinay"
                className="w-full px-4 py-3 rounded-2xl bg-slate-800/90 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-sm uppercase tracking-wider shadow-lg transition-all"
            >
              Enter Game Room
            </button>
          </form>
        </div>
      </div>
    );
  }

  const isHost = currentPlayer.id === room.hostId || currentPlayer.isHost;
  const isMyTurn = room.status === 'playing' && room.currentTurnPlayerId === currentPlayer.id;
  const currentTurnPlayer = room.players.find((p) => p.id === room.currentTurnPlayerId);
  const winnerPlayer = room.players.find((p) => p.id === room.winnerId);
  const latestCalledNumber = room.calledNumbers.length > 0 ? room.calledNumbers[room.calledNumbers.length - 1] : undefined;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between relative selection:bg-indigo-500 selection:text-white pb-8">
      {/* Glow Backdrops */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-gradient-to-b from-indigo-600/15 via-purple-600/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Global Header */}
      <RoomHeader
        roomCode={room.roomCode}
        playerCount={room.players.length}
        playerName={currentPlayer.name}
        isHost={isHost}
        onOpenRules={() => setShowRules(true)}
        onLeaveRoom={handleReturnHome}
      />

      {/* Floating Announcement banner */}
      <CallAnnouncement lastCalledBy={room.lastCalledBy} />

      {/* Winner Celebration Modal */}
      {room.status === 'ended' && (
        <WinnerModal
          winnerPlayer={winnerPlayer}
          players={room.players}
          isHost={isHost}
          onPlayAgain={handlePlayAgain}
          onReturnHome={handleReturnHome}
        />
      )}

      {/* Rules Modal */}
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />

      {/* Error toast */}
      {errorMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-rose-950 border border-rose-500/80 text-rose-200 text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="font-bold underline ml-1">
            ✕
          </button>
        </div>
      )}

      {/* STAGE 1: LOBBY */}
      {room.status === 'lobby' && (
        <main className="w-full max-w-3xl mx-auto px-4 py-8 flex flex-col items-center">
          <div className="w-full bg-slate-900/90 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-indigo-400 block mb-1">
                  Game Lobby
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  ROOM: <span className="font-mono text-amber-400">{room.roomCode}</span>
                </h2>
              </div>

              {/* Multi-Tab Simulation Quick Link */}
              <button
                onClick={handleOpenTestPlayer}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all hover:scale-105"
                title="Opens a new tab to join as a second player"
              >
                <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                <span>Open Player 2 in New Tab</span>
              </button>
            </div>

            {/* Players in Lobby */}
            <div className="my-6">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">
                  Players ({room.players.length} / 8)
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {room.players.length < 2 ? 'Need 2+ players' : 'Ready to start'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {room.players.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/70 border border-slate-700/60"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-700 flex items-center justify-center font-bold text-white text-xs">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className={`font-bold text-sm ${p.isOnline ? 'text-white' : 'text-slate-500'}`}>
                          {p.name}
                        </span>
                        {!p.isOnline && (
                          <span className="text-[10px] font-semibold text-slate-500">Left the room</span>
                        )}
                      </div>
                    </div>
                    {p.isHost && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/30">
                        <Crown className="w-3 h-3 fill-amber-400" /> Host
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Host Controls vs Waiting Message */}
            <div className="pt-6 border-t border-slate-800 text-center flex flex-col items-center">
              {isHost ? (
                <div className="w-full max-w-sm flex flex-col items-center gap-2.5">
                  <button
                    onClick={handleHostStartSetup}
                    disabled={room.players.length < 2}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-indigo-600/30 transition-all hover:scale-102 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>START GAME</span>
                  </button>
                  {room.players.length < 2 && (
                    <p className="text-xs text-amber-400/90 font-medium">
                      At least 2 players must join the room before you can start.
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-400 text-sm font-semibold animate-pulse py-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-400" />
                  <span>Waiting for host to start the game...</span>
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* STAGE 2: CARD SETUP */}
      {room.status === 'setup' && (
        <main className="w-full max-w-5xl mx-auto px-4 py-6 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8">
          {/* Card Arrangement Board */}
          <div className="flex-1 flex flex-col items-center max-w-md w-full">
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Card Setup Phase</span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Arrange Your Numbers 1–25
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Swap numbers into your secret winning strategy before locking in!
              </p>
            </div>

            <BingoBoard
              mode="setup"
              card={currentPlayer.card}
              isReady={currentPlayer.isReady}
              onCardChange={handleCardChange}
              onToggleReady={handleToggleReady}
            />
          </div>

          {/* Players Ready Status Side Panel */}
          <div className="w-full lg:w-72 flex flex-col gap-4 mt-4 lg:mt-16">
            <PlayerList
              players={room.players}
              hostId={room.hostId}
              gameStatus="setup"
              myPlayerId={currentPlayer.id}
            />

            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-slate-300 space-y-2">
              <strong className="text-indigo-300 block font-bold">How Setup Works:</strong>
              <p>• Every number 1 through 25 must appear exactly once.</p>
              <p>• Tap two numbers to swap their positions.</p>
              <p>• Click <strong className="text-white font-bold">READY UP</strong> once satisfied.</p>
              <p>• Match automatically starts when all players are ready!</p>
            </div>
          </div>
        </main>
      )}

      {/* STAGE 3 & 4: PLAYING & ENDED */}
      {(room.status === 'playing' || room.status === 'ended') && (
        <main className="w-full max-w-6xl mx-auto px-4 py-4 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6">
          {/* LEFT / MAIN AREA: Bingo Board */}
          <div className="flex flex-col items-center w-full lg:w-auto">
            <div className="flex items-center justify-between w-full max-w-[400px] mb-2 px-1">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Your 5×5 Board
              </span>
              <span className="text-xs font-bold text-emerald-400">
                Auto-Marked
              </span>
            </div>

            <BingoBoard
              mode="playing"
              card={currentPlayer.card}
              calledNumbers={room.calledNumbers}
              completedLines={currentPlayer.completedLines}
              latestCalledNumber={latestCalledNumber}
            />
          </div>

          {/* RIGHT / SECONDARY AREA: Turn Selector, Progress, Called Numbers, Players */}
          <div className="w-full max-w-[420px] flex flex-col gap-4">
            {/* Number Selector / Turn Banner */}
            <NumberSelector
              isMyTurn={isMyTurn}
              currentTurnPlayerName={currentTurnPlayer?.name || 'Someone'}
              calledNumbers={room.calledNumbers}
              onCallNumber={handleCallNumber}
              disabled={room.status === 'ended'}
            />

            {/* BINGO Progress */}
            <BingoProgress completedLines={currentPlayer.completedLines} />

            {/* Called Numbers Ribbon */}
            <CalledNumbers calledNumbers={room.calledNumbers} />

            {/* Players Live Status */}
            <PlayerList
              players={room.players}
              hostId={room.hostId}
              currentTurnPlayerId={room.currentTurnPlayerId}
              gameStatus={room.status}
              myPlayerId={currentPlayer.id}
            />
          </div>
        </main>
      )}
    </div>
  );
}
