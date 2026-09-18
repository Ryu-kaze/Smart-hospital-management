/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bed as BedIcon, 
  FileText, 
  Calendar, 
  CreditCard, 
  ShieldCheck, 
  Activity, 
  AlertTriangle,
  RefreshCw,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { Header } from './components/Header';
import { LockScreen } from './components/LockScreen';
import { BreakGlassModal } from './components/BreakGlassModal';
import { BedTracker } from './components/BedTracker';
import { PatientRecords } from './components/PatientRecords';
import { AppointmentScheduler } from './components/AppointmentScheduler';
import { InsuranceBilling } from './components/InsuranceBilling';
import { AuditTrail } from './components/AuditTrail';
import { SYSTEM_USERS } from './data/mockUsers';
import { 
  Bed, 
  Patient, 
  Appointment, 
  InsuranceClaim, 
  AuditLog, 
  HospitalStats, 
  UserProfile,
  DecryptedMedicalHistory,
  AppointmentStatus 
} from './types';

const AUTO_LOCK_SECONDS = 180; // 3 minutes idle auto-lock for HIPAA compliance

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(SYSTEM_USERS[0]);
  const [activeTab, setActiveTab] = useState<'beds' | 'patients' | 'appointments' | 'billing' | 'audit'>('beds');

  // Application Data States
  const [beds, setBeds] = useState<Bed[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<HospitalStats | null>(null);

  // Security & Compliance States
  const [privacyMode, setPrivacyMode] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [secondsUntilLock, setSecondsUntilLock] = useState<number>(AUTO_LOCK_SECONDS);
  const [isBreakGlassOpen, setIsBreakGlassOpen] = useState<boolean>(false);

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch all initial data from backend APIs
  const fetchAllData = useCallback(async () => {
    try {
      const [bedsRes, patientsRes, appointmentsRes, claimsRes, auditRes, statsRes] = await Promise.all([
        fetch('/api/beds'),
        fetch('/api/patients'),
        fetch('/api/appointments'),
        fetch('/api/billing/claims'),
        fetch('/api/audit-logs'),
        fetch('/api/stats')
      ]);

      if (bedsRes.ok) setBeds(await bedsRes.json());
      if (patientsRes.ok) setPatients(await patientsRes.json());
      if (appointmentsRes.ok) setAppointments(await appointmentsRes.json());
      if (claimsRes.ok) setClaims(await claimsRes.json());
      if (auditRes.ok) setAuditLogs(await auditRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (err) {
      console.error('Error loading hospital operational data:', err);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Activity listener to reset auto-lock timer
  const resetLockTimer = useCallback(() => {
    if (!isLocked) {
      setSecondsUntilLock(AUTO_LOCK_SECONDS);
    }
  }, [isLocked]);

  useEffect(() => {
    const handleUserActivity = () => resetLockTimer();
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('click', handleUserActivity);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
    };
  }, [resetLockTimer]);

  // Countdown timer for workstation lock
  useEffect(() => {
    if (isLocked) return;
    const interval = setInterval(() => {
      setSecondsUntilLock((prev) => {
        if (prev <= 1) {
          setIsLocked(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLocked]);

  // Toggle Screen Privacy Shield
  const handleTogglePrivacy = () => {
    const newMode = !privacyMode;
    setPrivacyMode(newMode);
    showToast(
      newMode ? 'Privacy Shield activated: Protected Health Information blurred on-screen.' : 'Privacy Shield deactivated.',
      'info'
    );
  };

  // --- Clinical Actions ---

  // Bed Admit
  const handleAdmitPatient = async (bedId: string, patientId: string, doctor: string, nurse: string, notes: string) => {
    const res = await fetch('/api/beds/admit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bedId,
        patientId,
        doctorName: doctor,
        nurseName: nurse,
        notes,
        actorName: currentUser.name,
        actorRole: currentUser.role
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to admit patient');
    }
    await fetchAllData();
    showToast('Patient successfully admitted and bed telemetry monitor initiated.');
  };

  // Bed Discharge
  const handleDischargePatient = async (bedId: string, notes: string) => {
    const res = await fetch('/api/beds/discharge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bedId,
        clinicalNotes: notes,
        actorName: currentUser.name,
        actorRole: currentUser.role
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to discharge patient');
    }
    await fetchAllData();
    showToast('Patient discharged. Bed placed in terminal sanitization cycle.');
  };

  // Bed Transfer
  const handleTransferBed = async (fromBedId: string, toBedId: string, reason: string) => {
    const res = await fetch('/api/beds/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromBedId,
        toBedId,
        transferReason: reason,
        actorName: currentUser.name,
        actorRole: currentUser.role
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to transfer patient');
    }
    await fetchAllData();
    showToast('Patient transferred successfully to new ward.');
  };

  // Bed Sanitize
  const handleSanitizeBed = async (bedId: string) => {
    const res = await fetch(`/api/beds/${bedId}/sanitize`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to sanitize bed');
    }
    await fetchAllData();
    showToast('Bed marked as sanitized and available for patient intake.');
  };

  // Decrypt Patient Medical History
  const handleDecryptPatient = async (patientId: string, justification: string): Promise<DecryptedMedicalHistory> => {
    const res = await fetch(`/api/patients/${patientId}/decrypt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        justification,
        isBreakGlass: false
      })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Decryption authorization denied.');
    }
    await fetchAllData();
    showToast('Record authenticated and unsealed with AES-256-GCM.');
    return data.decryptedHistory;
  };

  // Execute Break Glass Override
  const handleExecuteBreakGlass = async (patientId: string, justification: string) => {
    const res = await fetch(`/api/patients/${patientId}/decrypt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        justification,
        isBreakGlass: true
      })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Emergency break glass failed.');
    }
    await fetchAllData();
    showToast('Emergency Break-Glass override executed and logged to audit trail.', 'warning');
    setActiveTab('patients');
  };

  // Add Clinical Note
  const handleAddClinicalNote = async (patientId: string, note: string, specialty: string) => {
    const res = await fetch(`/api/patients/${patientId}/add-clinical-note`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        note,
        specialty,
        doctorName: currentUser.name,
        actorRole: currentUser.role
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save note');
    }
    await fetchAllData();
    showToast('Clinical progress note encrypted and appended to patient record.');
  };

  // Register Patient
  const handleRegisterPatient = async (patientData: any) => {
    const res = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...patientData,
        actorName: currentUser.name,
        actorRole: currentUser.role
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to register patient');
    }
    await fetchAllData();
    showToast('New patient intake complete and encrypted vault initialized.');
  };

  // Auto-Schedule Appointment
  const handleAutoSchedule = async (patientId: string, symptoms: string, urgency: string, doctor?: string) => {
    const res = await fetch('/api/appointments/auto-schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId,
        conditionDescription: symptoms,
        reportedUrgency: urgency,
        preferredDoctor: doctor,
        actorName: currentUser.name,
        actorRole: currentUser.role
      })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to run triage scheduling');
    }
    await fetchAllData();
    showToast(`Appointment booked for ${data.appointment.dateTime} with ${data.appointment.doctorName}.`);
    return data;
  };

  // Manual Schedule Appointment
  const handleManualSchedule = async (data: any) => {
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        actorName: currentUser.name,
        actorRole: currentUser.role
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to schedule');
    }
    await fetchAllData();
    showToast('Appointment successfully scheduled.');
  };

  // Update Appointment Status
  const handleUpdateAppointmentStatus = async (appointmentId: string, status: AppointmentStatus) => {
    const res = await fetch(`/api/appointments/${appointmentId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        actorName: currentUser.name,
        actorRole: currentUser.role
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update status');
    }
    await fetchAllData();
    showToast(`Appointment marked as ${status}.`);
  };

  // Verify Insurance Eligibility
  const handleVerifyEligibility = async (data: any) => {
    const res = await fetch('/api/billing/verify-eligibility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        actorName: currentUser.name,
        actorRole: currentUser.role
      })
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Eligibility check failed');
    }
    await fetchAllData();
    showToast(`Eligibility verified with ${data.payer}: Active coverage.`);
    return result;
  };

  // Submit Insurance Claim
  const handleSubmitClaim = async (claimData: any) => {
    const res = await fetch('/api/billing/claims', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...claimData,
        actorName: currentUser.name,
        actorRole: currentUser.role
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit claim');
    }
    await fetchAllData();
    showToast('EDI-837P claim transmitted to electronic clearinghouse.');
  };

  // Adjudicate Claim (Simulate Real-Time Payer 835 Remittance)
  const handleAdjudicateClaim = async (claimId: string, outcome: 'approve' | 'deny') => {
    const res = await fetch(`/api/billing/claims/${claimId}/adjudicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        outcome,
        actorName: currentUser.name,
        actorRole: currentUser.role
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to process claim');
    }
    await fetchAllData();
    showToast(`Claim remittance adjudicated: ${outcome === 'approve' ? 'Approved' : 'Denied'}.`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className={`px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border ${
            toastMessage.type === 'warning'
              ? 'bg-amber-500 text-white border-amber-600'
              : toastMessage.type === 'info'
              ? 'bg-slate-900 text-white border-slate-800'
              : 'bg-emerald-600 text-white border-emerald-700'
          }`}>
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Lock Screen Overlay (HIPAA Auto-Lock) */}
      {isLocked && (
        <LockScreen
          currentUser={currentUser}
          onUnlock={() => {
            setIsLocked(false);
            setSecondsUntilLock(AUTO_LOCK_SECONDS);
            showToast('Workstation unlocked. Clinical session resumed.');
          }}
        />
      )}

      {/* Emergency Break Glass Modal */}
      <BreakGlassModal
        isOpen={isBreakGlassOpen}
        onClose={() => setIsBreakGlassOpen(false)}
        patients={patients}
        currentUser={currentUser}
        onExecuteBreakGlass={handleExecuteBreakGlass}
      />

      {/* Main Header */}
      <Header
        currentUser={currentUser}
        onUserChange={(user) => {
          setCurrentUser(user);
          showToast(`Switched active clinical role to: ${user.name} (${user.role.toUpperCase()})`, 'info');
        }}
        privacyMode={privacyMode}
        onTogglePrivacy={handleTogglePrivacy}
        onLockScreen={() => setIsLocked(true)}
        onOpenBreakGlass={() => setIsBreakGlassOpen(true)}
        secondsUntilLock={secondsUntilLock}
      />

      {/* Sub-Navigation Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between overflow-x-auto">
          <nav className="flex space-x-1 sm:space-x-2 py-2">
            <button
              id="nav-tab-beds"
              onClick={() => setActiveTab('beds')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                activeTab === 'beds'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BedIcon className="w-4 h-4" />
              <span>Real-Time Bed Tracker</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'beds' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {beds.filter(b => b.status === 'occupied').length}/{beds.length}
              </span>
            </button>

            <button
              id="nav-tab-patients"
              onClick={() => setActiveTab('patients')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                activeTab === 'patients'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Encrypted EHR Records</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'patients' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {patients.length}
              </span>
            </button>

            <button
              id="nav-tab-appointments"
              onClick={() => setActiveTab('appointments')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                activeTab === 'appointments'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Automated Scheduling</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'appointments' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {appointments.length}
              </span>
            </button>

            <button
              id="nav-tab-billing"
              onClick={() => setActiveTab('billing')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                activeTab === 'billing'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Insurance Billing & APIs</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'billing' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {claims.length}
              </span>
            </button>

            <button
              id="nav-tab-audit"
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                activeTab === 'audit'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>HIPAA Audit Trail</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'audit' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {auditLogs.length}
              </span>
            </button>
          </nav>

          <button
            onClick={fetchAllData}
            title="Refresh clinical live data"
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'beds' && (
          <BedTracker
            beds={beds}
            patients={patients}
            currentUser={currentUser}
            privacyMode={privacyMode}
            onAdmit={handleAdmitPatient}
            onDischarge={handleDischargePatient}
            onTransfer={handleTransferBed}
            onSanitize={handleSanitizeBed}
          />
        )}

        {activeTab === 'patients' && (
          <PatientRecords
            patients={patients}
            currentUser={currentUser}
            privacyMode={privacyMode}
            onDecryptPatient={handleDecryptPatient}
            onAddClinicalNote={handleAddClinicalNote}
            onRegisterPatient={handleRegisterPatient}
            onOpenBreakGlass={() => setIsBreakGlassOpen(true)}
          />
        )}

        {activeTab === 'appointments' && (
          <AppointmentScheduler
            appointments={appointments}
            patients={patients}
            currentUser={currentUser}
            privacyMode={privacyMode}
            onAutoSchedule={handleAutoSchedule}
            onManualSchedule={handleManualSchedule}
            onUpdateStatus={handleUpdateAppointmentStatus}
          />
        )}

        {activeTab === 'billing' && (
          <InsuranceBilling
            claims={claims}
            patients={patients}
            currentUser={currentUser}
            privacyMode={privacyMode}
            onVerifyEligibility={handleVerifyEligibility}
            onSubmitClaim={handleSubmitClaim}
            onAdjudicateClaim={handleAdjudicateClaim}
          />
        )}

        {activeTab === 'audit' && (
          <AuditTrail
            auditLogs={auditLogs}
            currentUser={currentUser}
          />
        )}
      </main>

      {/* Footer with Compliance & Localhost Instructions */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">St. Jude Smart Hospital EHR</span>
            <span>•</span>
            <span>Localhost Node.js + React Enterprise Architecture</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-3">
            <span>To run locally in VSCode: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-700">npm install && npm run dev</code></span>
            <span>•</span>
            <span>Port: 3000</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
