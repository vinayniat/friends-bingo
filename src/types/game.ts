export type GameStatus = 'lobby' | 'setup' | 'playing' | 'ended';

export type LineId =
  | 'row-0'
  | 'row-1'
  | 'row-2'
  | 'row-3'
  | 'row-4'
  | 'col-0'
  | 'col-1'
  | 'col-2'
  | 'col-3'
  | 'col-4'
  | 'diag-main'
  | 'diag-anti';

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  turnOrder: number;
  joinedAt: number;
  linesCompleted: number;
  completedLines: LineId[];
  hasWon: boolean;
  card: number[]; // 25 numbers
  isOnline: boolean;
}

export interface RoomState {
  id: string;
  roomCode: string;
  hostId: string;
  status: GameStatus;
  currentTurnPlayerId: string;
  currentTurnIndex: number;
  calledNumbers: number[];
  lastCalledBy?: {
    playerId: string;
    playerName: string;
    number: number;
    timestamp: number;
  };
  winnerId?: string;
  winnerName?: string;
  players: Player[];
  createdAt: number;
  updatedAt: number;
  round: number;
}

export interface CardValidationResult {
  isValid: boolean;
  error?: string;
}

export interface CallValidationResult {
  allowed: boolean;
  reason?: string;
}

export interface BingoLineMeta {
  id: LineId;
  label: string;
  type: 'row' | 'col' | 'diagonal';
  indices: number[];
}
