import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Database, Cloud, History, Shield, Server, LogOut, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import { isAdminLoggedIn } from '../../services/adminAuth';
import { getApiUrl } from '../../services/storage';

const API_BASE = getApiUrl();

const BackupHome: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  
  // Check if in admin portal
  const isInAdminPortal = location.pathname.startsWith('/admin');

  useEffect(() => {
    // If in admin portal, use admin authentication
    if (isInAdminPortal) {
      if (isAdminLoggedIn()) {
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    } else {
      // Check regular authentication
      const user = localStorage.getItem('user');
      if (user) {
        try {
          const parsed = JSON.parse(user);
          if (parsed.role === 'admin') {
            setIsAuthenticated(true);
          }
        } catch {}
      }
      setIsLoading(false);
    }

    // Check server status
    checkServerStatus();
  }, [isInAdminPortal]);

  const checkServerStatus = async () => {
    setServerStatus('checking');
    try {
      const res = await fetch(`${API_BASE}/backup/list`);
      if (res.ok) {
        setServerStatus('online');
      } else {
        setServerStatus('offline');
      }
    } catch {
      setServerStatus('offline');
    }
  };

  const handleLogout = () => {
    if (isInAdminPortal) {
      navigate('/admin/dashboard');
    } else {
      localStorage.removeItem('user');
      setIsAuthenticated(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Đang tải...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (isInAdminPortal) {
      navigate('/admin/login');
      return null;
    }
    return <BackupLogin onSuccess={() => setIsAuthenticated(true)} />;
  }

  const basePath = isInAdminPortal ? '/admin/backup' : '/backup';

  const features = [
    {
      title: 'Backup Local',
      description: 'Tạo và quản lý các bản sao lưu trên server local',
      icon: Server,
      color: 'from-blue-500 to-blue-700',
      link: `${basePath}/local`,
      badge: 'Cơ bản'
    },
    {
      title: 'Google Sheet Cloud',
      description: 'Sao lưu và khôi phục từ Google Sheet trên đám mây',
      icon: Cloud,
      color: 'from-green-500 to-green-700',
      link: `${basePath}/cloud`,
      badge: 'Đám mây'
    },
    {
      title: 'Khôi Phục Nhanh',
      description: 'Khôi phục database về trạng thái trước đó',
      icon: History,
      color: 'from-orange-500 to-orange-700',
      link: `${basePath}/restore`,
      badge: 'Khẩn cấp'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-6 py-4">
          {isInAdminPortal && (
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 mb-4 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Quay lại Dashboard</span>
            </Link>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Database className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Backup Manager</h1>
                <p className="text-xs text-slate-400">Hệ thống sao lưu & khôi phục</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Server Status */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 rounded-full">
                {serverStatus === 'checking' && (
                  <>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-slate-300">Đang kiểm tra...</span>
                  </>
                )}
                {serverStatus === 'online' && (
                  <>
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-xs text-green-400">Server Online</span>
                  </>
                )}
                {serverStatus === 'offline' && (
                  <>
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span className="text-xs text-red-400">Server Offline</span>
                  </>
                )}
              </div>

              {!isInAdminPortal && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
                >
                  <LogOut size={16} />
                  <span className="text-sm">Đăng xuất</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 rounded-full text-sm mb-4">
            <Shield size={16} />
            <span>Khu vực Admin</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">
            Trung Tâm Quản Lý Backup
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Sao lưu và khôi phục dữ liệu database một cách an toàn. 
            Chọn một tính năng bên dưới để bắt đầu.
          </p>
        </div>

        {/* Server Warning */}
        {serverStatus === 'offline' && (
          <div className="mb-8 p-4 bg-red-900/30 border border-red-700 rounded-xl flex items-center gap-3">
            <AlertTriangle className="text-red-400 shrink-0" size={24} />
            <div>
              <h3 className="text-red-400 font-bold">Server không hoạt động</h3>
              <p className="text-red-300/70 text-sm">
                Không thể kết nối đến server backup (port 3004). Vui lòng khởi động server trước khi sử dụng.
              </p>
            </div>
            <button
              onClick={checkServerStatus}
              className="ml-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <Link
              key={index}
              to={feature.link}
              className="group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 hover:border-slate-600 transition-all duration-300 hover:transform hover:scale-[1.02]"
            >
              {/* Badge */}
              <span className="absolute top-4 right-4 px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded-full">
                {feature.badge}
              </span>

              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="text-white" size={28} />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm">{feature.description}</p>

              {/* Arrow */}
              <div className="mt-4 flex items-center text-blue-400 text-sm font-medium group-hover:text-blue-300">
                <span>Truy cập</span>
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle size={20} className="text-green-400" />
            Hướng dẫn nhanh
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-slate-800/50 rounded-xl">
              <div className="text-blue-400 font-bold mb-1">1. Backup thường xuyên</div>
              <p className="text-slate-400">Tạo backup local trước khi thực hiện các thay đổi lớn</p>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-xl">
              <div className="text-green-400 font-bold mb-1">2. Lưu trữ đám mây</div>
              <p className="text-slate-400">Sử dụng Google Sheet để lưu backup quan trọng</p>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-xl">
              <div className="text-orange-400 font-bold mb-1">3. Khôi phục khi cần</div>
              <p className="text-slate-400">Restore nhanh khi database gặp sự cố</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-6 text-center text-slate-500 text-sm">
          <p>Backup Manager v1.0 - Hệ thống sao lưu dữ liệu</p>
          <p className="mt-1">⚠️ Trang này chỉ dành cho quản trị viên</p>
        </div>
      </footer>
    </div>
  );
};

// Login Component cho Backup
const BackupLogin: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        throw new Error('Sai tên đăng nhập hoặc mật khẩu');
      }

      const user = await res.json();
      
      if (user.role !== 'admin') {
        throw new Error('Chỉ admin mới có quyền truy cập');
      }

      localStorage.setItem('user', JSON.stringify(user));
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Database className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">Backup Manager</h1>
          <p className="text-slate-400 text-sm mt-1">Đăng nhập với tài khoản Admin</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg flex items-center gap-2 text-red-400 text-sm">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Tên đăng nhập
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="admin"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Mật khẩu
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </div>
        </form>

        <p className="text-center text-slate-500 text-xs mt-6">
          🔒 Chỉ admin mới có quyền truy cập khu vực này
        </p>
      </div>
    </div>
  );
};

export default BackupHome;
