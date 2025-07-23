export interface User {
  telegram: string;
  totalScore: number;
  playedBooths: Record<string, boolean>;
  scores?: Record<string, number>; // New field for booth scores
  rewards?: Record<string, boolean>; // Track claimed rewards
  createdAt: Date;
}

export interface Booth {
  id: string;
  name: string;
  maxScore: number;
  description: string;
}

export interface QRToken {
  id: string;
  boothId: string;
  points: number;
  used: boolean;
  createdAt: Date;
  usedAt?: Date;
  usedBy?: string;
  expiresAt: Date; // Hết hạn sau 15 phút
  simpleCode: string; // 6 số để nhập thủ công
}

export interface BoothConfig {
  id: string;
  name: string;
  description: string;
  maxScore: number;
  minScore: number;
}

export interface PendingScore {
  id: string;
  boothId: string;
  username: string;
  timestamp: number;
  status: 'waiting' | 'completed' | 'cancelled';
  points?: number; // Điểm được gán bởi admin
  createdAt: Date;
  completedAt?: Date;
  completedBy?: string; // Admin telegram
}

export interface BoothQR {
  boothId: string;
  qrData: string; // QR code data cố định
  qrCodeDataURL: string; // Base64 image của QR code
  createdAt: Date;
}