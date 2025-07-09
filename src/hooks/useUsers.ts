import { useState, useEffect } from 'react';
import { User } from '../types';

// Mock data cho demo
const mockUsers: User[] = [
  {
    telegram: '@alice_dev',
    totalScore: 185,
    playedBooths: { booth1: true, booth2: true, booth3: true, booth4: true },
    createdAt: new Date('2025-01-01T10:00:00')
  },
  {
    telegram: '@bob_coder',
    totalScore: 165,
    playedBooths: { booth1: true, booth2: true, booth3: true },
    createdAt: new Date('2025-01-01T10:30:00')
  },
  {
    telegram: '@charlie_tech',
    totalScore: 140,
    playedBooths: { booth1: true, booth2: true },
    createdAt: new Date('2025-01-01T11:00:00')
  },
  {
    telegram: '@diana_design',
    totalScore: 120,
    playedBooths: { booth4: true, booth5: true },
    createdAt: new Date('2025-01-01T11:30:00')
  },
  {
    telegram: '@eve_startup',
    totalScore: 95,
    playedBooths: { booth5: true },
    createdAt: new Date('2025-01-01T12:00:00')
  }
];

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setUsers(mockUsers.sort((a, b) => b.totalScore - a.totalScore));
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return { users, loading };
};

export const useUser = (telegram: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!telegram) {
      setLoading(false);
      return;
    }

    // Simulate loading
    const timer = setTimeout(() => {
      // Check if user exists in mock data
      const existingUser = mockUsers.find(u => u.telegram === telegram);
      
      if (existingUser) {
        setUser(existingUser);
      } else {
        // Create new user
        const newUser: User = {
          telegram,
          totalScore: 0,
          playedBooths: {},
          createdAt: new Date()
        };
        setUser(newUser);
        // In real app, this would save to database
        mockUsers.push(newUser);
      }
      
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [telegram]);

  return { user, loading };
};