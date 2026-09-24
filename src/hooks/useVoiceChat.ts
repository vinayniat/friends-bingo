'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface VoiceParticipant {
  id: string;
  name: string;
  muted?: boolean;
  connected: boolean;
  speaking?: boolean;
}

type Signal =
  | { type: 'offer'; description: RTCSessionDescriptionInit }
  | { type: 'answer'; description: RTCSessionDescriptionInit }
  | { type: 'ice-candidate'; candidate: RTCIceCandidateInit };

interface VoicePresence {
  playerId: string;
  playerName: string;
  muted: boolean;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [{
    urls: [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302',
    ],
  }],
};

export function useVoiceChat(roomCode: string, playerId: string, playerName: string) {
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const channelRef = useRef<RealtimeChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef(new Map<string, RTCPeerConnection>());
  const pendingIceRef = useRef(new Map<string, RTCIceCandidateInit[]>());
  const monitorsRef = useRef(new Map<string, { context: AudioContext; source: MediaStreamAudioSourceNode; analyser: AnalyserNode; frame: number }>());
  const joinedRef = useRef(false);
  const mutedRef = useRef(false);

  const updateParticipants = useCallback((presence: Record<string, VoicePresence[]>) => {
    const next: VoiceParticipant[] = [];
    Object.values(presence).flat().forEach((value) => {
      if (value.playerId !== playerId) {
        next.push({ id: value.playerId, name: value.playerName, muted: value.muted, connected: true, speaking: false });
      }
    });
    setParticipants(next.sort((a, b) => a.name.localeCompare(b.name)));
  }, [playerId]);

  const sendSignal = useCallback((target: string, signal: Signal) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'voice_signal',
      payload: { sender: playerId, target, signal },
    }).catch(() => setError('Voice connection could not send a signal.'));
  }, [playerId]);

  const closePeer = useCallback((remoteId: string) => {
    const peer = peersRef.current.get(remoteId);
    if (peer) peer.close();
    peersRef.current.delete(remoteId);
    pendingIceRef.current.delete(remoteId);
    const monitor = monitorsRef.current.get(remoteId);
    if (monitor) {
      cancelAnimationFrame(monitor.frame);
      void monitor.context.close();
      monitorsRef.current.delete(remoteId);
    }
    setRemoteStreams((current) => {
      const next = { ...current };
      delete next[remoteId];
      return next;
    });
  }, []);

  const monitorSpeaking = useCallback((id: string, stream: MediaStream) => {
    const AudioContextClass = window.AudioContext || (
      window as typeof window & { webkitAudioContext?: typeof AudioContext }
    ).webkitAudioContext;
    if (!AudioContextClass) return;

    const context = new AudioContextClass();
    const analyser = context.createAnalyser();
    analyser.fftSize = 512;
    const source = context.createMediaStreamSource(stream);
    source.connect(analyser);
    const samples = new Uint8Array(analyser.fftSize);
    const update = () => {
      analyser.getByteTimeDomainData(samples);
      let total = 0;
      for (const sample of samples) {
        const normalized = (sample - 128) / 128;
        total += normalized * normalized;
      }
      const speaking = Math.sqrt(total / samples.length) > 0.055;
      setParticipants((current) => current.map((participant) => (
        participant.id === id ? { ...participant, speaking } : participant
      )));
      const monitor = monitorsRef.current.get(id);
      if (monitor) monitor.frame = requestAnimationFrame(update);
    };
    monitorsRef.current.set(id, { context, source, analyser, frame: requestAnimationFrame(update) });
  }, []);

  const createPeer = useCallback((remoteId: string, initiate: boolean) => {
    const existing = peersRef.current.get(remoteId);
    if (existing) return existing;
    const peer = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current.set(remoteId, peer);
    localStreamRef.current?.getTracks().forEach((track) => peer.addTrack(track, localStreamRef.current!));
    peer.onicecandidate = (event) => {
      if (event.candidate) sendSignal(remoteId, { type: 'ice-candidate', candidate: event.candidate.toJSON() });
    };
    peer.ontrack = (event) => {
      const stream = event.streams[0];
      if (stream) {
        setRemoteStreams((current) => ({ ...current, [remoteId]: stream }));
        monitorSpeaking(remoteId, stream);
      }
    };
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'failed' || peer.connectionState === 'closed' || peer.connectionState === 'disconnected') {
        closePeer(remoteId);
      }
    };
    if (initiate) {
      void peer.createOffer().then((offer) => peer.setLocalDescription(offer)).then(() => {
        if (peer.localDescription) sendSignal(remoteId, { type: 'offer', description: peer.localDescription.toJSON() });
      }).catch(() => setError('Unable to start a voice connection.'));
    }
    return peer;
  }, [closePeer, monitorSpeaking, sendSignal]);

  const join = useCallback(async () => {
    if (joinedRef.current) return;
    setError(null);
    if (!isSupabaseConfigured || !supabase) {
      setError('Voice chat is unavailable because realtime is not configured.');
      return;
    }
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof RTCPeerConnection === 'undefined') {
      setError('This browser does not support WebRTC voice chat.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      const channel = supabase.channel(`voice:${roomCode}`, {
        config: { presence: { key: playerId } },
      });
      channelRef.current = channel;
      channel.on('presence', { event: 'sync' }, () => updateParticipants(channel.presenceState<VoicePresence>()));
      channel.on('presence', { event: 'join' }, ({ newPresences }) => {
        updateParticipants(channel.presenceState<VoicePresence>());
        newPresences.forEach((presence) => {
          if (presence.playerId && playerId < presence.playerId) createPeer(presence.playerId, true);
        });
      });
      channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
        leftPresences.forEach((presence) => closePeer(presence.playerId));
        updateParticipants(channel.presenceState<VoicePresence>());
      });
      channel.on('broadcast', { event: 'voice_signal' }, async ({ payload }) => {
        if (!payload || payload.target !== playerId || !payload.sender) return;
        const remoteId = payload.sender as string;
        const signal = payload.signal as Signal;
        const peer = createPeer(remoteId, false);
        try {
          if (signal.type === 'offer') {
            await peer.setRemoteDescription(signal.description);
            const queued = pendingIceRef.current.get(remoteId) || [];
            for (const candidate of queued) await peer.addIceCandidate(candidate);
            pendingIceRef.current.delete(remoteId);
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            if (peer.localDescription) sendSignal(remoteId, { type: 'answer', description: peer.localDescription.toJSON() });
          } else if (signal.type === 'answer') {
            await peer.setRemoteDescription(signal.description);
            const queued = pendingIceRef.current.get(remoteId) || [];
            for (const candidate of queued) await peer.addIceCandidate(candidate);
            pendingIceRef.current.delete(remoteId);
          } else {
            if (peer.remoteDescription) {
              await peer.addIceCandidate(signal.candidate);
            } else {
              const queued = pendingIceRef.current.get(remoteId) || [];
              queued.push(signal.candidate);
              pendingIceRef.current.set(remoteId, queued);
            }
          }
        } catch {
          closePeer(remoteId);
          setError('A voice connection could not be established.');
        }
      });
      await new Promise<void>((resolve, reject) => {
        channel.subscribe(async (status) => {
          if (status !== 'SUBSCRIBED') {
            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') reject(new Error('Realtime unavailable'));
            return;
          }
          await channel.track({ playerId, playerName, muted: false } satisfies VoicePresence);
          resolve();
        });
      });
      joinedRef.current = true;
      setJoined(true);
      const presence = channel.presenceState<VoicePresence>();
      updateParticipants(presence);
      Object.values(presence).flat().forEach((value) => {
        if (value.playerId !== playerId && playerId < value.playerId) createPeer(value.playerId, true);
      });
    } catch (cause) {
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      monitorsRef.current.forEach((monitor) => {
        cancelAnimationFrame(monitor.frame);
        void monitor.context.close();
      });
      monitorsRef.current.clear();
      channelRef.current && supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      setError(cause instanceof DOMException && cause.name === 'NotAllowedError'
        ? 'Microphone permission is required to use voice chat.'
        : 'Could not join voice chat. Please try again.');
    }
  }, [closePeer, createPeer, playerId, playerName, roomCode, sendSignal, updateParticipants]);

  const leave = useCallback(() => {
    joinedRef.current = false;
    peersRef.current.forEach((peer) => peer.close());
    peersRef.current.clear();
    pendingIceRef.current.clear();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    if (channelRef.current && supabase) void supabase.removeChannel(channelRef.current);
    channelRef.current = null;
    setJoined(false);
    setParticipants([]);
    setRemoteStreams({});
  }, []);

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    localStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !next; });
    if (channelRef.current) {
      void channelRef.current.track({ playerId, playerName, muted: next } satisfies VoicePresence);
    }
  }, [playerId, playerName]);

  useEffect(() => leave, [leave]);
  useEffect(() => {
    const handleUnload = () => leave();
    window.addEventListener('pagehide', handleUnload);
    return () => window.removeEventListener('pagehide', handleUnload);
  }, [leave]);
  return { joined, muted, error, participants, remoteStreams, join, leave, toggleMute };
}
