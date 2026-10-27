/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Driver Mobile App - Earnings & Settlement Manifest View
 */

import React, { useState } from 'react';
import { useTransit } from '../../context/TransitContext';

export const DriverEarningsView: React.FC = () => {
  const { setDriverTab } = useTransit();
  const [showEmptyView, setShowEmptyView] = useState(false);

  const completedTrips = [
    {
      id: 'c-1',
      time: 'Today, 3:35 PM EDT',
      route: 'CVG Airport Terminal 3 → St. Elizabeth Healthcare',
      rider: 'David Miller',
      fare: 35.0,
      zone: 'Zone 1',
    },
    {
      id: 'c-2',
      time: 'Today, 2:15 PM EDT',
      route: '3038 Dixie Hwy, Erlanger → CVG Airport',
      rider: 'Sarah Jenkins',
      fare: 35.0,
      zone: 'Zone 1',
    },
    {
      id: 'c-3',
      time: 'Today, 12:40 PM EDT',
      route: 'Covington Riverfront → Hebron Hub',
      rider: 'Linda Davis',
      fare: 45.0,
      zone: 'Zone 2',
    },
    {
      id: 'c-4',
      time: 'Today, 10:15 AM EDT',
      route: 'Florence Mall → St. Elizabeth Edgewood',
      rider: 'Robert Chen',
      fare: 25.0,
      zone: 'Medical Clinic',
    },
    {
      id: 'c-5',
      time: 'Today, 8:50 AM EDT',
      route: 'Erlanger Core → Crestview Hills',
      rider: 'James Wilson',
      fare: 40.0,
      zone: 'Local Taxi',
    },
  ];

  const totalEarnings = completedTrips.reduce((acc, trip) => acc + trip.fare, 0);

  return (
    <div className="flex flex-col w-full pb-8 space-y-4">
      {/* Top Telemetry Header */}
      <div className="flex items-center justify-between text-xs text-neutral-500 font-medium">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#006d37]"></span>
          <span className="uppercase tracking-wider font-bold text-neutral-700">Fleet Manifest Synced</span>
        </div>
        <div className="inline-flex items-center gap-1 bg-[#efeded] px-2.5 py-1 rounded-full text-[11px] text-neutral-700">
          <span className="material-symbols-outlined text-[13px]">schedule</span>
          <span>America/New_York (EDT)</span>
        </div>
      </div>

      {/* Driver Earnings Summary Card */}
      <section className="w-full bg-white rounded-2xl p-5 shadow-xs border border-neutral-200 relative overflow-hidden flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-black">Driver Earnings Summary</span>
          <span className="material-symbols-outlined text-black text-[20px]">account_balance_wallet</span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-black tabular-nums">
            ${totalEarnings.toFixed(2)}
          </span>
          <span className="text-xs font-semibold text-neutral-500">USD</span>
        </div>

        <div className="inline-flex items-center gap-1.5 self-start bg-[#efeded] px-3 py-1 rounded-full text-black">
          <span className="material-symbols-outlined text-[15px] text-[#006d37]">info</span>
          <span className="text-[11px] font-semibold">Estimated — cash handled by the owner</span>
        </div>

        <div className="mt-2 pt-3 border-t border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#66fe9c]/30 text-[#00210d] flex items-center justify-center">
              <span className="material-symbols-outlined text-[17px]">verified</span>
            </div>
            <div>
              <p className="text-xs font-bold text-black leading-tight">
                {completedTrips.length} Completed rides
              </p>
              <p className="text-[10px] text-neutral-500">Logged today in NKY Region</p>
            </div>
          </div>
          <div className="h-2 w-16 bg-[#efeded] rounded-full overflow-hidden">
            <div className="h-full bg-[#006d37] w-full"></div>
          </div>
        </div>
      </section>

      {/* Ride Logs Sub-Header & Toggle */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-black">Ride Logs</span>
          <span className="bg-[#efeded] text-[10px] font-bold px-2 py-0.5 rounded-full text-neutral-700">
            Today
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowEmptyView(!showEmptyView)}
          className="inline-flex items-center gap-1 text-xs font-bold text-black bg-[#efeded] hover:bg-[#e3e2e2] px-3 py-1 rounded-full transition-colors"
        >
          <span className="material-symbols-outlined text-[15px]">swap_horiz</span>
          <span>{showEmptyView ? 'View Rides' : 'View Empty'}</span>
        </button>
      </div>

      {/* Rides List or Empty State */}
      {!showEmptyView ? (
        <div className="flex flex-col gap-2.5">
          {completedTrips.map((trip) => (
            <article
              key={trip.id}
              className="bg-white rounded-2xl p-4 shadow-xs border border-neutral-200 flex flex-col justify-between gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 text-neutral-500 text-[11px] mb-1">
                    <span className="material-symbols-outlined text-[13px]">access_time</span>
                    <span>{trip.time}</span>
                  </div>
                  <p className="text-xs font-bold text-black leading-snug">{trip.route}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-base font-extrabold text-black tabular-nums block">
                    ${trip.fare.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-neutral-400 block -mt-0.5">estimate</span>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-[#efeded] text-neutral-700 flex items-center justify-center text-[10px]">
                    <span className="material-symbols-outlined text-[13px]">person</span>
                  </div>
                  <span className="text-neutral-700 font-medium">{trip.rider}</span>
                </div>
                <span className="bg-[#efeded] text-neutral-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  {trip.zone}
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        /* Empty State */
        <section className="flex flex-col items-center justify-center text-center py-10 bg-white rounded-2xl p-6 border border-neutral-200">
          <div className="w-12 h-12 rounded-full bg-[#efeded] flex items-center justify-center mb-3 text-neutral-400">
            <span className="material-symbols-outlined text-[24px]">receipt_long</span>
          </div>
          <h3 className="text-base font-bold text-black mb-1">No completed rides yet.</h3>
          <p className="text-xs text-neutral-500 max-w-xs mb-4">
            Completed assignments will appear here with calculated estimates once signed off.
          </p>
          <button
            type="button"
            onClick={() => setDriverTab('offers')}
            className="px-5 py-2.5 rounded-full bg-black text-white text-xs font-bold hover:bg-neutral-800 transition-colors"
          >
            View Available Dispatches
          </button>
        </section>
      )}

      {/* Settlement Inquiries Card */}
      <aside className="w-full bg-white rounded-2xl p-4 border border-neutral-200 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#efeded] text-black flex items-center justify-center shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[18px]">support_agent</span>
          </div>
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <span className="text-xs font-bold text-black">Settlement Inquiries</span>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Discrepancy or payout question? Call Liberty Ride Owner at{' '}
              <a href="tel:+18595371827" className="font-bold text-black underline whitespace-nowrap">
                +1 (859) 537-1827
              </a>
              .
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
};
