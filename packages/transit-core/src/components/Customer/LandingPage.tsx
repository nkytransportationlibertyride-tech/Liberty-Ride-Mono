/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Liberty Ride NKY - Public Desktop Landing Page
 */

import React, { useState } from 'react';
import { useTransit } from '../../context/TransitContext';
import {
  calculateGuaranteedFare,
  ServiceCategory,
  formatUSPhone,
} from '../../utils/transit';
import { FARE_ZONES_CONFIG } from '../../data/mockData';

export const LandingPage: React.FC = () => {
  const { setRole, createNewRide, setRiderTab } = useTransit();

  // Fare calculator form state
  const [pickup, setPickup] = useState('3038 Dixie Hwy, Erlanger, KY 41018');
  const [dropoff, setDropoff] = useState('CVG Airport Terminal 3, Hebron, KY 41048');
  const [pickupDate, setPickupDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [pickupTime, setPickupTime] = useState('08:30');
  const [category, setCategory] = useState<ServiceCategory>('cvg');
  const [notes, setNotes] = useState('');
  const [phone, setPhone] = useState('(859) 555-0142');

  const [bookingConfirmed, setBookingConfirmed] = useState<string | null>(null);

  // Live calculation
  const fareResult = calculateGuaranteedFare(pickup, dropoff, category);

  const handleQuickPickup = (addr: string) => setPickup(addr);
  const handleQuickDropoff = (addr: string) => setDropoff(addr);

  const handleBookDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    const newRide = createNewRide({
      pickup,
      dropoff,
      pickupDate,
      pickupTime: `Today, ${pickupTime} EDT`,
      category,
      fareEstimate: fareResult.totalFare,
      baseFare: fareResult.baseFare,
      meteredRate: fareResult.meteredDistanceRate,
      distanceMiles: fareResult.distanceMiles,
      estimatedMinutes: fareResult.estimatedMinutes,
      zone: fareResult.zone,
      notes,
      riderPhone: phone,
      riderName: 'Web Booking Passenger',
    });

    setBookingConfirmed(newRide.id);
  };

  const jumpToRiderApp = () => {
    setRole('rider');
    setRiderTab('tracking');
  };

  return (
    <div className="min-h-screen bg-[#fbf9f9] text-[#1b1c1c] flex flex-col font-sans">
      {/* Primary Brand Navigation Header */}
      <header className="sticky top-11 left-0 w-full z-40 bg-[#fbf9f9]/95 backdrop-blur-md border-b border-neutral-200/60 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
        <div className="h-20 max-w-[1280px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <a href="#" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
                <span className="material-symbols-outlined text-[22px]">local_taxi</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-black tracking-tight leading-tight">LIBERTY RIDE</span>
                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">NKY Transit</span>
              </div>
            </a>

            <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-neutral-600">
              <a href="#estimator" className="hover:text-black hover:bg-neutral-100 px-3 py-1.5 rounded-full transition-colors">
                Fare Estimator
              </a>
              <a href="#zones" className="hover:text-black hover:bg-neutral-100 px-3 py-1.5 rounded-full transition-colors">
                Flat Zones
              </a>
              <a href="#airport" className="hover:text-black hover:bg-neutral-100 px-3 py-1.5 rounded-full transition-colors">
                Airport CVG
              </a>
              <a href="#medical" className="hover:text-black hover:bg-neutral-100 px-3 py-1.5 rounded-full transition-colors">
                Medical
              </a>
              <a href="#dispatch" className="hover:text-black hover:bg-neutral-100 px-3 py-1.5 rounded-full transition-colors">
                About Dispatch
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="tel:+18595371827"
              className="flex items-center gap-2 bg-[#efeded] hover:bg-[#e3e2e2] transition-colors px-4 py-2.5 rounded-full text-black text-sm font-semibold shadow-xs"
            >
              <span className="material-symbols-outlined text-[#006d37] text-[18px]">call</span>
              <span className="hidden sm:inline">+1 (859) 537-1827</span>
              <span className="sm:hidden">Call</span>
            </a>

            <button
              onClick={() => {
                setRole('rider');
                setRiderTab('ride');
              }}
              className="bg-black hover:bg-neutral-800 text-white transition-colors px-5 py-2.5 rounded-full text-sm font-bold shadow-sm flex items-center gap-1.5"
            >
              <span>Book Dispatch</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="w-full flex-1">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8">
          {/* Hero & Interactive Calculator Section */}
          <section className="relative w-full py-6 md:py-10" id="estimator">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
              {/* Left Column: Brand Statement & Authority Metrics */}
              <div className="lg:col-span-7 flex flex-col space-y-6">
                {/* Active Dispatch Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#efeded] w-fit shadow-xs border border-neutral-200/50">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#06C167] animate-pulse"></span>
                  <span className="text-[11px] font-bold text-black uppercase tracking-wider">
                    Erlanger Fleet Active • Live Dispatch Desk
                  </span>
                </div>

                <div className="space-y-4">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-black tracking-tight leading-[1.12]">
                    Reliable Local Transit Across Northern Kentucky & CVG Airport
                  </h1>
                  <p className="text-base sm:text-lg text-neutral-600 max-w-2xl leading-relaxed">
                    Direct, guaranteed upfront pricing with strict zero-surge tariffs. Stationed directly in Erlanger, KY for immediate local dispatch, non-emergency medical routes, and prompt Cincinnati/Northern Kentucky International Airport transfers.
                  </p>
                </div>

                {/* Key Pillars */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#efeded] text-xs font-semibold text-neutral-800">
                    <span className="material-symbols-outlined text-[16px] text-[#006d37]">verified</span>
                    Guaranteed Pricing
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#efeded] text-xs font-semibold text-neutral-800">
                    <span className="material-symbols-outlined text-[16px] text-[#006d37]">trending_down</span>
                    No Surge Tariffs
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#efeded] text-xs font-semibold text-neutral-800">
                    <span className="material-symbols-outlined text-[16px] text-[#006d37]">flight</span>
                    CVG Flight Monitoring
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#efeded] text-xs font-semibold text-neutral-800">
                    <span className="material-symbols-outlined text-[16px] text-[#006d37]">medical_services</span>
                    Medical Transport Assistance
                  </span>
                </div>

                {/* Direct Hotline CTA Row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                  <a
                    href="tel:+18595371827"
                    className="h-[52px] px-6 rounded-full bg-black hover:bg-neutral-800 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
                  >
                    <span className="material-symbols-outlined text-[20px]">call</span>
                    <span>Call Hotline: +1 (859) 537-1827</span>
                  </a>
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#f5f3f3] text-neutral-600 text-xs font-medium border border-neutral-200/50">
                    <span className="material-symbols-outlined text-[18px] text-black">schedule</span>
                    <span>24/7 Priority Operators • Eastern Time (EDT)</span>
                  </div>
                </div>

                {/* 3 Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                  <div className="p-4 rounded-xl bg-[#f5f3f3] shadow-xs border border-neutral-200/40">
                    <span className="text-2xl font-bold text-black block tabular-nums">0%</span>
                    <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mt-1">
                      Surge Multiplier
                    </span>
                    <span className="text-xs text-neutral-600 mt-1 block">
                      Fixed contract tariffs across regional zones
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#f5f3f3] shadow-xs border border-neutral-200/40">
                    <span className="text-2xl font-bold text-black block tabular-nums">&lt; 8 min</span>
                    <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mt-1">
                      Erlanger Dispatch ETA
                    </span>
                    <span className="text-xs text-neutral-600 mt-1 block">
                      Dixie Hwy & I-71/I-75 arterial coverage
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#f5f3f3] shadow-xs border border-neutral-200/40">
                    <span className="text-2xl font-bold text-black block tabular-nums">100%</span>
                    <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mt-1">
                      Licensed Transit
                    </span>
                    <span className="text-xs text-neutral-600 mt-1 block">
                      Liberty Ride NKY Trans, LLC authority
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Instant Fare Calculator Widget */}
              <div className="lg:col-span-5 lg:sticky lg:top-36">
                <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xl border border-neutral-200/70 relative overflow-hidden">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                    <div>
                      <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest block">
                        Instant Fare Calculator
                      </span>
                      <h2 className="text-xl font-bold text-black mt-0.5">Get a Guaranteed Estimate</h2>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[#efeded] text-[#006d37] text-xs font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#06C167]"></span>
                      Active
                    </span>
                  </div>

                  {bookingConfirmed ? (
                    <div className="mt-5 p-5 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-emerald-800 font-bold">
                        <span className="material-symbols-outlined text-[24px]">verified</span>
                        <span>Dispatch Request Confirmed!</span>
                      </div>
                      <p className="text-xs text-emerald-900 leading-relaxed">
                        Your booking reference <strong>#{bookingConfirmed}</strong> has been created with a guaranteed locked rate of <strong>${fareResult.totalFare.toFixed(2)}</strong>. Dispatch is alerting available vehicles in Erlanger.
                      </p>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={jumpToRiderApp}
                          className="flex-1 py-2.5 px-4 rounded-full bg-black text-white text-xs font-bold hover:bg-neutral-800 transition-colors"
                        >
                          View in Rider Tracker
                        </button>
                        <button
                          onClick={() => setBookingConfirmed(null)}
                          className="py-2.5 px-4 rounded-full bg-white text-neutral-700 text-xs font-medium border border-neutral-300 hover:bg-neutral-50 transition-colors"
                        >
                          New Quote
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form className="space-y-4 mt-4" onSubmit={handleBookDispatch}>
                      {/* Pickup Address */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-black inline-block"></span>
                          Pickup Address (NKY Region)
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            value={pickup}
                            onChange={(e) => setPickup(e.target.value)}
                            placeholder="Enter pickup address or landmark"
                            required
                            className="w-full h-11 pl-4 pr-4 rounded-xl bg-[#f5f3f3] text-black text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-black border border-transparent transition-all"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
                          <button
                            type="button"
                            onClick={() => handleQuickPickup('3038 Dixie Hwy, Erlanger, KY 41018')}
                            className="px-2.5 py-1 rounded-full bg-[#efeded] hover:bg-[#e3e2e2] text-black text-[11px] font-semibold whitespace-nowrap transition-colors"
                          >
                            Dixie Hwy Hub
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickPickup('Crestview Hills Town Center, KY 41017')}
                            className="px-2.5 py-1 rounded-full bg-[#efeded] hover:bg-[#e3e2e2] text-black text-[11px] font-semibold whitespace-nowrap transition-colors"
                          >
                            Crestview Hills
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickPickup('Florence Mall, Florence, KY 41042')}
                            className="px-2.5 py-1 rounded-full bg-[#efeded] hover:bg-[#e3e2e2] text-black text-[11px] font-semibold whitespace-nowrap transition-colors"
                          >
                            Florence Core
                          </button>
                        </div>
                      </div>

                      {/* Dropoff Destination */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-black inline-block"></span>
                          Dropoff Destination
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            value={dropoff}
                            onChange={(e) => setDropoff(e.target.value)}
                            placeholder="Destination, clinic, or airport"
                            required
                            className="w-full h-11 pl-4 pr-4 rounded-xl bg-[#f5f3f3] text-black text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-black border border-transparent transition-all"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
                          <button
                            type="button"
                            onClick={() => handleQuickDropoff('CVG Airport Terminal 3, Hebron, KY 41048')}
                            className="px-2.5 py-1 rounded-full bg-[#efeded] hover:bg-[#e3e2e2] text-black text-[11px] font-semibold whitespace-nowrap transition-colors"
                          >
                            CVG Airport Terminal
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickDropoff('St. Elizabeth Healthcare, Edgewood, KY 41017')}
                            className="px-2.5 py-1 rounded-full bg-[#efeded] hover:bg-[#e3e2e2] text-black text-[11px] font-semibold whitespace-nowrap transition-colors"
                          >
                            St. Elizabeth Edgewood
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickDropoff('Downtown Cincinnati, Fountain Square, OH 45202')}
                            className="px-2.5 py-1 rounded-full bg-[#efeded] hover:bg-[#e3e2e2] text-black text-[11px] font-semibold whitespace-nowrap transition-colors"
                          >
                            Downtown Cincy
                          </button>
                        </div>
                      </div>

                      {/* Date & Time Row */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-neutral-700 block">Pickup Date</label>
                          <input
                            type="date"
                            value={pickupDate}
                            onChange={(e) => setPickupDate(e.target.value)}
                            className="w-full h-10 px-3 rounded-xl bg-[#f5f3f3] text-black text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-black border border-transparent"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-neutral-700 block">Time (Eastern EDT)</label>
                          <input
                            type="time"
                            value={pickupTime}
                            onChange={(e) => setPickupTime(e.target.value)}
                            className="w-full h-10 px-3 rounded-xl bg-[#f5f3f3] text-black text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-black border border-transparent"
                          />
                        </div>
                      </div>

                      {/* Service Category Selection */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-neutral-700 block">Service Category</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'cvg', label: 'Airport CVG', icon: 'flight_takeoff' },
                            { id: 'medical', label: 'Medical / Clinic', icon: 'local_hospital' },
                            { id: 'business', label: 'Business Transfer', icon: 'business_center' },
                            { id: 'local', label: 'Local Taxi Core', icon: 'local_taxi' },
                          ].map((item) => {
                            const isSelected = category === item.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => setCategory(item.id as ServiceCategory)}
                                className={`p-2.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-all ${
                                  isSelected
                                    ? 'bg-black text-white shadow-xs'
                                    : 'bg-[#efeded] text-neutral-800 hover:bg-[#e3e2e2]'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[17px]">{item.icon}</span>
                                <span className="truncate">{item.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Contact Phone & Notes */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-neutral-700 block">Contact Phone</label>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(formatUSPhone(e.target.value))}
                            placeholder="(859) 000-0000"
                            required
                            className="w-full h-10 px-3 rounded-xl bg-[#f5f3f3] text-black text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-black border border-transparent"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-neutral-700 block">Assistance / Luggage</label>
                          <input
                            type="text"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Luggage, folding walker, etc."
                            className="w-full h-10 px-3 rounded-xl bg-[#f5f3f3] text-black text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-black border border-transparent"
                          />
                        </div>
                      </div>

                      {/* Guaranteed Fare Preview Card */}
                      <div className="p-4 rounded-xl bg-[#f5f3f3] flex items-center justify-between border border-neutral-200/50">
                        <div>
                          <span className="text-[11px] font-bold text-neutral-500 block uppercase tracking-wider">
                            Guaranteed Flat Tariff
                          </span>
                          <span className="text-2xl font-bold text-black tabular-nums">
                            ${fareResult.totalFare.toFixed(2)}
                            {fareResult.isFlat ? ' Flat' : ''}
                          </span>
                          <span className="text-xs font-semibold text-[#006d37] block mt-0.5">
                            {fareResult.summaryText}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-bold text-neutral-500 block uppercase tracking-wider">
                            Dispatch Horizon
                          </span>
                          <span className="text-sm font-bold text-black block">Immediate / Pre-book</span>
                          <span className="text-xs text-neutral-500 block">No peak surcharges</span>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        className="w-full h-[52px] rounded-full bg-black hover:bg-neutral-800 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.99]"
                      >
                        <span>Calculate & Lock Guaranteed Fare</span>
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </button>

                      <p className="text-[11px] text-neutral-500 text-center leading-tight">
                        Quotes only — booking confirmed in next step with direct dispatcher assignment.
                      </p>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Fixed Rate Transit Matrix Section */}
          <section className="py-12 border-t border-neutral-200/60" id="zones">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest block">
                  Transparent Zone Tariffs
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-black mt-1">
                  Fixed Rate Transit Matrix
                </h2>
              </div>
              <p className="text-sm text-neutral-600 max-w-md">
                Predictable commercial transport with no volatile algorithm surges during severe weather, rush hour, or airport delays.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {FARE_ZONES_CONFIG.map((z, idx) => (
                <div
                  key={z.zoneId}
                  className="rounded-2xl p-6 bg-white border border-neutral-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full bg-[#efeded] text-[11px] font-bold text-black uppercase">
                        {z.shortName}
                      </span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#06C167]"></span>
                    </div>
                    <h3 className="text-base font-bold text-black leading-snug">{z.name}</h3>
                    <p className="text-xs text-neutral-600 leading-relaxed">{z.description}</p>
                  </div>

                  <div className="pt-6 mt-4 border-t border-neutral-100">
                    <span className="text-[11px] font-bold text-neutral-400 block uppercase tracking-wider">
                      {idx < 2 ? 'Guaranteed Flat' : 'Base Meter Tariff'}
                    </span>
                    <span className="text-2xl font-extrabold text-black block mt-0.5 tabular-nums">
                      {z.rate.split(' ')[0]}
                    </span>
                    <span className="text-xs text-neutral-500 block mt-1">{z.details}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* How Liberty Ride Works Section */}
          <section className="py-12 border-t border-neutral-200/60" id="dispatch">
            <div className="rounded-2xl bg-white border border-neutral-200/80 p-6 md:p-10 shadow-xs">
              <div className="max-w-2xl mb-8">
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest block">
                  Operational Workflow
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-black mt-1">How Liberty Ride Works</h2>
                <p className="text-sm text-neutral-600 mt-1">
                  A frictionless, phone-supported dispatch system designed for reliability without battery-draining apps.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-black text-white font-bold text-sm flex items-center justify-center shrink-0">
                      1
                    </span>
                    <span className="font-bold text-black text-base">Instant Upfront Estimate</span>
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Select your corridor and receive a locked-in price quote before departure. No dynamic peak multipliers or unexpected bridge/traffic delay additions.
                  </p>
                  <div className="p-2.5 rounded-lg bg-[#f5f3f3] text-[11px] font-semibold text-neutral-800">
                    Guaranteed rate lock upon verification
                  </div>
                </div>

                <div className="flex flex-col space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-black text-white font-bold text-sm flex items-center justify-center shrink-0">
                      2
                    </span>
                    <span className="font-bold text-black text-base">Dispatch Confirmation</span>
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Our local desk assigns an Erlanger-based commercial vehicle immediately and generates a clean UUID transit record logged to our regional dispatch ledger.
                  </p>
                  <div className="p-2.5 rounded-lg bg-[#f5f3f3] text-[11px] font-semibold text-neutral-800">
                    Secure UUID tracking & verified operator name
                  </div>
                </div>

                <div className="flex flex-col space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-black text-white font-bold text-sm flex items-center justify-center shrink-0">
                      3
                    </span>
                    <span className="font-bold text-black text-base">Direct Status Updates</span>
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Receive direct SMS alerts and telephone coordination with your dedicated driver. Zero background GPS data drain or mandatory software installations.
                  </p>
                  <div className="p-2.5 rounded-lg bg-[#f5f3f3] text-[11px] font-semibold text-neutral-800">
                    Direct driver telephone link & SMS arrival pings
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2 Detailed Offerings: CVG Airport & St. Elizabeth Medical */}
          <section className="py-12 border-t border-neutral-200/60" id="airport">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: CVG Airport */}
              <div className="rounded-2xl bg-white p-6 sm:p-8 border border-neutral-200/80 shadow-xs flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-black text-white flex items-center justify-center">
                      <span className="material-symbols-outlined text-[24px]">flight_land</span>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-[#efeded] text-[#006d37] text-xs font-bold">
                      CVG Operations
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-black">CVG Airport Flight Tracking & Terminal Transfers</h3>
                    <p className="text-xs sm:text-sm text-neutral-600 mt-2 leading-relaxed">
                      We monitor inbound commercial airline schedules into CVG in real time. If your Delta, American, Allegiant, or United flight arrives ahead of schedule or faces tarmac delays, your pickup time adjusts automatically with zero wait fees.
                    </p>
                  </div>

                  <ul className="space-y-2 text-xs text-neutral-700">
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#006d37] text-[18px]">check_circle</span>
                      <span>Direct curbside baggage claim contact point (Door 5 Commercial Lane)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#006d37] text-[18px]">check_circle</span>
                      <span>Luggage loading and heavy equipment assistance included</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#006d37] text-[18px]">check_circle</span>
                      <span>Receipts formatted for corporate expense filing</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6 mt-6 border-t border-neutral-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setRole('rider');
                      setRiderTab('airport-cvg');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-black hover:underline"
                  >
                    <span>Coordinate an Airport Dispatch</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                  <span className="text-sm font-extrabold text-black tabular-nums">$35.00 Flat</span>
                </div>
              </div>

              {/* Card 2: St. Elizabeth Medical */}
              <div className="rounded-2xl bg-white p-6 sm:p-8 border border-neutral-200/80 shadow-xs flex flex-col justify-between" id="medical">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-black text-white flex items-center justify-center">
                      <span className="material-symbols-outlined text-[24px]">accessible</span>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-[#efeded] text-[#006d37] text-xs font-bold">
                      Healthcare Mobility
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-black">St. Elizabeth Non-Emergency Medical Transport</h3>
                    <p className="text-xs sm:text-sm text-neutral-600 mt-2 leading-relaxed">
                      Dependable transportation for clinic checkups, therapy, outpatient surgery, and rehabilitation centers across Northern Kentucky. Drivers provide patient-level attentiveness and door-to-door escort assistance.
                    </p>
                  </div>

                  <ul className="space-y-2 text-xs text-neutral-700">
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#006d37] text-[18px]">check_circle</span>
                      <span>Wheelchair and folding mobility walker stowage</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#006d37] text-[18px]">check_circle</span>
                      <span>Scheduled multi-leg appointments with standby options</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#006d37] text-[18px]">check_circle</span>
                      <span>Quiet, climate-controlled cabins for convalescent riders</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6 mt-6 border-t border-neutral-100 flex items-center justify-between">
                  <a
                    href="tel:+18595371827"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-black hover:underline"
                  >
                    <span>Book Clinic Transit Directly</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </a>
                  <span className="text-sm font-extrabold text-black tabular-nums">$20.00 Base</span>
                </div>
              </div>
            </div>
          </section>

          {/* Immediate Kentucky Dispatch Call Banner */}
          <section className="py-8">
            <div className="rounded-2xl bg-black text-white p-6 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="space-y-2 text-center lg:text-left">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest block">
                  Immediate Kentucky Dispatch
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Need Immediate Transit or Dispatch Questions?
                </h2>
                <p className="text-xs sm:text-sm text-neutral-300 max-w-xl">
                  Call our local Erlanger desk directly at <span className="text-white font-bold">+1 (859) 537-1827</span>. Speak to a live dispatcher stationed right here in Northern Kentucky.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                <a
                  href="tel:+18595371827"
                  className="w-full sm:w-auto h-[52px] px-8 rounded-full bg-white text-black hover:bg-neutral-100 font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
                >
                  <span className="material-symbols-outlined text-[20px]">call</span>
                  <span>+1 (859) 537-1827</span>
                </a>
                <button
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="w-full sm:w-auto h-[52px] px-6 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Quote Online</span>
                  <span className="material-symbols-outlined text-[16px]">north</span>
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Comprehensive Footer */}
      <footer className="w-full bg-[#f5f3f3] border-t border-neutral-200/80 mt-auto">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[16px]">local_taxi</span>
                </div>
                <span className="font-bold text-base text-black tracking-tight">LIBERTY RIDE</span>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Precision on-demand mobility, flat-rate airport transfers, and non-emergency medical transit across Northern Kentucky.
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#006d37] text-[11px] font-bold border border-neutral-200/60">
                <span className="w-2 h-2 rounded-full bg-[#006d37]"></span>
                <span>OPERATIONAL • EASTERN TIME</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-black uppercase tracking-wider block">Service Zones</span>
              <ul className="space-y-1.5 text-xs text-neutral-600">
                <li>Erlanger City Core</li>
                <li>Cincinnati/NKY Airport (CVG)</li>
                <li>Florence & Crestview Hills</li>
                <li>Greater Cincinnati Metro</li>
                <li>St. Elizabeth Healthcare Sites</li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-black uppercase tracking-wider block">Dispatch Access</span>
              <ul className="space-y-1.5 text-xs text-neutral-600">
                <li>
                  <a href="tel:+18595371827" className="hover:text-black transition-colors flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">call</span>
                    <span>+1 (859) 537-1827</span>
                  </a>
                </li>
                <li>Dispatch Desk: 24/7 Priority</li>
                <li>Operating Base: Erlanger, KY</li>
                <li>Schedule Horizon: Real-time & Pre-booked</li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-black uppercase tracking-wider block">Legal & Authority</span>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Registered regional commercial operator:
                <strong className="text-black block mt-1">Liberty Ride NKY Trans, LLC</strong>
                Operating within local, state, and airport authority transit regulations.
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-neutral-200/60 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
            <span>© 2026 Liberty Ride NKY Trans, LLC. All rights reserved. Erlanger, KY Operating Perimeter.</span>
            <div className="flex items-center gap-4">
              <span className="text-[11px] uppercase tracking-wider">KY Regional Carrier</span>
              <a href="tel:+18595371827" className="text-black font-semibold hover:underline">
                Hotline: +1 (859) 537-1827
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
