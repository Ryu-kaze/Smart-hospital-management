import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Eye, 
  EyeOff, 
  Clock, 
  AlertTriangle, 
  ChevronDown, 
  UserCheck, 
  Activity,
  Radio,
  Building2,
  Stethoscope
} from 'lucide-react';
import { UserProfile } from '../types';
import { SYSTEM_USERS } from '../data/mockUsers';

interface HeaderProps {
  currentUser: UserProfile;
  onUserChange: (user: UserProfile) => void;
  privacyMode: boolean;
  onTogglePrivacy: () => void;
  onLockScreen: () => void;
  onOpenBreakGlass: () => void;
  secondsUntilLock: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onUserChange,
  privacyMode,
  onTogglePrivacy,
  onLockScreen,
  onOpenBreakGlass,
  secondsUntilLock
}) => {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatLockTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <header className="bg-[#0E2C27] text-white border-b border-[#18443D] sticky top-0 z-40 select-none shadow-sm">
      {/* Top Clinical Compliance & Telemetry Ribbon */}
      <div className="bg-[#091F1C] px-4 py-1 text-[11px] border-b border-[#123630] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 font-mono-clinical text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 -ml-3"></span>
            <span className="text-emerald-400 font-semibold tracking-wider">KAZE-NET SECURE</span>
          </div>
          <span className="text-slate-600">•</span>
          <span>NODE: <strong className="text-slate-200">L3-CLINICAL-WS08</strong></span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="hidden sm:inline">HIPAA § 164.312 ACTIVE</span>
          <span className="text-slate-600 hidden md:inline">•</span>
          <span className="hidden md:inline">ENCRYPTION: <strong className="text-emerald-300">AES-256-GCM (FIPS 140-3)</strong></span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono-clinical">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock className="w-3 h-3 text-[#2DD4BF]" />
            <span className="tracking-widest font-semibold text-slate-100">{currentTime || '12:00:00'}</span>
            <span className="text-[9px] text-[#2DD4BF] font-sans uppercase font-bold tracking-wider">LOCAL</span>
          </div>

          <div className="flex items-center gap-1.5 bg-[#123832] px-2 py-0.5 rounded text-[11px] border border-[#1A4B43]">
            <span className="text-slate-400">Idle Lock:</span>
            <span className={`font-bold font-mono-clinical ${secondsUntilLock < 30 ? 'text-rose-400 animate-pulse' : 'text-emerald-300'}`}>
              {formatLockTime(secondsUntilLock)}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Institution Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Institutional Branding: Kaze Hospital */}
          <div className="flex items-center gap-3">
            {/* Distinctive Kaze Clinical Emblem */}
            <div className="w-10 h-10 rounded-lg bg-[#14443C] border border-[#25665B] flex items-center justify-center shrink-0 shadow-inner">
              <div className="relative flex items-center justify-center">
                <span className="text-emerald-300 font-bold text-base tracking-tighter">風</span>
                <span className="absolute -top-1 -right-2 text-[9px] text-teal-400 font-mono-clinical font-black">+</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5 font-sans">
                  <span>Kaze Hospital</span>
                  <span className="text-[10px] font-mono-clinical font-normal px-1.5 py-0.2 rounded bg-[#164940] text-emerald-300 border border-[#24675B]">
                    EHR CORE
                  </span>
                </h1>
              </div>
              <p className="text-[11px] text-slate-300 tracking-wide font-sans">
                Tertiary Medical Center & Emergency Care System • Ward 3 Command
              </p>
            </div>
          </div>

          {/* Clinical Controls & Session Role */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Privacy Shield Toggle */}
            <button
              id="privacy-shield-toggle-btn"
              onClick={onTogglePrivacy}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                privacyMode
                  ? 'bg-amber-500/20 border-amber-400/50 text-amber-200'
                  : 'bg-[#14443C] hover:bg-[#1A544A] border-[#25665B] text-slate-200'
              }`}
              title="Toggle Screen Privacy Shield (Blurs all Protected Health Information)"
            >
              {privacyMode ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-amber-300" />
                  <span>Privacy Shield: <strong>ON</strong></span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span>Privacy Shield</span>
                </>
              )}
            </button>

            {/* Emergency Break-Glass Button */}
            <button
              id="break-glass-trigger-btn"
              onClick={onOpenBreakGlass}
              className="py-1.5 px-3 rounded-lg text-xs font-bold bg-rose-950/80 hover:bg-rose-900 border border-rose-700/80 text-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Emergency Protocol: Override access controls with immediate compliance audit logging"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Break Glass</span>
            </button>

            {/* Manual Workstation Lock */}
            <button
              id="workstation-lock-btn"
              onClick={onLockScreen}
              className="py-1.5 px-2.5 rounded-lg text-xs font-medium bg-[#14443C] hover:bg-[#1A544A] border border-[#25665B] text-slate-200 transition-colors cursor-pointer flex items-center gap-1"
              title="Lock terminal immediately"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Lock</span>
            </button>

            {/* User Profile / Clinical Role Switcher */}
            <div className="relative">
              <button
                id="user-profile-menu-btn"
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="py-1 px-2.5 rounded-lg bg-[#14443C] hover:bg-[#1A544A] border border-[#25665B] text-left flex items-center gap-2 transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-md bg-[#1D5C52] text-emerald-200 flex items-center justify-center font-bold text-xs border border-[#2C786B]">
                  {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="hidden sm:block leading-tight pr-1">
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    <span>{currentUser.name}</span>
                    <span className="text-[10px] text-emerald-400 font-mono-clinical uppercase font-semibold">
                      [{currentUser.role}]
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-300">
                    {currentUser.department}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 text-slate-900 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-sans">
                      Active Shift Identity (RBAC Switcher)
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Switch clinical credential to evaluate permission gates
                    </p>
                  </div>

                  <div className="py-1">
                    {SYSTEM_USERS.map((u) => {
                      const isSelected = u.id === currentUser.id;
                      return (
                        <button
                          key={u.id}
                          id={`switch-user-${u.id}`}
                          onClick={() => {
                            onUserChange(u);
                            setIsUserDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2 flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected ? 'bg-emerald-50 text-emerald-950 font-bold' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isSelected && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {u.title} • <span className="text-emerald-700 font-medium">{u.department}</span>
                            </div>
                          </div>

                          <span className="text-[10px] font-mono-clinical uppercase font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {u.role}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-500 font-mono-clinical">
                    ID: {currentUser.id} • STATION: L3-08
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
