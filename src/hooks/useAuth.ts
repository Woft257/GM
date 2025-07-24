import { useState, useEffect } from 'react';
import { createUser } from '../lib/database';
import { checkAndClearLocalStorage } from '../lib/gameControl';

export const useAuth = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      // Check if local storage needs to be cleared due to game reset
      const wasCleared = await checkAndClearLocalStorage();

      if (wasCleared) {
        // If storage was cleared, user needs to login again
        setUsername(null);
        setIsLoading(false);
        return;
      }

      // Check for existing stored username
      const stored = localStorage.getItem('telegram_username');
      if (stored) {
        setUsername(stored);
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (telegramUsername: string) => {
    const cleanUsername = telegramUsername.startsWith('@') ? telegramUsername : `@${telegramUsername}`;

    try {
      // Create user in Firebase if doesn't exist
      await createUser(cleanUsername);

      // Save to localStorage with timestamp
      localStorage.setItem('telegram_username', cleanUsername);
      localStorage.setItem('user_login_timestamp', Date.now().toString());
      setUsername(cleanUsername);
    } catch (error: any) {
      console.error('Error creating user:', error);

      // If game ended, don't allow login
      if (error.message?.includes('Sự kiện đã kết thúc')) {
        throw error; // Re-throw to be handled by UI
      }

      // For other errors, fallback to localStorage only
      localStorage.setItem('telegram_username', cleanUsername);
      localStorage.setItem('user_login_timestamp', Date.now().toString());
      setUsername(cleanUsername);
    }
  };

  const logout = () => {
    localStorage.removeItem('telegram_username');
    localStorage.removeItem('user_login_timestamp');
    setUsername(null);
  };

  return { username, login, logout, isLoading };
};