
import React from 'react';
import { generateForecastHtml, renderReportContent } from '../reportUtils';
import BackIcon from './icons/BackIcon';
import DownloadIcon from './icons/DownloadIcon';

interface ForecastViewProps {
  reportMarkdown: string;
  onBack: () => void;
}

const ForecastView: React.FC<ForecastViewProps> = ({ reportMarkdown, onBack }) => {
  const reportHtml = renderReportContent(reportMarkdown);

  const handleDownload = () => {
    const reportFullHtml = generateForecastHtml(reportMarkdown);
    const newWindow = window.open("", "_blank");
    if (newWindow) {
      newWindow.document.write(reportFullHtml);
      newWindow.document.close();
    } else {
      alert("Could not open report. Please disable your pop-up blocker.");
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-4xl">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
        >
          <BackIcon className="w-5 h-5" />
          New Forecast
        </button>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleDownload} 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
          >
            <DownloadIcon className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      <div 
          className="prose prose-lg max-w-none w-full"
          dangerouslySetInnerHTML={{ __html: reportHtml }} 
      />
    </div>
  );
};

export default ForecastView;
