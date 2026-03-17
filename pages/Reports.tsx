import React, { useEffect, useState } from 'react';
import { Activity, Student, ClassGroup, Subject } from '../types';
import { getActivities, getAttendance, getClasses, getStudents, getAttendanceSubjects, markAttendance, deleteAttendance } from '../services/storage';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Download, Filter, UserCheck, UserX, ArrowUp } from 'lucide-react';
import * as XLSX from 'xlsx';
import { autoFitColumns } from '../services/excel';

const Reports: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');
  const [detailList, setDetailList] = useState<{ student: Student, status: string, time?: string }[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'absent'>('all');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  useEffect(() => {
    loadActivities();
  }, []);

  useEffect(() => {
    if (selectedActivityId) {
      calculateActivityStats(selectedActivityId);
    }
  }, [selectedActivityId]);

  useEffect(() => {
    // Reset filter when changing activity to avoid confusing empty screens.
    setStatusFilter('all');
  }, [selectedActivityId]);

  const loadActivities = async () => {
    const [activitiesData, classesData, subjectsData] = await Promise.all([
      getActivities(),
      getClasses(),
      getAttendanceSubjects()
    ]);
    setActivities(activitiesData.reverse());
    setClasses(classesData);
    setSubjects(subjectsData);
    if (activitiesData.length > 0) setSelectedActivityId(activitiesData[0].id);
  };

  const calculateActivityStats = async (actId: string) => {
    const activity = activities.find(a => a.id === actId);
    if (!activity) return;

    const [students, attendance] = await Promise.all([
      getStudents(activity.classId),
      getAttendance(actId)
    ]);

    // Detail List
    const details = students.map(s => {
      const record = attendance.find(r => r.studentId === s.id);
      return {
        student: s,
        status: record ? 'Có mặt' : 'Vắng',
        time: record ? new Date(record.timestamp).toLocaleTimeString() : '-'
      };
    });
    setDetailList(details);
  };

  const filteredDetailList = detailList.filter((d) => {
    if (statusFilter === 'present') return d.status === 'Có mặt';
    if (statusFilter === 'absent') return d.status === 'Vắng';
    return true;
  });

  const filterLabel = statusFilter === 'present' ? 'Có mặt' : statusFilter === 'absent' ? 'Vắng' : 'Tất cả';

  // Tính số liệu biểu đồ dựa trên danh sách gốc (không theo filter)
  const presentCount = detailList.filter(d => d.status === 'Có mặt').length;
  const absentCount = detailList.filter(d => d.status === 'Vắng').length;
  const chartData = [
    { name: 'Có mặt', value: presentCount, fill: '#22c55e' },
    { name: 'Vắng', value: absentCount, fill: '#ef4444' }
  ];

  const exportExcel = (type: 'all' | 'present' | 'absent') => {
    if (!selectedActivityId) return;
    const activity = activities.find(a => a.id === selectedActivityId);
    const classInfo = classes.find(c => c.id === activity?.classId);
    const subjectInfo = subjects.find(s => s.id === activity?.subjectId);
    
    let dataToExport = detailList;
    let fileNameSuffix = "TatCa";

    if (type === 'present') {
        dataToExport = detailList.filter(d => d.status === 'Có mặt');
        fileNameSuffix = "DaDiemDanh";
    } else if (type === 'absent') {
        dataToExport = detailList.filter(d => d.status === 'Vắng');
        fileNameSuffix = "VangMat";
    }

    if (dataToExport.length === 0) {
        alert("Không có dữ liệu tương ứng để xuất file.");
        return;
    }

    // Prepare data for Excel
    const data = dataToExport.map((d, index) => ({
      'STT': index + 1,
      'Mã SV': d.student.id,
      'Họ đệm': d.student.lastName,
      'Tên': d.student.firstName,
      'Ngày sinh': d.student.dob,
      'Trạng thái': d.status,
      'Giờ điểm danh': d.time,
      'Lớp': classInfo?.name || '',
      'Học phần': subjectInfo?.name || '',
      'Hoạt động': activity?.name || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    autoFitColumns(ws, data, { padding: 6, maxWidth: 100 });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DiemDanh");
    XLSX.writeFile(wb, `DiemDanh_${fileNameSuffix}_${activity?.name}_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const handleToggleAttendance = async (studentId: string, studentName: string, currentStatus: string) => {
    if (!selectedActivityId) return;
    
    // Xác nhận trước khi thay đổi
    const action = currentStatus === 'Có mặt' ? 'đánh dấu VẮNG' : 'đánh dấu CÓ MẶT';
    if (!window.confirm(`Bạn có chắc muốn ${action} cho sinh viên:\n${studentName}?`)) {
      return;
    }
    
    try {
      if (currentStatus === 'Có mặt') {
        // Xóa điểm danh
        await deleteAttendance(selectedActivityId, studentId);
      } else {
        // Đánh dấu có mặt
        await markAttendance(selectedActivityId, studentId);
      }
      // Tải lại dữ liệu
      await calculateActivityStats(selectedActivityId);
    } catch (e: any) {
      alert('Lỗi: ' + e.message);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Thống Kê & Báo Cáo</h1>
        <div className="flex flex-col md:flex-row gap-2 w-full xl:w-auto">
           <select 
             value={selectedActivityId}
             onChange={(e) => setSelectedActivityId(e.target.value)}
             className="border border-gray-300 rounded-lg p-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none flex-1 md:min-w-[250px]"
           >
             {activities.map(a => {
               const classInfo = classes.find(c => c.id === a.classId);
               const subjectInfo = subjects.find(s => s.id === a.subjectId);
               const displayText = `${classInfo?.name || 'N/A'} / ${subjectInfo?.name || 'N/A'} / ${a.name}`;
               return (
                 <option key={a.id} value={a.id}>{displayText} - {new Date(a.dateTime).toLocaleDateString()}</option>
               );
             })}
           </select>
           
           <div className="flex gap-2 flex-wrap">
               <button 
                 onClick={() => exportExcel('present')}
                 className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium whitespace-nowrap"
                 title="Xuất danh sách sinh viên có mặt"
               >
                 <UserCheck size={16} /> Xuất Đã Điểm Danh
               </button>
               <button 
                 onClick={() => exportExcel('absent')}
                 className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium whitespace-nowrap"
                 title="Xuất danh sách sinh viên vắng mặt"
               >
                 <UserX size={16} /> Xuất Vắng
               </button>
               <button 
                 onClick={() => exportExcel('all')}
                 className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium whitespace-nowrap"
                 title="Xuất tất cả"
               >
                 <Download size={16} /> Tất Cả
               </button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-700 mb-4 text-center">Biểu đồ tỷ lệ tham gia</h3>
          <div className="h-64">
            {detailList.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={60}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                Chưa có dữ liệu. Vui lòng chọn hoạt động.
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-center gap-6 text-sm">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              Có mặt: <strong className="text-green-600">{presentCount}</strong>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              Vắng: <strong className="text-red-600">{absentCount}</strong>
            </span>
          </div>
          <div className="mt-2 text-center text-sm text-gray-500">
            Tổng sinh viên: {detailList.length} • Đang hiển thị: {filteredDetailList.length}
          </div>
        </div>

        {/* Detailed List Section */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
           <div className="p-4 bg-gray-50 border-b border-gray-200 font-semibold text-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span>Chi tiết điểm danh</span>
              <div className="flex items-center gap-2 text-sm font-normal text-gray-600">
                <Filter size={16} />
                <span className="text-gray-500">Lọc:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  title="Lọc theo trạng thái điểm danh"
                >
                  <option value="all">Tất cả</option>
                  <option value="present">Có mặt</option>
                  <option value="absent">Vắng</option>
                </select>
                <span className="text-gray-400">({filterLabel})</span>
              </div>
           </div>
           <div className="overflow-x-auto max-h-[500px]">
             <table className="w-full text-sm text-left text-gray-500">
               <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                 <tr>
                   <th className="px-4 py-3 text-center">Điểm danh</th>
                   <th className="px-6 py-3">MSSV</th>
                   <th className="px-6 py-3">Họ Tên</th>
                   <th className="px-6 py-3">Trạng thái</th>
                   <th className="px-6 py-3">Thời gian</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {filteredDetailList.map((d) => (
                   <tr key={d.student.id} className="hover:bg-gray-50">
                     <td className="px-4 py-4 text-center">
                       <input 
                         type="checkbox"
                         checked={d.status === 'Có mặt'}
                         onChange={() => handleToggleAttendance(d.student.id, `${d.student.lastName} ${d.student.firstName}`, d.status)}
                         className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-2 focus:ring-green-500 cursor-pointer"
                         title={d.status === 'Có mặt' ? 'Bỏ điểm danh' : 'Đánh dấu có mặt'}
                       />
                     </td>
                     <td className="px-6 py-4 font-medium">{d.student.id}</td>
                     <td className="px-6 py-4">{d.student.lastName} {d.student.firstName}</td>
                     <td className="px-6 py-4">
                       <span className={`px-2 py-1 rounded-full text-xs font-semibold ${d.status === 'Có mặt' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                         {d.status}
                       </span>
                     </td>
                     <td className="px-6 py-4 text-gray-400">{d.time}</td>
                   </tr>
                 ))}
                 {filteredDetailList.length === 0 && (
                   <tr>
                     <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                       Không có dữ liệu cho bộ lọc hiện tại.
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
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

export default Reports;