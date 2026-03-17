import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BookOpen, Calculator, ClipboardList, LogOut, UserCircle2, GraduationCap, User, CalendarDays } from 'lucide-react';
import { getCurrentUser, logout } from '../services/storage';
import StudentBottomNav from '../components/StudentBottomNav';

const StudentHome: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  if (!currentUser) {
    navigate('/login', { replace: true });
    return null;
  }

  if (currentUser.role !== 'student') {
    navigate('/admin-home', { replace: true });
    return null;
  }

  const studentName = currentUser.name || 'Sinh viên';
  const studentId = currentUser.username || 'N/A';

  const quickActions = [
    {
      label: 'Tính GPA',
      icon: Calculator,
      color: 'bg-emerald-50 text-emerald-600',
      onClick: () => navigate('/gpa')
    },
    {
      label: 'Chấm ĐRL',
      icon: ClipboardList,
      color: 'bg-blue-50 text-blue-600',
      onClick: () => navigate(`/drl/form/${studentId}`)
    },
    {
      label: 'Hồ sơ',
      icon: User,
      color: 'bg-cyan-50 text-cyan-700',
      onClick: () => navigate('/settings')
    }
  ];

  const recentActivities = [
    {
      title: 'Hạn nộp minh chứng DRL',
      desc: 'Vui lòng nộp đúng hạn',
      icon: Bell,
      badge: 'Còn 3 ngày',
      badgeColor: 'text-red-600 bg-red-50'
    },
    {
      title: 'Lịch học sắp tới: Phát triển Mobile',
      desc: 'Phòng A101 - 08:00',
      icon: CalendarDays,
      unread: true
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased" style={{ fontFamily: 'Lexend, sans-serif' }}>
      <main className="max-w-md mx-auto min-h-screen bg-white shadow-sm flex flex-col relative pb-[calc(64px+env(safe-area-inset-bottom))] lg:hidden">
        <header className="bg-blue-700 text-white p-6 rounded-b-[2.5rem] shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full border-2 border-white/30 bg-white/20 flex items-center justify-center">
                  <UserCircle2 size={34} />
                </div>
                <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border-2 border-blue-700 rounded-full"></span>
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight">{studentName}</h1>
                <p className="text-blue-100 text-xs font-medium">MSSV: {studentId}</p>
              </div>
            </div>
            <button className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors" onClick={() => navigate('/student-activities')} type="button" title="Thông báo">
              <Bell className="h-6 w-6" />
            </button>
          </div>
        </header>

        <div className="px-5 -mt-8 space-y-6">
          <section className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-3xl shadow-md border border-slate-100 flex flex-col items-center justify-center text-center">
              <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">GPA Hiện Tại</p>
              <div className="relative w-20 h-20 mb-2">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                  <circle className="text-slate-100" cx="40" cy="40" fill="transparent" r="34" stroke="currentColor" strokeWidth="6"></circle>
                  <circle className="text-blue-600" cx="40" cy="40" fill="transparent" r="34" stroke="currentColor" strokeDasharray="213.6" strokeDashoffset="32" strokeWidth="6"></circle>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-slate-800">3.42</span>
                </div>
              </div>
              <span className="text-[10px] text-green-500 font-medium bg-green-50 px-2 py-1 rounded-full">+0.12 kỳ này</span>
            </div>

            <div className="bg-white p-4 rounded-3xl shadow-md border border-slate-100 flex flex-col items-center justify-center text-center">
              <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Điểm Rèn Luyện</p>
              <div className="w-20 h-20 flex items-center justify-center mb-2 bg-blue-50 rounded-full">
                <span className="text-2xl font-black text-blue-700">85</span>
              </div>
              <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-full uppercase">Tốt</span>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold text-slate-800 mb-4 px-1">Tiện Ích Nhanh</h2>
            <div className="grid gap-3 grid-cols-2">
              {quickActions.map((action) => (
                <button key={action.label} className="flex flex-col items-center gap-2 group" onClick={action.onClick} type="button">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center group-active:scale-95 transition-transform ${action.color}`}>
                    <action.icon className="h-7 w-7" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 text-center leading-tight">{action.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="flex-grow">
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-sm font-bold text-slate-800">Hoạt Động Gần Đây</h2>
              <button className="text-xs font-semibold text-blue-600 hover:text-blue-700" onClick={() => navigate('/student-activities')} type="button">Xem tất cả</button>
            </div>
            <div className="space-y-3">
              {recentActivities.map((item, idx) => (
                <div key={`${item.title}-${idx}`} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-colors">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-blue-100 text-blue-600">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-xs font-bold text-slate-800">{item.title}</h3>
                    <p className="text-[10px] text-slate-500">{item.desc}</p>
                  </div>
                  {item.badge ? <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${item.badgeColor}`}>{item.badge}</span> : null}
                  {!item.badge && item.unread && <div className="w-2 h-2 rounded-full inline-block bg-blue-500"></div>}
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <main className="hidden lg:block max-w-7xl mx-auto px-6 lg:px-8 py-8 pb-[calc(82px+env(safe-area-inset-bottom))]">
        <header className="bg-blue-700 text-white p-8 rounded-[2rem] shadow-lg mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-white/30 bg-white/20 flex items-center justify-center">
                  <UserCircle2 size={38} />
                </div>
                <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-400 border-2 border-blue-700 rounded-full"></span>
              </div>
              <div>
                <h1 className="text-2xl font-bold leading-tight">{studentName}</h1>
                <p className="text-blue-100 text-sm font-medium">MSSV: {studentId}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="bg-white/20 p-2.5 rounded-full hover:bg-white/30 transition-colors" onClick={() => navigate('/student-activities')} type="button" title="Thông báo">
                <Bell className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate('/login', { replace: true });
                }}
                className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-4 py-2 rounded-xl hover:bg-blue-50 transition-colors"
                type="button"
              >
                <LogOut size={16} /> Đăng xuất
              </button>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-12 gap-6 mb-6">
          <div className="col-span-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">GPA Hiện Tại</p>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                  <circle className="text-slate-100" cx="40" cy="40" fill="transparent" r="34" stroke="currentColor" strokeWidth="6"></circle>
                  <circle className="text-blue-600" cx="40" cy="40" fill="transparent" r="34" stroke="currentColor" strokeDasharray="213.6" strokeDashoffset="32" strokeWidth="6"></circle>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-slate-800">3.42</span>
                </div>
              </div>
              <span className="text-xs text-green-600 font-semibold bg-green-50 px-2.5 py-1 rounded-full">+0.12 kỳ này</span>
            </div>
          </div>

          <div className="col-span-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">Điểm Rèn Luyện</p>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-2xl font-black">85</div>
              <div>
                <p className="text-sm font-bold text-slate-800">Xếp loại Tốt</p>
                <p className="text-xs text-slate-500">Cập nhật gần nhất 2 giờ trước</p>
              </div>
            </div>
          </div>

          <div className="col-span-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">Học Tập</p>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <GraduationCap size={28} />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-800">3.25 GPA</p>
                <p className="text-xs text-slate-500">Học kỳ hiện tại</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-12 gap-6">
          <div className="col-span-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-800">Tiện Ích Nhanh</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <button
                  key={`desktop-${action.label}`}
                  className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
                  onClick={action.onClick}
                  type="button"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 ${action.color}`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="col-span-8 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-800">Hoạt Động Gần Đây</h2>
              <button className="text-xs font-semibold text-blue-600 hover:text-blue-700" onClick={() => navigate('/student-activities')} type="button">Xem tất cả</button>
            </div>
            <div className="space-y-3">
              {recentActivities.map((item, idx) => (
                <div key={`desktop-activity-${idx}`} className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-blue-100 text-blue-600">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-sm font-bold text-slate-800">{item.title}</h3>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                  {item.badge ? <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${item.badgeColor}`}>{item.badge}</span> : null}
                  {!item.badge && item.unread && <div className="w-2 h-2 rounded-full inline-block bg-blue-500"></div>}
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
      <StudentBottomNav active="home" />
    </div>
  );
};

export default StudentHome;
