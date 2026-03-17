import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Cloud, ArrowLeft, Save, Globe, CheckCircle, XCircle, RefreshCw, AlertTriangle, Database, Play, Settings, Lock } from 'lucide-react';
import { isAdminLoggedIn } from '../services/adminAuth';
import { saveFirebaseConfig, getFirebaseConfig, saveApiConfig, getApiUrl, checkSystemStatus, getSqlConfig, saveSqlConfig } from '../services/storage';
import { initFirebase } from '../services/firebase';

interface SqlConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

interface WebConfig {
  websiteName: string;
  websiteLogo: string;
  universityName: {
    line1: string;
    line2: string;
  };
  departmentName: string;
  footerText: string;
  contacts: {
    zalo: string;
    facebook: string;
    gmail: string;
    phone: string;
  };
  maintenance: {
    enabled: boolean;
    allowAccess: boolean;
  };
}

const AdminSettings: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'firebase' | 'api' | 'sql' | 'web'>('firebase');
  const [firebaseJson, setFirebaseJson] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [serverStatus, setServerStatus] = useState<'checking' | 'ok' | 'error' | 'warning'>('checking');
  const [statusMsg, setStatusMsg] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  
  // SQL Config State
  const [sqlConfig, setSqlConfig] = useState<SqlConfig>({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'diemdanh'
  });
  const [sqlStatus, setSqlStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');
  const [sqlMessage, setSqlMessage] = useState('');
  const [isRunningMigration, setIsRunningMigration] = useState(false);
  const [migrationResult, setMigrationResult] = useState<string>('');
  
  // Web Config State
  const [webConfig, setWebConfig] = useState<WebConfig>({
    websiteName: 'Hệ thống Khoa Kỹ thuật Cơ khí',
    websiteLogo: '/logo_khoaktck_ctut.png',
    universityName: { line1: 'Hệ thống điểm danh', line2: '' },
    departmentName: 'Khánh Duy',
    footerText: '© 2025 Khánh Duy - Khoa Kỹ thuật Cơ khí - Đại học Kỹ thuật Công nghệ Cần Thơ',
    contacts: { zalo: '', facebook: '', gmail: '', phone: '' },
    maintenance: { enabled: false, allowAccess: false }
  });
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      navigate('/admin/login');
      return;
    }

    // Check if navigated with a default tab
    const state = location.state as { defaultTab?: 'firebase' | 'api' | 'sql' | 'web' };
    if (state?.defaultTab) {
      setActiveTab(state.defaultTab);
    }

    // Load Firebase config
    const fbConfig = getFirebaseConfig();
    if (fbConfig) {
      setFirebaseJson(JSON.stringify(fbConfig, null, 2));
    } else {
      setFirebaseJson(`{
  "apiKey": "PASTE_YOUR_API_KEY_HERE",
  "authDomain": "YOUR_PROJECT.firebaseapp.com",
  "projectId": "YOUR_PROJECT_ID",
  "storageBucket": "YOUR_PROJECT.appspot.com",
  "messagingSenderId": "SENDER_ID",
  "appId": "APP_ID"
}`);
    }

    // Load API config
    setApiUrl(getApiUrl());
    checkConnection();
    
    // Load SQL config
    const savedSqlConfig = getSqlConfig();
    if (savedSqlConfig) {
      setSqlConfig(savedSqlConfig);
    }
    
    // Load Web config
    loadWebConfig();
  }, [navigate]);

  const checkConnection = async () => {
    setServerStatus('checking');
    const res = await checkSystemStatus();
    setServerStatus(res.status as any);
    setStatusMsg(res.message);
  };

  const handleSaveFirebase = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const config = JSON.parse(firebaseJson);
      if (config.apiKey === "PASTE_YOUR_API_KEY_HERE") {
        alert("Vui lòng thay thế giá trị mẫu bằng thông tin thật từ Firebase Console.");
        return;
      }
      saveFirebaseConfig(config);
      const success = initFirebase();
      if (success) {
        alert("✅ Đã lưu cấu hình và khởi tạo Firebase thành công!");
      } else {
        alert("⚠️ Đã lưu, nhưng khởi tạo thất bại. Vui lòng kiểm tra lại thông tin config.");
      }
    } catch (e) {
      alert("❌ Lỗi: Chuỗi JSON không hợp lệ. Vui lòng kiểm tra dấu ngoặc và dấu phẩy.");
    }
  };

  const handleSaveApi = (e: React.FormEvent) => {
    e.preventDefault();
    saveApiConfig(apiUrl);
    setIsSaved(true);
    checkConnection();
    setTimeout(() => setIsSaved(false), 2000);
  };

  // SQL Config Handlers
  const handleTestSqlConnection = async () => {
    setSqlStatus('checking');
    setSqlMessage('Đang kiểm tra kết nối...');
    
    try {
      const response = await fetch(`${getApiUrl()}/admin-api/sql/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sqlConfig)
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setSqlStatus('ok');
        setSqlMessage('✅ Kết nối thành công!');
      } else {
        setSqlStatus('error');
        setSqlMessage(`❌ ${result.error || 'Không thể kết nối'}`);
      }
    } catch (error: any) {
      setSqlStatus('error');
      setSqlMessage(`❌ Lỗi: ${error.message}`);
    }
  };

  const handleSaveSqlConfig = () => {
    saveSqlConfig(sqlConfig);
    alert('✅ Đã lưu cấu hình SQL!');
  };

  const handleRunMigration = async () => {
    if (!confirm('Bạn có chắc muốn chạy migration? Thao tác này sẽ tạo/cập nhật các bảng trong database.')) {
      return;
    }

    setIsRunningMigration(true);
    setMigrationResult('Đang chạy migration...');

    try {
      const response = await fetch(`${getApiUrl()}/admin-api/sql/run-migration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sqlConfig)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setMigrationResult(`✅ Migration thành công!\n\nTạo/cập nhật được ${result.tablesCreated || 0} bảng.`);
      } else {
        setMigrationResult(`❌ Migration thất bại:\n${result.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      setMigrationResult(`❌ Lỗi kết nối: ${error.message}`);
    } finally {
      setIsRunningMigration(false);
    }
  };

  // Web Config Handlers
  const loadWebConfig = async () => {
    setIsLoadingConfig(true);
    try {
      const response = await fetch(`${getApiUrl()}/config`);
      const result = await response.json();
      
      if (result.success && result.config) {
        const loaded = result.config;
        setWebConfig(prev => ({
          ...prev,
          ...loaded,
          universityName: { ...prev.universityName, ...(loaded.universityName || {}) },
          contacts:       { ...prev.contacts,       ...(loaded.contacts       || {}) },
          maintenance:    { ...prev.maintenance,    ...(loaded.maintenance    || {}) },
        }));
      }
    } catch (error: any) {
      console.error('Failed to load config:', error);
    } finally {
      setIsLoadingConfig(false);
    }
  };

  const handleSaveWebConfig = async () => {
    setIsSavingConfig(true);
    try {
      // Merge defaults to ensure all fields are present
      const defaultConfig: WebConfig = {
        websiteName: 'Hệ thống Khoa Kỹ thuật Cơ khí',
        websiteLogo: '/logo_khoaktck_ctut.png',
        universityName: { line1: 'Hệ thống điểm danh', line2: '' },
        departmentName: 'Khánh Duy',
        footerText: '© 2025 Khánh Duy - Khoa Kỹ thuật Cơ khí - Đại học Kỹ thuật Công nghệ Cần Thơ',
        contacts: { zalo: '', facebook: '', gmail: '', phone: '' },
        maintenance: { enabled: false, allowAccess: false }
      };
      const mergedConfig: WebConfig = {
        ...defaultConfig,
        ...webConfig,
        universityName: { ...defaultConfig.universityName, ...(webConfig.universityName || {}) },
        contacts:       { ...defaultConfig.contacts,       ...(webConfig.contacts       || {}) },
        maintenance:    { ...defaultConfig.maintenance,    ...(webConfig.maintenance    || {}) },
      };
      const response = await fetch(`${getApiUrl()}/config/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mergedConfig)
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Đã lưu cấu hình website thành công!');
        await loadWebConfig(); // Reload config after save
      } else {
        alert(`❌ Lỗi: ${result.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      alert(`❌ Lỗi kết nối: ${error.message}`);
    } finally {
      setIsSavingConfig(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Quay lại Dashboard</span>
          </Link>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-3 rounded-xl text-white">
                <Cloud size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Cấu hình Hệ thống</h1>
                <p className="text-gray-600 mt-1">Quản lý Firebase, API Database, SQL Config & Web Config</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6 bg-white rounded-t-xl overflow-hidden">
          <button
            onClick={() => setActiveTab('firebase')}
            className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all border-b-4 ${
              activeTab === 'firebase'
                ? 'border-orange-500 text-orange-600 bg-orange-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Cloud size={20} />
            Firebase Config
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all border-b-4 ${
              activeTab === 'api'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Globe size={20} />
            API Database
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all border-b-4 ${
              activeTab === 'sql'
                ? 'border-green-500 text-green-600 bg-green-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Database size={20} />
            SQL Config
          </button>
          <button
            onClick={() => setActiveTab('web')}
            className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all border-b-4 ${
              activeTab === 'web'
                ? 'border-purple-500 text-purple-600 bg-purple-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Settings size={20} />
            Web Config
          </button>
        </div>

        {/* Firebase Config Tab */}
        {activeTab === 'firebase' && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 animate-fadeIn">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <Cloud className="text-orange-500" />
                Cấu hình Đăng nhập Google (Firebase)
              </h3>
              <p className="text-gray-600 text-sm">
                Thiết lập Firebase để cho phép người dùng đăng nhập bằng tài khoản Google
              </p>
            </div>

            {/* Instructions */}
            <div className="mb-6 bg-gradient-to-r from-orange-50 to-amber-50 p-5 rounded-xl border-2 border-orange-200">
              <p className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                📚 Hướng dẫn:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>
                  Truy cập{' '}
                  <a
                    href="https://console.firebase.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 font-semibold hover:underline"
                  >
                    Firebase Console
                  </a>
                </li>
                <li>Tạo Project mới → Vào <span className="font-semibold">Project Settings</span></li>
                <li>
                  Cuộn xuống mục "Your apps" → Chọn Web (&lt;/&gt;) → Copy toàn bộ đoạn{' '}
                  <code className="bg-white px-2 py-0.5 rounded border text-xs">
                    const firebaseConfig = &#123;...&#125;;
                  </code>{' '}
                  (chỉ lấy phần trong ngoặc nhọn)
                </li>
                <li>Dán vào ô bên dưới và nhấn <span className="font-semibold">Lưu Cấu Hình</span></li>
              </ol>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveFirebase} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Firebase Configuration (JSON)
                </label>
                <textarea
                  rows={12}
                  value={firebaseJson}
                  onChange={(e) => setFirebaseJson(e.target.value)}
                  className="w-full border-2 border-gray-300 p-4 rounded-xl bg-gray-50 font-mono text-xs text-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  placeholder={`{\n  "apiKey": "...",\n  "authDomain": "...",\n  "projectId": "...",\n  ... \n}`}
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  💡 Đảm bảo JSON hợp lệ (có dấu ngoặc nhọn đúng, dấu phẩy giữa các field)
                </p>
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 text-white px-6 py-3 rounded-xl hover:from-orange-700 hover:to-amber-700 font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <Save size={20} />
                Lưu Cấu Hình Firebase
              </button>
            </form>
          </div>
        )}

        {/* API Database Tab */}
        {activeTab === 'api' && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 animate-fadeIn">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <Globe className="text-blue-500" />
                Cấu hình Kết nối API Database
              </h3>
              <p className="text-gray-600 text-sm">
                Cấu hình URL của Server API để kết nối với Database MySQL
              </p>
            </div>

            {/* Connection Status */}
            <div className="mb-6 bg-gray-50 p-5 rounded-xl border-2 border-gray-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-700">Trạng thái kết nối:</span>
                <div
                  className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 ${
                    serverStatus === 'ok'
                      ? 'bg-green-100 text-green-700 border-2 border-green-300'
                      : serverStatus === 'error'
                      ? 'bg-red-100 text-red-700 border-2 border-red-300'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {serverStatus === 'ok' ? (
                    <CheckCircle size={18} />
                  ) : serverStatus === 'error' ? (
                    <XCircle size={18} />
                  ) : (
                    <RefreshCw size={18} className="animate-spin" />
                  )}
                  {statusMsg || 'Đang kiểm tra...'}
                </div>
              </div>
            </div>

            {serverStatus === 'error' && (
              <div className="mb-6 p-4 bg-red-50 rounded-xl border-2 border-red-200 flex items-start gap-3">
                <AlertTriangle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700">
                  <p className="font-bold mb-1">Không thể kết nối đến Server!</p>
                  <p>Vui lòng kiểm tra lại URL hoặc liên hệ với kỹ thuật viên để khởi động Server.</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveApi} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Server API URL
                </label>
                {window.location.hostname !== 'localhost' && (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                    <Lock size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-700">
                      <strong>Khóa trong Production:</strong> API URL được cố định tại <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">https://database.kzii.site</code> để đảm bảo bảo mật và ổn định.
                    </p>
                  </div>
                )}
                <input
                  type="url"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  disabled={window.location.hostname !== 'localhost'}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 text-sm font-medium transition-all ${
                    window.location.hostname !== 'localhost'
                      ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-75'
                      : 'bg-white border-gray-300'
                  }`}
                  placeholder="https://database.kzii.site"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  💡 Ví dụ: http://localhost:3004 hoặc https://your-api-domain.com
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={checkConnection}
                  disabled={window.location.hostname !== 'localhost'}
                  className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    window.location.hostname !== 'localhost'
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <RefreshCw size={18} />
                  Kiểm tra kết nối
                </button>
                <button
                  type="submit"
                  disabled={window.location.hostname !== 'localhost'}
                  className={`flex-1 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                    window.location.hostname !== 'localhost'
                      ? 'bg-gray-400 cursor-not-allowed'
                      : isSaved
                      ? 'bg-green-600 hover:bg-green-700 hover:shadow-xl transform hover:scale-105'
                      : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 hover:shadow-xl transform hover:scale-105'
                  }`}
                >
                  {window.location.hostname !== 'localhost' ? (
                    <>
                      <Lock size={20} />
                      Khóa trong Production
                    </>
                  ) : isSaved ? (
                    <>
                      <CheckCircle size={20} />
                      Đã lưu!
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      Lưu Cấu Hình
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SQL Config Tab */}
        {activeTab === 'sql' && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 animate-fadeIn">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <Database className="text-green-500" />
                Cấu hình MySQL Database
              </h3>
              <p className="text-gray-600 text-sm">
                Cấu hình kết nối trực tiếp đến MySQL Server và quản lý schema database
              </p>
            </div>

            {/* Connection Status */}
            {sqlStatus !== 'idle' && (
              <div className="mb-6 bg-gray-50 p-5 rounded-xl border-2 border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700">Trạng thái kết nối:</span>
                  <div
                    className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 ${
                      sqlStatus === 'ok'
                        ? 'bg-green-100 text-green-700 border-2 border-green-300'
                        : sqlStatus === 'error'
                        ? 'bg-red-100 text-red-700 border-2 border-red-300'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {sqlStatus === 'ok' ? (
                      <CheckCircle size={18} />
                    ) : sqlStatus === 'error' ? (
                      <XCircle size={18} />
                    ) : (
                      <RefreshCw size={18} className="animate-spin" />
                    )}
                    {sqlMessage}
                  </div>
                </div>
              </div>
            )}

            {/* Migration Result */}
            {migrationResult && (
              <div className={`mb-6 p-4 rounded-xl border-2 ${
                migrationResult.includes('✅') 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <pre className="text-sm whitespace-pre-wrap font-mono">{migrationResult}</pre>
              </div>
            )}

            {/* Config Form */}
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Host
                  </label>
                  <input
                    type="text"
                    value={sqlConfig.host}
                    onChange={(e) => setSqlConfig({ ...sqlConfig, host: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white text-gray-900 text-sm font-medium transition-all"
                    placeholder="localhost"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Port
                  </label>
                  <input
                    type="number"
                    value={sqlConfig.port}
                    onChange={(e) => setSqlConfig({ ...sqlConfig, port: parseInt(e.target.value) || 3306 })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white text-gray-900 text-sm font-medium transition-all"
                    placeholder="3306"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={sqlConfig.user}
                    onChange={(e) => setSqlConfig({ ...sqlConfig, user: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white text-gray-900 text-sm font-medium transition-all"
                    placeholder="root"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={sqlConfig.password}
                    onChange={(e) => setSqlConfig({ ...sqlConfig, password: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white text-gray-900 text-sm font-medium transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Database Name
                </label>
                <input
                  type="text"
                  value={sqlConfig.database}
                  onChange={(e) => setSqlConfig({ ...sqlConfig, database: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white text-gray-900 text-sm font-medium transition-all"
                  placeholder="diemdanh"
                />
                <p className="text-xs text-gray-500 mt-2">
                  💡 Database sẽ được tự động tạo nếu chưa tồn tại khi chạy migration
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={handleTestSqlConnection}
                disabled={sqlStatus === 'checking'}
                className="bg-blue-100 text-blue-700 px-6 py-3 rounded-xl hover:bg-blue-200 font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={18} className={sqlStatus === 'checking' ? 'animate-spin' : ''} />
                Test Connection
              </button>
              
              <button
                type="button"
                onClick={handleSaveSqlConfig}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Lưu Cấu Hình
              </button>

              <button
                type="button"
                onClick={handleRunMigration}
                disabled={isRunningMigration || sqlStatus !== 'ok'}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunningMigration ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Đang chạy...
                  </>
                ) : (
                  <>
                    <Play size={18} />
                    Đẩy Schema vào DB
                  </>
                )}
              </button>
            </div>

            {/* Instructions */}
            <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-xl border-2 border-green-200">
              <p className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                📚 Hướng dẫn:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>Nhập thông tin kết nối MySQL (host, port, username, password, database name)</li>
                <li>Nhấn <span className="font-semibold">Test Connection</span> để kiểm tra kết nối</li>
                <li>Nhấn <span className="font-semibold">Lưu Cấu Hình</span> để lưu vào localStorage</li>
                <li>Nhấn <span className="font-semibold">Đẩy Schema vào DB</span> để tạo các bảng trong database</li>
                <li>Schema sẽ tạo tất cả tables cần thiết theo file <code className="bg-white px-2 py-0.5 rounded border text-xs">be/database/schema.sql</code></li>
              </ol>
            </div>
          </div>
        )}

        {/* Web Config Tab */}
        {activeTab === 'web' && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 animate-fadeIn">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <Settings className="text-purple-500" />
                Cấu hình Website
              </h3>
              <p className="text-gray-600 text-sm">
                Quản lý thông tin hiển thị trên website và chế độ bảo trì
              </p>
            </div>

            {isLoadingConfig && (
              <div className="mb-6 text-center py-4">
                <RefreshCw size={24} className="animate-spin mx-auto text-purple-500" />
                <p className="text-gray-600 mt-2">Đang tải cấu hình...</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-5 rounded-xl border-2 border-purple-200">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  🏫 Thông tin cơ bản
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Tên Website
                    </label>
                    <input
                      type="text"
                      value={webConfig.websiteName}
                      onChange={(e) => setWebConfig({ ...webConfig, websiteName: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white text-gray-900 text-sm font-medium transition-all"
                      placeholder="Hệ thống Khoa Kỹ thuật Cơ khí"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Logo Path
                    </label>
                    <input
                      type="text"
                      value={webConfig.websiteLogo}
                      onChange={(e) => setWebConfig({ ...webConfig, websiteLogo: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white text-gray-900 text-sm font-medium transition-all"
                      placeholder="/logo_khoaktck_ctut.png"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      💡 Đặt file logo trong thư mục public hoặc sử dụng URL đầy đủ
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Tên Trường (Dòng 1)
                      </label>
                      <input
                        type="text"
                        value={webConfig.universityName?.line1 ?? ''}
                        onChange={(e) => setWebConfig({ 
                          ...webConfig, 
                          universityName: {
                            line1: e.target.value,
                            line2: webConfig.universityName?.line2 ?? ''
                          }
                        })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white text-gray-900 text-sm font-medium transition-all"
                        placeholder="Hệ thống điểm danh"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Tên Trường (Dòng 2)
                      </label>
                      <input
                        type="text"
                        value={webConfig.universityName?.line2 ?? ''}
                        onChange={(e) => setWebConfig({ 
                          ...webConfig, 
                          universityName: {
                            line1: webConfig.universityName?.line1 ?? '',
                            line2: e.target.value
                          }
                        })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white text-gray-900 text-sm font-medium transition-all"
                        placeholder="(Tùy chọn)"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Tên Khoa/Bộ môn
                    </label>
                    <input
                      type="text"
                      value={webConfig.departmentName}
                      onChange={(e) => setWebConfig({ ...webConfig, departmentName: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white text-gray-900 text-sm font-medium transition-all"
                      placeholder="Khánh Duy"
                    />
                  </div>
                </div>
              </div>

              {/* Contacts */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-5 rounded-xl border-2 border-blue-200">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  📞 Thông tin liên hệ
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Zalo URL
                    </label>
                    <input
                      type="url"
                      value={webConfig.contacts.zalo}
                      onChange={(e) => setWebConfig({ 
                        ...webConfig, 
                        contacts: { ...webConfig.contacts, zalo: e.target.value }
                      })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-gray-900 text-sm font-medium transition-all"
                      placeholder="https://zalo.me/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Facebook URL
                    </label>
                    <input
                      type="url"
                      value={webConfig.contacts.facebook}
                      onChange={(e) => setWebConfig({ 
                        ...webConfig, 
                        contacts: { ...webConfig.contacts, facebook: e.target.value }
                      })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-gray-900 text-sm font-medium transition-all"
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Gmail
                    </label>
                    <input
                      type="email"
                      value={webConfig.contacts.gmail}
                      onChange={(e) => setWebConfig({ 
                        ...webConfig, 
                        contacts: { ...webConfig.contacts, gmail: e.target.value }
                      })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-gray-900 text-sm font-medium transition-all"
                      placeholder="example@gmail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      value={webConfig.contacts.phone}
                      onChange={(e) => setWebConfig({ 
                        ...webConfig, 
                        contacts: { ...webConfig.contacts, phone: e.target.value }
                      })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-gray-900 text-sm font-medium transition-all"
                      placeholder="0939042183"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Text */}
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-5 rounded-xl border-2 border-slate-200">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  📝 Chân trang (Footer)
                </h4>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Nội dung chân trang
                  </label>
                  <input
                    type="text"
                    value={webConfig.footerText || ''}
                    onChange={(e) => setWebConfig({ ...webConfig, footerText: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none bg-white text-gray-900 text-sm font-medium transition-all"
                    placeholder="© 2025 Tên - Khoa/Bộ môn - Trường"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Nội dung hiển thị ở cuối trang (Landing, Login...)
                  </p>
                </div>
              </div>

              {/* Maintenance Mode */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-5 rounded-xl border-2 border-amber-200">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  🔧 Chế độ bảo trì
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="maintenanceEnabled"
                      checked={webConfig.maintenance.enabled}
                      onChange={(e) => setWebConfig({ 
                        ...webConfig, 
                        maintenance: { ...webConfig.maintenance, enabled: e.target.checked }
                      })}
                      className="w-5 h-5 text-orange-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                    />
                    <label htmlFor="maintenanceEnabled" className="font-semibold text-gray-700 cursor-pointer">
                      Bật chế độ bảo trì
                    </label>
                  </div>
                  {webConfig.maintenance.enabled && (
                    <div className="flex items-center gap-3 ml-8">
                      <input
                        type="checkbox"
                        id="maintenanceAllowAccess"
                        checked={webConfig.maintenance.allowAccess}
                        onChange={(e) => setWebConfig({ 
                          ...webConfig, 
                          maintenance: { ...webConfig.maintenance, allowAccess: e.target.checked }
                        })}
                        className="w-5 h-5 text-orange-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                      />
                      <label htmlFor="maintenanceAllowAccess" className="font-medium text-gray-600 cursor-pointer">
                        Cho phép truy cập trong lúc bảo trì (admin only)
                      </label>
                    </div>
                  )}
                  <div className="flex items-start gap-2 text-sm text-gray-600 bg-white p-3 rounded-lg">
                    <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <p>
                      Khi bật chế độ bảo trì, người dùng thông thường sẽ không thể truy cập website. 
                      Chỉ admin có thể truy cập nếu bật "Cho phép truy cập".
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={loadWebConfig}
                  disabled={isLoadingConfig}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw size={18} className={isLoadingConfig ? 'animate-spin' : ''} />
                  Tải lại
                </button>
                
                <button
                  type="button"
                  onClick={handleSaveWebConfig}
                  disabled={isSavingConfig}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingConfig ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Lưu Cấu Hình
                    </>
                  )}
                </button>
              </div>

              {/* Instructions */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-xl border-2 border-purple-200">
                <p className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  📚 Hướng dẫn:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li>Chỉnh sửa các thông tin hiển thị trên website (tên, logo, liên hệ)</li>
                  <li>Bật/tắt chế độ bảo trì khi cần nâng cấp hoặc sửa chữa hệ thống</li>
                  <li>Nhấn <span className="font-semibold">Lưu Cấu Hình</span> để áp dụng thay đổi</li>
                  <li>Website sẽ tự động reload config sau khi lưu thành công</li>
                  <li>File cấu hình được lưu tại <code className="bg-white px-2 py-0.5 rounded border text-xs">config.json</code></li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;
