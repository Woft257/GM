import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle, Star, Trophy } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { useQRToken, getQRToken } from '../lib/database';
import { QRToken } from '../types';

const ScorePage: React.FC = () => {
  const { tokenId } = useParams<{ tokenId: string }>();
  const navigate = useNavigate();
  const { username } = useAuth();
  
  const [token, setToken] = useState<QRToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    points?: number;
  } | null>(null);

  useEffect(() => {
    const loadToken = async () => {
      if (!tokenId) {
        setResult({
          success: false,
          message: 'QR code không hợp lệ'
        });
        setLoading(false);
        return;
      }

      try {
        const tokenData = await getQRToken(tokenId);
        if (!tokenData) {
          setResult({
            success: false,
            message: 'QR code không tồn tại hoặc đã hết hạn'
          });
        } else {
          setToken(tokenData);
        }
      } catch (error) {
        console.error('Error loading token:', error);
        setResult({
          success: false,
          message: 'Có lỗi xảy ra khi tải thông tin QR code'
        });
      } finally {
        setLoading(false);
      }
    };

    loadToken();
  }, [tokenId]);

  const handleUseToken = async () => {
    if (!username || !tokenId) {
      setResult({
        success: false,
        message: 'Vui lòng đăng nhập trước khi quét QR code'
      });
      return;
    }

    setProcessing(true);
    
    try {
      const points = await useQRToken(tokenId, username);
      setResult({
        success: true,
        message: `Chúc mừng! Bạn đã nhận được ${points} điểm`,
        points
      });
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'Có lỗi xảy ra khi xử lý QR code'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <Layout title="Đang xử lý QR Code">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/70">Đang tải thông tin QR code...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!username) {
    return (
      <Layout title="Cần đăng nhập">
        <div className="max-w-md mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center">
            <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-4">Cần đăng nhập</h3>
            <p className="text-white/70 mb-6">
              Bạn cần đăng nhập bằng username Telegram để quét QR code và nhận điểm.
            </p>
            <button
              onClick={handleGoHome}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
            >
              Đi đến trang đăng nhập
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (result) {
    return (
      <Layout title={result.success ? "Thành công!" : "Có lỗi xảy ra"}>
        <div className="max-w-md mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center">
            {result.success ? (
              <>
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Thành công!</h3>
                {result.points && (
                  <div className="flex items-center justify-center mb-4">
                    <Star className="h-6 w-6 text-yellow-500 mr-2" />
                    <span className="text-2xl font-bold text-white">+{result.points}</span>
                    <span className="text-white/70 ml-2">điểm</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Có lỗi xảy ra</h3>
              </>
            )}
            
            <p className="text-white/70 mb-6">{result.message}</p>
            
            <button
              onClick={handleGoHome}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!token) {
    return (
      <Layout title="QR Code không hợp lệ">
        <div className="max-w-md mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-4">QR Code không hợp lệ</h3>
            <p className="text-white/70 mb-6">
              QR code này không tồn tại hoặc đã hết hạn.
            </p>
            <button
              onClick={handleGoHome}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Xác nhận nhận điểm">
      <div className="max-w-md mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Nhận điểm từ Booth</h3>
            <p className="text-white/70">Xác nhận để nhận điểm vào tài khoản của bạn</p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span className="text-white/70">Booth:</span>
              <span className="text-white font-semibold">{token.boothId}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span className="text-white/70">Điểm số:</span>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                <span className="text-white font-semibold">{token.points}</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span className="text-white/70">Người chơi:</span>
              <span className="text-white font-semibold">{username}</span>
            </div>
            
            {token.used && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-300 text-sm text-center">
                  QR code này đã được sử dụng bởi {token.usedBy} vào {token.usedAt?.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleUseToken}
            disabled={processing || token.used}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {processing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Đang xử lý...
              </div>
            ) : token.used ? (
              'QR code đã được sử dụng'
            ) : (
              'Xác nhận nhận điểm'
            )}
          </button>
          
          <button
            onClick={handleGoHome}
            className="w-full mt-3 text-white/70 hover:text-white transition-colors duration-200"
          >
            Hủy và về trang chủ
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default ScorePage;
