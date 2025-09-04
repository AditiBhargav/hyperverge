'use client';
import { useState, useEffect } from 'react';

interface ImageViewerProps {
  imageData: string;
  docType: string;
  isOpen: boolean;
  onCloseAction: () => void;
}

export default function ImageViewer({ imageData, docType, isOpen, onCloseAction }: ImageViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Handle ESC key press
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseAction();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onCloseAction]);

  if (!isOpen) return null;

  const handleImageLoad = () => {
    setIsLoading(false);
    setError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setError(true);
  };

  const downloadImage = () => {
    try {
      const link = document.createElement('a');
      link.href = imageData;
      link.download = `${docType}_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download image:', err);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCloseAction();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg max-w-4xl max-h-full w-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {docType.replace('_', ' ')} Document
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={downloadImage}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Download
            </button>
            <button
              onClick={onCloseAction}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Image Content */}
        <div className="flex-1 p-4 flex items-center justify-center min-h-0">
          {isLoading && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading image...</p>
            </div>
          )}
          
          {error && (
            <div className="text-center text-gray-500">
              <span className="text-4xl">🖼️</span>
              <p className="mt-2">Failed to load image</p>
              <p className="text-sm">The image data might be corrupted or invalid.</p>
            </div>
          )}

          {imageData && !error && (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Using img is acceptable here for base64 data display */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageData}
                alt={`${docType} document`}
                className="max-w-full max-h-full object-contain rounded"
                onLoad={handleImageLoad}
                onError={handleImageError}
                style={{ display: isLoading ? 'none' : 'block' }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Click outside or press ESC to close</span>
            <span>Document Type: {docType.replace('_', ' ')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
