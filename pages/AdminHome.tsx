import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CalendarClock, ClipboardCheck, GraduationCap, LayoutDashboard, Search, Sparkles, Users, BookOpen, UserRoundPlus } from 'lucide-react';
import { getActivities, getClasses, getCurrentUser, getDRLScores, getStudents, logout } from '../services/storage';
import { Activity } from '../types';

const AdminHome: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState('');
  const [stats, setStats] = useState({
    students: 0,
    classes: 0,
    activities: 0,
    submittedDRL: 0
  });
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);

  if (!currentUser) {
    navigate('/login', { replace: true });
    return null;
  }

  if (currentUser.role === 'student') {
    navigate('/student-home', { replace: true });
    return null;
  }

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      setLoadingStats(true);
      setStatsError('');
      try {
        const [students, classes, activities, drlScores] = await Promise.all([
          getStudents(),
          getClasses(),
          getActivities(),
          getDRLScores()
        ]);

        if (!isMounted) return;

        const submittedCount = drlScores.filter((item) => item.status === 'submitted').length;
        const sortedActivities = [...activities].sort((a, b) => {
          const dateA = new Date(a.dateTime || 0).getTime();
          const dateB = new Date(b.dateTime || 0).getTime();
          return dateB - dateA;
        });

        setStats({
          students: students.length,
          classes: classes.length,
          activities: activities.length,
          submittedDRL: submittedCount
        });
        setRecentActivities(sortedActivities.slice(0, 5));
      } catch (error: any) {
        if (!isMounted) return;
        setStatsError(error?.message || 'Không tải được dữ liệu từ máy chủ.');
      } finally {
        if (isMounted) setLoadingStats(false);
      }
    };

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  const formatTime = (value: string) => {
    if (!value) return 'Không có thời gian';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const dashboardCards = useMemo(
    () => [
      {
        label: 'Tổng số sinh viên',
        value: stats.students,
        hint: 'Dữ liệu từ backend',
        icon: Users
      },
      {
        label: 'Số lượng lớp học',
        value: stats.classes,
        hint: 'Đang quản lý',
        icon: BookOpen
      },
      {
        label: 'Hoạt động đã tạo',
        value: stats.activities,
        hint: 'Tổng hoạt động điểm danh',
        icon: ClipboardCheck
      },
      {
        label: 'Phiếu DRL chờ duyệt',
        value: stats.submittedDRL,
        hint: 'Trạng thái submitted',
        icon: Sparkles
      }
    ],
    [stats]
  );

  const quickActions = [
    {
      title: 'Quản lý Sinh viên',
      desc: 'Xem và chỉnh sửa hồ sơ',
      icon: Users,
      onClick: () => navigate('/classes')
    },
    {
      title: 'Quản lý Lớp học',
      desc: 'Danh sách và phân lịch',
      icon: GraduationCap,
      onClick: () => navigate('/classes')
    },
    {
      title: 'Điểm danh',
      desc: 'Hoạt động chuyên cần',
      icon: ClipboardCheck,
      onClick: () => navigate('/activities')
    },
    {
      title: 'Điểm rèn luyện',
      desc: 'Cập nhật kết quả',
      icon: Sparkles,
      onClick: () => navigate('/drl')
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <LayoutDashboard className="text-blue-700" size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Bảng quản trị Admin</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-slate-100" type="button" title="Tìm kiếm">
            <Search className="text-slate-600" size={20} />
          </button>
          <button className="p-2 rounded-full hover:bg-slate-100" type="button" title="Thông báo">
            <Bell className="text-slate-600" size={20} />
          </button>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login', { replace: true });
            }}
            className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-xs hover:bg-blue-800 transition-colors"
            title="Đăng xuất"
          >
            AD
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 max-w-6xl mx-auto w-full">
        <section className="p-4">
          <h2 className="text-lg font-semibold mb-4 text-slate-800">Thống kê tổng quan</h2>
          {statsError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {statsError}
            </div>
          )}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {dashboardCards.map((card) => (
              <div key={card.label} className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-6 bg-white border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <p className="text-slate-500 text-sm font-medium">{card.label}</p>
                  <card.icon className="text-blue-700" size={22} />
                </div>
                <p className="text-2xl font-bold leading-tight">{loadingStats ? '...' : card.value.toLocaleString('vi-VN')}</p>
                <div className="flex items-center gap-1">
                  <span className="text-blue-700 text-xs font-medium">{card.hint}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="p-4">
          <h2 className="text-lg font-semibold mb-4 text-slate-800">Hành động nhanh</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((item) => (
              <button
                key={item.title}
                className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 flex-col hover:border-blue-700 transition-colors text-left"
                onClick={item.onClick}
                type="button"
              >
                <div className="bg-blue-100 w-10 h-10 flex items-center justify-center rounded-lg">
                  <item.icon size={20} className="text-blue-700" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-bold leading-tight">{item.title}</h3>
                  <p className="text-slate-500 text-xs">{item.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="p-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex gap-4 items-center">
                <div className="bg-blue-700 w-12 h-12 flex items-center justify-center rounded-full text-white shadow-lg">
                  <CalendarClock size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-blue-700">Tạo đợt chấm điểm rèn luyện</h2>
                  <p className="text-slate-600 text-sm">Thiết lập thời gian đánh giá cho học kỳ mới</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tên đợt đánh giá</label>
                <input className="w-full rounded-lg border-slate-200 focus:ring-blue-700 focus:border-blue-700" placeholder="Học kỳ I - 2024-2025" type="text" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hạn cuối nộp minh chứng</label>
                <input className="w-full rounded-lg border-slate-200 focus:ring-blue-700 focus:border-blue-700" type="date" />
              </div>
            </div>
            <button onClick={() => navigate('/drl/periods')} className="mt-6 w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg transition-all shadow-md flex items-center justify-center gap-2" type="button">
              <CalendarClock size={18} />
              Khởi tạo đợt đánh giá
            </button>
          </div>
        </section>

        <section className="p-4">
          <h2 className="text-lg font-semibold mb-4 text-slate-800">Hoạt động gần đây</h2>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="divide-y divide-slate-100">
              {loadingStats && (
                <div className="p-4 text-sm text-slate-500">Đang tải hoạt động...</div>
              )}

              {!loadingStats && recentActivities.length === 0 && (
                <div className="p-4 text-sm text-slate-500">Chưa có hoạt động nào trong hệ thống.</div>
              )}

              {!loadingStats && recentActivities.map((activity, index) => (
                <div key={activity.id || `${activity.name}-${index}`} className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${index % 2 === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                    {index % 2 === 0 ? <UserRoundPlus size={18} /> : <CalendarClock size={18} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.name}</p>
                    <p className="text-xs text-slate-500">{formatTime(activity.dateTime)} • Lớp {activity.classId}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

    </div>
  );
};

export default AdminHome;
