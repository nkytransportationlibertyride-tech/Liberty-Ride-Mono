/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Universal Multi-Portal Header & Role Switcher
 */

import React, { useState, useEffect } from 'react';
import { useTransit } from '../../context/TransitContext';
import { formatEasternTime } from '../../utils/transit';
import { UserRole } from '../../types/transit';

export const PortalHeader: React.FC = () => {
  const {
    role,
    setRole,
    audioAlertsEnabled,
    toggleAudioAlerts,
    isOwnerUnlocked,
    lockOwnerConsole,
  } = useTransit();

  const [timeStr, setTimeStr] = useState<string>(formatEasternTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeStr(formatEasternTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const rolesList: { id: UserRole; label: string; icon: string; badge?: string }[] = [
    { id: 'public', label: 'Customer Web', icon: 'public' },
    { id: 'rider', label: 'Rider App', icon: 'smartphone' },
    { id: 'owner', label: 'Owner Console', icon: 'shield', badge: isOwnerUnlocked ? 'UNLOCKED' : 'VAULT' },
    { id: 'driver', label: 'Driver App', icon: 'local_taxi' },
  ];

  return (
    <aside
      aria-label="System navigation and role switcher"
      className="bg-[#111111] text-white border-b border-neutral-800 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3 z-50 sticky top-0"
    >
      {/* Brand & Regional Tag */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 font-bold tracking-tight text-white uppercase">
          <span className="w-2 h-2 rounded-full bg-[#06C167] animate-pulse"></span>
          <span>LIBERTY RIDE NKY</span>
        </div>
        <span className="text-neutral-500 hidden sm:inline">|</span>
        <div className="hidden sm:flex items-center gap-1 text-neutral-400">
          <span className="material-symbols-outlined text-[14px]">location_on</span>
          <span>Erlanger Base</span>
          <span className="text-neutral-600">•</span>
          <span className="tabular-nums font-mono text-neutral-300">{timeStr}</span>
        </div>
      </div>

      {/* Role Switcher Pills */}
      <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-full border border-neutral-800">
        {rolesList.map((item) => {
          const isActive = role === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setRole(item.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isActive
                  ? 'bg-white text-black shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && (
                <span
                  className={`text-[9px] px-1 rounded-full font-bold uppercase ${
                    item.badge === 'UNLOCKED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Global Telemetry & Hotline */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleAudioAlerts}
          title={audioAlertsEnabled ? 'Audio alerts active' : 'Audio alerts muted'}
          className={`h-7 px-2 rounded-full flex items-center gap-1 text-[11px] transition-colors ${
            audioAlertsEnabled
              ? 'bg-neutral-800 text-emerald-400 border border-neutral-700'
              : 'bg-neutral-900 text-neutral-500'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">
            {audioAlertsEnabled ? 'notifications_active' : 'notifications_off'}
          </span>
          <span className="hidden md:inline">{audioAlertsEnabled ? 'Alerts On' : 'Muted'}</span>
        </button>

        {role === 'owner' && isOwnerUnlocked && (
          <button
            onClick={lockOwnerConsole}
            className="h-7 px-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-full flex items-center gap-1 text-[11px] transition-colors"
          >
            <span className="material-symbols-outlined text-[13px]">lock</span>
            <span>Lock</span>
          </button>
        )}

        <a
          href="tel:+18595371827"
          className="h-7 px-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full flex items-center gap-1 text-[11px] font-semibold transition-colors"
        >
          <span className="material-symbols-outlined text-[14px] text-emerald-400">call</span>
          <span>+1 (859) 537-1827</span>
        </a>
      </div>
    </aside>
  );
};
