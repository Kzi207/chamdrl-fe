import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Ghost } from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4 overflow-hidden relative">
      {/* Playful Floating Background Shapes */}
      <div className="absolute top-[10%] left-[10%] w-32 h-32 bg-blue-300 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-bounce" style={{ animationDuration: '4s' }}></div>
      <div className="absolute top-[20%] right-[15%] w-48 h-48 bg-orange-300 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-bounce" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
      <div className="absolute bottom-[10%] left-[20%] w-40 h-40 bg-indigo-300 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-bounce" style={{ animationDuration: '6s', animationDelay: '2s' }}></div>

      <div className="text-center max-w-2xl mx-auto px-4 relative z-10">

        {/* Animated Ghost Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-white p-6 rounded-3xl shadow-xl border-4 border-orange-100 transform rotate-[-5deg] hover:rotate-12 transition-transform duration-300">
            <Ghost size={80} className="text-orange-500 animate-pulse" />
          </div>
        </div>

        {/* 404 Number */}
        <div className="mb-4">
          <h1 className="text-8xl md:text-[140px] font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 drop-shadow-sm" style={{ fontFamily: "'Baloo 2', cursive" }}>
            404
          </h1>
        </div>

        {/* Title */}
        <h2 className="text-3xl md:text-5xl font-bold text-slate-800 mb-4" style={{ fontFamily: "'Baloo 2', cursive" }}>
          Ối! Lạc đường rồi!
        </h2>

        {/* Description */}
        <p className="text-slate-600 text-lg md:text-xl mb-10 max-w-lg mx-auto font-medium">
          Trang bạn đang tìm kiếm có vẻ như đã "trốn" đi đâu mất tiêu, hoặc chưa từng tồn tại ở vũ trụ này.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary flex items-center justify-center gap-2 group bg-white"
          >
            <ArrowLeft size={22} className="group-hover:-translate-x-1 transition-transform" />
            Quay lại nhé
          </button>

          <button
            onClick={() => navigate('/')}
            className="btn-primary flex items-center justify-center gap-2 group"
          >
            <Home size={22} className="group-hover:-translate-y-1 transition-transform" />
            Về nhà thôi
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-16 pt-6 border-t-2 border-slate-200">
          <p className="text-slate-400 text-sm font-semibold">
            Nếu bạn liên tục gặp ảo ảnh này, hãy báo ngay cho Quản trị viên!
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
