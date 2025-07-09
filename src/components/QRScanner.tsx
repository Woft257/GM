import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScannerConfig, Html5QrcodeScanType } from 'html5-qrcode';
import { Camera, X, AlertCircle, CheckCircle } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (data: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onClose, isOpen }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (isOpen && !scannerRef.current) {
      initializeScanner();
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [isOpen]);

  const initializeScanner = async () => {
    try {
      // Check camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);

      const config: Html5QrcodeScannerConfig = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        defaultZoomValueIfSupported: 2,
      };

      scannerRef.current = new Html5QrcodeScanner(
        "qr-scanner-container",
        config,
        false
      );

      scannerRef.current.render(
        (decodedText) => {
          setIsScanning(false);
          onScanSuccess(decodedText);
          handleClose();
        },
        (errorMessage) => {
          // Ignore frequent scan errors
          if (!errorMessage.includes('No QR code found')) {
            console.warn('QR scan error:', errorMessage);
          }
        }
      );

      setIsScanning(true);
      setError('');
    } catch (err: any) {
      console.error('Camera access error:', err);
      setHasPermission(false);
      setError('Không thể truy cập camera. Vui lòng cho phép quyền camera và thử lại.');
    }
  };

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
    setIsScanning(false);
    setError('');
    setHasPermission(null);
    onClose();
  };

  const requestCameraPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setHasPermission(true);
      setError('');
      initializeScanner();
    } catch (err) {
      setHasPermission(false);
      setError('Không thể truy cập camera. Vui lòng kiểm tra quyền camera trong cài đặt trình duyệt.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center">
            <Camera className="h-6 w-6 text-white mr-2" />
            <h3 className="text-lg font-semibold text-white">Quét QR Code</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {hasPermission === null && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white/70">Đang khởi tạo camera...</p>
            </div>
          )}

          {hasPermission === false && (
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
              <div>
                <h4 className="text-white font-semibold mb-2">Cần quyền truy cập camera</h4>
                <p className="text-white/70 text-sm mb-4">
                  Để quét QR code, ứng dụng cần quyền truy cập camera của bạn.
                </p>
                {error && (
                  <p className="text-red-400 text-sm mb-4">{error}</p>
                )}
                <button
                  onClick={requestCameraPermission}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
                >
                  Cho phép truy cập camera
                </button>
              </div>
            </div>
          )}

          {hasPermission === true && (
            <div>
              {isScanning && (
                <div className="text-center mb-4">
                  <CheckCircle className="h-6 w-6 text-green-400 mx-auto mb-2" />
                  <p className="text-white/70 text-sm">
                    Đưa QR code vào khung hình để quét
                  </p>
                </div>
              )}
              
              {/* QR Scanner Container */}
              <div 
                id="qr-scanner-container" 
                className="w-full rounded-lg overflow-hidden"
                style={{ minHeight: '300px' }}
              />
              
              {error && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-300 text-sm text-center">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/20">
          <div className="text-center">
            <p className="text-white/60 text-sm">
              💡 Mẹo: Giữ camera ổn định và đảm bảo QR code được chiếu sáng tốt
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
