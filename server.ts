import express, { Request, Response } from 'express';
import path from 'path';
import crypto from 'node:crypto';
import { createServer as createViteServer } from 'vite';

// Encryption Master Key for EHR (AES-256-GCM)
const EHR_MASTER_KEY = crypto.createHash('sha256').update(process.env.EHR_SECRET_KEY || 'HIPAA-SMART-HOSPITAL-ENCRYPTION-KEY-2026').digest();
const ALGORITHM = 'aes-256-gcm';

function encryptData(plainObject: any) {
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, EHR_MASTER_KEY, iv);
  const jsonStr = JSON.stringify(plainObject);
  let ciphertext = cipher.update(jsonStr, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return {
    iv: iv.toString('hex'),
    authTag,
    ciphertext,
    algorithm: ALGORITHM,
    keyId: 'HOSP-KMS-AES256-PROD1',
    lastEncryptedAt: new Date().toISOString()
  };
}

function decryptData(payload: { iv: string; authTag: string; ciphertext: string }) {
  const iv = Buffer.from(payload.iv, 'hex');
  const authTag = Buffer.from(payload.authTag, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, EHR_MASTER_KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(payload.ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
}

function generateAuditHash(entry: Record<string, any>) {
  return crypto.createHash('sha256').update(JSON.stringify(entry) + Date.now().toString()).digest('hex').substring(0, 16);
}

// Initial Data
const initialMedicalHistories: Record<string, any> = {
  'PT-001': {
    allergies: [
      { substance: 'Penicillin', severity: 'Anaphylactic', reaction: 'Bronchospasm, facial angioedema' },
      { substance: 'Codeine', severity: 'Moderate', reaction: 'Severe nausea, hives' }
    ],
    diagnoses: [
      { code: 'I21.9', name: 'Acute Myocardial Infarction', diagnosedDate: '2026-09-14', diagnosedBy: 'Dr. Evelyn Reed', status: 'Active' },
      { code: 'I10', name: 'Essential Primary Hypertension', diagnosedDate: '2021-04-10', diagnosedBy: 'Dr. Marcus Vance', status: 'Chronic' },
      { code: 'E11.9', name: 'Type 2 Diabetes Mellitus without complications', diagnosedDate: '2019-11-20', diagnosedBy: 'Dr. Marcus Vance', status: 'Chronic' }
    ],
    clinicalNotes: [
      {
        id: 'CN-8801',
        date: '2026-09-17 08:30',
        doctorName: 'Dr. Evelyn Reed',
        specialty: 'Cardiology / ICU',
        note: 'Patient admitted post-percutaneous coronary intervention (PCI) with drug-eluting stent to LAD. Troponin levels trending down (0.42 to 0.18 ng/mL). Continuous telemetric rhythm monitoring indicated NSR. Maintain dual antiplatelet therapy.',
        confidentialityLevel: 'standard'
      },
      {
        id: 'CN-8702',
        date: '2026-09-16 14:15',
        doctorName: 'Dr. Evelyn Reed',
        specialty: 'Cardiology / ICU',
        note: 'Echo reveals LVEF 48%, mild anterior hypokinesis. Patient denies active retrosternal chest pain. Bed rest encouraged.',
        confidentialityLevel: 'standard'
      }
    ],
    medications: [
      { name: 'Ticagrelor (Brilinta)', dosage: '90 mg', frequency: 'Twice daily', route: 'Oral', prescribedBy: 'Dr. Evelyn Reed', startDate: '2026-09-15' },
      { name: 'Atorvastatin', dosage: '80 mg', frequency: 'Nightly', route: 'Oral', prescribedBy: 'Dr. Evelyn Reed', startDate: '2026-09-15' },
      { name: 'Metoprolol Succinate', dosage: '25 mg', frequency: 'Once daily', route: 'Oral', prescribedBy: 'Dr. Evelyn Reed', startDate: '2026-09-16' },
      { name: 'Metformin', dosage: '500 mg', frequency: 'Twice daily with meals', route: 'Oral', prescribedBy: 'Dr. Marcus Vance', startDate: '2020-03-01' }
    ],
    surgeries: [
      { procedure: 'Percutaneous Coronary Intervention with LAD Stent', date: '2026-09-15', surgeon: 'Dr. Evelyn Reed', hospital: 'Memorial General Hospital', notes: 'Successful revascularization 95% LAD stenosis' },
      { procedure: 'Right Inguinal Hernia Repair (Laparoscopic)', date: '2017-06-12', surgeon: 'Dr. Craig Foster', hospital: 'St. Jude Surgical Center', notes: 'Uncomplicated recovery' }
    ],
    labResults: [
      { testName: 'High-Sensitivity Troponin I', result: '0.18', referenceRange: '<0.04', flag: 'abnormal', date: '2026-09-17 06:00', labTechnician: 'Tech A. Morales' },
      { testName: 'Basic Metabolic Panel - Potassium', result: '4.2', referenceRange: '3.5 - 5.1', flag: 'normal', date: '2026-09-17 06:00', labTechnician: 'Tech A. Morales' },
      { testName: 'Hemoglobin A1c', result: '6.8', referenceRange: '<5.7', flag: 'abnormal', date: '2026-09-15 11:30', labTechnician: 'Tech K. Davis' }
    ]
  },
  'PT-002': {
    allergies: [
      { substance: 'Sulfa Drugs', severity: 'Severe', reaction: 'Toxic epidermal necrolysis' }
    ],
    diagnoses: [
      { code: 'J18.9', name: 'Community-Acquired Lobar Pneumonia', diagnosedDate: '2026-09-16', diagnosedBy: 'Dr. Samantha Wu', status: 'Active' },
      { code: 'J44.1', name: 'COPD with Acute Exacerbation', diagnosedDate: '2026-09-16', diagnosedBy: 'Dr. Samantha Wu', status: 'Active' }
    ],
    clinicalNotes: [
      {
        id: 'CN-8803',
        date: '2026-09-17 09:15',
        doctorName: 'Dr. Samantha Wu',
        specialty: 'Pulmonology',
        note: 'Oxygen requirement decreased to 2L via nasal cannula. Bilateral basilar crackles improved compared to admission. Sputum culture pending. Nebulizer treatments continued q4h.',
        confidentialityLevel: 'standard'
      }
    ],
    medications: [
      { name: 'Ceftriaxone IV', dosage: '1 g', frequency: 'Every 24 hours', route: 'Intravenous', prescribedBy: 'Dr. Samantha Wu', startDate: '2026-09-16' },
      { name: 'Azithromycin IV', dosage: '500 mg', frequency: 'Daily', route: 'Intravenous', prescribedBy: 'Dr. Samantha Wu', startDate: '2026-09-16' },
      { name: 'Ipratropium/Albuterol Nebulizer', dosage: '0.5mg/2.5mg', frequency: 'Every 4 hours PRN', route: 'Inhalation', prescribedBy: 'Dr. Samantha Wu', startDate: '2026-09-16' }
    ],
    surgeries: [],
    labResults: [
      { testName: 'WBC Count', result: '13.4', referenceRange: '4.5 - 11.0', flag: 'abnormal', date: '2026-09-17 07:00', labTechnician: 'Tech P. Gupta' },
      { testName: 'Arterial Blood Gas - pO2', result: '78', referenceRange: '75 - 100', flag: 'normal', date: '2026-09-16 18:20', labTechnician: 'Tech P. Gupta' }
    ]
  },
  'PT-003': {
    allergies: [],
    diagnoses: [
      { code: 'S82.201A', name: 'Fracture of shaft of right tibia, initial encounter', diagnosedDate: '2026-09-17', diagnosedBy: 'Dr. Arthur Nolan', status: 'Active' }
    ],
    clinicalNotes: [
      {
        id: 'CN-8804',
        date: '2026-09-17 11:00',
        doctorName: 'Dr. Arthur Nolan',
        specialty: 'Orthopedic Surgery',
        note: 'Bicycle trauma. Closed displaced spiral fracture right tibia. Scheduled for Intramedullary Nailing OR this afternoon. Distal neurovascular intact. Compartment syndrome checks negative.',
        confidentialityLevel: 'standard'
      }
    ],
    medications: [
      { name: 'Hydromorphone (Dilaudid)', dosage: '0.5 mg', frequency: 'q3h PRN severe pain', route: 'IV push', prescribedBy: 'Dr. Arthur Nolan', startDate: '2026-09-17' },
      { name: 'Cefazolin', dosage: '2 g', frequency: 'Pre-op 30 min before incision', route: 'Intravenous', prescribedBy: 'Dr. Arthur Nolan', startDate: '2026-09-17' }
    ],
    surgeries: [],
    labResults: [
      { testName: 'Hemoglobin', result: '14.1', referenceRange: '13.5 - 17.5', flag: 'normal', date: '2026-09-17 10:15', labTechnician: 'Tech A. Morales' }
    ]
  }
};

let patients = [
  {
    id: 'PT-001',
    mrn: 'MRN-849201',
    name: 'Eleanor Vance',
    dob: '1964-08-14',
    gender: 'Female',
    bloodType: 'A+',
    phone: '(555) 234-8901',
    email: 'e.vance64@email.com',
    admissionStatus: 'Admitted',
    bedId: 'BED-ICU-02',
    primaryPhysician: 'Dr. Evelyn Reed',
    insurance: {
      provider: 'Blue Cross Blue Shield PPO',
      policyNumber: 'BCBS-99482104-A',
      groupNumber: 'GRP-TX-8041',
      copayAmount: 50,
      coinsurancePercent: 20,
      eligibilityStatus: 'Active',
      verifiedAt: '2026-09-15 08:12'
    },
    emergencyContact: {
      name: 'Thomas Vance',
      relationship: 'Spouse',
      phone: '(555) 234-8909'
    },
    encryptedHistoryPayload: encryptData(initialMedicalHistories['PT-001'])
  },
  {
    id: 'PT-002',
    mrn: 'MRN-773194',
    name: 'Marcus Holloway',
    dob: '1978-03-22',
    gender: 'Male',
    bloodType: 'O-',
    phone: '(555) 871-3341',
    email: 'mholloway@techcorp.net',
    admissionStatus: 'Admitted',
    bedId: 'BED-GEN-104',
    primaryPhysician: 'Dr. Samantha Wu',
    insurance: {
      provider: 'UnitedHealthcare Choice Plus',
      policyNumber: 'UHC-448102941',
      groupNumber: 'GRP-CA-9921',
      copayAmount: 35,
      coinsurancePercent: 15,
      eligibilityStatus: 'Active',
      verifiedAt: '2026-09-16 10:45'
    },
    emergencyContact: {
      name: 'Clara Holloway',
      relationship: 'Sister',
      phone: '(555) 871-9920'
    },
    encryptedHistoryPayload: encryptData(initialMedicalHistories['PT-002'])
  },
  {
    id: 'PT-003',
    mrn: 'MRN-550183',
    name: 'Julian Sterling',
    dob: '1995-11-09',
    gender: 'Male',
    bloodType: 'B+',
    phone: '(555) 602-1144',
    email: 'j.sterling@designstudio.org',
    admissionStatus: 'Admitted',
    bedId: 'BED-SURG-201',
    primaryPhysician: 'Dr. Arthur Nolan',
    insurance: {
      provider: 'Aetna Open Access',
      policyNumber: 'AET-71029348',
      groupNumber: 'GRP-NY-3104',
      copayAmount: 40,
      coinsurancePercent: 20,
      eligibilityStatus: 'Active',
      verifiedAt: '2026-09-17 09:30'
    },
    emergencyContact: {
      name: 'Maya Lin',
      relationship: 'Partner',
      phone: '(555) 602-9901'
    },
    encryptedHistoryPayload: encryptData(initialMedicalHistories['PT-003'])
  },
  {
    id: 'PT-004',
    mrn: 'MRN-449102',
    name: 'Sophia Ramirez',
    dob: '2004-05-30',
    gender: 'Female',
    bloodType: 'AB+',
    phone: '(555) 431-7788',
    email: 'sophiaramirez@edu.state.org',
    admissionStatus: 'In Triage',
    bedId: 'BED-ER-01',
    primaryPhysician: 'Dr. Kenneth Thorne',
    insurance: {
      provider: 'Cigna HealthSpring',
      policyNumber: 'CIG-90412850',
      groupNumber: 'GRP-FL-1002',
      copayAmount: 75,
      coinsurancePercent: 10,
      eligibilityStatus: 'Active',
      verifiedAt: '2026-09-17 19:40'
    },
    emergencyContact: {
      name: 'Rosa Ramirez',
      relationship: 'Mother',
      phone: '(555) 431-7789'
    },
    encryptedHistoryPayload: encryptData({
      allergies: [{ substance: 'Sulfa', severity: 'Mild', reaction: 'Rash' }],
      diagnoses: [{ code: 'K35.80', name: 'Unspecified acute appendicitis', diagnosedDate: '2026-09-17', diagnosedBy: 'Dr. Kenneth Thorne', status: 'Active' }],
      clinicalNotes: [{ id: 'CN-8901', date: '2026-09-17 19:45', doctorName: 'Dr. Kenneth Thorne', specialty: 'Emergency Medicine', note: 'Right lower quadrant pain, positive McBurney sign, leukocytosis 15.2. STAT abdominal ultrasound ordered.', confidentialityLevel: 'standard' }],
      medications: [{ name: 'Ondansetron', dosage: '4 mg', frequency: 'Single dose', route: 'IV', prescribedBy: 'Dr. Kenneth Thorne', startDate: '2026-09-17' }],
      surgeries: [],
      labResults: [{ testName: 'WBC', result: '15.2', referenceRange: '4.5 - 11.0', flag: 'abnormal', date: '2026-09-17 19:50', labTechnician: 'Tech A. Morales' }]
    })
  },
  {
    id: 'PT-005',
    mrn: 'MRN-331908',
    name: 'Robert Taylor',
    dob: '1959-12-04',
    gender: 'Male',
    bloodType: 'A-',
    phone: '(555) 901-2244',
    email: 'rtaylor@homeconsult.com',
    admissionStatus: 'Outpatient',
    bedId: undefined,
    primaryPhysician: 'Dr. Evelyn Reed',
    insurance: {
      provider: 'Medicare Part B',
      policyNumber: 'MED-1GA4-TE9-92',
      groupNumber: 'CMS-FEDERAL',
      copayAmount: 20,
      coinsurancePercent: 20,
      eligibilityStatus: 'Active',
      verifiedAt: '2026-09-12 14:00'
    },
    emergencyContact: {
      name: 'Brenda Taylor',
      relationship: 'Wife',
      phone: '(555) 901-2245'
    },
    encryptedHistoryPayload: encryptData({
      allergies: [],
      diagnoses: [{ code: 'I48.91', name: 'Unspecified atrial fibrillation', diagnosedDate: '2024-02-18', diagnosedBy: 'Dr. Evelyn Reed', status: 'Chronic' }],
      clinicalNotes: [{ id: 'CN-8610', date: '2026-09-12 14:30', doctorName: 'Dr. Evelyn Reed', specialty: 'Cardiology', note: 'Routine follow up for anticoagulation monitoring. INR therapeutic at 2.4.', confidentialityLevel: 'standard' }],
      medications: [{ name: 'Warfarin', dosage: '5 mg', frequency: 'Daily at 6PM', route: 'Oral', prescribedBy: 'Dr. Evelyn Reed', startDate: '2024-02-20' }],
      surgeries: [],
      labResults: [{ testName: 'INR', result: '2.4', referenceRange: '2.0 - 3.0', flag: 'normal', date: '2026-09-12 13:45', labTechnician: 'Tech K. Davis' }]
    })
  }
];

let beds: any[] = [
  // ICU
  {
    id: 'BED-ICU-01',
    bedNumber: 'ICU-01',
    department: 'ICU',
    roomNumber: 'Room 101',
    floor: 3,
    status: 'available',
    notes: 'Equipped with Hamilton-C6 mechanical ventilator and hemodialysis hookup.'
  },
  {
    id: 'BED-ICU-02',
    bedNumber: 'ICU-02',
    department: 'ICU',
    roomNumber: 'Room 102',
    floor: 3,
    status: 'occupied',
    patientId: 'PT-001',
    patientName: 'Eleanor Vance',
    patientMrn: 'MRN-849201',
    assignedDoctor: 'Dr. Evelyn Reed',
    assignedNurse: 'Nurse James Miller',
    admittedAt: '2026-09-15 06:45',
    telemetry: {
      heartRate: 74,
      bloodPressure: '124/78',
      oxygenSat: 98,
      temperature: 98.4,
      respiratoryRate: 16,
      lastUpdated: 'Just now',
      alertStatus: 'normal'
    },
    notes: 'Post-PCI cardiac monitoring'
  },
  {
    id: 'BED-ICU-03',
    bedNumber: 'ICU-03',
    department: 'ICU',
    roomNumber: 'Room 103',
    floor: 3,
    status: 'cleaning',
    notes: 'Deep sterilization and air filtration cycle in progress. Estimated 18 min.'
  },
  // Emergency (ER)
  {
    id: 'BED-ER-01',
    bedNumber: 'ER-Bay-01',
    department: 'Emergency (ER)',
    roomNumber: 'Trauma Bay 1',
    floor: 1,
    status: 'occupied',
    patientId: 'PT-004',
    patientName: 'Sophia Ramirez',
    patientMrn: 'MRN-449102',
    assignedDoctor: 'Dr. Kenneth Thorne',
    assignedNurse: 'Nurse Sarah Connor',
    admittedAt: '2026-09-17 19:30',
    telemetry: {
      heartRate: 104,
      bloodPressure: '118/74',
      oxygenSat: 99,
      temperature: 101.2,
      respiratoryRate: 20,
      lastUpdated: '1 min ago',
      alertStatus: 'elevated'
    },
    notes: 'Suspected acute appendicitis; pending surgical consult'
  },
  {
    id: 'BED-ER-02',
    bedNumber: 'ER-Bay-02',
    department: 'Emergency (ER)',
    roomNumber: 'Rapid Triage 2',
    floor: 1,
    status: 'available',
    notes: 'Crash cart stocked and ready'
  },
  {
    id: 'BED-ER-03',
    bedNumber: 'ER-Bay-03',
    department: 'Emergency (ER)',
    roomNumber: 'Rapid Triage 3',
    floor: 1,
    status: 'available',
    notes: 'Pediatric immobilization boards available'
  },
  // Surgical Ward
  {
    id: 'BED-SURG-201',
    bedNumber: 'SURG-201',
    department: 'Surgical',
    roomNumber: 'Room 201',
    floor: 2,
    status: 'occupied',
    patientId: 'PT-003',
    patientName: 'Julian Sterling',
    patientMrn: 'MRN-550183',
    assignedDoctor: 'Dr. Arthur Nolan',
    assignedNurse: 'Nurse James Miller',
    admittedAt: '2026-09-17 10:00',
    telemetry: {
      heartRate: 82,
      bloodPressure: '130/84',
      oxygenSat: 97,
      temperature: 98.6,
      respiratoryRate: 15,
      lastUpdated: '2 min ago',
      alertStatus: 'normal'
    },
    notes: 'Pre-op fasting for right tibial intramedullary rod fixation'
  },
  {
    id: 'BED-SURG-202',
    bedNumber: 'SURG-202',
    department: 'Surgical',
    roomNumber: 'Room 202',
    floor: 2,
    status: 'maintenance',
    notes: 'Telemetry monitor calibration scheduled'
  },
  // General Ward
  {
    id: 'BED-GEN-104',
    bedNumber: 'GEN-104',
    department: 'General Ward',
    roomNumber: 'Room 404',
    floor: 4,
    status: 'occupied',
    patientId: 'PT-002',
    patientName: 'Marcus Holloway',
    patientMrn: 'MRN-773194',
    assignedDoctor: 'Dr. Samantha Wu',
    assignedNurse: 'Nurse Maria Santos',
    admittedAt: '2026-09-16 11:20',
    telemetry: {
      heartRate: 88,
      bloodPressure: '138/86',
      oxygenSat: 95,
      temperature: 99.1,
      respiratoryRate: 18,
      lastUpdated: '4 min ago',
      alertStatus: 'normal'
    },
    notes: 'COPD exacerbation with lobar pneumonia; on 2L nasal cannula'
  },
  {
    id: 'BED-GEN-105',
    bedNumber: 'GEN-105',
    department: 'General Ward',
    roomNumber: 'Room 405',
    floor: 4,
    status: 'available',
    notes: 'Bariatric rated frame'
  },
  // Pediatrics
  {
    id: 'BED-PED-301',
    bedNumber: 'PED-301',
    department: 'Pediatrics',
    roomNumber: 'Room 501',
    floor: 5,
    status: 'available',
    notes: 'Family pullout sleeper bed available'
  },
  // Maternity
  {
    id: 'BED-MAT-401',
    bedNumber: 'MAT-401',
    department: 'Maternity',
    roomNumber: 'L&D Suite 1',
    floor: 2,
    status: 'available',
    notes: 'Fetal telemetry monitor connected'
  }
];

let appointments = [
  {
    id: 'APT-901',
    patientId: 'PT-005',
    patientName: 'Robert Taylor',
    patientMrn: 'MRN-331908',
    doctorName: 'Dr. Evelyn Reed',
    specialty: 'Cardiology',
    dateTime: '2026-09-18 09:30',
    durationMinutes: 30,
    urgency: 'Routine',
    reasonForVisit: 'Quarterly Atrial Fibrillation follow-up and ECG check',
    status: 'Scheduled',
    room: 'Cardio Suite 3B',
    triagePriorityScore: 4,
    scheduledMethod: 'Manual'
  },
  {
    id: 'APT-902',
    patientId: 'PT-002',
    patientName: 'Marcus Holloway',
    patientMrn: 'MRN-773194',
    doctorName: 'Dr. Samantha Wu',
    specialty: 'Pulmonology',
    dateTime: '2026-09-18 11:00',
    durationMinutes: 45,
    urgency: 'Urgent',
    reasonForVisit: 'Post-discharge pulmonary function test and inhaler review',
    status: 'Scheduled',
    room: 'Pulmonary Clinic 102',
    triagePriorityScore: 7,
    scheduledMethod: 'AI Automated Triage Engine'
  },
  {
    id: 'APT-903',
    patientId: 'PT-003',
    patientName: 'Julian Sterling',
    patientMrn: 'MRN-550183',
    doctorName: 'Dr. Arthur Nolan',
    specialty: 'Orthopedic Surgery',
    dateTime: '2026-09-17 14:00',
    durationMinutes: 60,
    urgency: 'Emergency',
    reasonForVisit: 'OR Tibial Intramedullary Nailing Fixation',
    status: 'In-Consultation',
    room: 'OR-4',
    triagePriorityScore: 9,
    scheduledMethod: 'AI Automated Triage Engine'
  },
  {
    id: 'APT-904',
    patientId: 'PT-001',
    patientName: 'Eleanor Vance',
    patientMrn: 'MRN-849201',
    doctorName: 'Dr. Evelyn Reed',
    specialty: 'Cardiology',
    dateTime: '2026-09-17 08:00',
    durationMinutes: 30,
    urgency: 'Urgent',
    reasonForVisit: 'Post-PCI morning echocardiogram and bedside round',
    status: 'Completed',
    room: 'ICU-Bed 02',
    triagePriorityScore: 8,
    scheduledMethod: 'Manual'
  }
];

let insuranceClaims: any[] = [
  {
    id: 'CLM-2026-001',
    claimNumber: 'CLM-90481-TX',
    patientId: 'PT-001',
    patientName: 'Eleanor Vance',
    patientMrn: 'MRN-849201',
    insuranceProvider: 'Blue Cross Blue Shield PPO',
    policyNumber: 'BCBS-99482104-A',
    dateOfService: '2026-09-15',
    renderingProvider: 'Dr. Evelyn Reed, MD (NPI: 1982049102)',
    diagnoses: [
      { code: 'I21.9', description: 'Acute myocardial infarction, unspecified' },
      { code: 'I10', description: 'Essential (primary) hypertension' }
    ],
    procedures: [
      { cptCode: '92928', description: 'Percutaneous transcatheter placement of intracoronary stent, single vessel', unit: 1, fee: 14500, approvedAmount: 13200 },
      { cptCode: '93306', description: 'Transthoracic echocardiography (TTE) complete', unit: 1, fee: 1850, approvedAmount: 1650 },
      { cptCode: '99223', description: 'Initial hospital care, high complexity, per day', unit: 1, fee: 720, approvedAmount: 680 }
    ],
    totalBilledAmount: 17070,
    insuranceApprovedAmount: 15530,
    copayAmount: 50,
    patientDueAmount: 3156, // 20% coinsurance + copay
    status: 'Approved',
    electronicBatchId: 'EDI-837P-90812',
    submittedAt: '2026-09-16 09:30',
    adjudicatedAt: '2026-09-16 11:45',
    payerTransactionId: 'BCBS-TX-ADJ-881903',
    eobExplanation: 'Claim clean; pre-authorization #PA-8849 verified. Benefit paid according to in-network tier 1 rate.'
  },
  {
    id: 'CLM-2026-002',
    claimNumber: 'CLM-90482-TX',
    patientId: 'PT-002',
    patientName: 'Marcus Holloway',
    patientMrn: 'MRN-773194',
    insuranceProvider: 'UnitedHealthcare Choice Plus',
    policyNumber: 'UHC-448102941',
    dateOfService: '2026-09-16',
    renderingProvider: 'Dr. Samantha Wu, MD (NPI: 1407289104)',
    diagnoses: [
      { code: 'J18.9', description: 'Pneumonia, unspecified organism' },
      { code: 'J44.1', description: 'COPD with acute exacerbation' }
    ],
    procedures: [
      { cptCode: '99285', description: 'Emergency department visit, high severity/threat', unit: 1, fee: 1250 },
      { cptCode: '71045', description: 'Chest Radiograph, Single View', unit: 1, fee: 380 },
      { cptCode: '94640', description: 'Pressurized or nonpressurized inhalation treatment', unit: 2, fee: 320 }
    ],
    totalBilledAmount: 1950,
    copayAmount: 35,
    patientDueAmount: 327.50,
    status: 'In-Adjudication',
    electronicBatchId: 'EDI-837P-90814',
    submittedAt: '2026-09-17 07:15',
    payerTransactionId: 'UHC-PEND-904221',
    eobExplanation: 'Electronic clearinghouse clearing stage 2: awaiting clinical review of radiograph documentation.'
  },
  {
    id: 'CLM-2026-003',
    claimNumber: 'CLM-90483-TX',
    patientId: 'PT-003',
    patientName: 'Julian Sterling',
    patientMrn: 'MRN-550183',
    insuranceProvider: 'Aetna Open Access',
    policyNumber: 'AET-71029348',
    dateOfService: '2026-09-17',
    renderingProvider: 'Dr. Arthur Nolan, MD (NPI: 1209384719)',
    diagnoses: [
      { code: 'S82.201A', description: 'Fracture of shaft of right tibia, initial encounter' }
    ],
    procedures: [
      { cptCode: '27759', description: 'Treatment of tibial shaft fracture with intramedullary implant', unit: 1, fee: 8900 },
      { cptCode: '73590', description: 'Radiologic examination, tibia and fibula; 2 views', unit: 1, fee: 440 }
    ],
    totalBilledAmount: 9340,
    copayAmount: 40,
    patientDueAmount: 1908,
    status: 'Submitted',
    electronicBatchId: 'EDI-837P-90816',
    submittedAt: '2026-09-17 12:30',
    payerTransactionId: 'AET-TXN-449102'
  }
];

let auditLogs: any[] = [
  {
    id: 'AUD-1001',
    timestamp: '2026-09-17 08:30:15',
    actorId: 'DOC-REED',
    actorName: 'Dr. Evelyn Reed',
    actorRole: 'doctor',
    actionType: 'EHR_DECRYPT',
    patientId: 'PT-001',
    patientMrn: 'MRN-849201',
    patientName: 'Eleanor Vance',
    resourceType: 'Patient',
    resourceId: 'PT-001',
    clinicalJustification: 'Daily morning ICU rounds and telemetry review',
    details: 'Decrypted AES-256 medical record for clinical assessment.',
    severity: 'info',
    ipAddress: '10.14.2.88 (ICU Workstation 3)',
    hashSignature: 'a7f920bc49102ef1'
  },
  {
    id: 'AUD-1002',
    timestamp: '2026-09-17 10:00:22',
    actorId: 'NURSE-MILLER',
    actorName: 'Nurse James Miller',
    actorRole: 'nurse',
    actionType: 'BED_ADMIT',
    patientId: 'PT-003',
    patientMrn: 'MRN-550183',
    patientName: 'Julian Sterling',
    resourceType: 'Bed',
    resourceId: 'BED-SURG-201',
    clinicalJustification: 'Admitted from trauma department for emergency surgery',
    details: 'Assigned bed BED-SURG-201 on Floor 2 Surgical Ward.',
    severity: 'info',
    ipAddress: '10.14.1.12 (Surgical Station A)',
    hashSignature: 'b81932cd90124fe2'
  },
  {
    id: 'AUD-1003',
    timestamp: '2026-09-17 11:45:00',
    actorId: 'BILL-SARAH',
    actorName: 'Sarah Jenkins',
    actorRole: 'billing',
    actionType: 'CLAIM_ADJUDICATION',
    patientId: 'PT-001',
    patientMrn: 'MRN-849201',
    patientName: 'Eleanor Vance',
    resourceType: 'Claim',
    resourceId: 'CLM-2026-001',
    clinicalJustification: 'Real-time 835 EDI Remittance Advice received from Blue Cross Blue Shield',
    details: 'Claim approved for $15,530.00. Coinsurance calculated at $3,156.00.',
    severity: 'info',
    ipAddress: '10.14.0.45 (Revenue Cycle Office)',
    hashSignature: 'c90184da382910fa'
  },
  {
    id: 'AUD-1004',
    timestamp: '2026-09-17 19:30:10',
    actorId: 'DOC-THORNE',
    actorName: 'Dr. Kenneth Thorne',
    actorRole: 'doctor',
    actionType: 'BREAK_GLASS_OVERRIDE',
    patientId: 'PT-004',
    patientMrn: 'MRN-449102',
    patientName: 'Sophia Ramirez',
    resourceType: 'Patient',
    resourceId: 'PT-004',
    clinicalJustification: 'EMERGENCY: Acute abdomen with peritoneal signs, needed immediate allergy and history access prior to sedation',
    details: 'Break-glass protocol invoked. Clinical bypass logged to compliance queue.',
    severity: 'critical',
    ipAddress: '10.14.0.1 (Trauma Bay 1 Terminal)',
    hashSignature: 'd09124ef819203bc'
  }
];

const ICD10_CATALOG = [
  { code: 'I21.9', description: 'Acute myocardial infarction, unspecified', category: 'Cardiovascular' },
  { code: 'I10', description: 'Essential (primary) hypertension', category: 'Cardiovascular' },
  { code: 'I48.91', description: 'Unspecified atrial fibrillation', category: 'Cardiovascular' },
  { code: 'J18.9', description: 'Pneumonia, unspecified organism', category: 'Respiratory' },
  { code: 'J44.1', description: 'Chronic obstructive pulmonary disease with acute exacerbation', category: 'Respiratory' },
  { code: 'J45.901', description: 'Unspecified asthma with (acute) exacerbation', category: 'Respiratory' },
  { code: 'S82.201A', description: 'Fracture of shaft of right tibia, initial encounter', category: 'Injury/Trauma' },
  { code: 'K35.80', description: 'Unspecified acute appendicitis', category: 'Gastrointestinal' },
  { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', category: 'Endocrine' },
  { code: 'N17.9', description: 'Acute kidney failure, unspecified', category: 'Nephrology' },
  { code: 'A41.9', description: 'Sepsis, unspecified organism', category: 'Infectious' },
  { code: 'G43.909', description: 'Migraine, unspecified, not intractable', category: 'Neurology' }
];

const CPT_CATALOG = [
  { code: '99285', description: 'Emergency department visit, high severity/threat', standardFee: 1250, category: 'Evaluation & Management' },
  { code: '99223', description: 'Initial hospital care, high complexity, per day', standardFee: 720, category: 'Inpatient E/M' },
  { code: '99213', description: 'Office or other outpatient visit, established patient, 20-29 min', standardFee: 195, category: 'Outpatient E/M' },
  { code: '92928', description: 'Percutaneous transcatheter placement of intracoronary stent, single vessel', standardFee: 14500, category: 'Cardiovascular Surgery' },
  { code: '93306', description: 'Transthoracic echocardiography (TTE) complete', standardFee: 1850, category: 'Cardiology Diagnostics' },
  { code: '27759', description: 'Treatment of tibial shaft fracture with intramedullary implant', standardFee: 8900, category: 'Orthopedic Surgery' },
  { code: '44970', description: 'Laparoscopic appendectomy', standardFee: 6400, category: 'General Surgery' },
  { code: '71045', description: 'Chest Radiograph, Single View', standardFee: 380, category: 'Radiology' },
  { code: '70450', description: 'CT Head or Brain without contrast', standardFee: 1400, category: 'Radiology' },
  { code: '80053', description: 'Comprehensive metabolic panel (CMP)', standardFee: 120, category: 'Laboratory' },
  { code: '85025', description: 'Complete Blood Count (CBC) with automated differential', standardFee: 85, category: 'Laboratory' },
  { code: '94640', description: 'Pressurized or nonpressurized inhalation treatment', standardFee: 160, category: 'Respiratory Care' }
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper to record HIPAA Audit Log
  const recordAudit = (params: {
    actorId: string;
    actorName: string;
    actorRole: string;
    actionType: string;
    patientId?: string;
    patientMrn?: string;
    patientName?: string;
    resourceType: 'Patient' | 'Bed' | 'Appointment' | 'Claim' | 'Session';
    resourceId?: string;
    clinicalJustification?: string;
    details: string;
    severity?: 'info' | 'warning' | 'critical';
    ipAddress?: string;
  }) => {
    const entry: any = {
      id: `AUD-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actorId: params.actorId || 'SYSTEM',
      actorName: params.actorName || 'Clinical User',
      actorRole: (params.actorRole as any) || 'doctor',
      actionType: params.actionType as any,
      patientId: params.patientId,
      patientMrn: params.patientMrn,
      patientName: params.patientName,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      clinicalJustification: params.clinicalJustification,
      details: params.details,
      severity: params.severity || 'info',
      ipAddress: params.ipAddress || '127.0.0.1 (Localhost Clinic Station)',
      hashSignature: generateAuditHash(params)
    };
    auditLogs.unshift(entry);
    return entry;
  };

  // --- API Routes ---

  // Health
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString(), server: 'Smart-Hospital-EHR-Core' });
  });

  // Overall Stats
  app.get('/api/stats', (req: Request, res: Response) => {
    const totalBeds = beds.length;
    const occupiedBeds = beds.filter(b => b.status === 'occupied').length;
    const availableBeds = beds.filter(b => b.status === 'available').length;
    const cleaningBeds = beds.filter(b => b.status === 'cleaning').length;
    const icuBeds = beds.filter(b => b.department === 'ICU');
    const icuOccupied = icuBeds.filter(b => b.status === 'occupied').length;

    const totalBilledToday = insuranceClaims.reduce((acc, c) => acc + c.totalBilledAmount, 0);
    const pendingClaims = insuranceClaims.filter(c => c.status === 'Submitted' || c.status === 'In-Adjudication').length;
    const breakGlassAlerts = auditLogs.filter(a => a.actionType === 'BREAK_GLASS_OVERRIDE').length;

    res.json({
      totalBeds,
      occupiedBeds,
      availableBeds,
      cleaningBeds,
      occupancyRate: Math.round((occupiedBeds / (totalBeds || 1)) * 100),
      icuOccupancyRate: Math.round((icuOccupied / (icuBeds.length || 1)) * 100),
      erWaitCount: beds.filter(b => b.department === 'Emergency (ER)' && b.status === 'occupied').length,
      todayAppointmentsCount: appointments.length,
      pendingClaimsCount: pendingClaims,
      totalBilledToday,
      activeEhrDecryptions: auditLogs.filter(a => a.actionType === 'EHR_DECRYPT').length,
      breakGlassAlertsToday: breakGlassAlerts
    });
  });

  // Beds Management
  app.get('/api/beds', (req: Request, res: Response) => {
    res.json(beds);
  });

  // Admit patient to bed
  app.post('/api/beds/admit', (req: Request, res: Response) => {
    const { bedId, patientId, doctorName, nurseName, notes, actorName, actorRole } = req.body;
    const bed = beds.find(b => b.id === bedId);
    const patient = patients.find(p => p.id === patientId);

    if (!bed) {
      res.status(404).json({ error: 'Bed not found' });
      return;
    }
    if (bed.status !== 'available' && bed.status !== 'reserved') {
      res.status(400).json({ error: `Bed is currently ${bed.status}. Only available beds can accept admissions.` });
      return;
    }
    if (!patient) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    // Update bed
    bed.status = 'occupied';
    bed.patientId = patient.id;
    bed.patientName = patient.name;
    bed.patientMrn = patient.mrn;
    bed.assignedDoctor = doctorName || patient.primaryPhysician;
    bed.assignedNurse = nurseName || 'Nurse Staff';
    bed.admittedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    bed.notes = notes || 'Admitted to ward';
    bed.telemetry = {
      heartRate: Math.floor(Math.random() * 25 + 68),
      bloodPressure: '120/80',
      oxygenSat: 98,
      temperature: 98.6,
      respiratoryRate: 16,
      lastUpdated: 'Just now',
      alertStatus: 'normal'
    };

    // Update patient
    patient.admissionStatus = 'Admitted';
    patient.bedId = bed.id;

    recordAudit({
      actorId: 'PROVIDER',
      actorName: actorName || 'Healthcare Provider',
      actorRole: actorRole || 'nurse',
      actionType: 'BED_ADMIT',
      patientId: patient.id,
      patientMrn: patient.mrn,
      patientName: patient.name,
      resourceType: 'Bed',
      resourceId: bed.id,
      clinicalJustification: `Admitted patient to ${bed.bedNumber} (${bed.department})`,
      details: `Bed admission processed. Assigned doctor: ${bed.assignedDoctor}, Nurse: ${bed.assignedNurse}`
    });

    res.json({ success: true, bed, patient });
  });

  // Discharge patient from bed
  app.post('/api/beds/discharge', (req: Request, res: Response) => {
    const { bedId, actorName, actorRole, clinicalNotes } = req.body;
    const bed = beds.find(b => b.id === bedId);
    if (!bed) {
      res.status(404).json({ error: 'Bed not found' });
      return;
    }

    const patient = patients.find(p => p.id === bed.patientId);
    const dischargedPatientName = bed.patientName;
    const dischargedMrn = bed.patientMrn;

    if (patient) {
      patient.admissionStatus = 'Discharged';
      patient.bedId = undefined;
    }

    // Reset bed to cleaning
    bed.status = 'cleaning';
    bed.patientId = undefined;
    bed.patientName = undefined;
    bed.patientMrn = undefined;
    bed.telemetry = undefined;
    bed.admittedAt = undefined;
    bed.notes = 'Patient discharged; sanitization and terminal cleaning underway.';

    recordAudit({
      actorId: 'PROVIDER',
      actorName: actorName || 'Healthcare Provider',
      actorRole: actorRole || 'doctor',
      actionType: 'BED_DISCHARGE',
      patientMrn: dischargedMrn,
      patientName: dischargedPatientName,
      resourceType: 'Bed',
      resourceId: bed.id,
      clinicalJustification: clinicalNotes || 'Patient met clinical discharge criteria',
      details: `Discharged from ${bed.bedNumber}. Bed flagged for sanitization.`
    });

    res.json({ success: true, bed });
  });

  // Sanitize bed
  app.post('/api/beds/:id/sanitize', (req: Request, res: Response) => {
    const bed = beds.find(b => b.id === req.params.id);
    if (!bed) {
      res.status(404).json({ error: 'Bed not found' });
      return;
    }
    bed.status = 'available';
    bed.notes = 'Sanitization inspected and verified by infection control.';
    res.json({ success: true, bed });
  });

  // Transfer bed
  app.post('/api/beds/transfer', (req: Request, res: Response) => {
    const { fromBedId, toBedId, actorName, actorRole, transferReason } = req.body;
    const fromBed = beds.find(b => b.id === fromBedId);
    const toBed = beds.find(b => b.id === toBedId);

    if (!fromBed || !toBed) {
      res.status(404).json({ error: 'One or both beds not found' });
      return;
    }
    if (toBed.status !== 'available') {
      res.status(400).json({ error: `Destination bed ${toBed.bedNumber} is not available.` });
      return;
    }
    if (fromBed.status !== 'occupied' || !fromBed.patientId) {
      res.status(400).json({ error: `Source bed ${fromBed.bedNumber} is not occupied.` });
      return;
    }

    const patient = patients.find(p => p.id === fromBed.patientId);

    // Transfer details
    toBed.status = 'occupied';
    toBed.patientId = fromBed.patientId;
    toBed.patientName = fromBed.patientName;
    toBed.patientMrn = fromBed.patientMrn;
    toBed.assignedDoctor = fromBed.assignedDoctor;
    toBed.assignedNurse = fromBed.assignedNurse;
    toBed.admittedAt = fromBed.admittedAt;
    toBed.telemetry = fromBed.telemetry;
    toBed.notes = `Transferred from ${fromBed.bedNumber}. Reason: ${transferReason || 'Step-down'}`;

    fromBed.status = 'cleaning';
    fromBed.patientId = undefined;
    fromBed.patientName = undefined;
    fromBed.patientMrn = undefined;
    fromBed.telemetry = undefined;
    fromBed.notes = `Transferred to ${toBed.bedNumber}; awaiting terminal cleaning`;

    if (patient) {
      patient.bedId = toBed.id;
    }

    recordAudit({
      actorId: 'PROVIDER',
      actorName: actorName || 'Healthcare Provider',
      actorRole: actorRole || 'nurse',
      actionType: 'BED_TRANSFER',
      patientId: patient?.id,
      patientMrn: patient?.mrn,
      patientName: patient?.name,
      resourceType: 'Bed',
      resourceId: toBed.id,
      clinicalJustification: transferReason || 'Clinical ward transfer',
      details: `Transferred patient from ${fromBed.bedNumber} (${fromBed.department}) to ${toBed.bedNumber} (${toBed.department})`
    });

    res.json({ success: true, fromBed, toBed });
  });

  // Patients list (returns encrypted payload without decrypted plaintext)
  app.get('/api/patients', (req: Request, res: Response) => {
    // Return all patients with their encrypted EHR payloads intact
    res.json(patients);
  });

  // Register new patient
  app.post('/api/patients', (req: Request, res: Response) => {
    const { name, dob, gender, bloodType, phone, email, insuranceProvider, policyNumber, actorName, actorRole } = req.body;
    if (!name || !dob) {
      res.status(400).json({ error: 'Patient name and date of birth are required.' });
      return;
    }

    const newId = `PT-${Date.now().toString().slice(-4)}`;
    const newMrn = `MRN-${Math.floor(Math.random() * 899999 + 100000)}`;

    const emptyHistory = {
      allergies: [],
      diagnoses: [],
      clinicalNotes: [
        {
          id: `CN-${Date.now().toString().slice(-4)}`,
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          doctorName: actorName || 'Admitting Physician',
          specialty: 'Intake Assessment',
          note: 'Initial electronic medical record initialized upon admission intake.',
          confidentialityLevel: 'standard'
        }
      ],
      medications: [],
      surgeries: [],
      labResults: []
    };

    const newPatient = {
      id: newId,
      mrn: newMrn,
      name,
      dob,
      gender: gender || 'Other',
      bloodType: bloodType || 'O+',
      phone: phone || '(555) 000-0000',
      email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@email.com`,
      admissionStatus: 'Outpatient',
      primaryPhysician: actorName || 'Staff Physician',
      insurance: {
        provider: insuranceProvider || 'Direct Self-Pay / Cash',
        policyNumber: policyNumber || 'SELF-9900',
        groupNumber: 'N/A',
        copayAmount: 25,
        coinsurancePercent: 0,
        eligibilityStatus: 'Active',
        verifiedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
      },
      emergencyContact: {
        name: 'Authorized Proxy',
        relationship: 'Emergency Contact',
        phone: phone || '(555) 000-0000'
      },
      encryptedHistoryPayload: encryptData(emptyHistory)
    };

    patients.push(newPatient as any);

    recordAudit({
      actorId: 'INTAKE',
      actorName: actorName || 'Registrar',
      actorRole: actorRole || 'admin',
      actionType: 'PHI_VIEW',
      patientId: newPatient.id,
      patientMrn: newPatient.mrn,
      patientName: newPatient.name,
      resourceType: 'Patient',
      resourceId: newPatient.id,
      clinicalJustification: 'New patient intake registration',
      details: `Created new patient MRN: ${newMrn} with AES-256 encrypted medical ledger.`
    });

    res.status(201).json(newPatient);
  });

  // Decrypt patient medical history (HIPAA Enforced Role-based & Break-Glass Access)
  app.post('/api/patients/:id/decrypt', (req: Request, res: Response) => {
    const { id } = req.params;
    const { actorId, actorName, actorRole, justification, isBreakGlass } = req.body;

    const patient = patients.find(p => p.id === id);
    if (!patient) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    // Role check: Only doctors, nurses, admins or break-glass can decrypt full medical histories
    const allowedRoles = ['doctor', 'nurse', 'admin'];
    const isAuthorizedRole = allowedRoles.includes(actorRole);

    if (!isAuthorizedRole && !isBreakGlass) {
      recordAudit({
        actorId: actorId || 'UNKNOWN',
        actorName: actorName || 'Unauthenticated Actor',
        actorRole: actorRole || 'patient',
        actionType: 'PHI_VIEW',
        patientId: patient.id,
        patientMrn: patient.mrn,
        patientName: patient.name,
        resourceType: 'Patient',
        resourceId: patient.id,
        clinicalJustification: 'Unauthorized decryption attempt rejected',
        details: `Access denied for role '${actorRole}'. AES-256 payload remained sealed.`,
        severity: 'warning'
      });
      res.status(403).json({
        error: 'HIPAA Security Violation: Your current role lacks cryptographic authorization to unseal this Protected Health Information (PHI).'
      });
      return;
    }

    try {
      const decrypted = decryptData(patient.encryptedHistoryPayload);

      // Audit logging for HIPAA compliance
      const auditType = isBreakGlass ? 'BREAK_GLASS_OVERRIDE' : 'EHR_DECRYPT';
      const severity = isBreakGlass ? 'critical' : 'info';

      recordAudit({
        actorId: actorId || 'CLINICIAN',
        actorName: actorName || 'Healthcare Provider',
        actorRole: actorRole || 'doctor',
        actionType: auditType,
        patientId: patient.id,
        patientMrn: patient.mrn,
        patientName: patient.name,
        resourceType: 'Patient',
        resourceId: patient.id,
        clinicalJustification: justification || (isBreakGlass ? 'Emergency break-glass intervention' : 'Routine clinical care review'),
        details: isBreakGlass
          ? `EMERGENCY BREAK-GLASS: Unsealed patient medical history. Mandatory audit justification: "${justification || 'Emergency medical necessity'}"`
          : `Authenticated AES-256 GCM unsealing performed for authorized role '${actorRole}'.`,
        severity
      });

      res.json({
        success: true,
        patientId: patient.id,
        decryptedHistory: {
          ...decrypted,
          lastDecryptedAt: new Date().toISOString(),
          decryptedBy: actorName || 'Authorized Clinician',
          accessMode: isBreakGlass ? 'BREAK_GLASS_AUTHORIZED' : 'STANDARD_RBAC_AUTHORIZED'
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Decryption failed: ' + err.message });
    }
  });

  // Add clinical note or allergy to patient history (re-encrypts with AES-256-GCM)
  app.post('/api/patients/:id/add-clinical-note', (req: Request, res: Response) => {
    const { id } = req.params;
    const { note, specialty, doctorName, actorRole } = req.body;

    const patient = patients.find(p => p.id === id);
    if (!patient) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    try {
      // Decrypt current history
      const history = decryptData(patient.encryptedHistoryPayload);
      
      const newNote = {
        id: `CN-${Date.now().toString().slice(-4)}`,
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        doctorName: doctorName || 'Attending Physician',
        specialty: specialty || 'General Clinical',
        note,
        confidentialityLevel: 'standard'
      };

      history.clinicalNotes.unshift(newNote);

      // Re-encrypt
      patient.encryptedHistoryPayload = encryptData(history);

      recordAudit({
        actorId: 'CLINICIAN',
        actorName: doctorName || 'Attending Physician',
        actorRole: actorRole || 'doctor',
        actionType: 'EHR_DECRYPT',
        patientId: patient.id,
        patientMrn: patient.mrn,
        patientName: patient.name,
        resourceType: 'Patient',
        resourceId: patient.id,
        clinicalJustification: 'Added new clinical progress note',
        details: `Added progress note #${newNote.id} and re-encrypted record with AES-256-GCM.`
      });

      res.json({ success: true, newNote, decryptedHistory: history });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update encrypted history: ' + err.message });
    }
  });

  // Appointments
  app.get('/api/appointments', (req: Request, res: Response) => {
    res.json(appointments);
  });

  // Manual appointment schedule
  app.post('/api/appointments', (req: Request, res: Response) => {
    const { patientId, doctorName, specialty, dateTime, urgency, reasonForVisit, room, actorName, actorRole } = req.body;
    const patient = patients.find(p => p.id === patientId);

    if (!patient || !doctorName || !dateTime) {
      res.status(400).json({ error: 'Missing required appointment fields.' });
      return;
    }

    const newApt = {
      id: `APT-${Date.now().toString().slice(-4)}`,
      patientId: patient.id,
      patientName: patient.name,
      patientMrn: patient.mrn,
      doctorName,
      specialty: specialty || 'General Medicine',
      dateTime,
      durationMinutes: urgency === 'Urgent' ? 45 : 30,
      urgency: urgency || 'Routine',
      reasonForVisit: reasonForVisit || 'Consultation',
      status: 'Scheduled',
      room: room || 'Consult Room 101',
      triagePriorityScore: urgency === 'Emergency' ? 9 : urgency === 'Urgent' ? 6 : 3,
      scheduledMethod: 'Manual'
    };

    appointments.unshift(newApt as any);

    recordAudit({
      actorId: 'SCHEDULER',
      actorName: actorName || 'Scheduling Coordinator',
      actorRole: actorRole || 'doctor',
      actionType: 'APPOINTMENT_SCHEDULE',
      patientId: patient.id,
      patientMrn: patient.mrn,
      patientName: patient.name,
      resourceType: 'Appointment',
      resourceId: newApt.id,
      clinicalJustification: `Scheduled appointment with ${doctorName}`,
      details: `Scheduled ${urgency} appointment for ${dateTime} in ${newApt.room}.`
    });

    res.status(201).json(newApt);
  });

  // Automated Appointment Scheduling & Triage Algorithm
  app.post('/api/appointments/auto-schedule', (req: Request, res: Response) => {
    const { patientId, conditionDescription, reportedUrgency, preferredDoctor, actorName, actorRole } = req.body;
    const patient = patients.find(p => p.id === patientId);

    if (!patient) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    // Clinical Triage Engine
    const urgentKeywords = ['chest pain', 'shortness of breath', 'fracture', 'trauma', 'bleeding', 'severe', 'acute', 'fainting', 'stroke'];
    const routineKeywords = ['follow up', 'routine', 'annual', 'prescription', 'checkup', 'refill', 'mild'];

    let computedScore = 4; // baseline routine
    const lowerDesc = (conditionDescription || '').toLowerCase();

    if (urgentKeywords.some(k => lowerDesc.includes(k)) || reportedUrgency === 'Emergency') {
      computedScore = 9;
    } else if (reportedUrgency === 'Urgent' || lowerDesc.includes('moderate') || lowerDesc.includes('fever')) {
      computedScore = 7;
    } else if (routineKeywords.some(k => lowerDesc.includes(k))) {
      computedScore = 3;
    }

    // Determine specialty
    let targetSpecialty = 'General Medicine';
    let assignedDoctor = 'Dr. Samantha Wu';
    let assignedRoom = 'Clinic Suite 204';

    if (lowerDesc.includes('heart') || lowerDesc.includes('chest') || lowerDesc.includes('cardiac') || lowerDesc.includes('palpitations')) {
      targetSpecialty = 'Cardiology';
      assignedDoctor = 'Dr. Evelyn Reed';
      assignedRoom = 'Cardio Suite 3B';
    } else if (lowerDesc.includes('bone') || lowerDesc.includes('fracture') || lowerDesc.includes('joint') || lowerDesc.includes('knee') || lowerDesc.includes('tibia')) {
      targetSpecialty = 'Orthopedic Surgery';
      assignedDoctor = 'Dr. Arthur Nolan';
      assignedRoom = 'Orthopedic Clinic 108';
    } else if (lowerDesc.includes('lung') || lowerDesc.includes('breath') || lowerDesc.includes('cough') || lowerDesc.includes('asthma') || lowerDesc.includes('pneumonia')) {
      targetSpecialty = 'Pulmonology';
      assignedDoctor = 'Dr. Samantha Wu';
      assignedRoom = 'Pulmonary Clinic 102';
    } else if (lowerDesc.includes('er') || lowerDesc.includes('emergency') || computedScore >= 9) {
      targetSpecialty = 'Emergency Medicine';
      assignedDoctor = 'Dr. Kenneth Thorne';
      assignedRoom = 'Emergency Bay 02';
    }

    if (preferredDoctor) {
      assignedDoctor = preferredDoctor;
    }

    // Compute optimal time slot (next available based on urgency)
    const now = new Date();
    let slotOffsetHours = computedScore >= 8 ? 2 : computedScore >= 6 ? 18 : 36;
    const slotDate = new Date(now.getTime() + slotOffsetHours * 60 * 60 * 1000);
    // Round to nearest 30 mins
    slotDate.setMinutes(slotDate.getMinutes() >= 30 ? 30 : 0, 0, 0);
    const dateFormatted = slotDate.toISOString().replace('T', ' ').substring(0, 16);

    const calculatedUrgency = computedScore >= 8 ? 'Emergency' : computedScore >= 6 ? 'Urgent' : 'Routine';

    const newAppointment = {
      id: `APT-${Date.now().toString().slice(-4)}`,
      patientId: patient.id,
      patientName: patient.name,
      patientMrn: patient.mrn,
      doctorName: assignedDoctor,
      specialty: targetSpecialty,
      dateTime: dateFormatted,
      durationMinutes: computedScore >= 7 ? 45 : 30,
      urgency: calculatedUrgency,
      reasonForVisit: conditionDescription || 'Triage Intake Evaluation',
      status: 'Scheduled',
      room: assignedRoom,
      triagePriorityScore: computedScore,
      scheduledMethod: 'AI Automated Triage Engine'
    };

    appointments.unshift(newAppointment as any);

    recordAudit({
      actorId: 'TRIAGE_ENGINE',
      actorName: actorName || 'Automated Triage Scheduler',
      actorRole: actorRole || 'admin',
      actionType: 'APPOINTMENT_AUTO_TRIAGE',
      patientId: patient.id,
      patientMrn: patient.mrn,
      patientName: patient.name,
      resourceType: 'Appointment',
      resourceId: newAppointment.id,
      clinicalJustification: `Automated triage matched priority score ${computedScore}/10 to ${targetSpecialty}`,
      details: `Scheduled ${calculatedUrgency} slot for ${assignedDoctor} at ${dateFormatted}. Triage rationale: "${conditionDescription}"`
    });

    res.status(201).json({
      success: true,
      appointment: newAppointment,
      triageDetails: {
        score: computedScore,
        specialtyAssigned: targetSpecialty,
        earliestSlotFound: dateFormatted,
        reasoning: `Based on reported symptoms, patient was triaged with urgency level '${calculatedUrgency}' (Score ${computedScore}/10) and assigned to ${targetSpecialty} with ${assignedDoctor}.`
      }
    });
  });

  // Update appointment status
  app.patch('/api/appointments/:id/status', (req: Request, res: Response) => {
    const { status, actorName, actorRole } = req.body;
    const apt = appointments.find(a => a.id === req.params.id);
    if (!apt) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }
    apt.status = status;

    recordAudit({
      actorId: 'PROVIDER',
      actorName: actorName || 'Clinical Staff',
      actorRole: actorRole || 'nurse',
      actionType: 'APPOINTMENT_SCHEDULE',
      patientId: apt.patientId,
      patientMrn: apt.patientMrn,
      patientName: apt.patientName,
      resourceType: 'Appointment',
      resourceId: apt.id,
      clinicalJustification: `Status updated to ${status}`,
      details: `Appointment ${apt.id} updated to status: ${status}`
    });

    res.json({ success: true, appointment: apt });
  });

  // Insurance Billing Claims
  app.get('/api/billing/claims', (req: Request, res: Response) => {
    res.json(insuranceClaims);
  });

  // ICD-10 and CPT Reference Codes
  app.get('/api/billing/codes', (req: Request, res: Response) => {
    res.json({
      icd10: ICD10_CATALOG,
      cpt: CPT_CATALOG
    });
  });

  // Insurance Eligibility Check (Real-time Payer API Simulation)
  app.post('/api/billing/verify-eligibility', (req: Request, res: Response) => {
    const { payer, policyNumber, groupNumber, patientName, actorName, actorRole } = req.body;

    // Simulate 270/271 Real-Time Eligibility Verification standard
    const isTerminated = policyNumber && policyNumber.endsWith('999');
    const copay = payer.toLowerCase().includes('medicare') ? 20 : payer.toLowerCase().includes('cigna') ? 50 : 35;
    const coinsurance = payer.toLowerCase().includes('medicare') ? 20 : 15;
    const deductible = Math.floor(Math.random() * 800 + 400);

    const result = {
      payerName: payer,
      policyNumber,
      groupNumber: groupNumber || 'DEFAULT-GRP',
      subscriberName: patientName || 'Insured Subscriber',
      status: isTerminated ? 'Inactive / Terminated' : 'Active / In-Network Tier 1',
      copayOfficeVisit: `$${copay}.00`,
      copayEmergencyVisit: `$${copay * 3}.00`,
      coinsurancePercent: `${coinsurance}%`,
      individualDeductibleRemaining: `$${deductible}.00`,
      outOfPocketMaxRemaining: '$2,450.00',
      preAuthRequired: ['Cardiovascular Surgery', 'CT / MRI Diagnostics'],
      verifiedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      clearinghouseReference: `EDI-271-ACK-${Date.now().toString().slice(-6)}`
    };

    recordAudit({
      actorId: 'BILLING',
      actorName: actorName || 'Billing Specialist',
      actorRole: actorRole || 'billing',
      actionType: 'ELIGIBILITY_CHECK',
      patientName: patientName || 'Subscriber',
      resourceType: 'Claim',
      clinicalJustification: 'Real-time 270/271 EDI Eligibility & Benefits Verification',
      details: `Checked policy #${policyNumber} against ${payer}. Result: ${result.status}.`
    });

    res.json(result);
  });

  // Submit Insurance Claim (837 Health Care Claim EDI)
  app.post('/api/billing/claims', (req: Request, res: Response) => {
    const {
      patientId,
      dateOfService,
      renderingProvider,
      diagnoses,
      procedures,
      copayAmount,
      actorName,
      actorRole
    } = req.body;

    const patient = patients.find(p => p.id === patientId);
    if (!patient || !procedures || procedures.length === 0) {
      res.status(400).json({ error: 'Patient and at least one billable procedure CPT code are required.' });
      return;
    }

    const totalBilled = procedures.reduce((acc: number, p: any) => acc + (p.fee * (p.unit || 1)), 0);
    const parsedCopay = Number(copayAmount) || patient.insurance.copayAmount || 35;
    const estPatientDue = parsedCopay + Math.round((totalBilled - parsedCopay) * (patient.insurance.coinsurancePercent / 100));

    const newClaim = {
      id: `CLM-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
      claimNumber: `CLM-${Math.floor(Math.random() * 89999 + 10000)}-TX`,
      patientId: patient.id,
      patientName: patient.name,
      patientMrn: patient.mrn,
      insuranceProvider: patient.insurance.provider,
      policyNumber: patient.insurance.policyNumber,
      dateOfService: dateOfService || new Date().toISOString().substring(0, 10),
      renderingProvider: renderingProvider || patient.primaryPhysician,
      diagnoses: diagnoses || [{ code: 'I10', description: 'Essential hypertension' }],
      procedures: procedures.map((p: any) => ({
        cptCode: p.cptCode,
        description: p.description,
        unit: p.unit || 1,
        fee: p.fee,
        approvedAmount: Math.round(p.fee * 0.9)
      })),
      totalBilledAmount: totalBilled,
      copayAmount: parsedCopay,
      patientDueAmount: estPatientDue,
      status: 'Submitted',
      electronicBatchId: `EDI-837P-${Date.now().toString().slice(-5)}`,
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      payerTransactionId: `TXN-${Math.floor(Math.random() * 899999 + 100000)}`
    };

    insuranceClaims.unshift(newClaim as any);

    recordAudit({
      actorId: 'BILLING',
      actorName: actorName || 'Billing Specialist',
      actorRole: actorRole || 'billing',
      actionType: 'CLAIM_SUBMISSION',
      patientId: patient.id,
      patientMrn: patient.mrn,
      patientName: patient.name,
      resourceType: 'Claim',
      resourceId: newClaim.id,
      clinicalJustification: `Submitted claim for date of service ${newClaim.dateOfService}`,
      details: `Generated EDI-837P claim for $${totalBilled.toLocaleString()} to ${newClaim.insuranceProvider}.`
    });

    res.status(201).json(newClaim);
  });

  // Adjudicate / Process Claim (Simulates Real-time 835 Remittance Payer Response)
  app.post('/api/billing/claims/:id/adjudicate', (req: Request, res: Response) => {
    const claim = insuranceClaims.find(c => c.id === req.params.id);
    const { outcome, actorName, actorRole } = req.body; // 'approve' | 'deny'

    if (!claim) {
      res.status(404).json({ error: 'Claim not found' });
      return;
    }

    const isApprove = outcome !== 'deny';

    if (isApprove) {
      claim.status = 'Approved';
      claim.insuranceApprovedAmount = Math.round(claim.totalBilledAmount * 0.91);
      claim.adjudicatedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
      claim.eobExplanation = 'Electronic remittance approved in full. Contractual allowance applied. Provider payment scheduled in next ACH cycle.';
    } else {
      claim.status = 'Denied';
      claim.insuranceApprovedAmount = 0;
      claim.denialCode = 'CO-197';
      claim.denialReason = 'Precertification/authorization was absent or deficient for elective inpatient stay.';
      claim.adjudicatedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
      claim.eobExplanation = 'Claim denied per insurance contract section 4.2. Medical necessity appeal window: 60 days.';
    }

    recordAudit({
      actorId: 'PAYER_GATEWAY',
      actorName: actorName || 'Payer EDI Gateway',
      actorRole: actorRole || 'billing',
      actionType: 'CLAIM_ADJUDICATION',
      patientId: claim.patientId,
      patientMrn: claim.patientMrn,
      patientName: claim.patientName,
      resourceType: 'Claim',
      resourceId: claim.id,
      clinicalJustification: `Adjudication outcome: ${claim.status}`,
      details: `Payer remittance status: ${claim.status}. Approved: $${claim.insuranceApprovedAmount || 0}.`
    });

    res.json({ success: true, claim });
  });

  // Audit Logs
  app.get('/api/audit-logs', (req: Request, res: Response) => {
    res.json(auditLogs);
  });

  // Client-side event audit logging (e.g., privacy shield, lock screen)
  app.post('/api/audit-logs', (req: Request, res: Response) => {
    const { actorId, actorName, actorRole, actionType, details, severity } = req.body;
    const entry = recordAudit({
      actorId,
      actorName,
      actorRole,
      actionType,
      resourceType: 'Session',
      details,
      severity
    });
    res.status(201).json(entry);
  });

  // --- Vite / Static Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  🏥 Kaze Hospital Core Server running:`);
    console.log(`  ➜ Local:   http://localhost:${PORT}/`);
    console.log(`  ➜ Network: http://127.0.0.1:${PORT}/\n`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
});
