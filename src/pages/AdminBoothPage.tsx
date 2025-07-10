import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Users, Star, AlertCircle, CheckCircle, Clock, Trophy } from 'lucide-react';
import Layout from '../components/Layout';
import { subscribeToPendingScoresByBooth, completePendingScore } from '../lib/database';
import { isScoreAllocationAllowed } from '../lib/gameControl';
import { PendingScore } from '../types';
import { booths } from '../data/booths';

const AdminBoothPage: React.FC = () => {
  const { boothId } = useParams<{ boothId: string }>();

  const [pendingScores, setPendingScores] = useState<PendingScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [adminTelegram] = useState<string>('admin'); // Fixed admin identifier

  // Find booth info
  const booth = booths.find(b => b.id === boothId);

  useEffect(() => {
    if (!booth) {
      setError('Booth không tồn tại');
      setLoading(false);
      return;
    }

    // Subscribe to pending scores for this booth
    const unsubscribe = subscribeToPendingScoresByBooth(boothId!, (scores) => {
      setPendingScores(scores);
      setLoading(false);
    });

    // Auto refresh every 5 seconds as backup
    const refreshInterval = setInterval(() => {
      console.log('Auto refreshing pending scores...');
    }, 5000);

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      clearInterval(refreshInterval);
    };
  }, [boothId, booth]);

  const handleCompleteScore = async (pendingId: string, points: number) => {
    if (points < 1 || points > (booth?.maxScore || 50)) {
      alert(`Điểm số phải từ 1 đến ${booth?.maxScore || 50}`);
      return;
    }

    // Check if game is still active
    const gameActive = await isScoreAllocationAllowed();
    if (!gameActive) {
      alert('Sự kiện đã kết thúc. Không thể phân bổ điểm nữa.');
      return;
    }

    setProcessingId(pendingId);
    try {
      await completePendingScore(pendingId, points, adminTelegram);
      // Success - the subscription will update the list automatically
    } catch (error: any) {
      alert(error.message || 'Có lỗi xảy ra khi phân bổ điểm');
    } finally {
      setProcessingId(null);
    }
  };

  if (!booth) {
    return (
      <Layout title="Booth không tồn tại">
        <div className="max-w-md mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-4">Booth không tồn tại</h3>
            <p className="text-white/70 mb-6">
              Booth ID "{boothId}" không hợp lệ.
            </p>
            <p className="text-red-400 font-semibold">
              Vui lòng kiểm tra lại URL booth
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout title={`Admin - ${booth?.name || 'Loading...'}`}>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500/30 border-t-purple-500 mx-auto mb-6"></div>
          <p className="text-white/70">Đang tải danh sách user...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Admin - ${booth.name}`}>
      <div className="space-y-4 sm:space-y-6">
        {/* Booth Info - Mobile Optimized */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3 sm:mr-4">
              <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white">{booth.name}</h3>
              <p className="text-white/70 text-sm sm:text-base">{booth.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="bg-white/5 rounded-lg p-2 sm:p-3 text-center">
              <p className="text-white/60 text-xs sm:text-sm">Điểm tối đa</p>
              <p className="text-white font-semibold text-base sm:text-lg">{booth.maxScore}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2 sm:p-3 text-center">
              <p className="text-white/60 text-xs sm:text-sm">Đang chờ</p>
              <p className="text-yellow-400 font-semibold text-base sm:text-lg">{pendingScores.length}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2 sm:p-3 text-center">
              <p className="text-white/60 text-xs sm:text-sm">Trạng thái</p>
              <p className="text-green-400 font-semibold text-xs sm:text-sm">Hoạt động</p>
            </div>
          </div>
        </div>



        {/* Pending Users List - Mobile Optimized */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
          <h4 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            User đang chờ phân bổ điểm ({pendingScores.length})
          </h4>

          {pendingScores.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <p className="text-white/70">Chưa có user nào đang chờ phân bổ điểm</p>
              <p className="text-white/50 text-sm mt-2">User sẽ xuất hiện ở đây sau khi quét QR code booth</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingScores.map((pending) => (
                <PendingUserCard
                  key={pending.id}
                  pending={pending}
                  booth={booth}
                  onComplete={handleCompleteScore}
                  processing={processingId === pending.id}
                />
              ))}
            </div>
          )}
        </div>


      </div>
    </Layout>
  );
};

// Component for individual pending user
interface PendingUserCardProps {
  pending: PendingScore;
  booth: any;
  onComplete: (pendingId: string, points: number) => void;
  processing: boolean;
}

const PendingUserCard: React.FC<PendingUserCardProps> = ({ pending, booth, onComplete, processing }) => {
  const [points, setPoints] = useState<number>(booth.maxScore);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleSubmit = () => {
    // Optimistic update
    setIsCompleted(true);
    onComplete(pending.id, points);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className={`border rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all duration-300 ${
      isCompleted
        ? 'bg-green-500/20 border-green-500/30'
        : 'bg-white/5 border-white/10'
    }`}>
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mr-2 sm:mr-3 ${
            isCompleted
              ? 'bg-gradient-to-r from-green-500 to-emerald-500'
              : 'bg-gradient-to-r from-blue-500 to-purple-500'
          }`}>
            <span className="text-white font-bold text-xs sm:text-sm">
              {pending.userTelegram.charAt(1).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm sm:text-base">{pending.userTelegram}</p>
            <p className="text-white/60 text-xs sm:text-sm">
              {isCompleted ? `Hoàn thành - ${points} điểm` : `Chờ từ ${formatTime(pending.createdAt)}`}
            </p>
          </div>
        </div>
        <div className={`flex items-center ${isCompleted ? 'text-green-400' : 'text-yellow-400'}`}>
          {isCompleted ? (
            <>
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="text-xs sm:text-sm">Hoàn thành</span>
            </>
          ) : (
            <>
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="text-xs sm:text-sm">Đang chờ</span>
            </>
          )}
        </div>
      </div>

      {!isCompleted && (
        <div className="space-y-3">
          {/* Mobile: Stack vertically, Desktop: Horizontal */}
          <div className="flex flex-col sm:flex-row sm:items-end space-y-3 sm:space-y-0 sm:space-x-3">
            <div className="flex-1">
              <label className="block text-white/80 text-xs sm:text-sm font-medium mb-2">
                Điểm số cho user này
              </label>
              <input
                type="number"
                min={1}
                max={booth.maxScore}
                value={points}
                onChange={(e) => setPoints(parseInt(e.target.value) || 1)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 sm:py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                disabled={processing}
              />
            </div>

            {/* Quick select buttons - Mobile optimized */}
            <div className="flex space-x-2">
              {[Math.floor(booth.maxScore * 0.5), Math.floor(booth.maxScore * 0.8), booth.maxScore].map((quickPoints) => (
                <button
                  key={quickPoints}
                  onClick={() => setPoints(quickPoints)}
                  disabled={processing}
                  className={`px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                    points === quickPoints
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  } disabled:opacity-50 touch-manipulation`}
                >
                  {quickPoints}
                </button>
              ))}
            </div>
          </div>

          {/* Submit button - Full width on mobile */}
          <button
            onClick={handleSubmit}
            disabled={processing}
            className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-4 sm:px-6 py-3 sm:py-2 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center touch-manipulation"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                <span className="text-sm sm:text-base">Đang xử lý...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                <span className="text-sm sm:text-base">Phân bổ điểm</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminBoothPage;
