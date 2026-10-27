/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Rider Mobile App - Ride Booking & Estimate View
 */

import React, { useState } from 'react';
import { useTransit } from '../../context/TransitContext';
import {
  calculateGuaranteedFare,
  ServiceCategory,
  formatUSPhone,
  matchNKYLocation,
  validateScheduledPickup,
  formatScheduledDateTime,
  formatEasternTime,
} from '../../utils/transit';

export const RideBookingView: React.FC = () => {
  const { setRiderTab, createNewRide } = useTransit();

  const todayISO = new Date().toISOString().split('T')[0];
  const [pickup, setPickup] = useState('3038 Dixie Hwy, Erlanger, KY 41018');
  const [dropoff, setDropoff] = useState('St. Elizabeth Healthcare, Edgewood, KY 41017');
  const [isScheduledMode, setIsScheduledMode] = useState(false);
  const [pickupDate, setPickupDate] = useState(() => todayISO);
  const [pickupTime, setPickupTime] = useState('04:30 PM');
  const [category, setCategory] = useState<ServiceCategory>('medical');
  const [phone, setPhone] = useState('(859) 555-0142');
  const [notes, setNotes] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const verifiedSuggestions = [
    {
      title: '3038 Dixie Hwy',
      subtitle: 'Erlanger, KY 41018 • Central Corridor',
      fullAddress: '3038 Dixie Hwy, Erlanger, KY 41018',
      icon: 'location_on',
    },
    {
      title: 'CVG Main Terminal Baggage Claim',
      subtitle: '3087 Terminal Dr, Hebron, KY 41048',
      fullAddress: 'CVG Airport Terminal 3, Hebron, KY 41048',
      icon: 'flight',
    },
    {
      title: 'Crestview Hills Town Center',
      subtitle: '2791 Town Center Blvd, Crestview Hills, KY 41017',
      fullAddress: 'Crestview Hills Town Center, KY 41017',
      icon: 'domain',
    },
    {
      title: 'St. Elizabeth Healthcare',
      subtitle: '1 Medical Village Dr, Edgewood, KY 41017',
      fullAddress: 'St. Elizabeth Healthcare, Edgewood, KY 41017',
      icon: 'local_hospital',
    },
  ];

  const handleSelectSuggestion = (fullAddress: string) => {
    setPickup(fullAddress);
    setShowSuggestions(false);
  };

  const handleGetEstimate = () => {
    if (!pickup.trim() || !dropoff.trim()) {
      setErrorBanner('Please provide both pickup and destination locations.');
      return;
    }

    if (pickup.trim().toLowerCase() === dropoff.trim().toLowerCase()) {
      setErrorBanner('Pickup and dropoff must differ • No past booking dates permitted');
      return;
    }

    if (isScheduledMode) {
      const scheduleValidation = validateScheduledPickup(pickupDate, pickupTime);
      if (!scheduleValidation.valid) {
        setErrorBanner(scheduleValidation.error || 'Pickup date and time cannot be in the past');
        return;
      }
    }

    setErrorBanner(null);

    const calc = calculateGuaranteedFare(pickup, dropoff, category);

    // Create or prepare ride draft
    createNewRide({
      pickup,
      dropoff,
      category,
      pickupDate,
      pickupTime,
      isScheduled: isScheduledMode,
      scheduledFor: isScheduledMode ? formatScheduledDateTime(pickupDate, pickupTime) : undefined,
      riderPhone: phone,
      notes,
      fareEstimate: calc.totalFare,
      baseFare: calc.baseFare,
      meteredRate: calc.meteredDistanceRate,
      distanceMiles: calc.distanceMiles,
      estimatedMinutes: calc.estimatedMinutes,
      zone: calc.zone,
    });

    setRiderTab('quote');
  };

  return (
    <div className="flex flex-col w-full pb-8">
      {/* Interactive Styled Map Canvas Area */}
      <div className="relative w-full h-64 rounded-2xl overflow-hidden shadow-sm bg-[#e9e8e7] border border-neutral-200">
        <div
          className="w-full h-full bg-cover bg-center relative"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCKCNuKby1J0mJn8XosYhoIEZPBafsIdwxUVoFJ2v9kJBSIglOg4Ub-cskcn8ZQeRvw0oOiQfXgtJvED9W84AUcnAW6l_5_0nv8DHxug3xkI1P2K-uoDvT_LOtugbfhYAn9IBXUhefH2uaKU-Y9xElDeaHlXrAfxsX5Glsn7bE6b_UewPkilfMhjFWKnD6RldGIzpsL0RKiY1f1550BkgxdYA4EU834MuNb66oeaDK8J69pNRzfWxw-')",
          }}
        >
          {/* Stylized Vector Route Canvas Overlay */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 360 256">
            <path
              d="M 88 160 C 130 150, 160 120, 195 110 C 230 100, 255 75, 276 65"
              stroke="#000000"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 88 160 C 130 150, 160 120, 195 110 C 230 100, 255 75, 276 65"
              stroke="#66fe9c"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </svg>

          {/* Pin A: Pickup (Dixie Hwy, Erlanger) */}
          <div className="absolute left-[88px] top-[140px] -translate-x-1/2 -translate-y-full flex flex-col items-center z-10">
            <div className="bg-white px-2 py-0.5 rounded shadow-md flex items-center gap-1 mb-1 border border-neutral-200">
              <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
              <span className="text-[10px] text-black font-bold uppercase tracking-tight">Dixie Hwy</span>
            </div>
            <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center shadow-lg ring-2 ring-white text-xs font-bold">
              A
            </div>
          </div>

          {/* Pin B: Dropoff (St. Elizabeth Healthcare) */}
          <div className="absolute left-[276px] top-[65px] -translate-x-1/2 -translate-y-full flex flex-col items-center z-10">
            <div className="bg-white px-2 py-0.5 rounded shadow-md flex items-center gap-1 mb-1 border border-neutral-200">
              <span className="w-1.5 h-1.5 rounded-full bg-[#006d37]"></span>
              <span className="text-[10px] text-black font-bold uppercase tracking-tight">St. Elizabeth</span>
            </div>
            <div className="w-7 h-7 rounded-full bg-[#006d37] text-white flex items-center justify-center shadow-lg ring-2 ring-white text-xs font-bold">
              B
            </div>
          </div>

          {/* Floating Utility Controls */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-20">
            <button
              type="button"
              onClick={() => alert('Corridor centered: Erlanger & Edgewood Hub')}
              className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center shadow-md active:scale-95 transition-transform"
              aria-label="Center transit corridor"
            >
              <span className="material-symbols-outlined text-[18px]">my_location</span>
            </button>
            <button
              type="button"
              onClick={() => alert('Traffic layer: Optimal flow along Dixie Hwy & I-275 E')}
              className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center shadow-md active:scale-95 transition-transform"
              aria-label="Toggle corridor traffic layers"
            >
              <span className="material-symbols-outlined text-[18px]">layers</span>
            </button>
          </div>

          {/* Verified Corridor Badge */}
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1.5 z-20 border border-neutral-200">
            <span className="w-2 h-2 rounded-full bg-[#006d37]"></span>
            <span className="text-[11px] text-black font-bold tracking-tight">Erlanger – Edgewood Hub</span>
          </div>

          <div className="absolute bottom-1 right-2 bg-white/80 px-1.5 py-0.5 rounded text-[9px] text-neutral-500 z-10">
            © OpenStreetMap contributors
          </div>
        </div>
      </div>

      {/* Booking Form Sheet */}
      <div className="relative w-full bg-white rounded-2xl p-5 shadow-lg -mt-3 z-30 flex flex-col gap-4 border border-neutral-200">
        {/* Header Block */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold text-black tracking-tight">Get a Ride Estimate</h1>
            <div className="h-6 px-2.5 rounded-full bg-[#efeded] flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-neutral-600">shield</span>
              <span className="text-[10px] font-bold text-neutral-700 uppercase">Fixed Quote</span>
            </div>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">Quotes only — booking confirmed in next step</p>
        </div>

        {/* Origin & Destination Inputs */}
        <div className="flex flex-col gap-3 relative">
          {/* Pickup */}
          <div className="relative flex flex-col">
            <label className="text-[11px] font-bold text-black uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-black inline-block"></span>
              Pickup Address
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined text-[18px] absolute left-3.5 text-black pointer-events-none">
                radio_button_checked
              </span>
              <input
                type="text"
                value={pickup}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => setPickup(e.target.value)}
                placeholder="Search pickup location in NKY corridor"
                className="w-full bg-[#efeded] text-black text-sm pl-10 pr-9 py-2.5 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-black transition-colors"
              />
              {pickup && (
                <button
                  type="button"
                  onClick={() => setPickup('')}
                  className="absolute right-3 text-neutral-400 hover:text-black p-0.5"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && (
              <div className="mt-1.5 w-full bg-[#f5f3f3] rounded-xl p-1.5 shadow-lg border border-neutral-200 z-40 flex flex-col">
                <div className="px-2 py-1 text-neutral-500 text-[10px] font-bold uppercase flex items-center justify-between">
                  <span>Verified NKY Addresses</span>
                  <button
                    type="button"
                    onClick={() => setShowSuggestions(false)}
                    className="text-neutral-400 hover:text-black"
                  >
                    Close
                  </button>
                </div>
                {verifiedSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(item.fullAddress)}
                    className="w-full text-left p-2 rounded-lg hover:bg-white flex items-center gap-2.5 transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#e3e2e2] flex items-center justify-center shrink-0 text-black">
                      <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-black truncate">{item.title}</span>
                      <span className="text-[11px] text-neutral-500 truncate">{item.subtitle}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dropoff */}
          <div className="relative flex flex-col">
            <label className="text-[11px] font-bold text-black uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-[#006d37] inline-block"></span>
              Dropoff Destination
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined text-[18px] absolute left-3.5 text-[#006d37] pointer-events-none">
                location_on
              </span>
              <input
                type="text"
                value={dropoff}
                onChange={(e) => setDropoff(e.target.value)}
                placeholder="Hospital, clinic, or regional address"
                className="w-full bg-[#efeded] text-black text-sm pl-10 pr-9 py-2.5 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-black transition-colors"
              />
              {dropoff && (
                <button
                  type="button"
                  onClick={() => setDropoff('')}
                  className="absolute right-3 text-neutral-400 hover:text-black p-0.5"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Pickup Schedule & Future Ride Scheduler */}
        <div className="flex flex-col gap-2 bg-[#f5f3f3] p-3 rounded-2xl border border-neutral-200/80">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-black uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-neutral-700">schedule</span>
              Pickup Schedule
            </label>
            <span className="text-[10px] text-neutral-600 bg-white px-2 py-0.5 rounded-full font-bold border border-neutral-200">
              America/New_York (ET)
            </span>
          </div>

          {/* Mode Switcher: Immediate vs Schedule for Later */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-white rounded-xl border border-neutral-200">
            <button
              type="button"
              onClick={() => {
                setIsScheduledMode(false);
                setPickupDate(todayISO);
                setPickupTime('Immediate (< 8 min)');
              }}
              className={`h-9 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                !isScheduledMode
                  ? 'bg-black text-white shadow-xs'
                  : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">bolt</span>
              <span>Ride Now</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsScheduledMode(true);
                if (pickupTime.includes('Immediate')) {
                  setPickupTime('04:30 PM');
                }
              }}
              className={`h-9 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                isScheduledMode
                  ? 'bg-black text-white shadow-xs'
                  : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">event</span>
              <span>Schedule Later</span>
            </button>
          </div>

          {/* Immediate Dispatch Note */}
          {!isScheduledMode && (
            <div className="flex items-center justify-between px-2 py-1 text-xs text-neutral-600">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#06C167] animate-pulse"></span>
                <span>Immediate dispatch • Erlanger base active</span>
              </div>
              <span className="font-bold text-black">&lt; 8 min ETA</span>
            </div>
          )}

          {/* Scheduled Future Ride Picker */}
          {isScheduledMode && (
            <div className="flex flex-col gap-2.5 pt-1">
              {/* Date & Time Input Boxes */}
              <div className="grid grid-cols-2 gap-2">
                {/* Date Input */}
                <div className="bg-white rounded-xl p-2.5 border border-neutral-200 flex flex-col gap-1 shadow-xs">
                  <span className="text-[10px] text-neutral-500 uppercase font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                    Pickup Date
                  </span>
                  <input
                    type="date"
                    min={todayISO}
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="bg-transparent text-xs font-bold text-black outline-none w-full cursor-pointer"
                  />
                </div>

                {/* Time Input */}
                <div className="bg-white rounded-xl p-2.5 border border-neutral-200 flex flex-col gap-1 shadow-xs">
                  <span className="text-[10px] text-neutral-500 uppercase font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">alarm</span>
                    Pickup Window (ET)
                  </span>
                  <input
                    type="text"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    placeholder="e.g. 04:30 PM"
                    className="bg-transparent text-xs font-bold text-black outline-none w-full"
                  />
                </div>
              </div>

              {/* Quick Date Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {[
                  { label: 'Today', days: 0 },
                  { label: 'Tomorrow', days: 1 },
                  { label: '+2 Days', days: 2 },
                  { label: '+3 Days', days: 3 },
                  { label: '+1 Week', days: 7 },
                ].map((chip) => {
                  const targetDate = new Date();
                  targetDate.setDate(targetDate.getDate() + chip.days);
                  const iso = targetDate.toISOString().split('T')[0];
                  const isSelected = pickupDate === iso;

                  return (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => setPickupDate(iso)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors ${
                        isSelected
                          ? 'bg-black text-white'
                          : 'bg-white hover:bg-neutral-200 text-neutral-700 border border-neutral-200'
                      }`}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>

              {/* Quick Time Window Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {['08:00 AM', '10:30 AM', '12:30 PM', '04:30 PM', '07:30 PM'].map((time) => {
                  const isSelected = pickupTime.startsWith(time);
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setPickupTime(`${time} EDT`)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors ${
                        isSelected
                          ? 'bg-black text-white'
                          : 'bg-white hover:bg-neutral-200 text-neutral-700 border border-neutral-200'
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>

              {/* Scheduled Pre-booking Guarantee Badge */}
              <div className="flex items-start gap-2 bg-[#e9e8e7]/60 p-2 rounded-xl text-neutral-700 text-xs">
                <span className="material-symbols-outlined text-[16px] text-[#006d37] shrink-0 mt-0.5">
                  verified
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-black text-[11px]">
                    Guaranteed Future Dispatch Lock
                  </span>
                  <span className="text-[10px] text-neutral-500 leading-tight mt-0.5">
                    Your driver is assigned 30 minutes before your window with locked upfront tariff.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Service Category (4 Pills) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-black uppercase tracking-wider">Service Category</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'cvg', label: 'Airport CVG', icon: 'flight' },
              { id: 'medical', label: 'Medical / Hospital', icon: 'local_hospital' },
              { id: 'business', label: 'Business', icon: 'work' },
              { id: 'local', label: 'Local taxi', icon: 'directions_car' },
            ].map((cat) => {
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id as ServiceCategory)}
                  className={`h-11 px-3 rounded-full flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-black text-white shadow-sm'
                      : 'bg-[#efeded] text-neutral-800 hover:bg-[#e3e2e2]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[17px]">{cat.icon}</span>
                  <span className="truncate">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Contact Phone Field */}
        <div className="flex flex-col">
          <label className="text-[11px] font-bold text-black uppercase tracking-wider mb-1">
            Contact Phone
          </label>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined text-[18px] absolute left-3.5 text-neutral-500 pointer-events-none">
              smartphone
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatUSPhone(e.target.value))}
              placeholder="(859) 000-0000"
              required
              className="w-full bg-[#efeded] text-black text-sm pl-10 pr-3 py-2.5 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-black transition-colors"
            />
          </div>
          <span className="text-[11px] text-neutral-500 mt-1">US format required for SMS dispatch alerts</span>
        </div>

        {/* Special Assistance / Notes */}
        <div className="flex flex-col">
          <label className="text-[11px] font-bold text-black uppercase tracking-wider mb-1">
            Special Assistance / Notes
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional: wheelchair assistance, luggage, etc."
            className="w-full bg-[#efeded] text-black text-sm px-3.5 py-2.5 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-black transition-colors placeholder:text-neutral-400"
          />
        </div>

        {/* Map Pin Helper Notice */}
        <div className="flex items-center gap-2 bg-[#f5f3f3] px-3 py-2 rounded-lg border border-neutral-200/50">
          <span className="material-symbols-outlined text-[16px] text-neutral-500 shrink-0">pin_drop</span>
          <p className="text-[11px] text-neutral-600">Manual pin resolves to verified street address.</p>
        </div>

        {/* Error Banner */}
        {errorBanner && (
          <div className="bg-[#ffdad6] text-[#93000a] px-3.5 py-2.5 rounded-xl flex items-center gap-2 border border-red-200">
            <span className="material-symbols-outlined text-[18px] shrink-0 text-[#ba1a1a]">error</span>
            <p className="text-xs font-semibold leading-tight">{errorBanner}</p>
          </div>
        )}

        {/* Submit Pill CTA */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleGetEstimate}
            className="w-full h-[52px] rounded-full bg-black hover:bg-neutral-800 active:scale-[0.99] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all uppercase tracking-wider"
          >
            <span>Get estimate</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>

        {/* Local Guarantee Note */}
        <div className="flex items-center justify-center gap-1.5 text-center text-xs text-neutral-500 pt-1">
          <span className="material-symbols-outlined text-[15px]">support_agent</span>
          <span>Erlanger Dispatch: +1 (859) 537-1827</span>
        </div>
      </div>
    </div>
  );
};
