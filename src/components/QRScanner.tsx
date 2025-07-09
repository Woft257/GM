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
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualInput, setManualInput] = useState('');

  useEffect(() => {
    if (isOpen && !scannerRef.current && hasPermission === null) {
      checkCameraPermission();
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [isOpen]);

  // Separate effect for when permission is granted
  useEffect(() => {
    if (hasPermission === true && isOpen && !scannerRef.current && !showManualInput) {
      // Ensure DOM is ready
      const timer = setTimeout(() => {
        initializeScanner();
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [hasPermission, isOpen, showManualInput]);

  const checkCameraPermission = async () => {
    try {
      // Check if camera permission is already granted
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' } // Prefer back camera
        }
      });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      // initializeScanner will be called by useEffect
    } catch (err) {
      console.log('Camera permission not granted yet');
      setHasPermission(false);
    }
  };

  const initializeScanner = async () => {
    try {
      setError('');

      // Wait for DOM element to be available
      const element = document.getElementById("qr-scanner-container");
      if (!element) {
        console.error('QR scanner container not found, waiting...');
        // Try again after a short delay
        setTimeout(() => {
          initializeScanner();
        }, 500);
        return;
      }

      console.log('Initializing QR scanner with back camera preference...');

      const config: Html5QrcodeScannerConfig = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: false,
        defaultZoomValueIfSupported: 1,
        // Prefer back camera
        videoConstraints: {
          facingMode: { ideal: "environment" }
        }
      };

      scannerRef.current = new Html5QrcodeScanner(
        "qr-scanner-container",
        config,
        false
      );

      scannerRef.current.render(
        (decodedText) => {
          console.log('QR Code scanned:', decodedText);
          setIsScanning(false);
          onScanSuccess(decodedText);
          handleClose();
        },
        (errorMessage) => {
          // Ignore frequent scan errors
          if (!errorMessage.includes('No QR code found') &&
              !errorMessage.includes('NotFoundException') &&
              !errorMessage.includes('No MultiFormat Readers')) {
            console.warn('QR scan error:', errorMessage);
          }
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error('Scanner initialization error:', err);
      setError('Không thể khởi tạo scanner. Vui lòng thử lại.');
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
    setShowManualInput(false);
    setManualInput('');
    onClose();
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onScanSuccess(manualInput.trim());
      handleClose();
    }
  };

  const requestCameraPermission = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' } // Prefer back camera
        }
      });

      // Stop the stream immediately as we just needed permission
      stream.getTracks().forEach(track => track.stop());

      setHasPermission(true);
      // initializeScanner will be called by useEffect when hasPermission changes

    } catch (err: any) {
      console.error('Camera permission error:', err);
      setHasPermission(false);

      if (err.name === 'NotAllowedError') {
        setError('Quyền camera bị từ chối. Vui lòng cho phép truy cập camera và tải lại trang.');
      } else if (err.name === 'NotFoundError') {
        setError('Không tìm thấy camera. Vui lòng kiểm tra thiết bị camera.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera đang được sử dụng bởi ứng dụng khác. Vui lòng đóng các ứng dụng khác và thử lại.');
      } else {
        setError('Không thể truy cập camera. Vui lòng kiểm tra quyền camera trong cài đặt trình duyệt.');
      }
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
                  <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg mb-4">
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                )}
                <div className="space-y-3">
                  <button
                    onClick={requestCameraPermission}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
                  >
                    Cho phép truy cập camera
                  </button>

                  <button
                    onClick={() => setShowManualInput(true)}
                    className="w-full bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
                  >
                    Nhập mã QR thủ công
                  </button>

                  <div className="text-white/60 text-xs">
                    <p>💡 Nếu camera không hoạt động:</p>
                    <p>1. Click vào biểu tượng 🔒 trên thanh địa chỉ</p>
                    <p>2. Cho phép Camera</p>
                    <p>3. Tải lại trang</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showManualInput && (
            <div className="text-center space-y-4">
              <h4 className="text-white font-semibold">Nhập mã QR thủ công</h4>
              <div className="space-y-3">
                <textarea
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Dán nội dung QR code vào đây..."
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={4}
                />
                <div className="flex space-x-3">
                  <button
                    onClick={handleManualSubmit}
                    disabled={!manualInput.trim()}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Xử lý
                  </button>
                  <button
                    onClick={() => setShowManualInput(false)}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg font-semibold transition-all duration-200"
                  >
                    Quay lại
                  </button>
                </div>
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
