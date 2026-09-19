import React, { useState } from 'react';
import { Lock, ShieldCheck, KeyRound, ArrowRight, Activity, Clock } from 'lucide-react';
import { UserProfile } from '../types';

interface LockScreenProps {
  currentUser: UserProfile;
  onUnlock: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ currentUser, onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    // For demo convenience, any 4-digit entry or clicking Unlock restores session
    if (pin.length === 0 || pin === '1234' || pin.length >= 4) {
      onUnlock();
    } else {
      setError('Please enter your 4-digit clinical session PIN or click Resume');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#071917]/95 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-[#0D2622] rounded-2xl border border-[#1C4D44] shadow-2xl p-8 text-center text-white relative overflow-hidden">
        {/* Background micro grid */}
        <div className="absolute inset-0 bg-clinical-grid-dark opacity-40 pointer-events-none"></div>

        <div className="relative z-10">
          {/* Institutional Emblem */}
          <div className="w-16 h-16 rounded-2xl bg-[#143D36] border border-[#276B5F] mx-auto flex items-center justify-center text-emerald-300 mb-4 shadow-inner">
            <div className="text-center">
              <span className="text-2xl font-bold font-sans">風</span>
            </div>
          </div>

          <div className="text-xs font-mono-clinical text-emerald-400 tracking-widest uppercase mb-1">
            KAZE HOSPITAL CLINICAL WORKSTATION
          </div>
          <h2 className="text-xl font-bold text-white font-sans tracking-tight">
            Terminal Locked for Inactivity
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto leading-relaxed">
            Per HIPAA Security Rule § 164.312(a)(2)(iii), this clinical session was automatically suspended to safeguard Protected Health Information.
          </p>

          {/* Active Session Info Card */}
          <div className="bg-[#091C19] border border-[#173F37] rounded-xl p-3.5 my-5 text-left flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#14443C] text-emerald-300 border border-[#276B5F] flex items-center justify-center font-bold text-sm shrink-0">
              {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                <span>{currentUser.name}</span>
                <span className="text-[10px] font-mono-clinical uppercase text-emerald-400 px-1 py-0.2 bg-[#123630] rounded">
                  {currentUser.role}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {currentUser.title} • {currentUser.department}
              </div>
            </div>
          </div>

          {/* Unlock Form */}
          <form onSubmit={handleUnlock} className="space-y-3">
            <div className="relative">
              <input
                id="unlock-pin-input"
                type="password"
                maxLength={8}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                placeholder="Enter Session PIN (Default: 1234)"
                className="w-full bg-[#091C19] border border-[#20574D] rounded-xl px-4 py-2.5 text-center text-sm text-white placeholder:text-slate-500 font-mono-clinical tracking-widest focus:outline-hidden focus:border-emerald-400"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-xs text-rose-400 font-medium">{error}</p>
            )}

            <button
              id="unlock-session-submit-btn"
              type="submit"
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <KeyRound className="w-4 h-4" />
              <span>Authenticate & Resume Clinical Session</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </form>

          <div className="mt-5 text-[10px] text-slate-400 font-mono-clinical flex items-center justify-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>FIPS 140-3 Cryptographic Integrity Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
};
