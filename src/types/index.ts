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