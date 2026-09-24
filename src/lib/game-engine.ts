import { RoomState, Player, GameStatus, LineId } from '@/types/game';
import {
  createDefaultCard,
  validateCard,
  calculateCompletedLines,
  isWinningState,
  getNextPlayer,
  canCallNumber,
  generateRoomCode,
} from './bingo';
import { supabase, isSupabaseConfigured } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

const STORAGE_PREFIX = 'friends_bingo_room_';
const PLAYER_SESSION_PREFIX = 'friends_bingo_player_';

export interface RoomActionResult<T = RoomState> {
  success: boolean;
  data?: T;
  error?: string;
}

// In-memory cache for fast sync
const memoryRooms = new Map<string, RoomState>();

/**
 * Load room from storage or memory
 */
export function getLocalRoomState(roomCode: string): RoomState | null {
  if (memoryRooms.has(roomCode)) {
    return memoryRooms.get(roomCode)!;
  }
  if (typeof window !== 'undefined') {
    try {
      const data = localStorage.getItem(STORAGE_PREFIX + roomCode);
      if (data) {
        const room = JSON.parse(data) as RoomState;
        memoryRooms.set(roomCode, room);
        return room;
      }
    } catch (e) {
      console.error('Failed reading room from localStorage', e);
    }
  }
  return null;
}

/**
 * Save room to storage and broadcast
 */
export function saveRoomState(room: RoomState, broadcast = true) {
  room.updatedAt = Date.now();
  memoryRooms.set(room.roomCode, room);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_PREFIX + room.roomCode, JSON.stringify(room));
    } catch (e) {
      console.error('Failed saving room to localStorage', e);
    }

    if (broadcast) {
      // 1. BroadcastChannel for local cross-tab sync
      try {
        const bc = new BroadcastChannel(`bingo_room_${room.roomCode}`);
        bc.postMessage({ type: 'ROOM_UPDATE', room });
        bc.close();
      } catch {
        // Fallback for older browsers
      }

      // 2. Supabase Realtime broadcast if configured
      if (isSupabaseConfigured && supabase) {
        supabase
          .channel(`room:${room.roomCode}`)
          .send({
            type: 'broadcast',
            event: 'state_change',
            payload: room,
          })
          .catch((err) => console.warn('Supabase broadcast failed:', err));
      }
    }
  }
}

/**
 * Save player session for reconnection
 */
export function savePlayerSession(roomCode: string, playerId: string, playerName: string) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(
      PLAYER_SESSION_PREFIX + roomCode,
      JSON.stringify({ playerId, playerName })
    );
  }
}

export function getPlayerSession(roomCode: string): { playerId: string; playerName: string } | null {
  if (typeof window !== 'undefined') {
    const data = sessionStorage.getItem(PLAYER_SESSION_PREFIX + roomCode);
    if (data) {
      try {
        return JSON.parse(data);
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * REMOVE PLAYER FROM ROOM
 */
export async function leaveRoom(roomCode: string, playerId: string): Promise<RoomActionResult> {
  const cleanCode = roomCode.trim().toUpperCase();
  const room = getLocalRoomState(cleanCode);
  if (!room) return { success: false, error: 'Room not found.' };

  const playerIndex = room.players.findIndex((candidate) => candidate.id === playerId);
  if (playerIndex === -1) return { success: false, error: 'Player not found in room.' };

  room.players.splice(playerIndex, 1);
  if (room.currentTurnIndex >= room.players.length) {
    room.currentTurnIndex = 0;
  }
  if (room.currentTurnPlayerId === playerId) {
    room.currentTurnPlayerId = room.players[room.currentTurnIndex]?.id || '';
  }
  saveRoomState(room);

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('room_code', cleanCode)
      .eq('id', playerId);

    if (error) {
      console.warn('Supabase leave update notice:', error);
    }
  }

  return { success: true, data: room };
}

/**
 * CREATE ROOM
 */
export async function createRoom(hostName: string): Promise<RoomActionResult<{ room: RoomState; host: Player }>> {
  const cleanName = hostName.trim();
  if (!cleanName) {
    return { success: false, error: 'Please enter your name.' };
  }

  const roomCode = generateRoomCode();
  const hostId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const hostPlayer: Player = {
    id: hostId,
    name: cleanName,
    isHost: true,
    isReady: false,
    turnOrder: 0,
    joinedAt: Date.now(),
    linesCompleted: 0,
    completedLines: [],
    hasWon: false,
    card: createDefaultCard(),
    isOnline: true,
  };

  const newRoom: RoomState = {
    id: `room_${Date.now()}`,
    roomCode,
    hostId,
    status: 'lobby',
    currentTurnPlayerId: hostId,
    currentTurnIndex: 0,
    calledNumbers: [],
    players: [hostPlayer],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    round: 1,
  };

  saveRoomState(newRoom);
  savePlayerSession(roomCode, hostId, cleanName);

  // Sync to Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('rooms').insert({
        room_code: roomCode,
        host_id: hostId,
        status: 'lobby',
        current_turn_player_id: hostId,
        current_turn_index: 0,
        called_numbers: [],
      });
      await supabase.from('players').insert({
        id: hostId,
        room_code: roomCode,
        name: cleanName,
        is_host: true,
        is_ready: false,
        turn_order: 0,
        card: hostPlayer.card,
        is_online: true,
      });
    } catch (e) {
      console.warn('Supabase initial save notice:', e);
    }
  }

  return { success: true, data: { room: newRoom, host: hostPlayer } };
}

