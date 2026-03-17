
import React, { useState, useEffect } from 'react';
import { getGradingPeriods, createGradingPeriod, updateGradingPeriod, deleteGradingPeriod } from '../services/storage';
import { GradingPeriod } from '../types';
import { Calendar, PlusCircle, Edit, Trash2, ArrowLeft, Save, RefreshCw, AlertTriangle, Check, ArrowUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GradingPeriods: React.FC = () => {
  const navigate = useNavigate();
  const [periods, setPeriods] = useState<GradingPeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Form State
  const [newPeriod, setNewPeriod] = useState({ id: '', name: '', startDate: '', endDate: '' });
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  useEffect(() => {
    fetchPeriods();
  }, []);

  const fetchPeriods = async () => {
    setLoading(true);
    try {
        const data = await getGradingPeriods();
        setPeriods(data);
        setError(null);
    } catch (e) {
        setError("Lỗi tải dữ liệu: " + (e as Error).message);
    } finally {
        setLoading(false);
    }
  };

  const handleSavePeriod = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newPeriod.id || !newPeriod.name) {
          alert("Vui lòng nhập ID và Tên đợt chấm.");
          return;
      }
      try {
          const payload: GradingPeriod = {
              id: newPeriod.id,
              name: newPeriod.name,
              startDate: newPeriod.startDate,
              endDate: newPeriod.endDate
          };

          if (editingPeriodId) {
              await updateGradingPeriod(payload);
              alert("Cập nhật đợt chấm thành công!");
          } else {
              // Check dupes
              if (periods.some(p => p.id === newPeriod.id)) {
                  alert("ID đợt chấm đã tồn tại!");
                  return;
              }
              await createGradingPeriod(payload);
              alert("Tạo đợt chấm thành công!");
          }
          
          await fetchPeriods();
          handleCancelEdit();
      } catch (e) {
          alert("Lỗi: " + (e as Error).message);
      }
  };

  const handleEditPeriod = (period: GradingPeriod) => {
      setNewPeriod({ 
        id: period.id, 
        name: period.name, 
        startDate: period.startDate || '', 
        endDate: period.endDate || '' 
      });
      setEditingPeriodId(period.id);
  };

  const handleCancelEdit = () => {
      setNewPeriod({ id: '', name: '', startDate: '', endDate: '' });
      setEditingPeriodId(null);
  };

  const handleDeletePeriod = async (id: string) => {
      if(!window.confirm(`Bạn có chắc muốn xóa đợt chấm "${id}"? Dữ liệu điểm rèn luyện liên quan có thể bị ảnh hưởng.`)) return;
      try {
          await deleteGradingPeriod(id);
          fetchPeriods();
      } catch(e) {
          alert("Lỗi xóa: " + (e as Error).message);
      }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
             <button onClick={() => navigate('/drl')} className="p-2 hover:bg-gray-200 rounded-full text-gray-600 transition-colors">
                <ArrowLeft size={20} />
             </button>
             <div>
                 <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Calendar className="text-blue-600"/> Quản Lý Đợt Chấm
                 </h1>
                 <p className="text-gray-500 text-sm">Thiết lập các học kỳ và thời gian chấm điểm rèn luyện.</p>
             </div>
        </div>

        {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm mb-6 flex items-start gap-3">
                <AlertTriangle size={24} className="text-red-600"/>
                <p className="text-red-700">{error}</p>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: Form */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
                <h3 className="font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                    {editingPeriodId ? <Edit size={18} className="text-orange-600"/> : <PlusCircle size={18} className="text-blue-600"/>}
                    {editingPeriodId ? 'Cập Nhật Đợt Chấm' : 'Thêm Đợt Mới'}
                </h3>
                
                <form onSubmit={handleSavePeriod} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mã Đợt / Học Kỳ (ID)</label>
                        <input 
                            type="text" 
                            required
                            disabled={!!editingPeriodId}
                            value={newPeriod.id}
                            onChange={e => setNewPeriod({...newPeriod, id: e.target.value})}
                            className={`w-full border p-2 rounded-lg outline-none text-sm font-mono ${editingPeriodId ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500 bg-white text-gray-900'}`}
                            placeholder="VD: HK1_2024"
                        />
                        <p className="text-xs text-gray-400 mt-1">Mã duy nhất, không dấu, không khoảng trắng.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên Hiển Thị</label>
                        <input 
                            type="text" 
                            required
                            value={newPeriod.name}
                            onChange={e => setNewPeriod({...newPeriod, name: e.target.value})}
                            className="w-full border p-2 rounded-lg outline-none text-sm focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                            placeholder="VD: Học kỳ 1, Năm 2024-2025"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                            <input 
                                type="date" 
                                value={newPeriod.startDate}
                                onChange={e => setNewPeriod({...newPeriod, startDate: e.target.value})}
                                className="w-full border p-2 rounded-lg outline-none text-sm focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                            <input 
                                type="date" 
                                value={newPeriod.endDate}
                                onChange={e => setNewPeriod({...newPeriod, endDate: e.target.value})}
                                className="w-full border p-2 rounded-lg outline-none text-sm focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        {editingPeriodId && (
                            <button 
                                type="button" 
                                onClick={handleCancelEdit}
                                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors"
                            >
                                Hủy
                            </button>
                        )}
                        <button 
                            type="submit" 
                            className={`flex-1 text-white py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 ${editingPeriodId ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {editingPeriodId ? <Save size={16}/> : <PlusCircle size={16}/>}
                            {editingPeriodId ? 'Lưu Thay Đổi' : 'Tạo Mới'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Right Column: List */}
            <div className="md:col-span-2 space-y-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b font-semibold text-gray-700 flex justify-between items-center">
                        <span>Danh Sách Đợt Chấm</span>
                        {loading && <RefreshCw size={16} className="animate-spin text-blue-500"/>}
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3">ID</th>
                                    <th className="px-4 py-3">Tên Đợt</th>
                                    <th className="px-4 py-3">Thời gian</th>
                                    <th className="px-4 py-3 text-center">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {periods.map(p => {
                                    const isActive = p.startDate && p.endDate && new Date() >= new Date(p.startDate) && new Date() <= new Date(p.endDate + 'T23:59:59');
                                    return (
                                        <tr key={p.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-mono font-bold text-blue-600">{p.id}</td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-800">{p.name}</div>
                                                {isActive && <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full mt-1"><Check size={10}/> Đang mở</span>}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-500">
                                                <div>BĐ: {p.startDate ? new Date(p.startDate).toLocaleDateString('vi-VN') : '--'}</div>
                                                <div>KT: {p.endDate ? new Date(p.endDate).toLocaleDateString('vi-VN') : '--'}</div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button 
                                                        onClick={() => handleEditPeriod(p)}
                                                        className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors"
                                                        title="Sửa"
                                                    >
                                                        <Edit size={16}/>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeletePeriod(p.id)}
                                                        className="text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 size={16}/>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {periods.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-gray-400 italic">Chưa có đợt chấm nào.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
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

export default GradingPeriods;
