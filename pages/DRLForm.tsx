/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Info,
  GraduationCap,
  Award,
  Users,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  FileText,
  User,
  ShieldCheck,
  Heart,
  Star,
  AlertCircle,
  Printer,
  Save,
  Upload,
  X,
  FileIcon,
  Paperclip,
  Loader,
  Clock
} from 'lucide-react';
import {
  getDRLScores,
  saveDRLScore,
  uploadProofImage,
  getProofImages,
  deleteProofImage,
  getStudents,
  getCurrentUser
} from '../services/storage';
import { DRLScore, Student } from '../types';
import StudentBottomNav from '../components/StudentBottomNav';

// --- Data Structures ---

interface Criterion {
  id: string;
  content: string;
  maxPoints: number;
  guide: string;
  type: 'select' | 'number' | 'boolean';
  options?: { label: string; points: number }[];
  unit?: string;
}

interface Section {
  id: string;
  title: string;
  maxPoints: number;
  criteria: Criterion[];
}

const EVALUATION_DATA: Section[] = [
  {
    id: 'sec-1',
    title: 'I. Đánh giá về ý thức tham gia học tập',
    maxPoints: 20,
    criteria: [
      {
        id: '1.1',
        content: '1. Điểm trung bình học tập tích lũy (thang 4)',
        maxPoints: 5,
        guide: 'Tính điểm theo học kỳ tín chỉ. Loại Trung bình (2.0-2.49): 2đ; Khá (2.5-3.19): 3đ; Giỏi (3.2-3.59): 4đ; Xuất sắc (3.6-4.0): 5đ.',
        type: 'select',
        options: [
          { label: 'Không đạt / Dưới 2.0', points: 0 },
          { label: 'Trung bình (2.0 - 2.49)', points: 2 },
          { label: 'Khá (2.5 - 3.19)', points: 3 },
          { label: 'Giỏi (3.2 - 3.59)', points: 4 },
          { label: 'Xuất sắc (3.6 - 4.0)', points: 5 }
        ]
      },
      {
        id: '1.2',
        content: '2. Chứng nhận tham gia các lớp kỹ năng học tập',
        maxPoints: 3,
        guide: 'Sinh viên có minh chứng (giấy xác nhận, chứng nhận...). Cộng 3đ/học kỳ.',
        type: 'boolean'
      },
      {
        id: '1.3',
        content: '3. Hội thảo, Tọa đàm cấp Khoa/Trường',
        maxPoints: 3,
        guide: 'Tham gia trực tiếp: 3đ/lần; Trực tuyến: 1đ/lần. Tối đa 3đ.',
        type: 'number',
        unit: 'lần'
      },
      {
        id: '1.4',
        content: '4. Cuộc thi học thuật cấp Khoa/Trường',
        maxPoints: 7,
        guide: 'Tham dự: 1đ; BTC: 2đ; Tham gia: 3đ; Giải KK: 4đ; Giải Nhì/Ba: 5đ; Giải Nhất: 6đ; Giải Đặc biệt: 7đ.',
        type: 'select',
        options: [
          { label: 'Không tham gia', points: 0 },
          { label: 'Tham dự/Cổ vũ (1đ)', points: 1 },
          { label: 'Ban tổ chức (2đ)', points: 2 },
          { label: 'Tham gia (3đ)', points: 3 },
          { label: 'Giải Khuyến khích (4đ)', points: 4 },
          { label: 'Giải Nhì/Ba (5đ)', points: 5 },
          { label: 'Giải Nhất (6đ)', points: 6 },
          { label: 'Giải Đặc biệt (7đ)', points: 7 }
        ]
      },
      {
        id: '1.5',
        content: '5. Cuộc thi học thuật đơn vị ngoài Trường',
        maxPoints: 8,
        guide: 'Tham dự: 2đ; BTC: 3đ; Tham gia: 4đ; Giải KK: 5đ; Giải Nhì/Ba: 6đ; Giải Nhất: 7đ; Giải Đặc biệt: 8đ.',
        type: 'select',
        options: [
          { label: 'Không tham gia', points: 0 },
          { label: 'Tham dự/Cổ vũ (2đ)', points: 2 },
          { label: 'Ban tổ chức (3đ)', points: 3 },
          { label: 'Tham gia (4đ)', points: 4 },
          { label: 'Giải Khuyến khích (5đ)', points: 5 },
          { label: 'Giải Nhì/Ba (6đ)', points: 6 },
          { label: 'Giải Nhất (7đ)', points: 7 },
          { label: 'Giải Đặc biệt (8đ)', points: 8 }
        ]
      }
    ]
  },
  {
    id: 'sec-2',
    title: 'II. Đánh giá về ý thức chấp hành nội quy, quy chế',
    maxPoints: 25,
    criteria: [
      {
        id: '2.1',
        content: '1. Ý thức, thái độ trong học tập',
        maxPoints: 5,
        guide: 'Đi học đầy đủ, đúng giờ, nghiêm túc. Vi phạm: Nghỉ không phép (-3đ); Đi muộn 3 lần (-1đ); Bỏ tiết 3 lần (-1đ); Bị cấm thi (-5đ).',
        type: 'number',
        unit: 'điểm trừ (nhập số âm)'
      },
      {
        id: '2.2',
        content: '2. Chấp hành nội quy, quy chế Nhà trường',
        maxPoints: 5,
        guide: 'Mặc định 5đ. Trừ điểm khi có quyết định kỷ luật.',
        type: 'number',
        unit: 'điểm trừ'
      },
      {
        id: '2.3',
        content: '3. Thực hiện quy chế thi, cuộc thi',
        maxPoints: 5,
        guide: 'Mặc định 5đ. Trừ điểm khi vi phạm quy chế thi.',
        type: 'number',
        unit: 'điểm trừ'
      },
      {
        id: '2.4',
        content: '4. Chấp hành quy định thư viện, phòng máy...',
        maxPoints: 5,
        guide: 'Mặc định 5đ. Trừ điểm khi vi phạm quy định.',
        type: 'number',
        unit: 'điểm trừ'
      },
      {
        id: '2.5',
        content: '5. Sinh hoạt lớp với CVHT, đồng phục, ngoại trú',
        maxPoints: 5,
        guide: 'Mặc định 5đ. Trừ điểm khi không tham gia sinh hoạt lớp không lý do, mặc sai quy định...',
        type: 'number',
        unit: 'điểm trừ'
      }
    ]
  },
  {
    id: 'sec-3',
    title: 'III. Đánh giá về ý thức tham gia hoạt động CT-XH, VH-VN, TD-TT',
    maxPoints: 20,
    criteria: [
      {
        id: '3.1',
        content: '1. Hoạt động bắt buộc do Khoa/Trường tổ chức',
        maxPoints: 3,
        guide: 'Tham gia: 3đ/lần. Không tham gia: -3đ/lần.',
        type: 'number',
        unit: 'lần'
      },
      {
        id: '3.2',
        content: '2. Đại hội, sinh hoạt Chi đoàn/Chi hội',
        maxPoints: 3,
        guide: 'Tham gia: 3đ/lần. Không tham gia: -3đ/lần.',
        type: 'number',
        unit: 'lần'
      },
      {
        id: '3.3',
        content: '3. Báo cáo chuyên đề trực tiếp/trực tuyến',
        maxPoints: 4,
        guide: 'Cộng 4đ/lần tham gia.',
        type: 'number',
        unit: 'lần'
      },
      {
        id: '3.4',
        content: '4. Hoạt động ngoại khóa, CLB, Đội nhóm',
        maxPoints: 7,
        guide: 'Tham gia tích cực các hoạt động phong trào. Tối đa 7đ.',
        type: 'number',
        unit: 'điểm'
      },
      {
        id: '3.5',
        content: '5. Kết nạp Đoàn (5đ) / Đảng (8đ)',
        maxPoints: 8,
        guide: 'Được kết nạp Đoàn: 5đ; Kết nạp Đảng: 8đ. Chỉ tính 1 lần trong học kỳ kết nạp.',
        type: 'select',
        options: [
          { label: 'Không', points: 0 },
          { label: 'Kết nạp Đoàn', points: 5 },
          { label: 'Kết nạp Đảng', points: 8 }
        ]
      }
    ]
  },
  {
    id: 'sec-4',
    title: 'IV. Đánh giá về ý thức công dân trong quan hệ cộng đồng',
    maxPoints: 25,
    criteria: [
      {
        id: '4.1',
        content: '1. Chấp hành luật pháp, quy định Nhà nước',
        maxPoints: 10,
        guide: 'Mặc định 10đ. Vi phạm bị công an thông báo về trường: -5đ/lần.',
        type: 'number',
        unit: 'điểm (mặc định 10)'
      },
      {
        id: '4.2',
        content: '2. Hiến máu tình nguyện',
        maxPoints: 10,
        guide: 'Tham gia hiến máu: 10đ/lần. Ban tổ chức: 5đ/lần.',
        type: 'number',
        unit: 'lần'
      },
      {
        id: '4.3',
        content: '3. Chiến dịch tình nguyện (Mùa hè xanh, Xuân tình nguyện...)',
        maxPoints: 7,
        guide: 'Mùa hè xanh: 7đ; Xuân tình nguyện: 5đ; Ngày Chủ nhật xanh: 3đ; Thứ Bảy tình nguyện: 3đ.',
        type: 'number',
        unit: 'điểm'
      },
      {
        id: '4.4',
        content: '4. Hoạt động đền ơn đáp nghĩa, nhân đạo',
        maxPoints: 5,
        guide: 'Tham gia các hoạt động từ thiện, giúp đỡ người yếu thế... Tối đa 5đ.',
        type: 'number',
        unit: 'điểm'
      }
    ]
  },
  {
    id: 'sec-5',
    title: 'V. Đánh giá về ý thức và kết quả công tác cán bộ lớp, Đoàn thể',
    maxPoints: 10,
    criteria: [
      {
        id: '5.1',
        content: '1. Tham gia tích cực phong trào Lớp, Đoàn, Hội',
        maxPoints: 3,
        guide: 'Cộng 3đ/học kỳ cho thành viên tích cực.',
        type: 'boolean'
      },
      {
        id: '5.2',
        content: '2. Hoàn thành tốt nhiệm vụ Ban cán sự, BCH Đoàn/Hội',
        maxPoints: 5,
        guide: 'Lớp trưởng, Bí thư... hoàn thành tốt: 5đ; Phó lớp, Phó bí thư...: 4đ; Ủy viên: 3đ.',
        type: 'select',
        options: [
          { label: 'Không', points: 0 },
          { label: 'Ủy viên (3đ)', points: 3 },
          { label: 'Cấp phó (4đ)', points: 4 },
          { label: 'Cấp trưởng (5đ)', points: 5 }
        ]
      },
      {
        id: '5.3',
        content: '3. Đạt giải thưởng, khen thưởng đặc biệt',
        maxPoints: 10,
        guide: 'Sinh viên 5 tốt, khen thưởng của UBND Tỉnh, Trung ương... Tối đa 10đ.',
        type: 'number',
        unit: 'điểm'
      }
    ]
  }
];

