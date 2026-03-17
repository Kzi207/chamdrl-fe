import React, { useState, useEffect, useMemo } from 'react';
import { getCurrentUser, getStudents, getDRLScores, getClasses, getGradingPeriods } from '../services/storage';
import { Student, DRLScore, ClassGroup, GradingPeriod } from '../types';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FileText, CheckCircle, XCircle, RefreshCw, AlertCircle, ArrowUp } from 'lucide-react';
import * as XLSX from 'xlsx';
import { autoFitColumns } from '../services/excel';

const DRLStatistics: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<DRLScore[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [periods, setPeriods] = useState<GradingPeriod[]>([]);
  
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Sắp xếp sinh viên theo tên (firstName, lastName)
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      const firstNameCompare = (a.firstName || '').localeCompare(b.firstName || '', 'vi');
      if (firstNameCompare !== 0) return firstNameCompare;
      return (a.lastName || '').localeCompare(b.lastName || '', 'vi');
    });
  }, [students]);

  // Back-to-top scroll listener
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
    if (selectedClassId && selectedPeriodId) {
      loadStudentData();
    }
  }, [selectedClassId, selectedPeriodId]);

  const loadInitialData = async () => {
    try {
      const [cls, per] = await Promise.all([getClasses(), getGradingPeriods()]);
      setClasses(cls);
      setPeriods(per);
      
      if (per.length > 0) {
        setSelectedPeriodId(per[per.length - 1].id);
      } else {
        setSelectedPeriodId('HK1_2024');
      }
      
      if (currentUser?.classId) {
        setSelectedClassId(currentUser.classId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadStudentData = async () => {
    setLoading(true);
    try {
      const allStudents = await getStudents(selectedClassId);
      const allScores = await getDRLScores();
      
      setStudents(allStudents);
      setScores(allScores.filter(s => s.semester === selectedPeriodId));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStudentStatus = (studentId: string) => {
    const score = scores.find(s => s.studentId === studentId);
    if (!score || score.selfScore === 0) {
      return { status: 'not_started', label: 'Chưa chấm', color: 'bg-gray-100 text-gray-600 border-gray-300' };
    } else if (score.status === 'draft') {
      return { status: 'draft', label: 'Đang chấm', color: 'bg-yellow-50 text-yellow-700 border-yellow-300' };
    } else {
      return { status: 'completed', label: 'Đã chấm', color: 'bg-green-50 text-green-700 border-green-300' };
    }
  };

  const exportExcel = () => {
    if (students.length === 0) {
      alert("Danh sách trống!");
      return;
    }

    const data = students.map((std, idx) => {
      const score = scores.find(s => s.studentId === std.id);
      const status = getStudentStatus(std.id);
      
      return {
        'STT': idx + 1,
        'MSSV': std.id,
        'Họ Tên': `${std.lastName} ${std.firstName}`,
        'Ngày Sinh': std.dob,
        'Trạng thái': status.label,
        'Điểm tự chấm': score?.selfScore || 0,
        'Điểm lớp': score?.classScore || 0,
        'Điểm cuối': score?.finalScore || score?.classScore || score?.selfScore || 0,
        'Trạng thái nộp': score?.status || 'Chưa nộp'
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    autoFitColumns(ws, data, { padding: 6, maxWidth: 100 });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Thống kê ĐRL");
    
    const className = classes.find(c => c.id === selectedClassId)?.name || selectedClassId;
    XLSX.writeFile(wb, `ThongKe_DRL_${selectedPeriodId}_${className}.xlsx`);
  };

  const stats = {
    total: students.length,
    completed: students.filter(s => {
      const score = scores.find(sc => sc.studentId === s.id);
      return score && score.status !== 'draft' && score.selfScore > 0;
    }).length,
    draft: students.filter(s => {
      const score = scores.find(sc => sc.studentId === s.id);
      return score && score.status === 'draft' && score.selfScore > 0;
    }).length,
    notStarted: students.filter(s => {
      const score = scores.find(sc => sc.studentId === s.id);
      return !score || score.selfScore === 0;
    }).length
  };

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const isAdminOrMonitor = ['admin', 'monitor'].includes(currentUser?.role || '');

  return (
    <div className="p-4 max-w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/drl')} 
            className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FileText size={22} className="text-indigo-600"/> Thống Kê ĐRL
            </h1>
            <div className="text-sm text-gray-500">Theo dõi tiến độ chấm điểm rèn luyện</div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
          {/* Period Selector */}
          <select 
            className="border p-2 rounded text-sm bg-gray-50 shadow-sm outline-none focus:ring-2 ring-indigo-500"
            value={selectedPeriodId}
            onChange={e => setSelectedPeriodId(e.target.value)}
          >
            {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            {periods.length === 0 && <option value="HK1_2024">HK1_2024</option>}
          </select>

          {/* Class Selector */}
          {isAdminOrMonitor && (
            <select 
              className="border p-2 rounded text-sm bg-gray-50 shadow-sm outline-none focus:ring-2 ring-indigo-500"
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
            >
              <option value="">-- Chọn Lớp --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}

          <button 
            onClick={exportExcel}
            disabled={students.length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded text-sm flex items-center gap-2 hover:bg-green-700 disabled:bg-gray-400 font-medium shadow-sm"
          >
            <Download size={16}/> Xuất Excel
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {selectedClassId && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-gray-500 text-xs uppercase font-bold mb-1">Tổng số SV</div>
            <div className="text-3xl font-bold text-gray-800">{stats.total}</div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg shadow-sm border border-green-200">
            <div className="text-green-600 text-xs uppercase font-bold mb-1 flex items-center gap-1">
              <CheckCircle size={14}/> Đã chấm
            </div>
            <div className="text-3xl font-bold text-green-700">{stats.completed}</div>
            <div className="text-xs text-green-600 mt-1">{completionRate}%</div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg shadow-sm border border-yellow-200">
            <div className="text-yellow-600 text-xs uppercase font-bold mb-1 flex items-center gap-1">
              <AlertCircle size={14}/> Đang chấm
            </div>
            <div className="text-3xl font-bold text-yellow-700">{stats.draft}</div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg shadow-sm border border-red-200">
            <div className="text-red-600 text-xs uppercase font-bold mb-1 flex items-center gap-1">
              <XCircle size={14}/> Chưa chấm
            </div>
            <div className="text-3xl font-bold text-red-700">{stats.notStarted}</div>
          </div>
        </div>
      )}

      {/* Student List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500 flex flex-col items-center justify-center">
            <RefreshCw className="animate-spin mb-2" size={24}/>
            <span className="text-sm">Đang tải danh sách...</span>
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-100 text-gray-700 text-sm uppercase">
                <tr>
                  <th className="p-3 border-b">STT</th>
                  <th className="p-3 border-b">MSSV</th>
                  <th className="p-3 border-b">Họ và Tên</th>
                  <th className="p-3 border-b text-center">Ngày Sinh</th>
                  <th className="p-3 border-b text-center">Trạng thái</th>
                  <th className="p-3 border-b text-center">Điểm SV</th>
                  <th className="p-3 border-b text-center">Điểm Lớp</th>
                  <th className="p-3 border-b text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {sortedStudents.map((student, idx) => {
                  const status = getStudentStatus(student.id);
                  const score = scores.find(s => s.studentId === student.id);
                  
                  return (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3">{idx + 1}</td>
                      <td className="p-3 font-medium text-gray-800">{student.id}</td>
                      <td className="p-3 font-medium">{student.lastName} {student.firstName}</td>
                      <td className="p-3 text-center text-gray-600">{student.dob}</td>
                      <td className="p-3 text-center">
                        <span className={`px-3 py-1 rounded-full border text-xs font-bold uppercase ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold text-gray-800">{score?.selfScore || 0}</td>
                      <td className="p-3 text-center font-bold text-blue-700">{score?.classScore || '-'}</td>
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => navigate(`/drl/form/${student.id}?period=${selectedPeriodId}`)}
                          className="bg-indigo-600 text-white px-3 py-1 rounded text-xs hover:bg-indigo-700 font-medium"
                        >
                          Xem
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-10 text-center text-gray-400">
                      {selectedClassId ? 'Không có sinh viên nào trong lớp này.' : 'Vui lòng chọn Lớp để xem danh sách.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all duration-300 hover:scale-110"
          title="Quay lại đầu trang"
        >
          <ArrowUp size={24} />
        </button>
      )}
    </div>
  );
};

export default DRLStatistics;
