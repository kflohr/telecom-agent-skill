import React, { useEffect, useState } from 'react';
import { NAV_ITEMS } from '../constants';
import { Activity } from 'lucide-react';
import { getSystemHealth } from '../services/mockService';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onConfigure?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, onConfigure }) => {
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
    <div className="w-full bg-gray-900 border-r border-gray-800 flex flex-col h-full">
      <div className="p-6 flex items-center border-b border-gray-800">
        {/* User: Place your logo at apps/web/public/logo.png */}
        <img src="/logo.png" alt="telop.dev" className="h-10 w-auto object-contain" onError={(e) => {
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextElementSibling?.classList.remove('hidden');
        }} />
        <div className="hidden flex items-center gap-3 group cursor-pointer" onClick={() => onTabChange('dashboard')}>
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative p-2.5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg shadow-blue-900/20 group-hover:scale-105 transition-transform duration-300 border border-blue-500/20">
              <Activity size={24} className="text-white group-hover:animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="font-bold text-gray-100 tracking-tight text-lg group-hover:text-white transition-colors">
              telop<span className="text-blue-500">.</span>dev
            </h1>
            <p className="text-[10px] text-gray-500 font-mono tracking-wider uppercase group-hover:text-blue-400 transition-colors">Control Plane</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition-all duration-200 ${activeTab === item.id
              ? 'bg-gray-800/50 text-white border-l-2 border-blue-500'
              : 'text-gray-400 border-l-2 border-transparent hover:text-gray-200 hover:bg-gray-800/30'
              }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800 space-y-2">
        {/* DB Status */}
        <div
          onClick={onConfigure}
          className="bg-gray-800/50 rounded-lg p-3 cursor-pointer hover:bg-gray-800 hover:border-blue-500/30 border border-transparent transition-all group"
          title="Click to Configure"
        >
          <div className="flex justify-between items-center mb-1">
            <p className="text-[10px] uppercase font-bold text-gray-500 group-hover:text-gray-400 transition-colors">System Health</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500 animate-pulse'}`}></span>
            <span className={`text-xs font-mono ${dbStatus === 'connected' ? 'text-emerald-400' : 'text-red-400'}`}>
              DB: {dbStatus.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Agent Status */}
        <div
          onClick={onConfigure}
          className={`bg-purple-900/10 border ${agentStatus === 'active' ? 'border-purple-500/20' : 'border-red-500/20'} rounded-lg p-3 transition-colors cursor-pointer hover:bg-purple-900/20`}
        >
          <p className="text-[10px] uppercase font-bold text-purple-400 mb-1">Agent Runtime</p>
          <div className="flex items-center gap-2">
            <div className="relative flex h-2 w-2">
              {agentStatus === 'active' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${agentStatus === 'active' ? 'bg-purple-500' : 'bg-red-500'}`}></span>
            </div>
            <span className={`text-xs font-mono ${agentStatus === 'active' ? 'text-purple-300' : 'text-red-300'}`}>{agentStatus.toUpperCase()}</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1 truncate">
            {agentStatus === 'active' ? `${agentLabel} online` : 'Click to Connect'}
          </p>
        </div>
      </div>
    </div>
  );
};