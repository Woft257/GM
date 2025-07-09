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
        showTorchButtonIfSupported: false, // Ẩn torch button mặc định
        showZoomSliderIfSupported: false,
        defaultZoomValueIfSupported: 1,
        rememberLastUsedCamera: true,
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

      // Ẩn UI mặc định của thư viện sau khi render
      setTimeout(() => {
        const container = document.getElementById('qr-scanner-container');
        if (container) {
          // Ẩn select camera dropdown và stop button
          const selectElements = container.querySelectorAll('select');
          const buttonElements = container.querySelectorAll('button');
          const spanElements = container.querySelectorAll('span');

          selectElements.forEach(el => {
            (el as HTMLElement).style.display = 'none';
          });

          buttonElements.forEach(el => {
            if (el.textContent?.includes('Stop') || el.textContent?.includes('Camera')) {
              (el as HTMLElement).style.display = 'none';
            }
          });

          spanElements.forEach(el => {
            if (el.textContent?.includes('Select Camera') || el.textContent?.includes('Stop')) {
              (el as HTMLElement).style.display = 'none';
            }
          });
        }
      }, 1000);

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
    <>
      {/* Global CSS để ẩn UI mặc định của Html5QrcodeScanner */}
      <style>{`
        #qr-scanner-container select,
        #qr-scanner-container button[id*="html5-qrcode"],
        #qr-scanner-container span[id*="html5-qrcode"],
        #qr-scanner-container div[id*="html5-qrcode-select"],
        #qr-scanner-container div[id*="html5-qrcode-button"],
        .html5-qrcode-element {
          display: none !important;
        }

        #qr-scanner-container video {
          border-radius: 1rem !important;
          width: 100% !important;
          height: auto !important;
        }
      `}</style>

      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-purple-900/90 via-blue-900/90 to-indigo-900/90 backdrop-blur-md rounded-3xl border border-white/20 w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
              <Camera className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">Quét QR Code</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200 hover:scale-110"
          >
            <X className="h-6 w-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {hasPermission === null && (
            <div className="text-center py-8">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500/30 border-t-purple-500 mx-auto mb-6"></div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 animate-pulse"></div>
              </div>
              <h4 className="text-white font-semibold mb-2">Đang khởi tạo camera</h4>
              <p className="text-white/60 text-sm">Vui lòng chờ trong giây lát...</p>
            </div>
          )}

          {hasPermission === false && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Cần quyền truy cập camera</h4>
              <p className="text-white/70 mb-6 leading-relaxed">
                Để quét QR code, ứng dụng cần quyền<br />
                truy cập camera của thiết bị
              </p>

              {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl mb-6">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <button
                  onClick={requestCameraPermission}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  🎥 Cho phép truy cập camera
                </button>

                <button
                  onClick={() => setShowManualInput(true)}
                  className="w-full bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 border border-white/20"
                >
                  ⌨️ Nhập mã QR thủ công
                </button>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-left">
                  <p className="text-blue-300 font-semibold mb-2">💡 Hướng dẫn khắc phục:</p>
                  <div className="text-white/70 text-sm space-y-1">
                    <p>1. Click vào biểu tượng 🔒 trên thanh địa chỉ</p>
                    <p>2. Chọn "Cho phép Camera"</p>
                    <p>3. Tải lại trang và thử lại</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showManualInput && (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl">⌨️</span>
              </div>
              <h4 className="text-xl font-bold text-white mb-6">Nhập mã QR thủ công</h4>
              <div className="space-y-4">
                <div className="relative">
                  <textarea
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Dán nội dung QR code vào đây..."
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none backdrop-blur-sm"
                    rows={4}
                  />
                  <div className="absolute top-2 right-2">
                    <span className="text-xs text-white/40">Ctrl+V để dán</span>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleManualSubmit}
                    disabled={!manualInput.trim()}
                    className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-4 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg"
                  >
                    ✅ Xử lý mã QR
                  </button>
                  <button
                    onClick={() => setShowManualInput(false)}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white py-4 rounded-xl font-semibold transition-all duration-200 border border-white/20"
                  >
                    ↩️ Quay lại
                  </button>
                </div>
              </div>
            </div>
          )}

          {hasPermission === true && (
            <div className="space-y-6">
              {isScanning && (
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-white font-semibold mb-2">Camera đã sẵn sàng</h4>
                  <p className="text-white/70 text-sm">
                    Đưa QR code vào khung hình để quét tự động
                  </p>
                </div>
              )}

              {/* QR Scanner Container */}
              <div className="relative">
                <div
                  id="qr-scanner-container"
                  className="w-full rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl qr-scanner-custom"
                  style={{ minHeight: '320px' }}
                />

                {/* Custom CSS để ẩn UI mặc định */}
                <style jsx>{`
                  .qr-scanner-custom :global(#html5-qrcode-select-camera),
                  .qr-scanner-custom :global(#html5-qrcode-button-camera-stop),
                  .qr-scanner-custom :global(.html5-qrcode-element),
                  .qr-scanner-custom :global([id*="html5-qrcode-select"]),
                  .qr-scanner-custom :global([id*="html5-qrcode-button"]) {
                    display: none !important;
                  }

                  .qr-scanner-custom :global(video) {
                    border-radius: 1rem;
                  }
                `}</style>

                {/* Scanning overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-4 border-2 border-white/30 rounded-xl">
                    {/* Corner indicators */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-purple-400 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-purple-400 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-purple-400 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-purple-400 rounded-br-lg"></div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                  <p className="text-red-300 text-sm text-center">{error}</p>
                </div>
              )}

              {/* Manual input option */}
              <div className="text-center">
                <button
                  onClick={() => setShowManualInput(true)}
                  className="text-white/60 hover:text-white text-sm underline transition-colors"
                >
                  Không quét được? Nhập thủ công →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-gradient-to-r from-purple-900/50 to-blue-900/50">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-2xl">💡</span>
              <p className="text-white/80 font-medium">Mẹo quét QR hiệu quả</p>
            </div>
            <div className="text-white/60 text-sm space-y-1">
              <p>• Giữ camera ổn định và đảm bảo ánh sáng đủ</p>
              <p>• Đưa QR code vào giữa khung hình</p>
              <p>• Khoảng cách 10-30cm là tối ưu</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default QRScanner;
