import React, { useEffect, useState } from 'react';
import { TerminalWidget } from '../components/TerminalWidget';
import { getStats, getCalls, getConferences } from '../services/mockService';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { MOCK_CHART_DATA } from '../constants';
import { Phone, Users, MessageSquare, ShieldAlert, GitMerge, Mic, MicOff } from 'lucide-react';
import { CallState, CallLeg, Conference, ConferenceState } from '../types';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>({ activeCalls: 0, activeConferences: 0, smsToday: 0, pendingApprovals: 0 });
  const [activeCalls, setActiveCalls] = useState<CallLeg[]>([]);
  const [activeConferences, setActiveConferences] = useState<Conference[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const refresh = async () => {
        try {
            const [newStats, calls, conferences] = await Promise.all([
                getStats(),
                getCalls(),
                getConferences()
            ]);
            
            setStats(newStats);
            
            // Filter logic
            const liveCalls = calls.filter(c => 
                (c.state === CallState.IN_PROGRESS || c.state === CallState.RINGING) &&
                // Do not show calls that are inside a conference in the 'Solo' list
                !conferences.some(conf => conf.participants.some(p => p.callSid === c.callSid))
            );
            
            setActiveCalls(liveCalls);
            setActiveConferences(conferences.filter(c => c.state === ConferenceState.IN_PROGRESS));
        } catch (e) {
            console.error("Failed to fetch dashboard data", e);
        } finally {
            setIsLoading(false);
        }
    };

    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading && stats.activeCalls === 0) return <div className="p-8 text-gray-500">Loading Control Plane...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Active Legs" 
          value={stats.activeCalls} 
          icon={<Phone className="text-emerald-400" />} 
          color="emerald" 
        />
        <StatCard 
          label="Active Conferences" 
          value={stats.activeConferences} 
          icon={<GitMerge className="text-blue-400" />} 
          color="blue" 
        />
        <StatCard 
          label="SMS Sent (24h)" 
          value={stats.smsToday} 
          icon={<MessageSquare className="text-purple-400" />} 
          color="purple" 
        />
        <StatCard 
          label="Pending Approvals" 
          value={stats.pendingApprovals} 
          icon={<ShieldAlert className="text-yellow-400" />} 
          color="yellow" 
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Terminal Section - Takes 2 cols on large screens */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-200">Operator Console</h2>
            <div className="flex gap-2">
                <span className="text-xs font-mono text-gray-500 bg-gray-900 px-2 py-1 rounded border border-gray-800">CLI: v1.1.0</span>
                <span className="text-xs font-mono text-blue-400 bg-blue-900/20 px-2 py-1 rounded border border-blue-900/50">ENV: PROD</span>
            </div>
          </div>
          <TerminalWidget />
        </div>

        {/* Live Traffic Column */}
        <div className="space-y-6">
            
          {/* Active Conferences (The "Merge" View) */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex flex-col min-h-[200px]">
            <div className="flex items-center gap-2 mb-4">
                <GitMerge size={18} className="text-blue-400" />
                <h2 className="text-lg font-semibold text-gray-200">Active Merges</h2>
            </div>
            
            <div className="space-y-3">
                {activeConferences.length === 0 ? (
                   <p className="text-sm text-gray-600 text-center py-8">No active conferences</p>
                ) : (
                    activeConferences.map(conf => (
                        <div key={conf.id} className="bg-gray-800/40 rounded border border-blue-500/20 p-3">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-mono text-blue-300">{conf.friendlyName}</span>
                                <span className="text-[10px] uppercase bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">Live</span>
                            </div>
                            <div className="space-y-2">
                                {conf.participants.map((p, idx) => (
                                    <div key={p.id} className="flex items-center gap-2 text-sm text-gray-300 relative pl-4">
                                        {/* Connector line for tree view effect */}
                                        <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-700"></div>
                                        <div className="absolute left-0 top-1/2 w-2 h-px bg-gray-700"></div>
                                        
                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                        <span className="font-mono text-xs text-gray-400">{p.callSid.substr(0,8)}...</span>
                                        <div className="ml-auto">
                                            {p.muted ? <MicOff size={12} className="text-red-400"/> : <Mic size={12} className="text-gray-600"/>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
          </div>

          {/* Active Calls (Unmerged) */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex flex-col flex-1">
            <div className="flex items-center gap-2 mb-4">
                <Phone size={18} className="text-emerald-400" />
                <h2 className="text-lg font-semibold text-gray-200">Active Legs</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 max-h-[300px]">
              {activeCalls.length === 0 ? (
                <p className="text-sm text-gray-600 text-center py-4">No active solo calls</p>
              ) : (
                activeCalls.map(call => (
                  <div key={call.id} className="bg-gray-800/50 p-3 rounded border border-gray-700/50 flex items-center justify-between group hover:border-gray-600 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-gray-200">{call.to}</span>
                        {call.direction === 'inbound' && <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1 rounded">IN</span>}
                      </div>
                      <div className="text-xs text-gray-500 font-mono mt-1 flex gap-2">
                          <span>{call.callSid}</span>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full uppercase font-medium ${
                      call.state === CallState.RINGING ? 'bg-yellow-500/10 text-yellow-400 animate-pulse' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {call.state}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
          
        </div>
      </div>
      
      {/* Historical Chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
         <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">24h Traffic Volume</h3>
         <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_CHART_DATA}>
                <XAxis dataKey="time" stroke="#4b5563" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }}
                  itemStyle={{ color: '#e5e7eb' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
         </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number; icon: React.ReactNode; color: string }> = ({ label, value, icon, color }) => (
  <div className={`bg-gray-900 border border-gray-800 p-4 rounded-lg flex items-center justify-between hover:border-${color}-500/30 transition-colors shadow-lg shadow-black/20`}>
    <div>
      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-semibold">{label}</p>
      <p className="text-2xl font-bold font-mono text-gray-100">{value}</p>
    </div>
    <div className={`p-3 rounded-lg bg-${color}-500/10 text-${color}-400`}>
      {icon}
    </div>
  </div>
);