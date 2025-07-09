export interface User {
  telegram: string;
  totalScore: number;
  playedBooths: Record<string, boolean>;
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
}

export interface BoothConfig {
  id: string;
  name: string;
  description: string;
  maxScore: number;
  minScore: number;
}