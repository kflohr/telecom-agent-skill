import React, { useState, useEffect } from 'react';
import { getMessages, executeSms } from '../services/mockService';
import { SmsMessage, SmsDirection, SmsStatus } from '../types';
import { MessageSquare, Send, ArrowUpRight, ArrowDownLeft, Search } from 'lucide-react';

export const Messaging: React.FC = () => {
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [to, setTo] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  const refresh = async () => {
    setMessages(await getMessages());
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to || !body) return;

    setIsSending(true);
    try {
      await executeSms(to, body);
      setBody('');
      refresh();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Messaging Logs</h2>
          <p className="text-gray-500 mt-1">SMS/MMS traffic history and quick dispatch.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Message List */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-lg flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-950">
            <h3 className="text-sm font-semibold text-gray-300">Traffic Log</h3>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
              <input
                type="text"
                placeholder="Filter..."
                className="bg-gray-900 border border-gray-800 text-xs text-gray-300 pl-8 pr-3 py-1.5 rounded focus:ring-1 focus:ring-blue-500 outline-none w-40"
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1 p-0">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-900 text-gray-500 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">Direction</th>
                  <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">To/From</th>
                  <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">Message</th>
                  <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {messages.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center">
                      <div className="w-16 h-16 bg-gray-900 border border-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageSquare size={24} className="text-gray-600" />
                      </div>
                      <h3 className="text-gray-300 font-medium">No messages yet</h3>
                      <p className="text-gray-500 text-xs mt-1 max-w-xs mx-auto">Send a message from the panel on the right or via the CLI to see traffic here.</p>
                    </td>
                  </tr>
                ) : (
                  messages.map(msg => (
                    <tr key={msg.id} className="hover:bg-gray-800/50 group">
                      {/* ... cell content same as before ... */}
                      <td className="px-4 py-3 align-top">
                        <div className={`flex items-center gap-2 ${msg.direction === SmsDirection.OUTBOUND ? 'text-blue-400' : 'text-emerald-400'}`}>
                          {msg.direction === SmsDirection.OUTBOUND ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                          <span className="text-xs font-bold">{msg.direction === SmsDirection.OUTBOUND ? 'OUT' : 'IN'}</span>
                        </div>
                        <div className="text-[10px] text-gray-600 font-mono mt-1">{msg.messageSid}</div>
                      </td>
                      <td className="px-4 py-3 align-top font-mono text-xs text-gray-300">
                        {msg.direction === SmsDirection.OUTBOUND ? (
                          <>
                            <div className="text-gray-500">To: <span className="text-gray-200">{msg.to}</span></div>
                            <div className="text-gray-600">Fr: {msg.from}</div>
                          </>
                        ) : (
                          <>
                            <div className="text-gray-500">Fr: <span className="text-gray-200">{msg.from}</span></div>
                            <div className="text-gray-600">To: {msg.to}</div>
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <p className="text-gray-300 text-sm leading-relaxed">{msg.body}</p>
                        <span className={`inline-block mt-2 text-[10px] font-bold px-1.5 py-0.5 rounded border ${msg.status === SmsStatus.DELIVERED ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10' :
                            msg.status === SmsStatus.FAILED ? 'border-red-500/30 text-red-500 bg-red-500/10' :
                              'border-gray-600 text-gray-500 bg-gray-800'
                          }`}>
                          {msg.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top text-right text-xs text-gray-500 font-mono">
                        {new Date(msg.sentAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Compose Panel */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 flex flex-col h-fit">
          <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2 mb-6">
            <MessageSquare size={20} className="text-purple-400" />
            Quick Send
          </h3>

          <form onSubmit={handleSend} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase">Recipient (E.164)</label>
              <input
                value={to}
                onChange={e => setTo(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-gray-200 font-mono text-sm focus:border-purple-500 outline-none"
                placeholder="+14155550100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase">Body</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={6}
                className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-gray-200 text-sm focus:border-purple-500 outline-none resize-none"
                placeholder="Type your message here..."
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSending || !to || !body}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-900/20"
              >
                {isSending ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <Send size={16} />
                )}
                {isSending ? 'Dispatching...' : 'Send Message'}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-800">
            <p className="text-xs text-gray-500 font-mono mb-2">Equivalent CLI Command:</p>
            <code className="block bg-gray-950 p-2 rounded text-[10px] text-gray-400 break-all font-mono border border-gray-800">
              telecom sms {to || '<num>'} "{body.slice(0, 20) || '...'}"
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};