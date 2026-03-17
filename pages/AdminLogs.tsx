import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Search, ArrowLeft, RefreshCw, Trash2, Shield, Users, Award, Settings, Clock, MapPin } from 'lucide-react';
import { isAdminLoggedIn, adminFetch } from '../services/adminAuth';

interface AccessLog {
  id: number;
  username: string;
  role: string;
  action: string;
  category: string;
  location: string;
  timestamp: string;
  ip?: string;
  userAgent?: string;
}

type Tab = 'all' | 'access' | 'account' | 'drl' | 'system';

const TAB_CONFIG: { key: Tab; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'all',     label: 'Tất cả',     icon: <Activity size={14}/>,  color: 'text-gray-600' },
  { key: 'access',  label: 'Truy cập',   icon: <Shield size={14}/>,    color: 'text-green-600' },
  { key: 'account', label: 'TK / MK',    icon: <Users size={14}/>,     color: 'text-blue-600' },
  { key: 'drl',     label: 'Điểm RL',    icon: <Award size={14}/>,     color: 'text-purple-600' },
  { key: 'system',  label: 'Hệ thống',   icon: <Settings size={14}/>,  color: 'text-orange-600' },
];

const ACTION_COLOR: [string, string][] = [
  ['Đăng nhập', 'bg-green-100 text-green-800'],
  ['Đăng xuất', 'bg-gray-100 text-gray-700'],
  ['Đổi mật khẩu', 'bg-yellow-100 text-yellow-800'],
  ['Reset mật khẩu', 'bg-yellow-100 text-yellow-800'],
  ['Tạo', 'bg-indigo-100 text-indigo-800'],
  ['Cập nhật', 'bg-blue-100 text-blue-800'],
  ['Xóa', 'bg-red-100 text-red-800'],
  ['Lưu điểm', 'bg-purple-100 text-purple-800'],
  ['Dọn nhật ký', 'bg-rose-100 text-rose-800'],
];

function badgeColor(action: string) {
  for (const [k, c] of ACTION_COLOR) if (action.includes(k)) return c;
  return 'bg-gray-100 text-gray-700';
}

function fmtTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'medium' });
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60000) return 'vừa xong';
  if (diff < 3600000) return `${Math.floor(diff/60000)} phút trước`;
  if (diff < 86400000) return `${Math.floor(diff/3600000)} giờ trước`;
  return `${Math.floor(diff/86400000)} ngày trước`;
}

const CLEANUP_OPTIONS = [
  { label: '7 ngày', days: 7 },
  { label: '14 ngày', days: 14 },
  { label: '30 ngày', days: 30 },
  { label: '60 ngày', days: 60 },
  { label: '90 ngày', days: 90 },
];

