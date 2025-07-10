import { Booth } from '../types';

export const booths: Booth[] = [
  {
    id: 'booth1',
    name: 'Coding Challenge',
    maxScore: 50,
    description: 'Giải thuật và lập trình'
  },
  {
    id: 'booth2',
    name: 'Gaming Arena',
    maxScore: 40,
    description: 'Thi đấu game mobile'
  },
  {
    id: 'booth3',
    name: 'Tech Quiz',
    maxScore: 30,
    description: 'Kiến thức công nghệ'
  },
  {
    id: 'booth4',
    name: 'Design Battle',
    maxScore: 45,
    description: 'Thiết kế sáng tạo'
  },
  {
    id: 'booth5',
    name: 'Startup Pitch',
    maxScore: 35,
    description: 'Thuyết trình ý tưởng'
  }
];

export const getBoothById = (id: string): Booth | undefined => {
  return booths.find(booth => booth.id === id);
};

export const getBoothName = (id: string): string => {
  const booth = getBoothById(id);
  return booth ? booth.name : id;
};
