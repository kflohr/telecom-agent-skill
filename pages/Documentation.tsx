import React from 'react';
import { Book, Terminal, Shield, FileText, Globe } from 'lucide-react';

export const Documentation: React.FC = () => {
    return (
        <div className="space-y-6">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-100">Documentation</h1>
                <p className="text-gray-400 mt-2">Guide to the Telecom Operator Console</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Quick Start */}
                <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Terminal className="text-blue-500" size={24} />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-200">CLI Quick Start</h2>
                    </div>
                    <div className="space-y-4 text-gray-400 text-sm">
                        <p>Your main tool is the command line (Terminal).</p>
                        <div className="bg-black/50 p-3 rounded-md font-mono text-xs">
                            <span className="text-gray-500"># Make a call</span><br />
                            npm start -- call dial +15550000000
                        </div>
                        <div className="bg-black/50 p-3 rounded-md font-mono text-xs">
                            <span className="text-gray-500"># Send SMS</span><br />
                            npm start -- sms send +15550000000 "Hello!"
                        </div>
                        <div className="bg-black/50 p-3 rounded-md font-mono text-xs">
                            <span className="text-gray-500"># View Active Calls</span><br />
                            npm start -- call list
                        </div>
                    </div>
                </section>

                {/* Feature Overview */}
                <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Globe className="text-purple-500" size={24} />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-200">Control Plane</h2>
                    </div>
                    <ul className="space-y-3 text-gray-400 text-sm">
                        <li className="flex gap-2">
                            <Shield size={16} className="mt-0.5 text-yellow-500" />
                            <div>
                                <strong className="text-gray-200">Approvals:</strong> High-risk actions (like expensive calls) require manual approval here.
                            </div>
                        </li>
                        <li className="flex gap-2">
                            <FileText size={16} className="mt-0.5 text-green-500" />
                            <div>
                                <strong className="text-gray-200">Audit Logs:</strong> All actions are recorded for compliance.
                            </div>
                        </li>
                        <li className="flex gap-2">
                            <Book size={16} className="mt-0.5 text-blue-500" />
                            <div>
                                <strong className="text-gray-200">Live Dashboard:</strong> Monitor active calls and traffic in real-time.
                            </div>
                        </li>
                    </ul>
                </section>

                {/* Command Reference */}
                <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 md:col-span-2">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-yellow-500/10 rounded-lg">
                            <FileText className="text-yellow-500" size={24} />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-200">Command Reference</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="text-xs uppercase bg-gray-900/50 text-gray-500">
                                <tr>
                                    <th className="p-3">Command</th>
                                    <th className="p-3">Description</th>
                                    <th className="p-3">Example</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                <tr>
                                    <td className="p-3 font-mono text-blue-400">telecom call dial</td>
                                    <td className="p-3">Start a voice call</td>
                                    <td className="p-3 font-mono text-gray-500">call dial +15550100</td>
                                </tr>
                                <tr>
                                    <td className="p-3 font-mono text-blue-400">telecom call merge</td>
                                    <td className="p-3">Connect two active calls</td>
                                    <td className="p-3 font-mono text-gray-500">call merge CA123 CA456</td>
                                </tr>
                                <tr>
                                    <td className="p-3 font-mono text-blue-400">telecom sms send</td>
                                    <td className="p-3">Send a text message</td>
                                    <td className="p-3 font-mono text-gray-500">sms send +1555 "Hi"</td>
                                </tr>
                                <tr>
                                    <td className="p-3 font-mono text-blue-400">telecom approvals list</td>
                                    <td className="p-3">View pending requests</td>
                                    <td className="p-3 font-mono text-gray-500">approvals list</td>
                                </tr>
                                <tr>
                                    <td className="p-3 font-mono text-blue-400">telecom approve</td>
                                    <td className="p-3">Approve a blocked action</td>
                                    <td className="p-3 font-mono text-gray-500">approve AP_123</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Server Info */}
                <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 md:col-span-2">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                            <Shield className="text-green-500" size={24} />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-200">Infrastructure</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <h3 className="text-gray-300 font-medium mb-2">API Endpoint</h3>
                            <code className="block bg-black/50 p-2 rounded text-blue-400">http://13.61.21.177:3000</code>
                        </div>
                        <div>
                            <h3 className="text-gray-300 font-medium mb-2">Deployment</h3>
                            <p className="text-gray-400">Running on AWS EC2 (Ubuntu). Managed via SSH.</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};
