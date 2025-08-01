import React, { useState } from 'react';
import LoginForm from '../components/LoginForm';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import MexcBackground from '../components/MexcBackground';

const LoginPage: React.FC = () => {
  const { username, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // Get location object
  const [loginError, setLoginError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!isLoading && username) {
      // If already logged in, redirect to the 'from' path or home
      const from = location.state?.from || '/';
      navigate(from, { replace: true });
    }
  }, [username, isLoading, navigate, location.state]); // Add location.state to dependencies

  const handleLogin = async (telegramUsername: string, mexcUID: string) => {
    setLoginError(null);
    try {
      await login(telegramUsername, mexcUID);
      // After successful login, the useEffect will handle navigation
    } catch (error: unknown) {
      console.error('Login failed:', error);
      if (error instanceof Error) {
        setLoginError(error.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
      } else {
        setLoginError('Đăng nhập thất bại. Vui lòng thử lại.');
      }
    }
  };

  if (isLoading) {
    return (
      <MexcBackground>
        <div className="flex items-center justify-center min-h-screen text-white">
          Loading authentication...
        </div>
      </MexcBackground>
    );
  }

  return (
    <MexcBackground>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md bg-gray-900/70 backdrop-blur-sm rounded-xl p-8 shadow-2xl border border-gray-700/50">
          <h2 className="text-3xl font-bold text-white text-center mb-6">Đăng nhập</h2>
          {loginError && (
            <div className="bg-red-500/20 text-red-300 p-3 rounded-lg mb-4 text-sm text-center">
              {loginError}
            </div>
          )}
          <LoginForm onLogin={handleLogin} />
        </div>
      </div>
    </MexcBackground>
  );
};

export default LoginPage;
