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

    // Prevent body scroll when scanner is open
    if (isOpen) {
      document.body.classList.add('qr-scanner-open');
    } else {
      document.body.classList.remove('qr-scanner-open');
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
      // Restore body scroll
      document.body.classList.remove('qr-scanner-open');
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
        fps: 15, // Tăng FPS để responsive hơn
        qrbox: function(viewfinderWidth: number, viewfinderHeight: number) {
          // Dynamic QR box size based on screen
          const minEdgePercentage = 0.7; // 70% of the smaller dimension
          const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
          return {
            width: qrboxSize,
            height: qrboxSize,
          };
        },
        aspectRatio: 1.0,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        showTorchButtonIfSupported: false,
        showZoomSliderIfSupported: false,
        defaultZoomValueIfSupported: 1,
        rememberLastUsedCamera: true,
        // Prefer back camera with better constraints
        videoConstraints: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        // Performance optimizations
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
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
          // Ignore frequent scan errors to reduce console noise
          if (!errorMessage.includes('No QR code found') &&
              !errorMessage.includes('NotFoundException') &&
              !errorMessage.includes('No MultiFormat Readers') &&
              !errorMessage.includes('QR code parse error')) {
            console.warn('QR scan error:', errorMessage);
          }
        }
      );

      // Ẩn UI mặc định của thư viện với multiple attempts
      const hideUIElements = () => {
        const container = document.getElementById('qr-scanner-container');
        if (container) {
          // Ẩn tất cả elements không cần thiết
          const selectElements = container.querySelectorAll('select, [id*="select"], [class*="select"]');
          const buttonElements = container.querySelectorAll('button, [id*="button"], [class*="button"]');
          const spanElements = container.querySelectorAll('span, div');

          selectElements.forEach(el => {
            (el as HTMLElement).style.display = 'none !important';
            (el as HTMLElement).style.visibility = 'hidden !important';
          });

          buttonElements.forEach(el => {
            const text = el.textContent?.toLowerCase() || '';
            if (text.includes('stop') || text.includes('camera') || text.includes('select')) {
              (el as HTMLElement).style.display = 'none !important';
              (el as HTMLElement).style.visibility = 'hidden !important';
            }
          });

          spanElements.forEach(el => {
            const text = el.textContent?.toLowerCase() || '';
            if (text.includes('select camera') ||
                text.includes('stop') ||
                text.includes('camera permission') ||
                text.includes('requesting')) {
              (el as HTMLElement).style.display = 'none !important';
              (el as HTMLElement).style.visibility = 'hidden !important';
            }
          });
        }
      };

      // Multiple attempts để đảm bảo ẩn được UI
      setTimeout(hideUIElements, 300);
      setTimeout(hideUIElements, 800);
      setTimeout(hideUIElements, 1500);

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
    const input = manualInput.trim();
    if (input) {
      // Check if it's a 6-digit code
      if (/^\d{6}$/.test(input)) {
        // Handle as simple code
        onScanSuccess(`SIMPLE_CODE:${input}`);
      } else {
        // Handle as QR data
        onScanSuccess(input);
      }
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
      {/* Global CSS để ẩn UI mặc định và optimize performance */}
      <style>{`
        /* Hide all default UI elements */
        #qr-scanner-container select,
        #qr-scanner-container button[id*="html5-qrcode"],
        #qr-scanner-container span[id*="html5-qrcode"],
        #qr-scanner-container div[id*="html5-qrcode-select"],
        #qr-scanner-container div[id*="html5-qrcode-button"],
        .html5-qrcode-element,
        #qr-scanner-container *[id*="html5-qrcode"]:not(video) {
          display: none !important;
          visibility: hidden !important;
        }

        /* Optimize video performance */
        #qr-scanner-container video {
          border-radius: 0.75rem !important;
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          transform: translateZ(0) !important;
          backface-visibility: hidden !important;
          -webkit-backface-visibility: hidden !important;
        }

        /* Safe area support */
        .safe-area-top {
          padding-top: max(env(safe-area-inset-top), 0.75rem);
        }

        .safe-area-bottom {
          padding-bottom: max(env(safe-area-inset-bottom), 0.75rem);
        }

        /* Prevent scrolling and improve touch */
        body.qr-scanner-open {
          overflow: hidden !important;
          position: fixed !important;
          width: 100% !important;
          height: 100% !important;
          touch-action: none !important;
        }
      `}</style>

      <div className="fixed inset-0 bg-black/95 z-50 flex flex-col" style={{ touchAction: 'none' }}>
        <div className="flex-1 bg-gradient-to-br from-purple-900/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-md border-white/10 shadow-2xl overflow-hidden">
        {/* Mobile Header - Optimized */}
        <div className="flex items-center justify-between p-3 sm:p-6 border-b border-white/10 bg-black/30 safe-area-top">
          <div className="flex items-center">
            <div className="w-7 h-7 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-2 sm:mr-3">
              <Camera className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-white" />
            </div>
            <h3 className="text-base sm:text-xl font-bold text-white">Quét QR Code</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 sm:p-3 hover:bg-white/10 rounded-xl transition-all duration-200 active:scale-95 touch-manipulation"
          >
            <X className="h-6 w-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
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
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 active:from-blue-700 active:to-purple-700 text-white px-6 py-4 sm:px-8 sm:py-4 rounded-xl font-semibold transition-all duration-200 active:scale-95 shadow-lg touch-manipulation text-base sm:text-lg"
                >
                  🎥 Cho phép truy cập camera
                </button>

                <button
                  onClick={() => setShowManualInput(true)}
                  className="w-full bg-white/10 active:bg-white/20 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-semibold transition-all duration-200 border border-white/20 active:scale-95 touch-manipulation text-sm sm:text-lg"
                >
                  ⌨️ Nhập 6 số thủ công
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
            <div className="text-center py-4 sm:py-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-white text-lg sm:text-xl">⌨️</span>
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Nhập mã thủ công</h4>
              <div className="space-y-3 sm:space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Nhập 6 số..."
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 sm:py-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm text-center text-xl sm:text-2xl font-mono tracking-widest"
                    maxLength={6}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    autoFocus
                  />
                  <div className="absolute top-2 right-3">
                    <span className="text-xs text-white/40">6 số</span>
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

              {/* QR Scanner Container - Performance Optimized */}
              <div className="relative flex-1 min-h-0 max-h-[60vh] sm:max-h-[70vh]">
                <div
                  id="qr-scanner-container"
                  className="w-full h-full rounded-lg sm:rounded-2xl overflow-hidden border border-white/20 shadow-2xl qr-scanner-custom bg-black/50"
                  style={{
                    minHeight: '250px',
                    maxHeight: '60vh',
                    transform: 'translateZ(0)', // Hardware acceleration
                    willChange: 'transform' // Optimize for animations
                  }}
                />



                {/* Mobile Scanning overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-3 sm:inset-4 border-2 border-white/40 rounded-lg">
                    {/* Corner indicators - Mobile optimized */}
                    <div className="absolute top-0 left-0 w-4 h-4 sm:w-6 sm:h-6 border-t-3 border-l-3 sm:border-t-4 sm:border-l-4 border-purple-400 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 sm:w-6 sm:h-6 border-t-3 border-r-3 sm:border-t-4 sm:border-r-4 border-purple-400 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 sm:w-6 sm:h-6 border-b-3 border-l-3 sm:border-b-4 sm:border-l-4 border-purple-400 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 sm:w-6 sm:h-6 border-b-3 border-r-3 sm:border-b-4 sm:border-r-4 border-purple-400 rounded-br-lg"></div>
                  </div>

                  {/* Scanning line animation */}
                  <div className="absolute inset-3 sm:inset-4 flex items-center justify-center">
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-pulse"></div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                  <p className="text-red-300 text-sm text-center">{error}</p>
                </div>
              )}

              {/* Manual input option - Mobile optimized */}
              <div className="text-center">
                <button
                  onClick={() => setShowManualInput(true)}
                  className="text-white/70 hover:text-white text-sm sm:text-base underline transition-colors touch-manipulation py-2"
                >
                  Không quét được? Nhập 6 số →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Compact on mobile */}
        <div className="p-3 sm:p-6 border-t border-white/10 bg-gradient-to-r from-purple-900/50 to-blue-900/50 safe-area-bottom">
          <div className="text-center space-y-1 sm:space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-lg sm:text-2xl">💡</span>
              <p className="text-white/80 font-medium text-sm sm:text-base">Mẹo quét QR hiệu quả</p>
            </div>
            <div className="text-white/60 text-xs sm:text-sm space-y-0.5 sm:space-y-1">
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
