import React, { useEffect, useState } from 'react';
import { NAV_ITEMS } from '../constants';
import { Activity } from 'lucide-react';
import { getSystemHealth } from '../services/mockService';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    const checkHealth = async () => {
       const h = await getSystemHealth();
       setHealth(h);
    };
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const dbStatus = health?.services?.database || 'disconnected';
  const agentStatus = health?.services?.agent?.status || 'offline';
  const agentLabel = health?.services?.agent?.label || 'Unknown Agent';

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
      <div className="p-6 flex items-center gap-3 border-b border-gray-800">
        <div className="p-2 bg-blue-600 rounded-lg">
          <Activity size={24} className="text-white" />
        </div>
        <div>
          <h1 className="font-bold text-gray-100 tracking-tight">Telecom Ops</h1>
          <p className="text-xs text-gray-500 font-mono">v1.1.0-rc1</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === item.id
                ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800 space-y-2">
        {/* DB Status */}
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">System Health</p>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
            <span className={`text-xs font-mono ${dbStatus === 'connected' ? 'text-emerald-400' : 'text-red-400'}`}>
               DB: {dbStatus.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Agent Status */}
        <div className={`bg-purple-900/10 border ${agentStatus === 'active' ? 'border-purple-500/20' : 'border-red-500/20'} rounded-lg p-3 transition-colors`}>
          <p className="text-[10px] uppercase font-bold text-purple-400 mb-1">Agent Runtime</p>
          <div className="flex items-center gap-2">
             <div className="relative flex h-2 w-2">
               {agentStatus === 'active' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>}
               <span className={`relative inline-flex rounded-full h-2 w-2 ${agentStatus === 'active' ? 'bg-purple-500' : 'bg-red-500'}`}></span>
             </div>
            <span className={`text-xs font-mono ${agentStatus === 'active' ? 'text-purple-300' : 'text-red-300'}`}>{agentStatus.toUpperCase()}</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1 truncate">
            {agentStatus === 'active' ? `${agentLabel} online` : 'Heartbeat lost'}
          </p>
        </div>
      </div>
    </div>
  );
};