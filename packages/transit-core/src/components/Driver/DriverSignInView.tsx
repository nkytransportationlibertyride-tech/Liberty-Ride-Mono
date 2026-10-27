/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Driver Mobile App - Sign-In View
 */

import React, { useState } from 'react';
import { useTransit } from '../../context/TransitContext';
import { formatUSPhone, deriveDriverReference } from '../../utils/transit';

export const DriverSignInView: React.FC = () => {
  const { loginDriver, drivers } = useTransit();
  const [phone, setPhone] = useState('(859) 537-1827');
  const [showError, setShowError] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setIsValidating(true);
    setShowError(false);

    setTimeout(() => {
      setIsValidating(false);
      const success = loginDriver(phone);
      if (!success) {
        setShowError(true);
      }
    }, 400);
  };

  const handleTestUnregistered = () => {
    setPhone('(859) 999-0000');
    setShowError(true);
  };

  const handleTestRegistered = () => {
    setPhone('(859) 537-1827');
    setShowError(false);
    loginDriver('(859) 537-1827');
  };

  return (
    <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full px-4 py-4">
      <div className="w-full flex flex-col items-center">
        {/* Brand & Identity Lockup */}
        <div className="flex flex-col items-center justify-center pt-2 pb-6 text-center">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white shrink-0">
              <span className="material-symbols-outlined text-[20px]">directions_car</span>
            </div>
            <span className="text-lg font-extrabold tracking-tight text-black uppercase">
              LIBERTY RIDE
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-neutral-100 text-black text-[10px] font-bold tracking-wide uppercase border border-neutral-300">
              DRIVER APP
            </span>
          </div>
          <span className="text-[11px] text-neutral-500 font-medium">
            Erlanger • Northern Kentucky (EDT)
          </span>
        </div>

        {/* Main Sign-in Card */}
        <div className="w-full bg-white rounded-2xl shadow-sm border border-neutral-200 p-5 flex flex-col">
          <div className="flex flex-col mb-5">
            <h1 className="text-xl font-bold tracking-tight text-black">Driver sign-in</h1>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              Use the phone number the owner registered for you.
            </p>
          </div>

          <form onSubmit={handleSignIn} className="flex flex-col w-full">
            <div className="flex flex-col mb-4">
              <div className="flex justify-between items-baseline mb-1.5 text-xs">
                <label htmlFor="phone-input" className="font-bold text-neutral-700 uppercase text-[10px]">
                  Operator Mobile Number
                </label>
                <span className="text-neutral-400 text-[10px]">US (+1)</span>
              </div>

              <div className="relative flex items-center w-full">
                <span className="material-symbols-outlined text-[18px] absolute left-3.5 text-neutral-500 pointer-events-none">
                  phone
                </span>
                <input
                  type="tel"
                  id="phone-input"
                  value={phone}
                  onChange={(e) => {
                    setPhone(formatUSPhone(e.target.value));
                    if (showError) setShowError(false);
                  }}
                  placeholder="(859) 537-1827"
                  required
                  className="w-full h-11 pl-10 pr-4 bg-[#f5f3f3] border border-neutral-200 text-black text-sm font-semibold rounded-full outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition-all"
                />
              </div>

              <div className="flex items-center gap-1.5 mt-2 px-1 text-neutral-500">
                <span className="material-symbols-outlined text-[15px] text-[#006d37]">check_circle</span>
                <span className="text-[11px]">Your phone number is remembered on this device.</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isValidating}
              className="w-full h-11 bg-black text-white rounded-full text-xs font-bold flex items-center justify-center gap-2 hover:bg-neutral-800 active:scale-[0.99] transition-all shadow-sm"
            >
              {isValidating ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                  <span>Checking roster...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </>
              )}
            </button>

            {/* Quick Demo Shortcuts */}
            <div className="flex items-center justify-between mt-3 text-[11px] text-neutral-400 px-1">
              <button
                type="button"
                onClick={handleTestRegistered}
                className="hover:text-black underline"
              >
                Auto-fill Registered
              </button>
              <button
                type="button"
                onClick={handleTestUnregistered}
                className="hover:text-red-600 underline"
              >
                Test Unregistered Error
              </button>
            </div>
          </form>

          {/* Operational Status */}
          <div className="mt-4 pt-3 bg-[#f5f3f3] rounded-xl p-3 flex flex-col gap-1 border border-neutral-200/50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">
                Fleet Status
              </span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#006d37]"></span>
                <span className="text-[10px] font-bold text-[#006d37] uppercase">DISPATCH READY</span>
              </div>
            </div>
            <p className="text-[11px] text-neutral-600 mt-0.5 leading-snug">
              Direct roster validation. Immediate dispatch handover without verification code delays.
            </p>
          </div>
        </div>

        {/* Explicit Error State Card */}
        {showError && (
          <div className="w-full mt-4 bg-[#fef2f2] border border-[#fecaca] rounded-2xl p-4 flex flex-col shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5 text-red-600">
                <span className="material-symbols-outlined text-[18px]">warning</span>
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <h2 className="text-xs font-bold text-red-900 leading-snug">
                  Unknown reference — contact the owner
                </h2>
                <p className="text-[11px] text-red-700 mt-0.5 leading-normal">
                  This number is not on the active Northern Kentucky driver roster. Call the owner to register or activate your vehicle reference.
                </p>
              </div>
            </div>

            <div className="mt-3">
              <a
                href="tel:+18595371827"
                className="w-full h-10 bg-white border border-red-200 text-red-700 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-red-50 transition-colors shadow-xs"
              >
                <span className="material-symbols-outlined text-[15px]">call</span>
                <span>Call +1 (859) 537-1827</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-col items-center justify-center text-center pt-6 pb-2 text-[11px] text-neutral-400">
        <p className="font-semibold text-neutral-500">Northern Kentucky • Erlanger Dispatch</p>
        <p className="mt-0.5">Secure device binding • Eastern Time (EDT)</p>
      </div>
    </div>
  );
};
