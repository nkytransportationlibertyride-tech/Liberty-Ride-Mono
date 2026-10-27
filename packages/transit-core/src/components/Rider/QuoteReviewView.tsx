/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Rider Mobile App - Guaranteed Quote Ready Review View
 */

import React, { useState } from 'react';
import { useTransit } from '../../context/TransitContext';

export const QuoteReviewView: React.FC = () => {
  const { activeRide, setRiderTab, updateRideStatus } = useTransit();
  const [isReserving, setIsReserving] = useState(false);
  const [diagnosticsRetried, setDiagnosticsRetried] = useState(false);

  const ride = activeRide;

  const handleReserve = () => {
    if (!ride) return;
    setIsReserving(true);
    setTimeout(() => {
      setIsReserving(false);
      updateRideStatus(
        ride.id,
        'request_confirmed',
        'Reservation confirmed by rider. Locked flat tariff logged to dispatch ledger.'
      );
      setRiderTab('tracking');
    }, 600);
  };

  const handleEdit = () => {
    setRiderTab('ride');
  };

  if (!ride) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-neutral-500">No active quote available.</p>
        <button
          onClick={() => setRiderTab('ride')}
          className="mt-3 px-4 py-2 bg-black text-white text-xs font-bold rounded-full"
        >
          Create Quote
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full pb-8 space-y-4">
      {/* Top Operational Status Pill & Time Reference */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#efeded] rounded-full shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[#006d37]"></span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-black">Quote Ready</span>
        </div>
        <span className="text-[11px] font-medium text-neutral-500">Valid until 03:45 PM EDT</span>
      </div>

      {/* Primary Fare Estimate Hero Container */}
      <div className="w-full bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-neutral-200 flex flex-col space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wide text-neutral-500 font-bold">
              Guaranteed Corridor Quote
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight tabular-nums">
                ${ride.fareEstimate.toFixed(2)}
              </span>
              <span className="text-[10px] bg-[#e3e2e2] px-2 py-0.5 rounded text-neutral-800 font-bold tracking-wide uppercase">
                Estimate
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#efeded] flex items-center justify-center text-black">
            <span className="material-symbols-outlined text-[20px]">local_atm</span>
          </div>
        </div>

        {/* Regulatory Notice Banner */}
        <div className="flex items-center gap-2 p-2.5 bg-[#f5f3f3] rounded-xl text-neutral-700">
          <span className="material-symbols-outlined text-[18px] text-black shrink-0">verified_user</span>
          <p className="text-xs leading-tight">
            Final fare is confirmed at booking. Flat tariff locked upon reservation.
          </p>
        </div>
      </div>

      {/* Interactive Map Canvas Route Preview */}
      <div className="w-full h-32 rounded-2xl overflow-hidden relative shadow-xs bg-[#e9e8e7] border border-neutral-200">
        <div className="absolute inset-0 bg-neutral-900/10 flex flex-col justify-between p-3 pointer-events-none">
          <div className="flex justify-between items-center">
            <span className="text-[11px] bg-white px-2.5 py-1 rounded-md shadow-xs text-black font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-[#006d37]">navigation</span>
              Direct Transit Route: I-275 E
            </span>
            <span className="text-[11px] bg-white px-2 py-1 rounded-md shadow-xs text-black font-bold tabular-nums">
              {ride.distanceMiles.toFixed(2)} mi
            </span>
          </div>
          <div className="flex items-center justify-between text-neutral-600">
            <span className="text-[10px] bg-white/90 px-2 py-0.5 rounded backdrop-blur-xs text-black font-medium">
              Erlanger Dispatch Verified
            </span>
            <span className="text-[10px] bg-white/90 px-2 py-0.5 rounded backdrop-blur-xs text-black font-medium">
              Est. {ride.estimatedMinutes} mins
            </span>
          </div>
        </div>
      </div>

      {/* Route & Trip Summary Card */}
      <div className="w-full bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-neutral-200 flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-black">Route & Trip Details</span>
          <span className="text-[10px] bg-[#66fe9c]/30 text-[#00210d] px-2 py-0.5 rounded font-bold uppercase">
            {ride.category === 'cvg'
              ? 'Airport CVG'
              : ride.category === 'medical'
              ? 'Medical / Hospital'
              : ride.category === 'business'
              ? 'Business'
              : 'Local Taxi'}
          </span>
        </div>

        {/* Stepper Timeline */}
        <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200">
          {/* Pickup */}
          <div className="relative">
            <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-black ring-4 ring-white"></span>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Pickup</span>
              <span className="text-sm font-semibold text-black leading-snug">{ride.pickup}</span>
            </div>
          </div>
          {/* Dropoff */}
          <div className="relative">
            <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-xs bg-[#006d37] ring-4 ring-white"></span>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Destination</span>
              <span className="text-sm font-semibold text-black leading-snug">{ride.dropoff}</span>
            </div>
          </div>
        </div>

        {/* Route Metrics Breakdown */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100">
          <div className="bg-[#f5f3f3] p-2.5 rounded-xl flex flex-col">
            <span className="text-[10px] font-semibold text-neutral-500 uppercase">Distance</span>
            <span className="text-sm font-bold text-black tabular-nums">{ride.distanceMiles.toFixed(2)} miles</span>
          </div>
          <div className="bg-[#f5f3f3] p-2.5 rounded-xl flex flex-col">
            <span className="text-[10px] font-semibold text-neutral-500 uppercase">Pickup Window</span>
            <span className="text-xs font-bold text-black truncate">{ride.pickupTime}</span>
            <span className="text-[9px] text-neutral-500">America/New_York</span>
          </div>
        </div>
      </div>

      {/* Detailed Fare Breakdown Container */}
      <div className="w-full bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-neutral-200 flex flex-col space-y-3">
        <div className="flex items-center justify-between pb-1">
          <span className="text-base font-bold text-black">Fare Structure Breakdown</span>
          <span className="text-[10px] font-semibold text-neutral-500 bg-[#efeded] px-2 py-0.5 rounded">
            Tariff ID: #KY-ZONE1
          </span>
        </div>

        <div className="space-y-2 text-xs divide-y divide-neutral-100">
          <div className="flex items-center justify-between pt-1">
            <div className="flex flex-col">
              <span className="font-semibold text-black">Base Fare</span>
              <span className="text-[11px] text-neutral-500">Zone 1 Airport/Erlanger Core Flat Tariff</span>
            </div>
            <span className="font-bold text-black tabular-nums">${ride.baseFare.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="flex flex-col">
              <span className="text-black">Metered Distance Rate</span>
              <span className="text-[11px] text-neutral-500">Flat zone tariff applied (0–15 miles included)</span>
            </div>
            <span className="font-bold text-black tabular-nums">${ride.meteredRate.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="flex flex-col">
              <span className="text-black">Regional Surcharges</span>
              <span className="text-[11px] text-neutral-500">No surge pricing · Standard transit rate</span>
            </div>
            <span className="font-bold text-black tabular-nums">$0.00</span>
          </div>
        </div>

        <div className="bg-[#f5f3f3] p-3 rounded-xl flex items-center justify-between mt-2 border border-neutral-200/50">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-black">Total Guaranteed Estimate</span>
            <span className="text-[11px] text-neutral-500">Taxes & local transit fees inclusive</span>
          </div>
          <span className="text-xl font-extrabold text-black tabular-nums">${ride.fareEstimate.toFixed(2)}</span>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="flex flex-col space-y-2.5 pt-2">
        <button
          type="button"
          onClick={handleReserve}
          disabled={isReserving}
          className="w-full h-[52px] bg-black text-white rounded-full text-sm font-bold shadow-md hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 active:scale-[0.99]"
        >
          {isReserving ? (
            <>
              <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
              <span>Securing Locked Tariff...</span>
            </>
          ) : (
            <>
              <span>Reserve Ride</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleEdit}
          className="w-full h-11 bg-[#efeded] text-black rounded-full text-xs font-bold hover:bg-[#e3e2e2] transition-colors flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">edit_location_alt</span>
          <span>Edit Ride Details</span>
        </button>
      </div>

      {/* Fallback & Edge-Case Handling Showcase (System Integrity Architecture) */}
      <div className="flex flex-col space-y-3 pt-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider text-neutral-500 font-bold">
            System Handling Modes
          </span>
          <span className="text-[10px] bg-[#efeded] px-2 py-0.5 rounded text-neutral-600 font-medium">
            Diagnostics
          </span>
        </div>

        {/* Straight-line Fallback Card */}
        <div className="bg-[#f5f3f3] rounded-xl p-3.5 space-y-1.5 border border-neutral-200/50">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-neutral-700">satellite_alt</span>
            <span className="text-xs font-bold text-black">Routing Service Degraded Fallback</span>
          </div>
          <p className="text-xs text-neutral-600">
            If road routing network is interrupted, estimates revert automatically to straight-line Euclidean buffer.
          </p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-md border border-neutral-200">
            <span className="w-2 h-2 rounded-full bg-neutral-400"></span>
            <span className="text-[10px] text-neutral-700 font-mono">route unavailable — straight-line estimate</span>
          </div>
        </div>

        {/* Missing Zone Handling State */}
        <div className="bg-[#f5f3f3] rounded-xl p-3.5 space-y-2 border border-neutral-200/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-red-600">pin_drop</span>
              <span className="text-xs font-bold text-black">Boundary Zone Verification</span>
            </div>
            <span className="text-[10px] bg-[#ffdad6] text-[#93000a] px-2 py-0.5 rounded font-bold">
              {diagnosticsRetried ? 'Verified' : 'Required'}
            </span>
          </div>
          <p className="text-xs text-neutral-600">
            Zone selection required for regional county routes. If outside Erlanger/Airport Core (Zone 1), county classification must be confirmed.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setDiagnosticsRetried(true);
                alert('Regional county lookup confirmed: Boone & Kenton County metropolitan perimeter active.');
              }}
              className="px-3 py-1.5 bg-[#e3e2e2] hover:bg-neutral-300 text-black rounded-full text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">sync</span>
              <span>{diagnosticsRetried ? 'Zone Verified' : 'Retry Zone Lookup'}</span>
            </button>
            <a
              href="tel:+18595371827"
              className="px-3 py-1.5 bg-white text-black rounded-full text-xs font-medium border border-neutral-200 hover:bg-neutral-50 transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">call</span>
              <span>Call Dispatch</span>
            </a>
          </div>
        </div>
      </div>

      {/* Human Assistance Footer */}
      <div className="flex flex-col items-center justify-center p-2 text-center space-y-1">
        <p className="text-xs text-neutral-500">Need human assistance with this route?</p>
        <a
          href="tel:+18595371827"
          className="text-xs font-bold text-black flex items-center gap-1 hover:underline"
        >
          <span className="material-symbols-outlined text-[15px]">support_agent</span>
          <span>Dispatch direct: +1 (859) 537-1827</span>
        </a>
      </div>
    </div>
  );
};
