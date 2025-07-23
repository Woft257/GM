import { Booth } from '../types';

export const booths: Booth[] = [
  {
    id: 'booth1',
    name: 'Booth 1',
    maxScore: 100,
    description: 'Minigame 1 & 2'
  },
  {
    id: 'booth2',
    name: 'Booth 2',
    maxScore: 100,
    description: 'Minigame 3 & 4'
  },
  {
    id: 'booth3',
    name: 'Booth 3',
    maxScore: 100,
    description: 'Minigame 5 & 6'
  }
];

// Minigames for each booth
export const minigames = {
  booth1: [
    { id: 'minigame1', name: 'Minigame 1', maxScore: 50 },
    { id: 'minigame2', name: 'Minigame 2', maxScore: 50 }
  ],
  booth2: [
    { id: 'minigame3', name: 'Minigame 3', maxScore: 50 },
    { id: 'minigame4', name: 'Minigame 4', maxScore: 50 }
  ],
  booth3: [
    { id: 'minigame5', name: 'Minigame 5', maxScore: 50 },
    { id: 'minigame6', name: 'Minigame 6', maxScore: 50 }
  ]
};

export const getBoothById = (id: string): Booth | undefined => {
  return booths.find(booth => booth.id === id);
};

export const getBoothName = (id: string): string => {
  const booth = getBoothById(id);
  return booth ? booth.name : id;
};
