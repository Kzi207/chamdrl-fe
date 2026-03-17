
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Calendar, BarChart3, QrCode, AlertTriangle, Settings, RefreshCw, ArrowLeft, Search, ArrowUp } from 'lucide-react';
import { getClasses, getActivities, getStudents, getApiUrl, checkSystemStatus, getCurrentUser } from '../services/storage';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ classes: 0, students: 0, activities: 0 });
  const [hasServer, setHasServer] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const currentUser = getCurrentUser();

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    // 1. Kiểm tra cấu hình URL API
    const apiUrl = getApiUrl();
    if (!apiUrl) {
      setHasServer(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setConnectionError(false);

    // 2. Kiểm tra Trạng thái Hệ thống TRƯỚC
    const status = await checkSystemStatus();
    if (status.status === 'error') {
      setConnectionError(true);
      setLoading(false);
      return;
    }

    setHasServer(true);

    // 3. Tải Dữ liệu
    try {
      const [c, s, a] = await Promise.all([
        getClasses(),
        getStudents(),
        getActivities()
      ]);

      setStats({
        classes: c.length,
        students: s.length,
        activities: a.length
      });
    } catch (e) {
      console.error("Failed to load stats", e);
      setConnectionError(true);
    } finally {
      setLoading(false);
    }
  };

  if (!hasServer) {
    return (
      <div className="p-3 sm:p-4 md:p-6">
        <button onClick={() => navigate('/')} className="mb-4 flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors">
          <ArrowLeft size={20} /> Quay lại Trang chủ
        </button>
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 md:p-6 rounded-r-xl shadow-sm mb-6">
          <div className="flex items-start gap-4">
            <div className="bg-orange-100 p-3 rounded-full text-orange-600">
              <AlertTriangle size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-orange-800 mb-2">Chưa cấu hình Server</h2>
              <p className="text-orange-700 mb-4">
                Hệ thống chưa tìm thấy cấu hình URL Server.
              </p>
              <Link to="/settings" className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium">
                <Settings size={18} /> Đi tới Cài đặt
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="p-3 sm:p-4 md:p-6">
        <button onClick={() => navigate('/')} className="mb-4 flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors">
          <ArrowLeft size={20} /> Quay lại Trang chủ
        </button>
        <div className="bg-red-50 border-l-4 border-red-500 p-4 md:p-6 rounded-r-xl shadow-sm mb-6">
          <div className="flex items-start gap-4">
            <div className="bg-red-100 p-3 rounded-full text-red-600">
              <AlertTriangle size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-red-800 mb-2">Mất kết nối Server</h2>
              <p className="text-red-700 mb-4">
                Không thể kết nối tới Server. Vui lòng kiểm tra:
              </p>
              <ul className="list-disc list-inside text-sm text-red-800 mb-4 space-y-1">
                <li>File <code>server.js</code> đã được chạy chưa? (<code>node server.js</code>)</li>
                <li>Địa chỉ IP Server có đúng không? ({getApiUrl()})</li>
              </ul>
              <div className="flex gap-3">
                <button onClick={loadStats} className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
                  <RefreshCw size={18} /> Thử lại
                </button>
                <Link to="/settings" className="inline-flex items-center gap-2 px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors font-medium">
                  <Settings size={18} /> Cấu hình lại
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- GIAO DIỆN SINH VIÊN ---
  if (currentUser?.role === 'student') {
    return (
      <div className="p-3 sm:p-4 md:p-6">
        <div className="flex items-center gap-3 sm:gap-4 mb-6 md:mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
            title="Quay lại Trang chủ"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Xin chào, {currentUser.name}</h1>
            <p className="text-gray-500 text-sm">Hệ thống Điểm Danh</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-2xl">
          <Link
            to="/public"
            className="bg-white p-5 sm:p-8 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-500 transition-all group flex flex-col items-center text-center"
          >
            <div className="bg-blue-100 p-4 rounded-full text-blue-600 mb-4 group-hover:scale-110 transition-transform">
              <Search size={32} />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 group-hover:text-blue-700">Tra cứu Lịch sử Điểm danh</h3>
            <p className="text-gray-500 mt-2">Xem lại các buổi đã điểm danh và tỷ lệ chuyên cần của bạn.</p>
          </Link>

          <Link
            to="/settings"
            className="bg-white p-5 sm:p-8 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-400 transition-all group flex flex-col items-center text-center"
          >
            <div className="bg-gray-100 p-4 rounded-full text-gray-600 mb-4 group-hover:scale-110 transition-transform">
              <Settings size={32} />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">Cài đặt Tài khoản</h3>
            <p className="text-gray-500 mt-2">Đổi mật khẩu và xem thông tin cá nhân.</p>
          </Link>
        </div>
      </div>
    );
  }

  // --- GIAO DIỆN QUẢN LÝ ---
  const cards = [
    {
      title: 'Lớp Học',
      value: stats.classes,
      icon: Users,
      color: 'bg-blue-500',
      link: '/classes',
      desc: 'Quản lý lớp và sinh viên'
    },
    {
      title: 'Hoạt Động',
      value: stats.activities,
      icon: Calendar,
      color: 'bg-green-500',
      link: '/activities',
      desc: 'Tạo môn học & điểm danh'
    },
    {
      title: 'Tổng Sinh Viên',
      value: stats.students,
      icon: QrCode,
      color: 'bg-purple-500',
      link: '/classes',
      desc: 'Dữ liệu sinh viên toàn hệ thống'
    },
    {
      title: 'Báo Cáo',
      value: 'Thống kê',
      icon: BarChart3,
      color: 'bg-orange-500',
      link: '/reports',
      desc: 'Xuất file CSV và xem biểu đồ'
    },
  ];

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <div className="flex items-center gap-3 sm:gap-4 mb-2">
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
          title="Quay lại Trang chủ"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Hệ thống Điểm Danh</h1>
          <p className="text-gray-500 text-sm flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Server đang hoạt động
          </p>
        </div>
        {loading && <div className="ml-auto text-blue-600 flex items-center gap-2"><RefreshCw className="animate-spin" size={20} /> Đang tải...</div>}
      </div>

      <div className="mt-6 md:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {cards.map((card, index) => (
          <Link
            key={index}
            to={card.link}
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 sm:p-5 md:p-6 border border-gray-100 block group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.color} p-3 rounded-lg text-white group-hover:scale-110 transition-transform`}>
                <card.icon size={24} />
              </div>
              <span className="text-xl sm:text-2xl font-bold text-gray-800">{card.value}</span>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-700">{card.title}</h3>
            <p className="text-sm text-gray-400 mt-1">{card.desc}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 md:mt-10 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4">Hướng dẫn nhanh</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 text-sm text-gray-600">
          <div className="p-4 bg-gray-50 rounded-lg">
            <span className="font-bold text-blue-600 block mb-2">Bước 1: Tạo Lớp & Nhập Liệu</span>
            Vào menu "Lớp Học", tạo lớp mới, sau đó upload file Excel chứa danh sách sinh viên. Dữ liệu sẽ được lưu vào db.json.
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <span className="font-bold text-blue-600 block mb-2">Bước 2: Xuất QR Code</span>
            Trong chi tiết lớp học, nhấn "Xuất PDF Mã QR" để tải file PDF chứa mã QR cho toàn bộ sinh viên trong lớp để in ấn.
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <span className="font-bold text-blue-600 block mb-2">Bước 3: Tạo Hoạt Động & Điểm Danh</span>
            Vào "Hoạt Động" để tạo buổi học mới. Sau đó dùng chức năng "Điểm Danh QR" để quét mã sinh viên.
          </div>
        </div>
      </div>

      {/* Nút Quay lại Đầu trang */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-5 right-4 md:bottom-6 md:right-6 z-50 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 hover:scale-110"
          style={{ bottom: 'calc(16px + env(safe-area-inset-bottom))' }}
          title="Quay lại đầu trang"
        >
          <ArrowUp size={24} />
        </button>
      )}
    </div>
  );
};

export default Dashboard;
