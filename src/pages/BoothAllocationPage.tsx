import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Trophy, CheckCircle, AlertCircle } from 'lucide-react';
import { usePendingScores } from '../hooks/usePendingScores';
import { allocateScore, getUser } from '../lib/database';
import { physicalBooths, getMinigamesForBooth } from '../data/booths';

const BoothAllocationPage: React.FC = () => {
  const { boothId } = useParams<{ boothId: string }>();
  const navigate = useNavigate();
  const { pendingScores, loading } = usePendingScores();
  const [allocatingUser, setAllocatingUser] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [scores, setScores] = useState<Record<string, Record<string, number>>>({});
  const [userScores, setUserScores] = useState<Record<string, Record<string, number>>>({});

  const booth = physicalBooths.find(b => b.id === boothId);
  const boothMinigames = boothId ? getMinigamesForBooth(boothId) : [];
  const boothPendingScores = pendingScores.filter(ps => ps.boothId === boothId);

  useEffect(() => {
    if (!booth) {
      navigate('/admin');
    }
  }, [booth, navigate]);

  // Load user scores for pending users
  useEffect(() => {
    const loadUserScores = async () => {
      const scores: Record<string, Record<string, number>> = {};
      for (const pendingScore of boothPendingScores) {
        if (!pendingScore.username) continue;

        try {
          const user = await getUser(pendingScore.username);
          if (user && user.scores) {
            scores[pendingScore.username] = user.scores;
          }
        } catch (error) {
          console.error('Error loading user scores:', error);
        }
      }
      setUserScores(scores);
    };

    if (boothPendingScores.length > 0) {
      loadUserScores();
    }
  }, [boothPendingScores]);

  const handleScoreChange = (username: string, minigameId: string, score: string) => {
    const numScore = parseInt(score) || 0;
    setScores(prev => ({
      ...prev,
      [username]: {
        ...prev[username],
        [minigameId]: numScore
      }
    }));
  };

  const handleAllocateScore = async (username: string, minigameId: string) => {
    if (allocatingUser) return;

    const score = scores[username]?.[minigameId] || 0;
    if (score < 0 || score > 50) {
      setNotification({ type: 'error', message: 'Điểm phải từ 0 đến 50' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    try {
      setAllocatingUser(username);
      await allocateScore(username, boothId!, minigameId, score);
      setNotification({ type: 'success', message: `Đã phân bổ ${score} điểm ${minigameId} cho ${username}` });
      setTimeout(() => setNotification(null), 3000);

      // Clear the score input
      setScores(prev => ({
        ...prev,
        [username]: {
          ...prev[username],
          [minigameId]: 0
        }
      }));
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
            
            {boothPendingScores.map((pendingScore, index) => (
              <div key={pendingScore.id || `pending-${index}`}
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
                  {(() => {
                    const currentUserScores = userScores[pendingScore.username] || {};
                    const availableMinigames = boothMinigames.filter(minigame =>
                      !currentUserScores[minigame.id] || currentUserScores[minigame.id] === 0
                    );
                    const completedMinigames = boothMinigames.filter(minigame =>
                      currentUserScores[minigame.id] && currentUserScores[minigame.id] > 0
                    );

                    return (
                      <>
                        {completedMinigames.length > 0 && (
                          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                            <p className="text-green-300 text-sm font-semibold mb-2">Đã hoàn thành:</p>
                            <div className="space-y-1">
                              {completedMinigames.map((minigame, idx) => (
                                <div key={minigame?.id || `completed-${idx}`} className="flex justify-between text-sm">
                                  <span className="text-gray-300">{minigame?.name}</span>
                                  <span className="text-green-400 font-semibold">{currentUserScores[minigame?.id || ''] || 0} điểm</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {availableMinigames.length > 0 ? (
                          <>
                            <p className="text-gray-300 text-sm">Chọn minigame và nhập điểm (0-50):</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {availableMinigames.map((minigame, idx) => (
                                <div key={minigame?.id || `available-${idx}`} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                                  <h4 className="font-semibold text-white mb-3 text-center">{minigame?.name}</h4>
                                  <div className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="number"
                                        min="0"
                                        max="50"
                                        value={scores[pendingScore.username]?.[minigame?.id || ''] || ''}
                                        onChange={(e) => handleScoreChange(pendingScore.username, minigame?.id || '', e.target.value)}
                                        placeholder="Nhập điểm"
                                        className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        disabled={allocatingUser === pendingScore.username}
                                      />
                                      <span className="text-gray-400 text-sm">điểm</span>
                                    </div>
                                    <button
                                      onClick={() => handleAllocateScore(pendingScore.username, minigame?.id || '')}
                                      disabled={allocatingUser === pendingScore.username || !scores[pendingScore.username]?.[minigame?.id || '']}
                                      className="w-full bg-gradient-to-r from-blue-600 to-cyan-400 hover:from-blue-700 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-700 text-white py-2 px-4 rounded-lg font-semibold transition-all duration-200 disabled:cursor-not-allowed"
                                    >
                                      {allocatingUser === pendingScore.username ? 'Đang phân bổ...' : 'Phân bổ điểm'}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
                            <p className="text-yellow-300">Người chơi đã hoàn thành tất cả minigame của booth này!</p>
                          </div>
                        )}
                      </>
                    );
                  })()}
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
