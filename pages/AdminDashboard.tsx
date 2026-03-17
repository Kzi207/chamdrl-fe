import React, { useState, useEffect } from 'react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { Shield, Users, Activity, Server, Settings, LogOut, Home, Database, Eye, Lock, Unlock, Globe } from 'lucide-react';
import { adminLogout, isAdminLoggedIn, getAdminSession, adminFetch } from '../services/adminAuth';
import configData from '../config.json';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalAccess: number;
  todayAccess: number;
}

interface AccessLog {
  id: number;
  username: string;
  role: string;
  action: string;
  timestamp: string;
  ip?: string;
  userAgent?: string;
}

interface SystemUser {
  id: number;
  username: string;
  role: string;
  name: string;
  email?: string;
  lastLogin?: string;
  createdAt: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalAccess: 0,
    todayAccess: 0,
  });
  const [recentLogs, setRecentLogs] = useState<AccessLog[]>([]);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const adminSession = getAdminSession();

  useEffect(() => {
    // Kiểm tra đăng nhập
    if (!isAdminLoggedIn()) {
      navigate('/admin/login');
      return;
    }

    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load stats
      const statsRes = await adminFetch('/admin-api/stats');
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.data);
      }

      // Load recent logs
      const logsRes = await adminFetch('/admin-api/logs?limit=10');
      const logsData = await logsRes.json();
      if (logsData.success) {
        setRecentLogs(logsData.data);
      }

      // Load users
      const usersRes = await adminFetch('/admin-api/users');
      const usersData = await usersRes.json();
      if (usersData.success) {
        setUsers(usersData.data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login');
  };

  const isOnSubPage = location.pathname !== '/admin/dashboard';

  // Nếu đang ở sub-page, render Outlet
  if (isOnSubPage) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <Shield className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-white text-xl font-bold">Admin Portal</h1>
                <p className="text-purple-100 text-xs">Hệ thống quản trị</p>
              </div>
            </div>

            {/* User Info & Actions */}
            <div className="flex items-center gap-4">
              <div className="hidden md:block text-right">
                <div className="text-white text-sm font-medium">{adminSession?.username}</div>
                <div className="text-purple-100 text-xs">Administrator</div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          <Link
            to="/admin/panel"
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 border-2 border-transparent hover:border-purple-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Server className="text-orange-600" size={24} />
              </div>
            </div>
            <h3 className="font-bold text-gray-800">Bảo trì</h3>
            <p className="text-gray-600 text-sm mt-1">Quản lý chế độ bảo trì</p>
          </Link>

          <Link
            to="/admin/users"
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 border-2 border-transparent hover:border-blue-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="text-blue-600" size={24} />
              </div>
            </div>
            <h3 className="font-bold text-gray-800">Người dùng</h3>
            <p className="text-gray-600 text-sm mt-1">Quản lý tài khoản</p>
          </Link>

          <Link
            to="/admin/logs"
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 border-2 border-transparent hover:border-green-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-green-100 p-3 rounded-lg">
                <Activity className="text-green-600" size={24} />
              </div>
            </div>
            <h3 className="font-bold text-gray-800">Nhật ký</h3>
            <p className="text-gray-600 text-sm mt-1">Xem logs truy cập</p>
          </Link>

          <Link
            to="/admin/backup"
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 border-2 border-transparent hover:border-indigo-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-indigo-100 p-3 rounded-lg">
                <Database className="text-indigo-600" size={24} />
              </div>
            </div>
            <h3 className="font-bold text-gray-800">Backup</h3>
            <p className="text-gray-600 text-sm mt-1">Sao lưu & khôi phục</p>
          </Link>

          <Link
            to="/admin/security"
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 border-2 border-transparent hover:border-red-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-red-100 p-3 rounded-lg">
                <Shield className="text-red-600" size={24} />
              </div>
            </div>
            <h3 className="font-bold text-gray-800">Bảo mật</h3>
            <p className="text-gray-600 text-sm mt-1">IP Blacklist & Tracking</p>
          </Link>

          <Link
            to="/admin/settings"
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 border-2 border-transparent hover:border-purple-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Settings className="text-purple-600" size={24} />
              </div>
            </div>
            <h3 className="font-bold text-gray-800">Cấu hình hệ thống</h3>
            <p className="text-gray-600 text-sm mt-1">Firebase, API & SQL</p>
          </Link>

          <Link
            to="/admin/settings"
            state={{ defaultTab: 'web' }}
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 border-2 border-transparent hover:border-teal-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-teal-100 p-3 rounded-lg">
                <Globe className="text-teal-600" size={24} />
              </div>
            </div>
            <h3 className="font-bold text-gray-800">Cấu hình website</h3>
            <p className="text-gray-600 text-sm mt-1">Thông tin & bảo trì</p>
          </Link>

          <Link
            to="/"
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 border-2 border-transparent hover:border-gray-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-gray-100 p-3 rounded-lg">
                <Home className="text-gray-600" size={24} />
              </div>
            </div>
            <h3 className="font-bold text-gray-800">Trang chủ</h3>
            <p className="text-gray-600 text-sm mt-1">Về trang chính</p>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white/20 p-3 rounded-lg">
                <Users size={24} />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{stats.totalUsers}</div>
              </div>
            </div>
            <div className="text-blue-100 text-sm font-medium">Tổng người dùng</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white/20 p-3 rounded-lg">
                <Activity size={24} />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{stats.activeUsers}</div>
              </div>
            </div>
            <div className="text-green-100 text-sm font-medium">Đang hoạt động</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white/20 p-3 rounded-lg">
                <Eye size={24} />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{stats.totalAccess}</div>
              </div>
            </div>
            <div className="text-purple-100 text-sm font-medium">Tổng lượt truy cập</div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white/20 p-3 rounded-lg">
                <Database size={24} />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{stats.todayAccess}</div>
              </div>
            </div>
            <div className="text-orange-100 text-sm font-medium">Truy cập hôm nay</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Users className="text-blue-600" size={24} />
                  Người dùng gần đây
                </h2>
                <Link
                  to="/admin/users"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Xem tất cả →
                </Link>
              </div>
            </div>
            <div className="p-6">
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">Đang tải...</div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Chưa có người dùng</div>
              ) : (
                <div className="space-y-3">
                  {users.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Users className="text-blue-600" size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-800 truncate">{user.name}</div>
                        <div className="text-sm text-gray-600 truncate">{user.username}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium text-gray-500 capitalize">{user.role}</div>
                        <div className="text-xs text-gray-400">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('vi-VN') : 'Chưa đăng nhập'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Access Logs */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Activity className="text-green-600" size={24} />
                  Nhật ký truy cập
                </h2>
                <Link
                  to="/admin/logs"
                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  Xem tất cả →
                </Link>
              </div>
            </div>
            <div className="p-6">
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">Đang tải...</div>
              ) : recentLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Chưa có log</div>
              ) : (
                <div className="space-y-3">
                  {recentLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="bg-green-100 p-2 rounded-full mt-1">
                        <Activity className="text-green-600" size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800">
                          <span className="font-bold">{log.username}</span> - {log.action}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(log.timestamp).toLocaleString('vi-VN')}
                        </div>
                      </div>
                      <div className="text-xs font-medium text-gray-400 capitalize">{log.role}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="mt-6 bg-gradient-to-r from-slate-700 to-slate-800 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Database size={24} />
            <h2 className="text-xl font-bold">Thông tin hệ thống</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-slate-300 text-sm mb-1">Website</div>
              <div className="font-semibold">{configData.websiteName}</div>
            </div>
            <div>
              <div className="text-slate-300 text-sm mb-1">Khoa/Phòng</div>
              <div className="font-semibold">{configData.departmentName}</div>
            </div>
            <div>
              <div className="text-slate-300 text-sm mb-1">Trạng thái</div>
              <div className="flex items-center gap-2">
                {configData.maintenance?.enabled ? (
                  <>
                    <Lock size={16} className="text-red-400" />
                    <span className="font-semibold text-red-400">Đang bảo trì</span>
                  </>
                ) : (
                  <>
                    <Unlock size={16} className="text-green-400" />
                    <span className="font-semibold text-green-400">Hoạt động</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
