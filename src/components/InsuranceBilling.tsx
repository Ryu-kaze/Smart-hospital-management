import React, { useState } from 'react';
import { 
  CreditCard, 
  FileCheck2, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Plus, 
  Search, 
  ShieldCheck, 
  ExternalLink,
  Receipt,
  FileSpreadsheet,
  Building2,
  DollarSign,
  Layers
} from 'lucide-react';
import { CPTCode, ICD10Code, InsuranceClaim, Patient, UserProfile } from '../types';

interface InsuranceBillingProps {
  claims: InsuranceClaim[];
  patients: Patient[];
  currentUser: UserProfile;
  privacyMode: boolean;
  onVerifyEligibility: (data: any) => Promise<any>;
  onSubmitClaim: (claimData: any) => Promise<void>;
  onAdjudicateClaim: (claimId: string, outcome: 'approve' | 'deny') => Promise<void>;
}

export const InsuranceBilling: React.FC<InsuranceBillingProps> = ({
  claims,
  patients,
  currentUser,
  privacyMode,
  onVerifyEligibility,
  onSubmitClaim,
  onAdjudicateClaim
}) => {
  const [activeTab, setActiveTab] = useState<'claims' | 'eligibility' | 'codes'>('claims');
  const [selectedClaim, setSelectedClaim] = useState<InsuranceClaim | null>(null);

  // Eligibility Tool State
  const [eligPayer, setEligPayer] = useState('Blue Cross Blue Shield PPO');
  const [eligPolicy, setEligPolicy] = useState('BCBS-99482104-A');
  const [eligGroup, setEligGroup] = useState('GRP-TX-8041');
  const [eligPatientName, setEligPatientName] = useState('Eleanor Vance');
  const [isVerifying, setIsVerifying] = useState(false);
  const [eligResult, setEligResult] = useState<any | null>(null);

  // New Claim Modal State
  const [isNewClaimModalOpen, setIsNewClaimModalOpen] = useState(false);
  const [claimPatientId, setClaimPatientId] = useState(patients[0]?.id || '');
  const [claimDateOfService, setClaimDateOfService] = useState(new Date().toISOString().substring(0, 10));
  const [selectedIcdCodes, setSelectedIcdCodes] = useState<string[]>(['I21.9']);
  const [selectedCptCodes, setSelectedCptCodes] = useState<string[]>(['92928']);
  const [claimCopay, setClaimCopay] = useState<number>(50);
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);

  // Reference catalogs
  const ICD10_LIST: ICD10Code[] = [
    { code: 'I21.9', description: 'Acute myocardial infarction, unspecified', category: 'Cardiovascular' },
    { code: 'I10', description: 'Essential (primary) hypertension', category: 'Cardiovascular' },
    { code: 'I48.91', description: 'Unspecified atrial fibrillation', category: 'Cardiovascular' },
    { code: 'J18.9', description: 'Pneumonia, unspecified organism', category: 'Respiratory' },
    { code: 'J44.1', description: 'COPD with acute exacerbation', category: 'Respiratory' },
    { code: 'S82.201A', description: 'Fracture of shaft of right tibia, initial encounter', category: 'Orthopedics' },
    { code: 'K35.80', description: 'Unspecified acute appendicitis', category: 'Gastrointestinal' },
    { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', category: 'Endocrine' }
  ];

  const CPT_LIST: CPTCode[] = [
    { code: '99285', description: 'Emergency department visit, high severity', standardFee: 1250, category: 'Evaluation & Management' },
    { code: '99223', description: 'Initial hospital care, high complexity, per day', standardFee: 720, category: 'Inpatient' },
    { code: '99213', description: 'Office outpatient visit, established patient', standardFee: 195, category: 'Outpatient' },
    { code: '92928', description: 'Percutaneous coronary intervention (stent placement)', standardFee: 14500, category: 'Cardiovascular' },
    { code: '93306', description: 'Transthoracic echocardiography (TTE) complete', standardFee: 1850, category: 'Diagnostics' },
    { code: '27759', description: 'Treatment of tibial fracture with intramedullary nail', standardFee: 8900, category: 'Surgery' },
    { code: '71045', description: 'Chest Radiograph, Single View', standardFee: 380, category: 'Radiology' },
    { code: '80053', description: 'Comprehensive metabolic panel (CMP)', standardFee: 120, category: 'Laboratory' }
  ];

  const handleVerifyEligibility = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsVerifying(true);
      const res = await onVerifyEligibility({
        payer: eligPayer,
        policyNumber: eligPolicy,
        groupNumber: eligGroup,
        patientName: eligPatientName
      });
      setEligResult(res);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === claimPatientId);
    if (!patient || selectedCptCodes.length === 0) return;

    const diagnoses = selectedIcdCodes.map(code => {
      const found = ICD10_LIST.find(i => i.code === code);
      return { code, description: found?.description || 'Diagnosis' };
    });

    const procedures = selectedCptCodes.map(code => {
      const found = CPT_LIST.find(c => c.code === code);
      return {
        cptCode: code,
        description: found?.description || 'Procedure',
        unit: 1,
        fee: found?.standardFee || 500
      };
    });

    try {
      setIsSubmittingClaim(true);
      await onSubmitClaim({
        patientId: patient.id,
        dateOfService: claimDateOfService,
        renderingProvider: patient.primaryPhysician,
        diagnoses,
        procedures,
        copayAmount: claimCopay
      });
      setIsNewClaimModalOpen(false);
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  const totalBilled = claims.reduce((acc, c) => acc + c.totalBilledAmount, 0);
  const totalApproved = claims.reduce((acc, c) => acc + (c.insuranceApprovedAmount || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
      case 'Paid':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200"><CheckCircle2 className="w-3 h-3" />Approved</span>;
      case 'Submitted':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200"><Send className="w-3 h-3" />Submitted</span>;
      case 'In-Adjudication':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200"><Clock className="w-3 h-3 animate-spin" />In Review</span>;
      case 'Denied':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200"><XCircle className="w-3 h-3" />Denied</span>;
      default:
        return <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Gross Billed Charges</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            ${totalBilled.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {claims.length} Electronic EDI-837P Claims
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Payer Approved Remittance</span>
            <Receipt className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 font-mono">
            ${totalApproved.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Contractual Rate Realized
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Payer Gateway Status</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Real-time EDI Clearinghouse Connected</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            BCBS, UHC, Medicare, Aetna, Cigna
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            id="claims-tab"
            onClick={() => setActiveTab('claims')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'claims'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Claims Management ({claims.length})
          </button>

          <button
            id="eligibility-tab"
            onClick={() => setActiveTab('eligibility')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'eligibility'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Real-Time Eligibility Check</span>
          </button>

          <button
            id="codes-tab"
            onClick={() => setActiveTab('codes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'codes'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>ICD-10 & CPT Library</span>
          </button>
        </div>

        {currentUser.canBillInsurance && (
          <button
            id="open-create-claim-modal-btn"
            onClick={() => setIsNewClaimModalOpen(true)}
            className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate EDI Claim</span>
          </button>
        )}
      </div>

      {/* TAB 1: CLAIMS TABLE */}
      {activeTab === 'claims' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Claim # / Batch</th>
                  <th className="py-3 px-4">Patient (MRN)</th>
                  <th className="py-3 px-4">Payer / Policy</th>
                  <th className="py-3 px-4">DOS</th>
                  <th className="py-3 px-4">Total Billed</th>
                  <th className="py-3 px-4">Approved</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {claims.map((claim) => (
                  <tr key={claim.id} id={`claim-row-${claim.id}`} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-bold text-slate-900">{claim.claimNumber}</div>
                      <div className="text-[10px] text-slate-400">{claim.electronicBatchId}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className={`font-bold text-slate-900 ${privacyMode ? 'phi-blur' : ''}`}>
                        {claim.patientName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {privacyMode ? 'MRN-••••••' : claim.patientMrn}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{claim.insuranceProvider}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{claim.policyNumber}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {claim.dateOfService}
                    </td>
                    <td className="py-3.5 px-4 font-bold font-mono text-slate-900">
                      ${claim.totalBilledAmount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {claim.insuranceApprovedAmount ? (
                        <span className="font-bold text-emerald-700">
                          ${claim.insuranceApprovedAmount.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(claim.status)}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => setSelectedClaim(claim)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 rounded hover:bg-blue-100 transition-colors cursor-pointer"
                      >
                        View EOB
                      </button>

                      {currentUser.canBillInsurance && (claim.status === 'Submitted' || claim.status === 'In-Adjudication') && (
                        <button
                          onClick={() => onAdjudicateClaim(claim.id, 'approve')}
                          className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors cursor-pointer shadow-2xs"
                          title="Simulate 835 Remittance Advice approval from Payer API"
                        >
                          Adjudicate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: REAL-TIME ELIGIBILITY CHECK */}
      {activeTab === 'eligibility' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              270/271 Real-Time Eligibility & Benefit Inquiry
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Queries payer electronic clearinghouse in real-time to verify active member coverage, copays, and deductible balances.
            </p>

            <form onSubmit={handleVerifyEligibility} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Health Insurance Network / Payer
                </label>
                <select
                  id="eligibility-payer-select"
                  value={eligPayer}
                  onChange={(e) => setEligPayer(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900"
                >
                  <option value="Blue Cross Blue Shield PPO">Blue Cross Blue Shield (Payer ID: 00812)</option>
                  <option value="UnitedHealthcare Choice Plus">UnitedHealthcare (Payer ID: 87726)</option>
                  <option value="Medicare Part B CMS">Medicare Part B - CMS (Payer ID: 00402)</option>
                  <option value="Aetna Open Access">Aetna Health (Payer ID: 60054)</option>
                  <option value="Cigna HealthSpring">Cigna (Payer ID: 62308)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Patient / Subscriber Full Name
                </label>
                <input
                  type="text"
                  value={eligPatientName}
                  onChange={(e) => setEligPatientName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Member / Policy #
                  </label>
                  <input
                    type="text"
                    value={eligPolicy}
                    onChange={(e) => setEligPolicy(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Group Number
                  </label>
                  <input
                    type="text"
                    value={eligGroup}
                    onChange={(e) => setEligGroup(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 font-mono"
                  />
                </div>
              </div>

              <button
                id="run-eligibility-check-btn"
                type="submit"
                disabled={isVerifying}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                {isVerifying ? (
                  <span>Transmitting 270 Inquiry to Clearinghouse...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Run Real-Time Eligibility Verification</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Verification Response Panel */}
          <div className="lg:col-span-6 space-y-4">
            {eligResult ? (
              <div className="bg-white rounded-xl border border-emerald-200 p-6 shadow-xs space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">
                        271 Response Received: {eligResult.status}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Ref: {eligResult.clearinghouseReference}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-slate-400 text-[10px] block">Office Visit Copay</span>
                    <strong className="text-sm text-slate-900">{eligResult.copayOfficeVisit}</strong>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-slate-400 text-[10px] block">Emergency Copay</span>
                    <strong className="text-sm text-slate-900">{eligResult.copayEmergencyVisit}</strong>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-slate-400 text-[10px] block">Remaining Deductible</span>
                    <strong className="text-sm text-slate-900">{eligResult.individualDeductibleRemaining}</strong>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-slate-400 text-[10px] block">Coinsurance</span>
                    <strong className="text-sm text-slate-900">{eligResult.coinsurancePercent}</strong>
                  </div>
                </div>

                <div className="bg-blue-50/70 p-3 rounded-lg border border-blue-100 text-xs text-blue-900 space-y-1">
                  <strong className="block text-[11px] uppercase tracking-wider text-blue-800">
                    Pre-Authorization Requirements
                  </strong>
                  <p>Inpatient surgical procedures and advanced imaging (CT/MRI) require pre-service clearance.</p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-xs">
                <CreditCard className="w-8 h-8 mx-auto mb-2 text-slate-400 opacity-60" />
                <p className="font-semibold text-slate-600 mb-1">
                  Ready to Query Payer Network
                </p>
                <p className="text-[11px] leading-relaxed">
                  Enter policy details to simulate ANSI ASC X12 270/271 electronic eligibility transaction.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CODE LIBRARY */}
      {activeTab === 'codes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ICD-10 */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>ICD-10-CM Clinical Diagnoses</span>
              <span className="text-[10px] text-slate-400">WHO Standard</span>
            </h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {ICD10_LIST.map((icd) => (
                <div key={icd.code} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-mono font-bold text-blue-700">{icd.code}</span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-200 px-1.5 py-0.2 rounded">
                      {icd.category}
                    </span>
                  </div>
                  <div className="text-slate-800 font-medium">{icd.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CPT */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>CPT Procedure & Service Codes</span>
              <span className="text-[10px] text-slate-400">AMA Standard</span>
            </h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {CPT_LIST.map((cpt) => (
                <div key={cpt.code} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-mono font-bold text-purple-700">CPT {cpt.code}</span>
                    <span className="font-mono font-bold text-emerald-700">${cpt.standardFee}</span>
                  </div>
                  <div className="text-slate-800 font-medium">{cpt.description}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{cpt.category}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW EOB MODAL */}
      {selectedClaim && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Explanation of Benefits (EOB)
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {selectedClaim.claimNumber} • {selectedClaim.insuranceProvider}
                </p>
              </div>
              <button 
                onClick={() => setSelectedClaim(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Patient:</span>
                  <strong className="text-slate-800">{selectedClaim.patientName} ({selectedClaim.patientMrn})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date of Service:</span>
                  <span className="font-mono text-slate-700">{selectedClaim.dateOfService}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Rendering Physician:</span>
                  <span className="text-slate-700">{selectedClaim.renderingProvider}</span>
                </div>
              </div>

              {/* Procedures breakdown */}
              <div>
                <span className="block font-bold text-slate-700 mb-1.5">Billed Procedures (CPT)</span>
                <div className="space-y-1.5">
                  {selectedClaim.procedures.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                      <div>
                        <span className="font-mono font-bold text-purple-700">CPT {p.cptCode}</span>
                        <span className="text-slate-600 ml-1.5">{p.description}</span>
                      </div>
                      <span className="font-mono font-semibold">${p.fee.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial summary */}
              <div className="bg-slate-900 text-white p-3.5 rounded-xl space-y-1.5 font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Total Billed Amount:</span>
                  <span>${selectedClaim.totalBilledAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Insurance Approved / Paid:</span>
                  <span>${(selectedClaim.insuranceApprovedAmount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-amber-300 font-bold border-t border-slate-800 pt-1.5">
                  <span>Patient Co-pay / Responsibility:</span>
                  <span>${selectedClaim.patientDueAmount.toLocaleString()}</span>
                </div>
              </div>

              {selectedClaim.eobExplanation && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-900">
                  <strong className="block text-[11px] uppercase mb-0.5">Payer Adjudication Remarks</strong>
                  {selectedClaim.eobExplanation}
                </div>
              )}
            </div>

            <div className="pt-4 flex items-center justify-end">
              <button
                onClick={() => setSelectedClaim(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Close EOB
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GENERATE NEW CLAIM MODAL */}
      {isNewClaimModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Generate Electronic EDI-837P Claim
                </h3>
                <p className="text-xs text-slate-500">
                  Encodes ICD-10 diagnosis and CPT procedural charges for payer transmission
                </p>
              </div>
              <button 
                onClick={() => setIsNewClaimModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClaim} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Patient
                </label>
                <select
                  value={claimPatientId}
                  onChange={(e) => setClaimPatientId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900"
                  required
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.mrn}) • {p.insurance.provider}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date of Service (DOS)
                  </label>
                  <input
                    type="date"
                    value={claimDateOfService}
                    onChange={(e) => setClaimDateOfService(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Patient Co-pay ($)
                  </label>
                  <input
                    type="number"
                    value={claimCopay}
                    onChange={(e) => setClaimCopay(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                    required
                  />
                </div>
              </div>

              {/* ICD-10 Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primary ICD-10 Diagnosis
                </label>
                <select
                  value={selectedIcdCodes[0] || 'I10'}
                  onChange={(e) => setSelectedIcdCodes([e.target.value])}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                >
                  {ICD10_LIST.map((icd) => (
                    <option key={icd.code} value={icd.code}>
                      {icd.code} - {icd.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* CPT Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Billable CPT Procedure Code
                </label>
                <select
                  value={selectedCptCodes[0] || '99213'}
                  onChange={(e) => setSelectedCptCodes([e.target.value])}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                >
                  {CPT_LIST.map((cpt) => (
                    <option key={cpt.code} value={cpt.code}>
                      CPT {cpt.code} - {cpt.description} (${cpt.standardFee})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewClaimModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="submit-claim-button"
                  type="submit"
                  disabled={isSubmittingClaim}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingClaim ? 'Submitting to Payer...' : 'Transmit Claim'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
