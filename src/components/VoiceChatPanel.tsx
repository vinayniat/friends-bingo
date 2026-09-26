'use client';

import React, { useEffect, useRef } from 'react';
import { Mic, MicOff, Phone, PhoneOff, Volume2 } from 'lucide-react';
import { useVoiceChat } from '@/hooks/useVoiceChat';

interface VoiceChatPanelProps {
  roomCode: string;
  playerId: string;
  playerName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function VoiceChatPanel({ roomCode, playerId, playerName, isOpen, onClose }: VoiceChatPanelProps) {
  const voice = useVoiceChat(roomCode, playerId, playerName);
  useEffect(() => { if (isOpen && !voice.joined) void voice.join(); }, [isOpen, voice.join, voice.joined]);
  if (!isOpen) return null;
  const closePanel = () => { voice.leave(); onClose(); };
  return (
    <aside className="fixed inset-x-0 bottom-0 z-50 w-full rounded-t-3xl border border-indigo-100 bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-slate-800 shadow-2xl sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-20 sm:w-[min(calc(100vw-2rem),22rem)] sm:rounded-2xl sm:p-4" aria-label="Voice chat">
      <div className="mb-3 flex items-center justify-between">
        <div><h2 className="font-black">Voice chat</h2><p className="text-xs text-slate-500">{voice.joined ? `${voice.participants.length + 1} in room` : 'Join to talk with players'}</p></div>
        <button onClick={closePanel} aria-label="Close voice chat" className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">×</button>
      </div>
      {voice.error && <p role="alert" className="mb-3 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">{voice.error}</p>}
      <div className="space-y-2">
        {voice.joined && <div className={`flex items-center gap-2 rounded-xl bg-indigo-50 p-2 text-sm font-semibold ${!voice.muted ? 'ring-2 ring-emerald-200' : ''}`}><span className="h-2 w-2 rounded-full bg-emerald-500" />{playerName} <span className="ml-auto text-xs text-slate-500">You</span></div>}
        {voice.participants.map((participant) => <div key={participant.id} className={`flex items-center gap-2 rounded-xl border border-slate-100 p-2 text-sm ${participant.speaking ? 'ring-2 ring-emerald-300' : ''}`}><span className={`h-2 w-2 rounded-full ${participant.speaking ? 'animate-pulse bg-emerald-500' : 'bg-emerald-300'}`} />{participant.name}{participant.muted && <MicOff className="ml-auto h-4 w-4 text-slate-400" />}</div>)}
        {voice.joined && voice.participants.length === 0 && <p className="py-2 text-center text-xs text-slate-500">Waiting for another player to join voice.</p>}
      </div>
      {voice.joined ? <div className="mt-4 flex gap-2"><button onClick={voice.toggleMute} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold">{voice.muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}{voice.muted ? 'Unmute' : 'Mute'}</button><button onClick={() => { voice.leave(); onClose(); }} className="flex items-center justify-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600"><PhoneOff className="h-4 w-4" />Leave</button></div> : <button onClick={() => void voice.join()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-bold text-white"><Phone className="h-4 w-4" />Join voice chat</button>}
      {Object.entries(voice.remoteStreams).map(([id, stream]) => <RemoteAudio key={id} stream={stream} />)}
      <div className="mt-3 flex items-center gap-1 text-[11px] text-slate-400"><Volume2 className="h-3 w-3" /> Audio is peer-to-peer and room-scoped.</div>
    </aside>
  );
}

function RemoteAudio({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => { if (ref.current) ref.current.srcObject = stream; }, [stream]);
  return <audio ref={ref} autoPlay playsInline />;
}
