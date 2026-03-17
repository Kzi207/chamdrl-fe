
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link, useNavigate, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, LogOut, Menu, X, BarChart3, Settings as SettingsIcon, QrCode, Award, Home, Search, Calendar, Calculator, FileText, AlertTriangle, Wrench, ShieldCheck, UserCircle2 } from 'lucide-react';
import { isLoggedIn, logout, getCurrentUser, loadConfigFromServer } from './services/storage';
import { isAdminLoggedIn } from './services/adminAuth';
import { AppConfig } from './types';
import ContactBubble from './components/ContactBubble';
import BackToTop from './components/BackToTop';
import ErrorBoundary from './components/ErrorBoundary';
import rawConfigData from './config.json';

const configData = rawConfigData as AppConfig;

// Component Màn Hình Bảo Trì (khi không cho phép truy cập)
const MaintenanceScreen: React.FC = () => {
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f15_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>

        {/* Floating shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-[10%] w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-[15%] w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s', animationDuration: '4s' }}></div>
          <div className="absolute bottom-20 left-[20%] w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s', animationDuration: '5s' }}></div>

          {/* Floating icons */}
          <div className="absolute top-[15%] right-[25%] opacity-5 animate-bounce" style={{ animationDuration: '3s' }}>
            <Wrench size={40} className="text-white" />
          </div>
          <div className="absolute bottom-[20%] left-[15%] opacity-5 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
            <SettingsIcon size={35} className="text-white" />
          </div>
          <div className="absolute top-[60%] right-[10%] opacity-5 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>
            <AlertTriangle size={30} className="text-white" />
          </div>
        </div>

        {/* Main content */}
        <div className="relative z-10 text-center max-w-3xl mx-auto px-4">
          {/* Logo & Icon */}
          <div className="mb-8 flex flex-col items-center gap-6">
            {/* Logo */}
            <Link to="/" className="relative cursor-pointer hover:scale-105 transition-transform">
              <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-2xl animate-pulse"></div>
              <img
                src={configData.websiteLogo || "/logo_khoaktck_ctut.png"}
                alt="Logo"
                className="relative w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-2xl"
              />
            </Link>

            {/* Icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full opacity-20 animate-ping"></div>
              <div className="relative bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 w-20 h-20 rounded-full flex items-center justify-center shadow-2xl ring-4 ring-white/10">
                <Wrench className="text-white animate-pulse" size={36} />
              </div>
            </div>
          </div>

          {/* Title with enhanced styling */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-4 tracking-tight drop-shadow-2xl">
            Hệ thống
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 mt-2">
              đang bảo trì
            </span>
          </h1>

          {/* Decorative line */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-blue-400"></div>
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-blue-400"></div>
          </div>

          {/* Message Card */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-10 border border-white/20 shadow-2xl">
              <p className="text-white/90 text-lg md:text-xl leading-relaxed font-medium">
                Chúng tôi đang nỗ lực khôi phục hệ thống sớm nhất có thể.
              </p>
              <p className="text-white/70 text-base md:text-lg mt-3">
                Xin lỗi vì sự bất tiện này!
              </p>

              {/* Animated progress indicator */}
              <div className="mt-8 space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce shadow-lg shadow-blue-400/50"></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce shadow-lg shadow-cyan-400/50" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce shadow-lg shadow-indigo-400/50" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce shadow-lg shadow-purple-400/50" style={{ animationDelay: '0.3s' }}></div>
                </div>
                <p className="text-white/50 text-sm font-medium tracking-wide">
                  Đang xử lý...
                </p>
              </div>
            </div>
          </div>

          {/* Footer note with better styling */}
          <div className="mt-8 space-y-4">
            <p className="text-white/60 text-sm md:text-base flex items-center justify-center gap-2">
              <AlertTriangle size={16} className="text-yellow-400" />
              Nếu cần hỗ trợ gấp, vui lòng liên hệ qua nút bên dưới
            </p>

            {/* Additional info */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-white/40 text-xs md:text-sm">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                <span>Đội ngũ kỹ thuật đang xử lý</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Lazy loading các trang để tối ưu bundle size
const Landing = React.lazy(() => import('./pages/Landing'));
const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const ClassManagement = React.lazy(() => import('./pages/ClassManagement'));
const ActivityManager = React.lazy(() => import('./pages/ActivityManager'));
const AttendanceScanner = React.lazy(() => import('./pages/AttendanceScanner'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Settings = React.lazy(() => import('./pages/Settings'));
const GuestView = React.lazy(() => import('./pages/GuestView'));
const QuickScan = React.lazy(() => import('./pages/QuickScan'));
const DRLManager = React.lazy(() => import('./pages/DRLManager'));
const DRLForm = React.lazy(() => import('./pages/DRLForm'));
const GradingPeriods = React.lazy(() => import('./pages/GradingPeriods'));
const GPAManager = React.lazy(() => import('./pages/GPAManager'));
const DRLStatistics = React.lazy(() => import('./pages/DRLStatistics'));
const AdminPanel = React.lazy(() => import('./pages/AdminPanel'));
const AdminLogin = React.lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const AdminUsers = React.lazy(() => import('./pages/AdminUsers'));
const AdminLogs = React.lazy(() => import('./pages/AdminLogs'));
const AdminSecurity = React.lazy(() => import('./pages/AdminSecurity'));
const AdminSettings = React.lazy(() => import('./pages/AdminSettings'));
const AdminRedirect = React.lazy(() => import('./pages/AdminRedirect'));
const StudentHome = React.lazy(() => import('./pages/StudentHome'));
const StudentActivities = React.lazy(() => import('./pages/StudentActivities'));
const AdminHome = React.lazy(() => import('./pages/AdminHome'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

// Lazy loading backup pages
const BackupHome = React.lazy(() => import('./pages/backup').then(m => ({ default: m.BackupHome })));
const BackupLocal = React.lazy(() => import('./pages/backup').then(m => ({ default: m.BackupLocal })));
const BackupCloud = React.lazy(() => import('./pages/backup').then(m => ({ default: m.BackupCloud })));
const BackupRestore = React.lazy(() => import('./pages/backup').then(m => ({ default: m.BackupRestore })));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      <p className="mt-4 text-gray-600 font-medium">Đang tải...</p>
    </div>
  </div>
);

const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
};

const AdminPrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  return isAdminLoggedIn() ? children : <Navigate to="/admin/login" replace />;
};

const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void; config?: any }> = ({ isOpen, onClose, config }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = getCurrentUser();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isAdmin = currentUser?.role === 'admin';

  // Xác định Chế độ Hệ thống
  const isDRLMode = location.pathname.startsWith('/drl');
  const isGPAMode = location.pathname.startsWith('/gpa');

  // --- CẤU HÌNH MENU ---
  let menuItems: any[] = [];
  let systemName = "Hệ thống Điểm Danh";
  let themeColor = "blue"; // Màu chủ đạo mặc định

  if (isDRLMode) { // === CHẾ ĐỘ: ĐIỂM RÈN LUYỆN (INDIGO) ===
    systemName = "Hệ thống DRL";
    themeColor = "indigo";

    menuItems = [
      { path: '/drl', icon: Award, label: 'Chấm Điểm Rèn Luyện' },
    ];

    // Thêm Menu Quản lý cho Admin/BCH/Lớp trưởng
    if (['admin', 'monitor', 'bch', 'doankhoa'].includes(currentUser?.role || '')) {
      menuItems.push({ path: '/drl/statistics', icon: FileText, label: 'Thống Kê ĐRL' });
      menuItems.push({ path: '/drl/classes', icon: Users, label: 'Quản lý Lớp & SV' });
    }

    // Thêm Menu Quản lý Đợt chấm cho Admin
    if (currentUser?.role === 'admin') {
      menuItems.push({ path: '/drl/periods', icon: Calendar, label: 'Quản lý Đợt chấm' });
    }

  } else if (isGPAMode) { // === CHẾ ĐỘ: QUẢN LÝ ĐÀO TẠO (GREEN) ===
    systemName = "Quản lý Đào tạo";
    themeColor = "green";

    menuItems = [];

    if (isAdmin) { // Sử dụng các route con bắt đầu bằng /gpa để giữ ngữ cảnh
      menuItems.push({ path: '/gpa', icon: Calculator, label: 'Tính điểm GPA' });
      menuItems.push({ path: '/gpa/periods', icon: Calendar, label: 'Quản lý Học kỳ' });
      menuItems.push({ path: '/gpa/classes', icon: Users, label: 'Quản lý Lớp & SV' });
    }

  } else { // === CHẾ ĐỘ: ĐIỂM DANH (BLUE - MẶC ĐỊNH) ===
    systemName = "Hệ thống Điểm Danh";
    themeColor = "blue";

    if (['admin', 'monitor', 'doankhoa'].includes(currentUser?.role || '')) {
      menuItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Tổng Quan' },
        { path: '/classes', icon: Users, label: 'Lớp Học & SV' },
        { path: '/activities', icon: BookOpen, label: 'Học Phần & Điểm Danh' },
        { path: '/scan', icon: QrCode, label: 'Quét Nhanh' },
        { path: '/reports', icon: BarChart3, label: 'Báo Cáo Thống Kê' },
      ];
    } else if (currentUser?.role === 'student') { // Menu cho Sinh viên
      menuItems = [
        { path: '/public', icon: Search, label: 'Tra cứu Điểm danh' },
      ];
    }
  }

  // Các lớp CSS theo chủ đề động
  const bgSoft = `bg-${themeColor}-50`;
  const textDark = `text-${themeColor}-900`;
  const textPrimary = `text-${themeColor}-700`;
  const textIcon = `text-${themeColor}-600`;
  const borderSoft = `border-${themeColor}-100`;
  const tagBg = `bg-${themeColor}-100`;

  const overlayClass = isOpen ? "fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden" : "hidden";
  const sidebarClass = `fixed top-0 left-0 h-full w-[82vw] max-w-[340px] md:w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 md:translate-x-0 md:static md:shadow-none md:z-30 ${isOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col font-[Segoe UI,Arial,sans-serif]`;

  return (
    <>
      <div className="hidden">{/* Tải trước */}</div>
      <div className={overlayClass} onClick={onClose}></div>
      <div className={sidebarClass}>
        <div className="md:hidden flex justify-end px-4 py-3 border-b border-gray-100 shrink-0 bg-white">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X /></button>
        </div>

        {/* THÔNG TIN NGƯỜI DÙNG */}
        <div className={`px-4 py-3 border-b ${bgSoft} ${borderSoft}`}>
          <div className={`text-xs font-bold uppercase tracking-wide ${textIcon}`}>Xin chào</div>
          <div className={`text-sm font-bold truncate ${textDark}`}>{currentUser?.name}</div>
          <div className={`text-xs capitalize ${textIcon}`}>{currentUser?.role}</div>
        </div>

        {/* CÁC LIÊN KẾT ĐIỀU HƯớNG */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {currentUser?.role !== 'student' && menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => { if (window.innerWidth < 768) onClose() }}
              className={`flex items-center gap-3 px-4 py-3.5 min-h-[46px] rounded-lg text-sm font-medium transition-colors ${location.pathname === item.path ? `${bgSoft} ${textIcon}` : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* CÁC HÀNH ĐỘNG CHÂN TRANG */}
        <div className="p-4 border-t border-gray-100 shrink-0 space-y-2">
          {/* Nút Trang chủ */}
          <Link
            to="/"
            onClick={() => { if (window.innerWidth < 768) onClose() }}
            className="w-full flex items-center gap-3 px-4 py-3.5 min-h-[46px] rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200"
            title="Quay về trang chủ"
          >
            <Home size={20} /> Trang chủ
          </Link>

          {currentUser?.role !== 'student' && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3.5 min-h-[46px] rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut size={20} /> Đăng xuất
            </button>
          )}
        </div>
      </div>
    </>
  );
};

const Layout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [config, setConfig] = React.useState<AppConfig>(configData as AppConfig);
  const mainContentRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isScanner = location.pathname.includes('/attendance/');
  const currentUser = getCurrentUser();
  const isStudentDRLForm = location.pathname.startsWith('/drl/form/') && currentUser?.role === 'student';
  const isClassManagementPage = ['/classes', '/drl/classes', '/gpa/classes'].includes(location.pathname);
  const isAdminLike = ['admin', 'monitor', 'doankhoa'].includes(currentUser?.role || '');
  const showQuickBottomNav = isAdminLike;

  // Reload config khi component mount
  React.useEffect(() => {
    // CLEANUP: Xóa localStorage API URL nếu chứa localhost trong production
    const isProduction = window.location.hostname !== 'localhost';
    const storedUrl = localStorage.getItem('api_url');
    if (isProduction && storedUrl && (storedUrl.includes('localhost') || storedUrl.includes('127.0.0.1'))) {
      console.warn('[App] Removing localhost API URL from localStorage in production');
      localStorage.removeItem('api_url');
    }

    const loadLayoutConfig = async () => {
      const data = await loadConfigFromServer();
      if (data) setConfig(data);
    };
    loadLayoutConfig();
  }, []);

  const isDRLMode = location.pathname.startsWith('/drl');
  const isGPAMode = location.pathname.startsWith('/gpa');

  let headerColor = "text-blue-700";
  let headerTitle = "Điểm Danh QR";

  if (isDRLMode) {
    headerColor = "text-indigo-700";
    headerTitle = "Điểm Rèn Luyện";
  } else if (isGPAMode) {
    headerColor = "text-green-700";
    headerTitle = "Quản lý Đào tạo";
  }

  if (isScanner || isStudentDRLForm) return <>{children || <Outlet />}</>;

  const quickNavTextClass = (active: boolean) => active ? 'text-blue-700' : 'text-slate-400 hover:text-blue-700';

  if (isClassManagementPage) {
    return (
      <>
        <main className={`min-h-[100dvh] bg-gray-50 ${showQuickBottomNav ? 'pb-[calc(96px+env(safe-area-inset-bottom))]' : ''}`}>
          {children || <Outlet />}
        </main>

        {showQuickBottomNav && (
          <nav
            className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-2xl"
            style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
          >
            <div className="max-w-6xl mx-auto grid grid-cols-4 h-[88px] px-2 gap-1">
              <button onClick={() => navigate('/admin-home')} className={`w-full h-full rounded-xl flex flex-col items-center justify-center gap-1 transition-colors active:scale-[0.98] ${quickNavTextClass(location.pathname === '/admin-home')}`} type="button">
                <LayoutDashboard size={20} />
                <span className="text-[10px] font-bold uppercase tracking-tight">Bảng tin</span>
              </button>
              <button onClick={() => navigate('/classes')} className={`w-full h-full rounded-xl flex flex-col items-center justify-center gap-1 transition-colors active:scale-[0.98] ${quickNavTextClass(['/classes', '/drl/classes', '/gpa/classes'].includes(location.pathname))}`} type="button">
                <Users size={20} />
                <span className="text-[10px] font-bold uppercase tracking-tight">Sinh viên</span>
              </button>
              <button onClick={() => navigate('/drl')} className={`w-full h-full rounded-xl flex flex-col items-center justify-center gap-1 transition-colors active:scale-[0.98] ${quickNavTextClass(location.pathname.startsWith('/drl'))}`} type="button">
                <ShieldCheck size={20} />
                <span className="text-[10px] font-bold uppercase tracking-tight">Rèn luyện</span>
              </button>
              <button onClick={() => navigate('/gpa')} className={`w-full h-full rounded-xl flex flex-col items-center justify-center gap-1 transition-colors active:scale-[0.98] ${quickNavTextClass(location.pathname.startsWith('/gpa'))}`} type="button">
                <Calculator size={20} />
                <span className="text-[10px] font-bold uppercase tracking-tight">GPA</span>
              </button>
            </div>
          </nav>
        )}
      </>
    );
  }

  return (
    <div className="flex min-h-[100dvh] h-[100dvh] overflow-hidden bg-gray-50">
      {!isAdminLike && currentUser?.role !== 'student' && <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} config={config} />}
      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="sticky top-0 z-40 bg-white border-b border-gray-100 flex items-center px-3 md:hidden shrink-0 shadow-sm"
          style={{ minHeight: 'calc(56px + env(safe-area-inset-top))', paddingTop: 'env(safe-area-inset-top)' }}
        >
          {!isAdminLike && currentUser?.role !== 'student' && (
            <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600 p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Menu />
            </button>
          )}
          <span className={`ml-2 font-bold ${headerColor} truncate max-w-[200px]`}>
            {headerTitle}
          </span>
          {isAdminLike && (
            <button
              type="button"
              onClick={() => { logout(); navigate('/login', { replace: true }); }}
              className="ml-auto w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center text-[11px] font-bold hover:bg-blue-800 transition-colors"
              title="Đăng xuất"
            >
              {currentUser?.name?.trim()?.charAt(0)?.toUpperCase() || <UserCircle2 size={16} />}
            </button>
          )}
        </header>
        <main ref={mainContentRef} className={`flex-1 overflow-y-auto ${showQuickBottomNav ? 'pb-[calc(96px+env(safe-area-inset-bottom))]' : 'pb-[max(12px,env(safe-area-inset-bottom))]'}`}>
          {children || <Outlet />}
        </main>
      </div>
      {/* Back To Top Button - Chỉ trong Layout */}
      <BackToTop scrollContainerRef={mainContentRef} />

      {showQuickBottomNav && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-2xl"
          style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
        >
          <div className="max-w-6xl mx-auto grid grid-cols-4 h-[88px] px-2 gap-1">
            <button onClick={() => navigate('/admin-home')} className={`w-full h-full rounded-xl flex flex-col items-center justify-center gap-1 transition-colors active:scale-[0.98] ${quickNavTextClass(location.pathname === '/admin-home')}`} type="button">
              <LayoutDashboard size={20} />
              <span className="text-[10px] font-bold uppercase tracking-tight">Bảng tin</span>
            </button>
            <button onClick={() => navigate('/classes')} className={`w-full h-full rounded-xl flex flex-col items-center justify-center gap-1 transition-colors active:scale-[0.98] ${quickNavTextClass(['/classes', '/drl/classes', '/gpa/classes'].includes(location.pathname))}`} type="button">
              <Users size={20} />
              <span className="text-[10px] font-bold uppercase tracking-tight">Sinh viên</span>
            </button>
            <button onClick={() => navigate('/drl')} className={`w-full h-full rounded-xl flex flex-col items-center justify-center gap-1 transition-colors active:scale-[0.98] ${quickNavTextClass(location.pathname.startsWith('/drl'))}`} type="button">
              <ShieldCheck size={20} />
              <span className="text-[10px] font-bold uppercase tracking-tight">Rèn luyện</span>
            </button>
            <button onClick={() => navigate('/gpa')} className={`w-full h-full rounded-xl flex flex-col items-center justify-center gap-1 transition-colors active:scale-[0.98] ${quickNavTextClass(location.pathname.startsWith('/gpa'))}`} type="button">
              <Calculator size={20} />
              <span className="text-[10px] font-bold uppercase tracking-tight">GPA</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};

// Component kiểm tra maintenance mode với bypass cho admin
const MaintenanceWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  // Nếu đang ở admin routes, bỏ qua maintenance check
  if (location.pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  // Nếu bật maintenance và không cho phép truy cập, hiển thị màn hình bảo trì
  if (configData.maintenance?.enabled && !configData.maintenance?.allowAccess) {
    return <MaintenanceScreen />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const [config, setConfig] = useState<AppConfig>(configData as AppConfig);

  // Load config dynamically
  useEffect(() => {
    const loadAppConfig = async () => {
      const data = await loadConfigFromServer();
      if (data) setConfig(data);
    };
    loadAppConfig();
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <React.Suspense fallback={<PageLoader />}>
          <MaintenanceWrapper>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/landing" element={<Landing />} />
              <Route path="/login" element={isLoggedIn() ? <Navigate to="/home" replace /> : <Login />} />
              <Route path="/public" element={<GuestView />} />

              <Route
                path="/home"
                element={
                  <PrivateRoute>
                    {getCurrentUser()?.role === 'student' ? <Navigate to="/student-home" replace /> : <Navigate to="/admin-home" replace />}
                  </PrivateRoute>
                }
              />

              <Route
                path="/student-home"
                element={
                  <PrivateRoute>
                    <StudentHome />
                  </PrivateRoute>
                }
              />

              <Route
                path="/student-activities"
                element={
                  <PrivateRoute>
                    <StudentActivities />
                  </PrivateRoute>
                }
              />

              {/* TRUY CẬP CÔNG KHAI CHO CÀI ĐẶT (Để cho phép cấu hình trước khi đăng nhập) */}
              <Route path="/settings" element={<Settings />} />

              <Route path="/attendance/:activityId" element={<AttendanceScanner />} />

              {/* ADMIN PORTAL - Hệ thống quản trị độc lập */}
              <Route path="/admin" element={<AdminRedirect />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={
                <AdminPrivateRoute>
                  <AdminDashboard />
                </AdminPrivateRoute>
              }>
                <Route path="panel" element={<AdminPanel />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="logs" element={<AdminLogs />} />
                <Route path="security" element={<AdminSecurity />} />
                <Route path="backup" element={<BackupHome />} />
                <Route path="backup/local" element={<BackupLocal />} />
                <Route path="backup/cloud" element={<BackupCloud />} />
                <Route path="backup/restore" element={<BackupRestore />} />
              </Route>
              <Route path="/admin/panel" element={
                <AdminPrivateRoute>
                  <AdminPanel />
                </AdminPrivateRoute>
              } />
              <Route path="/admin/users" element={
                <AdminPrivateRoute>
                  <AdminUsers />
                </AdminPrivateRoute>
              } />
              <Route path="/admin/logs" element={
                <AdminPrivateRoute>
                  <AdminLogs />
                </AdminPrivateRoute>
              } />
              <Route path="/admin/security" element={
                <AdminPrivateRoute>
                  <AdminSecurity />
                </AdminPrivateRoute>
              } />
              <Route path="/admin/settings" element={
                <AdminPrivateRoute>
                  <AdminSettings />
                </AdminPrivateRoute>
              } />
              <Route path="/admin/backup" element={
                <AdminPrivateRoute>
                  <BackupHome />
                </AdminPrivateRoute>
              } />
              <Route path="/admin/backup/local" element={
                <AdminPrivateRoute>
                  <BackupLocal />
                </AdminPrivateRoute>
              } />
              <Route path="/admin/backup/cloud" element={
                <AdminPrivateRoute>
                  <BackupCloud />
                </AdminPrivateRoute>
              } />
              <Route path="/admin/backup/restore" element={
                <AdminPrivateRoute>
                  <BackupRestore />
                </AdminPrivateRoute>
              } />

              {/* Xử lý tất cả các route được bảo vệ */}
              <Route element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }>
                <Route path="/admin-home" element={<AdminHome />} />
                {/* --- ROUTES HỆ THỐNG DRL --- */}
                <Route path="/drl" element={<DRLManager />} />
                <Route path="/drl/form/:studentId" element={<DRLForm />} />
                <Route path="/drl/statistics" element={<DRLStatistics />} />
                <Route path="/drl/classes" element={<ClassManagement />} />
                <Route path="/drl/periods" element={<GradingPeriods />} />
                <Route path="/drl/settings" element={<Settings />} />
                {/* --- ROUTES HỆ THỐNG ĐIỂM DANH --- */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/scan" element={<QuickScan />} />
                <Route path="/classes" element={<ClassManagement />} />
                <Route path="/activities" element={<ActivityManager />} />
                <Route path="/reports" element={<Reports />} />
                {/* --- ROUTES HỆ THỐNG ĐÀO TẠO (GPA) - ĐỘC LẬP --- */}
                <Route path="/gpa" element={<GPAManager />} />
                <Route path="/gpa/classes" element={<ClassManagement />} />
                <Route path="/gpa/periods" element={<GradingPeriods />} />
                <Route path="/gpa/settings" element={<Settings />} />
              </Route>

              {/* 404 - Catch all other routes */}
              <Route path="*" element={<NotFound />} />
            </Routes>

            {/* Global Contact Bubble - Hiển thị ở mọi trang */}
            <ContactBubble contacts={config?.contacts || configData?.contacts || {}} />
          </MaintenanceWrapper>
        </React.Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
