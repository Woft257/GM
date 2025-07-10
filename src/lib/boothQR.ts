import QRCode from 'qrcode';
import { BoothQR } from '../types';

// Generate static QR code for each booth
export const generateBoothQR = async (boothId: string): Promise<BoothQR> => {
  // Create static QR data for booth (no timestamp for printing)
  const qrData = JSON.stringify({
    type: 'GM_VIETNAM_BOOTH',
    boothId,
    version: '2.0'
  });

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
    qrData,
    qrCodeDataURL,
    createdAt: new Date()
  };
};

// Parse booth QR data
export const parseBoothQRData = (qrText: string): { boothId: string } | null => {
  try {
    const data = JSON.parse(qrText);
    
    if (data.type === 'GM_VIETNAM_BOOTH' && data.boothId) {
      return {
        boothId: data.boothId
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing booth QR data:', error);
    return null;
  }
};

// Validate booth QR data
export const validateBoothQRData = (data: { boothId: string }): boolean => {
  // Check if booth ID is valid
  const validBooths = ['booth1', 'booth2', 'booth3', 'booth4', 'booth5'];
  return validBooths.includes(data.boothId);
};
