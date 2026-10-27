/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Rider Mobile App - Dedicated CVG Airport Ground Transport View
 */

import React, { useState } from 'react';
import { useTransit } from '../../context/TransitContext';

export const AirportCvgView: React.FC = () => {
  const { createNewRide, setRiderTab } = useTransit();

  const [flightNumber, setFlightNumber] = useState('DL 1492 (Delta Air Lines)');
  const [selectedZone, setSelectedZone] = useState<'zone1' | 'zone2'>('zone1');
  const [showConfirmationDrawer, setShowConfirmationDrawer] = useState(false);
  const [generatedUUID, setGeneratedUUID] = useState('CVG-7104-E4');

  const farePrice = selectedZone === 'zone1' ? 35.0 : 45.0;

  const handleBookAirportRide = () => {
    const chars = 'ABCDEF0123456789';
    let code = 'CVG-' + Math.floor(1000 + Math.random() * 9000) + '-';
    for (let i = 0; i < 2; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setGeneratedUUID(code);

    createNewRide({
      category: 'cvg',
      pickup: 'CVG Airport Terminal 3, Curbside Ground Transport, Door 5 Commercial Lane, Hebron, KY 41048',
      dropoff:
        selectedZone === 'zone1'
          ? 'St. Elizabeth Healthcare, 1 Medical Village Dr, Edgewood, KY 41017'
          : 'Downtown Cincinnati, Fountain Square, OH 45202',
      flightNumber,
      flightStatus: 'On Time (Gate A12)',
      fareEstimate: farePrice,
      baseFare: farePrice,
      meteredRate: 0,
      zone: selectedZone === 'zone1' ? 'Zone 1' : 'Zone 2',
      notes: `Flight pickup for ${flightNumber}. Free 45m grace period applied.`,
    });

    setShowConfirmationDrawer(true);
  };

  return (
    <div className="flex flex-col w-full pb-8 space-y-4">
      {/* Airport Context Header Card */}
      <section className="bg-white rounded-2xl p-5 shadow-xs border border-neutral-200 relative overflow-hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white shrink-0">
              <span className="material-symbols-outlined text-[20px]">flight_land</span>
            </span>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block">
                Terminal Ground Transport
              </span>
              <h1 className="text-lg sm:text-xl font-bold text-black leading-tight">
                CVG Airport Arrival Pickup
              </h1>
            </div>
          </div>
          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#66fe9c]/30 text-[#00210d] text-[10px] font-bold shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#006d37] mr-1.5 animate-pulse"></span>
            FLIGHT SYNC
          </div>
        </div>

        <div className="mt-3.5 flex items-center gap-2 p-2.5 rounded-xl bg-[#f5f3f3] border border-neutral-200/50">
          <span className="material-symbols-outlined text-[#006d37] text-[18px] shrink-0">verified</span>
          <p className="text-xs text-neutral-700 leading-snug">
            Free 45-min gate delay grace period included with regional dispatch monitoring.
          </p>
        </div>
      </section>

      {/* Flight Details (Prominent First Input) */}
      <section className="bg-white rounded-2xl p-5 shadow-xs border border-neutral-200 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-black flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[17px] text-black">airplane_ticket</span>
            Arrival Flight Number
          </label>
          <span className="text-[10px] text-[#006d37] font-bold uppercase tracking-wider">Auto-tracking</span>
        </div>

        <div className="relative">
          <input
            type="text"
            value={flightNumber}
            onChange={(e) => setFlightNumber(e.target.value)}
            placeholder="e.g. DL 1492 or AA 2240"
            className="w-full h-11 px-4 rounded-xl bg-[#efeded] text-black font-semibold text-xs focus:bg-white outline-none focus:ring-2 focus:ring-black transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#e3e2e2] text-black">
              ON TIME
            </span>
          </div>
        </div>

        <div className="flex items-start gap-1.5 pt-0.5 text-neutral-500">
          <span className="material-symbols-outlined text-[15px] shrink-0 mt-0.5">info</span>
          <p className="text-[11px] leading-tight">
            Add your flight number so your driver can follow delays and adjust curbside pickup.
          </p>
        </div>
      </section>

      {/* Route Waypoints */}
      <section className="bg-white rounded-2xl p-5 shadow-xs border border-neutral-200 space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center mt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-black shrink-0"></span>
            <span className="w-0.5 h-10 bg-neutral-200 my-1"></span>
            <span className="w-2.5 h-2.5 rounded-xs bg-[#006d37] shrink-0"></span>
          </div>

          <div className="flex-1 space-y-2.5 min-w-0">
            {/* Pickup */}
            <div className="p-3 rounded-xl bg-[#f5f3f3] border border-neutral-200/50">
              <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                Curbside Pickup (Terminal 3)
              </span>
              <div className="text-xs font-bold text-black truncate mt-0.5">
                CVG Airport Terminal 3, Curbside Ground Transport
              </div>
              <p className="text-[11px] text-neutral-500">Hebron, KY 41048 (Door 5, Commercial Lane)</p>
            </div>

            {/* Destination */}
            <div className="p-3 rounded-xl bg-[#f5f3f3] border border-neutral-200/50">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-neutral-500">Dropoff Destination</span>
                <span className="text-[10px] font-bold text-neutral-600">11.4 mi</span>
              </div>
              <div className="text-xs font-bold text-black truncate mt-0.5">
                St. Elizabeth Healthcare
              </div>
              <p className="text-[11px] text-neutral-500">1 Medical Village Dr, Edgewood, KY 41017</p>
            </div>
          </div>
        </div>
      </section>

      {/* Schedule Time */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-neutral-200 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-black flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[17px] text-black">schedule</span>
            Pickup Time Window
          </span>
          <span className="text-[10px] bg-[#efeded] px-2 py-0.5 rounded font-bold text-neutral-600">
            America/New_York (ET)
          </span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-[#f5f3f3] border border-neutral-200/50">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-black text-[20px]">calendar_today</span>
            <div>
              <div className="text-xs font-bold text-black">Today, 03:30 PM EDT</div>
              <span className="text-[11px] text-neutral-500">Calculated ~25m post gate-touchdown</span>
            </div>
          </div>
          <span className="text-[11px] bg-white px-2 py-0.5 rounded border border-neutral-200 font-semibold text-neutral-700">
            Synchronized
          </span>
        </div>
      </section>

      {/* Airport Flat-Rate Zone Selector */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold text-black uppercase tracking-wider">Standard Airport Zones</h2>
          <span className="text-[11px] text-neutral-500">Fixed pricing, no surges</span>
        </div>

        {/* Zone 1 Card */}
        <div
          onClick={() => setSelectedZone('zone1')}
          className={`p-4 rounded-2xl shadow-xs cursor-pointer transition-all flex flex-col gap-1.5 border ${
            selectedZone === 'zone1'
              ? 'bg-white ring-2 ring-black border-transparent shadow-sm'
              : 'bg-[#f5f3f3] border-neutral-200 hover:bg-white'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  selectedZone === 'zone1' ? 'bg-black text-white' : 'bg-neutral-300 text-transparent'
                }`}
              >
                ✓
              </span>
              <span className="text-xs font-bold text-black">
                Zone 1 — CVG to Erlanger & Immediate Corridor
              </span>
            </div>
            <span className="text-base font-extrabold text-black tabular-nums">$35</span>
          </div>
          <p className="text-[11px] text-neutral-600 pl-6">
            Direct flat rate to Erlanger, Edgewood, Florence hub, and contiguous regional medical centers.
          </p>
          <div className="pl-6 flex items-center gap-4 text-[10px] text-neutral-500 pt-1">
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">luggage</span> Trunk space: 3 bags
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">timer</span> ~18 min transit
            </span>
          </div>
        </div>

        {/* Zone 2 Card */}
        <div
          onClick={() => setSelectedZone('zone2')}
          className={`p-4 rounded-2xl shadow-xs cursor-pointer transition-all flex flex-col gap-1.5 border ${
            selectedZone === 'zone2'
              ? 'bg-white ring-2 ring-black border-transparent shadow-sm'
              : 'bg-[#f5f3f3] border-neutral-200 hover:bg-white'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  selectedZone === 'zone2' ? 'bg-black text-white' : 'bg-neutral-300 text-transparent'
                }`}
              >
                ✓
              </span>
              <span className="text-xs font-bold text-black">
                Zone 2 — Extended NKY & Downtown Cincinnati
              </span>
            </div>
            <span className="text-base font-extrabold text-black tabular-nums">$45</span>
          </div>
          <p className="text-[11px] text-neutral-600 pl-6">
            Covington, Newport, Fort Thomas, Riverfront corridor & Cincinnati central business district.
          </p>
          <div className="pl-6 flex items-center gap-4 text-[10px] text-neutral-500 pt-1">
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">bridge</span> Ohio River link included
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">timer</span> ~28 min transit
            </span>
          </div>
        </div>
      </section>

      {/* Included Arrival Amenities */}
      <section className="bg-white rounded-2xl p-5 shadow-xs border border-neutral-200 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-black uppercase tracking-wider">
            Included Arrival Amenities
          </span>
          <span className="material-symbols-outlined text-[#006d37] text-[18px]">task_alt</span>
        </div>

        <div className="space-y-2 text-xs text-neutral-700">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-black text-[17px]">luggage</span>
            <span>Luggage assistance & oversized baggage accommodation</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-black text-[17px]">radar</span>
            <span>Real-time flight arrival telemetry & automated schedule push</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-black text-[17px]">airline_seat_recline_normal</span>
            <span>Heated seats & climate pre-conditioned cabin</span>
          </div>
        </div>
      </section>

      {/* Step-by-Step Milestone Tracking Banner */}
      <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-[#efeded] text-neutral-700 border border-neutral-200">
        <span className="material-symbols-outlined text-black text-[18px] shrink-0">timeline</span>
        <p className="text-[11px] leading-snug">
          <strong className="text-black font-semibold">Step-by-step milestone tracking</strong> — no live driver location to preserve battery and avoid battery-draining telemetry while deplaning.
        </p>
      </div>

      {/* Primary Action Button */}
      <div className="space-y-3 pt-1">
        <button
          type="button"
          onClick={handleBookAirportRide}
          className="w-full h-13 rounded-full bg-black text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:bg-neutral-800 active:scale-[0.99] transition-all"
        >
          <span>Get Estimate & Secure Pickup</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>

        <div className="flex items-center justify-between px-2 text-xs text-neutral-500">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]">qr_code_2</span>
            <span>Ref UUID: <strong className="font-mono text-black font-semibold">{generatedUUID}</strong></span>
          </div>
          <a
            href="tel:+18595371827"
            className="text-black font-bold hover:underline flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[15px]">call</span>
            <span>+1 (859) 537-1827</span>
          </a>
        </div>
      </div>

      {/* Confirmation Drawer Modal */}
      {showConfirmationDrawer && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-neutral-200 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#006d37] text-[24px]">check_circle</span>
                <div>
                  <h3 className="text-base font-bold text-black">Pickup Reserved</h3>
                  <span className="text-[11px] text-neutral-500">Driver assigned upon flight touchdown</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmationDrawer(false)}
                className="w-7 h-7 rounded-full bg-[#efeded] flex items-center justify-center text-black hover:bg-neutral-200"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[#f5f3f3] text-xs space-y-2 border border-neutral-200/50">
              <div className="flex justify-between">
                <span className="text-neutral-500">Estimated Fare:</span>
                <span className="font-bold text-black">${farePrice.toFixed(2)} Flat</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Meeting Spot:</span>
                <span className="font-semibold text-black">Door 5 Ground Transport</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Flight Monitored:</span>
                <span className="font-semibold text-black">{flightNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Reference:</span>
                <span className="font-mono font-bold text-black">{generatedUUID}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmationDrawer(false);
                  setRiderTab('tracking');
                }}
                className="flex-1 py-3 rounded-full bg-black text-white text-xs font-bold hover:bg-neutral-800 transition-colors"
              >
                Track in Live Roster
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmationDrawer(false)}
                className="py-3 px-4 rounded-full bg-[#efeded] text-black text-xs font-bold hover:bg-[#e3e2e2] transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
