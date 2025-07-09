import QRCode from 'qrcode';
import { createQRToken } from './database';

export const generateQRCodeURL = async (
  boothId: string, 
  points: number
): Promise<{ qrCodeDataURL: string; tokenId: string; url: string }> => {
  try {
    // Create token in database
    const tokenId = await createQRToken(boothId, points);
    
    // Create URL for QR code
    const baseURL = import.meta.env.VITE_APP_URL ||
                   (import.meta.env.DEV ? 'http://localhost:5173' : 'https://gm-three-lac.vercel.app');
    const url = `${baseURL}/score/${tokenId}`;
    
    // Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return {
      qrCodeDataURL,
      tokenId,
      url
    };
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

export const generateQRCodeSVG = async (
  boothId: string, 
  points: number
): Promise<{ qrCodeSVG: string; tokenId: string; url: string }> => {
  try {
    const tokenId = await createQRToken(boothId, points);
    const baseURL = import.meta.env.VITE_APP_URL ||
                   (import.meta.env.DEV ? 'http://localhost:5173' : 'https://gm-three-lac.vercel.app');
    const url = `${baseURL}/score/${tokenId}`;
    
    const qrCodeSVG = await QRCode.toString(url, {
      type: 'svg',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return {
      qrCodeSVG,
      tokenId,
      url
    };
  } catch (error) {
    console.error('Error generating QR code SVG:', error);
    throw error;
  }
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