const AdminLogs: React.FC = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [cleanupDays, setCleanupDays] = useState(30);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanMsg, setCleanMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminFetch('/admin-api/logs?limit=2000');
      const data = await res.json();
      if (data.success) setLogs(data.data);
    } catch { /* silent */ } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdminLoggedIn()) { navigate('/admin/login'); return; }
    loadLogs();
  }, [navigate, loadLogs]);

  const filtered = useMemo(() => {
    let r = activeTab === 'all' ? logs : logs.filter(l => l.category === activeTab);

    if (search) {
      const q = search.toLowerCase();
      r = r.filter(l =>
        l.username.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.location?.toLowerCase().includes(q) ||
        l.ip?.toLowerCase().includes(q)
      );
    }

    if (dateFilter !== 'all') {
      const now = Date.now();
      const msMap: Record<string, number> = {
        today: 86400000,
        week: 7 * 86400000,
        month: 30 * 86400000,
      };
      const ms = msMap[dateFilter];
      if (ms) r = r.filter(l => now - new Date(l.timestamp).getTime() < ms);
    }

    return r;
  }, [logs, activeTab, search, dateFilter]);

  const tabCounts = useMemo(() => {
    const m: Record<string, number> = { all: logs.length };
    for (const l of logs) m[l.category] = (m[l.category] || 0) + 1;
    return m;
  }, [logs]);

  const handleCleanup = async () => {
    if (!confirm(`Xóa toàn bộ nhật ký cũ hơn ${cleanupDays} ngày?`)) return;
    setIsCleaning(true); setCleanMsg(null);
    try {
      const res = await adminFetch(`/admin-api/logs/cleanup?days=${cleanupDays}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setCleanMsg({ ok: true, text: `Đã xóa ${data.deleted} bản ghi. Còn lại: ${data.remaining}` });
        loadLogs();
      } else throw new Error(data.error);
    } catch (e: any) {
      setCleanMsg({ ok: false, text: e.message || 'Lỗi khi dọn nhật ký' });
    } finally {
      setIsCleaning(false);
      setTimeout(() => setCleanMsg(null), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <Link to="/admin/dashboard" className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <Activity size={20} className="text-green-600" />
          <h1 className="text-xl font-bold text-gray-800">Nhật Ký Hệ Thống</h1>
          <span className="ml-1 px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full text-xs font-semibold">{logs.length}</span>
          <button onClick={loadLogs} disabled={isLoading} className="ml-auto p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1 mb-4 overflow-x-auto">
          {TAB_CONFIG.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === t.key
                  ? 'bg-gray-100 text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className={activeTab === t.key ? t.color : ''}>{t.icon}</span>
              {t.label}
              <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                {tabCounts[t.key] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm username, hành động, IP, vị trí..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
          <select
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white"
          >
            <option value="all">Tất cả thời gian</option>
            <option value="today">Hôm nay</option>
            <option value="week">7 ngày qua</option>
            <option value="month">30 ngày qua</option>
          </select>
          <span className="flex items-center text-sm text-gray-500 px-2">
            {filtered.length} / {logs.length} bản ghi
          </span>
        </div>

        {/* Log Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
              <RefreshCw size={20} className="animate-spin" /> Đang tải...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-14 text-gray-400">
              <Activity size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Không có nhật ký nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-3 text-left font-semibold w-36">Thời gian</th>
                    <th className="px-4 py-3 text-left font-semibold w-32">Người dùng</th>
                    <th className="px-4 py-3 text-left font-semibold">Hành động</th>
                    <th className="px-4 py-3 text-left font-semibold w-32">Vị trí</th>
                    <th className="px-4 py-3 text-left font-semibold w-32">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1 text-gray-700 font-mono text-xs">
                          <Clock size={11} className="text-gray-400 flex-shrink-0" />
                          {fmtTime(log.timestamp)}
                        </div>
                        <div className="text-gray-400 text-xs mt-0.5">{timeAgo(log.timestamp)}</div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-gray-800 truncate max-w-[110px]">{log.username}</div>
                        <div className="text-xs text-gray-400 capitalize">{log.role}</div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badgeColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        {log.location ? (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin size={11} className="flex-shrink-0" />
                            <span className="truncate max-w-[100px]">{log.location}</span>
                          </div>
                        ) : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-xs text-gray-500">{log.ip || '—'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Cleanup Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Trash2 size={16} className="text-red-500" />
            <h2 className="font-semibold text-gray-800">Dọn Dẹp Nhật Ký Cũ</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">Xóa các bản ghi nhật ký đã quá cũ để giảm tải bộ nhớ. Hành động này không thể hoàn tác.</p>

          {cleanMsg && (
            <div className={`mb-3 px-3 py-2 rounded-lg text-sm font-medium ${cleanMsg.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {cleanMsg.text}
            </div>
          )}

          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-sm text-gray-600">Xóa nhật ký cũ hơn:</span>
            <div className="flex gap-2 flex-wrap">
              {CLEANUP_OPTIONS.map(opt => (
                <button
                  key={opt.days}
                  onClick={() => setCleanupDays(opt.days)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    cleanupDays === opt.days
                      ? 'bg-red-50 border-red-300 text-red-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleCleanup}
              disabled={isCleaning}
              className="ml-auto flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {isCleaning ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Xóa nhật ký &gt; {cleanupDays} ngày
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminLogs;
