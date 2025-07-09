import { useState, useEffect } from 'react';
import { User } from '../types';
import { getLeaderboard, subscribeToLeaderboard, getUser, createUser } from '../lib/database';

// Mock data cho demo (fallback)
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
    let unsubscribe: (() => void) | null = null;

    const loadUsers = async () => {
      try {
        // Try real-time subscription first
        unsubscribe = subscribeToLeaderboard((firebaseUsers) => {
          setUsers(firebaseUsers);
          setLoading(false);
        });
      } catch (error) {
        console.error('Error loading users from Firebase:', error);
        // Fallback to mock data
        setTimeout(() => {
          setUsers(mockUsers.sort((a, b) => b.totalScore - a.totalScore));
          setLoading(false);
        }, 1000);
      }
    };

    loadUsers();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
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

    const loadUser = async () => {
      try {
        // Try to get user from Firebase
        let firebaseUser = await getUser(telegram);

        if (!firebaseUser) {
          // Create new user if doesn't exist
          firebaseUser = await createUser(telegram);
        }

        setUser(firebaseUser);
      } catch (error) {
        console.error('Error loading user from Firebase:', error);

        // Fallback to mock data or create local user
        const existingUser = mockUsers.find(u => u.telegram === telegram);

        if (existingUser) {
          setUser(existingUser);
        } else {
          const newUser: User = {
            telegram,
            totalScore: 0,
            playedBooths: {},
            createdAt: new Date()
          };
          setUser(newUser);
          mockUsers.push(newUser);
        }
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [telegram]);

  return { user, loading };
};