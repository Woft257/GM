import { Booth } from '../types';

// Individual minigames for homepage display
export const booths: Booth[] = [
  {
    id: 'minigame1',
    name: 'Minigame 1',
    maxScore: 50,
    description: 'Thử thách đầu tiên'
  },
  {
    id: 'minigame2',
    name: 'Minigame 2',
    maxScore: 50,
    description: 'Thử thách thứ hai'
  },
  {
    id: 'minigame3',
    name: 'Minigame 3',
    maxScore: 50,
    description: 'Thử thách thứ ba'
  },
  {
    id: 'minigame4',
    name: 'Minigame 4',
    maxScore: 50,
    description: 'Thử thách thứ tư'
  },
  {
    id: 'minigame5',
    name: 'Minigame 5',
    maxScore: 50,
    description: 'Thử thách thứ năm'
  },
  {
    id: 'minigame6',
    name: 'Minigame 6',
    maxScore: 50,
    description: 'Thử thách thứ sáu'
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
