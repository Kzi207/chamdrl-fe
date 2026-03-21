import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Save,
  X,
  Loader,
  MessageSquareText,
  UserCheck,
  FileText,
  Star,
  ShieldCheck,
  Users,
  Heart,
  Award
} from 'lucide-react';
import { getDRLScores, saveDRLScore, getStudents, getClasses, getGradingPeriods } from '../services/storage';
import { DRLScore, Student, ClassGroup, GradingPeriod } from '../types';

const EVALUATION_DATA = [
  {
    id: 'sec-1',
    title: 'I. Đánh giá về ý thức tham gia học tập',
    icon: Star,
    maxPoints: 20
  },
  {
    id: 'sec-2',
    title: 'II. Đánh giá về ý thức chấp hành nội quy, quy chế',
    icon: ShieldCheck,
    maxPoints: 25
  },
  {
    id: 'sec-3',
    title: 'III. Đánh giá về ý thức tham gia hoạt động CT-XH, VH-VN, TD-TT',
    icon: Users,
    maxPoints: 20
  },
  {
    id: 'sec-4',
    title: 'IV. Đánh giá về ý thức công dân trong quan hệ cộng đồng',
    icon: Heart,
    maxPoints: 25
  },
  {
    id: 'sec-5',
    title: 'V. Đánh giá về ý thức và kết quả công tác cán bộ lớp, Đoàn thể',
    icon: Award,
    maxPoints: 10
  }
];

interface ReviewItem {
  studentId: string;
  studentName: string;
  drlId: string;
  selfScore: number;
  approvalStatus: Record<string, 'approved' | 'rejected' | 'pending'>;
  approvalNotes: Record<string, string>;
  status: string;
}

