import { UserProfile } from '../types';

export const SYSTEM_USERS: UserProfile[] = [
  {
    id: 'DOC-REED',
    name: 'Dr. Evelyn Reed, MD',
    role: 'doctor',
    title: 'Chief of Cardiology & Critical Care',
    department: 'Cardiology / ICU',
    licenseNumber: 'MD-TX-902148',
    canBreakGlass: true,
    canDecryptRecords: true,
    canManageBeds: true,
    canBillInsurance: true
  },
  {
    id: 'NURSE-MILLER',
    name: 'Nurse James Miller, RN',
    role: 'nurse',
    title: 'Charge Nurse - Emergency & Surgical Care',
    department: 'Emergency & Surgical',
    licenseNumber: 'RN-TX-440192',
    canBreakGlass: true,
    canDecryptRecords: true,
    canManageBeds: true,
    canBillInsurance: false
  },
  {
    id: 'BILL-SARAH',
    name: 'Sarah Jenkins, CPC',
    role: 'billing',
    title: 'Senior Revenue Cycle & Insurance Specialist',
    department: 'Revenue Cycle & Claims',
    licenseNumber: 'CPC-881920',
    canBreakGlass: false,
    canDecryptRecords: false,
    canManageBeds: false,
    canBillInsurance: true
  },
  {
    id: 'ADMIN-CHEN',
    name: 'David Chen, CHPS',
    role: 'admin',
    title: 'Chief Compliance & Privacy Officer',
    department: 'Health Informatics & Security',
    licenseNumber: 'CHPS-9018',
    canBreakGlass: true,
    canDecryptRecords: true,
    canManageBeds: true,
    canBillInsurance: true
  },
  {
    id: 'PT-ROBERT',
    name: 'Robert Taylor',
    role: 'patient',
    title: 'Patient (Self-Service Portal)',
    department: 'Outpatient Care',
    licenseNumber: 'MRN-331908',
    canBreakGlass: false,
    canDecryptRecords: false,
    canManageBeds: false,
    canBillInsurance: false
  }
];
