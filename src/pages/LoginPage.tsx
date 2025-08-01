import React, { useState, useEffect } from 'react';
import LoginForm from '../components/LoginForm';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import MexcBackground from '../components/MexcBackground';

const LoginPage: React.FC = () => {
  const { username, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loginError, setLoginError] = useState<string>('');

  useEffect(() => {
    if (!isLoading && username) {
      const from = location.state?.from || '/';
      navigate(from, { replace: true });
    }
  }, [username, isLoading, navigate, location.state]);

  const handleLogin = async (telegramUsername: string, mexcUID: string) => {
    setLoginError('');
    try {
      await login(telegramUsername, mexcUID);
    } catch (error: unknown) {
      console.error('Login failed:', error);
      if (error instanceof Error) {
        setLoginError(error.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
      } else {
        setLoginError('Đăng nhập thất bại. Vui lòng thử lại.');
      }
    }
  };

  if (isLoading) {
    return (
      <MexcBackground>
        <div className="flex items-center justify-center min-h-screen text-white">
          Loading authentication...
        </div>
      </MexcBackground>
    );
  }

  return (
    <MexcBackground>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="px-4 py-8">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-white text-xl font-bold">🎯</span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Tham gia MEXC Minigame
              </h1>
              <p className="text-gray-400 text-sm mb-2">
                Nhập Username Telegram và MEXC UID để tham gia vào minigame.
              </p>
              <p className="text-gray-400 text-sm mb-6">
                Quét QR code tại các booth để nhận điểm và tham gia bảng xếp hạng.
              </p>
            </div>

            <div className="w-full">
              <LoginForm onLogin={handleLogin} />
              {loginError && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-300 text-sm text-center">{loginError}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MexcBackground>
  );
};

export default LoginPage;