/**
 * JOIN ROOM
 */
export async function joinRoom(
  roomCode: string,
  playerName: string
): Promise<RoomActionResult<{ room: RoomState; player: Player }>> {
  const cleanCode = roomCode.trim().toUpperCase();
  const cleanName = playerName.trim();

  if (!cleanCode) return { success: false, error: 'Please provide a valid room code.' };
  if (!cleanName) return { success: false, error: 'Please enter your name.' };

  // Fetch state
  let room = getLocalRoomState(cleanCode);

  if (!room && isSupabaseConfigured && supabase) {
    try {
      const { data: dbRoom } = await supabase.from('rooms').select('*').eq('room_code', cleanCode).single();
      if (dbRoom) {
        const { data: dbPlayers } = await supabase.from('players').select('*').eq('room_code', cleanCode);
        room = {
          id: dbRoom.id,
          roomCode: dbRoom.room_code,
          hostId: dbRoom.host_id,
          status: dbRoom.status as GameStatus,
          currentTurnPlayerId: dbRoom.current_turn_player_id,
          currentTurnIndex: dbRoom.current_turn_index,
          calledNumbers: dbRoom.called_numbers || [],
          lastCalledBy: dbRoom.last_called_by,
          winnerId: dbRoom.winner_id,
          winnerName: dbRoom.winner_name,
          players: (dbPlayers || []).map((p) => ({
            id: p.id,
            name: p.name,
            isHost: p.is_host,
            isReady: p.is_ready,
            turnOrder: p.turn_order,
            joinedAt: new Date(p.joined_at).getTime(),
            linesCompleted: p.lines_completed,
            completedLines: (p.completed_lines || []) as LineId[],
            hasWon: p.has_won,
            card: p.card || createDefaultCard(),
            isOnline: p.is_online,
          })),
          createdAt: new Date(dbRoom.created_at).getTime(),
          updatedAt: new Date(dbRoom.updated_at).getTime(),
          round: dbRoom.round || 1,
        };
        saveRoomState(room, false);
      }
    } catch (e) {
      console.warn('Error fetching room from Supabase:', e);
    }
  }

  if (!room) {
    return { success: false, error: `Room ${cleanCode} not found. Check the code and try again.` };
  }

  // Check if player is reconnecting with the same name
  const existingPlayer = room.players.find((p) => p.name.toLowerCase() === cleanName.toLowerCase());
  if (existingPlayer) {
    existingPlayer.isOnline = true;
    saveRoomState(room);
    savePlayerSession(cleanCode, existingPlayer.id, cleanName);
    return { success: true, data: { room, player: existingPlayer } };
  }

  // Disallow new players if game has already started
  if (room.status !== 'lobby') {
    return { success: false, error: 'Game has already started in this room. New players cannot join.' };
  }

  if (room.players.length >= 8) {
    return { success: false, error: 'This room is currently full (maximum 8 players).' };
  }

  const newPlayerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newPlayer: Player = {
    id: newPlayerId,
    name: cleanName,
    isHost: false,
    isReady: false,
    turnOrder: room.players.length,
    joinedAt: Date.now(),
    linesCompleted: 0,
    completedLines: [],
    hasWon: false,
    card: createDefaultCard(),
    isOnline: true,
  };

  room.players.push(newPlayer);
  saveRoomState(room);
  savePlayerSession(cleanCode, newPlayerId, cleanName);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('players').insert({
        id: newPlayerId,
        room_code: cleanCode,
        name: cleanName,
        is_host: false,
        is_ready: false,
        turn_order: newPlayer.turnOrder,
        card: newPlayer.card,
        is_online: true,
      });
    } catch (e) {
      console.warn('Supabase join insert notice:', e);
    }
  }

  return { success: true, data: { room, player: newPlayer } };
}

