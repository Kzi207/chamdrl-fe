
import React, { useState, useEffect } from 'react';
import { getClasses, getActivities, getAttendance, getStudents, getAttendanceSubjects } from '../services/storage';
import { ClassGroup, Activity, Subject, Student } from '../types';
import { Search, Users, CheckCircle, XCircle, ArrowLeft, ArrowUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GuestView: React.FC = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedActivity, setSelectedActivity] = useState<string>('');
  
  const [reportData, setReportData] = useState<{student: Student, present: boolean, time?: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedActivity) {
      loadReport(selectedActivity);
    }
  }, [selectedActivity]);

  const loadInitialData = async () => {
    const [c, s, a] = await Promise.all([getClasses(), getAttendanceSubjects(), getActivities()]);
    setClasses(c);
    setSubjects(s);
    setActivities(a);
  };

  const loadReport = async (actId: string) => {
    setLoading(true);
    const act = activities.find(a => a.id === actId);
    if (!act) return;

    const [allStudents, attendance] = await Promise.all([
      getStudents(act.classId),
      getAttendance(actId)
    ]);

    const data = allStudents.map(s => {
      const record = attendance.find(r => r.studentId === s.id);
      return {
        student: s,
        present: !!record,
        time: record ? new Date(record.timestamp).toLocaleTimeString('vi-VN') : undefined
      };
    });
    setReportData(data);
    setLoading(false);
  };

  // Filter lists based on selection
  const filteredSubjects = subjects.filter(s => s.classId === selectedClass);
  const filteredActivities = activities.filter(a => a.subjectId === selectedSubject || (a.classId === selectedClass && !a.subjectId && !selectedSubject));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-[Segoe UI,Arial,sans-serif]">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4 overflow-hidden">
          <button onClick={() => navigate('/')} className="text-gray-500 hover:text-[#2563eb] p-1 shrink-0"><ArrowLeft/></button>
          
          <div className="flex items-center gap-3">
             <img src="../" alt="Logo" className="w-[48px] h-[48px] sm:w-[56px] sm:h-[56px] object-contain shrink-0" />
             <div className="flex flex-col justify-center">
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1">
                    <div className="font-bold text-[#1e3a8a] text-[11px] sm:text-[13px] whitespace-nowrap">TRƯỜNG ĐẠI HỌC</div>
                    <div className="font-black text-[#1e3a8a] uppercase text-[12px] sm:text-[15px] whitespace-nowrap">KỸ THUẬT – CÔNG NGHỆ CẦN THƠ</div>
                </div>
                <div className="w-12 h-[2px] bg-blue-600 my-0.5"></div>
                <div className="font-black text-blue-700 uppercase text-[12px] sm:text-[14px] tracking-wide">KHOA KỸ THUẬT CƠ KHÍ</div>
             </div>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6">
        
        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chọn Lớp</label>
            <select 
              value={selectedClass}
              onChange={e => { setSelectedClass(e.target.value); setSelectedSubject(''); setSelectedActivity(''); }}
              className="w-full border p-2 rounded-lg outline-none focus:ring-2 ring-blue-500 bg-white text-gray-900"
            >
              <option value="">-- Chọn Lớp --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chọn Học Phần</label>
            <select 
              value={selectedSubject}
              onChange={e => { setSelectedSubject(e.target.value); setSelectedActivity(''); }}
              disabled={!selectedClass}
              className="w-full border p-2 rounded-lg outline-none focus:ring-2 ring-blue-500 disabled:bg-gray-100 bg-white text-gray-900"
            >
              <option value="">-- Chọn Học Phần --</option>
              {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chọn Buổi Học</label>
            <select 
              value={selectedActivity}
              onChange={e => setSelectedActivity(e.target.value)}
              disabled={!selectedSubject && !selectedClass}
              className="w-full border p-2 rounded-lg outline-none focus:ring-2 ring-blue-500 disabled:bg-gray-100 bg-white text-gray-900"
            >
              <option value="">-- Chọn Buổi --</option>
              {filteredActivities.map(a => <option key={a.id} value={a.id}>{a.name} ({new Date(a.dateTime).toLocaleDateString()})</option>)}
            </select>
          </div>
        </div>

        {/* Result Area */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
          {!selectedActivity ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-10">
              <Search size={64} className="mb-4 opacity-20"/>
              <p>Vui lòng chọn đầy đủ thông tin để xem danh sách điểm danh.</p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
               <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                 <h2 className="font-bold text-gray-800 flex items-center gap-2">
                   <Users size={18}/> Danh sách sinh viên
                 </h2>
                 <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                   Có mặt: {reportData.filter(d => d.present).length} / {reportData.length}
                 </span>
               </div>
               
               {loading ? (
                 <div className="p-10 text-center text-gray-500">Đang tải dữ liệu...</div>
               ) : (
                 <div className="overflow-auto flex-1">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-700 uppercase text-xs sticky top-0">
                        <tr>
                          <th className="px-6 py-3">MSSV</th>
                          <th className="px-6 py-3">Họ Tên</th>
                          <th className="px-6 py-3">Trạng thái</th>
                          <th className="px-6 py-3">Giờ vào</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {reportData.map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium">{row.student.id}</td>
                            <td className="px-6 py-4">{row.student.lastName} {row.student.firstName}</td>
                            <td className="px-6 py-4">
                              {row.present ? (
                                <span className="flex items-center gap-1 text-green-600 font-bold"><CheckCircle size={14}/> Có mặt</span>
                              ) : (
                                <span className="flex items-center gap-1 text-red-500"><XCircle size={14}/> Vắng</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-gray-500">{row.time || '-'}</td>
                          </tr>
                        ))}
                        {reportData.length === 0 && (
                          <tr><td colSpan={4} className="p-6 text-center text-gray-400">Không tìm thấy sinh viên nào.</td></tr>
                        )}
                      </tbody>
                    </table>
                 </div>
               )}
            </div>
          )}
        </div>
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 hover:scale-110"
          title="Quay lại đầu trang"
        >
          <ArrowUp size={24} />
        </button>
      )}
    </div>
  );
};

export default GuestView;
