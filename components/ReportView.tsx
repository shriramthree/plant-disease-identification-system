import React from 'react';
import { renderReportContent } from '../reportUtils';
import BackIcon from './icons/BackIcon';
import ShareIcon from './icons/ShareIcon';
import DownloadIcon from './icons/DownloadIcon';
import TableIcon from './icons/TableIcon';

interface ReportViewProps {
  reportMarkdown: string;
  imageUrl: string | null;
  onBack: () => void;
  onShare: () => void;
  onDownload: () => void;
  onDownloadCsv: () => void;
}

const ReportView: React.FC<ReportViewProps> = ({ reportMarkdown, imageUrl, onBack, onShare, onDownload, onDownloadCsv }) => {
  const reportHtml = renderReportContent(reportMarkdown);

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg w-full">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
        >
          <BackIcon className="w-5 h-5" />
          New Analysis
        </button>
        <div className="flex items-center gap-3">
          <button 
            onClick={onShare} 
            className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors text-sm"
          >
            <ShareIcon className="w-4 h-4" />
            Share
          </button>
          <button 
            onClick={onDownloadCsv} 
            className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors text-sm"
            title="Download analysis data as CSV"
          >
            <TableIcon className="w-4 h-4" />
            CSV
          </button>
          <button 
            onClick={onDownload} 
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
          >
            <DownloadIcon className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {imageUrl && (
            <div className="w-full md:w-1/3 flex-shrink-0">
                <img 
                    src={imageUrl} 
                    alt="Analyzed leaf" 
                    className="rounded-lg border border-gray-200 object-cover aspect-video w-full" 
                />
            </div>
        )}
        <div 
          className={`prose prose-lg max-w-none w-full ${!imageUrl && 'md:w-full'}`}
          dangerouslySetInnerHTML={{ __html: reportHtml }} 
        />
      </div>
    </div>
  );
};

export default ReportView;
