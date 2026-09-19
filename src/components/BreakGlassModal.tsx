import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, Key, X, Lock, CheckCircle2, FileWarning } from 'lucide-react';
import { Patient, UserProfile } from '../types';

interface BreakGlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  currentUser: UserProfile;
  onExecuteBreakGlass: (patientId: string, justification: string) => Promise<void>;
}

export const BreakGlassModal: React.FC<BreakGlassModalProps> = ({
  isOpen,
  onClose,
  patients,
  currentUser,
  onExecuteBreakGlass
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  const [justification, setJustification] = useState('STAT Emergency Trauma / Patient unable to provide consent; acute resuscitation');
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationChecked) {
      setErrorMessage('You must acknowledge the legal HIPAA compliance warning to proceed.');
      return;
    }
    if (!selectedPatientId || !justification.trim()) {
      setErrorMessage('Please specify target patient and acute clinical rationale.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      await onExecuteBreakGlass(selectedPatientId, justification);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Break-glass execution failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId) || patients[0];

  return (
    <div className="fixed inset-0 z-50 bg-[#071714]/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border-2 border-rose-600 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Urgent Emergency Warning Banner */}
        <div className="bg-[#881337] text-white p-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-950/70 rounded-xl border border-rose-500/40 text-rose-300">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] font-mono-clinical font-bold tracking-widest uppercase text-rose-200">
                KAZE HOSPITAL PROTOCOL 9-CRITICAL
              </div>
              <h3 className="text-base font-bold text-white tracking-tight font-sans">
                Emergency Break-Glass Protocol Override
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-rose-200 hover:text-white p-1 rounded-lg hover:bg-rose-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Statutory HIPAA Notice */}
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-950 leading-relaxed space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-rose-900">
              <FileWarning className="w-4 h-4 text-rose-700 shrink-0" />
              <span>Mandatory HIPAA Statutory Warning (§ 164.512):</span>
            </div>
            <p className="text-[11px] text-rose-900">
              Emergency break-glass bypasses standard role-based gating to access cryptographically sealed Protected Health Information (PHI). 
              This event is immutably timestamped and dispatched directly to the <strong>Kaze Hospital Chief Medical Officer & Compliance Audit Bureau</strong>.
            </p>
          </div>

          {/* Current Operator Identification */}
          <div className="grid grid-cols-2 gap-3 bg-[#F4F6F5] p-3 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 text-[10px] block font-mono-clinical uppercase">OPERATOR CREDENTIAL</span>
              <strong className="text-slate-900 font-semibold">{currentUser.name}</strong>
              <div className="text-[11px] text-slate-500">{currentUser.title}</div>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block font-mono-clinical uppercase">CLINICAL ROLE / DEPT</span>
              <strong className="text-slate-900 font-mono-clinical uppercase text-rose-700 font-bold">{currentUser.role}</strong>
              <div className="text-[11px] text-slate-500">{currentUser.department}</div>
            </div>
          </div>

          {/* Patient Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Select Critical Patient Subject
            </label>
            <select
              id="break-glass-patient-select"
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full bg-[#F8FAFA] border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 font-medium focus:outline-hidden focus:border-rose-500"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.mrn}) • Status: {p.admissionStatus} • Primary: {p.primaryPhysician}
                </option>
              ))}
            </select>
          </div>

          {/* Clinical Justification */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Emergency Clinical Rationale (Audited)
            </label>
            <select
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className="w-full bg-[#F8FAFA] border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 mb-2 focus:outline-hidden focus:border-rose-500"
            >
              <option value="STAT Emergency Trauma / Patient unable to provide consent; acute resuscitation">
                STAT Emergency Trauma / Patient unable to provide consent; acute resuscitation
              </option>
              <option value="Acute cardiogenic shock / immediate catheterization without attending sign-off">
                Acute cardiogenic shock / immediate catheterization without attending sign-off
              </option>
              <option value="Severe anaphylaxis / critical allergy verification before pharmacotherapy">
                Severe anaphylaxis / critical allergy verification before pharmacotherapy
              </option>
              <option value="Emergency surgical exploration / unconscious unidentified code">
                Emergency surgical exploration / unconscious unidentified code
              </option>
            </select>
          </div>

          {/* Double Acknowledgement Checkbox */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 cursor-pointer">
            <input
              id="break-glass-consent-checkbox"
              type="checkbox"
              checked={confirmationChecked}
              onChange={(e) => setConfirmationChecked(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
            />
            <span className="leading-tight">
              I certify under penalty of professional license revocation that this access is strictly for immediate life-safety clinical intervention.
            </span>
          </label>

          {errorMessage && (
            <div className="p-2.5 bg-rose-100 border border-rose-300 rounded-lg text-xs font-semibold text-rose-800">
              {errorMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              Abort Protocol
            </button>

            <button
              id="confirm-break-glass-submit-btn"
              type="submit"
              disabled={isSubmitting || !confirmationChecked}
              className="px-5 py-2.5 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center gap-2 cursor-pointer shadow-md transition-all"
            >
              {isSubmitting ? (
                <span>Unsealing Vault & Notifying Compliance...</span>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>Authorize Emergency Decryption</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
