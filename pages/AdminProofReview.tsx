import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Save,
  X,
  Loader,
  FileIcon,
  Download,
  Eye,
  Trash2,
  MessageSquareText,
  Image,
  File
} from 'lucide-react';
import { getDRLScores, getStudents, getClasses, getGradingPeriods, saveDRLScore } from '../services/storage';
import { DRLScore, Student, ClassGroup, GradingPeriod } from '../types';

// Evaluation criteria data matching DRLForm
const EVALUATION_DATA = [
  {
    id: 'sec-1',
    criteria: [
      { id: '1.1', content: '1. Điểm trung bình học tập tích lũy' },
      { id: '1.2', content: '2. Chứng nhận tham gia các lớp kỹ năng học tập' },
      { id: '1.3', content: '3. Hội thảo, Tọa đàm cấp Khoa/Trường' },
      { id: '1.4', content: '4. Cuộc thi học thuật cấp Khoa/Trường' },
      { id: '1.5', content: '5. Cuộc thi học thuật đơn vị ngoài Trường' }
    ]
  },
  {
    id: 'sec-2',
    criteria: [
      { id: '2.1', content: '1. Ý thức, thái độ trong học tập' },
      { id: '2.2', content: '2. Chấp hành nội quy, quy chế Nhà trường' },
      { id: '2.3', content: '3. Thực hiện quy chế thi, cuộc thi' },
      { id: '2.4', content: '4. Chấp hành quy định thư viện, phòng máy' },
      { id: '2.5', content: '5. Sinh hoạt lớp với CVHT, đồng phục, ngoại trú' }
    ]
  },
  {
    id: 'sec-3',
    criteria: [
      { id: '3.1', content: '1. Hoạt động bắt buộc do Khoa/Trường tổ chức' },
      { id: '3.2', content: '2. Đại hội, sinh hoạt Chi đoàn/Chi hội' },
      { id: '3.3', content: '3. Báo cáo chuyên đề trực tiếp/trực tuyến' },
      { id: '3.4', content: '4. Hoạt động ngoại khóa, CLB, Đội nhóm' },
      { id: '3.5', content: '5. Kết nạp Đoàn/Đảng' }
    ]
  },
  {
    id: 'sec-4',
    criteria: [
      { id: '4.1', content: '1. Chấp hành luật pháp, quy định Nhà nước' },
      { id: '4.2', content: '2. Hiến máu tình nguyện' },
      { id: '4.3', content: '3. Chiến dịch tình nguyện' },
      { id: '4.4', content: '4. Hoạt động đền ơn đáp nghĩa, nhân đạo' }
    ]
  },
  {
    id: 'sec-5',
    criteria: [
      { id: '5.1', content: '1. Tham gia tích cực phong trào Lớp, Đoàn, Hội' },
      { id: '5.2', content: '2. Hoàn thành tốt nhiệm vụ Ban cán sự, BCH Đoàn/Hội' },
      { id: '5.3', content: '3. Đạt giải thưởng, khen thưởng đặc biệt' }
    ]
  }
];

interface ProofApprovalState {
  [criterionId: string]: {
    status: 'approved' | 'rejected' | 'pending';
    notes: string;
  };
}

