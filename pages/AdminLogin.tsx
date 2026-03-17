import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, User, Eye, EyeOff, AlertCircle, LogIn } from 'lucide-react';
import { adminLogin, isAdminLoggedIn } from '../services/adminAuth';
import configData from '../config.json';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Nếu đã đăng nhập, chuyển đến dashboard
    if (isAdminLoggedIn()) {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!username || !password) {
      setError('Vui lòng nhập đầy đủ thông tin');
      setIsLoading(false);
      return;
    }

    try {
      const success = await adminLogin(username, password);

      if (success) {
        navigate('/admin/dashboard');
      } else {
        setError('Tên đăng nhập hoặc mật khẩu không đúng');
      }
    } catch (error) {
      setError('Không thể kết nối đến máy chủ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-[10%] w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-[15%] w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-[20%] w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Lock icons floating */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
        <Shield className="absolute top-[10%] left-[15%] text-white animate-pulse" size={60} style={{ animationDuration: '3s' }} />
        <Lock className="absolute top-[60%] right-[20%] text-white animate-pulse" size={50} style={{ animationDuration: '4s', animationDelay: '1s' }} />
        <Shield className="absolute bottom-[15%] left-[25%] text-white animate-pulse" size={55} style={{ animationDuration: '3.5s', animationDelay: '0.5s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-400/20 rounded-full blur-2xl animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 w-20 h-20 rounded-full flex items-center justify-center shadow-2xl ring-4 ring-white/10">
                <Shield className="text-white" size={40} />
              </div>
            </div>
          </div>

          <h1 className="text-4xl font-black text-white mb-2">
            Admin Portal
          </h1>
          <p className="text-purple-200 font-medium">
            Hệ thống quản trị bảo mật
          </p>
        </div>

        {/* Login Form */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-40 transition-opacity"></div>
          
          <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
            {/* Logo hệ thống */}
            <div className="flex justify-center mb-6">
              <Link to="/">
                <img 
                  src={configData.websiteLogo || "/logo_khoaktck_ctut.png"} 
                  alt="Logo" 
                  className="w-36 h-36 object-contain drop-shadow-lg hover:scale-105 transition-transform cursor-pointer"
                />
              </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username */}
              <div>
                <label className="block text-white/90 text-sm font-semibold mb-2">
                  Tên đăng nhập
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="text-white/50" size={20} />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                    placeholder="Nhập tên đăng nhập"
                    autoComplete="username"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-white/90 text-sm font-semibold mb-2">
                  Mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="text-white/50" size={20} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                    placeholder="Nhập mật khẩu"
                    autoComplete="current-password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/50 hover:text-white/80 transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="text-red-300 flex-shrink-0 mt-0.5" size={20} />
                  <p className="text-red-200 text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Đang đăng nhập...
                  </>
                ) : (
                  <>
                    <LogIn size={20} />
                    Đăng nhập
                  </>
                )}
              </button>
            </form>

            {/* Warning */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex items-center gap-2 text-white/60 text-xs">
                <Shield size={14} />
                <span>Khu vực bảo mật - Chỉ dành cho quản trị viên</span>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-purple-200 hover:text-white text-sm font-medium transition-colors"
          >
            ← Quay về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
