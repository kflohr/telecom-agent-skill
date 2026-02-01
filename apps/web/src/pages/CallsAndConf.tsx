import React, { useState, useEffect } from 'react';
import { getCalls, getConferences, executeHangup, executeHold } from '../services/mockService';
import { CallLeg, Conference, CallState, ConferenceState } from '../types';
import { Phone, PhoneOff, Mic, MicOff, GitMerge, Clock, Hash, Activity, PauseCircle, PlayCircle } from 'lucide-react';

export const CallsAndConf: React.FC = () => {
  const [calls, setCalls] = useState<CallLeg[]>([]);
  const [conferences, setConferences] = useState<Conference[]>([]);

  const refresh = async () => {
    const [c, conf] = await Promise.all([getCalls(), getConferences()]);
    setCalls(c.filter(l => l.state !== CallState.COMPLETED && l.state !== CallState.FAILED));
    setConferences(conf.filter(cf => cf.state === ConferenceState.IN_PROGRESS));
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleHangup = async (sid: string) => {
    await executeHangup(sid);
    refresh();
  };

  const handleHold = async (sid: string, currentHoldState: boolean) => {
    await executeHold(sid, !currentHoldState);
    refresh();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center justify-between border-b border-gray-800 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <Activity className="text-blue-500" />
            Active Infrastructure
          </h2>
          <p className="text-gray-500 mt-1">Real-time state of Voice Calls and Conference Bridges.</p>
        </div>
      </div>

      {/* Active Conferences Section (The Canonical Merge Pattern) */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-blue-900/20 p-2 rounded-lg">
            <GitMerge size={20} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-200">Conference Bridges</h3>
            <p className="text-xs text-gray-500">Twilio Conferences acting as Merge containers</p>
          </div>
          <span className="ml-auto bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded-full">{conferences.length}</span>
        </div>

        {conferences.length === 0 ? (
           <div className="bg-gray-900/50 border border-gray-800 border-dashed rounded-lg p-8 text-center text-gray-500">
             No active conference bridges. Use <code className="text-blue-400 bg-gray-900 px-1 py-0.5 rounded">telecom merge</code> to start one.
           </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {conferences.map(conf => (
              <div key={conf.id} className="bg-gray-900 border border-gray-800 rounded-lg p-5 shadow-lg relative overflow-hidden group">
                {/* Visual Status Bar */}
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                
                <div className="flex justify-between items-start mb-4 pl-2">
                  <div>
                    <h4 className="font-mono text-lg text-white font-medium flex items-center gap-2">
                        {conf.friendlyName}
                        <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded">CONF</span>
                    </h4>
                    <p className="text-xs text-gray-500 font-mono mt-1">{conf.conferenceSid}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-bold text-emerald-400 bg-emerald-900/20 px-2 py-1 rounded">Live</span>
                    <span className="text-xs font-mono text-gray-500 flex items-center gap-1">
                      <Clock size={12} /> {Math.floor((Date.now() - new Date(conf.startedAt).getTime())/1000)}s
                    </span>
                  </div>
                </div>

                {/* Participants Container */}
                <div className="space-y-2 bg-gray-950/50 rounded p-3 border border-gray-800/50">
                   <div className="flex justify-between items-center mb-2">
                      <p className="text-xs text-gray-500 uppercase font-semibold">Participants ({conf.participants.length})</p>
                      <button className="text-[10px] text-blue-400 hover:text-blue-300 hover:underline">Add Participant +</button>
                   </div>
                   
                   {conf.participants.map(p => (
                     <div key={p.id} className={`flex items-center justify-between bg-gray-900 p-2 rounded border transition-all ${p.onHold ? 'border-yellow-500/30 bg-yellow-900/10' : 'border-gray-800'}`}>
                        <div className="flex items-center gap-3">
                           <div className={`w-2 h-2 rounded-full ${p.onHold ? 'bg-yellow-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`}></div>
                           <div>
                              <div className="text-sm font-mono text-gray-300 flex items-center gap-2">
                                  {p.callSid}
                                  {p.onHold && <span className="text-[10px] bg-yellow-500 text-black px-1 rounded font-bold">HOLD</span>}
                              </div>
                              <div className="text-[10px] text-gray-600">Joined {new Date(p.joinedAt).toLocaleTimeString()}</div>
                           </div>
                        </div>
                        <div className="flex gap-2">
                           <button 
                             onClick={() => handleHold(p.callSid, p.onHold)}
                             className={`p-1.5 rounded transition-colors ${p.onHold ? 'text-yellow-400 hover:text-yellow-300 bg-yellow-900/20' : 'text-gray-500 hover:text-white hover:bg-gray-800'}`}
                             title={p.onHold ? "Resume Call" : "Put on Hold"}
                           >
                              {p.onHold ? <PlayCircle size={14} /> : <PauseCircle size={14} />}
                           </button>
                           
                           <button className="p-1.5 hover:bg-gray-800 rounded text-gray-500 hover:text-white transition-colors" title="Toggle Mute">
                              {p.muted ? <MicOff size={14} className="text-red-400"/> : <Mic size={14} />}
                           </button>
                           
                           <button 
                             onClick={() => handleHangup(p.callSid)}
                             className="p-1.5 hover:bg-red-900/30 rounded text-gray-500 hover:text-red-400 transition-colors border-l border-gray-800 pl-2 ml-1" 
                             title="Kick Participant"
                           >
                              <PhoneOff size={14} />
                           </button>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Active Calls Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-emerald-900/20 p-2 rounded-lg">
            <Phone size={20} className="text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-200">Active Call Legs</h3>
          <span className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded-full">{calls.length}</span>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-950 text-gray-400 border-b border-gray-800">
              <tr>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">SID / Direction</th>
                <th className="px-6 py-4 font-medium">From</th>
                <th className="px-6 py-4 font-medium">To</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {calls.map(call => (
                <tr key={call.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                     <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                       call.state === CallState.RINGING ? 'bg-yellow-500/10 text-yellow-400 animate-pulse' : 
                       call.state === CallState.IN_PROGRESS ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-700 text-gray-300'
                     }`}>
                       {call.state === CallState.RINGING && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"/>}
                       {call.state === CallState.IN_PROGRESS && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"/>}
                       {call.state}
                     </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-mono text-gray-300">{call.callSid}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                       {call.direction === 'inbound' ? 'INBOUND' : 'OUTBOUND (API)'}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-gray-400">{call.from}</td>
                  <td className="px-6 py-4 font-mono text-gray-200">{call.to}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleHangup(call.callSid)}
                      className="text-gray-500 hover:text-red-400 transition-colors bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-1.5 rounded flex items-center gap-2 ml-auto"
                    >
                      <PhoneOff size={14} />
                      <span className="text-xs font-medium">Hangup</span>
                    </button>
                  </td>
                </tr>
              ))}
              {calls.length === 0 && (
                <tr>
                   <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No active calls.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};