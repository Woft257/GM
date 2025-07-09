import QRCode from 'qrcode';
import { createQRToken } from './database';

export const generateQRCodeData = async (
  boothId: string,
  points: number
): Promise<{ qrCodeDataURL: string; tokenId: string; qrData: string; simpleCode: string }> => {
  try {
    // Create token in database
    const { tokenId, simpleCode } = await createQRToken(boothId, points);

    // Create embedded data for QR code (JSON format)
    const qrData = JSON.stringify({
      type: 'GM_VIETNAM_SCORE',
      tokenId,
      boothId,
      points,
      timestamp: Date.now(),
      simpleCode // Include simple code in QR data
    });

    // Generate QR code with embedded data
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });

    return {
      qrCodeDataURL,
      tokenId,
      qrData,
      simpleCode
    };
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

// Function to parse QR data
export const parseQRData = (qrText: string): {
  type: string;
  tokenId: string;
  boothId: string;
  points: number;
  timestamp: number;
} | null => {
  try {
    const data = JSON.parse(qrText);

    // Validate QR data structure
    if (
      data.type === 'GM_VIETNAM_SCORE' &&
      data.tokenId &&
      data.boothId &&
      typeof data.points === 'number' &&
      data.timestamp
    ) {
      return data;
    }

    return null;
  } catch (error) {
    console.error('Error parsing QR data:', error);
    return null;
  }
};

// Function to validate QR data
export const validateQRData = (qrData: any): boolean => {
  if (!qrData) return false;

  // Check if QR is not too old (15 minutes)
  const now = Date.now();
  const qrAge = now - qrData.timestamp;
  const maxAge = 15 * 60 * 1000; // 15 minutes in milliseconds

  if (qrAge > maxAge) {
    return false;
  }

  // Check if booth exists
  if (!(qrData.boothId in BOOTH_CONFIGS)) {
    return false;
  }

  // Check if points are within valid range
  const booth = BOOTH_CONFIGS[qrData.boothId as BoothId];
  if (qrData.points < booth.minScore || qrData.points > booth.maxScore) {
    return false;
  }

  return true;
};

// Booth configurations
export const BOOTH_CONFIGS = {
  booth1: {
    id: 'booth1',
    name: 'Coding Challenge',
    description: 'Giải thuật và lập trình',
    maxScore: 50,
    minScore: 10
  },
  booth2: {
    id: 'booth2',
    name: 'Gaming Arena',
    description: 'Thi đấu game mobile',
    maxScore: 40,
    minScore: 10
  },
  booth3: {
    id: 'booth3',
    name: 'Tech Quiz',
    description: 'Kiến thức công nghệ',
    maxScore: 30,
    minScore: 5
  },
  booth4: {
    id: 'booth4',
    name: 'Design Battle',
    description: 'Thiết kế sáng tạo',
    maxScore: 45,
    minScore: 10
  },
  booth5: {
    id: 'booth5',
    name: 'Startup Pitch',
    description: 'Thuyết trình ý tưởng',
    maxScore: 35,
    minScore: 10
  }
} as const;

export type BoothId = keyof typeof BOOTH_CONFIGS;
