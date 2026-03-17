
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Search, QrCode, Award, ChevronRight, LogOut, ArrowRight, User, Calculator } from 'lucide-react';
import { isLoggedIn, getCurrentUser, logout } from '../services/storage';
import configData from '../config.json';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [showAttendanceOptions, setShowAttendanceOptions] = useState(false);
  const [user, setUser] = useState(getCurrentUser());

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const handleDRLClick = () => {
      if (isLoggedIn()) {
          const currentUser = getCurrentUser();
          if (currentUser?.role === 'student') {
              // Sinh viên đã đăng nhập -> Vào form
              navigate(`/drl/form/${currentUser.username}`);
          } else {
              // Admin/BCH đã đăng nhập -> Vào quản lý
              navigate('/drl');
          }
      } else {
          // Chưa đăng nhập -> Vào login với đích đến là /drl
          navigate('/login', { state: { from: '/drl' } });
      }
  };

  const handleAttendanceLoginClick = () => {
      if (isLoggedIn()) {
          const currentUser = getCurrentUser();
          if (currentUser?.role === 'student') {
               // --- CHẶN SINH VIÊN VÀO QUẢN LÝ ---
               alert("Tài khoản Sinh viên không có quyền truy cập hệ thống Quản lý Điểm danh.");
               navigate('/public'); // Chuyển hướng sang trang Tra cứu
          } else {
               // Admin/Cán bộ -> Vào Dashboard
               navigate('/dashboard');
          }
      } else {
          navigate('/login', { state: { from: '/dashboard' } });
      }
  };

  const handleGPAClick = () => {
      if (isLoggedIn()) {
          // Cho phép cả Admin và Sinh viên truy cập
          navigate('/gpa');
      } else {
          // Chưa đăng nhập -> Vào login với đích đến là /gpa
          navigate('/login', { state: { from: '/gpa' } });
      }
  };

  const handleLogout = () => {
      logout();
      setUser(null);
      // Không reload để giữ trạng thái SPA mượt mà
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50 flex flex-col items-center justify-center p-4 font-[Segoe UI,Arial,sans-serif] text-slate-800 overflow-hidden">
      
      {/* Top User Bar (Absolute) */}
      <div className="absolute top-4 right-4 z-20">
        {user ? (
            <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-white/50 pl-4 pr-2 py-1.5 rounded-full shadow-sm">
                <div className="text-right hidden sm:block">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Đang đăng nhập</div>
                    <div className="text-sm font-bold text-slate-700 leading-none">{user.name}</div>
                </div>
                <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    <User size={16}/>
                </div>
                <button onClick={handleLogout} className="p-2 bg-white text-red-500 rounded-full hover:bg-red-50 transition-colors shadow-sm ml-1" title="Đăng xuất">
                    <LogOut size={16} />
                </button>
            </div>
        ) : (
            <button 
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-white/50 rounded-full text-sm font-bold text-blue-600 hover:bg-white hover:shadow-md transition-all"
            >
                <LogIn size={16}/> Đăng nhập
            </button>
        )}
      </div>

      <div className="w-full max-w-5xl animate-fadeIn flex flex-col items-center justify-center h-full">
        
        {/* === HEADER SECTION (COMPACT) === */}
        <div className="text-center mb-6 flex flex-col items-center shrink-0">
             <Link to="/">
               <img 
                 src={configData.websiteLogo || "/logo_khoaktck_ctut.png"}
                 alt="CTUT Logo" 
                 className="w-36 h-36 md:w-44 md:h-44 object-contain mb-3 drop-shadow-lg hover:scale-105 transition-transform cursor-pointer" 
               />
             </Link>
             <div className="flex flex-col items-center px-4">
                 <h1 className="text-lg md:text-2xl font-black text-[#1e3a8a] tracking-tight uppercase leading-tight mb-3 text-center">
                    TRƯỜNG ĐẠI HỌC KỸ THUẬT – CÔNG NGHỆ CẦN THƠ
                 </h1>
                 <div className="w-24 h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-3 shadow-sm"></div>
                 <h3 className="text-lg md:text-2xl font-black text-blue-700 uppercase tracking-widest drop-shadow-md">
                    KHOA KỸ THUẬT CƠ KHÍ
                 </h3>
             </div>
        </div>

        {/* === MAIN CONTENT CARD (COMPACT) === */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-2 overflow-hidden w-full max-w-5xl">
            <div className="bg-white rounded-[0.8rem] p-6 md:p-8 min-h-[300px] flex flex-col justify-center">
                
                {!showAttendanceOptions ? (
                    <>
                        <div className="text-center mb-6">
                            <h2 className="text-xl md:text-2xl font-bold text-slate-800">Cổng Thông Tin Điện Tử</h2>
                            <p className="text-slate-500 text-sm mt-1">Vui lòng chọn phân hệ làm việc bên dưới</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto w-full">
                             {/* DRL CARD */}
                             <button 
                                onClick={handleDRLClick}
                                className="group relative flex flex-col items-center p-6 md:p-8 rounded-2xl border-2 border-slate-100 bg-gradient-to-br from-white to-slate-50 hover:from-indigo-50 hover:to-purple-50 hover:border-indigo-300 hover:shadow-2xl transition-all duration-300 text-center transform hover:-translate-y-1"
                             >
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                                <div className="relative w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                    <Award size={32} className="md:w-10 md:h-10" />
                                </div>
                                <h3 className="relative text-lg md:text-xl font-bold text-slate-800 group-hover:text-indigo-700 transition-colors mb-2">Điểm Rèn Luyện</h3>
                                <p className="relative text-xs md:text-sm text-slate-500 mb-4 leading-relaxed">Chấm điểm, đánh giá và quản lý hồ sơ rèn luyện</p>
                                <div className="relative mt-auto flex items-center gap-2 text-sm font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                    <span>Truy cập ngay</span>
                                    <ArrowRight size={16} className="animate-pulse"/>
                                </div>
                             </button>

                             {/* ATTENDANCE CARD */}
                             <button 
                                onClick={() => setShowAttendanceOptions(true)}
                                className="group relative flex flex-col items-center p-6 md:p-8 rounded-2xl border-2 border-slate-100 bg-gradient-to-br from-white to-slate-50 hover:from-blue-50 hover:to-cyan-50 hover:border-blue-300 hover:shadow-2xl transition-all duration-300 text-center transform hover:-translate-y-1"
                             >
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                                <div className="relative w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                    <QrCode size={32} className="md:w-10 md:h-10" />
                                </div>
                                <h3 className="relative text-lg md:text-xl font-bold text-slate-800 group-hover:text-blue-700 transition-colors mb-2">Điểm Danh QR</h3>
                                <p className="relative text-xs md:text-sm text-slate-500 mb-4 leading-relaxed">Quản lý lớp học, quét mã QR và báo cáo thống kê</p>
                                <div className="relative mt-auto flex items-center gap-2 text-sm font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                    <span>Truy cập ngay</span>
                                    <ArrowRight size={16} className="animate-pulse"/>
                                </div>
                             </button>

                             {/* GPA MANAGER CARD */}
                             <button 
                                onClick={handleGPAClick}
                                className="group relative flex flex-col items-center p-6 md:p-8 rounded-2xl border-2 border-slate-100 bg-gradient-to-br from-white to-slate-50 hover:from-green-50 hover:to-emerald-50 hover:border-green-300 hover:shadow-2xl transition-all duration-300 text-center transform hover:-translate-y-1"
                             >
                                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                                <div className="relative w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                    <Calculator size={32} className="md:w-10 md:h-10" />
                                </div>
                                <h3 className="relative text-lg md:text-xl font-bold text-slate-800 group-hover:text-green-700 transition-colors mb-2">Tính GPA</h3>
                                <p className="relative text-xs md:text-sm text-slate-500 mb-4 leading-relaxed">Tính toán điểm trung bình và GPA học tập</p>
                                <div className="relative mt-auto flex items-center gap-2 text-sm font-bold text-green-600 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                    <span>Truy cập ngay</span>
                                    <ArrowRight size={16} className="animate-pulse"/>
                                </div>
                             </button>
                        </div>
                    </>
                ) : (
                    <div className="max-w-md mx-auto w-full animate-fadeIn">
                        <button 
                            onClick={() => setShowAttendanceOptions(false)}
                            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-semibold mb-8 transition-colors group text-sm"
                        >
                            <div className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-blue-100 transition-colors"><ChevronRight className="rotate-180" size={16} /></div>
                            Quay lại
                        </button>

                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white mb-4 shadow-lg">
                                <QrCode size={28}/>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">Hệ thống Điểm Danh</h2>
                            <p className="text-slate-500 text-sm">Chọn phương thức truy cập phù hợp</p>
                        </div>

                        <div className="space-y-4">
                            <button 
                                onClick={handleAttendanceLoginClick}
                                className="w-full p-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl shadow-lg hover:shadow-xl font-bold flex items-center justify-between group transition-all transform hover:scale-[1.02]"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm"><LogIn size={20}/></div>
                                    <div className="text-left">
                                        <div className="text-xs opacity-90 font-normal">Dành cho Cán bộ / Lớp trưởng</div>
                                        <div className="text-base font-bold">Đăng nhập Quản lý</div>
                                    </div>
                                </div>
                                <ChevronRight className="opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" size={20}/>
                            </button>
                            
                            <button 
                                onClick={() => navigate('/public')}
                                className="w-full p-4 bg-white border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700 rounded-xl shadow-md hover:shadow-lg font-bold flex items-center justify-between group transition-all transform hover:scale-[1.02]"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-slate-100 text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-100 p-2 rounded-lg transition-colors"><Search size={20}/></div>
                                    <div className="text-left">
                                        <div className="text-xs text-slate-400 font-normal">Dành cho Sinh viên</div>
                                        <div className="text-base font-bold group-hover:text-blue-700 transition-colors">Tra cứu Điểm danh</div>
                                    </div>
                                </div>
                                <ChevronRight className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" size={20}/>
                            </button>
                        </div>
                    </div>
                )}

            </div>
            
            {/* Footer */}
            <div className="bg-slate-50 p-2 text-center border-t border-slate-100">
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                    {configData.footerText || '© 2025 Khánh Duy - Khoa Kỹ thuật Cơ khí - Đại học Kỹ thuật Công nghệ Cần Thơ'}
                </p>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Landing;
