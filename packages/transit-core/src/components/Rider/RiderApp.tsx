/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Rider Mobile App Container & Navigation
 */

import React from 'react';
import { useTransit } from '../../context/TransitContext';
import { RideBookingView } from './RideBookingView';
import { QuoteReviewView } from './QuoteReviewView';
import { TripTrackingView } from './TripTrackingView';
import { AirportCvgView } from './AirportCvgView';
import { TripHistoryView } from './TripHistoryView';
import { SupportView } from './SupportView';

export const RiderApp: React.FC = () => {
  const { riderTab, setRiderTab, setRole } = useTransit();

  return (
    <div className="min-h-screen bg-[#fbf9f9] text-[#1b1c1c] flex flex-col max-w-md mx-auto w-full relative shadow-2xl border-x border-neutral-200">
      {/* Mobile Top Header */}
      <header className="sticky top-11 left-0 w-full z-40 bg-[#fbf9f9]/90 backdrop-blur-md border-b border-neutral-200/60 shadow-xs">
        {/* iOS Time & Status Buffer */}
        <div className="flex items-center justify-between px-4 h-6 select-none text-[11px] font-bold text-black pt-1">
          <span>9:41</span>
          <div className="flex items-center gap-1.5 text-black">
            <span className="material-symbols-outlined text-[13px]">signal_cellular_alt</span>
            <span className="material-symbols-outlined text-[13px]">wifi</span>
            <span className="material-symbols-outlined text-[15px]">battery_full</span>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="h-14 px-4 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-black uppercase">LIBERTY RIDE</span>
              <span className="text-[10px] bg-[#e3e2e2] px-1.5 py-0.5 rounded text-neutral-800 font-bold tracking-wider">
                NKY
              </span>
            </div>
            <span className="text-xs text-neutral-500 -mt-0.5">
              {riderTab === 'airport-cvg'
                ? 'Airport CVG'
                : riderTab === 'history'
                ? 'Trip History'
                : riderTab === 'ride'
                ? 'Ride Booking'
                : riderTab === 'quote'
                ? 'Quote Review'
                : riderTab === 'tracking'
                ? 'Active Tracking'
                : 'Customer Support'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="tel:+18595371827"
              className="w-10 h-10 rounded-full bg-[#efeded] hover:bg-[#e3e2e2] flex items-center justify-center text-red-600 transition-colors shadow-xs"
              aria-label="Call Dispatch +1 (859) 537-1827"
            >
              <span className="material-symbols-outlined text-[18px]">call</span>
            </a>

            <button
              onClick={() => setRole('owner')}
              className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white"
              title="Switch to Owner Console"
            >
              <span className="material-symbols-outlined text-[17px]">person</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Tab View */}
      <main className="flex-1 px-4 py-4 pb-24">
        {riderTab === 'ride' && <RideBookingView />}
        {riderTab === 'quote' && <QuoteReviewView />}
        {riderTab === 'tracking' && <TripTrackingView />}
        {riderTab === 'airport-cvg' && <AirportCvgView />}
        {riderTab === 'history' && <TripHistoryView />}
        {riderTab === 'support' && <SupportView />}
      </main>

      {/* Fixed Bottom Tab Bar (5 Tabs) */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 bg-[#fbf9f9]/95 backdrop-blur-md border-t border-neutral-200 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] pb-safe">
        <div className="flex justify-around items-center h-16 px-1">
          {/* Ride Tab */}
          <button
            type="button"
            onClick={() => setRiderTab('ride')}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[50px] h-12 transition-colors ${
              riderTab === 'ride' || riderTab === 'quote' ? 'text-black font-bold' : 'text-neutral-500 hover:text-black'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">local_taxi</span>
            <span className="text-[10px]">Ride</span>
          </button>

          {/* Tracking Tab */}
          <button
            type="button"
            onClick={() => setRiderTab('tracking')}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[50px] h-12 transition-colors ${
              riderTab === 'tracking' ? 'text-black font-bold' : 'text-neutral-500 hover:text-black'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">near_me</span>
            <span className="text-[10px]">Tracking</span>
          </button>

          {/* Airport CVG Tab */}
          <button
            type="button"
            onClick={() => setRiderTab('airport-cvg')}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[50px] h-12 transition-colors ${
              riderTab === 'airport-cvg' ? 'text-black font-bold' : 'text-neutral-500 hover:text-black'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">flight</span>
            <span className="text-[10px]">Airport</span>
          </button>

          {/* Trip History Tab */}
          <button
            type="button"
            onClick={() => setRiderTab('history')}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[50px] h-12 transition-colors ${
              riderTab === 'history' ? 'text-black font-bold' : 'text-neutral-500 hover:text-black'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">history</span>
            <span className="text-[10px]">History</span>
          </button>

          {/* Support Tab */}
          <button
            type="button"
            onClick={() => setRiderTab('support')}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[50px] h-12 transition-colors ${
              riderTab === 'support' ? 'text-black font-bold' : 'text-neutral-500 hover:text-black'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">headset_mic</span>
            <span className="text-[10px]">Support</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default RiderApp;
