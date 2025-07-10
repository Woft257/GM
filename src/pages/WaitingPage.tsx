import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, Star, Trophy } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { subscribeToPendingScore } from '../lib/database';
import { PendingScore } from '../types';
import { booths } from '../data/booths';

const WaitingPage: React.FC = () => {
  const { pendingId } = useParams<{ pendingId: string }>();
  const navigate = useNavigate();
  const { username } = useAuth();
  
  const [pendingScore, setPendingScore] = useState<PendingScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  useEffect(() => {
    if (!pendingId) {
      setError('ID không hợp lệ');
      setLoading(false);
      return;
    }

    if (!username) {
      navigate('/');
      return;
    }

    // Subscribe to pending score updates
    const unsubscribe = subscribeToPendingScore(pendingId, (updatedPendingScore) => {
      if (updatedPendingScore) {
        setPendingScore(updatedPendingScore);
        
        // Check if user matches
        if (updatedPendingScore.userTelegram !== username) {
          setError('Bạn không có quyền xem trang này');
          setLoading(false);
          return;
        }

        // If completed, show success and redirect after shorter delay
        if (updatedPendingScore.status === 'completed') {
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 2000); // Reduced from 3000ms to 2000ms
        }
        
        setLoading(false);
      } else {
        setError('Không tìm thấy thông tin chờ phân bổ điểm');
        setLoading(false);
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [pendingId, username, navigate]);

  const getBooth = (boothId: string) => {
    return booths.find(b => b.id === boothId);
  };

  if (loading) {
    return (
      <Layout title="Đang tải...">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500/30 border-t-purple-500 mx-auto mb-6"></div>
          <p className="text-white/70">Đang tải thông tin...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Lỗi">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white mb-4">Có lỗi xảy ra</h2>
          <p className="text-white/70 mb-6">{error}</p>
          <button
            onClick={handleGoHome}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
          >
            Về trang chủ
          </button>
        </div>
      </Layout>
    );
  }

  if (!pendingScore) {
    return (
      <Layout title="Không tìm thấy">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white mb-4">Không tìm thấy thông tin</h2>
          <p className="text-white/70 mb-6">Thông tin chờ phân bổ điểm không tồn tại</p>
          <button
            onClick={handleGoHome}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
          >
            Về trang chủ
          </button>
        </div>
      </Layout>
    );
  }

  const booth = getBooth(pendingScore.boothId);

  if (pendingScore.status === 'completed') {
    return (
      <Layout title="Hoàn thành!">
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <Trophy className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">🎉 Chúc mừng!</h2>
          <p className="text-white/80 mb-2">Bạn đã nhận được</p>
          <div className="text-4xl font-bold text-yellow-400 mb-4">
            <Star className="inline h-8 w-8 mr-2" />
            {pendingScore.points} điểm
          </div>
          <p className="text-white/70 mb-6">
            từ <strong>{booth?.name || pendingScore.boothId}</strong>
          </p>
          
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6 max-w-md mx-auto">
            <p className="text-green-300 text-sm">
              ✅ Điểm đã được cộng vào tổng điểm của bạn
            </p>
          </div>

          <p className="text-white/60 text-sm mb-6">
            Tự động chuyển về trang chủ sau 2 giây...
          </p>

          <button
            onClick={handleGoHome}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 text-lg"
          >
            Về trang chủ ngay
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Đang chờ phân bổ điểm">
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <Clock className="h-10 w-10 text-white" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-4">Đang chờ phân bổ điểm</h2>
        <p className="text-white/80 mb-6">
          Bạn đã quét thành công QR code của <strong>{booth?.name || pendingScore.boothId}</strong>
        </p>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 mb-8 max-w-md mx-auto">
          <div className="flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500/30 border-t-blue-500"></div>
          </div>
          <p className="text-blue-300 font-semibold mb-2">Vui lòng chờ...</p>
          <p className="text-white/70 text-sm">
            Admin booth đang xem xét và sẽ phân bổ điểm cho bạn
          </p>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6 max-w-md mx-auto">
          <p className="text-yellow-300 text-sm">
            💡 <strong>Lưu ý:</strong> Không đóng trang này. Bạn sẽ tự động nhận điểm khi admin hoàn tất.
          </p>
        </div>

        <p className="text-white/60 text-sm mb-6">
          Thời gian chờ: {new Date(pendingScore.createdAt).toLocaleTimeString('vi-VN')}
        </p>

        <button
          onClick={handleGoHome}
          className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 border border-white/20"
        >
          Về trang chủ
        </button>
      </div>
    </Layout>
  );
};

export default WaitingPage;
