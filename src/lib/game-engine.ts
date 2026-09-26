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
const persistenceQueues = new Map<string, Promise<void>>();

function cacheRoomState(room: RoomState) {
  memoryRooms.set(room.roomCode, room);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_PREFIX + room.roomCode, JSON.stringify(room));
    } catch (e) {
      console.error('Failed saving room to localStorage', e);
    }
  }
}

function queueRoomPersistence(room: RoomState) {
  if (!supabase || !isSupabaseConfigured) return;

  const snapshot = structuredClone(room);
  const previous = persistenceQueues.get(room.roomCode) || Promise.resolve();
  const next = previous
    .catch((error) => console.error('Previous room persistence failed:', error))
    .then(async () => {
      const { error: roomError } = await supabase!
        .from('rooms')
        .update({
          status: snapshot.status,
          current_turn_player_id: snapshot.currentTurnPlayerId,
          current_turn_index: snapshot.currentTurnIndex,
          called_numbers: snapshot.calledNumbers,
          last_called_by: snapshot.lastCalledBy || null,
          winner_id: snapshot.winnerId || null,
          winner_name: snapshot.winnerName || null,
          round: snapshot.round,
          updated_at: new Date(snapshot.updatedAt).toISOString(),
        })
        .eq('room_code', snapshot.roomCode);

      if (roomError) {
        console.error('Failed persisting room state to Supabase:', roomError);
        return;
      }

      const results = await Promise.all(snapshot.players.map((player) =>
        supabase!
          .from('players')
          .update({
            name: player.name,
            is_host: player.isHost,
            is_ready: player.isReady,
            turn_order: player.turnOrder,
            lines_completed: player.linesCompleted,
            completed_lines: player.completedLines,
            has_won: player.hasWon,
            card: player.card,
            is_online: player.isOnline,
          })
          .eq('room_code', snapshot.roomCode)
          .eq('id', player.id)
      ));
      results.forEach(({ error }) => {
        if (error) console.error('Failed persisting player state to Supabase:', error);
      });
    })
    .catch((error) => console.error('Unexpected room persistence failure:', error));

  persistenceQueues.set(room.roomCode, next);
  void next.finally(() => {
    if (persistenceQueues.get(room.roomCode) === next) {
      persistenceQueues.delete(room.roomCode);
    }
  });
}

function mapDatabaseRoom(dbRoom: Record<string, unknown>, dbPlayers: Record<string, unknown>[]): RoomState {
  return {
    id: String(dbRoom.id),
    roomCode: String(dbRoom.room_code),
    hostId: String(dbRoom.host_id),
    status: dbRoom.status as GameStatus,
    currentTurnPlayerId: String(dbRoom.current_turn_player_id || ''),
    currentTurnIndex: Number(dbRoom.current_turn_index || 0),
    calledNumbers: (dbRoom.called_numbers as number[] | null) || [],
    lastCalledBy: (dbRoom.last_called_by as RoomState['lastCalledBy']) || undefined,
    winnerId: (dbRoom.winner_id as string | null) || undefined,
    winnerName: (dbRoom.winner_name as string | null) || undefined,
    players: dbPlayers.map((player) => ({
      id: String(player.id),
      name: String(player.name),
      isHost: Boolean(player.is_host),
      isReady: Boolean(player.is_ready),
      turnOrder: Number(player.turn_order || 0),
      joinedAt: player.joined_at ? new Date(String(player.joined_at)).getTime() : Date.now(),
      linesCompleted: Number(player.lines_completed || 0),
      completedLines: (player.completed_lines as LineId[] | null) || [],
      hasWon: Boolean(player.has_won),
      card: (player.card as number[] | null) || createDefaultCard(),
      isOnline: Boolean(player.is_online),
    })).sort((a, b) => a.turnOrder - b.turnOrder),
    createdAt: dbRoom.created_at ? new Date(String(dbRoom.created_at)).getTime() : Date.now(),
    updatedAt: dbRoom.updated_at ? new Date(String(dbRoom.updated_at)).getTime() : 0,
    round: Number(dbRoom.round || 1),
  };
}

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
  if (broadcast) room.updatedAt = Math.max(Date.now(), room.updatedAt + 1);
  cacheRoomState(room);
  if (!broadcast) return;

  if (typeof window !== 'undefined') {
    // 1. BroadcastChannel for local cross-tab sync
    try {
      const bc = new BroadcastChannel(`bingo_room_${room.roomCode}`);
      bc.postMessage({ type: 'ROOM_UPDATE', room });
      bc.close();
    } catch {
      // Fallback for older browsers
    }
  }

  // Persist current game state so a refresh restores the latest card, calls, and caller.
  queueRoomPersistence(room);

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