// --- Components ---

interface CriterionRowProps {
  criterion: Criterion;
  value: number;
  onChange: (val: number) => void;
  proofs: string[];
  onUploadProof: (criterionId: string, files: File[]) => Promise<void>;
  onDeleteProof: (criterionId: string, url: string) => Promise<void>;
  uploading: boolean;
  onPreviewProofs: (urls: string[], index: number, title: string) => void;
}

const CriterionRow = React.memo(
  ({
    criterion,
    value,
    onChange,
    proofs,
    onUploadProof,
    onDeleteProof,
    uploading,
    onPreviewProofs
  }: CriterionRowProps) => {
    const [showGuide, setShowGuide] = useState(false);

    const handleFileChange = useCallback(
      async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
          const newFiles = Array.from(e.target.files);
          await onUploadProof(criterion.id, newFiles);
          e.target.value = '';
        }
      },
      [criterion.id, onUploadProof]
    );

    return (
      <div className="border-b border-slate-100 last:border-0 py-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex-1">
            <div
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => setShowGuide(!showGuide)}
            >
              <h4 className="text-sm font-medium text-slate-800 group-hover:text-blue-600 transition-colors">
                {criterion.content}
              </h4>
              <ChevronDown
                size={14}
                className={`text-slate-300 group-hover:text-blue-400 transition-transform ${
                  showGuide ? 'rotate-180' : ''
                }`}
              />
            </div>

            {showGuide && (
              <div className="mt-3 space-y-3 animate-in">
                <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border-l-4 border-blue-400 italic shadow-sm">
                  <div className="flex items-start gap-2">
                    <Info size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>{criterion.guide}</span>
                  </div>
                </div>

                {criterion.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {criterion.options.map((opt) => (
                      <button
                        key={`${criterion.id}-${opt.points}`}
                        onClick={() => onChange(opt.points)}
                        className={`text-left text-[11px] p-2.5 rounded-xl border transition-all flex justify-between items-center ${
                          value === opt.points
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 ring-1 ring-emerald-100'
                            : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200 hover:bg-blue-50'
                        }`}
                      >
                        <span className="pr-2">{opt.label}</span>
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex-shrink-0 ${
                            value === opt.points
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {opt.points}đ
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-4 p-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      <Paperclip size={14} className="text-blue-500" />
                      Minh chứng
                    </div>
                    <label className="cursor-pointer bg-white hover:bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1.5 shadow-sm">
                      <Upload size={12} />
                      TẢI LÊN
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>

                  {uploading && (
                    <div className="text-[10px] text-blue-500 italic text-center py-2">
                      Đang tải minh chứng lên server...
                    </div>
                  )}

                  {proofs.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {proofs.map((url, idx) => (
                        <div
                          key={`${url}-${idx}`}
                          className="flex items-center gap-2 bg-white border border-slate-100 px-2 py-1.5 rounded-lg shadow-sm"
                        >
                          <FileIcon size={12} className="text-slate-400 flex-shrink-0" />
                          <span className="text-[10px] text-slate-600 max-w-[120px] truncate">
                            {url.split('/').pop() || `minh-chung-${idx + 1}`}
                          </span>
                          <button
                            onClick={() => onPreviewProofs(proofs, idx, `Mục ${criterion.id}`)}
                            className="text-blue-500 hover:text-blue-700 transition-colors flex-shrink-0"
                            type="button"
                          >
                            Xem
                          </button>
                          <button
                            onClick={() => onDeleteProof(criterion.id, url)}
                            className="text-red-500 hover:text-red-700 transition-colors flex-shrink-0"
                            type="button"
                          >
                            Xóa
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-400 italic text-center py-2">
                      Chưa có minh chứng nào được tải lên
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto md:min-w-[150px] justify-end">
            {criterion.type === 'select' && (
              <select
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="text-sm border border-slate-200 rounded-lg px-2 py-1 bg-white focus:ring-2 focus:ring-emerald-500 outline-none w-full md:w-auto cursor-pointer"
              >
                <option value={0}>Chọn...</option>
                {criterion.options?.map((opt) => (
                  <option key={`${criterion.id}-${opt.points}`} value={opt.points}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}

            {criterion.type === 'number' && (
              <div className="flex items-center gap-2 w-full md:w-auto">
                <input
                  type="number"
                  value={value}
                  onChange={(e) => onChange(Number(e.target.value))}
                  className="text-sm border border-slate-200 rounded-lg px-2 py-1 w-20 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <span className="text-xs text-slate-400 whitespace-nowrap">{criterion.unit}</span>
              </div>
            )}

            {criterion.type === 'boolean' && (
              <button
                onClick={() => onChange(value === 0 ? criterion.maxPoints : 0)}
                className={`px-4 py-1 rounded-full text-xs font-bold transition-all flex-shrink-0 ${
                  value > 0
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-100'
                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                }`}
                type="button"
              >
                {value > 0 ? 'ĐÃ THAM GIA' : 'CHƯA THAM GIA'}
              </button>
            )}

            <div className="text-sm font-black text-emerald-600 w-12 text-right flex-shrink-0">
              {value}đ
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CriterionRow.displayName = 'CriterionRow';

// Icons cache
const SECTION_ICONS: Record<string, React.ComponentType<any>> = {
  'sec-1': Star,
  'sec-2': ShieldCheck,
  'sec-3': Users,
  'sec-4': Heart,
  'sec-5': Award
};

export default function DRLForm() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [userInfo, setUserInfo] = useState({
    name: '',
    mssv: '',
    class: '',
    semester: 'I',
    year: '2025 - 2026'
  });

  const [scores, setScores] = useState<Record<string, number>>({});
  const [existingProofs, setExistingProofs] = useState<Record<string, string[]>>({});
  const [uploadingByCriterion, setUploadingByCriterion] = useState<Record<string, boolean>>({});
  const [previewState, setPreviewState] = useState<{
    open: boolean;
    urls: string[];
    index: number;
    title: string;
  }>({ open: false, urls: [], index: 0, title: '' });
  const [activeSection, setActiveSection] = useState<string | null>('sec-1');
  const [drlScoreRecord, setDrlScoreRecord] = useState<DRLScore | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.role !== 'student') {
      navigate(`/drl/proof?studentId=${studentId || ''}`, { replace: true });
    }
  }, [navigate, studentId]);

  // Load student data and existing scores on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!studentId) {
          setError('Không tìm thấy mã sinh viên');
          setLoading(false);
          return;
        }

        // Fetch all students and find the one with matching ID
        const allStudents = await getStudents();
        const student = allStudents.find(s => s.id === studentId);

        if (!student) {
          setError('Không tìm thấy thông tin sinh viên');
          setLoading(false);
          return;
        }

        // Update user info
        setUserInfo({
          name: `${student.lastName} ${student.firstName}`,
          mssv: student.id,
          class: student.classId || '',
          semester: 'I',
          year: '2025 - 2026'
        });

        // Fetch existing DRL scores
        const allScores = await getDRLScores();
        const existingScore = allScores.find(s => s.studentId === studentId);

        if (existingScore) {
          setDrlScoreRecord(existingScore);

          // Parse existing scores from details
          if (existingScore.details && typeof existingScore.details === 'object') {
            const parsedScores = existingScore.details;
            setScores(parsedScores);
          }
        } else {
          // Initialize default scores
          const initialScores: Record<string, number> = {};
          EVALUATION_DATA.forEach((sec) => {
            sec.criteria.forEach((crit) => {
              if (['2.1', '2.2', '2.3', '2.4', '2.5'].includes(crit.id)) {
                initialScores[crit.id] = 5;
              } else if (crit.id === '4.1') {
                initialScores[crit.id] = 10;
              } else {
                initialScores[crit.id] = 0;
              }
            });
          });
          setScores(initialScores);
        }

        // Fetch existing proof images (from API and previous saved details)
        const proofsFromApi = await getProofImages(studentId);
        const proofsFromDetails =
          existingScore?.details && typeof existingScore.details === 'object' && existingScore.details.proofs
            ? (existingScore.details.proofs as Record<string, string[]>)
            : {};

        const mergedProofs: Record<string, string[]> = { ...proofsFromDetails };
        Object.entries(proofsFromApi || {}).forEach(([key, urls]) => {
          mergedProofs[key] = Array.from(new Set([...(mergedProofs[key] || []), ...urls]));
        });

        setExistingProofs(mergedProofs);

        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Lỗi khi tải dữ liệu sinh viên');
        setLoading(false);
      }
    };

    loadData();
  }, [studentId]);

  // Upload proofs immediately after user selects files
  const handleUploadProof = useCallback(
    async (criterionId: string, files: File[]) => {
      if (!studentId || files.length === 0) {
        return;
      }

      setUploadingByCriterion((prev) => ({ ...prev, [criterionId]: true }));
      setError(null);

      const uploadedUrls: string[] = [];
      for (const file of files) {
        try {
          const url = await uploadProofImage(file, studentId, criterionId);
          uploadedUrls.push(url);
        } catch (err) {
          console.error('Upload proof failed:', err);
          setError(`Tải minh chứng "${file.name}" thất bại. Vui lòng thử lại.`);
        }
      }

      if (uploadedUrls.length > 0) {
        const newProofs = {
          ...existingProofs,
          [criterionId]: Array.from(new Set([...(existingProofs[criterionId] || []), ...uploadedUrls]))
        };
        setExistingProofs(newProofs);
        
        // Sync with DRLScore record to persist state
        if (drlScoreRecord) {
           const updatedScore = {
             ...drlScoreRecord,
             details: {
               ...drlScoreRecord.details,
               proofs: newProofs
             }
           };
           try {
             await saveDRLScore(updatedScore);
             setDrlScoreRecord(updatedScore);
           } catch (e) { console.error('Failed to sync score proofs', e); }
        }
      }

      setUploadingByCriterion((prev) => ({ ...prev, [criterionId]: false }));
    },
    [studentId, existingProofs, drlScoreRecord]
  );

  const handleDeleteProof = useCallback(
    async (criterionId: string, url: string) => {
      if (!studentId) return;

      const ok = window.confirm('Xác nhận xóa minh chứng của mục này?');
      if (!ok) return;

      try {
        setError(null);
        await deleteProofImage(studentId, criterionId, url);
        
        const newProofs = {
          ...existingProofs,
          [criterionId]: (existingProofs[criterionId] || []).filter((u) => u !== url)
        };
        setExistingProofs(newProofs);

        // Đảm bảo xóa khỏi bản ghi DRLScore (details.proofs)
        if (drlScoreRecord) {
           const updatedScore = {
             ...drlScoreRecord,
             details: {
               ...drlScoreRecord.details,
               proofs: newProofs
             }
           };
           try {
             await saveDRLScore(updatedScore);
             setDrlScoreRecord(updatedScore);
           } catch (e) { console.error('Failed to sync deleted proofs to score', e); }
        }

        setSuccessMsg('Đã xóa minh chứng.');
      } catch (err) {
        console.error('Delete proof failed:', err);
        setError('Xóa minh chứng thất bại. Vui lòng thử lại.');
      }
    },
    [studentId, existingProofs, drlScoreRecord]
  );

  const sectionTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    EVALUATION_DATA.forEach((sec) => {
      let sum = 0;
      sec.criteria.forEach((crit) => {
        sum += scores[crit.id] || 0;
      });
      totals[sec.id] = Math.max(0, Math.min(sum, sec.maxPoints));
    });
    return totals;
  }, [scores]);

  const totalScore = useMemo(() => {
    return Object.values(sectionTotals).reduce((a, b) => a + b, 0);
  }, [sectionTotals]);

  // Save form to backend
  const handleSaveForm = useCallback(async () => {
    if (!studentId) {
      setError('Không tìm thấy mã sinh viên');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      // Create DRL score record
      const newScore: DRLScore = {
        id: drlScoreRecord?.id || `${studentId}-${Date.now()}`,
        studentId,
        semester: userInfo.semester === 'I' ? 'sem-1' : 'sem-2',
        selfScore: totalScore,
        classScore: 0,
        finalScore: 0,
        details: {
          ...scores,
          proofs: existingProofs
        },
        status: 'submitted'
      };

      // Save to backend
      await saveDRLScore(newScore);

      setSuccessMsg('Phiếu đánh giá đã được gửi thành công! Vui lòng chờ phê duyệt từ phòng chủ nhiệm.');
      setDrlScoreRecord(newScore);

      setTimeout(() => {
        setSuccessMsg(null);
      }, 3000);
    } catch (err) {
      console.error('Error saving form:', err);
      setError('Lỗi khi lưu phiếu đánh giá. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  }, [studentId, scores, totalScore, userInfo.semester, drlScoreRecord, existingProofs]);

  const getRank = useCallback((score: number) => {
    if (score >= 90) return { label: 'Xuất sắc', color: 'text-purple-600' };
    if (score >= 80) return { label: 'Tốt', color: 'text-emerald-600' };
    if (score >= 65) return { label: 'Khá', color: 'text-blue-600' };
    if (score >= 50) return { label: 'Trung bình', color: 'text-orange-600' };
    if (score >= 35) return { label: 'Yếu', color: 'text-red-500' };
    return { label: 'Kém', color: 'text-slate-400' };
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const openProofPreview = useCallback((urls: string[], index: number, title: string) => {
    if (!urls.length) return;
    setPreviewState({
      open: true,
      urls,
      index,
      title
    });
  }, []);

  const closeProofPreview = useCallback(() => {
    setPreviewState({ open: false, urls: [], index: 0, title: '' });
  }, []);

  const goPrevProof = useCallback(() => {
    setPreviewState((prev) => {
      if (!prev.urls.length) return prev;
      const nextIndex = (prev.index - 1 + prev.urls.length) % prev.urls.length;
      return { ...prev, index: nextIndex };
    });
  }, []);

  const goNextProof = useCallback(() => {
    setPreviewState((prev) => {
      if (!prev.urls.length) return prev;
      const nextIndex = (prev.index + 1) % prev.urls.length;
      return { ...prev, index: nextIndex };
    });
  }, []);

  const hasEvidence = Object.keys(existingProofs).some((key) => (existingProofs[key] || []).length > 0);
  const evidenceCount = Object.values(existingProofs).reduce((sum, urls) => sum + urls.length, 0);
  const rankInfo = getRank(totalScore);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-center gap-3 print:hidden">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
            type="button"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3 flex items-center gap-3 print:hidden">
          <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
          <p className="text-emerald-700 text-sm">{successMsg}</p>
          <button
            onClick={() => setSuccessMsg(null)}
            className="ml-auto text-emerald-600 hover:text-emerald-800"
            type="button"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 print:hidden">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <GraduationCap size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Phiếu Đánh Giá Điểm Rèn Luyện</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                Trường Đại học Kỹ thuật - Công nghệ Cần Thơ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Tổng điểm dự kiến
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-blue-600">{totalScore}</span>
                <span className={`text-xs font-bold ${rankInfo.color}`}>{rankInfo.label}</span>
              </div>
            </div>
            <button
              onClick={handleSaveForm}
              disabled={saving || drlScoreRecord?.status === 'submitted'}
              className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${
                drlScoreRecord?.status === 'submitted'
                  ? 'bg-orange-100 text-orange-600 cursor-default border border-orange-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white'
              }`}
              title={drlScoreRecord?.status === 'submitted' ? 'Phiếu đã nộp, đang chờ duyệt' : 'Gửi phiếu đánh giá'}
              type="button"
            >
              {saving ? (
                <Loader size={20} className="animate-spin" />
              ) : drlScoreRecord?.status === 'submitted' ? (
                <Clock size={20} />
              ) : (
                <Save size={20} />
              )}
              {drlScoreRecord?.status === 'submitted' && (
                <span className="text-xs font-bold hidden md:inline">Chờ duyệt</span>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-slate-600"
              type="button"
              aria-label="In phiếu đánh giá"
            >
              <Printer size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        {/* User Info Card */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8 print:border-0 print:shadow-none">
          <div className="flex items-center gap-2 mb-6">
            <User size={20} className="text-blue-600" />
            <h2 className="font-bold text-slate-800">Thông tin sinh viên</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                Họ và tên
              </label>
              <input
                type="text"
                value={userInfo.name}
                readOnly
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm text-slate-600 font-medium outline-none cursor-not-allowed"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                Mã số sinh viên
              </label>
              <input
                type="text"
                value={userInfo.mssv}
                readOnly
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm text-slate-600 font-medium outline-none cursor-not-allowed"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                Lớp / Khóa
              </label>
              <input
                type="text"
                value={userInfo.class}
                readOnly
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm text-slate-600 font-medium outline-none cursor-not-allowed"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Học kỳ</label>
              <input
                type="text"
                value={userInfo.semester === 'I' ? 'Học kỳ I' : 'Học kỳ II'}
                readOnly
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm text-slate-600 font-medium outline-none cursor-not-allowed"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                Năm học
              </label>
              <input
                type="text"
                value={userInfo.year}
                readOnly
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm text-slate-600 font-medium outline-none cursor-not-allowed"
              />
            </div>
          </div>
        </section>

        {/* Evaluation Sections */}
        <div className="space-y-4">
          {EVALUATION_DATA.map((section) => {
            const SectionIcon = SECTION_ICONS[section.id] || Star;
            const isActive = activeSection === section.id;
            const sectionScore = sectionTotals[section.id];

            return (
              <div
                key={section.id}
                className={`bg-white rounded-2xl shadow-sm border transition-all overflow-hidden ${
                  isActive ? 'border-blue-200 ring-1 ring-blue-50' : 'border-slate-200'
                }`}
              >
                <button
                  onClick={() => setActiveSection(isActive ? null : section.id)}
                  className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
                  type="button"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <SectionIcon size={18} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-800 text-sm md:text-base">
                        {section.title}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">
                        Tối đa: {section.maxPoints} điểm
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <span className="text-lg font-black text-blue-600">{sectionScore}</span>
                      <span className="text-xs text-slate-300 ml-1">/ {section.maxPoints}</span>
                    </div>
                    {isActive ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>

                {isActive && (
                  <div className="px-6 pb-6 border-t border-slate-50 animate-in">
                    {section.criteria.map((crit: Criterion) => (
                      <CriterionRow
                        key={crit.id}
                        criterion={crit}
                        value={scores[crit.id] || 0}
                        onChange={(val: number) =>
                          setScores({ ...scores, [crit.id]: val })
                        }
                        proofs={existingProofs[crit.id] || []}
                        onUploadProof={handleUploadProof}
                        onDeleteProof={handleDeleteProof}
                        uploading={!!uploadingByCriterion[crit.id]}
                        onPreviewProofs={openProofPreview}
                      />
                    ))}

                    <div className="mt-6 p-4 bg-slate-50 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-500">
                        <AlertCircle size={16} />
                        <span className="text-xs italic">
                          Điểm tự đánh giá được giới hạn tối đa {section.maxPoints} điểm
                          cho mục này.
                        </span>
                      </div>
                      <div className="text-sm font-bold flex-shrink-0">
                        Tổng mục:{' '}
                        <span className="text-blue-600">{sectionScore}đ</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Evidence Summary Section */}
        {hasEvidence && (
          <section className="mt-8 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm print:break-before-page">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                <Paperclip size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Danh mục minh chứng đã tải lên
                </h3>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                  Tổng số: {evidenceCount} tệp tin
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {EVALUATION_DATA.map((sec) =>
                sec.criteria
                  .filter((crit) => (existingProofs[crit.id] || []).length > 0)
                  .map((crit) => (
                    <div
                      key={`summary-${crit.id}`}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-100"
                    >
                      <div className="text-[10px] font-bold text-blue-600 uppercase mb-2">
                        Mục {crit.id}
                      </div>
                      <div className="text-xs font-medium text-slate-700 mb-3 line-clamp-2 h-8">
                        {crit.content}
                      </div>
                      <div className="space-y-2">
                        {(existingProofs[crit.id] || []).map((url, idx) => (
                          <div
                            key={`file-${idx}`}
                            className="flex items-center gap-2 text-[10px] text-slate-500 bg-white p-2 rounded-lg border border-slate-100"
                          >
                            <FileIcon size={12} className="text-slate-400 flex-shrink-0" />
                            <button
                              onClick={() => openProofPreview(existingProofs[crit.id] || [], idx, `Mục ${crit.id}`)}
                              className="truncate flex-1 text-left text-blue-600 hover:text-blue-800"
                              type="button"
                            >
                              {url.split('/').pop() || `minh-chung-${idx + 1}`}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </section>
        )}

        {/* Final Summary Card */}
        <section className="mt-12 bg-slate-900 rounded-3xl p-8 text-white shadow-2xl shadow-slate-300 relative overflow-hidden print:bg-white print:text-black print:shadow-none print:border print:border-slate-200">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Kết quả tự đánh giá
                </span>
              </div>
              <h2 className="text-4xl font-black tracking-tight">
                Tổng cộng: <span className="text-blue-400">{totalScore}</span> điểm
              </h2>
              <p className="text-slate-400 max-w-md">
                Dựa trên các tiêu chí đã nhập, xếp loại rèn luyện của bạn là{' '}
                <span className={`font-bold ${rankInfo.color}`}>{rankInfo.label}</span>.
              </p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 rounded-full border-8 border-white/5 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full border-8 border-blue-500 border-t-transparent animate-spin" />
                <span className="text-4xl font-black">{totalScore}</span>
              </div>
              <button
                onClick={() => {
                  if (drlScoreRecord?.status !== 'submitted') {
                    handleSaveForm();
                  }
                }}
                disabled={saving || drlScoreRecord?.status === 'submitted'}
                className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-bold transition-all shadow-lg print:hidden ${
                  drlScoreRecord?.status === 'submitted'
                    ? 'bg-orange-100 text-orange-600 border border-orange-200 shadow-orange-900/5 cursor-default'
                    : 'bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white active:scale-95 shadow-blue-900/20'
                }`}
                type="button"
              >
                {saving ? (
                  <Loader size={20} className="animate-spin" />
                ) : drlScoreRecord?.status === 'submitted' ? (
                  <Clock size={20} />
                ) : (
                  <FileText size={20} />
                )}
                {drlScoreRecord?.status === 'submitted' ? 'Đang Chờ Duyệt' : 'Gửi Phiếu Đánh Giá'}
              </button>
            </div>
          </div>

          <GraduationCap
            size={200}
            className="absolute -right-10 -bottom-10 text-white/5 rotate-12 pointer-events-none"
          />
        </section>

        {/* Footer Info */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 print:hidden">
          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-500" />
              Lưu ý quan trọng
            </h4>
            <ul className="text-xs text-slate-500 space-y-2 list-disc ml-4">
              <li>Mỗi tiêu chí cần có minh chứng hợp lệ đi kèm.</li>
              <li>
                Điểm tự đánh giá chỉ là dự kiến, kết quả cuối cùng do Hội đồng đánh giá
                quyết định.
              </li>
              <li>Vi phạm kỷ luật sẽ bị trừ điểm nặng theo quy định hiện hành.</li>
            </ul>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Save size={18} className="text-blue-500" />
              Hướng dẫn xuất file
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Sử dụng nút "Xuất Phiếu Đánh Giá" để in hoặc lưu file PDF. Form được tối ưu
              hóa cho việc in ấn trên khổ giấy A4, bao gồm đầy đủ các mục và chữ ký xác
              nhận.
            </p>
          </div>
        </div>
      </main>

      {/* Print-only Signature Section */}
      <div className="hidden print:block mt-20 px-10">
        <div className="grid grid-cols-3 gap-10 text-center text-sm">
          <div>
            <p className="font-bold">Ban chấp hành</p>
            <p className="italic text-xs">(Ký và ghi rõ họ tên)</p>
            <div className="h-24"></div>
          </div>
          <div>
            <p className="font-bold">Ban cán sự</p>
            <p className="italic text-xs">(Ký và ghi rõ họ tên)</p>
            <div className="h-24"></div>
          </div>
          <div>
            <p className="font-bold">Sinh viên</p>
            <p className="italic text-xs">(Ký và ghi rõ họ tên)</p>
            <div className="h-24 mt-4 flex items-center justify-center">
              <span className="font-serif text-lg italic">{userInfo.name}</span>
            </div>
            <p className="font-bold">{userInfo.name}</p>
          </div>
        </div>
        <div className="mt-20 text-right">
          <p className="italic">Cần Thơ, ngày ..... tháng ..... năm 2025</p>
          <p className="font-bold mr-10">Cố vấn học tập</p>
          <p className="italic text-xs mr-10">(Ký và ghi rõ họ tên)</p>
        </div>
      </div>

      <StudentBottomNav active="drl" />

      {/* Proof Preview Modal */}
      {previewState.open && (
        <div
          className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4"
          onClick={closeProofPreview}
        >
          <div
            className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase">{previewState.title}</p>
                <p className="text-xs text-slate-400">
                  Ảnh {previewState.index + 1} / {previewState.urls.length}
                </p>
              </div>
              <button
                onClick={closeProofPreview}
                className="text-slate-500 hover:text-slate-700"
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative bg-slate-50">
              <img
                src={previewState.urls[previewState.index]}
                alt="Minh chứng"
                className="w-full h-[85vh] object-contain"
              />

              {previewState.urls.length > 1 && (
                <>
                  <button
                    onClick={goPrevProof}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/80 hover:bg-white hover:scale-105 active:scale-95 text-slate-800 rounded-full shadow-lg backdrop-blur-sm transition-all border border-slate-200"
                    type="button"
                    title="Ảnh trước"
                  >
                    <ChevronLeft size={28} />
                  </button>
                  <button
                    onClick={goNextProof}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/80 hover:bg-white hover:scale-105 active:scale-95 text-slate-800 rounded-full shadow-lg backdrop-blur-sm transition-all border border-slate-200"
                    type="button"
                    title="Ảnh tiếp theo"
                  >
                    <ChevronRight size={28} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
