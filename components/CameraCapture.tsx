
import React, { useEffect, useRef, useState } from 'react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        activeStream = stream;
        setStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Could not access the rear camera. Trying the front camera.");
        // Try again with user-facing camera if environment fails
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            activeStream = stream;
            setStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setError(null); // Clear previous error
        } catch (finalErr) {
             console.error("Error accessing any camera:", finalErr);
             setError("Could not access camera. Please ensure you have granted permission and are not using it in another application.");
        }
      }
    };

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
            onCapture(file);
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Capture Image</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none" aria-label="Close camera view">&times;</button>
        </div>
        <div className="p-4">
            {error ? (
                <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg text-center">
                    <p>{error}</p>
                </div>
            ) : (
                <div className="relative">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-auto rounded-md bg-gray-900 aspect-video"></video>
                    {!stream && <div className="absolute inset-0 flex items-center justify-center text-white"><p>Starting camera...</p></div>}
                </div>
            )}
            <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
        <div className="p-4 bg-gray-50 rounded-b-lg flex justify-end gap-4">
            <button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors">
                Cancel
            </button>
            <button onClick={handleCapture} disabled={!stream || !!error} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                Capture
            </button>
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;
