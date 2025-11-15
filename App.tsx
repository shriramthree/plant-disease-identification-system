

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateReportHtml, generateReportCsv, parseReportMarkdown } from './reportUtils';
import { identifyDisease } from './services/geminiService';
import * as historyService from './services/historyService';
import { HistoryEntry } from './types';
import Spinner from './components/Spinner';
import LeafIcon from './components/icons/LeafIcon';
import UploadIcon from './components/icons/UploadIcon';
import HistoryList from './components/HistoryList';
import ReportView from './components/ReportView';
import CameraIcon from './components/icons/CameraIcon';
import CameraCapture from './components/CameraCapture';


const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });

// --- Compression Utilities for Shareable Links ---

// Compresses a string to a URL-safe Base64 string using modern browser APIs.
async function compressAndEncode(input: string): Promise<string> {
  const stream = new Blob([input]).stream().pipeThrough(new CompressionStream('gzip'));
  const compressed = await new Response(stream).arrayBuffer();
  // Convert buffer to a binary string and then to base64
  const base64 = btoa(String.fromCharCode(...new Uint8Array(compressed)));
  // Make it URL-safe
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Decompresses a URL-safe Base64 string back to the original string.
async function decodeAndDecompress(encoded: string): Promise<string> {
  let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const compressed = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'));
  return await new Response(stream).text();
}

interface ActiveReport {
  markdown: string;
  imageUrl: string | null;
}

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<HistoryEntry[]>([]);
  const [activeReport, setActiveReport] = useState<ActiveReport | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');
  const toastTimeoutRef = useRef<number | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [activeHash, setActiveHash] = useState(location.hash);


  // Effect for client-side routing via hash
  useEffect(() => {
    const handleHashChange = async () => {
      setActiveHash(location.hash);
      if (location.hash.startsWith('#view-report?data=')) {
        const encodedData = location.hash.split('?data=')[1];
        if (encodedData) {
          setIsLoading(true);
          try {
            const markdown = await decodeAndDecompress(encodedData);
            setActiveReport({ markdown, imageUrl: null }); // No image for shared links
            setError(null);
          } catch (e) {
            console.error("Failed to decode report data:", e);
            setError("The shared report link is invalid or corrupted.");
            setActiveReport(null);
            window.history.pushState("", document.title, window.location.pathname + window.location.search);
          } finally {
            setIsLoading(false);
          }
        }
      } else {
        // Only reset report if not navigating to a specific report hash
        if (!location.hash.startsWith('#view-report')) {
           setActiveReport(null);
        }
      }
    };
    
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Check hash on initial load

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    setAnalysisHistory(historyService.getHistory());
  }, []);

  const showToast = (message: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  const processFile = (file: File) => {
    setSelectedFile(file);
    setError(null);
    setActiveReport(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleCapture = (file: File) => {
    if (file) {
      processFile(file);
    }
    setIsCameraOpen(false);
  };
  
  const handleAnalyze = useCallback(async () => {
    if (!selectedFile || !previewUrl) return;

    setIsLoading(true);
    setError(null);
    setActiveReport(null);

    try {
      const base64Image = await fileToBase64(selectedFile);
      const reportMarkdown = await identifyDisease(base64Image, selectedFile.type);
      
      setActiveReport({ markdown: reportMarkdown, imageUrl: previewUrl });
      
      const parsedData = parseReportMarkdown(reportMarkdown);
      const newEntry: HistoryEntry = {
        id: new Date().toISOString(),
        plantName: parsedData.plantType,
        thumbnailUrl: previewUrl,
        date: new Date().toISOString(),
        reportMarkdown,
      };
      const updatedHistory = historyService.addHistoryEntry(newEntry);
      setAnalysisHistory(updatedHistory);

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile, previewUrl]);
  
  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    setActiveReport(null);
  };

  const handleHistorySelect = (entry: HistoryEntry) => {
    setActiveReport({ markdown: entry.reportMarkdown, imageUrl: entry.thumbnailUrl });
  };
  
  const handleClearHistory = () => {
    historyService.clearHistory();
    setAnalysisHistory([]);
  };

  const handleBack = () => {
    setActiveReport(null);
    window.history.pushState("", document.title, window.location.pathname + window.location.search);
    setActiveHash('');
  };

  const handleShare = async (fullReportMarkdown: string) => {
    if (!activeReport) return;
    try {
      const encodedData = await compressAndEncode(fullReportMarkdown);
      const shareUrl = `${window.location.origin}${window.location.pathname}#view-report?data=${encodedData}`;
      await navigator.clipboard.writeText(shareUrl);
      showToast('Shareable link copied to clipboard!');
    } catch (e) {
      console.error("Failed to create share link:", e);
      showToast('Error creating share link.');
    }
  };

  const handleDownload = (fullReportMarkdown: string) => {
    if (!activeReport) return;
    const reportHtml = generateReportHtml(fullReportMarkdown, activeReport.imageUrl);
    const newWindow = window.open("", "_blank");
    if (newWindow) {
      newWindow.document.write(reportHtml);
      newWindow.document.close();
    } else {
      setError("Could not open report. Please disable your pop-up blocker.");
    }
  };

  const handleDownloadCsv = (fullReportMarkdown: string) => {
    if (!activeReport) return;
    generateReportCsv(fullReportMarkdown);
  };
  
  const isUploaderView = !activeReport;
  const pageTitle = activeReport
    ? "Diagnostic Report"
    : "An AI-powered toolkit for plant health and analysis.";

  return (
    <div className={`min-h-screen text-gray-800 p-4 sm:p-8 flex flex-col items-center justify-start transition-all duration-500 ease-in-out ${
        isUploaderView ? 'main-background' : 'bg-gray-100'
    }`}>
      <div className="w-full max-w-5xl">
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-3">
            <LeafIcon className="w-10 h-10 text-green-600" />
            <h1 className="text-4xl font-bold text-gray-800 tracking-tight">
              Plant Leaf Disease Analysis
            </h1>
          </div>
          <p className="mt-2 text-gray-600">
            {pageTitle}
          </p>
        </header>
        
        {activeReport ? (
            <ReportView 
              reportMarkdown={activeReport.markdown}
              imageUrl={activeReport.imageUrl}
              onBack={handleBack}
              onShare={handleShare}
              onDownload={handleDownload}
              onDownloadCsv={handleDownloadCsv}
            />
          ) : (
          <>
            <main className="flex flex-col items-center gap-8 w-full">
               <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-center space-y-4 w-full max-w-2xl">
                <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isLoading}
                  />

                  {!previewUrl ? (
                    <div className="w-full flex flex-col sm:flex-row gap-4">
                        <label htmlFor="file-upload" className="flex-1 cursor-pointer w-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-green-500 hover:text-green-500 transition-colors p-8 text-center">
                            <UploadIcon className="w-10 h-10 mb-2"/>
                            <span className="font-semibold">Upload an Image</span>
                            <span className="text-sm">From your device</span>
                        </label>
                        <button onClick={() => setIsCameraOpen(true)} className="flex-1 cursor-pointer w-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-green-500 hover:text-green-500 transition-colors p-8 text-center">
                            <CameraIcon className="w-10 h-10 mb-2"/>
                            <span className="font-semibold">Use Camera</span>
                            <span className="text-sm">Capture in real-time</span>
                        </button>
                    </div>
                  ) : (
                    <div className="w-full">
                      <div className="aspect-video rounded-lg overflow-hidden mb-4 border border-gray-300">
                        <img src={previewUrl} alt="Selected leaf" className="w-full h-full object-cover" />
                      </div>

                      <div className="flex gap-4">
                        <button
                          onClick={handleAnalyze}
                          disabled={isLoading || !selectedFile}
                          className="flex-grow bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-lg transition-colors text-base"
                        >
                          {isLoading ? 'Analyzing...' : '🔍 Generate Report'}
                        </button>
                        <button
                          onClick={handleRemoveImage}
                          disabled={isLoading}
                          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 px-4 rounded-lg transition-colors disabled:bg-gray-400"
                          title="Remove Image"
                        >
                          X
                        </button>
                      </div>
                    </div>
                  )}
              </div>

              <div className="flex items-center justify-center p-4 w-full max-w-lg min-h-[100px]">
                {isLoading && !activeReport ? <Spinner /> : (
                  error ? (
                      <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg text-center w-full">
                          <h3 className="font-bold text-lg mb-2">Analysis Failed</h3>
                          <p>{error}</p>
                      </div>
                  ) : null
                )}
              </div>
            </main>
            
            {analysisHistory.length > 0 && (
              <HistoryList 
                history={analysisHistory}
                onSelect={handleHistorySelect}
                onClear={handleClearHistory}
              />
            )}
          </>
        )}

      </div>
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white py-2 px-5 rounded-full shadow-lg animate-fade-in-out text-sm font-medium">
          {toastMessage}
        </div>
      )}
      {isCameraOpen && <CameraCapture onCapture={handleCapture} onClose={() => setIsCameraOpen(false)} />}
    </div>
  );
}

export default App;