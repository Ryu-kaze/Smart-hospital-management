/**
 * Smart Hospital Management & Patient Record System Types
 * HIPAA-Compliant Data Models
 */

export type UserRole = 'doctor' | 'nurse' | 'billing' | 'admin' | 'patient';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  title: string;
  department: string;
  licenseNumber: string;
  avatarUrl?: string;
  canBreakGlass: boolean;
  canDecryptRecords: boolean;
  canManageBeds: boolean;
  canBillInsurance: boolean;
}

export type WardDepartment = 
  | 'ICU' 
  | 'Emergency (ER)' 
  | 'Surgical' 
  | 'General Ward' 
  | 'Pediatrics' 
  | 'Maternity';

export type BedStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'reserved';

export interface PatientTelemetry {
  heartRate: number; // bpm
  bloodPressure: string; // e.g. "120/80"
  oxygenSat: number; // %
  temperature: number; // °F or °C
  respiratoryRate: number; // breaths/min
  lastUpdated: string;
  alertStatus: 'normal' | 'elevated' | 'critical';
}

export interface Bed {
  id: string;
  bedNumber: string; // e.g. "ICU-04"
  department: WardDepartment;
  roomNumber: string;
  floor: number;
  status: BedStatus;
  patientId?: string;
  patientName?: string;
  patientMrn?: string;
  assignedDoctor?: string;
  assignedNurse?: string;
  admittedAt?: string;
  telemetry?: PatientTelemetry;
  notes?: string;
}

export interface ClinicalDiagnosis {
  code: string; // ICD-10
  name: string;
  diagnosedDate: string;
  diagnosedBy: string;
  status: 'Active' | 'Resolved' | 'Chronic';
}

export interface ClinicalNote {
  id: string;
  date: string;
  doctorName: string;
  specialty: string;
  note: string;
  confidentialityLevel: 'standard' | 'restricted' | 'psychiatric';
}

export interface ActiveMedication {
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  prescribedBy: string;
  startDate: string;
}

export interface SurgicalHistory {
  procedure: string;
  date: string;
  surgeon: string;
  hospital: string;
  notes: string;
}

export interface LabResult {
  testName: string;
  result: string;
  referenceRange: string;
  flag: 'normal' | 'abnormal' | 'critical';
  date: string;
  labTechnician: string;
}

export interface DecryptedMedicalHistory {
  allergies: Array<{ substance: string; severity: 'Mild' | 'Moderate' | 'Severe' | 'Anaphylactic'; reaction: string }>;
  diagnoses: ClinicalDiagnosis[];
  clinicalNotes: ClinicalNote[];
  medications: ActiveMedication[];
  surgeries: SurgicalHistory[];
  labResults: LabResult[];
  lastDecryptedAt?: string;
  decryptedBy?: string;
}

export interface Patient {
  id: string;
  mrn: string; // Medical Record Number e.g. "MRN-849201"
  name: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  bloodType: string;
  phone: string;
  email: string;
  admissionStatus: 'Outpatient' | 'Admitted' | 'In Triage' | 'Discharged';
  bedId?: string;
  primaryPhysician: string;
  insurance: {
    provider: string;
    policyNumber: string;
    groupNumber: string;
    copayAmount: number;
    coinsurancePercent: number;
    eligibilityStatus: 'Active' | 'Pending Verification' | 'Expired' | 'Terminated';
    verifiedAt: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  // Encrypted Payload (AES-256-GCM string representation)
  encryptedHistoryPayload: {
    iv: string;
    authTag: string;
    ciphertext: string;
    algorithm: string; // e.g., "aes-256-gcm"
    keyId: string;
    lastEncryptedAt: string;
  };
  // Populated in-memory when authorized doctor/provider decrypts
  decryptedHistory?: DecryptedMedicalHistory;
  isHistoryDecrypted?: boolean;
}

export type AppointmentUrgency = 'Routine' | 'Urgent' | 'Emergency';
export type AppointmentStatus = 'Scheduled' | 'Checked-In' | 'In-Consultation' | 'Completed' | 'Cancelled';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  doctorName: string;
  specialty: string;
  dateTime: string;
  durationMinutes: number;
  urgency: AppointmentUrgency;
  reasonForVisit: string;
  status: AppointmentStatus;
  room: string;
  triagePriorityScore: number; // 1-10 (10 highest)
  scheduledMethod: 'Manual' | 'AI Automated Triage Engine';
  notes?: string;
}

export interface ICD10Code {
  code: string;
  description: string;
  category: string;
}

export interface CPTCode {
  code: string;
  description: string;
  standardFee: number;
  category: string;
}

export type ClaimStatus = 'Draft' | 'Submitted' | 'In-Adjudication' | 'Approved' | 'Denied' | 'Paid';

export interface ClaimProcedureItem {
  cptCode: string;
  description: string;
  unit: number;
  fee: number;
  approvedAmount?: number;
}

export interface InsuranceClaim {
  id: string;
  claimNumber: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  insuranceProvider: string;
  policyNumber: string;
  dateOfService: string;
  renderingProvider: string;
  diagnoses: Array<{ code: string; description: string }>;
  procedures: ClaimProcedureItem[];
  totalBilledAmount: number;
  insuranceApprovedAmount?: number;
  copayAmount: number;
  patientDueAmount: number;
  status: ClaimStatus;
  electronicBatchId: string;
  submittedAt?: string;
  adjudicatedAt?: string;
  payerTransactionId?: string;
  denialCode?: string;
  denialReason?: string;
  eobExplanation?: string;
}

export type AuditActionType = 
  | 'EHR_DECRYPT'
  | 'BREAK_GLASS_OVERRIDE'
  | 'BED_ADMIT'
  | 'BED_DISCHARGE'
  | 'BED_TRANSFER'
  | 'CLAIM_SUBMISSION'
  | 'CLAIM_ADJUDICATION'
  | 'ELIGIBILITY_CHECK'
  | 'APPOINTMENT_SCHEDULE'
  | 'APPOINTMENT_AUTO_TRIAGE'
  | 'PHI_VIEW'
  | 'SESSION_AUTO_LOCK'
  | 'PRIVACY_SHIELD_TOGGLE';

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  actionType: AuditActionType;
  patientId?: string;
  patientMrn?: string;
  patientName?: string;
  resourceType: 'Patient' | 'Bed' | 'Appointment' | 'Claim' | 'Session';
  resourceId?: string;
  clinicalJustification?: string;
  details: string;
  severity: 'info' | 'warning' | 'critical';
  ipAddress: string;
  hashSignature: string; // Simulated SHA-256 tamper-evident integrity hash
}

export interface HospitalStats {
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  cleaningBeds: number;
  occupancyRate: number; // percentage
  icuOccupancyRate: number;
  erWaitCount: number;
  todayAppointmentsCount: number;
  pendingClaimsCount: number;
  totalBilledToday: number;
  activeEhrDecryptions: number;
  breakGlassAlertsToday: number;
}
