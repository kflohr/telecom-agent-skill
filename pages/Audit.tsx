import React, { useState, useEffect } from 'react';
import { getAuditLogs } from '../services/mockService';
import { AuditLog } from '../types';
import { Search, FileJson } from 'lucide-react';

export const Audit: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    setLogs(getAuditLogs());
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Audit Logs</h2>
          <p className="text-gray-500 mt-1">Immutable record of all system actions and side-effects.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input 
            type="text" 
            placeholder="Search request ID or actor..." 
            className="bg-gray-900 border border-gray-800 text-gray-200 pl-10 pr-4 py-2 rounded-lg text-sm w-full sm:w-64 focus:ring-2 focus:ring-blue-500/50 outline-none"
          />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-950 text-gray-400 border-b border-gray-800">
              <tr>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Timestamp</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Actor</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Action</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Entity</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Result</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap text-right">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-800/30 transition-colors group">
                  <td className="px-6 py-4 font-mono text-xs text-gray-500 whitespace-nowrap">
                    {new Date(log.createdAt).toISOString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400">
                        {log.actorSource.charAt(0).toUpperCase()}
                      </span>
                      <span className="text-gray-300 font-medium">{log.actorLabel}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded bg-gray-800 border border-gray-700 text-gray-300 font-mono text-xs">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    <div className="text-xs">{log.entityType}</div>
                    <div className="text-xs font-mono text-gray-600">{log.entityId}</div>
                  </td>
                  <td className="px-6 py-4">
                    {log.ok ? (
                      <span className="text-emerald-400 text-xs font-bold tracking-wide">SUCCESS</span>
                    ) : (
                      <span className="text-red-400 text-xs font-bold tracking-wide">ERROR</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-gray-500 hover:text-blue-400 transition-colors" title="View Payload">
                      <FileJson size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
