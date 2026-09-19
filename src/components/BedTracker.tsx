import React, { useState } from 'react';
import { 
  Bed as BedIcon, 
  Activity, 
  Heart, 
  Wind, 
  Thermometer, 
  UserCheck, 
  ArrowRightLeft, 
  LogOut, 
  Sparkles, 
  AlertCircle, 
  Search, 
  Filter, 
  CheckCircle2, 
  ShieldAlert, 
  Stethoscope, 
  Building2,
  Radio,
  Plus
} from 'lucide-react';
import { Bed, Patient, UserProfile } from '../types';

interface BedTrackerProps {
  beds: Bed[];
  patients: Patient[];
  currentUser: UserProfile;
  privacyMode: boolean;
  onAdmit: (bedId: string, patientId: string, doctor: string, nurse: string, notes: string) => Promise<void>;
  onDischarge: (bedId: string, notes: string) => Promise<void>;
  onTransfer: (fromBedId: string, toBedId: string, reason: string) => Promise<void>;
  onSanitize: (bedId: string) => Promise<void>;
}

export const BedTracker: React.FC<BedTrackerProps> = ({
  beds,
  patients,
  currentUser,
  privacyMode,
  onAdmit,
  onDischarge,
  onTransfer,
  onSanitize
}) => {
  const [selectedWard, setSelectedWard] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState<boolean>(false);
  const [selectedBedForAdmit, setSelectedBedForAdmit] = useState<Bed | null>(null);
  const [admitPatientId, setAdmitPatientId] = useState<string>('');
  const [admitDoctor, setAdmitDoctor] = useState<string>(currentUser.name);
  const [admitNurse, setAdmitNurse] = useState<string>('Nurse James Miller, RN');
  const [admitNotes, setAdmitNotes] = useState<string>('');
  const [isAdmitting, setIsAdmitting] = useState<boolean>(false);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [transferFromBed, setTransferFromBed] = useState<Bed | null>(null);
  const [transferToBedId, setTransferToBedId] = useState<string>('');
  const [transferReason, setTransferReason] = useState<string>('Clinical step-down following stabilization');
  const [isTransferring, setIsTransferring] = useState<boolean>(false);

  const [isDischargeModalOpen, setIsDischargeModalOpen] = useState<boolean>(false);
  const [selectedBedForDischarge, setSelectedBedForDischarge] = useState<Bed | null>(null);
  const [dischargeNotes, setDischargeNotes] = useState<string>('Hemodynamically stable. Discharge orders signed. Ambulatory home care plan provided.');
  const [isDischarging, setIsDischarging] = useState<boolean>(false);

  // Wards list
  const wards = ['All', 'ICU', 'Step-Down', 'General Medicine', 'Surgical Ward', 'Emergency'];

  // Filtered beds
  const filteredBeds = beds.filter((b) => {
    const matchesWard = selectedWard === 'All' || b.ward === selectedWard;
    const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
    const matchesSearch = 
      b.bedNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.patientName && b.patientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.patientMrn && b.patientMrn.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesWard && matchesStatus && matchesSearch;
  });

  const availableBedsForTransfer = beds.filter(b => b.status === 'available');

  const handleOpenAdmit = (bed: Bed) => {
    setSelectedBedForAdmit(bed);
    // Default to first unadmitted or triage patient
    const candidate = patients.find(p => p.admissionStatus !== 'Admitted') || patients[0];
    setAdmitPatientId(candidate?.id || '');
    setIsAdmitModalOpen(true);
  };

  const handleAdmitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBedForAdmit || !admitPatientId) return;
    try {
      setIsAdmitting(true);
      await onAdmit(selectedBedForAdmit.id, admitPatientId, admitDoctor, admitNurse, admitNotes);
      setIsAdmitModalOpen(false);
      setAdmitNotes('');
    } finally {
      setIsAdmitting(false);
    }
  };

  const handleOpenTransfer = (bed: Bed) => {
    setTransferFromBed(bed);
    setTransferToBedId(availableBedsForTransfer[0]?.id || '');
    setIsTransferModalOpen(true);
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferFromBed || !transferToBedId) return;
    try {
      setIsTransferring(true);
      await onTransfer(transferFromBed.id, transferToBedId, transferReason);
      setIsTransferModalOpen(false);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleOpenDischarge = (bed: Bed) => {
    setSelectedBedForDischarge(bed);
    setIsDischargeModalOpen(true);
  };

  const handleDischargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBedForDischarge) return;
    try {
      setIsDischarging(true);
      await onDischarge(selectedBedForDischarge.id, dischargeNotes);
      setIsDischargeModalOpen(false);
    } finally {
      setIsDischarging(false);
    }
  };

  // Metrics
  const totalBeds = beds.length;
  const occupiedBeds = beds.filter(b => b.status === 'occupied').length;
  const availableBeds = beds.filter(b => b.status === 'available').length;
  const cleaningBeds = beds.filter(b => b.status === 'cleaning').length;
  const occupancyPercent = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Ward Command Ribbon (Refined Clinical Design) */}
      <div className="bg-white border border-[#D5DDD9] rounded-xl p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight font-sans">
                Kaze Hospital Ward Census & Bed Telemetry
              </h2>
              <span className="text-[10px] font-mono-clinical font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                LIVE CENSUS FEED
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-sans">
              Continuous vitals telemetry, isolation containment protocols, and automated bed turnover management.
            </p>
          </div>

          {/* Clinical Capacity Indicators */}
          <div className="flex items-center gap-2 sm:gap-4 divide-x divide-slate-200 text-xs">
            <div className="pr-3">
              <span className="text-slate-400 text-[10px] block font-mono-clinical uppercase">TOTAL BEDS</span>
              <strong className="text-base text-slate-900 font-mono-clinical font-bold">{totalBeds}</strong>
            </div>
            <div className="pl-3 pr-3">
              <span className="text-emerald-700 text-[10px] block font-mono-clinical uppercase font-semibold">OCCUPIED</span>
              <strong className="text-base text-emerald-800 font-mono-clinical font-bold">{occupiedBeds} ({occupancyPercent}%)</strong>
            </div>
            <div className="pl-3 pr-3">
              <span className="text-slate-600 text-[10px] block font-mono-clinical uppercase">READY BEDS</span>
              <strong className="text-base text-slate-800 font-mono-clinical font-bold">{availableBeds}</strong>
            </div>
            <div className="pl-3">
              <span className="text-amber-700 text-[10px] block font-mono-clinical uppercase">SANITIZING</span>
              <strong className="text-base text-amber-700 font-mono-clinical font-bold">{cleaningBeds}</strong>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-4 pt-3.5 border-t border-[#E5EBE8] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Ward Selector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {wards.map((ward) => {
              const count = ward === 'All' 
                ? beds.length 
                : beds.filter(b => b.ward === ward).length;
              const isSelected = selectedWard === ward;
              return (
                <button
                  key={ward}
                  onClick={() => setSelectedWard(ward)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#0E2C27] text-white shadow-xs'
                      : 'bg-[#F2F5F4] hover:bg-[#E6EBE9] text-slate-700'
                  }`}
                >
                  <span>{ward}</span>
                  <span className={`ml-1.5 text-[10px] font-mono-clinical ${isSelected ? 'text-emerald-300' : 'text-slate-400'}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Status Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bed, room, patient..."
                className="w-full bg-[#F6F8F7] border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#14443C]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#F6F8F7] border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-[#14443C]"
            >
              <option value="All">All Statuses</option>
              <option value="occupied">Occupied</option>
              <option value="available">Available</option>
              <option value="cleaning">Sanitizing</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bed Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBeds.map((bed) => {
          const isOccupied = bed.status === 'occupied';
          const isCleaning = bed.status === 'cleaning';
          const isAvailable = bed.status === 'available';

          return (
            <div
              key={bed.id}
              id={`bed-card-${bed.id}`}
              className={`rounded-xl border transition-all overflow-hidden flex flex-col justify-between ${
                isOccupied
                  ? 'bg-white border-[#C7D3CD] shadow-xs'
                  : isCleaning
                  ? 'bg-[#FFFDF7] border-amber-300/80 shadow-2xs'
                  : 'bg-[#F9FAF9] border-[#D9E1DE] shadow-2xs'
              }`}
            >
              {/* Bed Header & Room Assignment */}
              <div className="p-3.5 border-b border-[#E2E8E5] bg-[#F7F9F8] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-clinical font-bold text-xs text-slate-900">
                      {bed.bedNumber}
                    </span>
                    <span className="text-[11px] text-slate-500 font-sans">
                      {bed.roomNumber}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono-clinical uppercase">
                    {bed.ward} • {bed.bedType}
                  </span>
                </div>

                {/* Status Badge */}
                <div>
                  {isOccupied && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                      Occupied
                    </span>
                  )}
                  {isAvailable && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
                      Available
                    </span>
                  )}
                  {isCleaning && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                      <Sparkles className="w-3 h-3 text-amber-700 animate-spin" />
                      Sanitizing
                    </span>
                  )}
                </div>
              </div>

              {/* Bed Body: Clinical Data or Empty State */}
              <div className="p-4 flex-1">
                {isOccupied ? (
                  <div className="space-y-3">
                    {/* Patient Identification */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className={`font-bold text-sm text-slate-900 ${privacyMode ? 'phi-blur' : ''}`}>
                          {bed.patientName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono-clinical">
                          {privacyMode ? 'MRN-••••••' : bed.patientMrn}
                        </div>
                      </div>

                      {/* Attending & Nurse */}
                      <div className="text-right text-[11px] text-slate-600">
                        <div className="font-semibold text-slate-800">{bed.assignedDoctor}</div>
                        <div className="text-slate-400 text-[10px]">{bed.assignedNurse}</div>
                      </div>
                    </div>

                    {/* LIVE BEDSIDE TELEMETRY MONITOR (Simulated Real Hospital Waveform) */}
                    {bed.telemetry ? (
                      <div className="bg-[#081715] rounded-xl p-3 border border-[#143B34] text-white font-mono-clinical text-xs space-y-2 relative overflow-hidden">
                        {/* Background micro grid */}
                        <div className="absolute inset-0 bg-clinical-grid-dark opacity-30 pointer-events-none"></div>

                        <div className="relative z-10 flex items-center justify-between text-[10px] text-emerald-400 border-b border-[#123630] pb-1">
                          <span className="flex items-center gap-1 font-bold">
                            <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                            TELEMETRY LEAD II
                          </span>
                          <span className="text-slate-400">ARRHYTHMIA: {bed.telemetry.alertStatus.toUpperCase()}</span>
                        </div>

                        {/* Animated SVG ECG Waveform Strip */}
                        <div className="relative z-10 h-8 flex items-center">
                          <svg viewBox="0 0 300 40" className="w-full h-8 overflow-visible">
                            <path
                              d="M 0 20 L 40 20 L 45 15 L 50 25 L 55 20 L 80 20 L 85 5 L 90 35 L 95 12 L 100 24 L 105 20 L 140 20 L 145 15 L 150 25 L 155 20 L 180 20 L 185 5 L 190 35 L 195 12 L 200 24 L 205 20 L 240 20 L 245 15 L 250 25 L 255 20 L 300 20"
                              fill="none"
                              stroke="#2DD4BF"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="animate-ecg"
                            />
                          </svg>
                        </div>

                        {/* Telemetry Numeric Vitals */}
                        <div className="relative z-10 grid grid-cols-4 gap-2 pt-1 border-t border-[#123630] text-center">
                          <div>
                            <span className="text-[9px] text-emerald-300 block">HR</span>
                            <span className="font-bold text-sm text-emerald-400">{bed.telemetry.heartRate}</span>
                            <span className="text-[8px] text-slate-400 block">bpm</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-cyan-300 block">BP</span>
                            <span className="font-bold text-xs text-cyan-400">{bed.telemetry.bloodPressure}</span>
                            <span className="text-[8px] text-slate-400 block">mmHg</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-teal-300 block">SpO2</span>
                            <span className="font-bold text-sm text-teal-400">{bed.telemetry.oxygenSat}%</span>
                            <span className="text-[8px] text-slate-400 block">pulse</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-amber-300 block">TEMP</span>
                            <span className="font-bold text-xs text-amber-400">{bed.telemetry.temperature}°</span>
                            <span className="text-[8px] text-slate-400 block">axillary</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 p-2 rounded text-xs text-slate-400 italic">
                        Standard telemetry not linked.
                      </div>
                    )}

                    {/* Clinical Notes snippet */}
                    {bed.notes && (
                      <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded border border-slate-100">
                        {bed.notes}
                      </p>
                    )}
                  </div>
                ) : isCleaning ? (
                  <div className="py-6 text-center text-amber-800 text-xs">
                    <Sparkles className="w-7 h-7 mx-auto mb-2 text-amber-600 opacity-70 animate-spin" />
                    <strong className="block font-semibold">Terminal Sanitization In Progress</strong>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                      UV sterilization and linen exchange following patient discharge.
                    </p>
                  </div>
                ) : (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    <BedIcon className="w-7 h-7 mx-auto mb-2 text-slate-300" />
                    <span className="block font-semibold text-slate-600">Bed Clean & Ready for Intake</span>
                    <span className="text-[11px] text-slate-400">Inspected by environmental services</span>
                  </div>
                )}
              </div>

              {/* Bed Action Footer */}
              <div className="p-3 bg-[#F7F9F8] border-t border-[#E2E8E5] flex items-center justify-between gap-2">
                {isOccupied && (
                  <>
                    <button
                      id={`transfer-bed-btn-${bed.id}`}
                      onClick={() => handleOpenTransfer(bed)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
                      <span>Transfer</span>
                    </button>

                    <button
                      id={`discharge-bed-btn-${bed.id}`}
                      onClick={() => handleOpenDischarge(bed)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-600" />
                      <span>Discharge</span>
                    </button>
                  </>
                )}

                {isAvailable && (
                  <button
                    id={`admit-patient-btn-${bed.id}`}
                    onClick={() => handleOpenAdmit(bed)}
                    className="w-full py-1.5 px-3 bg-[#0E2C27] hover:bg-[#14443C] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Admit Patient to Bed</span>
                  </button>
                )}

                {isCleaning && (
                  <button
                    id={`complete-sanitize-btn-${bed.id}`}
                    onClick={() => onSanitize(bed.id)}
                    className="w-full py-1.5 px-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm Bed Ready & Cleaned</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ADMIT PATIENT MODAL */}
      {isAdmitModalOpen && selectedBedForAdmit && (
        <div className="fixed inset-0 z-50 bg-[#071714]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-sans">
                  Admit Patient to Bed {selectedBedForAdmit.bedNumber}
                </h3>
                <p className="text-xs text-slate-500 font-mono-clinical">
                  {selectedBedForAdmit.ward} • Room {selectedBedForAdmit.roomNumber}
                </p>
              </div>
              <button 
                onClick={() => setIsAdmitModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdmitSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Patient for Admission
                </label>
                <select
                  value={admitPatientId}
                  onChange={(e) => setAdmitPatientId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                  required
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.mrn}) • Status: {p.admissionStatus} • {p.insurance.provider}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Attending Physician
                  </label>
                  <input
                    type="text"
                    value={admitDoctor}
                    onChange={(e) => setAdmitDoctor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assigned Charge Nurse
                  </label>
                  <input
                    type="text"
                    value={admitNurse}
                    onChange={(e) => setAdmitNurse(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Admission Diagnosis & Monitoring Instructions
                </label>
                <textarea
                  rows={3}
                  value={admitNotes}
                  onChange={(e) => setAdmitNotes(e.target.value)}
                  placeholder="e.g. Admitted via ER for non-ST elevation MI. Continuous telemetry and q4h vitals."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdmitModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#0E2C27] hover:bg-[#14443C] rounded-lg cursor-pointer shadow-xs"
                >
                  {isAdmitting ? 'Assigning Bed...' : 'Confirm Admission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSFER MODAL */}
      {isTransferModalOpen && transferFromBed && (
        <div className="fixed inset-0 z-50 bg-[#071714]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-sans">
                  Transfer Patient: {transferFromBed.patientName}
                </h3>
                <p className="text-xs text-slate-500 font-mono-clinical">
                  Current: {transferFromBed.bedNumber} ({transferFromBed.ward})
                </p>
              </div>
              <button 
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Destination Ready Bed
                </label>
                <select
                  value={transferToBedId}
                  onChange={(e) => setTransferToBedId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                  required
                >
                  {availableBedsForTransfer.length === 0 ? (
                    <option value="">No available beds in other units</option>
                  ) : (
                    availableBedsForTransfer.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bedNumber} - {b.ward} (Room {b.roomNumber})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Clinical Transfer Reason
                </label>
                <input
                  type="text"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTransferring || !transferToBedId}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#0E2C27] hover:bg-[#14443C] disabled:opacity-50 rounded-lg cursor-pointer shadow-xs"
                >
                  {isTransferring ? 'Transferring...' : 'Execute Bed Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISCHARGE MODAL */}
      {isDischargeModalOpen && selectedBedForDischarge && (
        <div className="fixed inset-0 z-50 bg-[#071714]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-sans">
                  Process Patient Discharge
                </h3>
                <p className="text-xs text-slate-500 font-mono-clinical">
                  {selectedBedForDischarge.patientName} ({selectedBedForDischarge.bedNumber})
                </p>
              </div>
              <button 
                onClick={() => setIsDischargeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDischargeSubmit} className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
                Discharging this patient will release bed <strong>{selectedBedForDischarge.bedNumber}</strong> and queue it for environmental terminal sanitization.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Discharge Summary Notes
                </label>
                <textarea
                  rows={3}
                  value={dischargeNotes}
                  onChange={(e) => setDischargeNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDischargeModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDischarging}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 disabled:opacity-50 rounded-lg cursor-pointer shadow-xs"
                >
                  {isDischarging ? 'Discharging...' : 'Confirm Patient Discharge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
