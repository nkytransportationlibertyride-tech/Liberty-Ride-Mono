/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Owner Administration Console - Security Gate Vault
 */

import React, { useState, useEffect } from 'react';
import { useTransit } from '../../context/TransitContext';
import { formatEasternTime } from '../../utils/transit';

export const SecurityGateView: React.FC = () => {
  const { unlockOwnerConsole } = useTransit();
  const [keyInput, setKeyInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [timeStr, setTimeStr] = useState(formatEasternTime());

  useEffect(() => {
    const t = setInterval(() => setTimeStr(formatEasternTime()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setHasError(false);

    setTimeout(() => {
      setIsVerifying(false);
      const success = unlockOwnerConsole(keyInput);
      if (!success) {
        setHasError(true);
      }
    }, 450);
  };

  const handleQuickDemoUnlock = () => {
    setKeyInput('owner859');
    unlockOwnerConsole('owner859');
  };

  return (
    <div className="min-h-[80vh] w-full flex items-center justify-center p-4 bg-[#f5f3f3]">
      <div className="w-full max-w-[460px] flex flex-col items-center">
        {/* Top System Context Metadata */}
        <div className="flex items-center gap-2 mb-6 text-xs text-neutral-500 font-medium">
          <span className="w-2 h-2 rounded-full bg-[#006d37]"></span>
          <span className="uppercase tracking-wider font-bold text-neutral-700">Fleet Core Dispatch</span>
          <span>•</span>
          <span className="uppercase tracking-wider font-mono text-neutral-800">{timeStr}</span>
          <span>•</span>
          <span>America/New_York</span>
        </div>

        {/* Security Gate Card */}
        <div className="w-full bg-white rounded-2xl shadow-md p-6 sm:p-8 flex flex-col border border-neutral-200">
          {/* Operational Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-[#efeded] flex items-center justify-center mb-3 text-black">
              <span className="material-symbols-outlined text-[24px]">verified_user</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-black">Liberty Ride</div>
            <div className="text-xs text-neutral-500 mt-0.5">Owner Administration Console</div>
          </div>

          {/* Key Form */}
          <form className="flex flex-col w-full" onSubmit={handleSubmit}>
            <div className="flex flex-col mb-4">
              <label
                htmlFor="owner-key-field"
                className="text-xs font-bold text-black mb-1.5 flex items-center justify-between"
              >
                <span>Owner key</span>
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                  Restricted Vault
                </span>
              </label>

              <div className="relative w-full flex items-center">
                <span className="material-symbols-outlined absolute left-4 text-neutral-400 text-[18px] pointer-events-none">
                  key
                </span>
                <input
                  type="password"
                  id="owner-key-field"
                  value={keyInput}
                  onChange={(e) => {
                    setKeyInput(e.target.value);
                    if (hasError) setHasError(false);
                  }}
                  placeholder="••••••••••••"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full h-12 pl-11 pr-4 bg-[#f5f3f3] rounded-full text-base tracking-widest text-black placeholder:text-neutral-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-black transition-all"
                  required
                />
              </div>

              <div className="flex items-center justify-between mt-2 px-1">
                <p className="text-[11px] text-neutral-500">The owner key is shared with the owner only.</p>
                <button
                  type="button"
                  onClick={handleQuickDemoUnlock}
                  className="text-[11px] text-neutral-400 hover:text-black underline"
                >
                  Demo fill
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full h-12 rounded-full bg-black hover:bg-neutral-800 active:bg-neutral-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.99]"
            >
              {isVerifying ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">lock_open</span>
                  <span>Unlock console</span>
                </>
              )}
            </button>
          </form>

          {/* Explicit Error State Banner */}
          {hasError && (
            <div className="mt-4 flex flex-col bg-[#ffdad6]/60 border border-red-200 rounded-xl p-3.5 transition-opacity">
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-red-600 text-[20px] shrink-0 mt-0.5">
                  gpp_maybe
                </span>
                <div className="flex flex-col flex-1">
                  <span className="text-xs font-bold text-red-900">Access Denied</span>
                  <span className="text-[11px] text-red-800 mt-0.5 leading-tight">
                    Invalid key — Please verify your owner credentials. (Hint: <code>owner859</code>)
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-red-200/60">
                <span className="text-[10px] text-neutral-500">Erlanger Fleet Gateway</span>
                <button
                  type="button"
                  onClick={() => {
                    setKeyInput('');
                    setHasError(false);
                  }}
                  className="h-7 px-3 rounded-full bg-white hover:bg-neutral-50 text-black text-[11px] font-bold border border-neutral-300 flex items-center gap-1 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[14px]">refresh</span>
                  <span>Retry</span>
                </button>
              </div>
            </div>
          )}

          {/* Telemetry Strip */}
          <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-400">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-neutral-400">shield</span>
              <span className="text-[10px] uppercase tracking-wider font-bold">Single-Key Protocol</span>
            </div>
            <span className="text-[10px] font-semibold">Zone: NKY-01</span>
          </div>
        </div>

        {/* Inquiries Footer */}
        <div className="flex flex-col items-center mt-5 text-center text-xs text-neutral-500">
          <div className="flex items-center gap-1.5">
            <span>Owner Verification Inquiries:</span>
            <a href="tel:+18595371827" className="text-black font-bold hover:underline">
              +1 (859) 537-1827
            </a>
          </div>
          <span className="text-[10px] text-neutral-400 mt-1">
            Administrative node active • Regional transport perimeter
          </span>
        </div>
      </div>
    </div>
  );
};
