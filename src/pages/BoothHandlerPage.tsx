import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { createPendingScore, getUser } from '../lib/database'; // Import getUser
import MexcBackground from '../components/MexcBackground';
import { getMinigamesForBooth } from '../data/booths'; // Import getMinigamesForBooth
// Removed getBoothTotalPoints as points are allocated by admin

const BoothHandlerPage: React.FC = () => {
  const { boothId } = useParams<{ boothId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { username, isLoading, mexcUID } = useAuth();
  const [message, setMessage] = useState('Đang xử lý...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleBoothAccess = async () => {
      if (!boothId) {
        setError('Không tìm thấy ID booth.');
        navigate('/', { replace: true });
        return;
      }

      if (isLoading) {
        // Still loading auth status, wait for it
        return;
      }

      if (!username || !mexcUID) {
        // Not logged in, redirect to login page, passing current boothId
        console.log('Not logged in, redirecting to login page...');
        navigate('/login', { state: { from: location.pathname }, replace: true });
        return;
      }

      // User is logged in, check if booth is already completed or create pending score
      try {
        // Fetch user's current data to check completed booths/minigames
        const currentUser = await getUser(username);
        if (!currentUser) {
          throw new Error('Không tìm thấy thông tin người dùng.');
        }

        const boothMinigames = getMinigamesForBooth(boothId);
        const userScores = currentUser.scores || {};

        const completedMinigames = boothMinigames.filter(minigame =>
          minigame && userScores[minigame.id] !== undefined && userScores[minigame.id] > 0
        );

        if (completedMinigames.length === boothMinigames.length && boothMinigames.length > 0) {
          // All minigames for this booth are already completed
          setMessage(`Bạn đã hoàn thành tất cả minigame của booth ${boothId}. Không thể quét lại!`);
          setError('Đã hoàn thành booth này.'); // Set error to show red message
          setTimeout(() => {
            navigate('/', { replace: true }); // Redirect to homepage
          }, 3000);
          return;
        }

        // If not all minigames are completed, proceed to create a pending score
        setMessage(`Đang ghi nhận lượt quét booth ${boothId}...`);
        await createPendingScore(boothId, username);
        setMessage(`Đã ghi nhận lượt quét booth ${boothId}! Vui lòng chờ admin phân bổ điểm.`);
        setTimeout(() => {
          navigate('/', { replace: true }); // Redirect to homepage after success
        }, 3000);
      } catch (err: unknown) {
        console.error('Error processing booth access:', err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Đã xảy ra lỗi khi ghi nhận lượt quét.');
        }
        setTimeout(() => {
          navigate('/', { replace: true }); // Redirect to homepage even on error
        }, 4000);
      }
    };

    handleBoothAccess();
  }, [boothId, username, isLoading, mexcUID, navigate, location.pathname]);

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