/**
 * HOST: START SETUP (Move from Lobby to Card Setup)
 */
export function startCardSetup(roomCode: string, hostPlayerId: string): RoomActionResult {
  const room = getLocalRoomState(roomCode);
  if (!room) return { success: false, error: 'Room not found.' };

  if (room.hostId !== hostPlayerId) {
    return { success: false, error: 'Only the host can start the game.' };
  }

  const onlinePlayers = room.players.filter((player) => player.isOnline);
  if (onlinePlayers.length < 2) {
    return { success: false, error: 'At least 2 players are required to start Friends Bingo.' };
  }

  room.status = 'setup';
  // Reset all players ready state
  room.players.forEach((p) => {
    p.isReady = false;
    p.linesCompleted = 0;
    p.completedLines = [];
    p.hasWon = false;
  });

  saveRoomState(room);
  return { success: true, data: room };
}

/**
 * PLAYER: UPDATE CARD (during setup phase)
 */
export function updatePlayerCard(roomCode: string, playerId: string, card: number[]): RoomActionResult {
  const room = getLocalRoomState(roomCode);
  if (!room) return { success: false, error: 'Room not found.' };

  if (room.status !== 'setup') {
    return { success: false, error: 'Card can only be modified during the Card Setup phase.' };
  }

  const player = room.players.find((p) => p.id === playerId);
  if (!player) return { success: false, error: 'Player not found in room.' };

  if (player.isReady) {
    return { success: false, error: 'You are marked as Ready. Unready first to edit your card.' };
  }

  const validation = validateCard(card);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  player.card = [...card];
  saveRoomState(room);
  return { success: true, data: room };
}

/**
 * PLAYER: TOGGLE READY
 */
export function setPlayerReady(roomCode: string, playerId: string, isReady: boolean): RoomActionResult {
  const room = getLocalRoomState(roomCode);
  if (!room) return { success: false, error: 'Room not found.' };

  if (room.status !== 'setup') {
    return { success: false, error: 'Ready state only applies during Card Setup.' };
  }

  const player = room.players.find((p) => p.id === playerId);
  if (!player) return { success: false, error: 'Player not found.' };

  const validation = validateCard(player.card);
  if (isReady && !validation.isValid) {
    return { success: false, error: `Cannot ready up: ${validation.error}` };
  }

  player.isReady = isReady;

  // Check if ALL players are ready!
  const onlinePlayers = room.players.filter((player) => player.isOnline);
  const allReady = onlinePlayers.length >= 2 && onlinePlayers.every((player) => player.isReady);
  if (allReady) {
    room.status = 'playing';
    room.calledNumbers = [];
    room.lastCalledBy = undefined;
    room.winnerId = undefined;
    room.winnerName = undefined;
    // Set first turn to host or turnOrder 0
    const firstPlayer = room.players.find((p) => p.turnOrder === 0) || room.players[0];
    room.currentTurnPlayerId = firstPlayer.id;
    room.currentTurnIndex = 0;
  }

  saveRoomState(room);
  return { success: true, data: room };
}

