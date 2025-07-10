import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Download, Copy, CheckCircle } from 'lucide-react';
import Layout from '../components/Layout';
import { generateBoothQR } from '../lib/boothQR';
import { BoothQR } from '../types';
import { booths } from '../data/booths';

const BoothQRPage: React.FC = () => {
  const navigate = useNavigate();
  const [boothQRs, setBoothQRs] = useState<Record<string, BoothQR>>({});
  const [loading, setLoading] = useState(true);
  const [copiedBooth, setCopiedBooth] = useState<string | null>(null);

  useEffect(() => {
    generateAllBoothQRs();
  }, []);

  const generateAllBoothQRs = async () => {
    setLoading(true);
    const qrs: Record<string, BoothQR> = {};

    try {
      for (const booth of booths) {
        const boothQR = await generateBoothQR(booth.id);
        qrs[booth.id] = boothQR;
      }
      setBoothQRs(qrs);
    } catch (error) {
      console.error('Error generating booth QRs:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = (boothId: string) => {
    const boothQR = boothQRs[boothId];
    if (!boothQR) return;

    const link = document.createElement('a');
    link.download = `${boothId}-qr.png`;
    link.href = boothQR.qrCodeDataURL;
    link.click();
  };

  const copyQRData = async (boothId: string) => {
    const boothQR = boothQRs[boothId];
    if (!boothQR) return;

    try {
      await navigator.clipboard.writeText(boothQR.qrData);
      setCopiedBooth(boothId);
      setTimeout(() => setCopiedBooth(null), 2000);
    } catch (error) {
      console.error('Error copying QR data:', error);
    }
  };

  if (loading) {
    return (
      <Layout title="Tạo QR Codes cho Booth">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500/30 border-t-purple-500 mx-auto mb-6"></div>
          <p className="text-white/70">Đang tạo QR codes...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="QR Codes cho Booth">
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <QrCode className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">QR Codes cho Booth</h1>
          <p className="text-white/70">
            Mỗi booth có 1 QR code cố định. In và dán tại booth tương ứng.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {booths.map((booth) => {
            const boothQR = boothQRs[booth.id];
            if (!boothQR) return null;

            return (
              <div key={booth.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-white mb-1">{booth.name}</h3>
                  <p className="text-white/60 text-sm">{booth.description}</p>
                </div>

                <div className="bg-white rounded-lg p-4 mb-4">
                  <img 
                    src={boothQR.qrCodeDataURL} 
                    alt={`QR Code ${booth.name}`}
                    className="w-full h-auto"
                  />
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => downloadQR(booth.id)}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Tải xuống</span>
                  </button>

                  <button
                    onClick={() => copyQRData(booth.id)}
                    className="w-full bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 border border-white/20 flex items-center justify-center space-x-2"
                  >
                    {copiedBooth === booth.id ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span>Đã copy!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Copy dữ liệu</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-4 p-3 bg-black/20 rounded-lg">
                  <p className="text-white/60 text-xs font-mono break-all">
                    {boothQR.qrData}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
          <h3 className="text-blue-300 font-semibold mb-3">📋 Hướng dẫn sử dụng:</h3>
          <div className="text-white/70 space-y-2 text-sm">
            <p>1. <strong>Tải xuống</strong> QR code của từng booth</p>
            <p>2. <strong>In</strong> QR code với kích thước đủ lớn (ít nhất 10x10cm)</p>
            <p>3. <strong>Dán</strong> QR code tại booth tương ứng</p>
            <p>4. Khi user quét QR, họ sẽ chờ admin nhập điểm</p>
            <p>5. Admin truy cập <strong>/admin/booth1</strong> để nhập điểm cho user</p>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/admin')}
            className="text-white/70 hover:text-white transition-colors text-sm sm:text-base"
          >
            ← Về Admin Dashboard
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default BoothQRPage;
