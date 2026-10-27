/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useTransit } from '../../context/TransitContext';
import { DriverSignInView } from './DriverSignInView';
import { OffersInboxView } from './OffersInboxView';
import { ActiveRideView } from './ActiveRideView';
import { DriverEarningsView } from './DriverEarningsView';
import { SupportView } from '../Rider/SupportView';

type DriverTab = 'offers' | 'active-ride' | 'earnings' | 'support';

export const DriverApp: React.FC = () => {
  const { currentDriver, logoutDriver, rides } = useTransit();
  const [activeTab, setActiveTab] = useState<DriverTab>('offers');
  const [showDriverMenu, setShowDriverMenu] = useState(false);

  // If driver is not authenticated, show sign-in view
  if (!currentDriver) {
    return <DriverSignInView />;
  }

  // Count active/pending offers
  const pendingOffersCount = rides.filter(
    (r) => r.status === 'requested' || r.status === 'request_confirmed' || r.status === 'driver_offer_sent'
  ).length;

  // Active in-progress ride
  const activeRide = rides.find(
    (r) =>
      r.driverId === currentDriver.id &&
      (r.status === 'driver_confirmed' || r.status === 'driver_en_route')
  );

  return (
    <div className="min-h-screen bg-surface flex flex-col max-w-md mx-auto w-full relative shadow-2xl overflow-x-hidden border-x border-surface-container">
      {/* Top iOS / Mobile Status & Header */}
      <header className="sticky top-0 w-full z-50 bg-surface/95 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-container">
        {/* Mobile Clock & Status indicators */}
        <div className="flex items-center justify-between px-margin h-6 select-none text-[12px] font-semibold text-on-surface">
          <span>9:41</span>
          <div className="flex items-center gap-1.5 text-on-surface">
            <span className="material-symbols-outlined text-[14px]">signal_cellular_alt</span>
            <span className="material-symbols-outlined text-[14px]">wifi</span>
            <span className="material-symbols-outlined text-[16px]">battery_full</span>
          </div>
        </div>

        {/* Brand bar */}
        <div className="h-14 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[17px] tracking-tight text-primary uppercase font-bold">
              LIBERTY RIDE
            </span>
            <span className="bg-neutral-150 bg-gray-200 text-neutral-700 text-[11px] uppercase px-2 py-0.5 rounded font-bold">
              Driver
            </span>
          </div>

          <div className="flex items-center gap-space-xs">
            <a
              aria-label="Call Dispatch +1 (859) 537-1827"
              className="w-10 h-10 flex items-center justify-center rounded-full text-primary hover:bg-surface-container transition-colors"
              href="tel:+18595371827"
            >
              <span className="material-symbols-outlined text-[20px]">call</span>
            </a>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDriverMenu(!showDriverMenu)}
                className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary hover:bg-neutral-800 transition-colors"
                title={`${currentDriver.name} (${currentDriver.phone})`}
              >
                <span className="font-label-sm text-[11px] font-bold">
                  {currentDriver.name.split(' ').map((n) => n[0]).join('')}
                </span>
              </button>

              {showDriverMenu && (
                <div className="absolute right-0 top-10 w-56 bg-surface-container-lowest rounded-xl shadow-xl p-3 z-50 border border-surface-container flex flex-col gap-2">
                  <div className="flex flex-col border-b border-surface-container pb-2">
                    <span className="font-label-md text-label-md text-on-surface font-bold">
                      {currentDriver.name}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {currentDriver.phone}
                    </span>
                    <span className="font-label-sm text-[10px] text-secondary font-mono mt-0.5">
                      UID: {currentDriver.refId}
                    </span>
                  </div>
                  <div className="text-[12px] text-on-surface-variant">
                    Vehicle: <span className="text-on-surface font-medium">{currentDriver.vehicle || 'Standard Fleet'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      logoutDriver();
                      setShowDriverMenu(false);
                    }}
                    className="w-full text-left py-1.5 px-2 rounded-lg hover:bg-error-container text-error font-label-sm text-label-sm flex items-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">logout</span>
                    <span>Sign Out Driver</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 flex flex-col pb-24">
        {activeTab === 'offers' && <OffersInboxView />}
        {activeTab === 'active-ride' && <ActiveRideView />}
        {activeTab === 'earnings' && <DriverEarningsView />}
        {activeTab === 'support' && <SupportView />}
      </main>

      {/* Bottom Driver Tab Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 pb-safe bg-surface/95 backdrop-blur-xl shadow-[0_-4px_16px_rgba(0,0,0,0.06)] border-t border-surface-container"
        data-active-classes="text-primary font-bold"
      >
        <div className="flex justify-around items-center h-16 px-space-xs">
          {/* Offers Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('offers')}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[48px] transition-colors relative ${
              activeTab === 'offers' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <div className="relative">
              <span className="material-symbols-outlined text-[24px]">local_taxi</span>
              {pendingOffersCount > 0 && (
                <span className="absolute -top-1 -right-2 w-4 h-4 bg-secondary text-on-secondary rounded-full text-[10px] flex items-center justify-center font-bold">
                  {pendingOffersCount}
                </span>
              )}
            </div>
            <span className="font-label-sm text-label-sm">Offers</span>
          </button>

          {/* Active Ride Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('active-ride')}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[48px] transition-colors relative ${
              activeTab === 'active-ride' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <div className="relative">
              <span className="material-symbols-outlined text-[24px]">navigation</span>
              {activeRide && (
                <span className="absolute -top-0.5 -right-1 w-2.5 h-2.5 bg-[#06C167] rounded-full animate-pulse" />
              )}
            </div>
            <span className="font-label-sm text-label-sm">Active Ride</span>
          </button>

          {/* Earnings Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('earnings')}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[48px] transition-colors ${
              activeTab === 'earnings' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">payments</span>
            <span className="font-label-sm text-label-sm">Earnings</span>
          </button>

          {/* Support Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('support')}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[48px] transition-colors ${
              activeTab === 'support' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">help</span>
            <span className="font-label-sm text-label-sm">Support</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default DriverApp;
