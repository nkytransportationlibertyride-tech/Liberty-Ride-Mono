/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Owner Administration Console - Drivers & Fleet Management View
 */

import React, { useState } from 'react';
import { useTransit } from '../../context/TransitContext';
import {
  deriveDriverReference,
  formatUSPhone,
  validateUSPhone,
  formatEasternTime,
} from '../../utils/transit';
import { TransitDriver } from '../../types/transit';
import { FARE_ZONES_CONFIG } from '../../data/mockData';

export const DriversManagementView: React.FC = () => {
  const { drivers, registerNewDriver } = useTransit();

  const [phone, setPhone] = useState('+1 (859) 537-1827');
  const [name, setName] = useState('Marcus Vance');
  const [lastCreatedDriver, setLastCreatedDriver] = useState<TransitDriver | null>(null);
  const [isRefreshingShifts, setIsRefreshingShifts] = useState(false);
  const [isRetryingConnection, setIsRetryingConnection] = useState(false);

  const derivedRef = deriveDriverReference(phone);
  const isPhoneValid = validateUSPhone(phone);

  const handleCreateDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const created = registerNewDriver(name.trim(), phone.trim());
    setLastCreatedDriver(created);
  };

  const handleRefreshShifts = () => {
    setIsRefreshingShifts(true);
    setTimeout(() => {
      setIsRefreshingShifts(false);
      alert('All shifts synchronized with Commonwealth Driver Licensing DB.');
    }, 600);
  };

  const handleRetryConnection = () => {
    setIsRetryingConnection(true);
    setTimeout(() => {
      setIsRetryingConnection(false);
      alert('Dispatch heartbeat re-established with Northern Kentucky node.');
    }, 700);
  };

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Sub-Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 gap-3 border-b border-neutral-200">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-xs text-neutral-500 font-semibold">
            <span className="uppercase tracking-wider">Regional Operations / Fleet Provisioning</span>
            <span>•</span>
            <span className="text-[#006d37] font-bold uppercase">Live Dispatch Channel</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight mt-0.5">
            Drivers & Fleet Management
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-neutral-200 text-xs shadow-xs">
            <span className="material-symbols-outlined text-[15px] text-neutral-500">verified_user</span>
            <span className="text-black font-semibold">Console Authenticated</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-neutral-200 text-xs shadow-xs">
            <span className="material-symbols-outlined text-[15px] text-[#006d37]">schedule</span>
            <span className="font-mono font-bold text-black">{formatEasternTime()}</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Driver Enrollment & Confirmation (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Create Driver Form Card */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-neutral-200 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-black"></span>
                <h2 className="text-base font-bold text-black">Create New Driver</h2>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#efeded] text-neutral-600 text-[10px] font-bold uppercase">
                KY-DOT REG
              </span>
            </div>

            <p className="text-xs text-neutral-500 leading-relaxed">
              Enroll credentialed transit drivers for Erlanger, Boone, Kenton, and Campbell County routes.
            </p>

            <form onSubmit={handleCreateDriver} className="flex flex-col gap-4 mt-1">
              {/* Field 1: Driver reference */}
              <div className="space-y-1">
                <div className="flex justify-between items-baseline text-xs">
                  <label className="font-bold text-black">Driver reference</label>
                  <span className="text-[10px] text-neutral-400">Auto-derived UID</span>
                </div>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-neutral-400 text-[18px]">
                    badge
                  </span>
                  <input
                    type="text"
                    value={derivedRef}
                    readOnly
                    className="w-full h-11 pl-10 pr-3 rounded-xl bg-[#f5f3f3] text-black font-mono font-bold text-xs outline-none cursor-not-allowed border border-neutral-200"
                  />
                </div>
                <p className="text-[11px] text-neutral-500">
                  (Convention: the driver phone number without spaces or symbols, e.g.{' '}
                  <span className="font-mono font-semibold text-black">{derivedRef}</span>)
                </p>
              </div>

              {/* Field 2: Phone Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-black block">Phone</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-neutral-400 text-[18px]">
                    call
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (859) 537-1827"
                    required
                    className="w-full h-11 pl-10 pr-3 rounded-xl bg-[#f5f3f3] text-black text-xs font-semibold focus:bg-white outline-none focus:ring-2 focus:ring-black border border-neutral-200 transition-all"
                  />
                </div>
                <div className="flex items-center gap-1 text-[11px] text-[#006d37]">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  <span>Standard US E.164 regional formatting validated</span>
                </div>
              </div>

              {/* Field 3: Display Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-black block">Display name</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-neutral-400 text-[18px]">
                    person
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Marcus Vance"
                    required
                    className="w-full h-11 pl-10 pr-3 rounded-xl bg-[#f5f3f3] text-black text-xs font-semibold focus:bg-white outline-none focus:ring-2 focus:ring-black border border-neutral-200 transition-all"
                  />
                </div>
                <span className="text-[10px] text-neutral-500">
                  Full legal identity matching Commonwealth driver licensing records.
                </span>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full h-12 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.99] mt-2"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                <span>Create driver</span>
              </button>
            </form>
          </div>

          {/* Provisioned Success Card */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-neutral-200 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#66fe9c]/30 text-[#00210d] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px] font-bold">check</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#006d37] tracking-wider">
                    Provisioned
                  </span>
                  <h3 className="text-sm font-bold text-black">Driver Successfully Created</h3>
                </div>
              </div>
              <span className="text-[10px] bg-[#efeded] text-neutral-700 px-2 py-0.5 rounded font-mono font-bold">
                ID #{lastCreatedDriver ? lastCreatedDriver.id : '9042'}
              </span>
            </div>

            <div className="bg-[#f5f3f3] rounded-xl p-3.5 flex flex-col gap-2 text-xs border border-neutral-200/50">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Display name</span>
                <span className="font-bold text-black">
                  {lastCreatedDriver ? lastCreatedDriver.name : 'Marcus Vance'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Phone</span>
                <a
                  href={`tel:${lastCreatedDriver ? lastCreatedDriver.phone : '+18595371827'}`}
                  className="font-mono font-bold text-black hover:underline"
                >
                  {lastCreatedDriver ? lastCreatedDriver.phone : '+1 (859) 537-1827'}
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Driver reference</span>
                <span className="font-mono font-bold text-black bg-white px-2 py-0.5 rounded border border-neutral-200">
                  {lastCreatedDriver ? lastCreatedDriver.refId : '8595371827'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Status</span>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white border border-neutral-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#006d37]"></span>
                  <span className="text-[10px] uppercase font-bold text-black">
                    Active • Ready for dispatch
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-neutral-500 text-[11px]">Assigned Depot: Erlanger Central</span>
              <button
                type="button"
                onClick={() =>
                  alert(
                    `SMS on-boarding key dispatched to ${
                      lastCreatedDriver ? lastCreatedDriver.phone : '+1 (859) 537-1827'
                    }`
                  )
                }
                className="font-bold text-black hover:underline flex items-center gap-1 text-xs"
              >
                <span className="material-symbols-outlined text-[15px]">send_to_mobile</span>
                <span>Send Credential SMS</span>
              </button>
            </div>
          </div>

          {/* Vehicle Assignment Rule */}
          <div className="bg-[#f5f3f3] rounded-xl p-4 flex items-start gap-3 border border-neutral-200/50">
            <span className="material-symbols-outlined text-[20px] text-black mt-0.5 shrink-0">
              local_shipping
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-black">Vehicle Assignment Rule</span>
              <p className="text-[11px] text-neutral-600 mt-0.5 leading-relaxed">
                Newly registered drivers require vehicle inspection sign-off within 72 hours under KY DOT Rule 409-B. Contact fleet manager at <span className="font-bold text-black">+1 (859) 537-1827</span> for equipment issuance.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Active Roster & Territory Zones (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Active Drivers Roster Card */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-neutral-200 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#006d37]"></span>
                <h2 className="text-base font-bold text-black">Active Drivers Roster</h2>
                <span className="ml-1 px-2.5 py-0.5 rounded-full bg-[#efeded] text-black text-[10px] font-bold">
                  {drivers.length} Drivers Active
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => alert('Filtering zones for Boone & Kenton counties')}
                  className="h-7 px-3 rounded-full bg-[#f5f3f3] hover:bg-[#e3e2e2] text-black text-[11px] font-semibold flex items-center gap-1 border border-neutral-200"
                >
                  <span className="material-symbols-outlined text-[13px]">tune</span>
                  <span>Filter Zones</span>
                </button>
                <button
                  type="button"
                  onClick={() => alert('Exporting active drivers roster as CSV...')}
                  className="h-7 px-3 rounded-full bg-[#f5f3f3] hover:bg-[#e3e2e2] text-black text-[11px] font-semibold flex items-center gap-1 border border-neutral-200"
                >
                  <span className="material-symbols-outlined text-[13px]">download</span>
                  <span>CSV</span>
                </button>
              </div>
            </div>

            {/* Drivers Table */}
            <div className="overflow-x-auto rounded-xl border border-neutral-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#efeded] text-neutral-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Driver / Name</th>
                    <th className="py-2.5 px-3">Phone Contact</th>
                    <th className="py-2.5 px-3">Driver Ref</th>
                    <th className="py-2.5 px-3 text-center">Rides</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {drivers.map((drv) => (
                    <tr key={drv.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#e3e2e2] flex items-center justify-center font-bold text-black text-[10px] shrink-0">
                            {drv.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-black truncate">{drv.name}</span>
                            <span className="text-[10px] text-neutral-500 truncate">{drv.vehicle}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <a href={`tel:${drv.phone}`} className="hover:underline font-mono text-neutral-700">
                          {drv.phone}
                        </a>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-mono font-bold text-black">
                        <span className="bg-[#f5f3f3] px-2 py-0.5 rounded border border-neutral-200">
                          {drv.refId}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-black tabular-nums">
                        {drv.totalTrips}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#f5f3f3] text-[10px] font-bold uppercase border border-neutral-200">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              drv.status === 'on_shift' ? 'bg-[#006d37]' : 'bg-emerald-400'
                            }`}
                          ></span>
                          <span>{drv.status === 'on_shift' ? 'On Shift' : 'Active'}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Territory Zones & Fixed Base Rates */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-neutral-200 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-black">map</span>
                <h3 className="text-sm font-bold text-black">Territory Zones & Fixed Base Rates</h3>
              </div>
              <span className="text-[10px] text-neutral-500 uppercase font-semibold">
                Erlanger • NKY Metro Hub
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {FARE_ZONES_CONFIG.map((z) => (
                <div
                  key={z.zoneId}
                  className="bg-[#f5f3f3] rounded-xl p-3.5 flex flex-col justify-between gap-1 border border-neutral-200/50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-black uppercase">{z.shortName}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#006d37]"></span>
                  </div>
                  <span className="text-xl font-extrabold text-black tabular-nums mt-1">
                    {z.rate.split(' ')[0]}
                  </span>
                  <div className="flex flex-col mt-0.5">
                    <span className="text-[11px] font-bold text-black truncate">{z.name.split('—')[1] || z.name}</span>
                    <span className="text-[10px] text-neutral-500">{z.details}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Status Components Stack: Empty State & Error State Displays */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Empty State Component */}
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-neutral-200 flex flex-col items-center text-center justify-between gap-3">
              <div className="w-10 h-10 rounded-full bg-[#efeded] flex items-center justify-center text-neutral-600">
                <span className="material-symbols-outlined text-[20px]">person_off</span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-black">No inactive drivers found</h4>
                <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
                  All {drivers.length} credentialed operators in Erlanger are presently clocked in or fulfilling active dispatched manifests.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRefreshShifts}
                disabled={isRefreshingShifts}
                className="h-8 px-4 rounded-full bg-[#f5f3f3] hover:bg-[#e3e2e2] text-black text-xs font-semibold flex items-center gap-1 transition-colors border border-neutral-200"
              >
                <span className={`material-symbols-outlined text-[14px] ${isRefreshingShifts ? 'animate-spin' : ''}`}>
                  sync
                </span>
                <span>{isRefreshingShifts ? 'Checking...' : 'Refresh Shifts'}</span>
              </button>
            </div>

            {/* Error State Component */}
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-neutral-200 flex flex-col items-center text-center justify-between gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <span className="material-symbols-outlined text-[20px]">signal_disconnected</span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-black">Unable to reach driver dispatch service</h4>
                <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
                  Telemetry heartbeat dropped for regional gateway node. Please check your data connection or call <span className="font-bold text-black">+1 (859) 537-1827</span>.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRetryConnection}
                  disabled={isRetryingConnection}
                  className="h-8 px-3 rounded-full bg-black text-white hover:bg-neutral-800 text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <span className={`material-symbols-outlined text-[14px] ${isRetryingConnection ? 'animate-spin' : ''}`}>
                    refresh
                  </span>
                  <span>{isRetryingConnection ? 'Connecting...' : 'Retry'}</span>
                </button>
                <a
                  href="tel:+18595371827"
                  className="h-8 px-3 rounded-full bg-[#f5f3f3] hover:bg-[#e3e2e2] text-black text-xs font-medium border border-neutral-200 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">call</span>
                  <span>Call Dispatch</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
