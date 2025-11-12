import React from 'react';
import { HistoryEntry } from '../types';
import HistoryIcon from './icons/HistoryIcon';

interface HistoryListProps {
  history: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onClear: () => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ history, onSelect, onClear }) => {
  return (
    <section className="w-full mt-12" aria-labelledby="history-heading">
      <div className="flex justify-between items-center mb-4">
        <h2 id="history-heading" className="text-2xl font-bold text-gray-700 inline-flex items-center gap-2">
            <HistoryIcon className="w-6 h-6"/>
            Analysis History
        </h2>
        <button 
            onClick={onClear} 
            className="text-sm font-semibold text-red-600 hover:text-red-800 hover:underline transition-colors"
            aria-label="Clear all analysis history"
        >
            Clear History
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {history.map(entry => (
          <div 
            key={entry.id} 
            onClick={() => onSelect(entry)}
            className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer group transform hover:-translate-y-1 transition-transform duration-200 ease-in-out"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(entry);}}
            aria-label={`View report for ${entry.plantName} from ${new Date(entry.date).toLocaleDateString()}`}
          >
            <div className="aspect-w-1 aspect-h-1">
                <img src={entry.thumbnailUrl} alt={entry.plantName} className="w-full h-full object-cover" />
            </div>
            <div className="p-3 bg-white">
              <p className="font-semibold text-sm text-gray-800 truncate group-hover:text-green-600 transition-colors" title={entry.plantName}>{entry.plantName}</p>
              <p className="text-xs text-gray-500">{new Date(entry.date).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HistoryList;
