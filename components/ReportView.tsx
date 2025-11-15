
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { renderReportContent, parseReportMarkdown } from '../reportUtils';
import { generateWeatherBasedRecommendations, generateGenericRecommendations, getDiseaseInfo } from '../services/geminiService';
import BackIcon from './icons/BackIcon';
import ShareIcon from './icons/ShareIcon';
import DownloadIcon from './icons/DownloadIcon';
import TableIcon from './icons/TableIcon';
import Spinner from './Spinner';
import DiseaseInfoModal from './DiseaseInfoModal';

interface ReportViewProps {
  reportMarkdown: string;
  imageUrl: string | null;
  onBack: () => void;
  onShare: (fullReport: string) => void;
  onDownload: (fullReport: string) => void;
  onDownloadCsv: (fullReport: string) => void;
}

const ReportView: React.FC<ReportViewProps> = ({ reportMarkdown, imageUrl, onBack, onShare, onDownload, onDownloadCsv }) => {
  const [recommendationsMarkdown, setRecommendationsMarkdown] = useState<string | null>(null);
  const [isGeneratingRecs, setIsGeneratingRecs] = useState<boolean>(false);
  const [recsError, setRecsError] = useState<string | null>(null);

  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<string | null>(null);
  const [isModalLoading, setIsModalLoading] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [activeDisease, setActiveDisease] = useState<string>('');
  const reportContainerRef = useRef<HTMLDivElement>(null);

  const parsedData = useMemo(() => parseReportMarkdown(reportMarkdown), [reportMarkdown]);
  const { plantType, detectedDisease } = parsedData;
  
  const handleGetGenericRecs = useCallback(async () => {
    // This is now primarily a fallback if location fails.
    setIsGeneratingRecs(true);
    try {
      const recommendations = await generateGenericRecommendations(plantType, detectedDisease);
      setRecommendationsMarkdown(recommendations);
    } catch (err: any) {
      setRecsError(prev => (prev ? prev + '\n' : '') + (err.message || 'Failed to generate recommendations.'));
    } finally {
      setIsGeneratingRecs(false);
    }
  }, [plantType, detectedDisease]);

  const handleGetLocationRecs = useCallback(() => {
    if (!navigator.geolocation) {
      setRecsError("Geolocation is not supported by your browser. Showing general advice.");
      handleGetGenericRecs();
      return;
    }

    setIsGeneratingRecs(true);
    setRecsError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const recommendations = await generateWeatherBasedRecommendations(plantType, detectedDisease, `${latitude},${longitude}`);
          setRecommendationsMarkdown(recommendations);
        } catch (err: any) {
          setRecsError(err.message || 'Failed to generate recommendations.');
        } finally {
          setIsGeneratingRecs(false);
        }
      },
      (geoError) => {
        let message = 'Could not retrieve your location.';
        if (geoError.code === geoError.PERMISSION_DENIED) {
          message = 'Location access was denied.';
        } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
            message = 'Location information is unavailable.';
        } else if (geoError.code === geoError.TIMEOUT) {
            message = 'The request to get your location timed out.';
        }
        setRecsError(`${message} Showing general advice instead.`);
        handleGetGenericRecs();
      }
    );
  }, [plantType, detectedDisease, handleGetGenericRecs]);

  useEffect(() => {
    // Automatically fetch recommendations when the component mounts with a report.
    if (plantType && detectedDisease && !recommendationsMarkdown && !isGeneratingRecs && !recsError) {
      handleGetLocationRecs();
    }
  }, [plantType, detectedDisease, recommendationsMarkdown, isGeneratingRecs, recsError, handleGetLocationRecs]);

  const fullReportMarkdown = useMemo(() => {
    return reportMarkdown + (recommendationsMarkdown ? `\n\n${recommendationsMarkdown}` : '');
  }, [reportMarkdown, recommendationsMarkdown]);

  const initialReportHtml = useMemo(() => renderReportContent(reportMarkdown), [reportMarkdown]);
  const recommendationsHtml = recommendationsMarkdown ? renderReportContent(recommendationsMarkdown) : '';

  const handleViewDiseaseInfo = async (diseaseName: string) => {
    setActiveDisease(diseaseName);
    setIsInfoModalOpen(true);
    setIsModalLoading(true);
    setModalError(null);
    setModalContent(null);

    try {
        const info = await getDiseaseInfo(diseaseName);
        setModalContent(info);
    } catch (err: any) {
        setModalError(err.message || 'Failed to fetch disease details.');
    } finally {
        setIsModalLoading(false);
    }
  };

  useEffect(() => {
    const container = reportContainerRef.current;
    if (!container) return;

    const handleClick = (event: Event) => {
        const target = event.target as HTMLElement;
        const link = target.closest('.disease-info-link');
        if (link instanceof HTMLElement && link.dataset.diseaseName) {
            handleViewDiseaseInfo(link.dataset.diseaseName);
        }
    };
    
    container.addEventListener('click', handleClick);
    return () => {
        container.removeEventListener('click', handleClick);
    };
  }, [initialReportHtml]);

  const handleCloseModal = () => {
    setIsInfoModalOpen(false);
  };

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
            onClick={() => onShare(fullReportMarkdown)}
            className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors text-sm"
          >
            <ShareIcon className="w-4 h-4" />
            Share
          </button>
          <button 
            onClick={() => onDownloadCsv(fullReportMarkdown)}
            className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors text-sm"
            title="Download analysis data as CSV"
          >
            <TableIcon className="w-4 h-4" />
            CSV
          </button>
          <button 
            onClick={() => onDownload(fullReportMarkdown)}
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
        <div ref={reportContainerRef} className={`prose prose-lg max-w-none w-full ${!imageUrl && 'md:w-full'}`}>
          <div dangerouslySetInnerHTML={{ __html: initialReportHtml }} />

          <div className="mt-8">
            {isGeneratingRecs && (
                <div className="p-6 rounded-lg bg-gray-50 border border-gray-200">
                    <div className="flex flex-col items-center justify-center min-h-[100px]">
                        <Spinner />
                        <p className="text-gray-600 mt-2 text-center">Generating tailored recommendations...<br/>Please approve the location request in your browser for a weather-based plan.</p>
                    </div>
                </div>
            )}
            {recsError && !isGeneratingRecs && (
                <div className="mb-4 bg-yellow-100 border border-yellow-400 text-yellow-800 p-4 rounded-lg text-center">
                    <p className="font-semibold">Notice</p>
                    <p>{recsError}</p>
                </div>
            )}
            {recommendationsHtml && (
                <div dangerouslySetInnerHTML={{ __html: recommendationsHtml }} />
            )}
          </div>
        </div>
      </div>
      <DiseaseInfoModal
        isOpen={isInfoModalOpen}
        isLoading={isModalLoading}
        content={modalContent}
        error={modalError}
        diseaseName={activeDisease}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default ReportView;
