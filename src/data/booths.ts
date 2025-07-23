import { Booth } from '../types';

// Individual minigames for homepage display
export const booths: Booth[] = [
  {
    id: 'minigame1',
    name: 'Treasure Hunt',
    maxScore: 50,
    description: 'Săn tìm kho báu'
  },
  {
    id: 'minigame2',
    name: 'Bắt sóng token',
    maxScore: 999999, // Không có điểm tối đa
    description: 'Thu thập token'
  },
  {
    id: 'minigame3',
    name: 'Vượt chướng ngại phí',
    maxScore: 100,
    description: 'Vượt qua thử thách'
  },
  {
    id: 'minigame4',
    name: 'Săn thưởng đa chuỗi',
    maxScore: 70,
    description: 'Khám phá đa chuỗi'
  },
  {
    id: 'minigame5',
    name: 'Rổ vàng ẩn số',
    maxScore: 100,
    description: 'Tìm kiếm kho báu ẩn'
  },
  {
    id: 'minigame6',
    name: 'Vùng an toàn',
    maxScore: 30,
    description: 'Bảo vệ tài sản'
  }
];

// Physical booths for QR scanning and admin management
export const physicalBooths = [
  {
    id: 'booth1',
    name: 'Booth 1',
    description: 'Quản lý Minigame 1 & 2',
    minigames: ['minigame1', 'minigame2']
  },
  {
    id: 'booth2',
    name: 'Booth 2',
    description: 'Quản lý Minigame 3 & 4',
    minigames: ['minigame3', 'minigame4']
  },
  {
    id: 'booth3',
    name: 'Booth 3',
    description: 'Quản lý Minigame 5 & 6',
    minigames: ['minigame5', 'minigame6']
  }
];

// Helper function to get minigames for a booth
export const getMinigamesForBooth = (boothId: string) => {
  const booth = physicalBooths.find(b => b.id === boothId);
  if (!booth) return [];

  return booth.minigames.map(minigameId => {
    const minigame = booths.find(b => b.id === minigameId);
    return minigame ? { id: minigame.id, name: minigame.name, maxScore: minigame.maxScore } : null;
  }).filter(Boolean);
};

export const getBoothById = (id: string): Booth | undefined => {
  return booths.find(booth => booth.id === id);
};

export const getBoothName = (id: string): string => {
  const booth = getBoothById(id);
  return booth ? booth.name : id;
};
