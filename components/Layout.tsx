import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';

interface LayoutProps {
    children: React.ReactNode;
    activeTab: string;
    onTabChange: (tabId: string) => void;
    onConfigure?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, onConfigure }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Mobile: Drawer / Desktop: Fixed Width */}
            <aside className={`
        fixed inset-y-0 left-0 z-40 w-[85%] max-w-[300px] bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-out border-r border-gray-800
        md:relative md:translate-x-0 md:w-64 md:shadow-none md:border-r-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <Sidebar
                    activeTab={activeTab}
                    onTabChange={(tab) => {
                        onTabChange(tab);
                        setIsSidebarOpen(false); // Close on selection (mobile)
                    }}
                    onConfigure={onConfigure}
                />
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center p-4 border-b border-gray-800 bg-gray-900/50">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -ml-2 text-gray-400 hover:text-white rounded-md"
                    >
                        <Menu size={24} />
                    </button>
                    <span className="ml-3 font-semibold text-gray-100">Telecom Console</span>
                </div>

                {/* Scrollable Content Area */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
                    {children}
                </main>
            </div>
        </div>
    );
};
