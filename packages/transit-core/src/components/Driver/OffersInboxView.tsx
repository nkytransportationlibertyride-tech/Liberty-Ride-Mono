/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Driver Mobile App - Offers Inbox View
 */

import React, { useState, useEffect } from 'react';
import { useTransit } from '../../context/TransitContext';

export const OffersInboxView: React.FC = () => {
  const {
    activeRide,
    acceptRideOffer,
    declineRideOffer,
    currentDriver,
  } = useTransit();

  const [totalSeconds, setTotalSeconds] = useState(219); // 03:39
  const [offerClaimed, setOfferClaimed] = useState(false);
  const [declined, setDeclined] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTotalSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s} remaining`;
  };

  const ride = activeRide;

  const handleAccept = () => {
    if (!ride) return;
    setOfferClaimed(true);
    setTimeout(() => {
      acceptRideOffer(ride.id, currentDriver?.id);
    }, 450);
  };

  const handleDecline = () => {
    if (!ride) return;
    if (confirm('Decline this ride offer? It will return to dispatch.')) {
      setDeclined(true);
      declineRideOffer(ride.id);
    }
  };

  return (
    <div className="flex flex-col w-full pb-8 space-y-4">
      {/* Header Info */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-extrabold text-black tracking-tight">
            Offers Inbox
          </h1>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-neutral-200 rounded-full shadow-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                !declined && !offerClaimed ? 'bg-[#006d37] animate-pulse' : 'bg-neutral-400'
              }`}
            ></span>
            <span className="text-[10px] font-bold text-black uppercase tracking-wider">
              {!declined && !offerClaimed ? '1 Pending Offer' : '0 Pending Offers'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-neutral-500 text-xs font-medium">
          <span className="material-symbols-outlined text-[15px] animate-spin">sync</span>
          <span>Auto-refreshes every 15s • Pull to refresh</span>
        </div>
      </div>

      {/* Primary Pending Offer Card */}
      {!declined && ride ? (
        <div className="relative bg-white rounded-2xl shadow-sm border border-neutral-200 p-5 flex flex-col gap-4 overflow-hidden transition-all">
          {/* Top Status & Fare */}
          <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#efeded] rounded-full text-black">
              <span className="material-symbols-outlined text-[16px] text-black">hourglass_top</span>
              <span className="text-xs font-bold font-mono tracking-tight">{formatTimer(totalSeconds)}</span>
            </div>

            <div className="text-right">
              <span className="text-2xl font-extrabold text-black tabular-nums block">
                ${ride.fareEstimate.toFixed(2)}
              </span>
              <span className="text-[10px] text-neutral-400 font-bold uppercase block -mt-0.5">
                ESTIMATE
              </span>
            </div>
          </div>

          {/* Passenger Strip */}
          <div className="bg-[#f5f3f3] rounded-xl p-3 flex flex-col gap-1.5 border border-neutral-200/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-black">{ride.riderName}</span>
              <a
                href={`tel:${ride.riderPhone}`}
                className="flex items-center gap-1 px-2.5 py-1 bg-white rounded-full text-black hover:bg-neutral-100 text-[11px] font-bold border border-neutral-200 shadow-xs"
              >
                <span className="material-symbols-outlined text-[13px]">phone</span>
                <span>{ride.riderPhone}</span>
              </a>
            </div>
            <div className="flex items-center gap-2 text-neutral-600 text-[11px]">
              <span className="material-symbols-outlined text-[15px]">route</span>
              <span>{ride.distanceMiles.toFixed(2)} miles • Est. {ride.estimatedMinutes} mins</span>
            </div>
          </div>

          {/* Waypoints */}
          <div className="flex flex-col relative pl-6 py-1">
            <div className="absolute left-[7px] top-3.5 bottom-3.5 w-0.5 bg-neutral-200"></div>

            <div className="relative flex flex-col mb-4">
              <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-black flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
              </div>
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Pickup</span>
              <span className="text-xs font-bold text-black mt-0.5 leading-snug">{ride.pickup}</span>
            </div>

            <div className="relative flex flex-col">
              <div className="absolute -left-6 top-1 w-3.5 h-3.5 bg-[#006d37] flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white"></div>
              </div>
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Dropoff</span>
              <span className="text-xs font-bold text-black mt-0.5 leading-snug">{ride.dropoff}</span>
            </div>
          </div>

          {/* Flight & Special Directives */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 p-2.5 bg-[#f5f3f3] rounded-xl text-black border border-neutral-200/40 text-xs">
              <span className="material-symbols-outlined text-[18px]">flight_land</span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold">{ride.flightNumber || 'Flight DL 1492 (Delta Air Lines)'}</span>
                <span className="w-1 h-1 rounded-full bg-[#006d37]"></span>
                <span className="text-[#006d37] font-bold text-[11px]">On time</span>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2.5 bg-[#f5f3f3] rounded-xl text-black border border-neutral-200/40 text-xs">
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
                accessible_forward
              </span>
              <span className="text-[11px] text-neutral-700 leading-snug">
                {ride.notes || 'Wheelchair assistance / luggage support requested'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={handleDecline}
              className="h-12 rounded-full bg-[#efeded] text-black font-bold text-xs hover:bg-[#e3e2e2] active:scale-[0.98] transition-all"
            >
              Decline
            </button>
            <button
              type="button"
              onClick={handleAccept}
              disabled={offerClaimed}
              className="h-12 rounded-full bg-[#06C167] text-black font-bold text-xs shadow-sm hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
            >
              {offerClaimed ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                  <span>Claiming...</span>
                </>
              ) : (
                <span>Accept</span>
              )}
            </button>
          </div>
        </div>
      ) : null}

      {/* Expired Offer Card Showcase */}
      <div className="relative bg-[#f5f3f3] rounded-2xl p-5 flex flex-col gap-3 opacity-80 border border-neutral-200">
        <div className="flex items-center justify-between pb-1 border-b border-neutral-200/50">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#e3e2e2] rounded-full text-neutral-600">
            <span className="w-2 h-2 rounded-full bg-red-600"></span>
            <span className="text-[11px] font-bold">Expired — Offer reclaimed by dispatch</span>
          </div>
          <div className="text-right">
            <span className="text-base font-bold text-neutral-400 line-through tabular-nums">$22.50</span>
            <span className="text-[9px] text-neutral-400 font-bold uppercase block">EXPIRED</span>
          </div>
        </div>

        <div className="flex flex-col relative pl-6 py-1">
          <div className="absolute left-[7px] top-3.5 bottom-3.5 w-0.5 bg-neutral-300"></div>
          <div className="relative flex flex-col mb-3">
            <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-neutral-400"></div>
            <span className="text-[10px] text-neutral-400 font-bold uppercase">Pickup</span>
            <span className="text-xs font-semibold text-neutral-700">3038 Dixie Hwy, Erlanger, KY</span>
          </div>
          <div className="relative flex flex-col">
            <div className="absolute -left-6 top-1 w-3.5 h-3.5 bg-neutral-400"></div>
            <span className="text-[10px] text-neutral-400 font-bold uppercase">Dropoff</span>
            <span className="text-xs font-semibold text-neutral-700">Crestview Hills Town Center, KY</span>
          </div>
        </div>

        <button
          type="button"
          disabled
          className="w-full h-11 rounded-full bg-[#e3e2e2] text-neutral-400 text-xs font-bold cursor-not-allowed"
        >
          Accept (Expired)
        </button>
      </div>

      {/* Empty State Card */}
      <div className="bg-white rounded-2xl p-6 text-center flex flex-col items-center justify-center shadow-xs border border-neutral-200">
        <div className="w-12 h-12 rounded-full bg-[#f5f3f3] flex items-center justify-center text-neutral-400 mb-3">
          <span className="material-symbols-outlined text-[24px]">inbox_customize</span>
        </div>
        <h2 className="text-base font-bold text-black tracking-tight">
          No offers yet — dispatch not activated
        </h2>
        <p className="text-xs text-neutral-500 max-w-xs mt-1 leading-relaxed">
          New ride assignments will appear here automatically when dispatched by the owner.
        </p>
      </div>
    </div>
  );
};
