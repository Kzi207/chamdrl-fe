import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Megaphone,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getCurrentUser } from '../services/storage';
import StudentBottomNav from '../components/StudentBottomNav';

type ActivityCategory = 'all' | 'notice' | 'schedule' | 'attendance' | 'training';

type ActivityItem = {
  id: string;
  category: Exclude<ActivityCategory, 'all'>;
  title: string;
  description: string;
  time: string;
  status: 'new' | 'upcoming' | 'done';
};

const activityData: ActivityItem[] = [
  {
    id: '1',
    category: 'notice',
    title: 'Thong bao nop minh chung DRL',
    description: 'Vui long hoan tat truoc ngay 30/11/2023 tren he thong quan ly ren luyen.',
    time: '2 gio truoc',
    status: 'new'
  },
  {
    id: '2',
    category: 'schedule',
    title: 'Lich hoc mon Phat trien Mobile',
    description: 'Phong B.402 - Giang vien: ThS. Nguyen Van A. Thoi gian: 13:30 - 16:30.',
    time: 'Ngay mai, 14 Th11',
    status: 'upcoming'
  },
  {
    id: '3',
    category: 'attendance',
    title: 'Thong bao diem danh hoat dong X',
    description: 'Ban da hoan thanh diem danh luc 08:45 sang nay tai Hoi truong A.',
    time: 'Hom nay, 08:45',
    status: 'done'
  },
  {
    id: '4',
    category: 'training',
    title: 'Cap nhat diem GPA hoc ky',
    description: 'Diem trung binh hoc ky 1 cua ban da duoc cap nhat: 3.8/4.0.',
    time: '2 ngay truoc',
    status: 'done'
  }
];

const getCategoryMeta = (category: ActivityItem['category']) => {
  if (category === 'notice') return { label: 'Thong bao', icon: Megaphone, iconClass: 'bg-blue-100 text-blue-600' };
  if (category === 'schedule') return { label: 'Lich hoc', icon: BookOpen, iconClass: 'bg-indigo-100 text-indigo-600' };
  if (category === 'attendance') return { label: 'Diem danh', icon: CheckCircle2, iconClass: 'bg-emerald-100 text-emerald-600' };
  return { label: 'Ren luyen', icon: TrendingUp, iconClass: 'bg-amber-100 text-amber-600' };
};

const getStatusMeta = (status: ActivityItem['status']) => {
  if (status === 'new') return { label: 'Moi', className: 'bg-orange-100 text-orange-600' };
  if (status === 'upcoming') return { label: 'Sap toi', className: 'bg-blue-100 text-blue-600' };
  return { label: 'Da qua', className: 'bg-slate-100 text-slate-500' };
};

const StudentActivities: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ActivityCategory>('all');

  if (!currentUser) {
    navigate('/login', { replace: true });
    return null;
  }

  if (currentUser.role !== 'student') {
    navigate('/admin-home', { replace: true });
    return null;
  }

  const filters: { id: ActivityCategory; label: string; icon?: LucideIcon }[] = [
    { id: 'all', label: 'Tat ca' },
    { id: 'notice', label: 'Thong bao', icon: Megaphone },
    { id: 'schedule', label: 'Lich hoc', icon: CalendarDays },
    { id: 'attendance', label: 'Diem danh', icon: CheckCircle2 },
    { id: 'training', label: 'Ren luyen', icon: Sparkles }
  ];

  const filteredActivities = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return activityData.filter((item) => {
      const passFilter = filter === 'all' || item.category === filter;
      if (!passFilter) return false;
      if (!normalized) return true;
      return (
        item.title.toLowerCase().includes(normalized) ||
        item.description.toLowerCase().includes(normalized) ||
        item.time.toLowerCase().includes(normalized)
      );
    });
  }, [filter, query]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden max-w-md mx-auto md:max-w-6xl">
        <div className="flex items-center bg-slate-50 p-4 pb-2 justify-between sticky top-0 z-10 border-b border-slate-200">
          <button className="text-blue-500 flex size-10 shrink-0 items-center justify-center rounded-xl hover:bg-blue-50" onClick={() => navigate('/student-home')} type="button">
            <ArrowLeft size={22} />
          </button>
          <h2 className="text-slate-900 text-lg font-bold leading-tight tracking-tight flex-1 text-center">Tat ca hoat dong</h2>
          <div className="flex w-10 items-center justify-end">
            <button className="flex items-center justify-center rounded-xl h-10 w-10 bg-transparent text-blue-500" type="button">
              <Bell size={20} />
            </button>
          </div>
        </div>

        <div className="px-4 py-3 bg-slate-50">
          <label className="flex min-w-40 h-12 w-full">
            <div className="flex w-full flex-1 items-stretch rounded-xl h-full shadow-sm">
              <div className="text-slate-400 flex bg-white items-center justify-center pl-4 rounded-l-xl">
                <Search size={18} />
              </div>
              <input
                className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-slate-900 focus:outline-0 focus:ring-0 border-none bg-white h-full placeholder:text-slate-400 px-4 rounded-l-none border-l-0 pl-2 text-base"
                placeholder="Tim kiem hoat dong..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </label>
        </div>

        <div className="flex gap-3 p-4 overflow-x-auto bg-slate-50 md:flex-wrap md:overflow-visible">
          {filters.map((item) => {
            const isActive = filter === item.id;
            return (
              <button
                key={item.id}
                className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-xl px-4 border transition-colors ${isActive ? 'bg-blue-500 text-white border-blue-500 shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'}`}
                onClick={() => setFilter(item.id)}
                type="button"
              >
                {item.icon ? <item.icon size={16} /> : null}
                <span className="text-sm font-medium leading-normal">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex-1 px-4 py-2 space-y-4 pb-[calc(74px+env(safe-area-inset-bottom))]">
          <div className="md:flex md:items-center md:justify-between">
            <h3 className="text-slate-900 text-lg font-bold leading-tight tracking-tight pt-2">Hoat dong gan day</h3>
            <p className="hidden md:block text-sm text-slate-500">{filteredActivities.length} ket qua</p>
          </div>

          {filteredActivities.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-500 text-sm">
              Khong tim thay hoat dong phu hop.
            </div>
          )}

          {filteredActivities.map((activity) => {
            const category = getCategoryMeta(activity.category);
            const status = getStatusMeta(activity.status);
            return (
              <div key={activity.id} className="flex items-start gap-4 p-4 rounded-xl bg-white shadow-sm border border-slate-100">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${category.iconClass}`}>
                  <category.icon size={20} />
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex justify-between items-start gap-3">
                    <p className="text-slate-900 text-base font-semibold leading-tight">{activity.title}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${status.className}`}>{status.label}</span>
                  </div>
                  <p className="text-slate-500 text-sm leading-normal">{activity.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <CalendarDays size={14} className="text-slate-400" />
                    <p className="text-slate-400 text-xs font-medium uppercase">{activity.time}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <StudentBottomNav />
      </div>
    </div>
  );
};

export default StudentActivities;
