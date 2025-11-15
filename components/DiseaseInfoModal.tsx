
import React from 'react';
import { renderReportContent } from '../reportUtils';
import Spinner from './Spinner';

interface DiseaseInfoModalProps {
  isOpen: boolean;
  isLoading: boolean;
  content: string | null;
  error: string | null;
  diseaseName: string;
  onClose: () => void;
}

const DiseaseInfoModal: React.FC<DiseaseInfoModalProps> = ({ isOpen, isLoading, content, error, diseaseName, onClose }) => {
  if (!isOpen) return null;

  const contentHtml = content ? renderReportContent(content) : '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        role="document"
      >
        <header className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white rounded-t-lg z-10">
          <h2 className="text-xl font-bold text-gray-800">About: {diseaseName}</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-800 text-3xl leading-none font-bold" 
            aria-label="Close modal"
          >
            &times;
          </button>
        </header>
        <main className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="min-h-[300px] flex items-center justify-center">
              <Spinner />
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg text-center">
              <h3 className="font-bold">Error</h3>
              <p>{error}</p>
            </div>
          ) : (
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          )}
        </main>
        <footer className="p-4 bg-gray-50 border-t border-gray-200 text-right sticky bottom-0 rounded-b-lg">
            <button 
                onClick={onClose} 
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors"
            >
                Close
            </button>
        </footer>
      </div>
    </div>
  );
};

export default DiseaseInfoModal;