const AdminDRLApproval: React.FC = () => {
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
  const [reviewData, setReviewData] = useState<Record<string, ReviewItem>>({});

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

        // Initialize review data
        const reviewInit: Record<string, ReviewItem> = {};
        (scoresData || []).forEach((score) => {
          const student = (studentsData || []).find((s) => s.id === score.studentId);
          reviewInit[score.id] = {
            studentId: score.studentId,
            studentName: student ? `${student.lastName} ${student.firstName}` : 'Unknown',
            drlId: score.id,
            selfScore: score.selfScore,
            approvalStatus: {},
            approvalNotes: {},
            status: score.status
          };
        });
        setReviewData(reviewInit);
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

  const setSectionStatus = useCallback(
    (drlId: string, sectionId: string, status: 'approved' | 'rejected' | 'pending') => {
      setReviewData((prev) => ({
        ...prev,
        [drlId]: {
          ...prev[drlId],
          approvalStatus: {
            ...prev[drlId].approvalStatus,
            [sectionId]: status
          }
        }
      }));
    },
    []
  );

  const updateNote = useCallback((drlId: string, sectionId: string, note: string) => {
    setReviewData((prev) => ({
      ...prev,
      [drlId]: {
        ...prev[drlId],
        approvalNotes: {
          ...prev[drlId].approvalNotes,
          [sectionId]: note
        }
      }
    }));
  }, []);

  const approveAllSections = useCallback((drlId: string) => {
    setReviewData((prev) => ({
      ...prev,
      [drlId]: {
        ...prev[drlId],
        approvalStatus: EVALUATION_DATA.reduce(
          (acc, sec) => ({ ...acc, [sec.id]: 'approved' }),
          {} as Record<string, 'approved' | 'rejected' | 'pending'>
        )
      }
    }));
  }, []);

  const handleSaveApprovals = useCallback(async () => {
    if (!filterStatus) {
      setError('Vui lòng chọn trạng thái để duyệt');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      // Collect all DRL scores to update
      const scoresToUpdate: DRLScore[] = [];

      Object.entries(reviewData).forEach(([drlId, review]) => {
        const originalScore = drlScores.find((s) => s.id === drlId);
        if (!originalScore) return;

        // Check if all sections are approved
        const allSectionsApproved = EVALUATION_DATA.every(
          (sec) => review.approvalStatus[sec.id] === 'approved'
        );
        
        const hasRejections = EVALUATION_DATA.some(
          (sec) => review.approvalStatus[sec.id] === 'rejected'
        );

        if (allSectionsApproved && !hasRejections) {
          // Determine next status based on current status
          let nextStatus = originalScore.status;
          
          if (originalScore.status === 'submitted') {
            nextStatus = 'class_approved';
          } else if (originalScore.status === 'class_approved') {
            nextStatus = 'bch_approved';
          }

          scoresToUpdate.push({
            ...originalScore,
            status: nextStatus,
            classScore: review.selfScore,
            details: {
              ...originalScore.details,
              approvalNotes: review.approvalNotes
            }
          });
        } else if (hasRejections) {
          scoresToUpdate.push({
            ...originalScore,
            status: 'rejected',
            classScore: review.selfScore,
            details: {
              ...originalScore.details,
              approvalNotes: {
                ...review.approvalNotes,
                rejectedBy: 'admin',
                rejectedAt: new Date().toISOString()
              }
            }
          });
        }
      });

      // Save all updated scores
      for (const score of scoresToUpdate) {
        await saveDRLScore(score);
      }

      const approvedUpdatedCount = scoresToUpdate.filter((s) => s.status !== 'rejected').length;
      const rejectedUpdatedCount = scoresToUpdate.filter((s) => s.status === 'rejected').length;

      setSuccessMsg(
        `Đã cập nhật ${scoresToUpdate.length} phiếu (Duyệt: ${approvedUpdatedCount}, Không duyệt: ${rejectedUpdatedCount})`
      );

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
  }, [reviewData, drlScores]);

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
                onClick={() => navigate('/admin-home')}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                type="button"
              >
                <ArrowLeft size={20} className="text-slate-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Duyệt Điểm Rèn Luyện</h1>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">
                  Review & Approve Student Conduct Scores
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
              Duyệt ({Object.values(reviewData).filter((r) => Object.values(r.approvalStatus).some((s) => s !== 'pending')).length})
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
                <option value="faculty_approved">Đã duyệt Khoa (Faculty Approved)</option>
                <option value="approved">Được phê duyệt (Approved)</option>
                <option value="rejected">Không duyệt (Rejected)</option>
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
            <FileText size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">Không có phiếu đánh giá để duyệt</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredScores.map((score) => {
              const student = students.find((s) => s.id === score.studentId);
              const review = reviewData[score.id];
              const isExpanded = expandedStudents.has(score.id);
              const allSectionsApproved = EVALUATION_DATA.every(
                (sec) => review?.approvalStatus[sec.id] === 'approved'
              );

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
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          allSectionsApproved ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                        }`}
                      >
                        {allSectionsApproved ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-800 truncate">
                          {review?.studentName}
                        </h3>
                        <p className="text-xs text-slate-400 uppercase tracking-wider">
                          {student?.id && `MSSV: ${student.id}`} • Điểm tự đánh: {score.selfScore}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right hidden md:block">
                        <div className="text-sm font-bold text-slate-800">
                          {Object.values(review?.approvalStatus || {}).filter(s => s === 'approved').length}/{EVALUATION_DATA.length}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase">Mục duyệt</div>
                      </div>
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </button>

                  {/* Sections Detail */}
                  {isExpanded && review && (
                    <div className="border-t border-slate-100 px-6 py-6 space-y-4">
                      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                        <h4 className="font-bold text-slate-700">Duyệt các mục đánh giá</h4>
                        <button
                          onClick={() => approveAllSections(score.id)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-bold transition-colors"
                          type="button"
                        >
                          Duyệt tất cả mục
                        </button>
                      </div>

                      {EVALUATION_DATA.map((section) => (
                        <div
                          key={section.id}
                          className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-white rounded-lg flex-shrink-0">
                              <section.icon size={18} className="text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h5 className="font-bold text-slate-800 text-sm">{section.title}</h5>
                              <p className="text-[10px] text-slate-400">Tối đa: {section.maxPoints} điểm</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSectionStatus(score.id, section.id, 'approved')}
                                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                                  review.approvalStatus[section.id] === 'approved'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                }`}
                                type="button"
                              >
                                Duyệt
                              </button>
                              <button
                                onClick={() => setSectionStatus(score.id, section.id, 'rejected')}
                                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                                  review.approvalStatus[section.id] === 'rejected'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                }`}
                                type="button"
                              >
                                Không duyệt
                              </button>
                            </div>
                          </div>

                          <textarea
                            placeholder="Ghi chú duyệt (tuỳ chọn)..."
                            value={review.approvalNotes[section.id] || ''}
                            onChange={(e) => updateNote(score.id, section.id, e.target.value)}
                            className="w-full p-3 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            rows={2}
                          />
                        </div>
                      ))}

                      {allSectionsApproved && (
                        <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                          <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-emerald-800 text-sm">Sẵn sàng duyệt</p>
                            <p className="text-xs text-emerald-700 mt-1">
                              Bấm "Lưu Duyệt" ở trên để xác nhận duyệt tất cả mục cho sinh viên này.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDRLApproval;
