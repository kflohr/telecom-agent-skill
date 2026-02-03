import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { OnboardingModal } from './components/OnboardingModal';
import { Dashboard } from './pages/Dashboard';
import { Approvals } from './pages/Approvals';
import { Audit } from './pages/Audit';
import { CallsAndConf } from './pages/CallsAndConf';
import { Messaging } from './pages/Messaging';
import { Terminal } from 'lucide-react';
import { Documentation } from './pages/Documentation';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showOnboarding, setShowOnboarding] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onConfigure={() => setShowOnboarding(true)} />;
      case 'approvals':
        return <Approvals />;
      case 'audit':
        return <Audit />;
      case 'calls':
        return <CallsAndConf />;
      case 'sms':
        return <Messaging />;
      case 'docs':
        return <Documentation />;
      case 'console':
        return (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
            <div className="bg-gray-900 p-6 rounded-full">
              <Terminal size={48} className="text-gray-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-300">Full Console Mode</h2>
            <p className="text-gray-500 max-w-md">The full-screen terminal experience is available in the Dashboard widget for quick access. Dedicated view coming in v2.5.</p>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500"
            >
              Go to Dashboard
            </button>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            Feature under construction
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 font-sans">
      <OnboardingModal isOpen={showOnboarding} onComplete={() => setShowOnboarding(false)} />
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onConfigure={() => setShowOnboarding(true)} />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-gray-800 bg-gray-950/50 backdrop-blur flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Workspace: <strong>Production-US-East</strong>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => setActiveTab('docs')} className={`text-xs font-medium transition-colors ${activeTab === 'docs' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>Docs</button>
            <a href="mailto:support@telop.dev" className="text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors">Support</a>
            <div className="w-8 h-8 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center hover:border-gray-700 transition-colors">
              <div className="w-4 h-4 rounded-full bg-gray-600"></div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8 relative">
          {/* Background Grid Pattern */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}></div>

          <div className="relative z-0 max-w-7xl mx-auto h-full">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;