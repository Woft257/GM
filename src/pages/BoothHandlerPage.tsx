import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { createPendingScore, getUser } from '../lib/database';
import MexcBackground from '../components/MexcBackground';
import LoginForm from '../components/LoginForm'; // Import LoginForm
import { getMinigamesForBooth } from '../data/booths';

const BoothHandlerPage: React.FC = () => {
  const { boothId } = useParams<{ boothId: string }>();
  const navigate = useNavigate();
  const { username, isLoading, mexcUID, login } = useAuth(); // Destructure login
  const [message, setMessage] = useState('Đang xử lý...');
  const [error, setError] = useState<string | null>(null);
  const [showLoginForm, setShowLoginForm] = useState(false); // State to control login form visibility
  const [loginError, setLoginError] = useState<string>(''); // State for login errors

  const processBoothScan = async (userTelegram: string) => {
    if (!boothId) {
      setError('Không tìm thấy ID booth.');
      setTimeout(() => navigate('/', { replace: true }), 3000);
      return;
    }

    try {
      const currentUser = await getUser(userTelegram);
      if (!currentUser) {
        throw new Error('Không tìm thấy thông tin người dùng.');
      }

      const boothMinigames = getMinigamesForBooth(boothId);
      const userScores = currentUser.scores || {};

      const completedMinigames = boothMinigames.filter(minigame =>
        minigame && userScores[minigame.id] !== undefined && userScores[minigame.id] > 0
      );

      if (completedMinigames.length === boothMinigames.length && boothMinigames.length > 0) {
        setMessage(`Bạn đã hoàn thành tất cả minigame của booth ${boothId}. Không thể quét lại!`);
        setError('Đã hoàn thành booth này.');
        setTimeout(() => navigate('/', { replace: true }), 3000);
        return;
      }

      setMessage(`Đang ghi nhận lượt quét booth ${boothId}...`);
      await createPendingScore(boothId, userTelegram);
      setMessage(`Đã ghi nhận lượt quét booth ${boothId}! Vui lòng chờ admin phân bổ điểm.`);
      setTimeout(() => navigate('/', { replace: true }), 3000);
    } catch (err: unknown) {
      console.error('Error processing booth access:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Đã xảy ra lỗi khi ghi nhận lượt quét.');
      }
      setTimeout(() => navigate('/', { replace: true }), 4000);
    }
  };

  useEffect(() => {
    if (isLoading) {
      return; // Wait for auth status to load
    }

    if (!username || !mexcUID) {
      // Not logged in, show login form
      setShowLoginForm(true);
    } else {
      // Logged in, proceed with booth scan processing
      setShowLoginForm(false);
      processBoothScan(username);
    }
  }, [boothId, username, isLoading, mexcUID, navigate]);

  const handleLogin = async (telegramUsername: string, mexcUIDInput: string) => {
    setLoginError('');
    try {
      await login(telegramUsername, mexcUIDInput);
      // If login is successful, useEffect will re-run and process the booth scan
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

  if (showLoginForm) {
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
  }

  return (
    <MexcBackground>
      <div className="flex items-center justify-center min-h-screen p-4 text-white text-center">
        <div className="bg-gray-900/70 backdrop-blur-sm rounded-xl p-8 shadow-2xl border border-gray-700/50">
          {error ? (
            <>
              <h2 className="text-2xl font-bold text-red-400 mb-4">Lỗi!</h2>
              <p className="text-lg">{error}</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-white mb-4">Thông báo</h2>
              <p className="text-lg">{message}</p>
            </>
          )}
          <p className="mt-4 text-sm text-gray-400">Bạn sẽ được chuyển hướng về trang chủ trong giây lát.</p>
        </div>
      </div>
    </MexcBackground>
  );
};

export default BoothHandlerPage;
