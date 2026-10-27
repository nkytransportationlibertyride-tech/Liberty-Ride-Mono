/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Owner Administration Console Container
 */

import React, { useState, useEffect } from 'react';
import { useTransit } from '../../context/TransitContext';
import { formatEasternTime } from '../../utils/transit';
import { OperationsDashboardView } from './OperationsDashboardView';
import { RideDossierView } from './RideDossierView';
import { DriversManagementView } from './DriversManagementView';
import { SecurityGateView } from './SecurityGateView';

export const OwnerConsole: React.FC = () => {
  const {
    ownerTab,
    setOwnerTab,
    isOwnerUnlocked,
    lockOwnerConsole,
    toggleAudioAlerts,
    audioAlertsEnabled,
  } = useTransit();

  const [timeStr, setTimeStr] = useState(formatEasternTime());

  useEffect(() => {
    const t = setInterval(() => setTimeStr(formatEasternTime()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#fbf9f9] text-[#1b1c1c] flex flex-col font-sans">
      {/* Console Sub-Header */}
      <header className="sticky top-11 left-0 right-0 z-40 bg-white border-b border-neutral-200 shadow-xs">
        <div className="h-16 max-w-[1280px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-black uppercase">
                LIBERTY RIDE
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#efeded] text-neutral-800 text-[10px] font-bold tracking-wide uppercase">
                Owner Console
              </span>
            </div>

            {/* Navigation Tabs (Accessible when unlocked) */}
            <nav className="hidden md:flex items-center gap-1 p-1 rounded-full bg-[#f5f3f3] border border-neutral-200/60 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setOwnerTab('dashboard')}
                className={`px-3.5 py-1.5 rounded-full transition-all ${
                  ownerTab === 'dashboard'
                    ? 'bg-black text-white shadow-xs'
                    : 'text-neutral-600 hover:text-black hover:bg-[#e3e2e2]'
                }`}
              >
                Operations Dashboard
              </button>
              <button
                type="button"
                onClick={() => setOwnerTab('rides')}
                className={`px-3.5 py-1.5 rounded-full transition-all ${
                  ownerTab === 'rides'
                    ? 'bg-black text-white shadow-xs'
                    : 'text-neutral-600 hover:text-black hover:bg-[#e3e2e2]'
                }`}
              >
                Rides Management
              </button>
              <button
                type="button"
                onClick={() => setOwnerTab('drivers')}
                className={`px-3.5 py-1.5 rounded-full transition-all ${
                  ownerTab === 'drivers'
                    ? 'bg-black text-white shadow-xs'
                    : 'text-neutral-600 hover:text-black hover:bg-[#e3e2e2]'
                }`}
              >
                Drivers & Zones
              </button>
              <button
                type="button"
                onClick={() => setOwnerTab('security')}
                className={`px-3.5 py-1.5 rounded-full transition-all ${
                  ownerTab === 'security'
                    ? 'bg-black text-white shadow-xs'
                    : 'text-neutral-600 hover:text-black hover:bg-[#e3e2e2]'
                }`}
              >
                Security Gate
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5f3f3] border border-neutral-200 text-xs">
              <span className="material-symbols-outlined text-[15px] text-neutral-500">schedule</span>
              <span className="font-mono font-bold text-black">{timeStr}</span>
            </div>

            <button
              type="button"
              onClick={toggleAudioAlerts}
              className="w-9 h-9 rounded-full bg-[#f5f3f3] hover:bg-[#e3e2e2] text-black flex items-center justify-center transition-colors border border-neutral-200"
              title="Toggle audio alerts"
            >
              <span className="material-symbols-outlined text-[18px]">
                {audioAlertsEnabled ? 'notifications_active' : 'notifications_off'}
              </span>
            </button>

            {isOwnerUnlocked ? (
              <button
                type="button"
                onClick={lockOwnerConsole}
                className="h-9 px-3.5 rounded-full bg-[#f5f3f3] hover:bg-[#e3e2e2] text-black flex items-center gap-1.5 text-xs font-bold transition-colors border border-neutral-200"
              >
                <span className="material-symbols-outlined text-[16px]">lock</span>
                <span>Lock</span>
              </button>
            ) : (
              <span className="text-xs text-neutral-500 font-semibold">Vault Locked</span>
            )}
          </div>
        </div>
      </header>

      {/* Main Console View Body */}
      <main className="w-full flex-1">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6">
          {!isOwnerUnlocked && ownerTab !== 'security' ? (
            <SecurityGateView />
          ) : ownerTab === 'security' ? (
            <SecurityGateView />
          ) : ownerTab === 'dashboard' ? (
            <OperationsDashboardView />
          ) : ownerTab === 'rides' ? (
            <RideDossierView />
          ) : (
            <DriversManagementView />
          )}
        </div>
      </main>

      {/* Console Footer */}
      <footer className="w-full bg-[#f5f3f3] border-t border-neutral-200/80 py-4 mt-auto">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-neutral-600">
          <div className="flex items-center gap-3">
            <span className="font-bold text-black">Liberty Ride NKY Trans, LLC</span>
            <span>Erlanger, KY • Dispatch Support +1 (859) 537-1827</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Operational Console v2.4</span>
            <span className="w-2 h-2 rounded-full bg-[#006d37]"></span>
            <span className="text-black font-semibold">Systems Operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
