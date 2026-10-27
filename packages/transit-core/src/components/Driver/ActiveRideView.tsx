/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Driver Mobile App - Active Trip In-Progress View
 */

import React, { useState } from 'react';
import { useTransit } from '../../context/TransitContext';
import { formatEasternTime } from '../../utils/transit';

export const ActiveRideView: React.FC = () => {
  const { activeRide, updateRideStatus, setDriverTab } = useTransit();
  const [isEnRoute, setIsEnRoute] = useState(false);
  const [isArrived, setIsArrived] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const ride = activeRide;

  if (!ride) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-neutral-200">
        <p className="text-sm text-neutral-500">No active assigned ride.</p>
        <button
          onClick={() => setDriverTab('offers')}
          className="mt-3 px-4 py-2 bg-black text-white text-xs font-bold rounded-full"
        >
          Check Offers Inbox
        </button>
      </div>
    );
  }

  const handleToggleEnRoute = () => {
    if (!isEnRoute) {
      setIsEnRoute(true);
      updateRideStatus(ride.id, 'driver_en_route', 'Driver Vance en route to CVG Terminal 3 pickup curb.');
    } else if (!isArrived) {
      setIsArrived(true);
    } else {
      setIsCompleted(true);
      updateRideStatus(ride.id, 'completed', 'Passenger safely delivered. Fare settled.');
      setDriverTab('earnings');
    }
  };

  return (
    <div className="flex flex-col w-full pb-8 space-y-4">
      {/* Active Header Status */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 bg-[#efeded] px-3.5 py-1 rounded-full border border-neutral-200">
          <span className="w-2 h-2 rounded-full bg-[#006d37]"></span>
          <span className="text-[10px] font-bold text-black uppercase tracking-wider">
            ACTIVE TRIP • #{ride.id}
          </span>
        </div>
        <div className="flex items-center gap-1 text-neutral-500 text-xs font-semibold">
          <span className="material-symbols-outlined text-[16px]">schedule</span>
          <span>{formatEasternTime().split(' ')[0]} EDT</span>
        </div>
      </div>

      {/* Dispatch Progression Tracker */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-neutral-200 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-neutral-400">Dispatch Status</span>
          <span className="text-xs font-bold text-black">
            {isCompleted
              ? 'Trip Completed'
              : isArrived
              ? 'Arrived at Pickup'
              : isEnRoute
              ? 'Driver En Route'
              : 'Driver Confirmed'}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5 pt-1">
          <div className="h-1.5 rounded-full bg-black"></div>
          <div
            className={`h-1.5 rounded-full transition-colors ${
              isEnRoute || isArrived || isCompleted ? 'bg-black' : 'bg-neutral-200'
            }`}
          ></div>
          <div
            className={`h-1.5 rounded-full transition-colors ${
              isArrived || isCompleted ? 'bg-black' : 'bg-neutral-200'
            }`}
          ></div>
          <div
            className={`h-1.5 rounded-full transition-colors ${
              isCompleted ? 'bg-black' : 'bg-neutral-200'
            }`}
          ></div>
        </div>

        <div className="flex items-center justify-between text-neutral-500 text-[10px] font-bold pt-1">
          <span className="text-black">1. Confirmed</span>
          <span className={isEnRoute ? 'text-black font-extrabold' : ''}>2. En Route</span>
          <span className={isArrived ? 'text-black font-extrabold' : ''}>3. Arrived</span>
          <span className={isCompleted ? 'text-black font-extrabold' : ''}>4. Dropped Off</span>
        </div>
      </div>

      {/* Rider & Fare Card */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-neutral-200 flex flex-col gap-4">
        {/* Top Rider Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#e3e2e2] flex items-center justify-center text-black font-bold text-sm">
              {ride.riderName
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-black">{ride.riderName}</span>
              <span className="text-xs text-neutral-500">Standard Transit • 1 Rider</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xl font-extrabold text-black tabular-nums block">
              ${ride.fareEstimate.toFixed(2)}
            </span>
            <span className="text-[10px] text-neutral-400 font-bold uppercase block -mt-0.5">
              Fare Estimate
            </span>
          </div>
        </div>

        {/* Call Rider Button */}
        <a
          href={`tel:${ride.riderPhone}`}
          className="w-full flex items-center justify-center gap-2 bg-[#f5f3f3] hover:bg-[#e3e2e2] text-black py-2.5 px-4 rounded-full text-xs font-bold transition-colors border border-neutral-200"
        >
          <span className="material-symbols-outlined text-[16px] text-[#006d37]">phone_in_talk</span>
          <span>Call Rider: {ride.riderPhone}</span>
        </a>

        {/* Route Details */}
        <div className="bg-[#f5f3f3] rounded-xl p-4 flex flex-col gap-3 relative border border-neutral-200/50">
          <div className="absolute left-[26px] top-[32px] bottom-[32px] w-0.5 bg-neutral-300"></div>

          {/* Pickup */}
          <div className="flex items-start gap-3 relative z-10">
            <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center text-white mt-0.5 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase font-bold text-neutral-400">Pickup Location</span>
              <span className="text-xs font-bold text-black mt-0.5 leading-snug">{ride.pickup}</span>
              <span className="text-[10px] text-neutral-500 mt-0.5">Curbside Door 5, Commercial Lane</span>
            </div>
          </div>

          {/* Dropoff */}
          <div className="flex items-start gap-3 relative z-10">
            <div className="w-5 h-5 rounded-xs bg-[#006d37] flex items-center justify-center text-white mt-0.5 shrink-0">
              <div className="w-1.5 h-1.5 bg-white"></div>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase font-bold text-neutral-400">Dropoff Destination</span>
              <span className="text-xs font-bold text-black mt-0.5 leading-snug">{ride.dropoff}</span>
              <span className="text-[10px] text-neutral-500 mt-0.5">Main Entrance Patient Drop</span>
            </div>
          </div>
        </div>

        {/* Flight & Special Needs Badges */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5 bg-[#f5f3f3] px-3.5 py-2.5 rounded-xl border border-neutral-200/50">
            <span className="material-symbols-outlined text-[18px] text-black">flight_land</span>
            <div className="flex flex-col">
              <span className="text-[10px] text-neutral-500 font-semibold uppercase">Inbound Flight</span>
              <span className="text-xs font-bold text-black">
                {ride.flightNumber || 'Delta Air Lines DL 1492'}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 bg-[#66fe9c]/20 px-3.5 py-2.5 rounded-xl border border-emerald-200">
            <span className="material-symbols-outlined text-[18px] text-[#006d37] mt-0.5 shrink-0">
              luggage
            </span>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[#006d37] uppercase">Special Needs Note</span>
              <span className="text-xs text-neutral-800 font-medium">
                {ride.notes || 'Luggage assistance required at curbside pickup'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Navigation Launch */}
      <a
        href={`https://maps.google.com/?daddr=${encodeURIComponent(ride.pickup)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-between bg-black text-white px-5 py-3.5 rounded-full shadow-md active:scale-[0.99] transition-transform"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">navigation</span>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold leading-tight">Navigate</span>
            <span className="text-[10px] text-neutral-400">Opens in Google Maps</span>
          </div>
        </div>
        <span className="material-symbols-outlined text-[18px] text-white">open_in_new</span>
      </a>

      {/* Sequential Trip Action Button */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleToggleEnRoute}
          className="w-full py-3.5 px-4 bg-black text-white rounded-full shadow-sm hover:bg-neutral-800 active:scale-[0.99] transition-all flex flex-col items-center justify-center"
        >
          <span className="text-xs font-bold leading-tight flex items-center gap-1.5">
            <span>
              {isCompleted
                ? 'Trip Logged'
                : isArrived
                ? 'Complete Dropoff'
                : isEnRoute
                ? 'Mark Arrived at Curbside'
                : 'En Route'}
            </span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </span>
          <span className="text-[10px] text-neutral-400 mt-0.5">
            {isCompleted
              ? 'Settlement calculated'
              : isArrived
              ? 'Tap upon dropping rider'
              : isEnRoute
              ? 'Tap when at CVG Terminal 3 curb'
              : 'Tap when driving to pickup'}
          </span>
        </button>

        <div className="w-full flex items-center justify-between px-4 py-2.5 rounded-full bg-[#efeded] text-neutral-600 select-none text-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[17px] text-[#006d37]">check_circle</span>
            <span className="font-semibold text-black">
              {isCompleted ? 'Trip Finalized' : 'Next: Completed'}
            </span>
          </div>
          <span className="text-[10px] text-neutral-500 italic">
            {isCompleted ? 'Added to earnings' : 'Active after arrival'}
          </span>
        </div>
      </div>

      {/* Governance & Dispatch Policy Callout */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-neutral-200 flex flex-col gap-3">
        <div className="flex items-start gap-2.5">
          <span className="material-symbols-outlined text-[18px] text-black shrink-0 mt-0.5">info</span>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Cancellation not available in driver app. If there is an issue or delay with this ride, contact dispatch immediately.
          </p>
        </div>

        <a
          href="tel:+18595371827"
          className="w-full flex items-center justify-center gap-2 bg-[#efeded] hover:bg-[#e3e2e2] text-black py-2.5 px-4 rounded-full text-xs font-bold transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">support_agent</span>
          <span>Call Dispatch +1 (859) 537-1827</span>
        </a>
      </div>
    </div>
  );
};
