import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScanType } from 'html5-qrcode';
import { Camera, X, AlertCircle, CheckCircle } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (data: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onClose, isOpen }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);


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
        try {
          scannerRef.current.stop();
        } catch (err) {
          console.error('Error stopping scanner:', err);
        }
        scannerRef.current = null;
      }
      // Restore body scroll
      document.body.classList.remove('qr-scanner-open');
    };
  }, [isOpen]);

  // Separate effect for when permission is granted
  useEffect(() => {
    if (hasPermission === true && isOpen && !scannerRef.current) {
      // Ensure DOM is ready
      const timer = setTimeout(() => {
        initializeScanner();
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [hasPermission, isOpen]);

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

      // Clear any existing scanner
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch (err) {
          console.log('Error stopping scanner:', err);
        }
        scannerRef.current = null;
      }

      // Wait for DOM element to be available
      const element = document.getElementById("qr-scanner-container");
      if (!element) {
        console.error('QR scanner container not found, waiting...');
        setTimeout(() => {
          initializeScanner();
        }, 500);
        return;
      }

      // Clear container content
      element.innerHTML = '';

      console.log('Initializing QR scanner with Html5Qrcode...');

      // Create Html5Qrcode instance
      scannerRef.current = new Html5Qrcode("qr-scanner-container");

      // Get camera devices
      const devices = await Html5Qrcode.getCameras();
      console.log('Available cameras:', devices);

      // Prefer back camera
      let cameraId = devices[0]?.id;
      const backCamera = devices.find(device =>
        device.label.toLowerCase().includes('back') ||
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      );
      if (backCamera) {
        cameraId = backCamera.id;
        console.log('Using back camera:', backCamera.label);
      }

      // Start scanning
      await scannerRef.current.start(
        cameraId,
        {
          fps: 5, // Giảm từ 10 xuống 5 để ít lỗi hơn
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText: string) => {
          console.log('QR Code scanned:', decodedText);
          setIsScanning(false);
          onScanSuccess(decodedText);
          handleClose();
        },
        (errorMessage: string) => {
          // Ignore common scan errors that happen during normal scanning
          if (!errorMessage.includes('No QR code found') &&
              !errorMessage.includes('NotFoundException') &&
              !errorMessage.includes('No MultiFormat Readers') &&
              !errorMessage.includes('parse error')) {
            console.warn('QR scan error:', errorMessage);
          }
        }
      );

      console.log('Scanner started successfully');
      setIsScanning(true);



      setIsScanning(true);
    } catch (err) {
      console.error('Scanner initialization error:', err);
      setError('Không thể khởi tạo scanner. Vui lòng thử lại.');
    }
  };

  const handleClose = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.stop();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
    setError('');
    setHasPermission(null);
    onClose();
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

    } catch (err) {
      console.error('Camera permission error:', err);
      setHasPermission(false);

      const error = err as Error;
      if (error.name === 'NotAllowedError') {
        setError('Quyền camera bị từ chối. Vui lòng cho phép truy cập camera và tải lại trang.');
      } else if (error.name === 'NotFoundError') {
        setError('Không tìm thấy camera. Vui lòng kiểm tra thiết bị camera.');
      } else if (error.name === 'NotReadableError') {
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

        /* Force video visibility and proper sizing */
        #qr-scanner-container video {
          border-radius: 0.5rem !important;
          width: 100% !important;
          height: 100% !important;
          max-height: none !important;
          max-width: none !important;
          object-fit: cover !important;
          transform: translateZ(0) !important;
          backface-visibility: hidden !important;
          -webkit-backface-visibility: hidden !important;
          background: transparent !important;
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          z-index: 1 !important;
          position: relative !important;
        }

        /* QR Frame overlay styles */
        .qr-frame-overlay {
          z-index: 10 !important;
          pointer-events: none !important;
        }

        /* Ensure scanner container is visible and properly sized */
        #qr-scanner-container {
          background: #000 !important;
          min-height: 300px !important;
          position: relative !important;
          overflow: hidden !important;
        }

        /* Hide all scanner UI except video */
        #qr-scanner-container > div:not([id*="reader"]) {
          display: none !important;
        }

        #qr-scanner-container [id*="reader"] {
          width: 100% !important;
          height: 100% !important;
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

      <div className="fixed inset-0 bg-black z-50 flex flex-col" style={{ touchAction: 'none' }}>
        <div className="flex-1 bg-black overflow-hidden">
        {/* MEXC-style Header */}
        <div className="bg-black border-b border-gray-800">
          <div className="flex items-center justify-between px-3 py-2 safe-area-top">
            <div className="flex items-center space-x-2">
              {/* MEXC x GM Vietnam Collaboration Logo */}
              <img src="/mexc-gm-collaboration-logo.png" alt="MEXC x GM Vietnam" className="h-6" />
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Camera className="h-4 w-4 text-white" />
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-800 rounded-lg transition-all duration-200 active:scale-95 touch-manipulation"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto bg-black">
          {hasPermission === null && (
            <div className="text-center py-8">
              <div className="relative">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500/30 border-t-blue-500 mx-auto mb-4"></div>
              </div>
              <h4 className="text-white font-semibold mb-2 text-lg">Đang khởi tạo camera</h4>
              <p className="text-gray-400 text-sm">Vui lòng chờ trong giây lát...</p>
            </div>
          )}

          {hasPermission === false && (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <h4 className="text-lg font-bold text-white mb-3">Cần quyền truy cập camera</h4>
              <p className="text-gray-400 mb-6 text-sm">
                Để quét QR code, ứng dụng cần quyền truy cập camera của thiết bị
              </p>

              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg mb-4">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={requestCameraPermission}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 active:scale-95 shadow-lg touch-manipulation"
                >
                  🎥 Cho phép truy cập camera
                </button>



                <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-left">
                  <p className="text-blue-400 font-semibold mb-2 text-sm">💡 Hướng dẫn khắc phục:</p>
                  <div className="text-gray-400 text-xs space-y-1">
                    <p>1. Click vào biểu tượng 🔒 trên thanh địa chỉ</p>
                    <p>2. Chọn "Cho phép Camera"</p>
                    <p>3. Tải lại trang và thử lại</p>
                  </div>
                </div>
              </div>
            </div>
          )}



          {hasPermission === true && (
            <div className="space-y-4">
              {isScanning && (
                <div className="text-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center mx-auto mb-3 animate-pulse">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="text-white font-semibold mb-2 text-lg">Camera đã sẵn sàng</h4>
                  <p className="text-gray-400 text-sm">
                    Đưa QR code vào khung hình để quét tự động
                  </p>
                </div>
              )}

              {/* QR Scanner Container - Fixed for video display */}
              <div className="relative flex-1 min-h-0">
                <div
                  id="qr-scanner-container"
                  className="w-full h-full rounded-lg overflow-hidden border border-gray-700 shadow-2xl bg-black"
                  style={{
                    minHeight: '300px',
                    height: '400px',
                    maxHeight: '60vh'
                  }}
                />



                {/* QR Scanning Frame Overlay */}
                <div className="absolute inset-0 pointer-events-none qr-frame-overlay">
                  {/* Dark overlay with transparent center */}
                  <div className="absolute inset-0 bg-black/50">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-72 sm:h-72">
                      {/* Transparent center for QR scanning */}
                      <div className="w-full h-full bg-transparent border-2 border-gray-400 rounded-lg relative">
                        {/* Corner brackets */}
                        <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
                        <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                        <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>

                        {/* Scanning line animation */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-pulse opacity-80"></div>
                        </div>

                        {/* Center crosshair */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                          <div className="w-6 h-6 border-2 border-blue-500 rounded-full bg-blue-500/20"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="absolute bottom-4 left-0 right-0 text-center">
                    <div className="bg-black/80 rounded-lg px-4 py-2 mx-4 border border-gray-800">
                      <p className="text-white text-sm font-medium">Đưa QR code vào khung vuông</p>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-300 text-sm text-center">{error}</p>
                </div>
              )}

              {/* Manual input option - Mobile optimized */}

            </div>
          )}
        </div>


      </div>
    </div>
    </>
  );
};

export default QRScanner;
