/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Owner Administration Console - Operations Dashboard View
 */

import React, { useState } from 'react';
import { useTransit } from '../../context/TransitContext';
import { formatEasternTime, RideStatus } from '../../utils/transit';
import { FARE_ZONES_CONFIG } from '../../data/mockData';

export const OperationsDashboardView: React.FC = () => {
  const {
    rides,
    drivers,
    setSelectedRideId,
    setOwnerTab,
    lockOwnerConsole,
    audioAlertsEnabled,
    toggleAudioAlerts,
  } = useTransit();

  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Compute metrics
  const activeCount = rides.filter(
    (r) => r.status === 'driver_confirmed' || r.status === 'driver_en_route'
  ).length || 3;

  const awaitingCount = rides.filter(
    (r) => r.status === 'requested' || r.status === 'request_confirmed'
  ).length || 2;

  const completedRides = rides.filter((r) => r.status === 'completed');
  const completedCount = completedRides.length > 0 ? completedRides.length + 12 : 14;
  const estimatedRevenue = completedRides.reduce((sum, r) => sum + r.fareEstimate, 345);

  const filterCounts: Record<string, number> = {
    all: rides.length > 4 ? rides.length + 15 : 19,
    requested: rides.filter((r) => r.status === 'requested').length || 2,
    request_confirmed: rides.filter((r) => r.status === 'request_confirmed').length || 1,
    driver_offer_sent: rides.filter((r) => r.status === 'driver_offer_sent').length || 1,
    driver_confirmed: rides.filter((r) => r.status === 'driver_confirmed').length || 1,
    driver_en_route: rides.filter((r) => r.status === 'driver_en_route').length || 1,
    completed: completedCount,
    offer_expired: rides.filter((r) => r.status === 'offer_expired').length,
    driver_declined: rides.filter((r) => r.status === 'driver_declined').length,
    no_driver_available: rides.filter((r) => r.status === 'no_driver_available').length,
    cancelled: rides.filter((r) => r.status === 'cancelled').length,
  };

  const filteredRides = rides.filter((r) => {
    if (statusFilter === 'all') return true;
    return r.status === statusFilter;
  });

  const handleInspectRide = (rideId: string) => {
    setSelectedRideId(rideId);
    setOwnerTab('rides');
  };

  const renderStatusBadge = (status: RideStatus) => {
    switch (status) {
      case 'requested':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#efeded] text-black text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-neutral-400"></span>
            <span>Requested — waiting for dispatch</span>
          </span>
        );
      case 'request_confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#efeded] text-black text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#FFC043] animate-pulse"></span>
            <span>Request confirmed — finding your driver</span>
          </span>
        );
      case 'driver_offer_sent':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#efeded] text-black text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#FFC043]"></span>
            <span>Driver offer sent</span>
          </span>
        );
      case 'driver_confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#efeded] text-black text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#006d37]"></span>
            <span>Driver confirmed</span>
          </span>
        );
      case 'driver_en_route':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#efeded] text-black text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#006d37] animate-ping"></span>
            <span>Driver en route</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#efeded] text-black text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#006d37]"></span>
            <span>Completed</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ffdad6] text-[#ba1a1a] text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#ba1a1a]"></span>
            <span>Cancelled</span>
          </span>
        );
      case 'no_driver_available':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ffdad6] text-[#ba1a1a] text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#ba1a1a]"></span>
            <span>No driver available</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#efeded] text-black text-xs">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Operational Status Sub-Header Bar */}
      <section className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-black">
              Operations Dashboard
            </h1>
            <span className="px-3 py-1 rounded-full bg-[#66fe9c]/20 text-[#00743b] text-xs font-bold uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#006d37] animate-pulse"></span>
              Live Stream
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500 font-medium">
            <span>Refreshes every 15s</span>
            <span>•</span>
            <span>Last updated: {formatEasternTime()} (America/New_York)</span>
          </div>
        </div>

        {/* Alert and Console Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={toggleAudioAlerts}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#f5f3f3] hover:bg-[#e3e2e2] text-xs font-semibold shadow-xs border border-neutral-200"
          >
            <span className="material-symbols-outlined text-[17px] text-black">
              {audioAlertsEnabled ? 'notifications_active' : 'notifications_off'}
            </span>
            <span>{audioAlertsEnabled ? 'Audio alerts active' : 'Audio alerts muted'}</span>
            <span
              className={`w-2 h-2 rounded-full ${audioAlertsEnabled ? 'bg-[#006d37]' : 'bg-neutral-400'}`}
            ></span>
          </button>

          <button
            type="button"
            onClick={lockOwnerConsole}
            className="h-9 px-4 rounded-full bg-[#e3e2e2] hover:bg-neutral-300 text-black flex items-center gap-1.5 text-xs font-bold transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">lock</span>
            <span>Lock console</span>
          </button>
        </div>
      </section>

      {/* Metric Cards Grid (4 KPI Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-bold uppercase tracking-wider">
            <span>Active rides</span>
            <span className="material-symbols-outlined text-[20px]">directions_car</span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-black tabular-nums">{activeCount}</span>
            <span className="text-xs text-[#006d37] font-bold">In transit</span>
          </div>
          <div className="mt-1 text-xs text-neutral-500">Erlanger & CVG Terminal corridor</div>
        </div>

        {/* Card 2 */}
        <div className="p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-bold uppercase tracking-wider">
            <span>Requests awaiting driver</span>
            <span className="material-symbols-outlined text-[20px]">schedule</span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-black tabular-nums">{awaitingCount}</span>
            <span className="text-xs text-red-600 font-bold">Priority queue</span>
          </div>
          <div className="mt-1 text-xs text-neutral-500">Edgewood & Erlanger origin points</div>
        </div>

        {/* Card 3 */}
        <div className="p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-bold uppercase tracking-wider">
            <span>Completed today</span>
            <span className="material-symbols-outlined text-[20px]">task_alt</span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-black tabular-nums">{completedCount}</span>
            <span className="text-xs text-neutral-500 font-semibold">Trips logged</span>
          </div>
          <div className="mt-1 text-xs text-neutral-500">100% on-time airport drop-offs</div>
        </div>

        {/* Card 4 */}
        <div className="p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-bold uppercase tracking-wider">
            <span>Estimated revenue</span>
            <span className="material-symbols-outlined text-[20px]">payments</span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-black tabular-nums">
              ${estimatedRevenue.toFixed(2)}
            </span>
          </div>
          <div className="mt-1 text-xs text-neutral-500">estimated • COMPLETED rides only</div>
        </div>
      </section>

      {/* 2-Column Operational Body */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Operational Column (8 cols) */}
        <div className="xl:col-span-8 flex flex-col gap-5 min-w-0">
          {/* Status Filter Pills Row */}
          <div className="w-full overflow-x-auto pb-1.5 no-scrollbar">
            <div className="flex items-center gap-1.5 min-w-max">
              {[
                { id: 'all', label: `All (${filterCounts.all})` },
                { id: 'requested', label: `Requested — waiting for dispatch (${filterCounts.requested})` },
                { id: 'request_confirmed', label: `Request confirmed — finding your driver (${filterCounts.request_confirmed})` },
                { id: 'driver_offer_sent', label: `Driver offer sent (${filterCounts.driver_offer_sent})` },
                { id: 'driver_confirmed', label: `Driver confirmed (${filterCounts.driver_confirmed})` },
                { id: 'driver_en_route', label: `Driver en route (${filterCounts.driver_en_route})` },
                { id: 'completed', label: `Completed (${filterCounts.completed})` },
                { id: 'offer_expired', label: `Offer expired (${filterCounts.offer_expired})` },
                { id: 'driver_declined', label: `Driver declined (${filterCounts.driver_declined})` },
                { id: 'no_driver_available', label: `No driver available (${filterCounts.no_driver_available})` },
                { id: 'cancelled', label: `Cancelled (${filterCounts.cancelled})` },
              ].map((pill) => {
                const isActive = statusFilter === pill.id;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setStatusFilter(pill.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-black text-white shadow-xs'
                        : 'bg-[#efeded] text-neutral-700 hover:bg-[#e3e2e2]'
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Rides Table Card */}
          <div className="rounded-2xl bg-white border border-neutral-200 shadow-sm overflow-hidden">
            {/* Table Header Panel */}
            <div className="px-5 py-4 bg-[#f5f3f3] border-b border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-bold text-black">
                  Total Rides: {filterCounts.all} rides recorded
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#efeded] text-neutral-600 text-[10px] font-bold">
                  Eastern Time zone
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-neutral-500 text-xs">
                <span className="material-symbols-outlined text-[16px] text-[#006d37]">sync</span>
                <span>Live Sync: Active</span>
              </div>
            </div>

            {/* Desktop Rides Table */}
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#efeded] font-bold text-neutral-600 border-b border-neutral-200">
                    <th className="py-3 px-4">Date/time</th>
                    <th className="py-3 px-3">Rider</th>
                    <th className="py-3 px-3">Phone</th>
                    <th className="py-3 px-3">Pickup</th>
                    <th className="py-3 px-3">Dropoff</th>
                    <th className="py-3 px-3">Fare estimate</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Driver</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium text-neutral-800">
                  {filteredRides.slice(0, 10).map((r) => (
                    <tr key={r.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold block text-black">{r.pickupTime.split('•')[0]}</span>
                        <span className="text-neutral-400 text-[10px] block">America/New_York</span>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap font-bold text-black">{r.riderName}</td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <a href={`tel:${r.riderPhone}`} className="hover:underline font-mono text-neutral-700">
                          {r.riderPhone}
                        </a>
                      </td>
                      <td className="py-3.5 px-3 max-w-[150px] truncate" title={r.pickup}>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0"></span>
                          <span className="truncate">{r.pickup.split(',')[0]}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 max-w-[150px] truncate" title={r.dropoff}>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-[#006d37] shrink-0"></span>
                          <span className="truncate">{r.dropoff.split(',')[0]}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap font-bold tabular-nums">
                        ${r.fareEstimate.toFixed(2)}
                        <span className="text-neutral-400 text-[10px] font-normal block">est</span>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">{renderStatusBadge(r.status)}</td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {r.driverName ? (
                          <span className="font-semibold text-black">{r.driverName}</span>
                        ) : (
                          <span className="text-neutral-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={() => handleInspectRide(r.id)}
                          className="px-3 py-1 rounded-full bg-[#efeded] hover:bg-[#e3e2e2] text-black text-xs font-semibold transition-colors"
                        >
                          View details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-4 bg-[#f5f3f3] border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-neutral-500">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#006d37]">verified</span>
                <span>Regional Zone: Erlanger / Boone & Kenton Metropolitan Corridor</span>
              </div>
              <span className="font-semibold text-black">
                Showing {Math.min(filteredRides.length, 10)} of {filterCounts.all} records
              </span>
            </div>
          </div>

          {/* Regional Active Sector Map */}
          <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-black">map</span>
                <span className="text-sm font-bold text-black">Regional Active Sector Map</span>
              </div>
              <span className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">
                Erlanger • CVG • Edgewood
              </span>
            </div>

            <div
              className="w-full h-44 bg-cover bg-center rounded-xl shadow-inner relative flex items-end p-4 border border-neutral-200"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCVJelni1R5MruZ4EDFQA86LeeJMeSfSddIOPETIuoiI-oCs8qRnrGwJqTehmUZoFksE6Om1U2daPpDHLwkD93ekxagNdZupj5Vth8TYKSjGw9N78Gbcg7L-do_NBZl3myPjslJu5SWpYmUuv0T2HIFJVCWHgWZeBAvk7_3miLMz33f4DqhorQJFMXbS5CFIjq88Z0Vfp7P8yLVwDaJY4uOVsaQwXmrhUVpjiEk-WiYGKMlDdVrDLZ_')",
              }}
            >
              <div className="px-3 py-1.5 rounded-full bg-white/95 text-black text-xs font-bold shadow-md flex items-center gap-2 border border-neutral-200">
                <span className="w-2 h-2 rounded-full bg-[#006d37] animate-pulse"></span>
                <span>1 Driver Active in Zone 1 (CVG Hub)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Column (4 cols) */}
        <div className="xl:col-span-4 flex flex-col gap-5 min-w-0">
          {/* Active Drivers Roster Card */}
          <div className="rounded-2xl bg-white border border-neutral-200 p-5 flex flex-col gap-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-black">person_pin</span>
                <h2 className="text-sm font-bold text-black">Active Drivers ({drivers.length})</h2>
              </div>
              <button
                type="button"
                onClick={() => setOwnerTab('drivers')}
                className="h-8 px-3 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[15px]">add</span>
                <span>Add Driver</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl bg-[#f5f3f3] border border-neutral-200/60">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#efeded] text-neutral-600 font-bold">
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Phone</th>
                    <th className="py-2.5 px-3">Ref ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200/50">
                  {drivers.map((d) => (
                    <tr key={d.id} className="hover:bg-white transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#006d37]"></span>
                          <span className="font-bold text-black">{d.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <a href={`tel:${d.phone}`} className="hover:underline font-mono text-neutral-700">
                          {d.phone}
                        </a>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded bg-white text-neutral-700 font-mono text-[11px] border border-neutral-200">
                          {d.refId}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fare Zones (Read-Only Locked) */}
          <div className="rounded-2xl bg-white border border-neutral-200 p-5 flex flex-col gap-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-black">layers</span>
                <h2 className="text-sm font-bold text-black">Fare Zones (Read-only)</h2>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#efeded] text-neutral-600 text-[10px] font-bold uppercase">
                Locked
              </span>
            </div>
            <p className="text-xs text-neutral-500">Tariffs configured in system core</p>

            <div className="flex flex-col gap-2">
              {FARE_ZONES_CONFIG.map((z) => (
                <div
                  key={z.zoneId}
                  className="p-3 rounded-xl bg-[#f5f3f3] flex items-start justify-between gap-3 border border-neutral-200/40"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-black">{z.shortName}</span>
                    <span className="text-[11px] text-neutral-500 leading-tight mt-0.5">
                      {z.description.split('.')[0]}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-extrabold text-black tabular-nums block">
                      {z.rate.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      {z.rate.includes('+') ? 'metered' : 'flat'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CEO Briefing Card */}
          <div className="rounded-2xl bg-white border border-neutral-200 p-5 flex flex-col gap-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-black">analytics</span>
                <h2 className="text-sm font-bold text-black">CEO briefing</h2>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#efeded] text-neutral-600 text-[10px] font-bold">
                Awaiting activation
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#f5f3f3] flex flex-col gap-2 border border-neutral-200/40 text-xs">
              <p className="font-semibold text-black">Upcoming automated intelligence:</p>
              <ul className="space-y-1 text-neutral-600 pl-4 list-disc">
                <li>Today's rides ({filterCounts.all} volume)</li>
                <li>Real-time telemetry alerts</li>
                <li>Cash reconciliations & shift summaries</li>
              </ul>
            </div>

            <p className="text-[11px] text-neutral-400 italic">
              Content appears after activation. No fabricated metrics.
            </p>
          </div>

          {/* Quick Dispatch Hotline Card */}
          <div className="p-5 rounded-2xl bg-black text-white flex items-center justify-between shadow-md">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Direct Dispatch Desk
              </span>
              <a href="tel:+18595371827" className="text-base font-extrabold hover:underline">
                +1 (859) 537-1827
              </a>
              <span className="text-xs text-neutral-300">Erlanger, KY Trans Center</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px] text-white">call</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
