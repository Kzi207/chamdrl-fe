import React from 'react';
import { 
  X, 
  Info, 
  Star, 
  ShieldCheck, 
  Users, 
  Heart, 
  Award, 
  BookOpen,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

interface ScoringGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ScoringGuideModal: React.FC<ScoringGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-blue-600 px-6 py-5 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <BookOpen size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">Hướng dẫn chấm ĐRL chi tiết</h2>
              <p className="text-blue-100 text-xs font-medium">Theo Thông tư số 16 năm 2015 của Bộ GDĐT</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* Quy định chung */}
          <section className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100">
            <div className="flex items-center gap-2 mb-3 text-blue-700">
              <Info size={18} className="font-bold" />
              <h3 className="font-black uppercase text-sm tracking-wide">Quy định chung</h3>
            </div>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex gap-2">
                <span className="text-blue-500">•</span>
                <span>Đánh giá theo thang 100 điểm (không quy đổi).</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500">•</span>
                <span>Mỗi tiêu chí có thể cộng/trừ nhiều lần nhưng không vượt quá khung điểm tiêu chí.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500">•</span>
                <span>Tổng điểm rèn luyện (ĐRL) không quá 100.</span>
              </li>
              <li className="flex gap-2 bg-white/60 p-2 rounded-lg border border-blue-50 font-bold text-blue-800">
                <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                <span>Mức chuẩn chung (SV bình thường): 75/100 điểm.</span>
              </li>
            </ul>
          </section>

          {/* Tiêu chí I */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
              <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                <Star size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-800">I. Ý thức tham gia học tập (0 - 20đ)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                <h4 className="text-xs font-bold text-emerald-700 uppercase mb-2">Cộng điểm</h4>
                <ul className="text-xs space-y-2 text-slate-600">
                  <li><strong>+2đ/lần:</strong> Hội thảo học thuật (max 6đ/HK).</li>
                  <li><strong>+3đ:</strong> ĐTB ≥ 7.00; thi học thuật; thành viên CLB.</li>
                  <li><strong>+5đ:</strong> ĐTB ≥ 8.00; đội Olympic; NCKH cấp trường+.</li>
                </ul>
              </div>
              <div className="bg-red-50/40 p-4 rounded-xl border border-red-100">
                <h4 className="text-xs font-bold text-red-700 uppercase mb-2">Trừ điểm</h4>
                <ul className="text-xs space-y-2 text-slate-600">
                  <li><strong>-2đ/môn:</strong> Bỏ kiểm tra giữa kỳ không lý do.</li>
                  <li><strong>-3đ/môn:</strong> Bỏ thi hoặc bị cấm thi.</li>
                  <li><strong>-3đ:</strong> TBHK 4.00 đến dưới 5.00.</li>
                  <li><strong>-5đ:</strong> TBHK &lt; 4.00; cảnh cáo học vụ; vi phạm nội quy thi.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Tiêu chí II */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
              <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-800">II. Chấp hành nội quy, quy chế (0 - 25đ)</h3>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-xs font-bold text-slate-500 mb-3 bg-white px-3 py-1 rounded inline-block">Mức chuẩn: 25đ (nếu không vi phạm)</p>
              <ul className="text-xs space-y-2 text-slate-600">
                <li><strong className="text-red-600">-5đ:</strong> Không sinh hoạt lớp; đăng ký MH trễ; vắng SHCD định kỳ.</li>
                <li><strong className="text-red-600">-10đ:</strong> Đóng học phí trễ; không BHYT; không khám sức khỏe đúng hạn.</li>
                <li><strong className="text-red-600">-20đ:</strong> Vi phạm bị lập biên bản; không hoàn thành SHCD.</li>
              </ul>
            </div>
          </section>

          {/* Tiêu chí III */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
              <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                <Users size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-800">III. Hoạt động Chính trị - XH - VH - TT (0 - 20đ)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                <h4 className="text-xs font-bold text-emerald-700 uppercase mb-2">Cộng điểm</h4>
                <ul className="text-xs space-y-2 text-slate-600">
                  <li><strong>+2đ/lần:</strong> Hoạt động lớp/khoa (max 10đ/HK).</li>
                  <li><strong>+5đ/lần:</strong> Hoạt động cấp trường (max 10đ/HK).</li>
                  <li><strong>+5đ:</strong> Đoàn viên XS; MHX; khen thưởng địa phương.</li>
                  <li><strong>+10đ:</strong> Chiến sĩ giỏi MHX; Giấy khen Đoàn/Hội.</li>
                </ul>
              </div>
              <div className="flex items-center justify-center p-4 bg-purple-50 rounded-xl border border-purple-100">
                <p className="text-xs font-medium text-purple-800 text-center italic">Chuẩn SV không vi phạm pháp luật/quy định đạt 15đ</p>
              </div>
            </div>
          </section>

          {/* Tiêu chí IV */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
              <div className="bg-rose-100 p-2 rounded-lg text-rose-600">
                <Heart size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-800">IV. Quan hệ cộng đồng (0 - 25đ)</h3>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between items-start mb-3">
                    <p className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded">Mức chuẩn: 20đ (không vi phạm)</p>
                </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-emerald-600 uppercase">Điểm cộng</h4>
                    <ul className="text-xs space-y-1 text-slate-600">
                        <li><strong>+5đ:</strong> Hiến máu; ngoại trú tốt.</li>
                        <li><strong>+10đ:</strong> Thư khen từ địa phương.</li>
                    </ul>
                </div>
                <div className="space-y-2 border-l border-slate-200 pl-4">
                    <h4 className="text-[10px] font-black text-red-600 uppercase">Điểm trừ</h4>
                    <ul className="text-xs space-y-1 text-slate-600">
                        <li><strong>-10đ/lần:</strong> Vi phạm HC; quy định địa phương/KTX.</li>
                    </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Tiêu chí V */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
              <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                <Award size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-800">V. Công tác lớp, Đoàn thể (0 - 10đ)</h3>
            </div>
            <div className="bg-emerald-50/30 p-4 rounded-xl border border-emerald-100">
                <ul className="text-xs space-y-2 text-slate-600">
                  <li><strong>+2đ:</strong> Thành viên tích cực CLB/Lớp; Hỗ trợ việc Khoa/BM.</li>
                  <li><strong>+5đ:</strong> Ban cán sự lớp; BCH Đoàn/Hội/CLB hoàn thành nhiệm vụ.</li>
                  <li><strong>+10đ:</strong> Tham gia sinh hoạt lớp đầy đủ (theo ý kiến GVCN).</li>
                </ul>
            </div>
          </section>

          {/* Tổng kết & Kỷ luật */}
          <section className="mt-8 pt-8 border-t-2 border-slate-100 space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={20} className="text-amber-500" />
                <h3 className="text-lg font-black text-slate-800 uppercase italic">Tổng kết & Xử lý kỷ luật</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase">Cộng điểm khen thưởng</h4>
                    <div className="space-y-2">
                        <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-xs">
                            <span className="font-bold text-amber-700">+10đ:</span> QĐ khen thưởng từ Khoa/TT/VP
                        </div>
                        <div className="bg-amber-100/50 p-3 rounded-xl border border-amber-200 text-xs">
                            <span className="font-bold text-amber-800">+15đ:</span> QĐ khen thưởng Hiệu trưởng/Tỉnh/Quốc gia
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase">Trừ điểm kỷ luật</h4>
                    <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl space-y-3">
                        <p className="text-[10px] text-slate-400 font-medium">ĐRL = Hệ số x (Tổng điểm + Khen thưởng)</p>
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-bold">Khiển trách:</span>
                            <span className="bg-amber-500 text-white px-2 py-0.5 rounded font-black">70%</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-bold">Cảnh cáo:</span>
                            <span className="bg-orange-600 text-white px-2 py-0.5 rounded font-black">50%</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-bold">Đình chỉ học:</span>
                            <span className="bg-red-600 text-white px-2 py-0.5 rounded font-black">40%</span>
                        </div>
                    </div>
                </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-slate-200 active:scale-95"
          >
            ĐÃ HIỂU
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScoringGuideModal;
