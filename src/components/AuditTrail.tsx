import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Download, 
  Search, 
  Filter, 
  Key, 
  FileText, 
  User, 
  Clock, 
  CheckCircle2, 
  ShieldAlert,
  Terminal,
  Activity
} from 'lucide-react';
import { AuditActionType, AuditLog, UserProfile } from '../types';

interface AuditTrailProps {
  auditLogs: AuditLog[];
  currentUser: UserProfile;
}

export const AuditTrail: React.FC<AuditTrailProps> = ({ auditLogs, currentUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('All');
  const [actionFilter, setActionFilter] = useState<string>('All');

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSeverity = severityFilter === 'All' || log.severity === severityFilter;
    const matchesAction = actionFilter === 'All' || log.actionType === actionFilter;
    const matchesSearch =
      log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.patientName && log.patientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.patientMrn && log.patientMrn.toLowerCase().includes(searchQuery.toLowerCase())) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.clinicalJustification && log.clinicalJustification.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSeverity && matchesAction && matchesSearch;
  });

  const breakGlassCount = auditLogs.filter(l => l.actionType === 'BREAK_GLASS_OVERRIDE').length;
  const ehrDecryptCount = auditLogs.filter(l => l.actionType === 'EHR_DECRYPT').length;

  const handleExportLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `HIPAA_Audit_Trail_Report_${new Date().toISOString().substring(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getActionBadge = (type: AuditActionType) => {
    switch (type) {
      case 'BREAK_GLASS_OVERRIDE':
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-red-600 text-white animate-pulse"><AlertTriangle className="w-3 h-3" />Break Glass</span>;
      case 'EHR_DECRYPT':
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200"><Key className="w-3 h-3 text-blue-600" />EHR Decrypt</span>;
      case 'BED_ADMIT':
      case 'BED_DISCHARGE':
      case 'BED_TRANSFER':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">{type.replace('_', ' ')}</span>;
      case 'CLAIM_SUBMISSION':
      case 'CLAIM_ADJUDICATION':
      case 'ELIGIBILITY_CHECK':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">{type.replace('_', ' ')}</span>;
      case 'APPOINTMENT_SCHEDULE':
      case 'APPOINTMENT_AUTO_TRIAGE':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 border border-cyan-200">{type.replace('_', ' ')}</span>;
      default:
        return <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">{type}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* HIPAA Compliance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Security Rule Status</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900">
            100% Compliant
          </div>
          <div className="mt-1 text-xs text-slate-500">
            NIST SP 800-66 / HIPAA § 164.312(b)
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Decryption Access Events</span>
            <Key className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-blue-600 font-mono">
            {ehrDecryptCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Authenticated AES-256 Unseals
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Break-Glass Overrides</span>
            <ShieldAlert className="w-4 h-4 text-red-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-red-600 font-mono">
            {breakGlassCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            High Priority Compliance Reviews
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="audit-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by actor, patient MRN, justification, or action details..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700"
          >
            <option value="All">All Severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>

          <button
            id="export-audit-log-btn"
            onClick={handleExportLogs}
            className="py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report (JSON)</span>
          </button>
        </div>
      </div>

      {/* Immutable Ledger Feed */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filteredLogs.map((log) => {
            const isCritical = log.severity === 'critical';
            const isWarning = log.severity === 'warning';

            return (
              <div 
                key={log.id} 
                id={`audit-row-${log.id}`}
                className={`p-4 hover:bg-slate-50 transition-colors ${
                  isCritical ? 'bg-red-50/40 border-l-4 border-red-600' : isWarning ? 'bg-amber-50/40 border-l-4 border-amber-500' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] font-bold text-slate-500">
                      {log.id}
                    </span>
                    {getActionBadge(log.actionType)}
                    <span className="text-xs font-bold text-slate-900">
                      {log.actorName}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase px-1.5 py-0.2 rounded bg-slate-100 font-semibold">
                      {log.actorRole}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{log.timestamp}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-700 leading-relaxed mt-1">
                  {log.details}
                </div>

                {log.clinicalJustification && (
                  <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                    <strong className="text-slate-800">Clinical Rationale: </strong>
                    <span className="italic">{log.clinicalJustification}</span>
                  </div>
                )}

                <div className="mt-2.5 pt-2 border-t border-slate-100/80 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
                  <div className="flex items-center gap-3">
                    {log.patientName && (
                      <span>
                        Subject: <strong className="text-slate-600">{log.patientName} ({log.patientMrn})</strong>
                      </span>
                    )}
                    <span>Terminal: {log.ipAddress}</span>
                  </div>

                  <div className="font-mono flex items-center gap-1 text-slate-400">
                    <Terminal className="w-2.5 h-2.5" />
                    <span>SHA-256 Sig: {log.hashSignature}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
