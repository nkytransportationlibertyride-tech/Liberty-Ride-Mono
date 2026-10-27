/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Rider Mobile App - Live Step-by-Step Trip Tracking View
 */

import React, { useState, useEffect } from 'react';
import { useTransit } from '../../context/TransitContext';
import { canCancelRide, formatEasternTime } from '../../utils/transit';

export const TripTrackingView: React.FC = () => {
  const {
    activeRide,
    setRiderTab,
    cancelRide,
    simulateScenario,
  } = useTransit();

  const [copied, setCopied] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [activeScenario, setActiveScenario] = useState<'standard' | 'no-driver' | 'declined' | 'expired'>('standard');
  const [secondsAgo, setSecondsAgo] = useState(2);

  // Auto-refresh counter simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo((prev) => (prev >= 15 ? 0 : prev + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const ride = activeRide;

  const handleCopyUUID = () => {
    if (!ride) return;
    navigator.clipboard.writeText(ride.uuid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmCancel = () => {
    if (!ride) return;
    const res = cancelRide(ride.id, 'Passenger cancelled via Rider Tracking app');
    setShowCancelModal(false);
    if (!res.success) {
      alert(res.error);
    }
  };

  const handleSelectScenario = (sc: 'no-driver' | 'declined' | 'expired') => {
    setActiveScenario(sc);
    if (sc === 'no-driver') simulateScenario('no_driver');
    if (sc === 'declined') simulateScenario('declined');
    if (sc === 'expired') simulateScenario('expired');
  };

  const handleResetScenario = () => {
    setActiveScenario('standard');
    simulateScenario('reset');
  };

  if (!ride) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-neutral-200">
        <p className="text-sm text-neutral-600">No active ride in tracking queue.</p>
        <button
          onClick={() => setRiderTab('ride')}
          className="mt-3 px-5 py-2.5 bg-black text-white text-xs font-bold rounded-full"
        >
          Book a Ride
        </button>
      </div>
    );
  }

  const isCancellable = canCancelRide(ride.status);

  // Step calculations
  const steps = [
    {
      id: 'requested',
      title: 'Requested — waiting for dispatch',
      desc: 'Recorded at 5:40 PM EDT • Erlanger Hub',
    },
    {
      id: 'request_confirmed',
      title: 'Request confirmed — finding your driver',
      desc: 'Matching nearest certified driver in the Boone / Kenton County dispatch perimeter.',
    },
    {
      id: 'driver_offer_sent',
      title: 'Driver offer sent',
      desc: 'Awaiting operator acceptance',
    },
    {
      id: 'driver_confirmed',
      title: 'Driver confirmed',
      desc: ride.driverName
        ? `Assigned: ${ride.driverName} (${ride.vehicleInfo || 'Commercial Sedan'})`
        : 'Vehicle and operator profile assigned',
    },
    {
      id: 'driver_en_route',
      title: 'Driver en route',
      desc: 'Inbound to specified pickup location',
    },
    {
      id: 'completed',
      title: 'Completed',
      desc: 'Arrival & trip receipt confirmation',
    },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'requested':
        return 0;
      case 'request_confirmed':
        return 1;
      case 'driver_offer_sent':
        return 2;
      case 'driver_confirmed':
        return 3;
      case 'driver_en_route':
        return 4;
      case 'completed':
        return 5;
      default:
        return 1;
    }
  };

  const currentStepIdx = getStepIndex(ride.status);

  return (
    <div className="flex flex-col w-full pb-8">
      {/* Live Status & Sync Header Card */}
      <div className="w-full bg-white rounded-2xl shadow-xs border border-neutral-200 p-4 sm:p-5 flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 bg-[#efeded] px-3.5 py-1.5 rounded-full">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                ride.status === 'cancelled'
                  ? 'bg-red-500'
                  : ride.status === 'completed'
                  ? 'bg-[#06C167]'
                  : 'bg-[#FFC043] animate-pulse'
              }`}
            ></span>
            <span className="text-xs font-bold text-black uppercase tracking-wider">
              {ride.status === 'cancelled'
                ? 'Ride Cancelled'
                : ride.status === 'completed'
                ? 'Trip Completed'
                : ride.status === 'driver_en_route'
                ? 'Driver En Route'
                : ride.status === 'driver_confirmed'
                ? 'Driver Confirmed'
                : 'Request confirmed — finding your driver'}
            </span>
          </div>

          <button
            onClick={() => setSecondsAgo(0)}
            className="w-8 h-8 rounded-full bg-[#efeded] hover:bg-[#e3e2e2] text-black flex items-center justify-center transition-transform active:rotate-180"
            title="Manual refresh status"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-neutral-500 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            <span>{secondsAgo === 0 ? 'Updated just now' : `Updated ${secondsAgo}s ago`}</span>
            <span className="text-neutral-400 font-bold">•</span>
            <span>Refreshes every 15s</span>
          </div>
          <span className="text-[11px] bg-[#f5f3f3] px-2 py-0.5 rounded font-mono font-medium">
            {formatEasternTime().split(' ')[0]} EDT
          </span>
        </div>

        {/* Tracking Reference UUID Box */}
        <div className="flex items-center justify-between bg-[#f5f3f3] rounded-xl px-3 py-2 text-neutral-700 border border-neutral-200/50">
          <div className="flex flex-col min-w-0 pr-2">
            <span className="text-[10px] uppercase font-bold text-neutral-400">Tracking Reference</span>
            <span className="text-xs font-mono font-bold text-black truncate select-all">{ride.uuid}</span>
          </div>
          <button
            onClick={handleCopyUUID}
            className="text-xs font-bold text-black hover:underline flex items-center gap-1 shrink-0 bg-white px-2.5 py-1 rounded-lg border border-neutral-200 shadow-xs active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[14px]">
              {copied ? 'check' : 'content_copy'}
            </span>
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Operational Protocol Banner */}
      <div className="w-full bg-[#efeded] rounded-xl p-3.5 flex items-start gap-3 mb-4 border border-neutral-200/60">
        <span className="material-symbols-outlined text-black text-[20px] shrink-0 mt-0.5">shield</span>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-black">
            Step-by-step tracking — no live driver location.
          </span>
          <p className="text-[11px] text-neutral-600 mt-0.5 leading-relaxed">
            Exact coordinates, driver identification, and vehicle plates unlock immediately once assigned by regional dispatch in Erlanger, KY.
          </p>
        </div>
      </div>

      {/* Vertical Milestone Progress Timeline */}
      <div className="w-full bg-white rounded-2xl shadow-xs border border-neutral-200 p-5 mb-4">
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-neutral-100">
          <span className="text-base font-bold text-black">Transit Progression</span>
          <span className="text-xs font-bold text-[#006d37] uppercase tracking-wider">
            Step {Math.min(currentStepIdx + 1, 6)} of 6
          </span>
        </div>

        {/* Timeline Steps */}
        <div className="flex flex-col relative pl-2 pt-2">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            const isLast = idx === steps.length - 1;

            return (
              <div key={step.id} className="flex items-start gap-4 relative pb-5">
                {/* Connecting Line */}
                {!isLast && (
                  <div
                    className={`absolute left-[13px] top-7 bottom-0 w-0.5 ${
                      isCompleted ? 'bg-black' : 'bg-neutral-200'
                    }`}
                  />
                )}

                {/* Circle Marker */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 text-xs font-bold ${
                    isCompleted
                      ? 'bg-black text-white shadow-xs'
                      : isCurrent
                      ? 'bg-black text-white ring-4 ring-neutral-200 shadow-sm'
                      : 'bg-neutral-100 text-neutral-400 border border-neutral-300'
                  }`}
                >
                  {isCompleted ? (
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  ) : isCurrent ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Content */}
                <div
                  className={`flex flex-col min-w-0 flex-1 ${
                    isCurrent ? 'bg-[#f5f3f3] p-3 rounded-xl border border-neutral-200/50' : 'pt-0.5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isCurrent ? 'text-black' : isCompleted ? 'text-neutral-800' : 'text-neutral-400'
                      }`}
                    >
                      {step.title}
                    </span>
                    {isCurrent && (
                      <span className="text-[9px] bg-black text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        Active
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">{step.desc}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pickup & Route Specifics Card */}
      <div className="w-full bg-white rounded-2xl shadow-xs border border-neutral-200 p-5 mb-4 flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
          <span className="text-base font-bold text-black">Trip Specifications</span>
          <span className="text-xl font-extrabold text-black tabular-nums">
            ${ride.fareEstimate.toFixed(2)}
          </span>
        </div>

        <div className="flex flex-col gap-3 pt-1">
          <div className="flex items-start gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-black shrink-0 mt-1"></span>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase font-bold text-neutral-400">Pickup</span>
              <span className="text-xs font-semibold text-black leading-snug">{ride.pickup}</span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-2.5 h-2.5 bg-[#006d37] shrink-0 mt-1"></span>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase font-bold text-neutral-400">Destination</span>
              <span className="text-xs font-semibold text-black leading-snug">{ride.dropoff}</span>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-600">
          <span>Window: {ride.pickupTime}</span>
          <span className="font-mono">{ride.riderPhone}</span>
        </div>
      </div>

      {/* Scanning Radar Sector Graphic */}
      <div className="w-full h-36 rounded-2xl overflow-hidden mb-4 relative shadow-xs bg-[#e9e8e7] border border-neutral-200 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-xs px-4 py-2 rounded-full shadow-sm flex items-center gap-2 border border-neutral-200">
          <span className="material-symbols-outlined text-[18px] text-[#006d37] animate-spin">radar</span>
          <span className="text-xs font-bold text-black uppercase tracking-wider">
            Scanning Erlanger & CVG Sector
          </span>
        </div>
      </div>

      {/* Actions & Trip Governance */}
      <div className="w-full bg-white rounded-2xl shadow-xs border border-neutral-200 p-5 mb-4 flex flex-col gap-3">
        <div className="flex flex-col">
          <span className="text-base font-bold text-black">Trip Governance</span>
          <span className="text-xs text-neutral-500">
            Cancellations allowed only while driver is not en route.
          </span>
        </div>

        {/* Cancellation Button */}
        <button
          type="button"
          onClick={() => setShowCancelModal(true)}
          disabled={!isCancellable}
          className={`w-full h-11 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
            isCancellable
              ? 'bg-[#fee2e2] hover:bg-[#fecaca] text-[#dc2626]'
              : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
          <span>{isCancellable ? 'Cancel Ride' : 'Cancellation Locked (Driver En Route)'}</span>
        </button>

        {/* Dispatch Helpline */}
        <div className="bg-[#f5f3f3] rounded-xl p-3.5 flex flex-col gap-2 mt-1 border border-neutral-200/50">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-black">support_agent</span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-black">Need to change your ride? Call us.</span>
              <span className="text-[11px] text-neutral-500">24/7 Northern Kentucky Dispatch line</span>
            </div>
          </div>
          <a
            href="tel:+18595371827"
            className="w-full h-10 bg-black text-white hover:bg-neutral-800 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">call</span>
            <span>Call Dispatch +1 (859) 537-1827</span>
          </a>
        </div>
      </div>

      {/* Contingency States Overview Switcher */}
      <div className="w-full bg-white rounded-2xl shadow-xs border border-neutral-200 p-5 mb-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-black">Dispatch Scenarios</span>
            <span className="text-xs text-neutral-500 block">Regional contingency states overview</span>
          </div>
          <span className="material-symbols-outlined text-neutral-400 text-[18px]">alt_route</span>
        </div>

        {/* Switcher Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={handleResetScenario}
            className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-colors ${
              activeScenario === 'standard' ? 'bg-black text-white' : 'bg-[#efeded] text-neutral-700'
            }`}
          >
            Standard Queue
          </button>
          <button
            type="button"
            onClick={() => handleSelectScenario('no-driver')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-colors ${
              activeScenario === 'no-driver' ? 'bg-black text-white' : 'bg-[#efeded] text-neutral-700'
            }`}
          >
            No Driver Available
          </button>
          <button
            type="button"
            onClick={() => handleSelectScenario('declined')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-colors ${
              activeScenario === 'declined' ? 'bg-black text-white' : 'bg-[#efeded] text-neutral-700'
            }`}
          >
            Driver Declined
          </button>
          <button
            type="button"
            onClick={() => handleSelectScenario('expired')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-colors ${
              activeScenario === 'expired' ? 'bg-black text-white' : 'bg-[#efeded] text-neutral-700'
            }`}
          >
            Offer Expired
          </button>
        </div>

        {/* Dynamic Scenario Card */}
        {activeScenario === 'no-driver' && (
          <div className="bg-[#f5f3f3] rounded-xl p-4 flex flex-col gap-2.5 border border-red-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">no_crash</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-black">No driver available</span>
                <span className="text-[11px] text-neutral-500">High demand in Erlanger corridor right now.</span>
              </div>
            </div>
            <p className="text-xs text-neutral-600">
              Our local operators are engaged on routes. You may book again shortly or contact dispatch directly.
            </p>
            <div className="flex gap-2 pt-1">
              <a
                href="tel:+18595371827"
                className="flex-1 h-9 bg-black text-white rounded-full text-xs font-bold flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">call</span>
                <span>Call Us</span>
              </a>
              <button
                type="button"
                onClick={() => setRiderTab('ride')}
                className="px-4 h-9 bg-[#e3e2e2] text-black rounded-full text-xs font-semibold"
              >
                Book Again
              </button>
            </div>
          </div>
        )}

        {activeScenario === 'declined' && (
          <div className="bg-[#f5f3f3] rounded-xl p-4 flex flex-col gap-2.5 border border-amber-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">sync_problem</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-black">Driver declined — finding another driver</span>
                <span className="text-[11px] text-neutral-500">Rerouting priority ticket to next available vehicle.</span>
              </div>
            </div>
            <p className="text-xs text-neutral-600">
              The initial operator was unable to accept. Your request is automatically at the front of the dispatch queue.
            </p>
            <div className="flex gap-2 pt-1">
              <a
                href="tel:+18595371827"
                className="flex-1 h-9 bg-black text-white rounded-full text-xs font-bold flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">call</span>
                <span>Call Us</span>
              </a>
              <button
                type="button"
                onClick={handleResetScenario}
                className="px-4 h-9 bg-[#e3e2e2] text-black rounded-full text-xs font-semibold"
              >
                Return to Queue
              </button>
            </div>
          </div>
        )}

        {activeScenario === 'expired' && (
          <div className="bg-[#f5f3f3] rounded-xl p-4 flex flex-col gap-2.5 border border-neutral-300">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">timer_off</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-black">Offer expired — owner notified</span>
                <span className="text-[11px] text-neutral-500">The 45-second driver response window elapsed.</span>
              </div>
            </div>
            <p className="text-xs text-neutral-600">
              Fleet administration was alerted. You can re-broadcast the fare or reach dispatch directly.
            </p>
            <div className="flex gap-2 pt-1">
              <a
                href="tel:+18595371827"
                className="flex-1 h-9 bg-black text-white rounded-full text-xs font-bold flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">call</span>
                <span>Call Us</span>
              </a>
              <button
                type="button"
                onClick={handleResetScenario}
                className="px-4 h-9 bg-[#e3e2e2] text-black rounded-full text-xs font-semibold"
              >
                Re-Broadcast
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Book Another Ride Action */}
      <button
        type="button"
        onClick={() => setRiderTab('ride')}
        className="w-full h-12 rounded-full bg-[#efeded] text-black font-bold text-xs hover:bg-[#e3e2e2] transition-colors"
      >
        Book another ride
      </button>

      {/* Cancellation Modal Dialog */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 flex flex-col gap-4 shadow-2xl border border-neutral-200 animate-in fade-in slide-in-from-bottom duration-200">
            <div className="w-10 h-1 bg-neutral-300 rounded-full mx-auto mb-1"></div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-red-600 text-[24px]">warning</span>
              <span className="text-base font-bold text-black">Confirm Cancellation</span>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Are you sure you want to cancel this booking? Cancellations are allowed only while your driver is not yet en route.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="w-full h-11 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold transition-colors"
              >
                Yes, Cancel Ride
              </button>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="w-full h-11 bg-[#efeded] hover:bg-[#e3e2e2] text-black rounded-full text-xs font-bold transition-colors"
              >
                Keep My Ride
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
