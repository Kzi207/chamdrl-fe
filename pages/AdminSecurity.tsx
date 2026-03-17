import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Ban, Trash2, RefreshCw, AlertTriangle, CheckCircle, Activity, Eye, UserX, ArrowLeft, UserCheck } from 'lucide-react';
import { isAdminLoggedIn, adminFetch } from '../services/adminAuth';

interface BlacklistedIP {
  ip: string;
  reason: string;
  timestamp: string;
  requestCount: number;
}

interface WhitelistedIP {
  ip: string;
  reason: string;
  timestamp: string;
}

interface IPTracker {
  ip: string;
  totalRequests: number;
  recentRequests: number;
  firstSeen: string;
  lastSeen: string;
}

const AdminSecurity: React.FC = () => {
  const navigate = useNavigate();
  const [blacklist, setBlacklist] = useState<BlacklistedIP[]>([]);
  const [whitelist, setWhitelist] = useState<WhitelistedIP[]>([]);
  const [ipTracking, setIpTracking] = useState<IPTracker[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'blacklist' | 'whitelist' | 'tracking'>('blacklist');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [newBanIP, setNewBanIP] = useState('');
  const [newBanReason, setNewBanReason] = useState('');
  const [newWhitelistIP, setNewWhitelistIP] = useState('');
  const [newWhitelistReason, setNewWhitelistReason] = useState('');

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      navigate('/admin/login');
      return;
    }
    
    loadData();
  }, [navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load blacklist
      const blacklistRes = await adminFetch('/admin-api/blacklist');
      const blacklistData = await blacklistRes.json();
      if (blacklistData.success) {
        setBlacklist(blacklistData.data);
      }

      // Load whitelist
      const whitelistRes = await adminFetch('/admin-api/whitelist');
      const whitelistData = await whitelistRes.json();
      if (whitelistData.success) {
        setWhitelist(whitelistData.data);
      }

      // Load IP tracking
      const trackingRes = await adminFetch('/admin-api/ip-tracking');
      const trackingData = await trackingRes.json();
      if (trackingData.success) {
        setIpTracking(trackingData.data);
      }
    } catch (error) {
      console.error('Error loading security data:', error);
      showMessage('error', 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleUnban = async (ip: string) => {
    if (!confirm(`Xác nhận unban IP: ${ip}?`)) return;

    try {
      const res = await adminFetch('/admin-api/blacklist/unban', {
        method: 'POST',
        body: JSON.stringify({ ip })
      });
      const data = await res.json();
      
      if (data.success) {
        showMessage('success', `Đã unban IP ${ip}`);
        loadData();
      } else {
        showMessage('error', data.error || 'Không thể unban IP');
      }
    } catch (error) {
      showMessage('error', 'Lỗi khi unban IP');
    }
  };

  const handleBanIP = async () => {
    if (!newBanIP.trim()) {
      showMessage('error', 'Vui lòng nhập địa chỉ IP');
      return;
    }

    try {
      const res = await adminFetch('/admin-api/blacklist/ban', {
        method: 'POST',
        body: JSON.stringify({ 
          ip: newBanIP.trim(), 
          reason: newBanReason.trim() || 'Manually banned by admin' 
        })
      });
      const data = await res.json();
      
      if (data.success) {
        showMessage('success', `Đã ban IP ${newBanIP}`);
        setNewBanIP('');
        setNewBanReason('');
        loadData();
      } else {
        showMessage('error', data.error || 'Không thể ban IP');
      }
    } catch (error) {
      showMessage('error', 'Lỗi khi ban IP');
    }
  };

  const handleClearBlacklist = async () => {
    if (!confirm('Xác nhận xóa toàn bộ danh sách IP bị chặn?')) return;

    try {
      const res = await adminFetch('/admin-api/blacklist/clear', {
        method: 'POST'
      });
      const data = await res.json();
      
      if (data.success) {
        showMessage('success', 'Đã xóa toàn bộ blacklist');
        loadData();
      } else {
        showMessage('error', data.error || 'Không thể xóa blacklist');
      }
    } catch (error) {
      showMessage('error', 'Lỗi khi xóa blacklist');
    }
  };

  const handleClearTracking = async () => {
    if (!confirm('Xác nhận xóa toàn bộ dữ liệu tracking?')) return;

    try {
      const res = await adminFetch('/admin-api/ip-tracking/clear', {
        method: 'POST'
      });
      const data = await res.json();
      
      if (data.success) {
        showMessage('success', 'Đã xóa toàn bộ IP tracking');
        loadData();
      } else {
        showMessage('error', data.error || 'Không thể xóa tracking');
      }
    } catch (error) {
      showMessage('error', 'Lỗi khi xóa tracking');
    }
  };

  const handleAddWhitelist = async () => {
    if (!newWhitelistIP.trim()) {
      showMessage('error', 'Vui lòng nhập địa chỉ IP');
      return;
    }

    try {
      const res = await adminFetch('/admin-api/whitelist/add', {
        method: 'POST',
        body: JSON.stringify({ 
          ip: newWhitelistIP.trim(), 
          reason: newWhitelistReason.trim() || 'Whitelisted by admin' 
        })
      });
      const data = await res.json();
      
      if (data.success) {
        showMessage('success', `Đã thêm IP ${newWhitelistIP} vào whitelist`);
        setNewWhitelistIP('');
        setNewWhitelistReason('');
        loadData();
      } else {
        showMessage('error', data.error || 'Không thể thêm IP');
      }
    } catch (error) {
      showMessage('error', 'Lỗi khi thêm IP');
    }
  };

  const handleRemoveWhitelist = async (ip: string) => {
    if (!confirm(`Xác nhận xóa IP ${ip} khỏi whitelist?`)) return;

    try {
      const res = await adminFetch('/admin-api/whitelist/remove', {
        method: 'POST',
        body: JSON.stringify({ ip })
      });
      const data = await res.json();
      
      if (data.success) {
        showMessage('success', `Đã xóa IP ${ip} khỏi whitelist`);
        loadData();
      } else {
        showMessage('error', data.error || 'Không thể xóa IP');
      }
    } catch (error) {
      showMessage('error', 'Lỗi khi xóa IP');
    }
  };

  const handleClearWhitelist = async () => {
    if (!confirm('Xác nhận xóa toàn bộ whitelist?')) return;

    try {
      const res = await adminFetch('/admin-api/whitelist/clear', {
        method: 'POST'
      });
      const data = await res.json();
      
      if (data.success) {
        showMessage('success', 'Đã xóa toàn bộ whitelist');
        loadData();
      } else {
        showMessage('error', data.error || 'Không thể xóa whitelist');
      }
    } catch (error) {
      showMessage('error', 'Lỗi khi xóa whitelist');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Quay lại Dashboard</span>
        </Link>

        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl shadow-xl p-8 mb-6 text-white">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
              <Shield size={40} />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Bảo Mật & IP Blacklist</h1>
              <p className="text-white/90">Quản lý IP bị chặn và theo dõi truy cập</p>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl border-2 flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle size={24} className="text-green-600" />
            ) : (
              <AlertTriangle size={24} className="text-red-600" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('blacklist')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'blacklist'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Ban size={20} />
                <span>IP Bị Chặn ({blacklist.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('whitelist')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'whitelist'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <UserCheck size={20} />
                <span>IP Miễn Trừ ({whitelist.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('tracking')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'tracking'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Activity size={20} />
                <span>Tracking ({ipTracking.length})</span>
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <RefreshCw size={48} className="animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Đang tải dữ liệu...</p>
          </div>
        ) : (
          <>
            {/* Blacklist Tab */}
            {activeTab === 'blacklist' && (
              <div className="space-y-6">
                {/* Ban IP Form */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <UserX size={20} />
                    Chặn IP Thủ Công
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      value={newBanIP}
                      onChange={(e) => setNewBanIP(e.target.value)}
                      placeholder="Địa chỉ IP (VD: 192.168.1.1)"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    />
                    <input
                      type="text"
                      value={newBanReason}
                      onChange={(e) => setNewBanReason(e.target.value)}
                      placeholder="Lý do chặn (tùy chọn)"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    />
                    <button
                      onClick={handleBanIP}
                      className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      Chặn IP
                    </button>
                  </div>
                </div>

                {/* Blacklist Table */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-800">Danh Sách IP Bị Chặn</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={loadData}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <RefreshCw size={16} />
                        Làm mới
                      </button>
                      {blacklist.length > 0 && (
                        <button
                          onClick={handleClearBlacklist}
                          className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <Trash2 size={16} />
                          Xóa tất cả
                        </button>
                      )}
                    </div>
                  </div>

                  {blacklist.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                      <Eye size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>Không có IP nào bị chặn</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              IP Address
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Lý do
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Số request
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Thời gian
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Thao tác
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {blacklist.map((item) => (
                            <tr key={item.ip} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="font-mono text-sm font-semibold text-gray-900">
                                  {item.ip}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm text-gray-600">{item.reason}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm text-gray-600">{item.requestCount || 'N/A'}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {formatDate(item.timestamp)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <button
                                  onClick={() => handleUnban(item.ip)}
                                  className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium transition-colors"
                                >
                                  Unban
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Whitelist Tab */}
            {activeTab === 'whitelist' && (
              <div className="space-y-6">
                {/* Add Whitelist Form */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <UserCheck size={20} />
                    Thêm IP Miễn Trừ Rate Limiting
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      value={newWhitelistIP}
                      onChange={(e) => setNewWhitelistIP(e.target.value)}
                      placeholder="Địa chỉ IP (VD: 192.168.1.1)"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    />
                    <input
                      type="text"
                      value={newWhitelistReason}
                      onChange={(e) => setNewWhitelistReason(e.target.value)}
                      placeholder="Lý do miễn trừ (tùy chọn)"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    />
                    <button
                      onClick={handleAddWhitelist}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      Thêm Whitelist
                    </button>
                  </div>
                </div>

                {/* Whitelist Table */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-800">Danh Sách IP Miễn Trừ</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={loadData}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <RefreshCw size={16} />
                        Làm mới
                      </button>
                      {whitelist.length > 0 && (
                        <button
                          onClick={handleClearWhitelist}
                          className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <Trash2 size={16} />
                          Xóa tất cả
                        </button>
                      )}
                    </div>
                  </div>

                  {whitelist.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                      <UserCheck size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>Không có IP nào trong whitelist</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              IP Address
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Lý do
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Thời gian
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Thao tác
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {whitelist.map((item) => (
                            <tr key={item.ip} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="font-mono text-sm font-semibold text-green-900">
                                  {item.ip}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm text-gray-600">{item.reason}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {formatDate(item.timestamp)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <button
                                  onClick={() => handleRemoveWhitelist(item.ip)}
                                  className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
                                >
                                  Xóa
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* IP Tracking Tab */}
            {activeTab === 'tracking' && (
              <div className="space-y-6">
                {/* Tracking Stats */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <Activity size={20} />
                      Thống Kê Tracking
                    </h3>
                    <button
                      onClick={handleClearTracking}
                      className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg flex items-center gap-2 transition-colors text-sm"
                    >
                      <Trash2 size={16} />
                      Xóa dữ liệu
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-blue-600 text-sm font-medium mb-1">Tổng IP</div>
                      <div className="text-2xl font-bold text-blue-900">{ipTracking.length}</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-green-600 text-sm font-medium mb-1">Tổng Requests</div>
                      <div className="text-2xl font-bold text-green-900">
                        {ipTracking.reduce((sum, t) => sum + t.totalRequests, 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="text-orange-600 text-sm font-medium mb-1">Giới hạn</div>
                      <div className="text-2xl font-bold text-orange-900">20 req/s</div>
                    </div>
                  </div>
                </div>

                {/* Tracking Table */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-800">Top 100 IP Addresses</h3>
                    <button
                      onClick={loadData}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <RefreshCw size={16} />
                      Làm mới
                    </button>
                  </div>

                  {ipTracking.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                      <Activity size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>Chưa có dữ liệu tracking</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              IP Address
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tổng Requests
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Requests Gần Đây
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Lần Đầu
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Lần Cuối
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {ipTracking.map((tracker) => (
                            <tr key={tracker.ip} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="font-mono text-sm font-semibold text-gray-900">
                                  {tracker.ip}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm font-medium text-gray-900">
                                  {tracker.totalRequests.toLocaleString()}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`text-sm font-medium ${
                                  tracker.recentRequests > 15 ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                  {tracker.recentRequests}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {formatDate(tracker.firstSeen)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {formatDate(tracker.lastSeen)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex gap-3">
            <AlertTriangle className="text-blue-600 flex-shrink-0" size={24} />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-2">Hệ Thống Rate Limiting:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Giới hạn: <strong>20 requests/giây</strong> cho mỗi IP</li>
                <li>IP vượt quá giới hạn sẽ tự động bị chặn</li>
                <li>IP trong <strong>Whitelist</strong> được miễn trừ rate limiting</li>
                <li>Thêm IP vào whitelist sẽ tự động gỡ chặn nếu IP đang bị ban</li>
                <li>Admin API và static files không bị giới hạn</li>
                <li>Dữ liệu tracking được lưu trong memory (mất khi restart server)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSecurity;
