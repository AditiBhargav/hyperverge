import { DocType, CompressionSettings } from '../types';

// Optimal compression settings for different document types
export const getOptimalSettings = (docType: DocType): CompressionSettings => {
  switch (docType) {
    case 'AADHAAR_FRONT':
    case 'AADHAAR_BACK':
    case 'PAN':
      return {
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 800,
        format: 'jpeg'
      };
    case 'SELFIE':
      return {
        quality: 0.85,
        maxWidth: 800,
        maxHeight: 600,
        format: 'jpeg'
      };
    default:
      return {
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 800,
        format: 'jpeg'
      };
  }
};

// Canvas-based image compression
export const compressImage = async (
  imageDataUrl: string, 
  settings: CompressionSettings
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;
      const maxWidth = settings.maxWidth;
      const maxHeight = settings.maxHeight;

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      const compressedDataUrl = canvas.toDataURL(
        `image/${settings.format}`, 
        settings.quality
      );
      
      resolve(compressedDataUrl);
    };
    
    img.onerror = () => reject(new Error('Image loading failed'));
    img.src = imageDataUrl;
  });
};

// Calculate compression ratio
export const getCompressionRatio = (originalSize: number, compressedSize: number): number => {
  return Math.round(((originalSize - compressedSize) / originalSize) * 100);
};

// Convert data URL to blob
export const dataURLToBlob = (dataURL: string): Blob => {
  const parts = dataURL.split(',');
  const contentType = parts[0].match(/:(.*?);/)![1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
};

// Get file size from data URL
export const getDataURLSize = (dataURL: string): number => {
  const head = 'data:image/jpeg;base64,';
  return Math.round((dataURL.length - head.length) * 3 / 4);
};
