import React, { useState } from 'react';
import { generateDiseaseForecast } from '../services/geminiService';
import Spinner from './Spinner';
import ForecastView from './ForecastView';
import CollapsibleSection from './CollapsibleSection';
import LocationPinIcon from './icons/LocationPinIcon';

const CROP_DATA = {
  "Vegetables": ["Tomato", "Potato", "Pepper", "Cucumber", "Squash", "Corn (Maize)", "Soybean", "Bell Pepper"],
  "Fruits": ["Apple", "Grape", "Strawberry", "Peach", "Cherry", "Citrus (Orange, Lemon)", "Blueberry"],
  "Grains": ["Wheat", "Rice", "Barley"],
  "Ornamental Plants": ["Rose", "Lilac"],
};

const ForecastGenerator: React.FC = () => {
    const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
    const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [locationError, setLocationError] = useState<string | null>(null);
    const [cropStage, setCropStage] = useState<string>('Vegetative');
    const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [forecastReport, setForecastReport] = useState<string | null>(null);

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            setLocationStatus('error');
            setLocationError("Geolocation is not supported by your browser.");
            return;
        }

        setLocationStatus('loading');
        setLocationError(null);
        setLocation(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                });
                setLocationStatus('success');
            },
            (geoError) => {
                let message = 'Could not retrieve your location.';
                if (geoError.code === geoError.PERMISSION_DENIED) {
                    message = 'Location access was denied. Please enable it in your browser settings to continue.';
                } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
                    message = 'Location information is unavailable.';
                } else if (geoError.code === geoError.TIMEOUT) {
                    message = 'The request to get your location timed out.';
                }
                setLocationStatus('error');
                setLocationError(message);
            }
        );
    };


    const handleCropChange = (crop: string) => {
        setSelectedCrops(prev => 
            prev.includes(crop) ? prev.filter(c => c !== crop) : [...prev, crop]
        );
    };

    const handleGenerate = async () => {
        if (!location || selectedCrops.length === 0) {
            setError('Please provide a precise location and select at least one crop.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setForecastReport(null);
        try {
            const locationString = `${location.lat},${location.lon}`;
            const report = await generateDiseaseForecast(locationString, cropStage, selectedCrops);
            setForecastReport(report);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    if (isLoading) {
      return (
          <div className="w-full max-w-4xl p-8 bg-white rounded-xl shadow-lg flex items-center justify-center min-h-[400px]">
              <Spinner />
          </div>
      );
    }

    if (error) {
        return (
            <div className="w-full max-w-4xl p-8 bg-white rounded-xl shadow-lg">
                 <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg text-center w-full mb-4">
                    <h3 className="font-bold text-lg mb-2">Forecast Failed</h3>
                    <p>{error}</p>
                </div>
                <button 
                    onClick={() => { setError(null); setIsLoading(false); }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors"
                >
                    Try Again
                </button>
            </div>
        )
    }

    if (forecastReport) {
        return <ForecastView reportMarkdown={forecastReport} onBack={() => setForecastReport(null)} />;
    }

    return (
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-4xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Disease Risk Forecast</h2>
            <p className="text-gray-600 mb-6">Use your precise location to generate a 30-day proactive forecast.</p>
            
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                         {locationStatus === 'success' && location ? (
                            <div className="p-2.5 border border-green-300 bg-green-50 rounded-lg text-green-800 text-sm flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                    Precise location captured
                                </span>
                                <button onClick={handleGetLocation} className="text-blue-600 hover:underline text-xs font-semibold">Refresh</button>
                            </div>
                        ) : (
                            <button
                                onClick={handleGetLocation}
                                disabled={locationStatus === 'loading'}
                                className="w-full flex items-center justify-center gap-2 p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-wait transition-colors"
                            >
                                <LocationPinIcon className="w-5 h-5" />
                                {locationStatus === 'loading' ? 'Getting Location...' : 'Use My Current Location'}
                            </button>
                        )}
                        {locationStatus === 'error' && locationError && (
                            <p className="text-red-600 text-sm mt-1">{locationError}</p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="crop-stage" className="block text-sm font-medium text-gray-700 mb-1">Crop Stage</label>
                        <select
                            id="crop-stage"
                            value={cropStage}
                            onChange={(e) => setCropStage(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                            <option>Seedling</option>
                            <option>Vegetative</option>
                            <option>Flowering</option>
                            <option>Fruiting</option>
                            <option>Harvest</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Crops for Analysis</label>
                    <div className="space-y-3">
                    {Object.entries(CROP_DATA).map(([category, crops]) => (
                        <CollapsibleSection key={category} title={category}>
                             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2">
                                {crops.map(crop => (
                                    <label key={crop} className="flex items-center space-x-2 text-sm text-gray-600">
                                        <input
                                            type="checkbox"
                                            checked={selectedCrops.includes(crop)}
                                            onChange={() => handleCropChange(crop)}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span>{crop}</span>
                                    </label>
                                ))}
                            </div>
                        </CollapsibleSection>
                    ))}
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !location || selectedCrops.length === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors text-base"
                >
                    {isLoading ? 'Generating Forecast...' : '📈 Generate Forecast'}
                </button>
            </div>
        </div>
    );
};

export default ForecastGenerator;