const AdminProofReview: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [drlScores, setDrlScores] = useState<DRLScore[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [periods, setPeriods] = useState<GradingPeriod[]>([]);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('submitted');

  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());
  const [expandedCriteria, setExpandedCriteria] = useState<Set<string>>(new Set());
  const [proofApproval, setProofApproval] = useState<Record<string, ProofApprovalState>>({});
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const studentId = params.get('studentId');
    const period = params.get('period');

    if (studentId) {
      setSearchTerm(studentId);
    }
    if (period) {
      setSelectedPeriod(period);
    }
  }, [location.search]);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [scoresData, studentsData, classesData, periodsData] = await Promise.all([
          getDRLScores(),
          getStudents(),
          getClasses(),
          getGradingPeriods()
        ]);

        setDrlScores(scoresData || []);
        setStudents(studentsData || []);
        setClasses(classesData || []);
        setPeriods(periodsData || []);

        // Initialize proof approval states
        const approvalInit: Record<string, ProofApprovalState> = {};
        (scoresData || []).forEach((score) => {
          approvalInit[score.id] = {};
          // Initialize all criteria
          EVALUATION_DATA.forEach((sec) => {
            sec.criteria.forEach((crit) => {
              approvalInit[score.id][crit.id] = {
                status: 'pending',
                notes: ''
              };
            });
          });
        });
        setProofApproval(approvalInit);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Lỗi khi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter scores based on criteria
  const filteredScores = useMemo(() => {
    return drlScores.filter((score) => {
      const student = students.find((s) => s.id === score.studentId);

      // Filter by status
      if (filterStatus && score.status !== filterStatus) {
        return false;
      }

      // Filter by class
      if (selectedClass && student?.classId !== selectedClass) {
        return false;
      }

      // Filter by period
      if (selectedPeriod && score.semester !== selectedPeriod) {
        return false;
      }

      // Search by student name or ID
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const studentName = student ? `${student.lastName} ${student.firstName}`.toLowerCase() : '';
        const mssv = student?.id.toLowerCase() || '';

        if (!studentName.includes(searchLower) && !mssv.includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  }, [drlScores, students, selectedClass, selectedPeriod, searchTerm, filterStatus]);

  const toggleCriterion = useCallback((drlId: string, criterionId: string) => {
    const key = `${drlId}-${criterionId}`;
    setExpandedCriteria((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const updateProofApproval = useCallback(
    (
      drlId: string,
      criterionId: string,
      status: 'approved' | 'rejected' | 'pending',
      notes: string
    ) => {
      setProofApproval((prev) => ({
        ...prev,
        [drlId]: {
          ...prev[drlId],
          [criterionId]: { status, notes }
        }
      }));
    },
    []
  );

  const approveAllProofs = useCallback((drlId: string) => {
    setProofApproval((prev) => {
      const updated = { ...prev[drlId] };
      EVALUATION_DATA.forEach((sec) => {
        sec.criteria.forEach((crit) => {
          const current = updated[crit.id] || { status: 'pending', notes: '' };
          // Skip items that were explicitly rejected by admin.
          if (current.status !== 'rejected') {
            updated[crit.id] = {
              ...current,
              status: 'approved'
            };
          }
        });
      });
      return {
        ...prev,
        [drlId]: updated
      };
    });
  }, []);

  const handleSaveApprovals = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      const scoresToUpdate: DRLScore[] = [];

      Object.entries(proofApproval).forEach(([drlId, approvals]) => {
        const originalScore = drlScores.find((s) => s.id === drlId);
        if (!originalScore) return;

        // Check if all proofs are approved
        const allProofsApproved = Object.values(approvals).every((a) => a.status === 'approved');

        if (allProofsApproved) {
          scoresToUpdate.push({
            ...originalScore,
            status: 'approved',
            details: {
              ...originalScore.details,
              proofApprovalNotes: Object.fromEntries(
                Object.entries(approvals).map(([crit, data]) => [crit, data.notes])
              ),
              proofApprovalStatus: Object.fromEntries(
                Object.entries(approvals).map(([crit, data]) => [crit, data.status])
              )
            }
          });
        }
      });

      // Save all updated scores
      for (const score of scoresToUpdate) {
        await saveDRLScore(score);
      }

      setSuccessMsg(`Đã duyệt minh chứng cho ${scoresToUpdate.length} phiếu đánh giá`);

      // Reload data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error('Error saving approvals:', err);
      setError('Lỗi khi lưu duyệt. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  }, [proofApproval, drlScores]);

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
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/drl')}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                type="button"
              >
                <ArrowLeft size={20} className="text-slate-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Duyệt Minh Chứng</h1>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">
                  Review & Approve Evidence/Proofs
                </p>
              </div>
            </div>
            <button
              onClick={handleSaveApprovals}
              disabled={saving || filteredScores.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white px-6 py-2 rounded-lg font-bold transition-colors flex items-center gap-2"
              type="button"
            >
              {saving ? (
                <Loader size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              Duyệt tất cả
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Lớp</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Tất cả lớp</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Học kỳ</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Tất cả kỳ</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Trạng thái</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="submitted">Chờ duyệt (Submitted)</option>
                <option value="class_approved">Đã duyệt lớp (Class Approved)</option>
                <option value="bch_approved">Đã duyệt BCH (BCH Approved)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Tìm kiếm</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tên, MSSV..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-1.5 pl-9 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
          <p className="text-red-700 text-sm flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800" type="button">
            <X size={18} />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3 flex items-center gap-3">
          <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
          <p className="text-emerald-700 text-sm flex-1">{successMsg}</p>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800" type="button">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {filteredScores.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <File size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">Không có phiếu đánh giá có minh chứng để duyệt</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredScores.map((score) => {
              const student = students.find((s) => s.id === score.studentId);
              const isExpanded = expandedStudents.has(score.id);
              const approvals = proofApproval[score.id] || {};

              return (
                <div key={score.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  {/* Student Header */}
                  <button
                    onClick={() => {
                      setExpandedStudents((prev) => {
                        const next = new Set(prev);
                        if (next.has(score.id)) {
                          next.delete(score.id);
                        } else {
                          next.add(score.id);
                        }
                        return next;
                      });
                    }}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
                    type="button"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <FileIcon size={20} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-800 truncate">
                          {student ? `${student.lastName} ${student.firstName}` : 'Unknown'}
                        </h3>
                        <p className="text-xs text-slate-400 uppercase tracking-wider">
                          {student?.id && `MSSV: ${student.id}`} • Điểm: {score.selfScore}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right hidden md:block">
                        <div className="text-sm font-bold text-slate-800">
                          {Object.values(approvals).filter((a) => a.status === 'approved').length} / ~25
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase">Mục duyệt</div>
                      </div>
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </button>

                  {/* Criteria Detail */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 px-6 py-6 space-y-4">
                      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                        <h4 className="font-bold text-slate-700">Duyệt minh chứng từng mục</h4>
                        <button
                          onClick={() => approveAllProofs(score.id)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-bold transition-colors"
                          type="button"
                        >
                          Duyệt tất cả
                        </button>
                      </div>

                      {EVALUATION_DATA.map((section) => (
                        <div key={section.id} className="space-y-3">
                          {section.criteria.map((crit) => {
                            const critKey = `${score.id}-${crit.id}`;
                            const isExpCrit = expandedCriteria.has(critKey);
                            const approval = approvals[crit.id] || { status: 'pending', notes: '' };

                            return (
                              <div key={crit.id} className="border border-slate-100 rounded-xl overflow-hidden">
                                <button
                                  onClick={() => toggleCriterion(score.id, crit.id)}
                                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
                                  type="button"
                                >
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-slate-600">
                                      {crit.id}
                                    </div>
                                    <span className="text-sm text-slate-800 truncate">{crit.content}</span>
                                  </div>
                                  <div className="flex items-center gap-3 flex-shrink-0">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() =>
                                          updateProofApproval(score.id, crit.id, 'approved', approval.notes)
                                        }
                                        className={`text-[11px] font-bold px-2.5 py-1 rounded-md ${
                                          approval.status === 'approved'
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                        }`}
                                        type="button"
                                      >
                                        Duyệt
                                      </button>
                                      <button
                                        onClick={() =>
                                          updateProofApproval(score.id, crit.id, 'rejected', approval.notes)
                                        }
                                        className={`text-[11px] font-bold px-2.5 py-1 rounded-md ${
                                          approval.status === 'rejected'
                                            ? 'bg-red-600 text-white'
                                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                                        }`}
                                        type="button"
                                      >
                                        X Không duyệt
                                      </button>
                                    </div>
                                    {isExpCrit ? (
                                      <ChevronUp size={16} className="text-slate-400" />
                                    ) : (
                                      <ChevronDown size={16} className="text-slate-400" />
                                    )}
                                  </div>
                                </button>

                                {isExpCrit && (
                                  <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-3">
                                    <textarea
                                      placeholder="Ghi chú duyệt (tuỳ chọn)..."
                                      value={approval.notes}
                                      onChange={(e) =>
                                        updateProofApproval(score.id, crit.id, approval.status, e.target.value)
                                      }
                                      className="w-full p-3 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                      rows={2}
                                    />

                                    {/* Proof files for this criterion */}
                                    <div className="space-y-2">
                                      <p className="text-xs font-bold text-slate-600 uppercase">Minh chứng được tải lên</p>
                                      <div className="bg-white border border-slate-100 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                                        {score.details?.proofs && score.details.proofs[crit.id] ? (
                                          Array.isArray(score.details.proofs[crit.id]) ? (
                                            score.details.proofs[crit.id].map((proof: any, idx: number) => (
                                              <div
                                                key={idx}
                                                className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100 hover:border-blue-200 transition-colors"
                                              >
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                  <Image size={16} className="text-blue-500 flex-shrink-0" />
                                                  <div className="min-w-0">
                                                    <p className="text-xs font-medium text-slate-700 truncate">
                                                      {typeof proof === 'string'
                                                        ? proof.split('/').pop() || 'Proof file'
                                                        : 'Proof file'}
                                                    </p>
                                                  </div>
                                                </div>
                                                {typeof proof === 'string' && proof && (
                                                  <button
                                                    onClick={() =>
                                                      setPreviewFile({ url: proof, name: `${crit.id}_proof` })
                                                    }
                                                    className="p-1 hover:bg-blue-100 text-blue-600 rounded transition-colors flex-shrink-0"
                                                    type="button"
                                                  >
                                                    <Eye size={14} />
                                                  </button>
                                                )}
                                              </div>
                                            ))
                                          ) : (
                                            <div className="text-xs text-slate-400 italic p-2">Không có minh chứng</div>
                                          )
                                        ) : (
                                          <div className="text-xs text-slate-400 italic p-2">Không có minh chứng</div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Image Preview Modal */}
      {previewFile && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-6xl w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">{previewFile.name}</h3>
              <button onClick={() => setPreviewFile(null)} type="button">
                <X size={20} className="text-slate-600" />
              </button>
            </div>
            <div className="p-4 max-h-[90vh] overflow-auto">
              <img
                src={previewFile.url}
                alt={previewFile.name}
                className="w-full max-h-[85vh] object-contain rounded-lg"
                onError={() => (
                  <p className="text-center text-slate-500 py-8">Không thể tải được ảnh</p>
                )}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProofReview;
