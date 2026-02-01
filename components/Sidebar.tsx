import React from 'react';
import { NAV_ITEMS } from '../constants';
import { Activity } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
      <div className="p-6 flex items-center gap-3 border-b border-gray-800">
        <div className="p-2 bg-blue-600 rounded-lg">
          <Activity size={24} className="text-white" />
        </div>
        <div>
          <h1 className="font-bold text-gray-100 tracking-tight">Telecom Ops</h1>
          <p className="text-xs text-gray-500 font-mono">v1.1.0-beta</p>
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
        {/* Twilio Status */}
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Provider Status</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-mono text-emerald-400">Twilio: CONNECTED</span>
          </div>
        </div>

        {/* OpenClaw Agent Status */}
        <div className="bg-purple-900/10 border border-purple-500/20 rounded-lg p-3">
          <p className="text-[10px] uppercase font-bold text-purple-400 mb-1">Agent Runtime</p>
          <div className="flex items-center gap-2">
             <div className="relative flex h-2 w-2">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
             </div>
            <span className="text-xs font-mono text-purple-300">OpenClaw: ACTIVE</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">Listening for tool_use...</p>
        </div>
      </div>
    </div>
  );
};