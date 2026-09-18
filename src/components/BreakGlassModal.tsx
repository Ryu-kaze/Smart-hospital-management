import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, X, CheckCircle2, Lock } from 'lucide-react';
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
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || '');
  const [justification, setJustification] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification.trim() || justification.trim().length < 10) {
      setErrorMessage('A detailed clinical justification (minimum 10 characters) is legally required by HIPAA §164.312 for emergency overrides.');
      return;
    }
    if (!selectedPatientId) {
      setErrorMessage('Please select the patient record requiring emergency unmasking.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      await onExecuteBreakGlass(selectedPatientId, justification);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to execute break glass override.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-red-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Urgent Header */}
        <div className="bg-red-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-red-700/80 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-200 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                Emergency Break-Glass Protocol
              </h3>
              <p className="text-xs text-red-100">
                Mandatory HIPAA Audit Notice & Override
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-red-200 hover:text-white p-1 rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-3 text-xs text-red-900 leading-relaxed">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block mb-0.5">Statutory Audit Warning:</strong>
              This action bypasses standard role authorization to decrypt Protected Health Information (PHI). This event will trigger an immediate high-priority entry in the hospital compliance audit ledger and may be reviewed by the Privacy Officer.
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Patient Record to Unseal
            </label>
            <select
              id="break-glass-patient-select"
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-hidden focus:border-red-500 focus:ring-1 focus:ring-red-500"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.mrn}) • Status: {p.admissionStatus}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Emergency Clinical Justification (Mandatory)</span>
              <span className="text-[11px] text-slate-400 font-normal">Min 10 characters</span>
            </label>
            <textarea
              id="break-glass-reason-input"
              rows={3}
              value={justification}
              onChange={(e) => {
                setJustification(e.target.value);
                setErrorMessage('');
              }}
              placeholder="e.g. Unconscious trauma patient in ER Bay 1; need immediate verification of drug allergies and surgical history prior to emergency intubation."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Authenticated Clinician:</span>
              <strong className="text-slate-800">{currentUser.name} ({currentUser.licenseNumber})</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Cryptographic Cipher:</span>
              <span className="font-mono text-slate-800">AES-256-GCM Hardware Unseal</span>
            </div>
          </div>

          {errorMessage && (
            <p className="text-xs text-red-600 font-medium bg-red-50 p-2 rounded border border-red-200">
              {errorMessage}
            </p>
          )}

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="confirm-break-glass-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Unsealing Records...</span>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Execute Emergency Decrypt</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
