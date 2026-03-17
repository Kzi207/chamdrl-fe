import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, ClipboardList, Home, User } from 'lucide-react';
import { getCurrentUser } from '../services/storage';

type StudentBottomNavItem = 'home' | 'drl' | 'gpa' | 'profile';

interface StudentBottomNavProps {
  active?: StudentBottomNavItem;
}

const StudentBottomNav: React.FC<StudentBottomNavProps> = ({ active }) => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const studentId = currentUser?.username || '';

  const itemClass = (key: StudentBottomNavItem) => {
    if (active === key) return 'text-blue-600';
    return 'text-slate-500 hover:text-blue-600';
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[60] bg-white/95 backdrop-blur border-t border-slate-200 shadow-2xl"
      style={{ paddingBottom: 'max(6px, env(safe-area-inset-bottom))' }}
    >
      <div className="max-w-7xl mx-auto h-[56px] px-1.5 grid grid-cols-4 gap-1">
        <button
          type="button"
          onClick={() => navigate('/student-home')}
          className={`w-full h-full rounded-xl flex flex-col items-center justify-center active:scale-[0.98] transition-colors ${itemClass('home')}`}
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-medium mt-0.5">Trang chủ</span>
        </button>

        <button
          type="button"
          onClick={() => navigate(`/drl/form/${studentId}`)}
          className={`w-full h-full rounded-xl flex flex-col items-center justify-center active:scale-[0.98] transition-colors ${itemClass('drl')}`}
        >
          <ClipboardList className="h-5 w-5" />
          <span className="text-[10px] font-medium mt-0.5">ĐRL</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/gpa')}
          className={`w-full h-full rounded-xl flex flex-col items-center justify-center active:scale-[0.98] transition-colors ${itemClass('gpa')}`}
        >
          <BarChart3 className="h-5 w-5" />
          <span className="text-[10px] font-medium mt-0.5">GPA</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/settings')}
          className={`w-full h-full rounded-xl flex flex-col items-center justify-center active:scale-[0.98] transition-colors ${itemClass('profile')}`}
        >
          <User className="h-5 w-5" />
          <span className="text-[10px] font-medium mt-0.5">Hồ sơ</span>
        </button>
      </div>
    </nav>
  );
};

export default StudentBottomNav;
