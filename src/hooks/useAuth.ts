import { useState, useEffect } from 'react';

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

  const login = (telegramUsername: string) => {
    const cleanUsername = telegramUsername.startsWith('@') ? telegramUsername : `@${telegramUsername}`;
    localStorage.setItem('telegram_username', cleanUsername);
    setUsername(cleanUsername);
  };

  const logout = () => {
    localStorage.removeItem('telegram_username');
    setUsername(null);
  };

  return { username, login, logout, isLoading };
};