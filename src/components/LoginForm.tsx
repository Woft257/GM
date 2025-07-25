import React, { useState } from 'react';
import { User, MessageCircle } from 'lucide-react';

interface LoginFormProps {
  onLogin: (username: string, mexcUID: string) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [mexcUID, setMexcUID] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !/^\d{8}$/.test(mexcUID)) {
      alert('Vui lòng nhập đúng định dạng username và MEXC UID (8 chữ số).');
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate loading
    onLogin(username.trim(), mexcUID);
    setIsLoading(false);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="@username hoặc username"
            className="w-full pl-10 pr-3 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base"
            disabled={isLoading}
          />
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MessageCircle className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={mexcUID}
            onChange={(e) => setMexcUID(e.target.value)}
            placeholder="MEXC UID (8 chữ số)"
            className="w-full pl-10 pr-3 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base"
            disabled={isLoading}
            maxLength={8}
          />
        </div>

        <button
          type="submit"
          disabled={!username.trim() || !/^\d{8}$/.test(mexcUID) || isLoading}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 text-base touch-manipulation"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Đang kết nối...
            </div>
          ) : (
            'Bắt đầu chơi'
          )}
        </button>
      </form>

      <div className="mt-4 text-center text-gray-400 text-xs">
        <p>Quét QR code tại các booth để nhận điểm và tham gia bảng xếp hạng!</p>
      </div>
    </div>
  );
};

export default LoginForm;
