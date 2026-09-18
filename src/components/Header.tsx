import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  UserCheck, 
  Activity, 
  Key, 
  Hospital,
  ChevronDown
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
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
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Format lock timer mm:ss
  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'doctor':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'nurse':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'billing':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'admin':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'patient':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* HIPAA Compliance & Security Banner */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            HIPAA Security Rule Active
          </span>
          <span className="hidden sm:inline text-slate-500">•</span>
          <span className="hidden sm:flex items-center gap-1 text-slate-300">
            <Key className="w-3 h-3 text-cyan-400" />
            AES-256-GCM End-to-End EHR Encryption
          </span>
          <span className="hidden md:inline text-slate-500">•</span>
          <span className="hidden md:inline text-slate-400">
            Audit Trail Logging Enabled (NIST SP 800-66)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-0.5 rounded-full text-slate-300">
            <Lock className="w-3 h-3 text-amber-400" />
            <span>Auto-Lock: <strong className="text-white font-mono">{formatTimer(secondsUntilLock)}</strong></span>
          </div>

          <button
            id="lock-terminal-btn"
            onClick={onLockScreen}
            title="Lock terminal immediately"
            className="hover:text-white text-slate-400 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Lock className="w-3 h-3" />
            <span>Lock</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Hospital Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Hospital className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                St. Jude Smart Hospital
              </h1>
              <span className="bg-blue-100 text-blue-800 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                EHR Core v2.4
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Patient Record & Real-Time Clinical Operations System
            </p>
          </div>
        </div>

        {/* Action Controls & Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Privacy Shield Toggle (Blur sensitive PHI on screen) */}
          <button
            id="privacy-shield-btn"
            onClick={onTogglePrivacy}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-all cursor-pointer ${
              privacyMode 
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
            title="Privacy Shield masks Protected Health Information (PHI) from shoulder-surfing in public wards"
          >
            {privacyMode ? (
              <>
                <EyeOff className="w-4 h-4" />
                <span className="hidden sm:inline">Privacy Shield: ON</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">Privacy Shield</span>
              </>
            )}
          </button>

          {/* Break Glass Protocol Button */}
          {currentUser.canBreakGlass && (
            <button
              id="break-glass-trigger-btn"
              onClick={onOpenBreakGlass}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white border border-red-700 transition-all cursor-pointer shadow-xs"
              title="Emergency Break-Glass Access for critical patient care"
            >
              <AlertTriangle className="w-4 h-4 animate-pulse" />
              <span className="hidden sm:inline">Break Glass</span>
            </button>
          )}

          {/* User & Role Switcher Dropdown */}
          <div className="relative">
            <button
              id="role-switcher-dropdown-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-2 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-colors text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs uppercase">
                {currentUser.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
              <div className="hidden md:block">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {currentUser.name}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${getRoleBadgeColor(currentUser.role)}`}>
                    {currentUser.role.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                    {currentUser.department}
                  </span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Clinical Identity (RBAC)
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select a role to test specific HIPAA permissions & security boundaries.
                  </p>
                </div>

                <div className="py-1">
                  {SYSTEM_USERS.map((user) => (
                    <button
                      key={user.id}
                      id={`switch-user-${user.id}`}
                      onClick={() => {
                        onUserChange(user);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                        currentUser.id === user.id ? 'bg-blue-50/70 border-l-3 border-blue-600' : ''
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {user.name}
                          </span>
                          <span className={`text-[9px] font-semibold px-1 rounded border ${getRoleBadgeColor(user.role)}`}>
                            {user.role}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {user.title}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>{user.licenseNumber}</span>
                          <span>•</span>
                          <span>{user.department}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="px-3 pt-2 pb-1 border-t border-slate-100 text-[11px] text-slate-400">
                  Current Session: NIST 800-53 Authenticated
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
