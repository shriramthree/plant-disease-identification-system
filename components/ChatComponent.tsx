
import React, { useState, useRef, useEffect } from 'react';
import { getChatResponse } from '../services/geminiService';
import Spinner from './Spinner';
import TableIcon from './icons/TableIcon';
import LeafIcon from './icons/LeafIcon';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface ChatResult {
  prompt: string;
  answer: string;
  outputToken: number;
  inputToken: number;
  time: number;
}

const ChatComponent: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastResult, setLastResult] = useState<ChatResult | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (!prompt.trim()) return;
        
        const newMessages: ChatMessage[] = [...messages, { role: 'user', text: prompt }];
        setMessages(newMessages);
        setIsLoading(true);
        setError(null);
        setLastResult(null);
        const currentPrompt = prompt;
        setPrompt('');

        try {
            const result = await getChatResponse(currentPrompt);
            setMessages([...newMessages, { role: 'model', text: result.answer }]);
            setLastResult({
                prompt: currentPrompt,
                answer: result.answer,
                outputToken: result.outputTokens,
                inputToken: result.inputTokens,
                time: result.time,
            });
        } catch (err: any) {
            setError(err.message || 'An error occurred.');
            setMessages(newMessages); // Keep user message even if API fails
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleExportCsv = () => {
        if (!lastResult) return;
        const headers = ["prompt", "Answer", "OutputToken", "InputToken", "Time"];
        
        const escapeCsvField = (field: string | number) => {
            const str = String(field);
            if (/[",\n\r]/.test(str)) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };
        
        const rows = [
            lastResult.prompt,
            lastResult.answer,
            lastResult.outputToken,
            lastResult.inputToken,
            lastResult.time.toFixed(4)
        ];

        const csvContent = [
            headers.join(','),
            rows.map(escapeCsvField).join(',')
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        const filename = `ai-chat-response-${new Date().toISOString()}.csv`;
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-4xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">AI Chat Assistant</h2>
            <p className="text-gray-600 mb-6">Ask anything and get simple, helpful explanations.</p>
            
            <div className="border border-gray-200 rounded-lg flex flex-col h-[60vh]">
                <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                    {messages.length === 0 && !isLoading && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                           <LeafIcon className="w-16 h-16 mb-4 text-gray-300" />
                           <p className="text-lg">Conversation is empty</p>
                           <p>Type a message below to start.</p>
                        </div>
                    )}
                    <div className="space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-lg p-3 rounded-xl ${msg.role === 'user' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="max-w-lg p-3 rounded-xl bg-gray-200 text-gray-800">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                         <div ref={messagesEndRef} />
                    </div>
                </div>
                {error && (
                    <div className="p-2 border-t border-gray-200 bg-red-50 text-red-700 text-sm text-center">
                        {error}
                    </div>
                )}
                <div className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex gap-4">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                            placeholder="Type your message here..."
                            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                            rows={1}
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !prompt.trim()}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors"
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>

            {lastResult && (
                <div className="mt-6 p-4 border border-gray-200 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold text-gray-700">Completion Details</h3>
                        <button
                          onClick={handleExportCsv}
                          className="flex items-center gap-2 bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 font-bold py-1.5 px-3 rounded-lg transition-colors text-sm"
                          title="Export last response as CSV"
                        >
                          <TableIcon className="w-4 h-4" />
                          Export as CSV
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="p-3 bg-white rounded-md border border-gray-200">
                            <p className="text-gray-500">Input Tokens</p>
                            <p className="font-semibold text-lg">{lastResult.inputToken}</p>
                        </div>
                        <div className="p-3 bg-white rounded-md border border-gray-200">
                            <p className="text-gray-500">Output Tokens</p>
                            <p className="font-semibold text-lg">{lastResult.outputToken}</p>
                        </div>
                         <div className="p-3 bg-white rounded-md border border-gray-200">
                            <p className="text-gray-500">Response Time</p>
                            <p className="font-semibold text-lg">{lastResult.time.toFixed(2)}s</p>
                        </div>
                    </div>
                    <div className="mt-4 p-3 bg-white rounded-md border border-gray-200">
                        <p className="text-gray-500 text-sm">Prompt</p>
                        <p className="font-mono text-sm mt-1 whitespace-pre-wrap">{lastResult.prompt}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatComponent;
