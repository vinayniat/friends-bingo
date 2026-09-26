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
    <div className="relative z-10 flex w-full justify-center px-4 pt-3 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex max-w-full items-center gap-3 rounded-2xl border border-pink-200 bg-white px-4 py-2.5 shadow-md shadow-pink-100 sm:px-5 sm:py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-pink-200 bg-pink-50 text-[#EC4899] sm:h-10 sm:w-10">
          <Megaphone className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-extrabold uppercase tracking-wider text-[#EC4899]">
            {currentCall.playerName} CALLED
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-[#EC4899] sm:text-3xl">
              {currentCall.number}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
