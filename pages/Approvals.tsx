import React, { useState, useEffect } from 'react';
import { getApprovals, updateApproval } from '../services/mockService';
import { Approval, ApprovalStatus } from '../types';
import { CheckCircle, XCircle, Clock, Shield } from 'lucide-react';

export const Approvals: React.FC = () => {
  const [approvals, setApprovals] = useState<Approval[]>([]);

  const refresh = async () => {
    try {
      const data = await getApprovals();
      setApprovals(data || []);
    } catch (e) {
      console.error("Approvals refresh failed", e);
    }
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (id: string, status: ApprovalStatus) => {
    await updateApproval(id, status);
    refresh();
  };

  const pending = approvals.filter(a => a.status === ApprovalStatus.PENDING);
  const history = approvals.filter(a => a.status !== ApprovalStatus.PENDING);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Approval Queue</h2>
          <p className="text-gray-500 mt-1">Gated actions requiring human operator confirmation.</p>
        </div>
        <div className="bg-blue-900/20 border border-blue-500/30 text-blue-400 px-4 py-2 rounded-lg flex items-center gap-2">
          <Shield size={18} />
          <span className="text-sm font-medium">Policy: Strict</span>
        </div>
      </div>

      {/* Pending Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Pending Review ({pending.length})</h3>

        {pending.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-gray-600" />
            </div>
            <h3 className="text-gray-300 font-medium">All clear</h3>
            <p className="text-gray-500 mt-1">No pending approvals at this time.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {pending.map(approval => (
              <div key={approval.id} className="bg-gray-900 border border-yellow-500/20 rounded-lg p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-black/20">
                <div className="flex gap-4">
                  <div className="mt-1">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                      <Clock size={20} className="text-yellow-500" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">{approval.type}</span>
                      <span className="text-gray-500 text-sm">requested by</span>
                      <span className="text-blue-400 font-medium text-sm">@{approval.actorLabel}</span>
                    </div>
                    <h4 className="text-lg font-medium text-gray-200">{approval.action}</h4>
                    <div className="mt-2 font-mono text-xs text-gray-500 bg-gray-950 p-2 rounded border border-gray-800 max-w-xl">
                      {JSON.stringify(approval.payload, null, 2)}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                  <button
                    onClick={() => handleAction(approval.id, ApprovalStatus.DENIED)}
                    className="flex-1 md:flex-none px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle size={18} />
                    Deny
                  </button>
                  <button
                    onClick={() => handleAction(approval.id, ApprovalStatus.APPROVED)}
                    className="flex-1 md:flex-none px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 font-medium"
                  >
                    <CheckCircle size={18} />
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History Section */}
      <div className="pt-8 border-t border-gray-800">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Recent History</h3>
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-950 text-gray-400">
              <tr>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {history.map(item => (
                <tr key={item.id} className="hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-gray-300">
                    <div className="font-medium">{item.action}</div>
                    <div className="text-xs text-gray-500 font-mono mt-0.5">{item.id}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{item.actorLabel}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{new Date(item.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${item.status === ApprovalStatus.APPROVED ? 'bg-emerald-500/10 text-emerald-400' :
                        item.status === ApprovalStatus.DENIED ? 'bg-red-500/10 text-red-400' : 'bg-gray-700 text-gray-300'
                      }`}>
                      {item.status === ApprovalStatus.APPROVED && <CheckCircle size={12} />}
                      {item.status === ApprovalStatus.DENIED && <XCircle size={12} />}
                      {item.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">No history available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
