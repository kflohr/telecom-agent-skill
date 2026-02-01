import React, { useState } from 'react';
import { ShieldAlert, CheckCircle, Loader2 } from 'lucide-react';
import { setupProvider } from '../services/mockService';

interface OnboardingModalProps {
    isOpen: boolean;
    onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
    const [sid, setSid] = useState('');
    const [token, setToken] = useState('');
    const [fromNumber, setFromNumber] = useState('');
    const [status, setStatus] = useState<'idle' | 'submitting' | 'error' | 'success'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');
        setErrorMsg('');

        try {
            await setupProvider(sid, token, fromNumber);
            setStatus('success');
            setTimeout(onComplete, 1500); // Close after success animation
        } catch (err: any) {
            setStatus('error');
            setErrorMsg(err.message || 'Connection failed');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6 space-y-6 relative overflow-hidden">

                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                        <ShieldAlert className="text-blue-400" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-100">Setup Control Plane</h2>
                    <p className="text-sm text-gray-400">Connect your Twilio account to enable calls & SMS.</p>
                </div>

                {/* Form */}
                {status === 'success' ? (
                    <div className="text-center py-8 space-y-4 animate-in zoom-in duration-300">
                        <CheckCircle className="mx-auto text-emerald-400" size={48} />
                        <p className="text-lg font-medium text-emerald-400">Connected Successfully!</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-xs font-mono text-gray-500 uppercase">Account SID</label>
                            <input
                                type="text"
                                value={sid}
                                onChange={e => setSid(e.target.value)}
                                placeholder="AC..."
                                className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-gray-200 mt-1 focus:border-blue-500 outline-none font-mono text-sm"
                                required
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-mono text-gray-500 uppercase">Account SID</label>
                                <a href="https://console.twilio.com/" target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 hover:text-blue-300 hover:underline">Find in Twilio Console ↗</a>
                            </div>
                            <input
                                type="text"
                                value={sid}
                                onChange={e => setSid(e.target.value)}
                                placeholder="AC..."
                                className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-gray-200 mt-1 focus:border-blue-500 outline-none font-mono text-sm"
                                required
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-mono text-gray-500 uppercase">Auth Token</label>
                                <a href="https://console.twilio.com/" target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 hover:text-blue-300 hover:underline">Where is this? ↗</a>
                            </div>
                            <input
                                type="password"
                                value={token}
                                onChange={e => setToken(e.target.value)}
                                placeholder="••••••••••••••••"
                                className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-gray-200 mt-1 focus:border-blue-500 outline-none font-mono text-sm"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-xs font-mono text-gray-500 uppercase">Default From Number</label>
                            <input
                                type="text"
                                value={fromNumber}
                                onChange={e => setFromNumber(e.target.value)}
                                placeholder="+1..."
                                className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-gray-200 mt-1 focus:border-blue-500 outline-none font-mono text-sm"
                                required
                            />
                        </div>

                        {status === 'error' && (
                            <div className="p-3 bg-red-900/20 border border-red-900/50 rounded text-red-300 text-xs">
                                Error: {errorMsg}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={status === 'submitting'}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                        >
                            {status === 'submitting' && <Loader2 className="animate-spin" size={16} />}
                            {status === 'submitting' ? 'Verifying...' : 'Connect Provider'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};
