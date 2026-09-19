import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Stethoscope, 
  Plus, 
  Zap, 
  AlertCircle, 
  CheckCircle2, 
  Activity, 
  Building2, 
  DoorOpen, 
  ChevronRight,
  Filter,
  Search,
  SlidersHorizontal,
  CalendarDays
} from 'lucide-react';
import { Appointment, Patient, UserProfile } from '../types';

interface AppointmentSchedulerProps {
  appointments: Appointment[];
  patients: Patient[];
  currentUser: UserProfile;
  privacyMode: boolean;
  onAutoSchedule?: (triageData: any) => Promise<any>;
  onManualSchedule?: (appointmentData: any) => Promise<void>;
  onBookAppointment?: (appointmentData: any) => Promise<void>;
  onAutomatedTriage?: (triageData: any) => Promise<any>;
  onUpdateStatus: (appointmentId: string, status: any) => Promise<void>;
}

export const AppointmentScheduler: React.FC<AppointmentSchedulerProps> = ({
  appointments,
  patients,
  currentUser,
  privacyMode,
  onAutoSchedule,
  onManualSchedule,
  onBookAppointment,
  onAutomatedTriage,
  onUpdateStatus
}) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'triage' | 'new'>('schedule');
  const [filterDepartment, setFilterDepartment] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Automated triage state
  const [triagePatientId, setTriagePatientId] = useState<string>(patients[0]?.id || '');
  const [chiefComplaint, setChiefComplaint] = useState<string>('');
  const [triageSymptoms, setTriageSymptoms] = useState<string>('');
  const [isTriaging, setIsTriaging] = useState<boolean>(false);
  const [triageResult, setTriageResult] = useState<any | null>(null);

  // Manual booking state
  const [bookPatientId, setBookPatientId] = useState<string>(patients[0]?.id || '');
  const [bookDoctor, setBookDoctor] = useState<string>('Dr. Evelyn Reed, MD');
  const [bookDepartment, setBookDepartment] = useState<string>('Cardiology');
  const [bookDate, setBookDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [bookTime, setBookTime] = useState<string>('14:30');
  const [bookReason, setBookReason] = useState<string>('Routine follow-up');
  const [bookRoom, setBookRoom] = useState<string>('Clinic 204');
  const [isBooking, setIsBooking] = useState<boolean>(false);

  const departments = ['All', 'Cardiology', 'Pulmonology', 'Neurology', 'Internal Medicine', 'General Surgery', 'Orthopedics'];

  const filteredAppointments = appointments.filter((apt) => {
    const matchesDept = filterDepartment === 'All' || apt.department === filterDepartment;
    const matchesStatus = filterStatus === 'All' || apt.status === filterStatus;
    return matchesDept && matchesStatus;
  });

  const handleRunTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chiefComplaint.trim()) return;
    try {
      setIsTriaging(true);
      const triageFn = onAutoSchedule || onAutomatedTriage;
      if (!triageFn) return;
      const res = await triageFn({
        patientId: triagePatientId,
        chiefComplaint,
        symptoms: triageSymptoms.split(',').map(s => s.trim()).filter(Boolean)
      });
      setTriageResult(res);
    } finally {
      setIsTriaging(false);
    }
  };

  const handleAcceptTriageBooking = async () => {
    if (!triageResult) return;
    const bookFn = onManualSchedule || onBookAppointment;
    if (bookFn) {
      await bookFn({
        patientId: triageResult.suggestedAppointment.patientId,
        doctorName: triageResult.suggestedAppointment.doctorName,
        department: triageResult.suggestedAppointment.department,
        date: triageResult.suggestedAppointment.date,
        time: triageResult.suggestedAppointment.time,
        reasonForVisit: triageResult.suggestedAppointment.reasonForVisit,
        room: triageResult.suggestedAppointment.room,
        triagePriorityScore: triageResult.priorityScore,
        scheduledMethod: 'Automated'
      });
    }
    setTriageResult(null);
    setChiefComplaint('');
    setTriageSymptoms('');
    setActiveTab('schedule');
  };

  const handleManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsBooking(true);
      const bookFn = onManualSchedule || onBookAppointment;
      if (bookFn) {
        await bookFn({
          patientId: bookPatientId,
          doctorName: bookDoctor,
          department: bookDepartment,
          date: bookDate,
          time: bookTime,
          reasonForVisit: bookReason,
          room: bookRoom,
          triagePriorityScore: 5,
          scheduledMethod: 'Manual'
        });
      }
      setActiveTab('schedule');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Ribbon Bar */}
      <div className="bg-white rounded-xl border border-[#D5DDD9] p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 tracking-tight font-sans">
              Kaze Hospital Clinic Operations & Triage Dispatch
            </h2>
            <span className="text-[10px] font-mono-clinical font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
              ESI LEVEL 1-5 ENGINE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-sans">
            Algorithm-driven acuity scoring, emergency room diversion, and automated clinical schedule coordination.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-[#F2F5F4] p-1 rounded-lg border border-[#E2E8E5] shrink-0">
          <button
            id="view-schedule-tab"
            onClick={() => setActiveTab('schedule')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'schedule'
                ? 'bg-[#0E2C27] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Master Schedule ({appointments.length})</span>
          </button>

          <button
            id="view-triage-tab"
            onClick={() => setActiveTab('triage')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'triage'
                ? 'bg-[#0E2C27] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Automated Triage Engine</span>
          </button>

          <button
            id="view-manual-booking-tab"
            onClick={() => setActiveTab('new')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'new'
                ? 'bg-[#0E2C27] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manual Slot Booking</span>
          </button>
        </div>
      </div>

      {/* TAB 1: MASTER SCHEDULE */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          {/* Department & Status Filters */}
          <div className="bg-white rounded-xl border border-[#D5DDD9] p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-xs text-slate-400 font-mono-clinical mr-1">DEPT:</span>
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setFilterDepartment(dept)}
                  className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                    filterDepartment === dept
                      ? 'bg-[#0E2C27] text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono-clinical">STATUS:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-hidden focus:border-[#0E2C27]"
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

          {/* Appointments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAppointments.map((apt) => {
              const patient = patients.find(p => p.id === apt.patientId);

              return (
                <div
                  key={apt.id}
                  id={`apt-card-${apt.id}`}
                  className="bg-white rounded-xl border border-[#D5DDD9] p-4 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Time, Acuity, Status */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-[#E2E8E5] mb-3">
                      <div className="flex items-center gap-1.5 text-slate-900 font-mono-clinical font-bold text-xs">
                        <Clock className="w-3.5 h-3.5 text-[#1D7A68]" />
                        <span>{apt.time}</span>
                        <span className="text-slate-400 font-normal">• {apt.date}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-mono-clinical font-bold px-1.5 py-0.2 rounded ${
                          apt.triagePriorityScore >= 8 
                            ? 'bg-rose-100 text-rose-800' 
                            : apt.triagePriorityScore >= 6 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          ESI Score: {apt.triagePriorityScore}
                        </span>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          apt.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : apt.status === 'In-Consultation'
                            ? 'bg-blue-100 text-blue-800 animate-pulse'
                            : apt.status === 'Checked-In'
                            ? 'bg-purple-100 text-purple-800'
                            : apt.status === 'Cancelled'
                            ? 'bg-slate-200 text-slate-500'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {apt.status}
                        </span>
                      </div>
                    </div>

                    {/* Patient & Room Details */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className={`font-bold text-sm text-slate-900 ${privacyMode ? 'phi-blur' : ''}`}>
                            {apt.patientName}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono-clinical">
                            {privacyMode ? 'MRN-••••••' : apt.patientMrn}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] font-mono-clinical text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {apt.room}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 bg-[#F8FAF9] p-2.5 rounded-lg border border-[#E2E8E5] text-xs">
                        <div className="text-slate-500 text-[10px] font-mono-clinical uppercase">REASON FOR VISIT</div>
                        <p className="text-slate-800 font-medium mt-0.5 line-clamp-2">{apt.reasonForVisit}</p>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-xs text-slate-600">
                        <span className="font-semibold text-slate-800">{apt.doctorName}</span>
                        <span className="text-[11px] text-[#1D7A68] font-medium">{apt.department}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Progression Workflow */}
                  <div className="mt-4 pt-3 border-t border-[#E2E8E5] flex items-center justify-between gap-1.5 text-xs">
                    <span className="text-[10px] text-slate-400 font-mono-clinical uppercase">
                      {apt.scheduledMethod} Intake
                    </span>

                    <div className="flex items-center gap-1">
                      {apt.status === 'Scheduled' && (
                        <button
                          onClick={() => onUpdateStatus(apt.id, 'Checked-In')}
                          className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded text-xs font-semibold cursor-pointer"
                        >
                          Check-In
                        </button>
                      )}

                      {apt.status === 'Checked-In' && (
                        <button
                          onClick={() => onUpdateStatus(apt.id, 'In-Consultation')}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded text-xs font-semibold cursor-pointer"
                        >
                          Begin Consult
                        </button>
                      )}

                      {apt.status === 'In-Consultation' && (
                        <button
                          onClick={() => onUpdateStatus(apt.id, 'Completed')}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-xs font-bold cursor-pointer"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: AUTOMATED TRIAGE ENGINE */}
      {activeTab === 'triage' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-6 bg-white rounded-xl border border-[#D5DDD9] p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <div className="p-2 bg-[#E7F2EE] text-[#0E2C27] rounded-lg">
                <Zap className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-sans">
                  Automated Clinical Triage & Specialist Matcher
                </h3>
                <p className="text-xs text-slate-500 font-sans">
                  Analyzes symptoms to compute Emergency Severity Index (ESI) priority and allocate consultation slots.
                </p>
              </div>
            </div>

            <form onSubmit={handleRunTriage} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Patient Under Evaluation
                </label>
                <select
                  value={triagePatientId}
                  onChange={(e) => setTriagePatientId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900"
                  required
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.mrn}) • Age: {new Date().getFullYear() - parseInt(p.dob.split('-')[0])}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primary Chief Complaint / Presentation
                </label>
                <input
                  id="chief-complaint-input"
                  type="text"
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder="e.g. Sudden onset substernal chest pressure radiating to left jaw, diaphoresis"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Secondary Associated Symptoms (comma separated)
                </label>
                <input
                  type="text"
                  value={triageSymptoms}
                  onChange={(e) => setTriageSymptoms(e.target.value)}
                  placeholder="e.g. shortness of breath, nausea, palpitations"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900"
                />
              </div>

              <button
                id="run-triage-btn"
                type="submit"
                disabled={isTriaging || !chiefComplaint.trim()}
                className="w-full py-2.5 px-4 bg-[#0E2C27] hover:bg-[#14443C] text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isTriaging ? (
                  <span>Evaluating Clinical Severity...</span>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-emerald-300" />
                    <span>Run Clinical Triage Algorithm</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Triage Recommendation Output */}
          <div className="lg:col-span-6">
            {triageResult ? (
              <div className="bg-white rounded-xl border border-emerald-300 p-5 shadow-md space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <h4 className="font-bold text-sm text-slate-900">
                      Triage Recommendation Computed
                    </h4>
                  </div>
                  <span className={`font-mono-clinical font-bold text-xs px-2.5 py-1 rounded ${
                    triageResult.priorityScore >= 8 
                      ? 'bg-rose-100 text-rose-800' 
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    Priority Acuity: {triageResult.priorityScore}/10
                  </span>
                </div>

                <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
                  <strong className="block text-emerald-900 font-semibold">Algorithmic Clinical Rationale:</strong>
                  <p>{triageResult.recommendationReason}</p>
                </div>

                {/* Proposed Slot Dossier */}
                <div className="bg-[#F8FAF9] p-4 rounded-xl border border-[#D5DDD9] space-y-2 text-xs">
                  <div className="text-[10px] text-slate-400 font-mono-clinical uppercase">OPTIMIZED CLINICAL DISPATCH</div>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Recommended Attending:</span>
                      <strong className="text-slate-900">{triageResult.suggestedAppointment.doctorName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Department Specialty:</span>
                      <strong className="text-[#1D7A68]">{triageResult.suggestedAppointment.department}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Scheduled Window:</span>
                      <strong className="text-slate-900">{triageResult.suggestedAppointment.date} at {triageResult.suggestedAppointment.time}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Assigned Suite:</span>
                      <strong className="text-slate-900">{triageResult.suggestedAppointment.room}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setTriageResult(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                  >
                    Dismiss
                  </button>

                  <button
                    id="accept-triage-booking-btn"
                    onClick={handleAcceptTriageBooking}
                    className="px-5 py-2 text-xs font-bold text-white bg-[#0E2C27] hover:bg-[#14443C] rounded-lg cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Confirm & Book Appointment</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[#F8FAF9] rounded-xl border border-[#D5DDD9] p-8 text-center text-slate-400">
                <Activity className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <h4 className="font-semibold text-slate-700 text-sm">No Active Triage Evaluation</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                  Fill in the patient chief complaint to let the Kaze Hospital triage algorithm calculate acuity scores and match providers.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MANUAL BOOKING */}
      {activeTab === 'new' && (
        <div className="max-w-2xl mx-auto bg-white rounded-xl border border-[#D5DDD9] p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <div className="p-2 bg-slate-100 text-slate-800 rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-sans">
                Manual Clinic Appointment Booking
              </h3>
              <p className="text-xs text-slate-500 font-sans">
                Direct provider booking for planned outpatient follow-ups and diagnostic encounters.
              </p>
            </div>
          </div>

          <form onSubmit={handleManualBooking} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Patient Subject
              </label>
              <select
                value={bookPatientId}
                onChange={(e) => setBookPatientId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                required
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.mrn}) • DOB: {p.dob}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Attending Specialist
                </label>
                <input
                  type="text"
                  value={bookDoctor}
                  onChange={(e) => setBookDoctor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Department
                </label>
                <select
                  value={bookDepartment}
                  onChange={(e) => setBookDepartment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                >
                  <option value="Cardiology">Cardiology</option>
                  <option value="Pulmonology">Pulmonology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Internal Medicine">Internal Medicine</option>
                  <option value="General Surgery">General Surgery</option>
                  <option value="Orthopedics">Orthopedics</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Encounter Date
                </label>
                <input
                  type="date"
                  value={bookDate}
                  onChange={(e) => setBookDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={bookTime}
                  onChange={(e) => setBookTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Clinic Room
                </label>
                <input
                  type="text"
                  value={bookRoom}
                  onChange={(e) => setBookRoom(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reason for Visit / Order Details
              </label>
              <textarea
                rows={3}
                value={bookReason}
                onChange={(e) => setBookReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                required
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('schedule')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isBooking}
                className="px-5 py-2 text-xs font-bold text-white bg-[#0E2C27] hover:bg-[#14443C] rounded-lg cursor-pointer shadow-xs"
              >
                {isBooking ? 'Registering Slot...' : 'Schedule Appointment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
