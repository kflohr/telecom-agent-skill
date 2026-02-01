import React, { useState, useRef, useEffect } from 'react';
import { processCommand } from '../services/mockService';

export const TerminalWidget: React.FC = () => {
  const [history, setHistory] = useState<Array<{ cmd: string; output: string; status: string }>>([
    { cmd: '', output: 'Telecom-as-Code Operator Console [Version 1.1.0]\nType "telecom help" to view commands.', status: 'system' }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const cmd = input;
    setInput('');
    setIsProcessing(true);

    // Optimistically output the command
    setHistory(prev => [...prev, { cmd, output: '', status: 'pending' }]);

    try {
        const res = await processCommand(cmd);
        
        setHistory(prev => {
            const newHist = [...prev];
            // Replace the pending entry with result
            newHist[newHist.length - 1] = { cmd, output: res.output, status: res.status };
            return newHist;
        });
    } catch (e) {
        setHistory(prev => {
             const newHist = [...prev];
             newHist[newHist.length - 1] = { cmd, output: "System Error", status: 'error' };
             return newHist;
        });
    } finally {
        setIsProcessing(false);
    }
  };

  const renderOutput = (output: string) => {
      // Check if output is JSON
      if (typeof output === 'string' && (output.trim().startsWith('{') || output.trim().startsWith('['))) {
          try {
              // Pretty print if it's a valid JSON string (it should be already stringified by service, but double check)
              return <code className="block whitespace-pre text-xs text-blue-200 bg-gray-900/50 p-2 rounded border border-gray-800/50 mt-1">{output}</code>;
          } catch (e) {
              return output;
          }
      }
      return output;
  }

  return (
    <div className="bg-gray-950 rounded-lg border border-gray-800 font-mono text-sm h-[450px] flex flex-col shadow-2xl overflow-hidden">
      <div className="bg-gray-900 px-4 py-2 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
            <span className="ml-2 text-xs text-gray-500 font-medium">operator@telecom-engine:~</span>
        </div>
        <div className="text-xs text-gray-600">bash</div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {history.map((entry, i) => (
          <div key={i} className="space-y-1">
            {entry.cmd && (
              <div className="flex items-center gap-2 text-gray-400">
                <span className="text-blue-500 font-bold">➜</span>
                <span className="text-gray-300">{entry.cmd}</span>
              </div>
            )}
            <div className={`whitespace-pre-wrap pl-6 ${
              entry.status === 'error' ? 'text-red-400' : 
              entry.status === 'pending' ? 'text-yellow-400' : 
              entry.status === 'system' ? 'text-gray-500 italic' : 'text-emerald-400'
            }`}>
              {entry.status === 'pending' ? <span className="animate-pulse">Processing...</span> : renderOutput(entry.output)}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 bg-gray-900 border-t border-gray-800 flex items-center gap-2">
        <span className="text-blue-500 font-bold pl-1">➜</span>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isProcessing}
          className="flex-1 bg-transparent border-none outline-none text-gray-100 placeholder-gray-600 font-mono disabled:opacity-50"
          placeholder="telecom call dial... (try 'telecom help')"
          autoFocus
          spellCheck={false}
        />
      </form>
    </div>
  );
};