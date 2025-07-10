import { useState, useEffect } from 'react';
import { createUser } from '../lib/database';

export const useAuth = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('telegram_username');
    if (stored) {
      setUsername(stored);
    }
    setIsLoading(false);
  }, []);

  const login = async (telegramUsername: string) => {
    const cleanUsername = telegramUsername.startsWith('@') ? telegramUsername : `@${telegramUsername}`;

    try {
      // Create user in Firebase if doesn't exist
      await createUser(cleanUsername);

      // Save to localStorage
      localStorage.setItem('telegram_username', cleanUsername);
      setUsername(cleanUsername);
    } catch (error: any) {
      console.error('Error creating user:', error);

      // If game ended, don't allow login
      if (error.message?.includes('Sự kiện đã kết thúc')) {
        throw error; // Re-throw to be handled by UI
      }

      // For other errors, fallback to localStorage only
      localStorage.setItem('telegram_username', cleanUsername);
      setUsername(cleanUsername);
    }
  };

  const logout = () => {
    localStorage.removeItem('telegram_username');
    setUsername(null);
  };

  return { username, login, logout, isLoading };
};