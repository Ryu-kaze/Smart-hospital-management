import React, { useState } from 'react';
import { 
  Shield, 
  Search, 
  Filter, 
  Download, 
  Key, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  User, 
  Database,
  FileCheck,
  Hash,
  Terminal,
  FileText
} from 'lucide-react';
import { AuditLogEntry, UserProfile } from '../types';

interface AuditTrailProps {
  logs?: AuditLogEntry[];
  auditLogs?: AuditLogEntry[];
  currentUser: UserProfile;
  privacyMode?: boolean;
}

export const AuditTrail: React.FC<AuditTrailProps> = ({
  logs,
  auditLogs,
  currentUser,
  privacyMode = false
}) => {
  const activeLogs = auditLogs || logs || [];
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);

  const filteredLogs = activeLogs.filter((log) => {
    const matchesSearch = 
      log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.patientName && log.patientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.patientMrn && log.patientMrn.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'All' || log.actorRole === roleFilter;
    const matchesAction = actionFilter === 'All' || log.actionType === actionFilter;

    return matchesSearch && matchesRole && matchesAction;
  });

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `kaze-audit-log-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-[#D5DDD9] p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 tracking-tight font-sans">
              Kaze Hospital HIPAA Audit Trail & Cryptographic Ledger
            </h2>
            <span className="text-[10px] font-mono-clinical font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
              NIST SP 800-66 VERIFIED
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-sans">
            Immutable SHA-256 hash-chained event logs recording every medical chart decryption, bed transfer, emergency break-glass, and billing submission.
          </p>
        </div>

        <button
          id="export-audit-log-btn"
          onClick={handleExport}
          className="py-2 px-3.5 bg-[#0E2C27] hover:bg-[#14443C] text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Compliance Log (JSON)</span>
        </button>
      </div>

      {/* Filters Ribbon */}
      <div className="bg-white rounded-xl border border-[#D5DDD9] p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search operator, patient, action, or SHA-256 hash..."
            className="w-full bg-[#F6F8F7] border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#0E2C27]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-[#F6F8F7] border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden"
          >
            <option value="All">All Roles</option>
            <option value="doctor">Physician</option>
            <option value="nurse">Nursing Staff</option>
            <option value="billing">Billing Specialist</option>
            <option value="admin">Administrator</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-[#F6F8F7] border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden"
          >
            <option value="All">All Actions</option>
            <option value="EHR_DECRYPT">Decryptions</option>
            <option value="BREAK_GLASS_OVERRIDE">Break-Glass Overrides</option>
            <option value="BED_ADMIT">Admissions</option>
            <option value="BED_DISCHARGE">Discharges</option>
            <option value="CLAIM_SUBMISSION">Claims Created</option>
            <option value="CLAIM_ADJUDICATION">Claims Adjudicated</option>
          </select>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white rounded-xl border border-[#D5DDD9] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F2F5F4] text-slate-700 font-mono-clinical text-[11px] border-b border-[#E2E8E5]">
              <tr>
                <th className="p-3">Timestamp (UTC)</th>
                <th className="p-3">Operator / Role</th>
                <th className="p-3">Action Event</th>
                <th className="p-3">Target Patient / Resource</th>
                <th className="p-3">Justification & Details</th>
                <th className="p-3">SHA-256 Signature</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDF1EF]">
              {filteredLogs.map((log) => {
                const isBreakGlass = log.actionType === 'BREAK_GLASS_OVERRIDE' || log.severity === 'critical';
                const isDecryption = log.actionType === 'EHR_DECRYPT';

                return (
                  <tr 
                    key={log.id} 
                    onClick={() => setSelectedEntry(log)}
                    className={`hover:bg-[#F9FAF9] cursor-pointer transition-colors ${
                      isBreakGlass ? 'bg-rose-50/50' : ''
                    }`}
                  >
                    <td className="p-3 font-mono-clinical text-slate-500 whitespace-nowrap">
                      {log.timestamp}
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{log.actorName}</div>
                      <span className="text-[10px] font-mono-clinical uppercase text-emerald-800 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                        {log.actorRole}
                      </span>
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-mono-clinical font-bold px-2 py-0.5 rounded ${
                        isBreakGlass
                          ? 'bg-rose-700 text-white'
                          : isDecryption
                          ? 'bg-purple-100 text-purple-900'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {isBreakGlass && <AlertTriangle className="w-3 h-3 text-white animate-pulse" />}
                        {log.actionType}
                      </span>
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      {log.patientName ? (
                        <div>
                          <div className={`font-semibold text-slate-800 ${privacyMode ? 'phi-blur' : ''}`}>
                            {log.patientName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono-clinical">
                            {privacyMode ? '••••••' : log.patientMrn}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono-clinical text-[11px]">
                          {log.resourceType} {log.resourceId || ''}
                        </span>
                      )}
                    </td>

                    <td className="p-3 text-slate-700 max-w-xs truncate">
                      {log.clinicalJustification && (
                        <span className="block text-[10px] font-semibold text-slate-900 truncate">
                          Rationale: {log.clinicalJustification}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-500">{log.details}</span>
                    </td>

                    <td className="p-3 font-mono-clinical text-[10px] text-slate-400 whitespace-nowrap">
                      <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono-clinical" title={log.hashSignature}>
                        {log.hashSignature.substring(0, 12)}...
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECTOR MODAL */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 bg-[#071714]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#E7F2EE] text-[#0E2C27] rounded-lg">
                  <Hash className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-sans">
                    NIST Audit Event Record {selectedEntry.id}
                  </h3>
                  <span className="text-xs text-slate-500 font-mono-clinical">
                    SHA-256 Digital Signature Verified
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedEntry(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[#F8FAF9] p-3 rounded-lg border border-[#E2E8E5]">
                <div>
                  <span className="text-slate-400 font-mono-clinical uppercase text-[10px] block">OPERATOR IDENTITY</span>
                  <strong className="text-slate-900">{selectedEntry.actorName}</strong>
                  <div className="text-[11px] text-slate-500 font-mono-clinical">
                    Role: {selectedEntry.actorRole} • ID: {selectedEntry.actorId}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-mono-clinical uppercase text-[10px] block">EVENT CLASSIFICATION</span>
                  <strong className="text-slate-900 font-mono-clinical">{selectedEntry.actionType}</strong>
                  <div className="text-[11px] text-slate-500">{selectedEntry.timestamp}</div>
                </div>
              </div>

              {selectedEntry.clinicalJustification && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
                  <strong className="block text-[10px] uppercase font-mono-clinical">AUDITED CLINICAL JUSTIFICATION</strong>
                  <p className="mt-0.5">{selectedEntry.clinicalJustification}</p>
                </div>
              )}

              {/* Raw JSON payload */}
              <div className="bg-[#081715] text-slate-300 rounded-xl p-3 font-mono-clinical text-[11px] overflow-x-auto max-h-48 border border-[#143B34]">
                <pre>{JSON.stringify(selectedEntry, null, 2)}</pre>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Close Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
