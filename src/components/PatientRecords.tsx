import React, { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  ShieldCheck, 
  AlertCircle, 
  FileText, 
  Pill, 
  HeartHandshake, 
  FlaskConical, 
  Plus, 
  Search, 
  UserPlus, 
  AlertTriangle,
  Key,
  Shield,
  Stethoscope,
  Calendar,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  RefreshCw,
  FolderLock,
  FileSpreadsheet
} from 'lucide-react';
import { Patient, UserProfile, DecryptedMedicalHistory } from '../types';

interface PatientRecordsProps {
  patients: Patient[];
  currentUser: UserProfile;
  privacyMode: boolean;
  onDecryptPatient: (patientId: string, justification: string) => Promise<DecryptedMedicalHistory>;
  onAddClinicalNote: (patientId: string, note: string, specialty: string) => Promise<void>;
  onRegisterPatient: (patientData: any) => Promise<void>;
  onOpenBreakGlass: () => void;
}

export const PatientRecords: React.FC<PatientRecordsProps> = ({
  patients,
  currentUser,
  privacyMode,
  onDecryptPatient,
  onAddClinicalNote,
  onRegisterPatient,
  onOpenBreakGlass
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [decryptedDataMap, setDecryptedDataMap] = useState<Record<string, DecryptedMedicalHistory>>({});
  
  // Decrypt justification modal
  const [isDecryptModalOpen, setIsDecryptModalOpen] = useState(false);
  const [justification, setJustification] = useState('Daily patient clinical evaluation and chart review');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState('');

  // Add clinical note modal
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteSpecialty, setNewNoteSpecialty] = useState(currentUser.department);
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Register patient modal
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDob, setNewDob] = useState('');
  const [newGender, setNewGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [newBloodType, setNewBloodType] = useState('O+');
  const [newPhone, setNewPhone] = useState('');
  const [newInsurance, setNewInsurance] = useState('Blue Cross Blue Shield PPO');
  const [newPolicyNum, setNewPolicyNum] = useState('');

  const selectedPatient = patients.find(p => p.id === selectedPatientId) || patients[0];
  const isDecrypted = Boolean(decryptedDataMap[selectedPatient?.id]);
  const currentDecryptedHistory = decryptedDataMap[selectedPatient?.id];

  const filteredPatients = patients.filter((p) => {
    return (
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.admissionStatus.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleDecrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    try {
      setIsDecrypting(true);
      setDecryptError('');
      const decrypted = await onDecryptPatient(selectedPatient.id, justification);
      setDecryptedDataMap(prev => ({ ...prev, [selectedPatient.id]: decrypted }));
      setIsDecryptModalOpen(false);
    } catch (err: any) {
      setDecryptError(err.message || 'Decryption failed: Access Denied.');
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleReseal = () => {
    if (!selectedPatient) return;
    setDecryptedDataMap(prev => {
      const copy = { ...prev };
      delete copy[selectedPatient.id];
      return copy;
    });
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !newNoteText.trim()) return;
    try {
      setIsSavingNote(true);
      await onAddClinicalNote(selectedPatient.id, newNoteText, newNoteSpecialty);
      if (currentDecryptedHistory) {
        currentDecryptedHistory.clinicalNotes.unshift({
          id: `CN-${Date.now().toString().slice(-4)}`,
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          doctorName: currentUser.name,
          specialty: newNoteSpecialty,
          note: newNoteText,
          confidentialityLevel: 'standard'
        });
      }
      setIsAddNoteModalOpen(false);
      setNewNoteText('');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newDob) return;
    await onRegisterPatient({
      name: newName,
      dob: newDob,
      gender: newGender,
      bloodType: newBloodType,
      phone: newPhone,
      insuranceProvider: newInsurance,
      policyNumber: newPolicyNum
    });
    setIsRegisterModalOpen(false);
    setNewName('');
    setNewDob('');
    setNewPhone('');
    setNewPolicyNum('');
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-[#D5DDD9] p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 tracking-tight font-sans">
              Kaze Hospital Cryptographic EHR Vault
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono-clinical font-bold px-2 py-0.5 rounded bg-[#E4EFEA] text-[#134D41] border border-[#BBD5CB]">
              <Key className="w-3 h-3 text-[#1D7A68]" />
              AES-256-GCM SEALED
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-sans">
            Protected Health Information (PHI) is sealed at rest with unique 96-bit initialization vectors. Decryption events are logged to the Kaze immutable audit ledger.
          </p>
        </div>

        <button
          id="register-patient-btn"
          onClick={() => setIsRegisterModalOpen(true)}
          className="py-2 px-3.5 bg-[#0E2C27] hover:bg-[#15453E] text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Patient Intake Dossier</span>
        </button>
      </div>

      {/* Main Grid: Directory + Medical Record */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Patient Directory Master List */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-[#D5DDD9] shadow-xs overflow-hidden">
          <div className="p-3 border-b border-[#E2E8E5] bg-[#F7F9F8]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="patient-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient name or MRN..."
                className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#14443C]"
              />
            </div>
          </div>

          <div className="divide-y divide-[#EDF1EF] max-h-[640px] overflow-y-auto">
            {filteredPatients.map((patient) => {
              const isSelected = patient.id === selectedPatient?.id;
              const hasDecrypted = Boolean(decryptedDataMap[patient.id]);

              return (
                <button
                  key={patient.id}
                  id={`patient-item-${patient.id}`}
                  onClick={() => setSelectedPatientId(patient.id)}
                  className={`w-full text-left p-3.5 transition-colors flex items-start justify-between gap-2 cursor-pointer ${
                    isSelected ? 'bg-[#EBF3F0] border-l-4 border-[#0E2C27]' : 'hover:bg-[#F9FAF9]'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-bold text-xs text-slate-900 truncate ${privacyMode ? 'phi-blur' : ''}`}>
                        {patient.name}
                      </span>
                      {hasDecrypted ? (
                        <span title="Decrypted in active session">
                          <Unlock className="w-3 h-3 text-emerald-700 shrink-0" />
                        </span>
                      ) : (
                        <span title="AES-256 Encrypted">
                          <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono-clinical mt-0.5">
                      {privacyMode ? 'MRN-••••••' : patient.mrn} • {patient.dob}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2 font-mono-clinical">
                      <span className="font-semibold text-slate-700">{patient.admissionStatus}</span>
                      <span>•</span>
                      <span className="truncate">{patient.insurance.provider}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Patient EHR Chart */}
        {selectedPatient && (
          <div className="lg:col-span-8 space-y-4">
            {/* Patient Face Sheet Header */}
            <div className="bg-white rounded-xl border border-[#D5DDD9] p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8E5]">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className={`text-lg font-bold text-slate-900 font-sans ${privacyMode ? 'phi-blur' : ''}`}>
                      {selectedPatient.name}
                    </h3>
                    <span className="bg-[#E9F1EE] text-[#0F3E35] text-xs font-mono-clinical font-bold px-2 py-0.5 rounded border border-[#BDD7CE]">
                      {privacyMode ? 'MRN-••••••' : selectedPatient.mrn}
                    </span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      selectedPatient.admissionStatus === 'Admitted'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : selectedPatient.admissionStatus === 'In Triage'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {selectedPatient.admissionStatus}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3 font-sans">
                    <span>DOB: <strong>{selectedPatient.dob}</strong></span>
                    <span>•</span>
                    <span>Gender: <strong>{selectedPatient.gender}</strong></span>
                    <span>•</span>
                    <span>Blood: <strong className="text-rose-700 font-mono-clinical">{selectedPatient.bloodType}</strong></span>
                    <span>•</span>
                    <span>Attending: <strong>{selectedPatient.primaryPhysician}</strong></span>
                  </div>
                </div>

                {/* Cryptographic Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  {isDecrypted ? (
                    <div className="flex items-center gap-2">
                      <button
                        id="reseal-record-btn"
                        onClick={handleReseal}
                        className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Re-seal record to clear unmasked PHI from memory"
                      >
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Re-Seal (Lock)</span>
                      </button>

                      {currentUser.canDecryptRecords && (
                        <button
                          id="add-clinical-note-btn"
                          onClick={() => setIsAddNoteModalOpen(true)}
                          className="py-1.5 px-3 bg-[#0E2C27] hover:bg-[#14443C] text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add SOAP Note</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        id="decrypt-record-btn"
                        onClick={() => setIsDecryptModalOpen(true)}
                        className="py-2 px-4 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                      >
                        <Key className="w-4 h-4" />
                        <span>Decrypt Medical History</span>
                      </button>

                      {!currentUser.canDecryptRecords && (
                        <button
                          onClick={onOpenBreakGlass}
                          className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                          title="Trigger emergency break-glass override"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Break Glass</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Demographics & Insurance Banner */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 text-xs">
                <div className="bg-[#F8FAF9] rounded-lg p-3 border border-[#E2E8E5]">
                  <span className="text-slate-400 font-mono-clinical uppercase text-[10px] block mb-0.5">PAYER & COVERAGE</span>
                  <div className="font-semibold text-slate-800">{selectedPatient.insurance.provider}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5 font-mono-clinical">
                    Policy: {selectedPatient.insurance.policyNumber} • Copay: ${selectedPatient.insurance.copayAmount}
                  </div>
                </div>

                <div className="bg-[#F8FAF9] rounded-lg p-3 border border-[#E2E8E5]">
                  <span className="text-slate-400 font-mono-clinical uppercase text-[10px] block mb-0.5">NEXT OF KIN / PROXY</span>
                  <div className={`font-semibold text-slate-800 ${privacyMode ? 'phi-blur' : ''}`}>
                    {selectedPatient.emergencyContact.name} ({selectedPatient.emergencyContact.relationship})
                  </div>
                  <div className={`text-slate-500 text-[11px] mt-0.5 ${privacyMode ? 'phi-blur' : ''}`}>
                    {selectedPatient.emergencyContact.phone}
                  </div>
                </div>
              </div>
            </div>

            {/* Cryptographically Sealed State Box */}
            {!isDecrypted ? (
              <div className="bg-white rounded-xl border border-[#D5DDD9] p-7 shadow-xs text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#E8F3EE] border border-[#BDD7CC] text-[#134D41] flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-slate-900 font-sans">
                  Medical Record Cryptographically Sealed
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed font-sans">
                  Clinical progress notes, chronic diagnoses, prescribed medications, diagnostic labs, and allergy records are encrypted at rest with <strong>AES-256-GCM</strong>.
                </p>

                {/* Ciphertext Envelope Inspector */}
                <div className="mt-5 max-w-lg mx-auto bg-[#071917] text-slate-300 rounded-xl p-3.5 text-left border border-[#143B34] font-mono-clinical text-[11px]">
                  <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-[#133A33] mb-2">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <Key className="w-3 h-3" />
                      Encrypted Envelope Header
                    </span>
                    <span className="text-[10px] text-slate-400">ALGO: {selectedPatient.encryptedHistoryPayload.algorithm}</span>
                  </div>

                  <div className="space-y-1 text-slate-300">
                    <div><span className="text-teal-400">IV (96-bit nonce):</span> {selectedPatient.encryptedHistoryPayload.iv}</div>
                    <div><span className="text-amber-400">Auth Tag (128-bit MAC):</span> {selectedPatient.encryptedHistoryPayload.authTag}</div>
                    <div className="truncate">
                      <span className="text-emerald-300">Payload:</span> {selectedPatient.encryptedHistoryPayload.ciphertext.substring(0, 50)}... [ciphertext sealed]
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <button
                    id="decrypt-modal-trigger-btn"
                    onClick={() => setIsDecryptModalOpen(true)}
                    className="py-2.5 px-5 bg-[#0E2C27] hover:bg-[#14443C] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer inline-flex items-center gap-2"
                  >
                    <Unlock className="w-4 h-4 text-emerald-300" />
                    <span>Authenticate & Decrypt Record</span>
                  </button>
                </div>
              </div>
            ) : (
              /* DECRYPTED EHR DOSSIER */
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Audit Stamp Banner */}
                <div className="bg-[#EDF5F2] border border-[#BDD7CC] rounded-xl p-3 flex items-center justify-between text-xs text-[#0D3830]">
                  <div className="flex items-center gap-2 font-mono-clinical">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>
                      Decrypted by <strong>{currentDecryptedHistory?.decryptedBy || currentUser.name}</strong> • Logged to Audit Trail
                    </span>
                  </div>
                  <span className="text-[10px] font-mono-clinical text-[#165649] font-bold">
                    NIST SP 800-38D VERIFIED
                  </span>
                </div>

                {/* CRITICAL ALLERGY ALERT */}
                {currentDecryptedHistory?.allergies && currentDecryptedHistory.allergies.length > 0 && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-900 mb-2 font-sans">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      CRITICAL ALLERGY & ANAPHYLAXIS RECORD
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {currentDecryptedHistory.allergies.map((allergy, idx) => (
                        <div key={idx} className="bg-white p-2.5 rounded-lg border border-rose-200 flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-xs text-rose-900">{allergy.substance}</span>
                            <p className="text-[11px] text-slate-600 mt-0.5">{allergy.reaction}</p>
                          </div>
                          <span className={`text-[10px] font-bold font-mono-clinical px-2 py-0.5 rounded uppercase ${
                            allergy.severity === 'Anaphylactic' ? 'bg-rose-700 text-white' : 'bg-amber-100 text-amber-900'
                          }`}>
                            {allergy.severity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* DIAGNOSES & MEDICATIONS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Active Diagnoses */}
                  <div className="bg-white rounded-xl border border-[#D5DDD9] p-4 shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100 font-sans">
                      <Stethoscope className="w-4 h-4 text-[#1D7A68]" />
                      Active Clinical Diagnoses (ICD-10-CM)
                    </div>
                    <div className="space-y-2.5">
                      {currentDecryptedHistory?.diagnoses && currentDecryptedHistory.diagnoses.length > 0 ? (
                        currentDecryptedHistory.diagnoses.map((diag, idx) => (
                          <div key={idx} className="bg-[#F8FAF9] p-2.5 rounded-lg border border-[#E2E8E5]">
                            <div className="flex items-center justify-between">
                              <span className="font-mono-clinical text-xs font-bold text-[#0E2C27]">{diag.code}</span>
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900">
                                {diag.status}
                              </span>
                            </div>
                            <div className="text-xs font-semibold text-slate-800 mt-0.5">{diag.name}</div>
                            <div className="text-[10px] text-slate-400 mt-1 font-mono-clinical">
                              Diagnosed {diag.diagnosedDate} by {diag.diagnosedBy}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">No chronic diagnoses on file.</p>
                      )}
                    </div>
                  </div>

                  {/* Active Medications */}
                  <div className="bg-white rounded-xl border border-[#D5DDD9] p-4 shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100 font-sans">
                      <Pill className="w-4 h-4 text-purple-700" />
                      MAR • Active Medications
                    </div>
                    <div className="space-y-2.5">
                      {currentDecryptedHistory?.medications && currentDecryptedHistory.medications.length > 0 ? (
                        currentDecryptedHistory.medications.map((med, idx) => (
                          <div key={idx} className="bg-[#F8FAF9] p-2.5 rounded-lg border border-[#E2E8E5]">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">{med.name}</span>
                              <span className="text-[11px] font-semibold text-purple-800 bg-purple-50 px-1.5 rounded font-mono-clinical">
                                {med.dosage}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 mt-0.5">
                              {med.frequency} • {med.route}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 font-mono-clinical">
                              Prescribed by {med.prescribedBy} on {med.startDate}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">No active medications recorded.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* CLINICAL SOAP PROGRESS NOTES */}
                <div className="bg-white rounded-xl border border-[#D5DDD9] p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 font-sans">
                      <FileText className="w-4 h-4 text-[#1D7A68]" />
                      Physician SOAP Progress Notes & Encounters
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono-clinical">
                      {currentDecryptedHistory?.clinicalNotes.length || 0} Records
                    </span>
                  </div>

                  <div className="space-y-3">
                    {currentDecryptedHistory?.clinicalNotes && currentDecryptedHistory.clinicalNotes.length > 0 ? (
                      currentDecryptedHistory.clinicalNotes.map((note) => (
                        <div key={note.id} className="bg-[#F8FAF9] p-3 rounded-lg border border-[#E2E8E5]">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">{note.doctorName}</span>
                              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                                {note.specialty}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono-clinical flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {note.date}
                            </span>
                          </div>
                          <p className={`text-xs text-slate-700 leading-relaxed font-sans ${privacyMode ? 'phi-blur' : ''}`}>
                            {note.note}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No progress notes recorded.</p>
                    )}
                  </div>
                </div>

                {/* DIAGNOSTIC LAB RESULTS & SURGICAL HISTORY */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Lab Results */}
                  <div className="bg-white rounded-xl border border-[#D5DDD9] p-4 shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100 font-sans">
                      <FlaskConical className="w-4 h-4 text-teal-700" />
                      Laboratory Diagnostics & Panels
                    </div>
                    <div className="space-y-2">
                      {currentDecryptedHistory?.labResults && currentDecryptedHistory.labResults.length > 0 ? (
                        currentDecryptedHistory.labResults.map((lab, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded bg-[#F8FAF9] border border-[#E2E8E5] text-xs">
                            <div>
                              <div className="font-semibold text-slate-800">{lab.testName}</div>
                              <div className="text-[10px] text-slate-400 font-mono-clinical">Ref: {lab.referenceRange} • {lab.date}</div>
                            </div>
                            <div className="text-right">
                              <span className={`font-mono-clinical font-bold ${
                                lab.flag === 'abnormal' ? 'text-amber-700' : lab.flag === 'critical' ? 'text-rose-700' : 'text-emerald-800'
                              }`}>
                                {lab.result}
                              </span>
                              {lab.flag !== 'normal' && (
                                <span className="block text-[9px] font-bold uppercase text-rose-600 font-mono-clinical">
                                  {lab.flag}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">No lab results available.</p>
                      )}
                    </div>
                  </div>

                  {/* Surgical History */}
                  <div className="bg-white rounded-xl border border-[#D5DDD9] p-4 shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100 font-sans">
                      <HeartHandshake className="w-4 h-4 text-rose-700" />
                      Surgical & Interventional Procedures
                    </div>
                    <div className="space-y-2">
                      {currentDecryptedHistory?.surgeries && currentDecryptedHistory.surgeries.length > 0 ? (
                        currentDecryptedHistory.surgeries.map((surg, idx) => (
                          <div key={idx} className="p-2.5 rounded bg-[#F8FAF9] border border-[#E2E8E5] text-xs">
                            <div className="font-semibold text-slate-900">{surg.procedure}</div>
                            <div className="text-[11px] text-slate-600 mt-0.5">{surg.notes}</div>
                            <div className="text-[10px] text-slate-400 mt-1 font-mono-clinical">
                              {surg.date} • {surg.surgeon} ({surg.hospital})
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">No prior surgeries reported.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* DECRYPT AUTHORIZATION MODAL */}
      {isDecryptModalOpen && selectedPatient && (
        <div className="fixed inset-0 z-50 bg-[#071714]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#E7F2EE] text-[#0E2C27] rounded-lg">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-sans">
                    Authenticate & Unseal EHR
                  </h3>
                  <p className="text-xs text-slate-500 font-mono-clinical">
                    {selectedPatient.name} ({selectedPatient.mrn})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsDecryptModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDecrypt} className="space-y-3.5">
              <div className="bg-[#EBF3F0] border border-[#BBD5CB] rounded-xl p-3 text-xs text-[#0D3830] leading-relaxed">
                <strong>HIPAA § 164.530 Protocol:</strong> Decryption will be permanently signed in the Kaze Hospital compliance audit queue under user <strong>{currentUser.name}</strong> ({currentUser.role}).
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Clinical Access Rationale (Mandatory)
                </label>
                <select
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 mb-2"
                >
                  <option value="Daily patient clinical evaluation and chart review">Daily patient clinical evaluation and chart review</option>
                  <option value="Pre-operative assessment and allergy verification">Pre-operative assessment and allergy verification</option>
                  <option value="Emergency treatment / acute medication reconciliation">Emergency treatment / acute medication reconciliation</option>
                  <option value="Discharge planning and continuity of care">Discharge planning and continuity of care</option>
                </select>
              </div>

              {decryptError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                  {decryptError}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDecryptModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="confirm-decrypt-submit-btn"
                  type="submit"
                  disabled={isDecrypting}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#0E2C27] hover:bg-[#14443C] disabled:opacity-50 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {isDecrypting ? (
                    <span>Verifying Credentials...</span>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Authenticate & Decrypt</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SOAP NOTE MODAL */}
      {isAddNoteModalOpen && selectedPatient && (
        <div className="fixed inset-0 z-50 bg-[#071714]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-sans">
                  Add Clinical SOAP Progress Note
                </h3>
                <p className="text-xs text-slate-500 font-mono-clinical">
                  Encrypted with AES-256-GCM before persistent database write
                </p>
              </div>
              <button 
                onClick={() => setIsAddNoteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Clinical Service / Department
                </label>
                <input
                  type="text"
                  value={newNoteSpecialty}
                  onChange={(e) => setNewNoteSpecialty(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Physician SOAP Assessment & Plan
                </label>
                <textarea
                  id="clinical-note-textarea"
                  rows={4}
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Subjective, Objective, Assessment, and Plan notes..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddNoteModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="save-clinical-note-btn"
                  type="submit"
                  disabled={isSavingNote || !newNoteText.trim()}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#0E2C27] hover:bg-[#14443C] disabled:opacity-50 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {isSavingNote ? 'Encrypting & Storing...' : 'Seal & Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTER PATIENT INTAKE MODAL */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#071714]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-sans">
                  Kaze Hospital Patient Intake
                </h3>
                <p className="text-xs text-slate-500 font-mono-clinical">
                  Assigns permanent MRN and seeds hardware-encrypted health ledger
                </p>
              </div>
              <button 
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterPatient} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Legal Full Name
                </label>
                <input
                  id="new-patient-name"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Kenzo Shibata"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={newDob}
                    onChange={(e) => setNewDob(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Blood Type
                  </label>
                  <select
                    value={newBloodType}
                    onChange={(e) => setNewBloodType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Contact
                  </label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="(555) 000-0000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Insurance Payer
                </label>
                <select
                  value={newInsurance}
                  onChange={(e) => setNewInsurance(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                >
                  <option value="Blue Cross Blue Shield PPO">Blue Cross Blue Shield PPO</option>
                  <option value="UnitedHealthcare Choice Plus">UnitedHealthcare Choice Plus</option>
                  <option value="Aetna Open Access">Aetna Open Access</option>
                  <option value="Medicare Part B">Medicare Part B</option>
                  <option value="Cigna HealthSpring">Cigna HealthSpring</option>
                  <option value="Direct Self-Pay / Cash">Direct Self-Pay / Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Policy / Member ID
                </label>
                <input
                  type="text"
                  value={newPolicyNum}
                  onChange={(e) => setNewPolicyNum(e.target.value)}
                  placeholder="e.g. BCBS-99104820"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="confirm-register-patient-btn"
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#0E2C27] hover:bg-[#14443C] rounded-lg cursor-pointer shadow-xs"
                >
                  Register & Seal Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
