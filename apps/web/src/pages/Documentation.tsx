import React from 'react';
import { Book, Terminal, Shield, FileText, Globe, Server, Code, Zap, ChevronRight } from 'lucide-react';

export const Documentation: React.FC = () => {
    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10 max-w-6xl mx-auto">
            <header className="mb-10 border-b border-gray-800 pb-8">
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-gray-800 rounded-lg border border-gray-700">
                        <Book className="text-gray-100" size={20} />
                    </div>
                    <h1 className="text-2xl font-semibold text-white tracking-tight">Documentation</h1>
                </div>
                <p className="text-gray-400 ml-12 max-w-2xl text-sm leading-relaxed">
                    We believe communication should be private, safe, and human.
                    This console gives you complete control over your telecom infrastructure, ensuring every call and message remains secure and compliant.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* CLI Quick Start */}
                <section className="bg-gray-900/20 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors group">
                    <div className="flex items-center gap-3 mb-6">
                        <Terminal className="text-blue-400" size={20} />
                        <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">CLI Interface</h2>
                    </div>

                    <div className="space-y-5">
                        <p className="text-xs text-gray-400">
                            Type these commands directly into the <strong>Operator Console</strong> on your Dashboard to control the system in real-time.
                        </p>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-500">Initiate Call</span>
                                <span className="text-[10px] text-gray-600 font-mono">POST /v1/calls</span>
                            </div>
                            <div className="bg-black/50 p-3 rounded-lg border border-gray-800/50 group-hover:border-gray-700 transition-colors">
                                <code className="font-mono text-xs text-gray-300">
                                    <span className="text-blue-400">telecom</span> call dial <span className="text-gray-500">+15550000000</span>
                                </code>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-500">Audio Verification</span>
                                <span className="text-[10px] text-gray-600 font-mono">POST /v1/test/audio</span>
                            </div>
                            <div className="bg-black/50 p-3 rounded-lg border border-gray-800/50 group-hover:border-gray-700 transition-colors">
                                <code className="font-mono text-xs text-gray-300">
                                    <span className="text-blue-400">telecom</span> call test <span className="text-gray-500">+15550000000</span>
                                </code>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-500">Send SMS</span>
                                <span className="text-[10px] text-gray-600 font-mono">POST /v1/sms</span>
                            </div>
                            <div className="bg-black/50 p-3 rounded-lg border border-gray-800/50 group-hover:border-gray-700 transition-colors">
                                <code className="font-mono text-xs text-gray-300">
                                    <span className="text-blue-400">telecom</span> sms send <span className="text-gray-500">+1555...</span> <span className="text-emerald-400/80">"Hello"</span>
                                </code>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Trust & Safety (Human / Privacy Focus) */}
                <section className="bg-gray-900/20 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
                    <div className="flex items-center gap-3 mb-6">
                        <Shield className="text-emerald-400" size={20} />
                        <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">Trust & Safety</h2>
                    </div>
                    <div className="grid gap-1">
                        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800/30 transition-colors">
                            <Zap size={16} className="text-gray-500" />
                            <div className="flex-1">
                                <strong className="text-gray-300 text-sm font-medium">Private by Default</strong>
                                <p className="text-xs text-gray-500 mt-0.5">Your conversations are yours. Zero-knowledge logging.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800/30 transition-colors">
                            <Shield size={16} className="text-gray-500" />
                            <div className="flex-1">
                                <strong className="text-gray-300 text-sm font-medium">Safe Platform</strong>
                                <p className="text-xs text-gray-500 mt-0.5">Automated screening blocks spam and fraud instantly.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800/30 transition-colors">
                            <Globe size={16} className="text-gray-500" />
                            <div className="flex-1">
                                <strong className="text-gray-300 text-sm font-medium">Human Control</strong>
                                <p className="text-xs text-gray-500 mt-0.5">You hold the keys. Approve or deny high-risk actions.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Reference */}
                <section className="bg-gray-900/20 border border-gray-800 rounded-xl p-6 lg:col-span-2">
                    <div className="flex items-center gap-3 mb-6">
                        <Code className="text-gray-100" size={20} />
                        <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">Command Registry</h2>
                    </div>
                    <div className="overflow-hidden rounded-lg border border-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-900/50 text-gray-500 font-medium text-xs uppercase">
                                <tr>
                                    <th className="p-4 font-semibold tracking-wider">Command</th>
                                    <th className="p-4 font-semibold tracking-wider">Action</th>
                                    <th className="p-4 font-semibold tracking-wider text-right">Syntax</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800 bg-black/20">
                                {[
                                    { cmd: 'telecom call dial', desc: 'Initiate outbound voice call', ex: 'call dial <to>' },
                                    { cmd: 'telecom call test', desc: 'Verify audio path (Rick Roll Protocol)', ex: 'call test <to>' },
                                    { cmd: 'telecom call merge', desc: 'Bridge two active legs', ex: 'call merge <id> <id>' },
                                    { cmd: 'telecom sms send', desc: 'Dispatch alphanumeric sender', ex: 'sms send <to> <body>' },
                                    { cmd: 'telecom approvals', desc: 'Review held actions', ex: 'approvals list' },
                                    { cmd: 'telecom update', desc: 'Self-update CLI software', ex: 'update' },
                                ].map((row, i) => (
                                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4 font-mono text-gray-300 text-xs">{row.cmd}</td>
                                        <td className="p-4 text-gray-500 text-xs">{row.desc}</td>
                                        <td className="p-4 font-mono text-gray-600 text-xs text-right">{row.ex}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Footer Info */}
                <section className="lg:col-span-2 border-t border-gray-800/50 pt-6 flex items-center justify-between text-xs text-gray-600">
                    <div className="flex items-center gap-6">
                        <span className="flex items-center gap-2">
                            <Server size={12} />
                            api.telop.dev
                        </span>
                        <span>v1.1.0-release</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-500/80">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        Operational
                    </div>
                </section>
            </div>
        </div>
    );
};
