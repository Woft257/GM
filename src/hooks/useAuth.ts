import { useState, useEffect } from 'react';
import { createUser } from '../lib/database';
import { checkAndClearLocalStorage } from '../lib/gameControl';

export const useAuth = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [mexcUID, setMexcUID] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      // Check if local storage needs to be cleared due to game reset
      const wasCleared = await checkAndClearLocalStorage();

      if (wasCleared) {
        // If storage was cleared, user needs to login again
        setUsername(null);
        setMexcUID(null);
        setIsLoading(false);
        return;
      }

      // Check for existing stored username and MEXC UID
      const storedUsername = localStorage.getItem('telegram_username');
      const storedMexcUID = localStorage.getItem('mexc_uid');

      if (storedUsername) {
        setUsername(storedUsername);
      }
      if (storedMexcUID) {
        setMexcUID(storedMexcUID);
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (telegramUsername: string, userMexcUID: string) => {
    const cleanUsername = telegramUsername.startsWith('@') ? telegramUsername : `@${telegramUsername}`;

    try {
      // Create user in Firebase if doesn't exist, and update MEXC UID
      await createUser(cleanUsername, userMexcUID);

      // Save to localStorage with timestamp
      localStorage.setItem('telegram_username', cleanUsername);
      localStorage.setItem('mexc_uid', userMexcUID);
      localStorage.setItem('user_login_timestamp', Date.now().toString());
      setUsername(cleanUsername);
      setMexcUID(userMexcUID);
    } catch (error: unknown) {
      console.error('Error creating user:', error);

      // If game ended, don't allow login
      if (error instanceof Error && error.message?.includes('Sự kiện đã kết thúc')) {
        throw error; // Re-throw to be handled by UI
      }

      // For other errors, fallback to localStorage only
      localStorage.setItem('telegram_username', cleanUsername);
      localStorage.setItem('mexc_uid', userMexcUID);
      localStorage.setItem('user_login_timestamp', Date.now().toString());
      setUsername(cleanUsername);
      setMexcUID(userMexcUID);
    }
  };

  const logout = () => {
    localStorage.removeItem('telegram_username');
    localStorage.removeItem('mexc_uid');
    localStorage.removeItem('user_login_timestamp');
    setUsername(null);
    setMexcUID(null);
  };

  return { username, mexcUID, login, logout, isLoading };
};
