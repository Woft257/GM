 import QRCode from 'qrcode';
import { BoothQR } from '../types';
// Removed physicalBooths import as validation is no longer needed here

// Generate static QR code for each booth as a direct URL
export const generateBoothQR = async (boothId: string): Promise<BoothQR> => {
  // Get the base URL from environment variables
  const baseUrl = import.meta.env.VITE_APP_URL || 'http://localhost:5173'; // Fallback for development

  // The QR data will now be the full URL
  const qrData = `${baseUrl}/booth/${boothId}`;

  // Generate QR code image
  const qrCodeDataURL = await QRCode.toDataURL(qrData, {
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'M'
  });

  return {
    boothId,
    qrData, // This will now be the URL string
    qrCodeDataURL,
    createdAt: new Date()
  };
};

// parseBoothQRData and validateBoothQRData are no longer needed for the new QR format
// They will be removed.
