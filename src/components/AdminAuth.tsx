import React, { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, Lock } from 'lucide-react';

interface AdminAuthProps {
  children: React.ReactNode;
}

const AdminAuth: React.FC<AdminAuthProps> = ({ children }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Get admin password from environment variable
  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';

  useEffect(() => {
    // Check if already authenticated
    const adminAuth = localStorage.getItem('admin_authenticated');
    const authTimestamp = localStorage.getItem('admin_auth_timestamp');
    
    if (adminAuth === 'true' && authTimestamp) {
      const now = Date.now();
      const authTime = parseInt(authTimestamp);
      const EIGHT_HOURS = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
      
      // Check if authentication is still valid (8 hours)
      if (now - authTime < EIGHT_HOURS) {
        setIsAuthenticated(true);
      } else {
        // Clear expired authentication
        localStorage.removeItem('admin_authenticated');
        localStorage.removeItem('admin_auth_timestamp');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('admin_authenticated', 'true');
      localStorage.setItem('admin_auth_timestamp', Date.now().toString());
    } else {
      setError('Mật khẩu không đúng');
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('admin_auth_timestamp');
    setPassword('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500/30 border-t-purple-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/20 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Admin Access</h2>
            <p className="text-white/70">Nhập mật khẩu để truy cập trang quản trị</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Mật khẩu Admin
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Nhập mật khẩu admin"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3">
                <p className="text-red-300 text-sm text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 touch-manipulation"
            >
              <Lock className="h-5 w-5" />
              <span>Đăng nhập Admin</span>
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-white/50 text-xs">
              Phiên đăng nhập sẽ hết hạn sau 8 giờ
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminAuth;
