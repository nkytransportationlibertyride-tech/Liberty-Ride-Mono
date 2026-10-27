/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Owner Administration Console - Ride Dossier & Dispatch Management View
 */

import React, { useState } from 'react';
import { useTransit } from '../../context/TransitContext';
import { canCancelRide, formatEasternTime } from '../../utils/transit';

export const RideDossierView: React.FC = () => {
  const { activeRide, setOwnerTab, cancelRide, updateRideStatus } = useTransit();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('rider_requested');
  const [cancelNotes, setCancelNotes] = useState('');

  const ride = activeRide;

  if (!ride) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-neutral-200">
        <p className="text-sm text-neutral-500">No ride selected for inspection.</p>
        <button
          onClick={() => setOwnerTab('dashboard')}
          className="mt-3 px-4 py-2 bg-black text-white text-xs font-bold rounded-full"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const isCancellable = canCancelRide(ride.status);

  const handleConfirmCancellation = (e: React.FormEvent) => {
    e.preventDefault();
    const res = cancelRide(ride.id, cancelReason, cancelNotes);
    if (res.success) {
      setShowCancelModal(false);
      alert(`Ride #${ride.id} successfully cancelled per governance rules.`);
    } else {
      alert(res.error);
    }
  };

  const handleRebroadcast = () => {
    updateRideStatus(ride.id, 'request_confirmed', 'Re-broadcasted to all active fleet units in Erlanger sector');
    alert(`Ride #${ride.id} re-broadcasted to all active units.`);
  };

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Operational Breadcrumbs & Live Telemetry Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-2 gap-3">
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-500 font-semibold">
          <button
            onClick={() => setOwnerTab('dashboard')}
            className="hover:text-black transition-colors"
          >
            Operations
          </button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <button
            onClick={() => setOwnerTab('dashboard')}
            className="hover:text-black transition-colors"
          >
            Rides
          </button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-black font-bold">Ride #{ride.id}</span>
          <span className="ml-2 px-2 py-0.5 rounded bg-[#efeded] text-neutral-700 text-[10px] uppercase font-bold tracking-wider">
            Active Dispatch
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-neutral-200 text-xs shadow-xs">
            <span className="material-symbols-outlined text-[15px] text-neutral-500">lock</span>
            <span className="text-neutral-600 font-medium">Console Active</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#006d37] ml-0.5"></span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-neutral-200 text-xs shadow-xs">
            <span className="material-symbols-outlined text-[15px] text-neutral-500">schedule</span>
            <span className="font-mono font-bold text-black">{formatEasternTime()}</span>
          </div>
        </div>
      </div>

      {/* Main Grid Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Dossier & Route Trajectory (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Primary Card: Ride Dossier */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-neutral-200 flex flex-col gap-6">
            {/* Header Strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 gap-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block">
                  Trip Identifier
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight mt-0.5">
                  Ride Summary — #{ride.id}
                </h1>
              </div>
              <div className="self-start sm:self-center">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#efeded] text-xs font-bold text-black uppercase">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      ride.status === 'cancelled'
                        ? 'bg-red-500'
                        : ride.status === 'completed'
                        ? 'bg-[#006d37]'
                        : 'bg-[#FFC043] animate-pulse'
                    }`}
                  ></span>
                  <span>{ride.status.replace(/_/g, ' ')}</span>
                </span>
              </div>
            </div>

            {/* Rider Profile & Rapid Contact Strip */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-[#f5f3f3] border border-neutral-200/50">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-black text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">person</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">Passenger</span>
                  <span className="text-sm font-bold text-black truncate">{ride.riderName}</span>
                  <span className="text-xs text-neutral-500">Account Verified • Standard Transit</span>
                </div>
              </div>

              <div className="flex items-center justify-start md:justify-end gap-3">
                <div className="flex flex-col text-left md:text-right">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">Direct Telephony</span>
                  <a
                    href={`tel:${ride.riderPhone}`}
                    className="text-sm font-bold text-black hover:text-[#006d37] font-mono underline"
                  >
                    {ride.riderPhone}
                  </a>
                  <span className="text-[10px] text-neutral-500">Tap to place carrier dispatch call</span>
                </div>
                <a
                  href={`tel:${ride.riderPhone}`}
                  className="w-9 h-9 rounded-full bg-white shadow-xs border border-neutral-200 flex items-center justify-center text-black hover:bg-black hover:text-white transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">call</span>
                </a>
              </div>
            </div>

            {/* Regional Trajectory Map Area */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Regional Corridor Trajectory
                </span>
                <span className="text-xs text-neutral-400">NKY Transit Authority Corridor</span>
              </div>

              <div
                className="relative w-full h-52 rounded-xl overflow-hidden shadow-xs border border-neutral-200 bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCKCNuKby1J0mJn8XosYhoIEZPBafsIdwxUVoFJ2v9kJBSIglOg4Ub-cskcn8ZQeRvw0oOiQfXgtJvED9W84AUcnAW6l_5_0nv8DHxug3xkI1P2K-uoDvT_LOtugbfhYAn9IBXUhefH2uaKU-Y9xElDeaHlXrAfxsX5Glsn7bE6b_UewPkilfMhjFWKnD6RldGIzpsL0RKiY1f1550BkgxdYA4EU834MuNb66oeaDK8J69pNRzfWxw-')",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <span className="material-symbols-outlined text-[16px]">near_me</span>
                      <span>CVG Corridor • I-275 E to KY-1303 S (approx. {ride.distanceMiles.toFixed(1)} miles)</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded bg-white/20 backdrop-blur-xs text-[10px] font-semibold">
                      High Reliability Route
                    </span>
                  </div>
                </div>
              </div>

              {/* Waypoints Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Pickup */}
                <div className="p-4 rounded-xl bg-[#f5f3f3] border border-neutral-200/50 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    A
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                      Origin Point
                    </span>
                    <span className="text-xs font-bold text-black mt-0.5 leading-snug">{ride.pickup}</span>
                    <span className="text-[10px] text-neutral-500 bg-white px-2 py-0.5 rounded border border-neutral-200 inline-block self-start mt-2 font-medium">
                      Curbside Ground Transport Tier
                    </span>
                  </div>
                </div>

                {/* Dropoff */}
                <div className="p-4 rounded-xl bg-[#f5f3f3] border border-neutral-200/50 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-xs bg-[#006d37] text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    B
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                      Destination Terminal
                    </span>
                    <span className="text-xs font-bold text-black mt-0.5 leading-snug">{ride.dropoff}</span>
                    <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block self-start mt-2 font-medium">
                      Main Entrance Patient Drop
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Telemetry Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-[#f5f3f3] border border-neutral-200/40 flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold text-neutral-400">Scheduled For</span>
                <div className="mt-2">
                  <span className="text-xs font-bold text-black block">{ride.pickupDate}</span>
                  <span className="text-xs text-neutral-600 font-mono block">{ride.pickupTime}</span>
                  <span className="text-[9px] text-neutral-400 uppercase mt-0.5 block">America/New_York</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#f5f3f3] border border-neutral-200/40 flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold text-neutral-400">Inbound Flight</span>
                <div className="mt-2">
                  <span className="text-xs font-bold text-black block">
                    {ride.flightNumber || 'Direct Terminal'}
                  </span>
                  <span className="text-[11px] text-[#006d37] font-semibold block mt-0.5">
                    {ride.flightStatus || 'Flight Synced'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#f5f3f3] border border-neutral-200/40 flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold text-neutral-400">Fare Structure</span>
                <div className="mt-2">
                  <span className="text-xs font-bold text-black block">{ride.zone}</span>
                  <span className="text-base font-extrabold text-black tabular-nums block">
                    ${ride.fareEstimate.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-neutral-400 block">Estimate prior to match</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#f5f3f3] border border-neutral-200/40 flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold text-neutral-400">Fare Settlement</span>
                <div className="mt-2">
                  <span className="text-xs font-bold text-black block">
                    ${ride.fareEstimate.toFixed(2)} (estimate)
                  </span>
                  <span className="text-[10px] text-neutral-500 leading-tight block mt-1">
                    Final fare confirmed upon driver acceptance
                  </span>
                </div>
              </div>
            </div>

            {/* Special Directives Banner */}
            <div className="p-4 rounded-xl bg-[#f5f3f3] border border-neutral-200/50 flex items-start gap-3">
              <span className="material-symbols-outlined text-[20px] text-black shrink-0 mt-0.5">
                medical_services
              </span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-black">
                  Special Dispatch Directives & Accessibility
                </span>
                <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                  {ride.notes ||
                    '“Assistance with luggage requested; flight on time” — Passenger scheduled airport pickup with outbound clinical destination. Please alert driver of oversized trunk stowage requirement.'}
                </p>
              </div>
            </div>
          </div>

          {/* Carrier & Driver Assignment Card */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-neutral-200 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-black">local_taxi</span>
                <h2 className="text-sm font-bold text-black">Carrier & Driver Assignment</h2>
              </div>
              <span className="px-2.5 py-0.5 rounded bg-[#efeded] text-neutral-700 text-[10px] font-bold uppercase">
                Assignment Queue
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#f5f3f3] rounded-xl gap-4 border border-neutral-200/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white shadow-xs border border-neutral-200 flex items-center justify-center text-black shrink-0">
                  <span className="material-symbols-outlined text-[28px]">drive_eta</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-black">{ride.driverName || 'Marcus Vance'}</span>
                    <span className="px-2 py-0.5 rounded bg-[#e3e2e2] text-neutral-800 text-[10px] font-bold">
                      Primary Offer
                    </span>
                  </div>
                  <span className="text-xs text-neutral-600">
                    {ride.vehicleInfo || 'Fleet Sedan • Silver Ford Taurus • Lic: KY-8820-EX'}
                  </span>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-neutral-500">
                    <span>
                      Driver ID: <strong className="font-mono text-black">{ride.driverPhone?.replace(/\D/g, '') || '8595371827'}</strong>
                    </span>
                    <span>Rating: 4.96 ★ (540 trips)</span>
                  </div>
                </div>
              </div>

              <div className="flex sm:flex-col items-start sm:items-end justify-between gap-1">
                <span className="text-[10px] uppercase font-bold text-neutral-400">Direct Driver Line</span>
                <a
                  href={`tel:${ride.driverPhone || '+18595371827'}`}
                  className="text-sm font-bold text-black hover:text-[#006d37] font-mono underline"
                >
                  {ride.driverPhone || '+1 (859) 537-1827'}
                </a>
                <span className="text-[10px] text-neutral-500">Pending Handshake Confirmation</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Audit Trail & Console Actions (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Dispatch Audit Trail */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-neutral-200 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-black">timeline</span>
                <h2 className="text-sm font-bold text-black">Dispatch Audit Trail</h2>
              </div>
              <span className="text-xs text-neutral-400">6 States</span>
            </div>
            <p className="text-xs text-neutral-500">
              Real-time synchronized transition logs across Northern Kentucky dispatch server.
            </p>

            <div className="relative flex flex-col gap-4 pl-2 pt-1">
              <div className="absolute left-[13px] top-3 bottom-5 w-0.5 bg-neutral-200"></div>

              {ride.auditTrail.map((entry, idx) => (
                <div key={idx} className="relative flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center z-10 shrink-0 text-xs shadow-xs">
                    <span className="material-symbols-outlined text-[14px]">check</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-black">{entry.label}</span>
                    <span className="text-[11px] font-mono text-neutral-500">{entry.timestamp}</span>
                    <span className="text-[11px] text-neutral-600 mt-0.5 leading-snug">{entry.note}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Console Policy Actions */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-neutral-200 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-red-600">gavel</span>
                <h2 className="text-sm font-bold text-black">Console Actions</h2>
              </div>
              <span className="text-[10px] text-red-700 font-bold uppercase bg-red-50 px-2 py-0.5 rounded">
                Pre-Transit Tier
              </span>
            </div>

            {/* Policy Note Box */}
            <div className="p-3.5 rounded-xl bg-[#f5f3f3] text-neutral-700 flex flex-col gap-1 border border-neutral-200/50">
              <div className="flex items-center gap-1.5 text-xs font-bold text-black">
                <span className="material-symbols-outlined text-[16px]">info</span>
                <span>Policy Governance Notice</span>
              </div>
              <p className="text-xs leading-relaxed text-neutral-600">
                Cancellation follows the same rules as the rider app: cancellations are not allowed once the driver is en route or the ride is completed.
              </p>
            </div>

            {/* Action Buttons */}
            {!showCancelModal ? (
              <div className="flex flex-col gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  disabled={!isCancellable}
                  className={`w-full h-12 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs ${
                    isCancellable
                      ? 'bg-[#fee2e2] text-[#dc2626] hover:bg-red-600 hover:text-white'
                      : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">cancel</span>
                  <span>{isCancellable ? `Cancel Ride #${ride.id}` : 'Cancellation Locked (En Route)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleRebroadcast}
                  className="w-full h-11 rounded-full bg-[#efeded] text-black hover:bg-[#e3e2e2] text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">sync</span>
                  <span>Re-broadcast Driver Search</span>
                </button>
              </div>
            ) : (
              /* Inline Cancellation Confirmation Form */
              <form onSubmit={handleConfirmCancellation} className="flex flex-col gap-3 p-4 rounded-xl bg-[#fee2e2]/40 border border-red-200">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-red-600 text-[20px] shrink-0 mt-0.5">
                    warning
                  </span>
                  <div>
                    <span className="text-xs font-bold text-black">Confirm Ride Revocation</span>
                    <p className="text-[11px] text-neutral-600 mt-0.5">
                      Please state cancellation reason for #{ride.id}:
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-700 uppercase">
                    Reason for Cancellation
                  </label>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-white text-xs font-medium border border-neutral-300 outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="Passenger direct phone cancellation (+1 859-555-0142)">
                      Passenger direct phone cancellation
                    </option>
                    <option value="Flight schedule rescheduled / cancelled at CVG">
                      Flight schedule rescheduled / cancelled at CVG
                    </option>
                    <option value="No units currently available in Erlanger Zone 1">
                      No units currently available in Erlanger Zone 1
                    </option>
                    <option value="Administrative duplicate reservation">
                      Administrative duplicate reservation
                    </option>
                    <option value="Other dispatch exception">Other dispatch exception</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-700 uppercase">
                    Operator Notes (Audit)
                  </label>
                  <input
                    type="text"
                    value={cancelNotes}
                    onChange={(e) => setCancelNotes(e.target.value)}
                    placeholder="e.g. Flight landed early, passenger took airport shuttle"
                    className="w-full h-10 px-3 rounded-lg bg-white text-xs border border-neutral-300 outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 h-10 rounded-full bg-red-600 text-white hover:bg-red-700 text-xs font-bold transition-all shadow-xs"
                  >
                    Confirm Cancellation
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(false)}
                    className="px-4 h-10 rounded-full bg-white text-black border border-neutral-300 text-xs font-bold hover:bg-neutral-50"
                  >
                    Dismiss
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
