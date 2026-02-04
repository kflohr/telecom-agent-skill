import React, { useState, useEffect } from 'react';
import { getCallTranscript } from '../services/mockService';
import { Loader2, Copy, CheckCircle2 } from 'lucide-react';

interface TranscriptViewerProps {
    callSid: string;
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({ callSid }) => {
    const [text, setText] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [confidence, setConfidence] = useState<number | null>(null);
    const [recordingUrl, setRecordingUrl] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        getCallTranscript(callSid)
            .then(data => {
                if (mounted) {
                    setText(data.text);
                    setConfidence(data.confidence || null);
                    // Check for recordingUrl in the response
                    setRecordingUrl((data as any).recordingUrl || null);
                    setLoading(false);
                }
            })
            .catch(() => {
                if (mounted) {
                    setError(true);
                    setLoading(false);
                }
            });
        return () => { mounted = false; };
    }, [callSid]);

    if (loading) return (
        <div className="flex items-center gap-2 text-gray-400 text-sm p-4 bg-gray-950/30 rounded border border-gray-800">
            <Loader2 className="animate-spin" size={16} /> Retrieving memory...
        </div>
    );

    if (error) return (
        <div className="text-red-400 text-sm p-4 bg-red-900/10 border border-red-900/30 rounded">
            Failed to load transcript.
        </div>
    );

    if (!text) return (
        <div className="text-gray-500 text-sm italic p-4 bg-gray-950/30 rounded border border-gray-800">
            No transcript available for this call.
        </div>
    );

    return (
        <div className="bg-gray-950/50 border border-gray-800 rounded-lg p-4 mt-2">
            <div className="flex items-center justify-between mb-2">
                <h5 className="text-xs font-bold uppercase text-blue-400 flex items-center gap-2">
                    <CheckCircle2 size={12} /> Agent Memory (Transcript)
                </h5>
                {confidence && (
                    <span className="text-[10px] text-gray-500 bg-gray-900 px-2 py-0.5 rounded">
                        Confidence: {(confidence * 100).toFixed(0)}%
                    </span>
                )}
            </div>
            {/* Audio Player */}
            {recordingUrl && (
                <div className="mb-3 bg-gray-900/50 p-2 rounded border border-gray-800">
                    <div className="text-[10px] text-gray-500 mb-1 flex items-center gap-1">
                        🎙️ Audio Recording
                    </div>
                    <audio controls className="w-full h-8 cursor-pointer" src={recordingUrl}>
                        Your browser does not support the audio element.
                    </audio>
                </div>
            )}
            <p className="text-gray-300 text-sm font-mono leading-relaxed whitespace-pre-wrap">
                {text}
            </p>
            <div className="mt-3 flex justify-end">
                <button
                    onClick={() => navigator.clipboard.writeText(text || '')}
                    className="text-xs flex items-center gap-1 text-gray-500 hover:text-white transition-colors"
                >
                    <Copy size={12} /> Copy Text
                </button>
            </div>
        </div>
    );
};
