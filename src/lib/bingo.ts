import { LineId, CardValidationResult, CallValidationResult, Player, GameStatus, BingoLineMeta } from '@/types/game';

export const BOARD_SIZE = 5;
export const TOTAL_CELLS = 25;
export const WINNING_LINE_COUNT = 5;
export const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O'] as const;

export const ALL_LINES: BingoLineMeta[] = [
  // Rows
  { id: 'row-0', label: 'Row 1', type: 'row', indices: [0, 1, 2, 3, 4] },
  { id: 'row-1', label: 'Row 2', type: 'row', indices: [5, 6, 7, 8, 9] },
  { id: 'row-2', label: 'Row 3', type: 'row', indices: [10, 11, 12, 13, 14] },
  { id: 'row-3', label: 'Row 4', type: 'row', indices: [15, 16, 17, 18, 19] },
  { id: 'row-4', label: 'Row 5', type: 'row', indices: [20, 21, 22, 23, 24] },
  // Columns
  { id: 'col-0', label: 'Column 1', type: 'col', indices: [0, 5, 10, 15, 20] },
  { id: 'col-1', label: 'Column 2', type: 'col', indices: [1, 6, 11, 16, 21] },
  { id: 'col-2', label: 'Column 3', type: 'col', indices: [2, 7, 12, 17, 22] },
  { id: 'col-3', label: 'Column 4', type: 'col', indices: [3, 8, 13, 18, 23] },
  { id: 'col-4', label: 'Column 5', type: 'col', indices: [4, 9, 14, 19, 24] },
  // Diagonals
  { id: 'diag-main', label: 'Main Diagonal ↘', type: 'diagonal', indices: [0, 6, 12, 18, 24] },
  { id: 'diag-anti', label: 'Anti Diagonal ↙', type: 'diagonal', indices: [4, 8, 12, 16, 20] },
];

/**
 * Creates initial default card with numbers 1..25 in order
 */
export function createDefaultCard(): number[] {
  return Array.from({ length: TOTAL_CELLS }, (_, i) => i + 1);
}

/**
 * Validates that card contains exactly the numbers 1 through 25 with no duplicates and no omissions.
 */
export function validateCard(numbers: number[]): CardValidationResult {
  if (!Array.isArray(numbers)) {
    return { isValid: false, error: 'Board numbers must be an array.' };
  }

  if (numbers.length !== TOTAL_CELLS) {
    return {
      isValid: false,
      error: `Board must contain exactly ${TOTAL_CELLS} numbers. Found ${numbers.length}.`,
    };
  }

  const seen = new Set<number>();
  for (let i = 0; i < numbers.length; i++) {
    const num = numbers[i];
    if (typeof num !== 'number' || !Number.isInteger(num)) {
      return { isValid: false, error: `Invalid entry at position ${i + 1}. All values must be integers.` };
    }
    if (num < 1 || num > TOTAL_CELLS) {
      return { isValid: false, error: `Number ${num} is out of range. All numbers must be between 1 and 25.` };
    }
    if (seen.has(num)) {
      return { isValid: false, error: `Duplicate number detected: ${num}. Every number 1-25 must appear exactly once.` };
    }
    seen.add(num);
  }

  for (let i = 1; i <= TOTAL_CELLS; i++) {
    if (!seen.has(i)) {
      return { isValid: false, error: `Missing number: ${i}. Every number 1-25 must be present.` };
    }
  }

  return { isValid: true };
}

/**
 * Calculates completed lines for a given 5x5 board and set of called numbers.
 * Returns an array of unique LineIds that are fully matched.
 */
export function calculateCompletedLines(board: number[], calledNumbers: number[]): LineId[] {
  if (!board || board.length !== TOTAL_CELLS) return [];

  const calledSet = new Set(calledNumbers);
  const completed: LineId[] = [];

  for (const line of ALL_LINES) {
    const isLineComplete = line.indices.every((index) => {
      const numberAtCell = board[index];
      return calledSet.has(numberAtCell);
    });

    if (isLineComplete) {
      completed.push(line.id);
    }
  }

  return completed;
}

/**
 * Returns true if player has completed 5 or more unique lines.
 */
export function isWinningState(completedLines: LineId[] | number): boolean {
  const count = Array.isArray(completedLines) ? completedLines.length : completedLines;
  return count >= WINNING_LINE_COUNT;
}

/**
 * Returns the indices (0-24) on the board that belong to any completed line.
 */
export function getCompletedCellIndices(completedLines: LineId[]): Set<number> {
  const cellIndices = new Set<number>();
  const lineMap = new Map(ALL_LINES.map((l) => [l.id, l]));

  for (const lineId of completedLines) {
    const line = lineMap.get(lineId);
    if (line) {
      for (const idx of line.indices) {
        cellIndices.add(idx);
      }
    }
  }

  return cellIndices;
}

/**
 * Get next turn player in round-robin sequence
 */
export function getNextPlayer(players: Player[], currentTurnPlayerId: string): Player | null {
  if (!players || players.length === 0) return null;

  // Filter active/online players if possible, else all players
  const candidatePlayers = players.filter((p) => p.isOnline).length > 0
    ? players.filter((p) => p.isOnline)
    : players;

  const currentIndex = candidatePlayers.findIndex((p) => p.id === currentTurnPlayerId);
  if (currentIndex === -1) {
    return candidatePlayers[0];
  }

  const nextIndex = (currentIndex + 1) % candidatePlayers.length;
  return candidatePlayers[nextIndex];
}

/**
 * Authoritative check before calling a number
 */
export function canCallNumber(
  playerId: string,
  currentTurnPlayerId: string,
  number: number,
  calledNumbers: number[],
  gameStatus: GameStatus
): CallValidationResult {
  if (gameStatus !== 'playing') {
    return { allowed: false, reason: 'Game is not currently active.' };
  }

  if (playerId !== currentTurnPlayerId) {
    return { allowed: false, reason: "It is not your turn to call a number." };
  }

  if (!Number.isInteger(number) || number < 1 || number > TOTAL_CELLS) {
    return { allowed: false, reason: `Number must be between 1 and ${TOTAL_CELLS}.` };
  }

  if (calledNumbers.includes(number)) {
    return { allowed: false, reason: `Number ${number} has already been called.` };
  }

  return { allowed: true };
}

/**
 * Generates a 6-digit room code
 */
export function generateRoomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
