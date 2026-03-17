import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Server, Settings, Lock, Unlock, AlertTriangle, CheckCircle, RefreshCw, Save, ArrowLeft } from 'lucide-react';
import { isAdminLoggedIn, adminFetch } from '../services/adminAuth';
import { loadConfigFromServer } from '../services/storage';
import configData from '../config.json';

interface SystemConfig {
  websiteName: string;
  websiteLogo: string;
  universityName: { line1: string; line2: string };
  departmentName: string;
  contacts: { zalo?: string; facebook?: string; gmail?: string; phone?: string };
  maintenance: { enabled: boolean; allowAccess: boolean };
}

const INPUT_CLS = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm';

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; colorOn?: string }> = ({
  checked, onChange, colorOn = 'bg-green-500',
}) => (
  <button
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${checked ? colorOn : 'bg-gray-300'}`}
  >
    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-8' : 'translate-x-1'}`} />
  </button>
);

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const [cfg, setCfg] = useState<SystemConfig>(configData as SystemConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      const data = await loadConfigFromServer(true);
      if (data) setCfg(data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (!isAdminLoggedIn()) { navigate('/admin/login'); return; }
    loadConfig();
  }, [navigate, loadConfig]);

  const set = (patch: Partial<SystemConfig>) => setCfg(p => ({ ...p, ...patch }));
  const setContact = (k: keyof SystemConfig['contacts'], v: string) =>
    setCfg(p => ({ ...p, contacts: { ...p.contacts, [k]: v } }));
  const setUni = (k: 'line1' | 'line2', v: string) =>
    setCfg(p => ({ ...p, universityName: { ...p.universityName, [k]: v } }));
  const setMaint = (k: 'enabled' | 'allowAccess', v: boolean) =>
    setCfg(p => ({ ...p, maintenance: { ...p.maintenance, [k]: v } }));

  const handleSave = async () => {
    setIsSaving(true); setMsg(null);
    try {
      const res = await adminFetch('/admin-api/config/update', { method: 'POST', body: JSON.stringify(cfg) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Lỗi lưu');
      setMsg({ ok: true, text: 'Đã lưu thành công!' });
      setTimeout(() => loadConfig(), 1000);
      setTimeout(() => setMsg(null), 3000);
    } catch (e: any) {
      setMsg({ ok: false, text: e.message || 'Không thể lưu, thử lại!' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <Link to="/admin/dashboard" className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <Shield size={22} className="text-purple-600" />
            <h1 className="text-xl font-bold text-gray-800">Quản Trị Hệ Thống</h1>
          </div>
          <button onClick={loadConfig} className="ml-auto p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors" title="Tải lại">
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Save Message */}
        {msg && (
          <div className={`mb-4 px-4 py-3 rounded-lg flex items-center gap-2 text-sm font-medium ${msg.ok ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
            {msg.ok ? <CheckCircle size={16} className="text-green-600" /> : <AlertTriangle size={16} className="text-red-600" />}
            {msg.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Bảo Trì */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
              <Server size={18} className="text-orange-500" />
              <h2 className="font-semibold text-gray-800">Chế Độ Bảo Trì</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {cfg.maintenance.enabled
                    ? <Lock size={16} className="text-red-500" />
                    : <Unlock size={16} className="text-green-500" />}
                  <span className="text-sm font-medium text-gray-700">Trạng thái hệ thống</span>
                </div>
                <Toggle
                  checked={cfg.maintenance.enabled}
                  onChange={v => setMaint('enabled', v)}
                  colorOn="bg-red-500"
                />
              </div>
              <p className={`text-xs px-3 py-2 rounded-lg ${cfg.maintenance.enabled ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {cfg.maintenance.enabled ? '🔴 Đang trong chế độ bảo trì' : '🟢 Hệ thống hoạt động bình thường'}
              </p>

              {cfg.maintenance.enabled && (
                <div className="pt-3 border-t border-gray-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Cho phép truy cập</span>
                    <Toggle checked={cfg.maintenance.allowAccess} onChange={v => setMaint('allowAccess', v)} colorOn="bg-blue-500" />
                  </div>
                  <p className="text-xs text-gray-500">
                    {cfg.maintenance.allowAccess ? 'Người dùng vẫn truy cập được trong khi bảo trì' : 'Chỉ hiển thị màn hình bảo trì'}
                  </p>
                </div>
              )}

              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                ⚠️ Admin Portal luôn truy cập được. Nhớ nhấn <strong>Lưu</strong> để áp dụng.
              </p>
            </div>
          </div>

          {/* Cấu Hình Hệ Thống */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
              <Settings size={18} className="text-blue-500" />
              <h2 className="font-semibold text-gray-800">Cấu Hình Hệ Thống</h2>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tên Website</label>
                <input type="text" value={cfg.websiteName} onChange={e => set({ websiteName: e.target.value })} className={INPUT_CLS} placeholder="Tên website" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Logo (URL hoặc đường dẫn)</label>
                <div className="flex gap-2">
                  <input type="text" value={cfg.websiteLogo} onChange={e => set({ websiteLogo: e.target.value })} className={INPUT_CLS} placeholder="/logo.png" />
                  {cfg.websiteLogo && <img src={cfg.websiteLogo} alt="preview" className="w-9 h-9 object-contain border border-gray-200 rounded-lg flex-shrink-0" />}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tên Khoa/Phòng</label>
                <input type="text" value={cfg.departmentName} onChange={e => set({ departmentName: e.target.value })} className={INPUT_CLS} placeholder="Tên khoa/phòng" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tên Trường (dòng 1)</label>
                  <input type="text" value={cfg.universityName.line1} onChange={e => setUni('line1', e.target.value)} className={INPUT_CLS} placeholder="Dòng 1" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tên Trường (dòng 2)</label>
                  <input type="text" value={cfg.universityName.line2} onChange={e => setUni('line2', e.target.value)} className={INPUT_CLS} placeholder="Dòng 2" />
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-600 mb-2">Liên Hệ</p>
                <div className="grid grid-cols-2 gap-2">
                  {([['phone','📞 Điện thoại','0123...'],['gmail','📧 Email','email@...'],['facebook','👤 Facebook','https://fb.com/...'],['zalo','💬 Zalo','https://zalo.me/...']] as const).map(([k, label, ph]) => (
                    <div key={k}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                      <input
                        type={k === 'gmail' ? 'email' : 'text'}
                        value={cfg.contacts[k] || ''}
                        onChange={e => setContact(k, e.target.value)}
                        className={INPUT_CLS}
                        placeholder={ph}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isSaving ? <><RefreshCw size={16} className="animate-spin" /> Đang lưu...</> : <><Save size={16} /> Lưu Thay Đổi</>}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AdminPanel;
