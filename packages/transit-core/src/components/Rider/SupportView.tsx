/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Rider Mobile App - Support & Regional Helpline View
 */

import React from 'react';

export const SupportView: React.FC = () => {
  return (
    <div className="flex flex-col w-full pb-8 space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">headset_mic</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Northern Kentucky Regional Transit
            </span>
            <h1 className="text-xl font-bold text-black">Customer Support & Dispatch</h1>
          </div>
        </div>
      </div>

      {/* 24/7 Dispatch Card */}
      <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-xs flex flex-col gap-3">
        <span className="text-xs font-bold text-black uppercase tracking-wider">Priority Hotline</span>
        <div className="p-4 rounded-xl bg-[#f5f3f3] flex items-center justify-between border border-neutral-200/50">
          <div>
            <span className="text-sm font-bold text-black block">+1 (859) 537-1827</span>
            <span className="text-[11px] text-neutral-500">24/7 Priority Operators • Eastern Time</span>
          </div>
          <a
            href="tel:+18595371827"
            className="px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-full text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[15px]">call</span>
            <span>Call Now</span>
          </a>
        </div>
      </div>

      {/* Operational Headquarters */}
      <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-xs space-y-3">
        <span className="text-xs font-bold text-black uppercase tracking-wider">Transit Depot & Staging</span>
        <div className="text-xs text-neutral-600 space-y-2">
          <p className="flex items-start gap-2">
            <span className="material-symbols-outlined text-black text-[16px] shrink-0">location_on</span>
            <span>Operating Base: 3038 Dixie Hwy, Erlanger, KY 41018</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="material-symbols-outlined text-black text-[16px] shrink-0">flight</span>
            <span>Airport Service: Cincinnati/Northern Kentucky International Airport (CVG) Curbside Terminal 3</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="material-symbols-outlined text-black text-[16px] shrink-0">local_hospital</span>
            <span>Medical Transit: St. Elizabeth Healthcare Edgewood, Florence & Ft. Thomas</span>
          </p>
        </div>
      </div>

      {/* Governance & Policy FAQs */}
      <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-xs space-y-3">
        <span className="text-xs font-bold text-black uppercase tracking-wider">Frequently Asked Questions</span>
        <div className="space-y-3 text-xs text-neutral-600 divide-y divide-neutral-100">
          <div className="pt-2">
            <h4 className="font-bold text-black">How does guaranteed pricing work?</h4>
            <p className="mt-0.5 text-neutral-500">
              When you calculate an estimate in Zone 1 ($35) or Zone 2 ($45), your tariff is locked. No surge multipliers or traffic delays will alter the confirmed contract price.
            </p>
          </div>
          <div className="pt-3">
            <h4 className="font-bold text-black">When can I cancel my ride?</h4>
            <p className="mt-0.5 text-neutral-500">
              Per regional commercial transit governance, cancellations are allowed freely while a driver has not yet set out en route. Once en route, dispatch phone contact is required.
            </p>
          </div>
          <div className="pt-3">
            <h4 className="font-bold text-black">Where can I see reviews?</h4>
            <p className="mt-0.5 text-neutral-500">
              Find our verified reviews on Google Business Profile under Liberty Ride NKY Trans, LLC.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