/**
 * CALL A NUMBER (Player turn action)
 */
export function callNumber(roomCode: string, playerId: string, number: number): RoomActionResult {
  const room = getLocalRoomState(roomCode);
  if (!room) return { success: false, error: 'Room not found.' };

  const check = canCallNumber(playerId, room.currentTurnPlayerId, number, room.calledNumbers, room.status);
  if (!check.allowed) {
    return { success: false, error: check.reason };
  }

  const callingPlayer = room.players.find((p) => p.id === playerId);
  if (!callingPlayer) return { success: false, error: 'Calling player not recognized.' };

  // Append number
  room.calledNumbers.push(number);
  room.lastCalledBy = {
    playerId: callingPlayer.id,
    playerName: callingPlayer.name,
    number,
    timestamp: Date.now(),
  };

  // Authoritative server line calculation for all players
  let winnerFound: Player | null = null;
  for (const player of room.players) {
    const lines = calculateCompletedLines(player.card, room.calledNumbers);
    player.completedLines = lines;
    player.linesCompleted = lines.length;

    if (isWinningState(lines) && !winnerFound) {
      player.hasWon = true;
      winnerFound = player;
    }
  }

  if (winnerFound) {
    room.status = 'ended';
    room.winnerId = winnerFound.id;
    room.winnerName = winnerFound.name;
  } else {
    // Advance turn to next player
    const nextPlayer = getNextPlayer(room.players, room.currentTurnPlayerId);
    if (nextPlayer) {
      room.currentTurnPlayerId = nextPlayer.id;
      room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.length;
    }
  }

  saveRoomState(room);
  return { success: true, data: room };
}

/**
 * PLAY AGAIN (New Round)
 */
export function playAgain(roomCode: string, hostPlayerId: string): RoomActionResult {
  const room = getLocalRoomState(roomCode);
  if (!room) return { success: false, error: 'Room not found.' };

  if (room.hostId !== hostPlayerId) {
    return { success: false, error: 'Only the host can initiate a new round.' };
  }

  room.status = 'setup';
  room.calledNumbers = [];
  room.lastCalledBy = undefined;
  room.winnerId = undefined;
  room.winnerName = undefined;
  room.round = (room.round || 1) + 1;

  // Reset player ready states and line counts; keep their cards so they can rearrange or keep
  room.players.forEach((p) => {
    p.isReady = false;
    p.linesCompleted = 0;
    p.completedLines = [];
    p.hasWon = false;
  });

  saveRoomState(room);
  return { success: true, data: room };
}

/**
 * Realtime Subscription Listener
 */
export function subscribeToRoom(roomCode: string, onUpdate: (room: RoomState) => void): () => void {
  let bc: BroadcastChannel | null = null;

  // Local BroadcastChannel listener
  try {
    bc = new BroadcastChannel(`bingo_room_${roomCode}`);
    bc.onmessage = (event) => {
      if (event.data?.type === 'ROOM_UPDATE' && event.data.room) {
        memoryRooms.set(roomCode, event.data.room);
        onUpdate(event.data.room);
      }
    };
  } catch (err) {
    console.warn('BroadcastChannel error', err);
  }

  // Storage event listener (sync across different windows)
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_PREFIX + roomCode && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        memoryRooms.set(roomCode, parsed);
        onUpdate(parsed);
      } catch (err) {
        console.error('Storage parse error', err);
      }
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
  }

  // Supabase realtime channel if configured
  let supabaseChannel: RealtimeChannel | null = null;
  if (isSupabaseConfigured && supabase) {
    supabaseChannel = supabase
      .channel(`room:${roomCode}`)
      .on('broadcast', { event: 'state_change' }, (payload) => {
        if (payload?.payload) {
          const room = payload.payload as RoomState;
          memoryRooms.set(roomCode, room);
          onUpdate(room);
        }
      })
      .subscribe();
  }

  // Cleanup function
  return () => {
    if (bc) bc.close();
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
    }
    if (supabaseChannel && supabase) {
      supabase.removeChannel(supabaseChannel);
    }
  };
}