export async function loadRoomState(roomCode: string): Promise<RoomState | null> {
  const cleanCode = roomCode.trim().toUpperCase();
  const localRoom = getLocalRoomState(cleanCode);
  if (!isSupabaseConfigured || !supabase) return localRoom;

  try {
    const { data: dbRoom, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('room_code', cleanCode)
      .single();

    if (roomError) {
      if (roomError.code !== 'PGRST116') console.error('Failed loading room from Supabase:', roomError);
      return localRoom;
    }

    const { data: dbPlayers, error: playersError } = await supabase
      .from('players')
      .select('*')
      .eq('room_code', cleanCode);

    if (playersError) {
      console.error('Failed loading room players from Supabase:', playersError);
      return localRoom;
    }

    const remoteRoom = mapDatabaseRoom(dbRoom as Record<string, unknown>, (dbPlayers || []) as Record<string, unknown>[]);
    const latestRoom = !localRoom || remoteRoom.updatedAt >= localRoom.updatedAt ? remoteRoom : localRoom;
    cacheRoomState(latestRoom);
    return latestRoom;
  } catch (error) {
    console.error('Unexpected error loading room from Supabase:', error);
    return localRoom;
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

  // A player leaving an active two-player match gives the remaining player the win.
  if (room.status === 'playing' && room.players.length === 1) {
    const remainingPlayer = room.players[0];
    room.status = 'ended';
    room.winnerId = remainingPlayer.id;
    room.winnerName = remainingPlayer.name;
    remainingPlayer.hasWon = true;
  }

  const shouldDeleteCompletedRoom = room.status === 'ended' && room.players.length === 0;
  if (shouldDeleteCompletedRoom) {
    memoryRooms.delete(cleanCode);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_PREFIX + cleanCode);
      sessionStorage.removeItem(PLAYER_SESSION_PREFIX + cleanCode);
    }
  } else {
    saveRoomState(room);
  }

  if (isSupabaseConfigured && supabase) {
    const { error: playerDeleteError } = await supabase
      .from('players')
      .delete()
      .eq('room_code', cleanCode)
      .eq('id', playerId);

    if (playerDeleteError) {
      console.warn('Supabase leave delete notice:', playerDeleteError);
    }

    if (shouldDeleteCompletedRoom) {
      const { error: roomDeleteError } = await supabase
        .from('rooms')
        .delete()
        .eq('room_code', cleanCode);

      if (roomDeleteError) {
        console.warn('Supabase completed room cleanup notice:', roomDeleteError);
      }
    } else if (room.status === 'ended' && room.winnerId && room.winnerName) {
      const { error: roomUpdateError } = await supabase
        .from('rooms')
        .update({
          status: 'ended',
          winner_id: room.winnerId,
          winner_name: room.winnerName,
        })
        .eq('room_code', cleanCode);

      if (roomUpdateError) {
        console.warn('Supabase forfeit update notice:', roomUpdateError);
      }
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
        room = mapDatabaseRoom(
          dbRoom as Record<string, unknown>,
          (dbPlayers || []) as Record<string, unknown>[]
        );
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
  const applyUpdate = (room: RoomState) => {
    const current = getLocalRoomState(roomCode);
    if (current && room.updatedAt < current.updatedAt) return;
    cacheRoomState(room);
    onUpdate(room);
  };
  let bc: BroadcastChannel | null = null;

  // Local BroadcastChannel listener
  try {
    bc = new BroadcastChannel(`bingo_room_${roomCode}`);
    bc.onmessage = (event) => {
      if (event.data?.type === 'ROOM_UPDATE' && event.data.room) {
        applyUpdate(event.data.room);
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
        applyUpdate(parsed);
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
          applyUpdate(room);
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
