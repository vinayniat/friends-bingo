'use client';

import React, { useState, useEffect } from 'react';
import { Shuffle, RotateCcw, CheckCircle2, Lock, Check } from 'lucide-react';
import { sounds } from '@/lib/sounds';
import { LineId } from '@/types/game';
import { getCompletedCellIndices, validateCard, TOTAL_CELLS } from '@/lib/bingo';

interface BingoBoardProps {
  mode: 'setup' | 'playing';
  card: number[];
  calledNumbers?: number[];
  completedLines?: LineId[];
  isReady?: boolean;
  onCardChange?: (newCard: number[]) => void;
  onToggleReady?: (ready: boolean) => void;
  latestCalledNumber?: number;
}

export const BingoBoard: React.FC<BingoBoardProps> = ({
  mode,
  card,
  calledNumbers = [],
  completedLines = [],
  isReady = false,
  onCardChange,
  onToggleReady,
  latestCalledNumber,
}) => {
  // Mobile / Tap-to-Swap state
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  // Drag and drop state
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const calledSet = new Set(calledNumbers);
  const completedCellIndices = getCompletedCellIndices(completedLines);

  // Sound effect on completing new lines
  const prevLineCountRef = React.useRef(completedLines.length);
  useEffect(() => {
    if (completedLines.length > prevLineCountRef.current) {
      sounds.playLineComplete();
    }
    prevLineCountRef.current = completedLines.length;
  }, [completedLines.length]);

  // Sound effect on latest called number
  useEffect(() => {
    if (mode === 'playing' && latestCalledNumber && card.includes(latestCalledNumber)) {
      sounds.playMark();
    }
  }, [latestCalledNumber, mode, card]);

  // Swap two tiles
  const swapIndices = (idxA: number, idxB: number) => {
    if (idxA === idxB || isReady || mode !== 'setup' || !onCardChange) return;
    const newCard = [...card];
    const temp = newCard[idxA];
    newCard[idxA] = newCard[idxB];
    newCard[idxB] = temp;
    sounds.playTileSwap();
    onCardChange(newCard);
    setSelectedIdx(null);
  };

  // Click handler (tap to select & swap)
  const handleCellClick = (idx: number) => {
    if (mode !== 'setup' || isReady) return;

    if (selectedIdx === null) {
      setSelectedIdx(idx);
      sounds.playClick();
    } else if (selectedIdx === idx) {
      setSelectedIdx(null);
      sounds.playClick();
    } else {
      swapIndices(selectedIdx, idx);
    }
  };

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, idx: number) => {
    if (mode !== 'setup' || isReady) return;
    setDraggedIdx(idx);
    e.dataTransfer.setData('text/plain', String(idx));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (mode !== 'setup' || isReady) return;
    if (dragOverIdx !== idx) {
      setDragOverIdx(idx);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (mode !== 'setup' || isReady) return;
    const sourceIdx = draggedIdx;
    if (sourceIdx !== null && sourceIdx !== targetIdx) {
      swapIndices(sourceIdx, targetIdx);
    }
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  // Quick setup actions
  const handleResetCard = () => {
    if (isReady || mode !== 'setup' || !onCardChange) return;
    sounds.playClick();
    const ordered = Array.from({ length: TOTAL_CELLS }, (_, i) => i + 1);
    onCardChange(ordered);
    setSelectedIdx(null);
  };

  const handleShuffleCard = () => {
    if (isReady || mode !== 'setup' || !onCardChange) return;
    sounds.playTileSwap();
    const shuffled = [...card];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    onCardChange(shuffled);
    setSelectedIdx(null);
  };

  const cardValidation = validateCard(card);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Setup Mode Action Toolbar */}
      {mode === 'setup' && (
        <div className="w-full max-w-md mb-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-between bg-slate-900/60 backdrop-blur-sm border border-slate-800 p-2 rounded-2xl">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleShuffleCard}
                disabled={isReady}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border border-slate-700 disabled:opacity-50 transition-all hover:scale-105"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Shuffle</span>
              </button>
              <button
                type="button"
                onClick={handleResetCard}
                disabled={isReady}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 disabled:opacity-50 transition-all hover:scale-105"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>1–25 Order</span>
              </button>
            </div>

            {/* Ready Toggle Button */}
            {onToggleReady && (
              <button
                type="button"
                onClick={() => {
                  if (!isReady && !cardValidation.isValid) {
                    sounds.playError();
                    return;
                  }
                  sounds.playClick();
                  onToggleReady(!isReady);
                }}
                disabled={!isReady && !cardValidation.isValid}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-md ${
                  isReady
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/30'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-indigo-500/30'
                }`}
              >
                {isReady ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>READY</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>READY UP</span>
                  </>
                )}
              </button>
            )}
          </div>

          <p className="text-center text-xs text-slate-400">
            {isReady ? (
              <span className="text-emerald-400 font-semibold flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Card locked! Waiting for all players to be ready...
              </span>
            ) : selectedIdx !== null ? (
              <span className="text-amber-300 font-medium">
                Tap another tile to swap with #{card[selectedIdx]}
              </span>
            ) : (
              'Drag & drop or tap two numbers to swap positions.'
            )}
          </p>
        </div>
      )}

      {/* 5x5 BINGO GRID */}
      <div className="relative p-2.5 sm:p-4 rounded-3xl bg-gradient-to-b from-slate-800/80 via-slate-900/90 to-slate-950 border border-slate-700/60 shadow-2xl shadow-indigo-950/30">
        {/* Board glow effect */}
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-xl -z-10 pointer-events-none" />

        <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5 max-w-[420px] w-[86vw] sm:w-[380px] md:w-[400px] aspect-square">
          {card.map((num, idx) => {
            const isCalled = mode === 'playing' && calledSet.has(num);
            const isLatest = mode === 'playing' && latestCalledNumber === num;
            const isCompletedCell = mode === 'playing' && completedCellIndices.has(idx);
            const isSelected = selectedIdx === idx;
            const isDragOver = dragOverIdx === idx;
            const isBeingDragged = draggedIdx === idx;

            return (
              <div
                key={`cell-${idx}-${num}`}
                draggable={mode === 'setup' && !isReady}
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={handleDragEnd}
                onClick={() => handleCellClick(idx)}
                className={`relative select-none flex flex-col items-center justify-center rounded-2xl font-black transition-all duration-200 cursor-pointer text-lg sm:text-2xl aspect-square ${
                  isBeingDragged ? 'opacity-30 scale-95' : 'opacity-100'
                } ${
                  isDragOver
                    ? 'ring-4 ring-amber-400 bg-amber-500/30 scale-105'
                    : isSelected
                    ? 'ring-4 ring-indigo-400 bg-indigo-600/50 scale-105 shadow-lg shadow-indigo-500/40 animate-pulse'
                    : isCompletedCell
                    ? 'bg-gradient-to-br from-amber-500/30 via-emerald-500/30 to-teal-500/40 border-2 border-amber-400/90 text-amber-200 shadow-lg shadow-amber-500/20'
                    : isCalled
                    ? 'bg-emerald-950/60 border border-emerald-500/60 text-emerald-300 shadow-md shadow-emerald-950/40'
                    : 'bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 text-white shadow-sm hover:border-slate-600 active:scale-95'
                } ${isLatest ? 'ring-4 ring-pink-500 scale-105 shadow-pink-500/50 animate-bounce' : ''}`}
              >
                {/* Number */}
                <span className={`tracking-tight ${isCalled ? 'line-through decoration-emerald-400/70' : ''}`}>
                  {num}
                </span>

                {/* Checked Badge in Playing Mode */}
                {isCalled && (
                  <span className="absolute bottom-1 right-1 sm:bottom-1.5 sm:right-1.5 text-emerald-400">
                    <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
                  </span>
                )}

                {/* Completed Line Star/Glow indicator */}
                {isCompletedCell && (
                  <span className="absolute top-1 left-1 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-300" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
