import React, { useState, useCallback } from 'react';
import { identifyDisease } from './services/geminiService';
import { generateReportHtml } from './reportUtils';
import Spinner from './components/Spinner';
import LeafIcon from './components/icons/LeafIcon';
import UploadIcon from './components/icons/UploadIcon';

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });

const parsePlantName = (markdown: string): string => {
  const match = markdown.match(/\*\*Plant Type:\*\*\s*(.*)/);
  return match ? match[1].trim() : "Unknown Plant";
};

interface AnalysisResult {
  plantName: string;
  reportMarkdown: string;
}

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setAnalysisResult(null); // Clear previous result
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = useCallback(async () => {
    if (!selectedFile || !previewUrl) return;

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const base64Image = await fileToBase64(selectedFile);
      const reportMarkdown = await identifyDisease(base64Image, selectedFile.type);
      const plantName = parsePlantName(reportMarkdown);

      setAnalysisResult({ plantName, reportMarkdown });
      
      const reportHtml = generateReportHtml(reportMarkdown, previewUrl);
      
      const newWindow = window.open("", "_blank");
      if (newWindow) {
        newWindow.document.write(reportHtml);
        newWindow.document.close();
      } else {
        setError("Could not open report. Please disable your pop-up blocker and try again.");
      }

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
    setAnalysisResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-3">
            <LeafIcon className="w-10 h-10 text-green-600" />
            <h1 className="text-4xl font-bold text-gray-800 tracking-tight">
              Plant Disease Identifier
            </h1>
          </div>
          <p className="mt-2 text-gray-600">
            Upload a leaf image to generate an instant, AI-powered diagnostic report.
          </p>
        </header>

        <main className="flex flex-col items-center gap-8">
          <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-center space-y-4 w-full max-w-lg">
             <input
                type="file"
                id="file-upload"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />

              {!previewUrl ? (
                 <label htmlFor="file-upload" className="cursor-pointer w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-green-500 hover:text-green-500 transition-colors">
                    <UploadIcon className="w-12 h-12 mb-3"/>
                    <span className="font-semibold">Click to upload an image</span>
                    <span className="text-sm">PNG, JPG, WebP up to 10MB</span>
                </label>
              ) : (
                <div className="w-full">
                  <div className="aspect-video rounded-lg overflow-hidden mb-4 border border-gray-300">
                    <img src={previewUrl} alt="Selected leaf" className="w-full h-full object-cover" />
                  </div>

                  {analysisResult && !isLoading && (
                    <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-lg text-center mb-4">
                        <p>Identified Plant: <span className="font-semibold">{analysisResult.plantName}</span></p>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      onClick={handleAnalyze}
                      disabled={isLoading}
                      className="flex-grow bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-lg transition-colors text-base"
                    >
                      {isLoading ? 'Analyzing...' : (analysisResult ? 'Re-Generate Report' : '🔍 Generate Report')}
                    </button>
                    <button
                      onClick={handleRemoveImage}
                      className="bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 px-4 rounded-lg transition-colors"
                      title="Remove Image"
                    >
                      X
                    </button>
                  </div>
                </div>
              )}
          </div>

          <div className="flex items-center justify-center p-4 w-full max-w-lg min-h-[100px]">
            {isLoading ? <Spinner /> : (
              error ? (
                  <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg text-center w-full">
                      <h3 className="font-bold text-lg mb-2">Analysis Failed</h3>
                      <p>{error}</p>
                  </div>
              ) : null
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;