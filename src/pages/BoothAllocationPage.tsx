import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Trophy, CheckCircle, AlertCircle } from 'lucide-react';
import { usePendingScores } from '../hooks/usePendingScores';
import { allocateScore } from '../lib/database';
import { physicalBooths, getMinigamesForBooth } from '../data/booths';

const BoothAllocationPage: React.FC = () => {
  const { boothId } = useParams<{ boothId: string }>();
  const navigate = useNavigate();
  const { pendingScores, loading } = usePendingScores();
  const [allocatingUser, setAllocatingUser] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const booth = physicalBooths.find(b => b.id === boothId);
  const boothMinigames = boothId ? getMinigamesForBooth(boothId) : [];
  const boothPendingScores = pendingScores.filter(ps => ps.boothId === boothId);

  useEffect(() => {
    if (!booth) {
      navigate('/admin');
    }
  }, [booth, navigate]);

  const handleAllocateScore = async (username: string, minigameId: string, score: number) => {
    if (allocatingUser) return;

    try {
      setAllocatingUser(username);
      await allocateScore(username, boothId!, minigameId, score);
      setNotification({ type: 'success', message: `Đã phân bổ ${score} điểm cho ${username}` });
      setTimeout(() => setNotification(null), 3000);
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || 'Có lỗi xảy ra' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setAllocatingUser(null);
    }
  };

  if (!booth) {
    return <div>Booth không tồn tại</div>;
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin')}
                className="mr-4 p-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">{booth.name}</h1>
                <p className="text-gray-400 text-sm">{booth.description}</p>
              </div>
            </div>
            <div className="flex items-center text-gray-300 bg-gray-800 px-3 py-2 rounded-lg">
              <Users className="h-5 w-5 mr-2" />
              <span>{boothPendingScores.length} chờ phân bổ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg border ${
          notification.type === 'success' 
            ? 'bg-green-500/20 border-green-500/40 text-green-300'
            : 'bg-red-500/20 border-red-500/40 text-red-300'
        }`}>
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            {notification.message}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Đang tải...</p>
          </div>
        ) : boothPendingScores.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Không có người chơi nào chờ phân bổ</h3>
            <p className="text-gray-400">Tất cả người chơi đã được phân bổ điểm hoặc chưa có ai quét QR code của booth này.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white mb-4">
              Người chơi chờ phân bổ điểm ({boothPendingScores.length})
            </h2>
            
            {boothPendingScores.map((pendingScore) => (
              <div key={`${pendingScore.username}-${pendingScore.timestamp}`} 
                   className="bg-gray-900/80 border border-gray-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{pendingScore.username}</h3>
                    <p className="text-gray-400 text-sm">
                      Quét lúc: {new Date(pendingScore.timestamp).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-yellow-400 font-semibold">Chờ phân bổ điểm</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-gray-300 text-sm">Chọn minigame và phân bổ điểm:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {boothMinigames.map((minigame) => (
                      <div key={minigame.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                        <h4 className="font-semibold text-white mb-3 text-center">{minigame.name}</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {[0, 25, 50].map((score) => (
                            <button
                              key={`${minigame.id}-${score}`}
                              onClick={() => handleAllocateScore(pendingScore.username, minigame.id, score)}
                              disabled={allocatingUser === pendingScore.username}
                              className={`py-2 px-3 rounded-lg font-semibold transition-all duration-200 text-sm ${
                                score === 0
                                  ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/40'
                                  : score === 25
                                  ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 border border-yellow-500/40'
                                  : 'bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-500/40'
                              } ${
                                allocatingUser === pendingScore.username
                                  ? 'opacity-50 cursor-not-allowed'
                                  : 'hover:scale-105'
                              }`}
                            >
                              {allocatingUser === pendingScore.username ? '...' : `${score} điểm`}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BoothAllocationPage;
