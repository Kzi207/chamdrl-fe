
import React, { useState, useEffect } from 'react';
import { Activity, ClassGroup } from '../types';
import { getClasses, getActivities, createActivity, getAttendanceSubjects, createAttendanceSubject, createClass, deleteAttendanceSubject, deleteActivity } from '../services/storage';
import { CalendarPlus, FolderOpen, BookOpen, PlusCircle, ArrowRight, QrCode, RefreshCw, AlertTriangle, Clock, ArrowUp, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const ActivityManager: React.FC = () => {
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  // Trạng thái Tạo mới
  const [newClassName, setNewClassName] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityDate, setNewActivityDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, s, a] = await Promise.all([getClasses(), getAttendanceSubjects(), getActivities()]);
      setClasses(c);
      setSubjects(s);
      setActivities(a.reverse());
    } catch (e: any) {
      console.error("Error loading data", e);
      setError(e.message || "Không thể kết nối đến database.");
    } finally {
      setLoading(false);
      setIsInitializing(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    setLoading(true);
    try {
      const newClass: ClassGroup = {
        id: newClassName.trim(),
        name: newClassName.trim()
      };
      await createClass(newClass);
      setNewClassName('');
      await loadData();
      // Tự động chọn lớp mới
      setSelectedClassId(newClass.id);
      setSelectedSubjectId('');
      alert("Tạo lớp thành công!");
    } catch (e: any) {
      alert("Lỗi tạo lớp: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newSubjectName.trim() || !selectedClassId) return;

    setLoading(true);
    try {
      const newId = Date.now().toString();
      const newSub = {
        id: newId,
        name: newSubjectName,
        classId: selectedClassId
      };
      await createAttendanceSubject(newSub);
      setNewSubjectName('');
      // Tải lại dữ liệu và tự động chọn môn học mới
      await loadData();
      setSelectedSubjectId(newId);
      alert("Tạo môn học điểm danh thành công!");
    } catch (e: any) {
      alert("Lỗi tạo môn học: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityName || !selectedSubjectId || !selectedClassId) return;

    setLoading(true);
    try {
      const newAct: Activity = {
        id: Date.now().toString(),
        name: newActivityName,
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        dateTime: newActivityDate || new Date().toISOString()
      };
      await createActivity(newAct);
      setNewActivityName('');
      setNewActivityDate('');
      await loadData();
      alert("Tạo hoạt động & lưu ngày giờ thành công!");
    } catch (e: any) {
      alert("Lỗi: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter(s => s.classId === selectedClassId);
  const filteredActivities = activities.filter(a => a.subjectId === selectedSubjectId);

  const handleDeleteSubject = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (!window.confirm(`Bạn có chắc muốn xóa môn học "${name}"?\n\nTất cả hoạt động và điểm danh của môn này sẽ bị xóa.`)) return;

    try {
      await deleteAttendanceSubject(id);
      if (selectedSubjectId === id) setSelectedSubjectId('');
      await loadData();
    } catch (e: any) {
      alert("Lỗi xóa môn học: " + e.message);
    }
  };

  const handleDeleteActivity = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm(`Bạn có chắc muốn xóa hoạt động "${name}"?\n\nTất cả bản ghi điểm danh sẽ bị xóa.`)) return;

    try {
      await deleteActivity(id);
      await loadData();
    } catch (e: any) {
      alert("Lỗi xóa hoạt động: " + e.message);
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 h-auto md:h-[calc(100vh-64px)] flex flex-col overflow-y-auto md:overflow-hidden custom-scrollbar">
      <div className="flex items-center justify-between mb-4 md:mb-6 shrink-0 gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Quản Lý Học Phần & Điểm Danh</h1>
        <button onClick={loadData} className={`p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-all ${loading ? 'animate-spin bg-blue-50' : ''}`} title="Tải lại dữ liệu">
          <RefreshCw size={20} />
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md flex items-center gap-3 shrink-0">
          <AlertTriangle className="text-red-500" />
          <div>
            <h3 className="text-red-800 font-bold">Lỗi Database</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {isInitializing ? (
        <div className="flex items-center justify-center flex-1">
          <div className="text-gray-500 flex items-center gap-2">
            <RefreshCw className="animate-spin" /> Đang tải dữ liệu...
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 flex-1 md:overflow-hidden overflow-visible pb-8 md:pb-0">

          {/* CỘT 1: LỞP HỌC (3 cột) */}
          <div className="md:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden md:overflow-hidden flex flex-col h-auto min-h-[240px] md:h-full order-1">
            <div className="p-3 bg-gray-50 border-b font-bold text-gray-700 flex items-center gap-2 shrink-0">
              <FolderOpen size={18} /> 1. Lớp Học
            </div>

            <div className="p-3 border-b bg-white shrink-0">
              <form onSubmit={handleCreateClass} className="flex gap-2">
                <input
                  value={newClassName}
                  onChange={e => setNewClassName(e.target.value)}
                  placeholder="Mã lớp mới..."
                  className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white text-gray-900 shadow-sm transition-all focus:ring-2 focus:ring-blue-100"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium flex items-center justify-center gap-1 disabled:opacity-50 transition-all shadow-sm shrink-0"
                  title="Tạo Lớp Mới"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="animate-spin" size={16} />
                      <span className="text-xs">...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle size={18} />
                      <span className="text-sm font-bold">Tạo</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {classes.length === 0 && <div className="text-center p-8 text-gray-400 text-sm">Chưa có dữ liệu</div>}
              {classes.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedClassId(c.id); setSelectedSubjectId(''); }}
                  className={`w-full text-left p-3 rounded-lg border flex justify-between items-center text-sm transition-all duration-200 group ${selectedClassId === c.id
                    ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                    : 'border-transparent hover:bg-gray-50 text-gray-600 hover:border-gray-200'
                    }`}
                >
                  <span className="font-medium truncate">{c.name}</span>
                  {selectedClassId === c.id && <ArrowRight size={16} className="text-blue-600 animate-in fade-in slide-in-from-left-1" />}
                </button>
              ))}
            </div>
          </div>

          {/* CỘT 2: MÔN HỌC (4 cột) */}
          <div className="md:col-span-4 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden md:overflow-hidden flex flex-col h-auto min-h-[240px] md:h-full order-2">
            <div className="p-3 bg-gray-50 border-b font-bold text-gray-700 flex items-center gap-2 shrink-0">
              <BookOpen size={18} /> 2. Môn Học
            </div>

            {selectedClassId ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-3 border-b bg-white shrink-0">
                  <form onSubmit={handleCreateSubject} className="flex gap-2">
                    <input
                      value={newSubjectName}
                      onChange={e => setNewSubjectName(e.target.value)}
                      placeholder="Tên môn học..."
                      className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 bg-white text-gray-900 shadow-sm transition-all focus:ring-2 focus:ring-green-100"
                      required
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium flex items-center justify-center gap-1 disabled:opacity-50 transition-all shadow-sm shrink-0"
                      title="Tạo Môn Mới"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="animate-spin" size={16} />
                          <span className="text-xs">...</span>
                        </>
                      ) : (
                        <>
                          <PlusCircle size={18} />
                          <span className="text-sm font-bold">Tạo</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                  {filteredSubjects.length === 0 && <div className="text-center p-8 text-gray-400 text-sm">Danh sách trống</div>}
                  {filteredSubjects.map(s => (
                    <div
                      key={s.id}
                      className={`w-full text-left p-3 rounded-lg border flex justify-between items-center text-sm transition-all duration-200 group ${selectedSubjectId === s.id
                        ? 'bg-green-50 border-green-200 text-green-700 shadow-sm'
                        : 'border-transparent hover:bg-gray-50 text-gray-600 hover:border-gray-200'
                        }`}
                    >
                      <button
                        onClick={() => setSelectedSubjectId(s.id)}
                        className="flex-1 text-left flex items-center justify-between"
                      >
                        <span className="font-medium truncate">{s.name}</span>
                        {selectedSubjectId === s.id && <ArrowRight size={16} className="text-green-600 animate-in fade-in slide-in-from-left-1" />}
                      </button>
                      <button
                        onClick={(e) => handleDeleteSubject(e, s.id, s.name)}
                        className="ml-2 p-1.5 text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                        title="Xóa môn học"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-sm p-4 text-center bg-gray-50/50">
                <ArrowRight className="mb-2 text-gray-300" size={32} />
                <p>Vui lòng chọn Lớp học</p>
              </div>
            )}
          </div>

          {/* CỘT 3: PHIÊN / HOẠT ĐỘNG (5 cột) */}
          <div className="md:col-span-5 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden md:overflow-hidden flex flex-col h-auto min-h-[240px] md:h-full order-3">
            <div className="p-3 bg-gray-50 border-b font-bold text-gray-700 flex items-center gap-2 shrink-0">
              <CalendarPlus size={18} /> 3. Hoạt Động
            </div>

            {selectedSubjectId ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-3 border-b bg-white shrink-0">
                  <form onSubmit={handleCreateActivity} className="flex flex-col gap-3">
                    <div>
                      <input
                        value={newActivityName}
                        onChange={e => setNewActivityName(e.target.value)}
                        placeholder="Tên hoạt động (VD: Buổi 1)..."
                        className="border rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 w-full bg-white text-gray-900 shadow-sm transition-all focus:ring-2 focus:ring-indigo-100"
                        required
                      />
                    </div>
                    <div className="flex gap-2 items-center">
                      <input
                        type="datetime-local"
                        value={newActivityDate}
                        onChange={e => setNewActivityDate(e.target.value)}
                        className="flex-1 border border-indigo-200 rounded-lg px-3 py-2 text-sm outline-none bg-white text-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-100 transition-all"
                        required
                      />
                      <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap disabled:bg-gray-400 transition-all shadow-sm h-[38px]">
                        {loading ? '...' : 'Thêm'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Thay đổi thành LƯỚI để hiển thị tốt hơn nhiều mục */}
                <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                  {filteredActivities.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm italic">
                      <CalendarPlus size={32} className="mb-2 opacity-50" />
                      Chưa có hoạt động nào
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
                      {filteredActivities.map(act => (
                        <div key={act.id} className="border border-gray-100 rounded-xl p-3 hover:shadow-md hover:border-indigo-100 bg-white transition-all duration-300 flex flex-col gap-2 group relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-indigo-50 to-transparent rounded-bl-3xl -mr-4 -mt-4 transition-transform group-hover:scale-150"></div>

                          <div className="relative z-10 flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-800 text-base line-clamp-1" title={act.name}>{act.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
                                  {new Date(act.dateTime).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                </span>
                                <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                  <Clock size={10} /> {new Date(act.dateTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={(e) => handleDeleteActivity(e, act.id, act.name)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                              title="Xóa hoạt động"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>

                          <Link
                            to={`/attendance/${act.id}`}
                            className="relative z-10 mt-auto bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-600 hover:text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-all group-hover:shadow-sm"
                          >
                            <QrCode size={16} />
                            <span>Điểm Danh</span>
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-sm p-4 text-center bg-gray-50/50">
                {selectedClassId ? (
                  <>
                    <ArrowRight className="mb-2 text-gray-300" size={32} />
                    <p>Vui lòng chọn Môn học</p>
                  </>
                ) : (
                  <span className="text-gray-300 text-4xl font-light opacity-20">•••</span>
                )}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Nút Quay lại Đầu trang */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-[100] p-3 bg-blue-600/90 text-white rounded-full shadow-xl hover:bg-blue-700 backdrop-blur-sm transition-all duration-300 hover:scale-110 border border-white/20"
          title="Quay lại đầu trang"
        >
          <ArrowUp size={24} />
        </button>
      )}    </div>
  );
};

export default ActivityManager;