import { useState, useEffect } from 'react';
import { User } from '../types';
import { subscribeToAllUsers, getUser, createUser, subscribeToUser } from '../lib/database';


export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const loadUsers = async () => {
      try {
        // Use ALL users subscription (no limit)
        unsubscribe = subscribeToAllUsers((firebaseUsers) => {
          setUsers(firebaseUsers);
          setLoading(false);
        });
      } catch (error) {
        console.error('Error loading users from Firebase:', error);
        // Do NOT fallback to mock data. Keep users empty and set loading to false.
        setUsers([]);
        setLoading(false);
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

    let unsubscribe: (() => void) | null = null;

    const loadUser = async () => {
      try {
        // Try to get user from Firebase first
        let firebaseUser = await getUser(telegram);

        if (!firebaseUser) {
          // Create new user if doesn't exist
          firebaseUser = await createUser(telegram);
        }

        setUser(firebaseUser);
        setLoading(false);

        // Set up real-time subscription
        unsubscribe = subscribeToUser(telegram, (updatedUser) => {
          if (updatedUser) {
            setUser(updatedUser);
          }
        });

      } catch (error) {
        console.error('Error loading or creating user from Firebase:', error);
        // If user creation/loading fails, do NOT set a local user or mock data.
        // Re-throw the error to be handled by the calling component or higher level.
        setLoading(false); // Ensure loading state is false
        throw error;
      }
    };

    loadUser();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [telegram]);

  return { user, loading };
};
