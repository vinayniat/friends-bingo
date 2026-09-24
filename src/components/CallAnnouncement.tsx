'use client';

import React, { useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';

interface CallAnnouncementProps {
  lastCalledBy?: {
    playerId: string;
    playerName: string;
    number: number;
    timestamp: number;
  };
}

export const CallAnnouncement: React.FC<CallAnnouncementProps> = ({ lastCalledBy }) => {
  const [visible, setVisible] = useState(false);
  const [currentCall, setCurrentCall] = useState(lastCalledBy);

  useEffect(() => {
    if (lastCalledBy) {
      setCurrentCall(lastCalledBy);
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [lastCalledBy?.timestamp, lastCalledBy?.number]);

  if (!visible || !currentCall) return null;

  return (
    <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-top-6 duration-300">
      <div className="flex items-center gap-3 rounded-2xl border-2 border-pink-200 bg-white px-5 py-3 shadow-xl shadow-pink-100">
        <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-400 flex items-center justify-center text-pink-300">
          <Megaphone className="w-5 h-5 animate-bounce" />
        </div>
        <div>
          <p className="text-xs uppercase font-extrabold tracking-wider text-pink-300">
            {currentCall.playerName} CALLED
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-[#EC4899]">
              {currentCall.number}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
