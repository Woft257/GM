import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QrCode, Download, RefreshCw, Settings, Star, AlertCircle } from 'lucide-react';
import Layout from '../components/Layout';
import { generateQRCodeData, BOOTH_CONFIGS, BoothId } from '../lib/qrcode';

const AdminBoothPage: React.FC = () => {
  const { boothId } = useParams<{ boothId: string }>();
  const navigate = useNavigate();
  
  const [points, setPoints] = useState<number>(10);
  const [qrData, setQrData] = useState<{
    qrCodeDataURL: string;
    tokenId: string;
    qrData: string;
  } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string>('');

  // Validate booth ID
  const booth = boothId && boothId in BOOTH_CONFIGS ? BOOTH_CONFIGS[boothId as BoothId] : null;

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
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const handleGenerateQR = async () => {
    if (points < booth.minScore || points > booth.maxScore) {
      setError(`Điểm số phải từ ${booth.minScore} đến ${booth.maxScore}`);
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const result = await generateQRCodeData(booth.id, points);
      setQrData(result);
    } catch (error) {
      console.error('Error generating QR code:', error);
      setError('Có lỗi xảy ra khi tạo QR code');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadQR = () => {
    if (!qrData) return;

    const link = document.createElement('a');
    link.download = `${booth.id}_${points}points_${Date.now()}.png`;
    link.href = qrData.qrCodeDataURL;
    link.click();
  };

  const handleNewQR = () => {
    setQrData(null);
    setError('');
  };

  const handlePointsChange = (value: number) => {
    setPoints(value);
    setError('');
  };

  return (
    <Layout title={`Admin - ${booth.name}`}>
      <div className="max-w-2xl mx-auto">
        {/* Booth Info */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 mb-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-4">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{booth.name}</h3>
              <p className="text-white/70">{booth.description}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-white/60 text-sm">Điểm tối thiểu</p>
              <p className="text-white font-semibold">{booth.minScore}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-white/60 text-sm">Điểm tối đa</p>
              <p className="text-white font-semibold">{booth.maxScore}</p>
            </div>
          </div>
        </div>

        {/* QR Generator */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
            <QrCode className="h-5 w-5 mr-2" />
            Tạo QR Code
          </h4>

          {!qrData ? (
            <div className="space-y-6">
              {/* Points Input */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Điểm số cho QR code này
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    min={booth.minScore}
                    max={booth.maxScore}
                    value={points}
                    onChange={(e) => handlePointsChange(parseInt(e.target.value) || 0)}
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Nhập điểm số"
                  />
                  <div className="flex items-center text-white/70">
                    <Star className="h-4 w-4 mr-1" />
                    <span className="text-sm">điểm</span>
                  </div>
                </div>
                <p className="text-white/60 text-sm mt-1">
                  Từ {booth.minScore} đến {booth.maxScore} điểm
                </p>
              </div>

              {/* Quick Points */}
              <div>
                <p className="text-white/80 text-sm font-medium mb-2">Chọn nhanh:</p>
                <div className="flex flex-wrap gap-2">
                  {[booth.minScore, Math.floor((booth.minScore + booth.maxScore) / 2), booth.maxScore].map((quickPoints) => (
                    <button
                      key={quickPoints}
                      onClick={() => handlePointsChange(quickPoints)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        points === quickPoints
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/10 text-white/80 hover:bg-white/20'
                      }`}
                    >
                      {quickPoints} điểm
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={handleGenerateQR}
                disabled={generating}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {generating ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Đang tạo QR code...
                  </div>
                ) : (
                  'Tạo QR Code'
                )}
              </button>
            </div>
          ) : (
            <div className="text-center space-y-6">
              {/* QR Code Display */}
              <div className="bg-white p-6 rounded-xl inline-block">
                <img 
                  src={qrData.qrCodeDataURL} 
                  alt="QR Code" 
                  className="w-64 h-64 mx-auto"
                />
              </div>

              {/* QR Info */}
              <div className="space-y-3">
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/60 text-sm">Điểm số</p>
                  <p className="text-white font-semibold">{points} điểm</p>
                </div>
                
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/60 text-sm">Token ID</p>
                  <p className="text-white font-mono text-xs break-all">{qrData.tokenId}</p>
                </div>
                
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/60 text-sm">QR Data</p>
                  <p className="text-white font-mono text-xs break-all">{qrData.qrData}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={handleDownloadQR}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Tải xuống
                </button>
                
                <button
                  onClick={handleNewQR}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tạo mới
                </button>
              </div>

              <div className="text-center">
                <p className="text-white/60 text-sm">
                  ⚠️ QR code này chỉ sử dụng được 1 lần và có hiệu lực trong 24 giờ
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-white/70 hover:text-white transition-colors duration-200"
          >
            ← Về trang chủ
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default AdminBoothPage;
