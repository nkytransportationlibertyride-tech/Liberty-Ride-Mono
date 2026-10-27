/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Rider Mobile App - Trip History & Receipts View
 */

import React, { useState } from 'react';
import { useTransit } from '../../context/TransitContext';
import { TransitRide } from '../../types/transit';
import { calculateTotalFaresPaid, formatEasternTime } from '../../utils/transit';

export const TripHistoryView: React.FC = () => {
  const { rides, setRiderTab, createNewRide, cancelRide } = useTransit();

  // Active filter tab: 'completed' | 'scheduled' | 'all'
  const [activeFilter, setActiveFilter] = useState<'completed' | 'scheduled' | 'all'>('completed');
  const [selectedReceiptRide, setSelectedReceiptRide] = useState<TransitRide | null>(null);

  // Filter rides
  const completedRides = rides.filter((r) => r.status === 'completed');
  const scheduledRides = rides.filter(
    (r) => r.isScheduled && r.status !== 'completed' && r.status !== 'cancelled'
  );

  const displayedRides =
    activeFilter === 'completed'
      ? completedRides
      : activeFilter === 'scheduled'
      ? scheduledRides
      : rides;

  // Aggregate stats
  const totalPaid = calculateTotalFaresPaid(completedRides);
  const totalMiles = completedRides
    .reduce((sum, r) => sum + (r.distanceMiles || 0), 0)
    .toFixed(1);

  // Handle "Book Again"
  const handleBookAgain = (ride: TransitRide) => {
    createNewRide({
      pickup: ride.pickup,
      dropoff: ride.dropoff,
      category: ride.category,
      fareEstimate: ride.fareEstimate,
      baseFare: ride.baseFare,
      meteredRate: ride.meteredRate,
      distanceMiles: ride.distanceMiles,
      estimatedMinutes: ride.estimatedMinutes,
      zone: ride.zone,
    });
    setRiderTab('quote');
  };

  return (
    <div className="flex flex-col w-full pb-10 space-y-4">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">history</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-black tracking-tight leading-tight">
                Trip History
              </h1>
              <span className="text-[11px] text-neutral-500 font-medium">
                Passenger: David Miller • (859) 555-0142
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#f1edec] text-[10px] font-bold uppercase tracking-wider text-neutral-700">
            NKY Transit Ledger
          </span>
        </div>

        {/* Aggregated Metrics Strip */}
        <div className="grid grid-cols-3 gap-2 pt-3">
          <div className="bg-[#f7f3f2] rounded-xl p-2.5 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-neutral-500 uppercase font-bold">Total Rides</span>
            <span className="text-xl font-black text-black mt-0.5">{completedRides.length}</span>
            <span className="text-[10px] text-[#006d37] font-semibold">100% Completed</span>
          </div>

          <div className="bg-[#f7f3f2] rounded-xl p-2.5 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-neutral-500 uppercase font-bold">Total Spent</span>
            <span className="text-xl font-black text-black mt-0.5">${totalPaid.toFixed(2)}</span>
            <span className="text-[10px] text-neutral-500 font-medium">Upfront Flat Rates</span>
          </div>

          <div className="bg-[#f7f3f2] rounded-xl p-2.5 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-neutral-500 uppercase font-bold">Corridor Miles</span>
            <span className="text-xl font-black text-black mt-0.5">{totalMiles}</span>
            <span className="text-[10px] text-neutral-500 font-medium">Boone & Kenton</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 bg-[#efeded] p-1 rounded-xl border border-neutral-200">
        <button
          type="button"
          onClick={() => setActiveFilter('completed')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeFilter === 'completed'
              ? 'bg-black text-white shadow-xs'
              : 'text-neutral-600 hover:text-black hover:bg-white/50'
          }`}
        >
          <span className="material-symbols-outlined text-[15px]">check_circle</span>
          <span>Completed ({completedRides.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('scheduled')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeFilter === 'scheduled'
              ? 'bg-black text-white shadow-xs'
              : 'text-neutral-600 hover:text-black hover:bg-white/50'
          }`}
        >
          <span className="material-symbols-outlined text-[15px]">event</span>
          <span>Scheduled ({scheduledRides.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
            activeFilter === 'all'
              ? 'bg-black text-white shadow-xs'
              : 'text-neutral-600 hover:text-black hover:bg-white/50'
          }`}
        >
          All ({rides.length})
        </button>
      </div>

      {/* Rides List */}
      <div className="flex flex-col gap-3">
        {displayedRides.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center flex flex-col items-center justify-center border border-neutral-200 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-[#f1edec] flex items-center justify-center text-neutral-500 mb-3">
              <span className="material-symbols-outlined text-[24px]">receipt_long</span>
            </div>
            <h3 className="text-base font-bold text-black">No trips found</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-xs">
              {activeFilter === 'scheduled'
                ? 'No future rides scheduled. You can pre-book trips in the Ride tab.'
                : 'Your ride receipts and historical records will appear here.'}
            </p>
            <button
              type="button"
              onClick={() => setRiderTab('ride')}
              className="mt-4 px-4 py-2 bg-black text-white rounded-full text-xs font-bold shadow-xs hover:bg-neutral-800 transition-colors"
            >
              Book a Ride
            </button>
          </div>
        ) : (
          displayedRides.map((ride) => {
            const isCompleted = ride.status === 'completed';
            const isCancelled = ride.status === 'cancelled';
            const isUpcoming = ride.isScheduled && !isCompleted && !isCancelled;

            return (
              <article
                key={ride.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200 flex flex-col gap-3 transition-all hover:border-neutral-300"
              >
                {/* Card Top Strip: Date, ID, Status Badge */}
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-black font-mono">{ride.id}</span>
                    <span className="text-neutral-300">•</span>
                    <span className="text-xs font-medium text-neutral-600">
                      {ride.scheduledFor || ride.pickupTime}
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : isUpcoming
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : isCancelled
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isCompleted
                          ? 'bg-[#006d37]'
                          : isUpcoming
                          ? 'bg-blue-600'
                          : isCancelled
                          ? 'bg-red-600'
                          : 'bg-amber-500 animate-pulse'
                      }`}
                    ></span>
                    {isCompleted
                      ? 'Completed'
                      : isUpcoming
                      ? 'Scheduled Future Ride'
                      : isCancelled
                      ? 'Cancelled'
                      : 'Active Dispatch'}
                  </span>
                </div>

                {/* Route Visualizer */}
                <div className="flex flex-col relative pl-6 py-0.5">
                  <div className="absolute left-[7px] top-2.5 bottom-2.5 w-0.5 bg-neutral-200"></div>

                  {/* Pickup */}
                  <div className="relative flex flex-col mb-3">
                    <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-black flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                      Pickup Location
                    </span>
                    <span className="text-xs font-bold text-black leading-snug mt-0.5">
                      {ride.pickup}
                    </span>
                  </div>

                  {/* Dropoff */}
                  <div className="relative flex flex-col">
                    <div className="absolute -left-6 top-1 w-3.5 h-3.5 bg-[#006d37] flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white"></div>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                      Dropoff Destination
                    </span>
                    <span className="text-xs font-bold text-black leading-snug mt-0.5">
                      {ride.dropoff}
                    </span>
                  </div>
                </div>

                {/* Details Strip: Driver, Fare, Category */}
                <div className="bg-[#f7f3f2] rounded-xl p-3 flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="material-symbols-outlined text-[16px] text-neutral-600">
                        drive_eta
                      </span>
                      <span className="font-bold text-black">
                        {ride.driverName || 'Erlanger Fleet Vehicle'}
                      </span>
                    </div>
                    {ride.vehicleInfo && (
                      <span className="text-[11px] text-neutral-500 mt-0.5 truncate max-w-[200px]">
                        {ride.vehicleInfo}
                      </span>
                    )}
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-black text-black">
                        ${ride.fareEstimate.toFixed(2)}
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-semibold uppercase">
                      {ride.zone || 'Guaranteed Rate'}
                    </span>
                  </div>
                </div>

                {/* Action Controls */}
                <div className="flex items-center gap-2 pt-1">
                  {isCompleted && (
                    <>
                      <button
                        type="button"
                        onClick={() => setSelectedReceiptRide(ride)}
                        className="flex-1 h-9 rounded-full bg-[#efeded] hover:bg-neutral-200 text-black text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">receipt</span>
                        <span>View Receipt</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleBookAgain(ride)}
                        className="flex-1 h-9 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[16px]">refresh</span>
                        <span>Book Again</span>
                      </button>
                    </>
                  )}

                  {isUpcoming && (
                    <>
                      <button
                        type="button"
                        onClick={() => setRiderTab('tracking')}
                        className="flex-1 h-9 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">radar</span>
                        <span>View Reservation</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Cancel reservation #${ride.id}?`)) {
                            cancelRide(ride.id, 'Rider cancelled future booking');
                          }
                        }}
                        className="h-9 px-3 rounded-full bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold flex items-center justify-center transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  {!isCompleted && !isUpcoming && (
                    <button
                      type="button"
                      onClick={() => setRiderTab('tracking')}
                      className="w-full h-9 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">near_me</span>
                      <span>Track Active Trip</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Official Receipt Modal */}
      {selectedReceiptRide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl flex flex-col gap-4 border border-neutral-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-neutral-200">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                  Official Transit Receipt
                </span>
                <span className="text-lg font-black text-black tracking-tight mt-0.5">
                  LIBERTY RIDE NKY
                </span>
                <span className="text-[11px] text-neutral-500">
                  Liberty Ride NKY Trans, LLC • Erlanger, KY
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceiptRide(null)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-black transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Receipt Summary Info */}
            <div className="bg-[#f7f3f2] rounded-2xl p-3.5 flex flex-col gap-2">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-500 font-medium">Receipt #</span>
                <span className="font-mono font-bold text-black">{selectedReceiptRide.id}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-neutral-500 font-medium">Date & Time</span>
                <span className="font-semibold text-black">
                  {selectedReceiptRide.scheduledFor || selectedReceiptRide.pickupTime}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-neutral-500 font-medium">Driver Operator</span>
                <span className="font-semibold text-black">
                  {selectedReceiptRide.driverName || 'Marcus Vance'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-neutral-500 font-medium">Vehicle / Plates</span>
                <span className="font-semibold text-black truncate max-w-[170px]">
                  {selectedReceiptRide.vehicleInfo || 'Toyota Camry Hybrid #11'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-neutral-500 font-medium">Tracking UUID</span>
                <span className="font-mono text-[10px] text-neutral-600 truncate max-w-[170px]">
                  {selectedReceiptRide.uuid}
                </span>
              </div>
            </div>

            {/* Line Items Breakdown */}
            <div className="flex flex-col gap-2 py-1">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-600">Base Transit Fare ({selectedReceiptRide.zone})</span>
                <span className="font-semibold text-black">
                  ${selectedReceiptRide.baseFare.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-neutral-600">
                  Corridor Distance ({selectedReceiptRide.distanceMiles} mi)
                </span>
                <span className="font-semibold text-black">
                  ${selectedReceiptRide.meteredRate.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-neutral-600">Dynamic Surge Multipliers</span>
                <span className="font-semibold text-[#006d37]">0.0% ($0.00)</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-neutral-600">Airport & Toll Access</span>
                <span className="font-semibold text-black">$0.00</span>
              </div>

              <div className="h-px bg-neutral-200 my-1"></div>

              <div className="flex justify-between items-baseline">
                <span className="text-sm font-bold text-black">Total Fare Paid</span>
                <span className="text-xl font-black text-black">
                  ${selectedReceiptRide.fareEstimate.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-neutral-500">
                <span>Payment Settlement</span>
                <span className="font-bold text-[#006d37]">PAID IN FULL</span>
              </div>
            </div>

            {/* Print & Close Actions */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  alert(`Receipt #${selectedReceiptRide.id} saved to device.`);
                  setSelectedReceiptRide(null);
                }}
                className="w-full h-11 bg-black text-white rounded-full text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:bg-neutral-800 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>Print or Save PDF Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedReceiptRide(null)}
                className="w-full h-10 bg-[#efeded] text-black rounded-full text-xs font-bold hover:bg-neutral-200 transition-colors"
              >
                Done
              </button>
            </div>

            <p className="text-[10px] text-neutral-400 text-center leading-tight">
              Liberty Ride NKY Trans, LLC • Direct Dispatch Support: +1 (859) 537-1827
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripHistoryView;
