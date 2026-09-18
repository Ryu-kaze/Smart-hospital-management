import React, { useState } from 'react';
import { 
  Bed as BedIcon, 
  Activity, 
  UserPlus, 
  LogOut, 
  ArrowRightLeft, 
  Sparkles, 
  Heart, 
  Thermometer, 
  Wind, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Filter,
  Search,
  UserCheck,
  Building2,
  Stethoscope
} from 'lucide-react';
import { Bed, BedStatus, Patient, UserProfile, WardDepartment } from '../types';

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
  const [admitModalBed, setAdmitModalBed] = useState<Bed | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [admitDoctor, setAdmitDoctor] = useState<string>(currentUser.name);
  const [admitNurse, setAdmitNurse] = useState<string>('Nurse Staff');
  const [admitNotes, setAdmitNotes] = useState<string>('');

  const [dischargeModalBed, setDischargeModalBed] = useState<Bed | null>(null);
  const [dischargeNotes, setDischargeNotes] = useState<string>('Patient medically stable for discharge; prescriptions reconciled.');

  const [transferModalBed, setTransferModalBed] = useState<Bed | null>(null);
  const [transferTargetBedId, setTransferTargetBedId] = useState<string>('');
  const [transferReason, setTransferReason] = useState<string>('Clinical step-down to standard inpatient ward');

  const [isProcessing, setIsProcessing] = useState(false);

  const departments: WardDepartment[] = [
    'ICU',
    'Emergency (ER)',
    'Surgical',
    'General Ward',
    'Pediatrics',
    'Maternity'
  ];

  // Filtered beds
  const filteredBeds = beds.filter((b) => {
    const matchesWard = selectedWard === 'All' || b.department === selectedWard;
    const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
    const matchesSearch = 
      b.bedNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.patientName && b.patientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.patientMrn && b.patientMrn.toLowerCase().includes(searchQuery.toLowerCase())) ||
      b.roomNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesWard && matchesStatus && matchesSearch;
  });

  // KPI calculations
  const totalCount = beds.length;
  const occupiedCount = beds.filter(b => b.status === 'occupied').length;
  const availableCount = beds.filter(b => b.status === 'available').length;
  const cleaningCount = beds.filter(b => b.status === 'cleaning').length;
  const occupancyPct = Math.round((occupiedCount / (totalCount || 1)) * 100);

  // Available beds for transfer
  const availableBeds = beds.filter(b => b.status === 'available' && b.id !== transferModalBed?.id);

  // Eligible patients for admission (those not currently in a bed)
  const eligiblePatients = patients.filter(p => p.admissionStatus !== 'Admitted');

  const handleAdmitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admitModalBed || !selectedPatientId) return;
    try {
      setIsProcessing(true);
      await onAdmit(admitModalBed.id, selectedPatientId, admitDoctor, admitNurse, admitNotes);
      setAdmitModalBed(null);
      setSelectedPatientId('');
      setAdmitNotes('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDischargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dischargeModalBed) return;
    try {
      setIsProcessing(true);
      await onDischarge(dischargeModalBed.id, dischargeNotes);
      setDischargeModalBed(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferModalBed || !transferTargetBedId) return;
    try {
      setIsProcessing(true);
      await onTransfer(transferModalBed.id, transferTargetBedId, transferReason);
      setTransferModalBed(null);
      setTransferTargetBedId('');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: BedStatus) => {
    switch (status) {
      case 'available':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Available</span>;
      case 'occupied':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200"><span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>Occupied</span>;
      case 'cleaning':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Sanitizing</span>;
      case 'maintenance':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300"><span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>Maintenance</span>;
      case 'reserved':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>Reserved</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Capacity</span>
            <BedIcon className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalCount}</span>
            <span className="text-xs text-slate-500">Hospital Beds</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Across 6 Clinical Wards
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Occupancy Rate</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{occupancyPct}%</span>
            <span className="text-xs font-medium text-emerald-600">({occupiedCount} occupied)</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${occupancyPct}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Available Immediately</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">{availableCount}</span>
            <span className="text-xs text-slate-500">Ready for Intake</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Rapid Admission Enabled
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Sanitization Cycle</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600">{cleaningCount}</span>
            <span className="text-xs text-slate-500">Terminal Clean</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Infection Control Monitored
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="bed-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Bed # (e.g. ICU-02), Room, or Patient Name..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5" />
              Status:
            </span>
            <select
              id="bed-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="cleaning">Sanitizing</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>

        {/* Department / Ward Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-slate-100 pt-3">
          <button
            onClick={() => setSelectedWard('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
              selectedWard === 'All'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            All Wards ({beds.length})
          </button>
          {departments.map((dep) => {
            const depCount = beds.filter(b => b.department === dep).length;
            const depOccupied = beds.filter(b => b.department === dep && b.status === 'occupied').length;
            return (
              <button
                key={dep}
                id={`ward-tab-${dep.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => setSelectedWard(dep)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  selectedWard === dep
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                <span>{dep}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedWard === dep ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {depOccupied}/{depCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBeds.map((bed) => {
          const isOccupied = bed.status === 'occupied';
          const isAvailable = bed.status === 'available';
          const isCleaning = bed.status === 'cleaning';

          return (
            <div
              key={bed.id}
              id={`bed-card-${bed.id}`}
              className={`bg-white rounded-xl border transition-all duration-200 p-4 shadow-xs hover:shadow-md flex flex-col justify-between ${
                isOccupied
                  ? 'border-blue-200 hover:border-blue-400'
                  : isAvailable
                  ? 'border-emerald-200 hover:border-emerald-400'
                  : 'border-slate-200'
              }`}
            >
              <div>
                {/* Bed Card Header */}
                <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {bed.bedNumber}
                      </span>
                      <span className="text-xs text-slate-500">
                        {bed.roomNumber}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span>{bed.department} • Floor {bed.floor}</span>
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(bed.status)}
                  </div>
                </div>

                {/* Patient Information & Telemetry (if occupied) */}
                {isOccupied ? (
                  <div className="py-3 space-y-3">
                    <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/80">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-500 font-medium">Admitted Patient</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {privacyMode ? 'MRN-••••••' : bed.patientMrn}
                        </span>
                      </div>
                      <div className={`font-bold text-sm text-slate-900 ${privacyMode ? 'phi-blur' : ''}`}>
                        {bed.patientName}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Stethoscope className="w-3 h-3 text-blue-500" />
                          {bed.assignedDoctor}
                        </span>
                        <span>•</span>
                        <span>Since {bed.admittedAt}</span>
                      </div>
                    </div>

                    {/* Live Telemetry Strip */}
                    {bed.telemetry && (
                      <div className="bg-slate-900 text-white rounded-lg p-2.5">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5 pb-1 border-b border-slate-800">
                          <span className="flex items-center gap-1 text-emerald-400 font-medium">
                            <Activity className="w-3 h-3 animate-pulse" />
                            Live Bedside Telemetry
                          </span>
                          <span className="text-slate-400 font-mono">
                            {bed.telemetry.lastUpdated}
                          </span>
                        </div>

                        <div className="grid grid-cols-4 gap-1.5 text-center">
                          <div className="bg-slate-800/80 rounded p-1">
                            <div className="text-[10px] text-slate-400 flex items-center justify-center gap-0.5">
                              <Heart className="w-2.5 h-2.5 text-red-400" /> HR
                            </div>
                            <div className="text-xs font-bold text-red-400 font-mono">
                              {bed.telemetry.heartRate} <span className="text-[8px] font-normal text-slate-400">bpm</span>
                            </div>
                          </div>

                          <div className="bg-slate-800/80 rounded p-1">
                            <div className="text-[10px] text-slate-400 flex items-center justify-center gap-0.5">
                              BP
                            </div>
                            <div className="text-xs font-bold text-cyan-300 font-mono">
                              {bed.telemetry.bloodPressure}
                            </div>
                          </div>

                          <div className="bg-slate-800/80 rounded p-1">
                            <div className="text-[10px] text-slate-400 flex items-center justify-center gap-0.5">
                              SpO2
                            </div>
                            <div className="text-xs font-bold text-emerald-400 font-mono">
                              {bed.telemetry.oxygenSat}%
                            </div>
                          </div>

                          <div className="bg-slate-800/80 rounded p-1">
                            <div className="text-[10px] text-slate-400 flex items-center justify-center gap-0.5">
                              <Thermometer className="w-2.5 h-2.5 text-amber-400" /> Temp
                            </div>
                            <div className="text-xs font-bold text-amber-300 font-mono">
                              {bed.telemetry.temperature}°
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {bed.notes && (
                      <p className="text-[11px] text-slate-500 italic bg-amber-50/50 p-2 rounded border border-amber-100">
                        {bed.notes}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    {isAvailable ? (
                      <div className="space-y-1.5">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-semibold text-emerald-700">
                          Bed Ready for Inpatient Admission
                        </p>
                        <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                          {bed.notes || 'Equipped for department care protocols.'}
                        </p>
                      </div>
                    ) : isCleaning ? (
                      <div className="space-y-1.5">
                        <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                          <Sparkles className="w-5 h-5 animate-spin" />
                        </div>
                        <p className="text-xs font-semibold text-amber-700">
                          Terminal Sanitization in Progress
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Disinfection protocol pending sign-off.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
                          <Clock className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-semibold text-slate-700">
                          Bed Offline
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {bed.notes || 'Facility inspection in progress.'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                {isAvailable && currentUser.canManageBeds && (
                  <button
                    id={`admit-btn-${bed.id}`}
                    onClick={() => {
                      setAdmitModalBed(bed);
                      setSelectedPatientId(eligiblePatients[0]?.id || '');
                    }}
                    className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Admit Patient</span>
                  </button>
                )}

                {isOccupied && currentUser.canManageBeds && (
                  <>
                    <button
                      id={`transfer-btn-${bed.id}`}
                      onClick={() => {
                        setTransferModalBed(bed);
                        setTransferTargetBedId(availableBeds[0]?.id || '');
                      }}
                      className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ArrowRightLeft className="w-3 h-3 text-slate-500" />
                      <span>Transfer</span>
                    </button>

                    <button
                      id={`discharge-btn-${bed.id}`}
                      onClick={() => setDischargeModalBed(bed)}
                      className="flex-1 py-1.5 px-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Discharge</span>
                    </button>
                  </>
                )}

                {isCleaning && currentUser.canManageBeds && (
                  <button
                    id={`sanitize-btn-${bed.id}`}
                    onClick={() => onSanitize(bed.id)}
                    className="w-full py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Mark Sanitized & Ready</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ADMISSION MODAL */}
      {admitModalBed && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Inpatient Bed Admission
                </h3>
                <p className="text-xs text-slate-500">
                  Assigning to {admitModalBed.bedNumber} ({admitModalBed.department})
                </p>
              </div>
              <button 
                onClick={() => setAdmitModalBed(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdmitSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Patient
                </label>
                <select
                  id="admit-patient-select"
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900"
                  required
                >
                  {eligiblePatients.length === 0 ? (
                    <option value="">No patients pending admission</option>
                  ) : (
                    eligiblePatients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.mrn}) • Status: {p.admissionStatus}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                    Charge Nurse
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
                  Admission Notes & Clinical Protocol
                </label>
                <textarea
                  rows={2}
                  value={admitNotes}
                  onChange={(e) => setAdmitNotes(e.target.value)}
                  placeholder="e.g. Telemetry protocol initiated; cardiac diet; fall risk precautions"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdmitModalBed(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="confirm-admit-btn"
                  type="submit"
                  disabled={isProcessing || !selectedPatientId}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg cursor-pointer"
                >
                  {isProcessing ? 'Processing...' : 'Confirm Admission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISCHARGE MODAL */}
      {dischargeModalBed && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Process Patient Discharge
                </h3>
                <p className="text-xs text-slate-500">
                  {dischargeModalBed.patientName} from {dischargeModalBed.bedNumber}
                </p>
              </div>
              <button 
                onClick={() => setDischargeModalBed(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDischargeSubmit} className="space-y-3.5">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
                Discharging this patient will automatically mark bed <strong>{dischargeModalBed.bedNumber}</strong> as sanitizing for terminal disinfection.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Discharge Summary & Instructions
                </label>
                <textarea
                  id="discharge-summary-input"
                  rows={3}
                  value={dischargeNotes}
                  onChange={(e) => setDischargeNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDischargeModalBed(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="confirm-discharge-btn"
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg cursor-pointer"
                >
                  {isProcessing ? 'Discharging...' : 'Confirm Discharge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSFER MODAL */}
      {transferModalBed && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Ward Bed Transfer
                </h3>
                <p className="text-xs text-slate-500">
                  Transfer {transferModalBed.patientName} from {transferModalBed.bedNumber}
                </p>
              </div>
              <button 
                onClick={() => setTransferModalBed(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Destination Available Bed
                </label>
                <select
                  id="transfer-destination-select"
                  value={transferTargetBedId}
                  onChange={(e) => setTransferTargetBedId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900"
                  required
                >
                  {availableBeds.length === 0 ? (
                    <option value="">No available beds found in facility</option>
                  ) : (
                    availableBeds.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bedNumber} ({b.department} • Floor {b.floor})
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
                  onClick={() => setTransferModalBed(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="confirm-transfer-btn"
                  type="submit"
                  disabled={isProcessing || !transferTargetBedId}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg cursor-pointer"
                >
                  {isProcessing ? 'Transferring...' : 'Execute Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
