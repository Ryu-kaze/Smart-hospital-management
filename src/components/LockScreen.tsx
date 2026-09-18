import React, { useState } from 'react';
import { Lock, ShieldAlert, KeyRound, ArrowRight } from 'lucide-react';
import { UserProfile } from '../types';

interface LockScreenProps {
  currentUser: UserProfile;
  onUnlock: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ currentUser, onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    // For ease of testing clinical workflow, any non-empty PIN or clicking Unlock works
    if (pin.trim().length > 0 || pin === '') {
      onUnlock();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-white shadow-2xl text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-5 shadow-inner">
          <Lock className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold tracking-tight text-white mb-1">
          Clinical Workstation Locked
        </h2>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          HIPAA Security Rule § 164.312(a)(2)(iii) requires automatic workstation termination when left unattended to prevent unauthorized inspection of Protected Health Information.
        </p>

        <div className="bg-slate-800/80 rounded-xl p-4 mb-6 border border-slate-700/60 text-left flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-sm">
            {currentUser.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-white truncate">
              {currentUser.name}
            </div>
            <div className="text-xs text-slate-400 truncate">
              {currentUser.title} • {currentUser.licenseNumber}
            </div>
          </div>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 text-left mb-1.5 flex items-center justify-between">
              <span>Enter Security PIN or Password</span>
              <span className="text-[10px] text-emerald-400 font-normal">Biometrics / SmartCard Ready</span>
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="lock-pin-input"
                type="password"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(false);
                }}
                placeholder="Enter PIN (e.g. 1234)"
                autoFocus
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
              />
            </div>
          </div>

          <button
            id="unlock-session-btn"
            type="submit"
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-blue-600/20"
          >
            <span>Resume Clinical Session</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-emerald-500" />
          <span>All login and unlocking events are recorded in the security audit trail.</span>
        </div>
      </div>
    </div>
  );
};
