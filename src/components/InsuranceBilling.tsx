import React, { useState } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Send, 
  Plus, 
  Search, 
  ShieldCheck, 
  FileText, 
  DollarSign, 
  Building, 
  FileSpreadsheet, 
  HelpCircle,
  ExternalLink,
  Receipt,
  Terminal
} from 'lucide-react';
import { InsuranceClaim, Patient, UserProfile } from '../types';

interface InsuranceBillingProps {
  claims: InsuranceClaim[];
  patients: Patient[];
  currentUser: UserProfile;
  privacyMode: boolean;
  onSubmitClaim?: (claimData: any) => Promise<void>;
  onCreateClaim?: (claimData: any) => Promise<void>;
  onVerifyEligibility: (data: any) => Promise<any>;
  onAdjudicateClaim: (claimId: string, outcome: 'approve' | 'deny') => Promise<void>;
}

export const InsuranceBilling: React.FC<InsuranceBillingProps> = ({
  claims,
  patients,
  currentUser,
  privacyMode,
  onSubmitClaim,
  onCreateClaim,
  onVerifyEligibility,
  onAdjudicateClaim
}) => {
  const [activeTab, setActiveTab] = useState<'claims' | 'eligibility' | 'new-claim'>('claims');
  const [selectedClaim, setSelectedClaim] = useState<InsuranceClaim | null>(claims[0] || null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Eligibility check state
  const [eligPatientId, setEligPatientId] = useState<string>(patients[0]?.id || '');
  const [eligPayer, setEligPayer] = useState<string>(patients[0]?.insurance.provider || 'Blue Cross Blue Shield PPO');
  const [eligPolicyNum, setEligPolicyNum] = useState<string>(patients[0]?.insurance.policyNumber || 'BCBS-99482104-A');
  const [isCheckingElig, setIsCheckingElig] = useState<boolean>(false);
  const [eligibilityResult, setEligibilityResult] = useState<any | null>(null);

  // New claim generator state
  const [claimPatientId, setClaimPatientId] = useState<string>(patients[0]?.id || '');
  const [serviceDate, setServiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [doctorNpi, setDoctorNpi] = useState<string>('Dr. Evelyn Reed, MD (NPI: 1982049102)');
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<Array<{ code: string; description: string }>>([
    { code: 'I21.9', description: 'Acute myocardial infarction, unspecified' }
  ]);
  const [selectedProcedures, setSelectedProcedures] = useState<Array<{ cptCode: string; description: string; fee: number; unit: number }>>([
    { cptCode: '99223', description: 'Initial hospital care, high complexity, per day', fee: 720, unit: 1 }
  ]);
  const [isSubmittingClaim, setIsSubmittingClaim] = useState<boolean>(false);

  // Common clinical billing catalogs
  const icd10Catalog = [
    { code: 'I21.9', description: 'Acute myocardial infarction, unspecified' },
    { code: 'I10', description: 'Essential (primary) hypertension' },
    { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
    { code: 'J44.1', description: 'Chronic obstructive pulmonary disease with acute exacerbation' },
    { code: 'K40.90', description: 'Unilateral inguinal hernia, without obstruction or gangrene' }
  ];

  const cptCatalog = [
    { cptCode: '99223', description: 'Initial hospital care, high complexity, per day', fee: 720 },
    { cptCode: '92928', description: 'Percutaneous transcatheter placement of intracoronary stent', fee: 14500 },
    { cptCode: '93306', description: 'Transthoracic echocardiography (TTE) complete', fee: 1850 },
    { cptCode: '71046', description: 'Chest X-ray, 2 views, frontal and lateral', fee: 380 },
    { cptCode: '36415', description: 'Routine venipuncture for blood specimen', fee: 45 }
  ];

  const filteredClaims = claims.filter((c) => {
    return (
      c.claimNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.insuranceProvider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCheckingElig(true);
      const res = await onVerifyEligibility({
        patientId: eligPatientId,
        payer: eligPayer,
        policyNumber: eligPolicyNum
      });
      setEligibilityResult(res);
    } finally {
      setIsCheckingElig(false);
    }
  };

  const handleAddProcedure = (proc: typeof cptCatalog[0]) => {
    setSelectedProcedures(prev => [...prev, { ...proc, unit: 1 }]);
  };

  const handleRemoveProcedure = (index: number) => {
    setSelectedProcedures(prev => prev.filter((_, i) => i !== index));
  };

  const totalBilled = selectedProcedures.reduce((sum, p) => sum + (p.fee * p.unit), 0);

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProcedures.length === 0) return;
    try {
      setIsSubmittingClaim(true);
      const targetPatient = patients.find(p => p.id === claimPatientId);
      const submitFn = onSubmitClaim || onCreateClaim;
      if (submitFn) {
        await submitFn({
          patientId: claimPatientId,
          patientName: targetPatient?.name || 'Unknown',
          patientMrn: targetPatient?.mrn || 'MRN-000000',
          insuranceProvider: targetPatient?.insurance.provider || 'Direct Self-Pay',
          policyNumber: targetPatient?.insurance.policyNumber || 'POL-999',
          dateOfService: serviceDate,
          renderingProvider: doctorNpi,
          diagnoses: selectedDiagnoses,
          procedures: selectedProcedures.map(p => ({ ...p, approvedAmount: 0 })),
          totalBilledAmount: totalBilled,
          insuranceApprovedAmount: 0,
          copayAmount: targetPatient?.insurance.copayAmount || 0,
          patientDueAmount: totalBilled,
          status: 'Submitted',
          electronicBatchId: `EDI-837P-${Date.now().toString().slice(-5)}`
        });
      }
      setActiveTab('claims');
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-[#D5DDD9] p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 tracking-tight font-sans">
              Kaze Hospital Financial Clearance & EDI Claims Gateway
            </h2>
            <span className="text-[10px] font-mono-clinical font-bold px-2 py-0.5 rounded bg-[#E5EFEA] text-[#134D41] border border-[#B8D4C8]">
              ANSI X12 837P / 835 / 270-271
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-sans">
            Direct clearinghouse integration for automated eligibility verification, electronic batch billing, and remittance adjudication.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-[#F2F5F4] p-1 rounded-lg border border-[#E2E8E5] shrink-0">
          <button
            id="billing-claims-tab"
            onClick={() => setActiveTab('claims')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'claims'
                ? 'bg-[#0E2C27] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Claims Ledger ({claims.length})</span>
          </button>

          <button
            id="billing-eligibility-tab"
            onClick={() => setActiveTab('eligibility')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'eligibility'
                ? 'bg-[#0E2C27] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>270/271 Real-Time Eligibility</span>
          </button>

          <button
            id="billing-new-claim-tab"
            onClick={() => setActiveTab('new-claim')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'new-claim'
                ? 'bg-[#0E2C27] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate EDI 837P</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CLAIMS LEDGER */}
      {activeTab === 'claims' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Claims List */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-[#D5DDD9] shadow-xs overflow-hidden">
            <div className="p-3 border-b border-[#E2E8E5] bg-[#F7F9F8]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter claims by number, payer, or patient..."
                  className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#0E2C27]"
                />
              </div>
            </div>

            <div className="divide-y divide-[#EDF1EF] max-h-[600px] overflow-y-auto">
              {filteredClaims.map((claim) => {
                const isSelected = claim.id === selectedClaim?.id;
                return (
                  <button
                    key={claim.id}
                    id={`claim-item-${claim.id}`}
                    onClick={() => setSelectedClaim(claim)}
                    className={`w-full text-left p-3.5 transition-colors flex items-start justify-between gap-2 cursor-pointer ${
                      isSelected ? 'bg-[#EBF3F0] border-l-4 border-[#0E2C27]' : 'hover:bg-[#F9FAF9]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-clinical font-bold text-xs text-slate-900">
                          {claim.claimNumber}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          claim.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-900'
                            : claim.status === 'Denied'
                            ? 'bg-rose-100 text-rose-900'
                            : 'bg-amber-100 text-amber-900'
                        }`}>
                          {claim.status}
                        </span>
                      </div>
                      <div className={`text-xs text-slate-700 font-medium mt-0.5 ${privacyMode ? 'phi-blur' : ''}`}>
                        {claim.patientName} ({privacyMode ? 'MRN-••••••' : claim.patientMrn})
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono-clinical mt-1 truncate">
                        {claim.insuranceProvider}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono-clinical font-bold text-slate-900">
                        ${claim.totalBilledAmount.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono-clinical mt-0.5">
                        {claim.dateOfService}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Claim Dossier & CMS-1500 / 835 Remittance */}
          {selectedClaim && (
            <div className="lg:col-span-7 bg-white rounded-xl border border-[#D5DDD9] p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8E5]">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 font-sans">
                      Electronic Claim {selectedClaim.claimNumber}
                    </h3>
                    <span className="font-mono-clinical text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                      BATCH: {selectedClaim.electronicBatchId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono-clinical mt-0.5">
                    Service Date: {selectedClaim.dateOfService} • Provider: {selectedClaim.renderingProvider}
                  </p>
                </div>

                {/* Adjudication Controls */}
                {selectedClaim.status === 'Submitted' && (
                  <div className="flex items-center gap-2">
                    <button
                      id="adjudicate-approve-btn"
                      onClick={() => onAdjudicateClaim(selectedClaim.id, 'approve')}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                    >
                      Simulate Approval (835)
                    </button>
                    <button
                      id="adjudicate-deny-btn"
                      onClick={() => onAdjudicateClaim(selectedClaim.id, 'deny')}
                      className="px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                    >
                      Simulate Denial
                    </button>
                  </div>
                )}
              </div>

              {/* Patient & Payer Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-[#F8FAF9] p-3 rounded-lg border border-[#E2E8E5]">
                <div>
                  <span className="text-slate-400 font-mono-clinical uppercase text-[10px] block">PATIENT BENEFICIARY</span>
                  <div className={`font-bold text-slate-900 ${privacyMode ? 'phi-blur' : ''}`}>
                    {selectedClaim.patientName}
                  </div>
                  <div className="text-slate-500 text-[11px] font-mono-clinical">
                    MRN: {privacyMode ? '••••••' : selectedClaim.patientMrn}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-mono-clinical uppercase text-[10px] block">PAYER CLEARINGHOUSE</span>
                  <div className="font-bold text-slate-900">{selectedClaim.insuranceProvider}</div>
                  <div className="text-slate-500 text-[11px] font-mono-clinical">
                    Policy: {selectedClaim.policyNumber}
                  </div>
                </div>
              </div>

              {/* Procedures & Line Item Ledger */}
              <div>
                <div className="text-xs font-bold text-slate-900 mb-2 font-sans">
                  Itemized CPT Codes & Diagnostic Cross-References
                </div>
                <div className="border border-[#E2E8E5] rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[#F2F5F4] text-slate-700 font-mono-clinical text-[11px] border-b border-[#E2E8E5]">
                      <tr>
                        <th className="p-2.5">CPT Code</th>
                        <th className="p-2.5">Service Description</th>
                        <th className="p-2.5 text-center">Unit</th>
                        <th className="p-2.5 text-right">Billed Fee</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8E5]">
                      {selectedClaim.procedures.map((proc, idx) => (
                        <tr key={idx} className="hover:bg-[#F9FAF9]">
                          <td className="p-2.5 font-mono-clinical font-bold text-[#0E2C27]">{proc.cptCode}</td>
                          <td className="p-2.5 text-slate-700">{proc.description}</td>
                          <td className="p-2.5 text-center font-mono-clinical">{proc.unit}</td>
                          <td className="p-2.5 text-right font-mono-clinical font-semibold">${proc.fee.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Summary Box */}
              <div className="bg-[#F2F5F4] p-4 rounded-xl border border-[#D5DDD9] space-y-2 text-xs">
                <div className="flex items-center justify-between font-mono-clinical">
                  <span className="text-slate-600">Total Billed Charges:</span>
                  <span className="font-bold text-slate-900 text-sm">${selectedClaim.totalBilledAmount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between font-mono-clinical text-emerald-800">
                  <span>Payer Approved & Allowed (EDI 835):</span>
                  <span className="font-bold text-sm">${(selectedClaim.insuranceApprovedAmount ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between font-mono-clinical text-slate-600">
                  <span>Contracted Patient Copayment:</span>
                  <span>${selectedClaim.copayAmount}</span>
                </div>
                <div className="flex items-center justify-between font-mono-clinical pt-2 border-t border-[#D5DDD9] text-slate-900 font-bold">
                  <span>Patient Outstanding Balance:</span>
                  <span className="text-sm text-slate-900">${selectedClaim.patientDueAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Remittance Explanation / Denial Code */}
              {selectedClaim.eobExplanation && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5 font-sans">
                    <FileText className="w-3.5 h-3.5 text-[#1D7A68]" />
                    Electronic Remittance Advice (ERA / EOB):
                  </span>
                  <p className="text-slate-600 leading-relaxed font-sans">{selectedClaim.eobExplanation}</p>
                  {selectedClaim.payerTransactionId && (
                    <div className="text-[10px] text-slate-400 font-mono-clinical mt-1">
                      Payer Transaction Ref: {selectedClaim.payerTransactionId} • Adjudicated: {selectedClaim.adjudicatedAt}
                    </div>
                  )}
                </div>
              )}

              {/* Raw ANSI X12 837P Interchange Preview */}
              <div className="bg-[#081715] rounded-xl p-3 text-white font-mono-clinical text-[10px] border border-[#143B34] space-y-1">
                <div className="flex items-center justify-between text-emerald-400 pb-1 border-b border-[#143B34]">
                  <span className="flex items-center gap-1 font-bold">
                    <Terminal className="w-3 h-3" />
                    ANSI X12 837P EDI DATA STREAM
                  </span>
                  <span className="text-slate-400">VER: 005010X222A1</span>
                </div>
                <div className="text-slate-300 font-mono-clinical overflow-x-auto whitespace-nowrap py-1">
                  ISA*00*          *00*          *ZZ*KAZEHOSPITAL   *ZZ*{selectedClaim.insuranceProvider.replace(/\s+/g, '').slice(0, 10).toUpperCase()}*260918*1045*^*00501*000000001*0*P*:~<br />
                  GS*HC*KAZEHOSPITAL*{selectedClaim.insuranceProvider.replace(/\s+/g, '').slice(0, 10).toUpperCase()}*20260918*1045*1*X*005010X222A1~<br />
                  ST*837*0001*005010X222A1~<br />
                  BHT*0019*00*{selectedClaim.claimNumber}*20260918*1045*CH~<br />
                  NM1*41*2*KAZE HOSPITAL*****XX*1982049102~<br />
                  NM1*IL*1*VANCE*ELEANOR****MI*{selectedClaim.policyNumber}~<br />
                  CLM*{selectedClaim.claimNumber}*{selectedClaim.totalBilledAmount}***11:B:1*Y*A*Y*Y~
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: 270/271 REAL-TIME ELIGIBILITY INQUIRY */}
      {activeTab === 'eligibility' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 bg-white rounded-xl border border-[#D5DDD9] p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <div className="p-2 bg-[#E7F2EE] text-[#0E2C27] rounded-lg">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-sans">
                  270 Real-Time Eligibility Ping
                </h3>
                <p className="text-xs text-slate-500 font-sans">
                  Instantly queries the payer clearinghouse to verify coverage status, active copays, and remaining deductibles.
                </p>
              </div>
            </div>

            <form onSubmit={handleVerify} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Patient
                </label>
                <select
                  value={eligPatientId}
                  onChange={(e) => {
                    setEligPatientId(e.target.value);
                    const p = patients.find(pt => pt.id === e.target.value);
                    if (p) {
                      setEligPayer(p.insurance.provider);
                      setEligPolicyNum(p.insurance.policyNumber);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.mrn}) • {p.insurance.provider}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Payer Clearinghouse
                </label>
                <select
                  value={eligPayer}
                  onChange={(e) => setEligPayer(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                >
                  <option value="Blue Cross Blue Shield PPO">Blue Cross Blue Shield PPO</option>
                  <option value="UnitedHealthcare Choice Plus">UnitedHealthcare Choice Plus</option>
                  <option value="Aetna Open Access">Aetna Open Access</option>
                  <option value="Medicare Part B">Medicare Part B</option>
                  <option value="Cigna HealthSpring">Cigna HealthSpring</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Policy / Member ID
                </label>
                <input
                  type="text"
                  value={eligPolicyNum}
                  onChange={(e) => setEligPolicyNum(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 font-mono-clinical"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isCheckingElig}
                className="w-full py-2.5 px-4 bg-[#0E2C27] hover:bg-[#14443C] text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isCheckingElig ? (
                  <span>Querying ANSI 270 Clearinghouse...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-emerald-300" />
                    <span>Send Electronic 270 Inquiry</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* 271 Eligibility Response Dossier */}
          <div className="lg:col-span-7">
            {eligibilityResult ? (
              <div className="bg-white rounded-xl border border-[#D5DDD9] p-5 shadow-xs space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 font-sans">
                        ANSI 271 Benefit Verification Received
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono-clinical">
                        Trace ID: {eligibilityResult.traceId} • Checked: {eligibilityResult.verifiedAt}
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    Active Coverage Verified
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-[#F8FAF9] p-3 rounded-lg border border-[#E2E8E5]">
                    <span className="text-[10px] text-slate-400 font-mono-clinical block uppercase">COPAY</span>
                    <strong className="text-base text-slate-900 font-mono-clinical">${eligibilityResult.copay}</strong>
                  </div>
                  <div className="bg-[#F8FAF9] p-3 rounded-lg border border-[#E2E8E5]">
                    <span className="text-[10px] text-slate-400 font-mono-clinical block uppercase">COINSURANCE</span>
                    <strong className="text-base text-slate-900 font-mono-clinical">{eligibilityResult.coinsurance}%</strong>
                  </div>
                  <div className="bg-[#F8FAF9] p-3 rounded-lg border border-[#E2E8E5]">
                    <span className="text-[10px] text-slate-400 font-mono-clinical block uppercase">DEDUCTIBLE MET</span>
                    <strong className="text-base text-emerald-700 font-mono-clinical">${eligibilityResult.deductibleMet}</strong>
                  </div>
                  <div className="bg-[#F8FAF9] p-3 rounded-lg border border-[#E2E8E5]">
                    <span className="text-[10px] text-slate-400 font-mono-clinical block uppercase">DEDUCTIBLE TOTAL</span>
                    <strong className="text-base text-slate-900 font-mono-clinical">${eligibilityResult.deductibleTotal}</strong>
                  </div>
                </div>

                <div className="p-3 bg-[#F2F5F4] rounded-lg border border-[#D5DDD9] text-xs text-slate-700 space-y-1">
                  <span className="font-bold text-slate-900">Clearinghouse Summary Response:</span>
                  <p className="text-[11px] leading-relaxed">
                    Patient {eligibilityResult.patientName} is enrolled in active commercial in-network coverage with {eligibilityResult.payerName}. Pre-authorization is on file for general inpatient admissions.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-[#F8FAF9] rounded-xl border border-[#D5DDD9] p-8 text-center text-slate-400">
                <CreditCard className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <h4 className="font-semibold text-slate-700 text-sm">No 271 Inquiry Executed</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                  Select a patient to transmit a real-time ANSI 270 eligibility verification inquiry to their insurance payer.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: GENERATE EDI 837P CLAIM */}
      {activeTab === 'new-claim' && (
        <div className="max-w-3xl mx-auto bg-white rounded-xl border border-[#D5DDD9] p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="p-2 bg-[#E7F2EE] text-[#0E2C27] rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-sans">
                Create & Transmit ANSI 837P Electronic Claim
              </h3>
              <p className="text-xs text-slate-500 font-sans">
                Packages clinical encounter diagnoses and CPT fee codes into an electronic CMS-1500 clearinghouse packet.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmitClaim} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Patient Beneficiary
                </label>
                <select
                  value={claimPatientId}
                  onChange={(e) => setClaimPatientId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                  required
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.mrn}) • {p.insurance.provider}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Date of Clinical Service
                </label>
                <input
                  type="date"
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rendering Provider (NPI)
              </label>
              <input
                type="text"
                value={doctorNpi}
                onChange={(e) => setDoctorNpi(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                required
              />
            </div>

            {/* Procedures catalog selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700">
                  Select CPT Procedures for Claim
                </label>
                <span className="text-[11px] font-mono-clinical text-slate-400">Click to add to line items</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                {cptCatalog.map((cpt) => (
                  <button
                    key={cpt.cptCode}
                    type="button"
                    onClick={() => handleAddProcedure(cpt)}
                    className="text-left p-2 rounded-lg border border-slate-200 hover:border-[#14443C] bg-slate-50 hover:bg-white transition-all text-xs cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="font-mono-clinical font-bold text-[#0E2C27]">{cpt.cptCode}</span>
                      <p className="text-[11px] text-slate-600 truncate max-w-[200px]">{cpt.description}</p>
                    </div>
                    <span className="font-mono-clinical font-bold text-slate-800">${cpt.fee}</span>
                  </button>
                ))}
              </div>

              {/* Selected Line Items Table */}
              <div className="border border-[#D5DDD9] rounded-lg overflow-hidden text-xs">
                <div className="bg-[#F2F5F4] p-2 font-mono-clinical font-bold text-slate-700 border-b border-[#D5DDD9]">
                  Configured Line Items ({selectedProcedures.length})
                </div>
                {selectedProcedures.map((proc, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between border-b border-slate-100 last:border-0">
                    <div>
                      <span className="font-mono-clinical font-bold text-slate-900">{proc.cptCode}</span> - {proc.description}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono-clinical font-bold text-slate-900">${proc.fee}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveProcedure(idx)}
                        className="text-rose-600 hover:text-rose-800 text-xs font-bold cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="bg-[#F2F5F4] p-3 rounded-lg flex items-center justify-between text-xs font-mono-clinical">
              <span className="font-bold text-slate-700">Calculated Batch Total:</span>
              <span className="font-bold text-base text-slate-900">${totalBilled.toLocaleString()}</span>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('claims')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="submit-claim-btn"
                type="submit"
                disabled={isSubmittingClaim || selectedProcedures.length === 0}
                className="px-5 py-2 text-xs font-bold text-white bg-[#0E2C27] hover:bg-[#14443C] rounded-lg cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSubmittingClaim ? 'Transmitting to Clearinghouse...' : 'Transmit Electronic Claim (837P)'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
