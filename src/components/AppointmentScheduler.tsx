import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Sparkles, 
  UserCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Search, 
  Stethoscope, 
  Building2,
  CalendarCheck,
  ChevronRight,
  Filter
} from 'lucide-react';
import { Appointment, AppointmentStatus, AppointmentUrgency, Patient, UserProfile } from '../types';

interface AppointmentSchedulerProps {
  appointments: Appointment[];
  patients: Patient[];
  currentUser: UserProfile;
  privacyMode: boolean;
  onAutoSchedule: (patientId: string, symptoms: string, urgency: string, doctor?: string) => Promise<any>;
  onManualSchedule: (data: any) => Promise<void>;
  onUpdateStatus: (appointmentId: string, status: AppointmentStatus) => Promise<void>;
}

export const AppointmentScheduler: React.FC<AppointmentSchedulerProps> = ({
  appointments,
  patients,
  currentUser,
  privacyMode,
  onAutoSchedule,
  onManualSchedule,
  onUpdateStatus
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'auto-triage' | 'manual'>('list');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Auto-Triage Form State
  const [triagePatientId, setTriagePatientId] = useState<string>(patients[0]?.id || '');
  const [symptoms, setSymptoms] = useState<string>('');
  const [reportedUrgency, setReportedUrgency] = useState<AppointmentUrgency>('Urgent');
  const [preferredDoctor, setPreferredDoctor] = useState<string>('');
  const [isAutoScheduling, setIsAutoScheduling] = useState(false);
  const [triageResult, setTriageResult] = useState<any | null>(null);

  // Manual Form State
  const [manualPatientId, setManualPatientId] = useState<string>(patients[0]?.id || '');
  const [manualDoctor, setManualDoctor] = useState<string>('Dr. Evelyn Reed');
  const [manualSpecialty, setManualSpecialty] = useState<string>('Cardiology');
  const [manualDateTime, setManualDateTime] = useState<string>('2026-09-18 10:00');
  const [manualUrgency, setManualUrgency] = useState<AppointmentUrgency>('Routine');
  const [manualReason, setManualReason] = useState<string>('');
  const [manualRoom, setManualRoom] = useState<string>('Consult Room 102');
  const [isManualSubmitting, setIsManualSubmitting] = useState(false);

  const filteredAppointments = appointments.filter((apt) => {
    const matchesStatus = statusFilter === 'All' || apt.status === statusFilter;
    const matchesSearch = 
      apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.patientMrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleAutoScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!triagePatientId || !symptoms.trim()) return;
    try {
      setIsAutoScheduling(true);
      const res = await onAutoSchedule(triagePatientId, symptoms, reportedUrgency, preferredDoctor || undefined);
      setTriageResult(res);
      setSymptoms('');
    } finally {
      setIsAutoScheduling(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPatientId || !manualDateTime || !manualReason.trim()) return;
    try {
      setIsManualSubmitting(true);
      await onManualSchedule({
        patientId: manualPatientId,
        doctorName: manualDoctor,
        specialty: manualSpecialty,
        dateTime: manualDateTime,
        urgency: manualUrgency,
        reasonForVisit: manualReason,
        room: manualRoom
      });
      setActiveTab('list');
      setManualReason('');
    } finally {
      setIsManualSubmitting(false);
    }
  };

  const getUrgencyBadge = (urgency: AppointmentUrgency) => {
    switch (urgency) {
      case 'Emergency':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">Emergency</span>;
      case 'Urgent':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">Urgent</span>;
      case 'Routine':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Routine</span>;
    }
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'Scheduled':
        return <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">Scheduled</span>;
      case 'Checked-In':
        return <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">Checked-In</span>;
      case 'In-Consultation':
        return <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">In-Consultation</span>;
      case 'Completed':
        return <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Completed</span>;
      case 'Cancelled':
        return <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Cancelled</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Tab Navigation */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Intelligent Appointment Scheduling & Triage System
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated algorithm coordinates provider availability, acuity triage score, and clinic room allocation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="view-schedule-tab"
            onClick={() => setActiveTab('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'list'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            All Appointments ({appointments.length})
          </button>

          <button
            id="auto-triage-tab"
            onClick={() => {
              setActiveTab('auto-triage');
              setTriageResult(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'auto-triage'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Automated Triage</span>
          </button>

          <button
            id="manual-book-tab"
            onClick={() => setActiveTab('manual')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
              activeTab === 'manual'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manual Booking</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: APPOINTMENTS LIST & STATUS MANAGEMENT */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="search-appointments-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by patient name, MRN, doctor, or specialty..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 shrink-0">
                <Filter className="w-3.5 h-3.5" />
                Filter:
              </span>
              <select
                id="appointment-status-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-blue-500"
              >
                <option value="All">All Statuses</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Checked-In">Checked-In</option>
                <option value="In-Consultation">In-Consultation</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Appointments Table / Cards */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="divide-y divide-slate-100">
              {filteredAppointments.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No appointments found matching your search.
                </div>
              ) : (
                filteredAppointments.map((apt) => (
                  <div 
                    key={apt.id} 
                    id={`appointment-card-${apt.id}`}
                    className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {apt.dateTime}
                        </span>
                        <span className={`font-bold text-sm text-slate-900 ${privacyMode ? 'phi-blur' : ''}`}>
                          {apt.patientName}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          ({privacyMode ? 'MRN-••••••' : apt.patientMrn})
                        </span>
                        {getUrgencyBadge(apt.urgency)}
                        {getStatusBadge(apt.status)}
                      </div>

                      <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1 font-semibold text-slate-800">
                          <Stethoscope className="w-3.5 h-3.5 text-blue-500" />
                          {apt.doctorName}
                        </span>
                        <span>•</span>
                        <span>{apt.specialty}</span>
                        <span>•</span>
                        <span className="text-slate-500">{apt.room}</span>
                        <span>•</span>
                        <span className="text-[11px] text-purple-600 font-medium">
                          Method: {apt.scheduledMethod}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 italic">
                        Reason: {apt.reasonForVisit}
                      </p>
                    </div>

                    {/* Quick Status Modifiers */}
                    <div className="flex items-center gap-2 shrink-0">
                      {apt.status === 'Scheduled' && (
                        <button
                          id={`check-in-btn-${apt.id}`}
                          onClick={() => onUpdateStatus(apt.id, 'Checked-In')}
                          className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Check In
                        </button>
                      )}

                      {apt.status === 'Checked-In' && (
                        <button
                          id={`start-consult-btn-${apt.id}`}
                          onClick={() => onUpdateStatus(apt.id, 'In-Consultation')}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Begin Consult
                        </button>
                      )}

                      {apt.status === 'In-Consultation' && (
                        <button
                          id={`complete-apt-btn-${apt.id}`}
                          onClick={() => onUpdateStatus(apt.id, 'Completed')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                        >
                          Complete Visit
                        </button>
                      )}

                      {apt.status !== 'Completed' && apt.status !== 'Cancelled' && (
                        <button
                          id={`cancel-apt-btn-${apt.id}`}
                          onClick={() => onUpdateStatus(apt.id, 'Cancelled')}
                          className="px-2.5 py-1.5 text-slate-400 hover:text-red-600 text-xs transition-colors cursor-pointer"
                          title="Cancel appointment"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: AUTOMATED TRIAGE SCHEDULER ENGINE */}
      {activeTab === 'auto-triage' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Automated Clinical Triage & Slot Matching
                </h3>
                <p className="text-xs text-slate-500">
                  Synthesizes chief complaint, urgency level, and specialty doctor capacity.
                </p>
              </div>
            </div>

            <form onSubmit={handleAutoScheduleSubmit} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Patient
                </label>
                <select
                  id="triage-patient-select"
                  value={triagePatientId}
                  onChange={(e) => setTriagePatientId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900"
                  required
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.mrn}) • Status: {p.admissionStatus}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reported Symptoms & Chief Complaint
                </label>
                <textarea
                  id="triage-symptoms-input"
                  rows={3}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="e.g. Acute retrosternal chest pain with left arm radiation, shortness of breath, and diaphoresis for 2 hours..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-purple-500"
                  required
                />
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-slate-400">Quick Test Scenarios:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSymptoms('Severe chest tightness, palpitations, and elevated BP');
                      setReportedUrgency('Urgent');
                    }}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded cursor-pointer"
                  >
                    Cardiology
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSymptoms('Suspected closed displaced right tibia fracture following bicycle crash');
                      setReportedUrgency('Emergency');
                    }}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded cursor-pointer"
                  >
                    Orthopedics
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSymptoms('Productive cough with yellow sputum, low-grade fever, mild wheezing');
                      setReportedUrgency('Routine');
                    }}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded cursor-pointer"
                  >
                    Pulmonology
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Patient Reported Urgency
                  </label>
                  <select
                    value={reportedUrgency}
                    onChange={(e) => setReportedUrgency(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900"
                  >
                    <option value="Routine">Routine (Non-urgent follow-up)</option>
                    <option value="Urgent">Urgent (Needs attention within 24h)</option>
                    <option value="Emergency">Emergency (Immediate clinical triage)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Preferred Doctor (Optional)
                  </label>
                  <select
                    value={preferredDoctor}
                    onChange={(e) => setPreferredDoctor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900"
                  >
                    <option value="">Auto-Assign Optimal Specialist</option>
                    <option value="Dr. Evelyn Reed">Dr. Evelyn Reed (Cardiology)</option>
                    <option value="Dr. Samantha Wu">Dr. Samantha Wu (Pulmonology)</option>
                    <option value="Dr. Arthur Nolan">Dr. Arthur Nolan (Orthopedic Surgery)</option>
                    <option value="Dr. Kenneth Thorne">Dr. Kenneth Thorne (Emergency)</option>
                  </select>
                </div>
              </div>

              <button
                id="run-auto-schedule-btn"
                type="submit"
                disabled={isAutoScheduling || !symptoms.trim()}
                className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                {isAutoScheduling ? (
                  <span>Evaluating Clinical Triage Model...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run Automated Triage & Book Slot</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Triage Decision Output Card */}
          <div className="lg:col-span-5 space-y-4">
            {triageResult ? (
              <div className="bg-white rounded-xl border border-purple-200 p-5 shadow-xs space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-purple-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="font-bold text-sm text-slate-900">
                      Optimal Appointment Confirmed!
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-bold">
                    Score: {triageResult.triageDetails.score}/10
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Scheduled For:</span>
                      <strong className="text-blue-700 font-mono">{triageResult.appointment.dateTime}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Assigned Provider:</span>
                      <strong className="text-slate-800">{triageResult.appointment.doctorName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Department Specialty:</span>
                      <span className="font-semibold text-purple-700">{triageResult.appointment.specialty}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Room / Bay:</span>
                      <span className="text-slate-700">{triageResult.appointment.room}</span>
                    </div>
                  </div>

                  <div className="bg-purple-50/70 p-3 rounded-lg border border-purple-100 text-purple-950">
                    <strong className="block text-[11px] uppercase tracking-wider text-purple-700 mb-1">
                      Algorithmic Triage Rationale
                    </strong>
                    <p className="text-xs leading-relaxed">
                      {triageResult.triageDetails.reasoning}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('list')}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  View in Master Schedule
                </button>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-xs">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-purple-400 opacity-60" />
                <p className="font-semibold text-slate-600 mb-1">
                  No Active Triage Evaluation
                </p>
                <p className="text-[11px] leading-relaxed">
                  Enter symptoms and submit the form to let the automated triage algorithm evaluate acuity and book the optimal slot.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: MANUAL BOOKING FORM */}
      {activeTab === 'manual' && (
        <div className="max-w-2xl mx-auto bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Manual Provider Booking
          </h3>
          <p className="text-xs text-slate-500 mb-5">
            Manually reserve a specific doctor slot and clinic room.
          </p>

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Patient
              </label>
              <select
                value={manualPatientId}
                onChange={(e) => setManualPatientId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900"
                required
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.mrn}) • Status: {p.admissionStatus}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Doctor Name
                </label>
                <select
                  value={manualDoctor}
                  onChange={(e) => setManualDoctor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                >
                  <option value="Dr. Evelyn Reed">Dr. Evelyn Reed (Cardiology)</option>
                  <option value="Dr. Samantha Wu">Dr. Samantha Wu (Pulmonology)</option>
                  <option value="Dr. Arthur Nolan">Dr. Arthur Nolan (Orthopedic Surgery)</option>
                  <option value="Dr. Kenneth Thorne">Dr. Kenneth Thorne (Emergency)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Specialty
                </label>
                <input
                  type="text"
                  value={manualSpecialty}
                  onChange={(e) => setManualSpecialty(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Date & Time
                </label>
                <input
                  type="text"
                  value={manualDateTime}
                  onChange={(e) => setManualDateTime(e.target.value)}
                  placeholder="YYYY-MM-DD HH:MM"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Urgency Level
                </label>
                <select
                  value={manualUrgency}
                  onChange={(e) => setManualUrgency(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                >
                  <option value="Routine">Routine</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Consultation Room / Clinic Location
              </label>
              <input
                type="text"
                value={manualRoom}
                onChange={(e) => setManualRoom(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reason for Visit
              </label>
              <textarea
                rows={2}
                value={manualReason}
                onChange={(e) => setManualReason(e.target.value)}
                placeholder="e.g. Post-operative stitch removal and wound inspection"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isManualSubmitting}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg cursor-pointer shadow-xs"
              >
                {isManualSubmitting ? 'Booking...' : 'Confirm Appointment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
