/**
 * AdminDRLDetail.tsx
 * Trang xem và duyệt chi tiết phiếu điểm rèn luyện của sinh viên (Admin/BCH)
 * - Điểm hiển thị read-only
 * - Mỗi tiêu chí nhỏ (1.1, 1.2, ...) có nút tích ✓ Duyệt riêng
 * - Nút "Duyệt tất cả" ở header duyệt toàn bộ tiêu chí
 * - Nút "Lưu duyệt" để xác nhận
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader,
  Star,
  ShieldCheck,
  Users,
  Heart,
  Award,
  GraduationCap,
  User,
  FileIcon,
  Paperclip,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Info,
  Check,
  Save,
  X,
  Printer,
  ExternalLink
} from 'lucide-react';
import {
  getDRLScores,
  saveDRLScore,
  getProofImages,
  getStudents
} from '../services/storage';
import { DRLScore, Student } from '../types';

// ---- Dữ liệu cấu trúc phiếu ----
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
        guide: 'Loại Trung bình (2.0-2.49): 2đ; Khá (2.5-3.19): 3đ; Giỏi (3.2-3.59): 4đ; Xuất sắc (3.6-4.0): 5đ.',
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
        guide: 'Có minh chứng (giấy xác nhận, chứng nhận...). Cộng 3đ/học kỳ.',
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
        guide: 'Tham dự: 1đ; BTC: 2đ; Tham gia: 3đ; Giải KK: 4đ; Nhì/Ba: 5đ; Nhất: 6đ; Đặc biệt: 7đ.',
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
        guide: 'Tham dự: 2đ; BTC: 3đ; Tham gia: 4đ; Giải KK: 5đ; Nhì/Ba: 6đ; Nhất: 7đ; Đặc biệt: 8đ.',
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
        id: '2.1', content: '1. Ý thức, thái độ trong học tập', maxPoints: 5,
        guide: 'Đi học đầy đủ, đúng giờ. Vi phạm: Nghỉ không phép (-3đ); Đi muộn 3 lần (-1đ); Bị cấm thi (-5đ).',
        type: 'number', unit: 'điểm trừ'
      },
      {
        id: '2.2', content: '2. Chấp hành nội quy, quy chế Nhà trường', maxPoints: 5,
        guide: 'Mặc định 5đ. Trừ điểm khi có quyết định kỷ luật.',
        type: 'number', unit: 'điểm trừ'
      },
      {
        id: '2.3', content: '3. Thực hiện quy chế thi, cuộc thi', maxPoints: 5,
        guide: 'Mặc định 5đ. Trừ điểm khi vi phạm quy chế thi.',
        type: 'number', unit: 'điểm trừ'
      },
      {
        id: '2.4', content: '4. Chấp hành quy định thư viện, phòng máy...', maxPoints: 5,
        guide: 'Mặc định 5đ. Trừ điểm khi vi phạm quy định.',
        type: 'number', unit: 'điểm trừ'
      },
      {
        id: '2.5', content: '5. Sinh hoạt lớp với CVHT, đồng phục, ngoại trú', maxPoints: 5,
        guide: 'Mặc định 5đ. Trừ điểm khi không tham gia không lý do, mặc sai quy định...',
        type: 'number', unit: 'điểm trừ'
      }
    ]
  },
  {
    id: 'sec-3',
    title: 'III. Đánh giá về ý thức tham gia hoạt động CT-XH, VH-VN, TD-TT',
    maxPoints: 20,
    criteria: [
      { id: '3.1', content: '1. Hoạt động bắt buộc do Khoa/Trường tổ chức', maxPoints: 3, guide: 'Tham gia: 3đ/lần. Không tham gia: -3đ/lần.', type: 'number', unit: 'lần' },
      { id: '3.2', content: '2. Đại hội, sinh hoạt Chi đoàn/Chi hội', maxPoints: 3, guide: 'Tham gia: 3đ/lần. Không tham gia: -3đ/lần.', type: 'number', unit: 'lần' },
      { id: '3.3', content: '3. Báo cáo chuyên đề trực tiếp/trực tuyến', maxPoints: 4, guide: 'Cộng 4đ/lần tham gia.', type: 'number', unit: 'lần' },
      { id: '3.4', content: '4. Hoạt động ngoại khóa, CLB, Đội nhóm', maxPoints: 7, guide: 'Tham gia tích cực các hoạt động phong trào. Tối đa 7đ.', type: 'number', unit: 'điểm' },
      {
        id: '3.5', content: '5. Kết nạp Đoàn (5đ) / Đảng (8đ)', maxPoints: 8,
        guide: 'Được kết nạp Đoàn: 5đ; Kết nạp Đảng: 8đ.',
        type: 'select',
        options: [{ label: 'Không', points: 0 }, { label: 'Kết nạp Đoàn', points: 5 }, { label: 'Kết nạp Đảng', points: 8 }]
      }
    ]
  },
  {
    id: 'sec-4',
    title: 'IV. Đánh giá về ý thức công dân trong quan hệ cộng đồng',
    maxPoints: 25,
    criteria: [
      { id: '4.1', content: '1. Chấp hành luật pháp, quy định Nhà nước', maxPoints: 10, guide: 'Mặc định 10đ. Vi phạm bị công an thông báo về trường: -5đ/lần.', type: 'number', unit: 'điểm' },
      { id: '4.2', content: '2. Hiến máu tình nguyện', maxPoints: 10, guide: 'Tham gia hiến máu: 10đ/lần. Ban tổ chức: 5đ/lần.', type: 'number', unit: 'lần' },
      { id: '4.3', content: '3. Chiến dịch tình nguyện (Mùa hè xanh, Xuân tình nguyện...)', maxPoints: 7, guide: 'Mùa hè xanh: 7đ; Xuân tình nguyện: 5đ; Ngày CN xanh: 3đ; Thứ 7 TN: 3đ.', type: 'number', unit: 'điểm' },
      { id: '4.4', content: '4. Hoạt động đền ơn đáp nghĩa, nhân đạo', maxPoints: 5, guide: 'Tham gia hoạt động từ thiện, giúp đỡ người yếu thế... Tối đa 5đ.', type: 'number', unit: 'điểm' }
    ]
  },
  {
    id: 'sec-5',
    title: 'V. Đánh giá về ý thức và kết quả công tác cán bộ lớp, Đoàn thể',
    maxPoints: 10,
    criteria: [
      { id: '5.1', content: '1. Tham gia tích cực phong trào Lớp, Đoàn, Hội', maxPoints: 3, guide: 'Cộng 3đ/học kỳ cho thành viên tích cực.', type: 'boolean' },
      {
        id: '5.2', content: '2. Hoàn thành tốt nhiệm vụ Ban cán sự, BCH Đoàn/Hội', maxPoints: 5,
        guide: 'Lớp trưởng, Bí thư... hoàn thành tốt: 5đ; Phó: 4đ; Ủy viên: 3đ.',
        type: 'select',
        options: [{ label: 'Không', points: 0 }, { label: 'Ủy viên (3đ)', points: 3 }, { label: 'Cấp phó (4đ)', points: 4 }, { label: 'Cấp trưởng (5đ)', points: 5 }]
      },
      { id: '5.3', content: '3. Đạt giải thưởng, khen thưởng đặc biệt', maxPoints: 10, guide: 'Sinh viên 5 tốt, khen thưởng của UBND Tỉnh, Trung ương... Tối đa 10đ.', type: 'number', unit: 'điểm' }
    ]
  }
];

// Tổng số tiêu chí
const ALL_CRITERIA = EVALUATION_DATA.flatMap(s => s.criteria);
const TOTAL_CRITERIA = ALL_CRITERIA.length;
type CriterionReviewStatus = 'approved' | 'rejected' | 'pending';

const SECTION_ICONS: Record<string, React.ComponentType<any>> = {
  'sec-1': Star,
  'sec-2': ShieldCheck,
  'sec-3': Users,
  'sec-4': Heart,
  'sec-5': Award
};

const normalizeProofList = (proofs: string[] = []) => [...proofs].sort();

const areProofListsEqual = (a: string[] = [], b: string[] = []) => {
  const left = normalizeProofList(a);
  const right = normalizeProofList(b);
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
};

const getRank = (score: number) => {
  if (score >= 90) return { label: 'Xuất sắc', color: 'text-purple-600', bg: 'bg-purple-50' };
  if (score >= 80) return { label: 'Tốt', color: 'text-emerald-600', bg: 'bg-emerald-50' };
  if (score >= 65) return { label: 'Khá', color: 'text-blue-600', bg: 'bg-blue-50' };
  if (score >= 50) return { label: 'Trung bình', color: 'text-orange-600', bg: 'bg-orange-50' };
  if (score >= 35) return { label: 'Yếu', color: 'text-red-500', bg: 'bg-red-50' };
  return { label: 'Kém', color: 'text-slate-400', bg: 'bg-slate-50' };
};

const getOptionLabel = (criterion: Criterion, value: number): string => {
  if (criterion.type === 'select' && criterion.options) {
    return criterion.options.find(o => o.points === value)?.label || `${value}đ`;
  }
  if (criterion.type === 'boolean') {
    return value > 0 ? 'Đã tham gia' : 'Chưa tham gia';
  }
  return `${value}`;
};

// ---- Main Component ----
const AdminDRLDetail: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [student, setStudent] = useState<Student | null>(null);
  const [drlScore, setDrlScore] = useState<DRLScore | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [proofs, setProofs] = useState<Record<string, string[]>>({});
  const [rejectionBaseline, setRejectionBaseline] = useState<Record<string, { score: number; proofs: string[] }>>({});
  const [editedRejectedByStudent, setEditedRejectedByStudent] = useState<string[]>([]);

  // Track review status per criterion id: approved/rejected/pending
  const [criterionReviewStatus, setCriterionReviewStatus] = useState<Record<string, CriterionReviewStatus>>({});
  const [activeSection, setActiveSection] = useState<string | null>('sec-1');

  // Proof preview
  const [previewState, setPreviewState] = useState<{
    open: boolean; urls: string[]; index: number; title: string;
  }>({ open: false, urls: [], index: 0, title: '' });

  // Get period from query param
  const period = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('period') || '';
  }, [location.search]);

  // Compute section totals
  const sectionTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    EVALUATION_DATA.forEach(sec => {
      let sum = 0;
      sec.criteria.forEach(crit => { sum += scores[crit.id] || 0; });
      totals[sec.id] = Math.max(0, Math.min(sum, sec.maxPoints));
    });
    return totals;
  }, [scores]);

  const totalScore = useMemo(() => Object.values(sectionTotals).reduce((a, b) => a + b, 0), [sectionTotals]);

  // Review count at criteria level
  const approvedCount = useMemo(
    () => Object.values(criterionReviewStatus).filter((s) => s === 'approved').length,
    [criterionReviewStatus]
  );
  const rejectedCount = useMemo(
    () => Object.values(criterionReviewStatus).filter((s) => s === 'rejected').length,
    [criterionReviewStatus]
  );
  const reviewedCount = useMemo(
    () => Object.values(criterionReviewStatus).filter((s) => s !== 'pending').length,
    [criterionReviewStatus]
  );
  const allApproved = useMemo(() => approvedCount === TOTAL_CRITERIA, [approvedCount]);

  const editedRejectedMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    Object.entries(rejectionBaseline).forEach(([criterionId, baseline]) => {
      const currentScore = scores[criterionId] || 0;
      const currentProofs = proofs[criterionId] || [];
      const changedByDiff = currentScore !== baseline.score || !areProofListsEqual(currentProofs, baseline.proofs || []);
      const changedByStudentFlag = editedRejectedByStudent.includes(criterionId);
      map[criterionId] = changedByDiff || changedByStudentFlag;
    });
    return map;
  }, [rejectionBaseline, scores, proofs, editedRejectedByStudent]);

  // Per-section approved counts
  const sectionApprovedCounts = useMemo(() => {
    const counts: Record<string, { approved: number; total: number }> = {};
    EVALUATION_DATA.forEach(sec => {
      const approved = sec.criteria.filter(c => criterionReviewStatus[c.id] === 'approved').length;
      counts[sec.id] = { approved, total: sec.criteria.length };
    });
    return counts;
  }, [criterionReviewStatus]);

  // ---- Load Data ----
  useEffect(() => {
    const loadData = async () => {
      if (!studentId) {
        setError('Không tìm thấy mã sinh viên');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const [allStudents, allScores] = await Promise.all([getStudents(), getDRLScores()]);

        const foundStudent = allStudents.find(s => s.id === studentId);
        if (!foundStudent) {
          setError('Không tìm thấy thông tin sinh viên');
          setLoading(false);
          return;
        }
        setStudent(foundStudent);

        const foundScore = allScores.find(
          s => s.studentId === studentId && (period ? s.semester === period : true)
        ) || allScores.find(s => s.studentId === studentId);

        if (foundScore) {
          setDrlScore(foundScore);
          if (foundScore.details && typeof foundScore.details === 'object') {
            const parsedScores: Record<string, number> = {};
            Object.entries(foundScore.details).forEach(([k, v]) => {
              if (k !== 'proofs' && k !== 'approvalNotes' && typeof v === 'number') {
                parsedScores[k] = v as number;
              }
            });
            setScores(parsedScores);

            const proofsFromDetails =
              foundScore.details.proofs && typeof foundScore.details.proofs === 'object'
                ? (foundScore.details.proofs as Record<string, string[]>)
                : {};
            setProofs(proofsFromDetails);

            // Restore previously reviewed criteria if saved
            if (foundScore.details.approvalNotes?.criterionReviewStatus) {
              setCriterionReviewStatus(
                foundScore.details.approvalNotes.criterionReviewStatus as Record<string, CriterionReviewStatus>
              );
            } else if (foundScore.details.approvalNotes?.approvedCriteria) {
              const approvedLegacy = foundScore.details.approvalNotes.approvedCriteria as Record<string, boolean>;
              const restored: Record<string, CriterionReviewStatus> = {};
              Object.entries(approvedLegacy).forEach(([criterionId, isApproved]) => {
                restored[criterionId] = isApproved ? 'approved' : 'pending';
              });
              setCriterionReviewStatus(restored);
            }

            if (
              foundScore.details.approvalNotes?.rejectionBaseline &&
              typeof foundScore.details.approvalNotes.rejectionBaseline === 'object'
            ) {
              setRejectionBaseline(
                foundScore.details.approvalNotes.rejectionBaseline as Record<string, { score: number; proofs: string[] }>
              );
            }

            if (
              foundScore.details.studentRevision?.editedRejectedCriteria &&
              Array.isArray(foundScore.details.studentRevision.editedRejectedCriteria)
            ) {
              setEditedRejectedByStudent(foundScore.details.studentRevision.editedRejectedCriteria as string[]);
            }
          }
        }

        try {
          const proofsFromApi = await getProofImages(studentId);
          if (proofsFromApi && Object.keys(proofsFromApi).length > 0) {
            setProofs(prev => {
              const merged = { ...prev };
              Object.entries(proofsFromApi).forEach(([key, urls]) => {
                merged[key] = Array.from(new Set([...(merged[key] || []), ...urls]));
              });
              return merged;
            });
          }
        } catch { /* ignore */ }
      } catch (err) {
        console.error('Error loading DRL detail:', err);
        setError('Lỗi khi tải dữ liệu phiếu đánh giá');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [studentId, period]);

  // ---- Actions ----
  const setCriterionStatus = useCallback((criterionId: string, status: CriterionReviewStatus) => {
    setCriterionReviewStatus((prev) => {
      const current = prev[criterionId] || 'pending';
      // Clicking the same state again resets to pending
      const nextStatus = current === status ? 'pending' : status;
      return { ...prev, [criterionId]: nextStatus };
    });
  }, []);

  // Approve all criteria in one section
  const approveSectionAll = useCallback((sectionId: string) => {
    const section = EVALUATION_DATA.find(s => s.id === sectionId);
    if (!section) return;
    setCriterionReviewStatus(prev => {
      const next = { ...prev };
      section.criteria.forEach(c => {
        if (prev[c.id] === 'rejected' && !editedRejectedMap[c.id]) {
          next[c.id] = 'rejected';
          return;
        }
        next[c.id] = 'approved';
      });
      return next;
    });
  }, [editedRejectedMap]);

  // Approve ALL criteria across all sections
  const approveAll = useCallback(() => {
    setCriterionReviewStatus((prev) => {
      const all: Record<string, CriterionReviewStatus> = {};
      ALL_CRITERIA.forEach((c) => {
        if (prev[c.id] === 'rejected' && !editedRejectedMap[c.id]) {
          all[c.id] = 'rejected';
        } else {
          all[c.id] = 'approved';
        }
      });
      return all;
    });
  }, [editedRejectedMap]);

  const handleSaveApproval = useCallback(async () => {
    if (!drlScore) { setError('Không có phiếu đánh giá để duyệt'); return; }
    if (reviewedCount === 0) { setError('Vui lòng duyệt/không duyệt ít nhất một tiêu chí trước khi lưu'); return; }

    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      const rejectedCriteriaIds = Object.entries(criterionReviewStatus)
        .filter(([, status]) => status === 'rejected')
        .map(([criterionId]) => criterionId);

      const updatedDetailScores: Record<string, number> = { ...scores };
      rejectedCriteriaIds.forEach((criterionId) => {
        updatedDetailScores[criterionId] = 0;
      });

      const updatedSectionTotals: Record<string, number> = {};
      EVALUATION_DATA.forEach((sec) => {
        let sum = 0;
        sec.criteria.forEach((crit) => {
          sum += updatedDetailScores[crit.id] || 0;
        });
        updatedSectionTotals[sec.id] = Math.max(0, Math.min(sum, sec.maxPoints));
      });
      const updatedTotalScore = Object.values(updatedSectionTotals).reduce((acc, val) => acc + val, 0);

      let nextStatus = drlScore.status;
      if (rejectedCount > 0) {
        nextStatus = 'rejected';
      } else if (allApproved) {
        if (drlScore.status === 'submitted') nextStatus = 'class_approved';
        else if (drlScore.status === 'class_approved') nextStatus = 'bch_approved';
        else if (drlScore.status === 'bch_approved') nextStatus = 'faculty_approved';
        else if (drlScore.status === 'faculty_approved') nextStatus = 'approved';
        else nextStatus = 'class_approved';
      }

      const updatedScore: DRLScore = {
        ...drlScore,
        status: nextStatus,
        classScore: updatedTotalScore,
        details: {
          ...drlScore.details,
          ...updatedDetailScores,
          approvalNotes: {
            ...(drlScore.details?.approvalNotes || {}),
            criterionReviewStatus,
            approvedCriteria: Object.fromEntries(
              Object.entries(criterionReviewStatus).map(([criterionId, status]) => [
                criterionId,
                status === 'approved'
              ])
            ),
            rejectedCriteria: rejectedCriteriaIds,
            rejectionBaseline: Object.fromEntries(
              rejectedCriteriaIds.map((criterionId) => [
                criterionId,
                {
                  score: updatedDetailScores[criterionId] || 0,
                  proofs: normalizeProofList(proofs[criterionId] || [])
                }
              ])
            ),
            studentNotice:
              rejectedCriteriaIds.length > 0
                ? 'Có tiêu chí không duyệt và đã được đưa về 0 điểm. Vui lòng chỉnh sửa minh chứng/điểm và nộp lại phiếu.'
                : '',
            approvedBy: 'admin',
            approvedAt: new Date().toISOString()
          }
        }
      };

      await saveDRLScore(updatedScore);

      const nextLabel =
        nextStatus === 'rejected' ? 'Không duyệt' :
        nextStatus === 'class_approved' ? 'Duyệt lớp' :
        nextStatus === 'bch_approved' ? 'Duyệt BCH' :
        nextStatus === 'faculty_approved' ? 'Duyệt Khoa' :
        nextStatus === 'approved' ? 'Phê duyệt hoàn tất' : 'Đã cập nhật';

      setSuccessMsg(`✅ ${(allApproved || rejectedCount > 0) ? nextLabel : 'Lưu duyệt'} thành công! Phiếu đã được cập nhật.`);
      setDrlScore(updatedScore);
      setTimeout(() => navigate(-1), 1800);
    } catch (err) {
      console.error('Error saving approval:', err);
      setError('Lỗi khi lưu duyệt. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  }, [drlScore, criterionReviewStatus, allApproved, reviewedCount, rejectedCount, scores, proofs, navigate]);

  const openProofPreview = useCallback((urls: string[], index: number, title: string) => {
    if (!urls.length) return;
    setPreviewState({ open: true, urls, index, title });
  }, []);

  const closeProofPreview = useCallback(() => {
    setPreviewState({ open: false, urls: [], index: 0, title: '' });
  }, []);

  const goPrevProof = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewState((prev) => {
      if (!prev.urls.length) return prev;
      const nextIndex = (prev.index - 1 + prev.urls.length) % prev.urls.length;
      return { ...prev, index: nextIndex };
    });
  }, []);

  const goNextProof = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewState((prev) => {
      if (!prev.urls.length) return prev;
      const nextIndex = (prev.index + 1) % prev.urls.length;
      return { ...prev, index: nextIndex };
    });
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'rejected': return { label: 'Không duyệt', color: 'bg-red-100 text-red-700 border-red-200' };
      case 'submitted': return { label: 'Chờ duyệt lớp', color: 'bg-orange-100 text-orange-700 border-orange-200' };
      case 'class_approved': return { label: 'Đã duyệt lớp', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' };
      case 'bch_approved': return { label: 'Đã duyệt BCH', color: 'bg-blue-100 text-blue-700 border-blue-200' };
      case 'faculty_approved': return { label: 'Đã duyệt Khoa', color: 'bg-purple-100 text-purple-700 border-purple-200' };
      case 'approved': return { label: 'Hoàn tất', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
      default: return { label: 'Nháp', color: 'bg-slate-100 text-slate-600 border-slate-200' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Đang tải phiếu đánh giá...</p>
        </div>
      </div>
    );
  }

  const rankInfo = getRank(totalScore);
  const statusBadge = drlScore ? getStatusBadge(drlScore.status) : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24">

      {/* ---- Proof Preview Modal ---- */}
      {previewState.open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeProofPreview}>
          <div className="relative max-w-3xl w-full max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-700">{previewState.title} — {previewState.index + 1}/{previewState.urls.length}</span>
              <button onClick={closeProofPreview} className="text-slate-400 hover:text-slate-700" type="button"><X size={20} /></button>
            </div>
            <div className="relative flex items-center justify-center bg-slate-100 min-h-[300px] max-h-[70vh] overflow-hidden">
              {/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(previewState.urls[previewState.index]) ? (
                <img src={previewState.urls[previewState.index]} alt="Minh chứng" className="max-w-full max-h-[65vh] object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-3 p-8">
                  <FileIcon size={48} className="text-slate-400" />
                  <a href={previewState.urls[previewState.index]} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm flex items-center gap-2">
                    <ExternalLink size={14} /> Xem tệp
                  </a>
                </div>
              )}

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
            {previewState.urls.length > 1 && (
              <div className="flex justify-center gap-2 p-3 border-t">
                {previewState.urls.map((_, i) => (
                  <button key={i} onClick={() => setPreviewState(p => ({ ...p, index: i }))}
                    className={`w-2 h-2 rounded-full transition-all ${i === previewState.index ? 'bg-blue-600 w-5' : 'bg-slate-300'}`} type="button" />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- Messages ---- */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
          <p className="text-red-700 text-sm flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800" type="button"><X size={18} /></button>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3 flex items-center gap-3">
          <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
          <p className="text-emerald-700 text-sm flex-1">{successMsg}</p>
        </div>
      )}

      {/* ---- Header ---- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors flex-shrink-0" type="button">
                <ArrowLeft size={20} className="text-slate-600" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-bold tracking-tight text-slate-800 truncate">
                    Duyệt phiếu: {student ? `${student.lastName} ${student.firstName}` : studentId}
                  </h1>
                  {statusBadge && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border flex-shrink-0 ${statusBadge.color}`}>
                      {statusBadge.label}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                  Admin Review — Phiếu Đánh Giá Điểm Rèn Luyện
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="hidden md:flex flex-col items-end mr-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Đã xử lý</span>
                <span className="text-base font-black text-blue-600">{reviewedCount}/{TOTAL_CRITERIA}</span>
              </div>

              <button onClick={approveAll} disabled={allApproved}
                className="px-3 py-2 bg-blue-50 hover:bg-blue-100 disabled:bg-slate-50 text-blue-700 disabled:text-slate-400 rounded-xl text-xs font-bold transition-colors border border-blue-200 disabled:border-slate-200 flex items-center gap-1.5"
                type="button">
                <CheckCircle2 size={14} />
                Duyệt tất cả
              </button>

              <button onClick={handleSaveApproval} disabled={saving || reviewedCount === 0}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
                type="button">
                {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? 'Đang lưu...' : 'Lưu duyệt'}
              </button>

              <button onClick={() => window.print()} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-slate-600" type="button" title="In phiếu">
                <Printer size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8">

        {/* ---- Student Info Card ---- */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <User size={20} className="text-blue-600" />
            <h2 className="font-bold text-slate-800">Thông tin sinh viên</h2>
          </div>
          {student ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Họ và tên</p><p className="font-bold text-slate-800 text-sm">{student.lastName} {student.firstName}</p></div>
              <div><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Mã số SV</p><p className="font-bold text-slate-800 text-sm">{student.id}</p></div>
              <div><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Lớp</p><p className="font-bold text-slate-800 text-sm">{student.classId || '—'}</p></div>
              <div><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Học kỳ</p><p className="font-bold text-slate-800 text-sm">{period || '—'}</p></div>
            </div>
          ) : (
            <p className="text-slate-400 text-sm italic">Không tìm thấy thông tin sinh viên</p>
          )}

          <div className="mt-5 pt-5 border-t border-slate-100 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <GraduationCap size={18} className="text-blue-500" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Tổng điểm tự đánh</p>
                <p className="text-2xl font-black text-blue-600">{totalScore} <span className="text-sm font-normal text-slate-400">/ 100</span></p>
              </div>
            </div>
            <div className={`px-3 py-1.5 rounded-xl ${rankInfo.bg}`}>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Xếp loại</p>
              <p className={`font-black text-sm ${rankInfo.color}`}>{rankInfo.label}</p>
            </div>
            <div className="ml-auto">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Tiến độ duyệt tiêu chí</p>
              <div className="flex items-center gap-2">
                <div className="w-36 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${(reviewedCount / TOTAL_CRITERIA) * 100}%` }} />
                </div>
                <span className="text-xs font-bold text-slate-600">{reviewedCount}/{TOTAL_CRITERIA}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Duyệt: {approvedCount} • Không duyệt: {rejectedCount}</p>
            </div>
          </div>
        </section>

        {/* ---- Warning if no score ---- */}
        {!drlScore && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800 text-sm">Sinh viên chưa nộp phiếu</p>
              <p className="text-xs text-amber-700 mt-1">Chưa có dữ liệu điểm từ sinh viên. Dữ liệu hiển thị là giá trị mặc định.</p>
            </div>
          </div>
        )}

        {/* ---- Evaluation Sections ---- */}
        <div className="space-y-4">
          {EVALUATION_DATA.map(section => {
            const SectionIcon = SECTION_ICONS[section.id] || Star;
            const isActive = activeSection === section.id;
            const sectionScore = sectionTotals[section.id];
            const secApproval = sectionApprovedCounts[section.id];
            const sectionAllApproved = secApproval.approved === secApproval.total;

            return (
              <div key={section.id} className={`bg-white rounded-2xl shadow-sm border transition-all overflow-hidden ${
                sectionAllApproved ? 'border-emerald-200' : isActive ? 'border-blue-200 ring-1 ring-blue-50' : 'border-slate-200'
              }`}>
                {/* Section Header */}
                <button
                  onClick={() => setActiveSection(isActive ? null : section.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
                  type="button"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      sectionAllApproved ? 'bg-emerald-100 text-emerald-600' : isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {sectionAllApproved ? <Check size={18} /> : <SectionIcon size={18} />}
                    </div>
                    <div className="min-w-0">
                      <h3 className={`font-bold text-sm md:text-base ${sectionAllApproved ? 'text-emerald-800' : 'text-slate-800'}`}>
                        {section.title}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">
                        Tối đa {section.maxPoints} điểm • Đã duyệt {secApproval.approved}/{secApproval.total} tiêu chí
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <span className={`text-lg font-black ${sectionAllApproved ? 'text-emerald-600' : 'text-blue-600'}`}>{sectionScore}</span>
                      <span className="text-xs text-slate-300 ml-1">/ {section.maxPoints}</span>
                    </div>
                    {isActive ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                  </div>
                </button>

                {/* Section Detail (expanded) */}
                {isActive && (
                  <div className="border-t border-slate-100 px-6 pb-6">
                    {/* Section-level approve all */}
                    <div className="flex items-center justify-between py-3 border-b border-slate-100 mb-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Tiêu chí trong mục
                      </span>
                      <button
                        onClick={() => approveSectionAll(section.id)}
                        disabled={sectionAllApproved}
                        className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 disabled:text-slate-400 transition-colors"
                        type="button"
                      >
                        <CheckCircle2 size={13} />
                        {sectionAllApproved ? 'Đã duyệt tất cả tiêu chí' : 'Duyệt tất cả tiêu chí trong mục'}
                      </button>
                    </div>

                    <div className="space-y-0">
                      {section.criteria.map(crit => {
                        const val = scores[crit.id] || 0;
                        const critProofs = proofs[crit.id] || [];
                        const reviewStatus = criterionReviewStatus[crit.id] || 'pending';
                        const isApproved = reviewStatus === 'approved';
                        const isRejected = reviewStatus === 'rejected';
                        const isEditedAfterReject = !!editedRejectedMap[crit.id];
                        const isInvalidRejected = isRejected && !isEditedAfterReject;
                        const optionLabel = getOptionLabel(crit, val);

                        return (
                          <div key={crit.id} className={`border-b border-slate-100 last:border-0 py-4 transition-colors ${
                            isApproved ? 'bg-emerald-50/30' : isRejected ? 'bg-red-50/40' : ''
                          }`}>
                            <div className="flex flex-col md:flex-row md:items-start gap-3">
                              {/* Criterion info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-2">
                                  {/* Tiêu chí ID badge */}
                                  <span className={`flex-shrink-0 mt-0.5 text-[10px] font-black px-1.5 py-0.5 rounded ${
                                    isApproved
                                      ? 'bg-emerald-200 text-emerald-800'
                                      : isRejected
                                      ? 'bg-red-200 text-red-800'
                                      : 'bg-slate-100 text-slate-500'
                                  }`}>
                                    {crit.id}
                                  </span>
                                  <h4 className="text-sm font-medium text-slate-800">{crit.content}</h4>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1 italic ml-8">{crit.guide}</p>
                                {isRejected && (
                                  <p className={`text-[10px] font-semibold mt-1 ml-8 ${isEditedAfterReject ? 'text-amber-700' : 'text-red-600'}`}>
                                    {isEditedAfterReject ? 'Đã chỉnh sửa bởi sinh viên, có thể duyệt lại.' : 'Không hợp lệ: Sinh viên chưa chỉnh sửa mục này.'}
                                  </p>
                                )}
                              </div>

                              {/* Right side: value + approve button */}
                              <div className="flex items-center gap-3 flex-shrink-0 ml-8 md:ml-0">
                                {/* Value display */}
                                <div className="text-right min-w-[60px]">
                                  {crit.type === 'boolean' ? (
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${val > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                      {optionLabel}
                                    </span>
                                  ) : crit.type === 'select' ? (
                                    <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-100 max-w-[140px] block truncate">
                                      {optionLabel}
                                    </span>
                                  ) : (
                                    <span className="text-sm font-medium text-slate-700">{val}</span>
                                  )}
                                  <div className="text-sm font-black text-emerald-600 text-right mt-0.5">{val}đ</div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setCriterionStatus(crit.id, 'approved')}
                                    disabled={isInvalidRejected}
                                    className={`flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                                      isApproved
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-200'
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed'
                                    }`}
                                    type="button"
                                    title={isApproved ? 'Bỏ duyệt tiêu chí này' : 'Duyệt tiêu chí này'}
                                  >
                                    <Check size={13} />
                                    {isApproved ? 'Đã duyệt' : 'Duyệt'}
                                  </button>
                                  <button
                                    onClick={() => setCriterionStatus(crit.id, 'rejected')}
                                    className={`flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                                      isRejected
                                        ? 'bg-red-600 text-white border-red-600 shadow-sm shadow-red-200'
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-red-300 hover:text-red-600 hover:bg-red-50'
                                    }`}
                                    type="button"
                                    title={isRejected ? 'Bỏ không duyệt tiêu chí này' : 'Không duyệt tiêu chí này'}
                                  >
                                    <X size={13} />
                                    {isRejected ? 'Đã không duyệt' : 'Không duyệt'}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Proofs */}
                            {critProofs.length > 0 && (
                              <div className="mt-3 ml-8">
                                <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                  <Paperclip size={11} className="text-blue-500" />
                                  Minh chứng ({critProofs.length})
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {critProofs.map((url, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => openProofPreview(critProofs, idx, `Mục ${crit.id}`)}
                                      className="flex items-center gap-1.5 bg-white border border-slate-200 hover:border-blue-300 px-2 py-1.5 rounded-lg text-[10px] text-blue-600 transition-colors hover:bg-blue-50"
                                      type="button"
                                    >
                                      <FileIcon size={11} className="text-slate-400 flex-shrink-0" />
                                      <span className="max-w-[120px] truncate">{url.split('/').pop() || `minh-chung-${idx + 1}`}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Section footer */}
                    <div className="mt-4 p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Info size={14} />
                        <span className="text-xs italic">Giới hạn tối đa {section.maxPoints} điểm</span>
                      </div>
                      <div className="text-sm font-bold">
                        Tổng mục: <span className="text-blue-600">{sectionScore}đ</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ---- Final Summary Card ---- */}
        <section className="mt-10 bg-slate-900 rounded-3xl p-8 text-white shadow-2xl shadow-slate-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Kết quả đánh giá</span>
              </div>
              <h2 className="text-3xl font-black tracking-tight">
                Tổng cộng: <span className="text-blue-400">{totalScore}</span> điểm
              </h2>
              <p className="text-slate-400">
                Xếp loại rèn luyện: <span className={`font-bold ${rankInfo.color}`}>{rankInfo.label}</span>
              </p>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-400">Đã duyệt:</span>
                <span className="font-bold text-emerald-400">{approvedCount}/{TOTAL_CRITERIA} tiêu chí</span>
                <span className="text-slate-400">• Không duyệt:</span>
                <span className="font-bold text-red-300">{rejectedCount}</span>
                {allApproved && <span className="text-emerald-400">✓ Đầy đủ</span>}
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="w-28 h-28 rounded-full bg-white/10 flex items-center justify-center border-4 border-white/10">
                <span className="text-4xl font-black">{totalScore}</span>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <button onClick={approveAll} disabled={allApproved}
                  className="w-full py-2.5 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-white/10 disabled:text-white/40 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                  type="button">
                  <CheckCircle2 size={16} />
                  {allApproved ? 'Đã duyệt tất cả' : 'Duyệt tất cả tiêu chí'}
                </button>
                <button onClick={handleSaveApproval} disabled={saving || reviewedCount === 0}
                  className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-white/10 disabled:text-white/40 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                  type="button">
                  {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? 'Đang lưu...' : 'Lưu & Xác nhận duyệt'}
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDRLDetail;
