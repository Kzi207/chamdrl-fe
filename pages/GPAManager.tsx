import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getCurrentUser,
  getClasses,
  getGPASubjects,
  getStudents,
  getGrades,
  updateGPASubject,
  saveGrade,
  getGradingPeriods,
  createGPASubject,
  deleteGPASubject,
} from '../services/storage';
import { ClassGroup, Subject, Student, SubjectGrade, GradingPeriod } from '../types';
import {
  ArrowLeft,
  Settings,
  CalendarDays,
  User,
  Plus,
  Pencil,
  Trash2,
  Search,
  BookOpen,
  BarChart3,
} from 'lucide-react';
import StudentBottomNav from '../components/StudentBottomNav';
import {
  calculateSubjectScore,
  convertScoreToLetter,
  calculateGPA,
  getClassification,
  getClassificationColor,
  validateScore,
  validateWeights,
} from '../utils/gpaCalculator';

type TabMode = 'config' | 'summary';

interface SubjectFormState {
  name: string;
  credits: number;
  midW: number;
  finalW: number;
}

const DEFAULT_SUBJECT_FORM: SubjectFormState = {
  name: '',
  credits: 3,
  midW: 30,
  finalW: 70,
};

const GPAManager: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const isStudent = currentUser?.role === 'student';

  const [activeTab, setActiveTab] = useState<TabMode>('config');
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<SubjectGrade[]>([]);
  const [periods, setPeriods] = useState<GradingPeriod[]>([]);

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedPeriodId, setSelectedPeriodId] = useState('');

  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [subjectForm, setSubjectForm] = useState<SubjectFormState>(DEFAULT_SUBJECT_FORM);
  const [subjectSearch, setSubjectSearch] = useState('');

  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true });
      return;
    }
    void loadInitData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === 'summary' && selectedClassId && !isStudent) {
      void loadSummaryData(selectedClassId);
    }
  }, [activeTab, selectedClassId, isStudent]);

  const loadInitData = async () => {
    try {
      const [cls, subs, pers, allGrades] = await Promise.all([
        getClasses(),
        getGPASubjects(),
        getGradingPeriods(),
        getGrades(),
      ]);

      setClasses(cls);
      setSubjects(subs);
      setPeriods(pers);
      setGrades(allGrades);

      if (!selectedPeriodId && pers.length > 0) {
        setSelectedPeriodId(pers[pers.length - 1].id);
      }

      if (isStudent) {
        setSelectedClassId(currentUser?.classId || '');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadSummaryData = async (classId: string) => {
    try {
      const std = await getStudents(classId);
      setStudents(std);
      const allGrades = await getGrades();
      setGrades(allGrades);
    } catch (e) {
      console.error(e);
    }
  };

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      const firstNameCompare = (a.firstName || '').localeCompare(b.firstName || '', 'vi');
      if (firstNameCompare !== 0) return firstNameCompare;
      return (a.lastName || '').localeCompare(b.lastName || '', 'vi');
    });
  }, [students]);

  const selectedPeriodName = useMemo(() => {
    if (!selectedPeriodId) return 'Tất cả học kỳ';
    return periods.find((p) => p.id === selectedPeriodId)?.name || 'Học kỳ hiện tại';
  }, [periods, selectedPeriodId]);

  const filteredConfigSubjects = useMemo(() => {
    const q = subjectSearch.trim().toLowerCase();
    return subjects
      .filter((s) => (selectedClassId ? s.classId === selectedClassId : true))
      .filter((s) => (selectedPeriodId ? s.semester === selectedPeriodId : true))
      .filter((s) => {
        if (!q) return true;
        return `${s.name} ${s.id}`.toLowerCase().includes(q);
      });
  }, [subjects, selectedClassId, selectedPeriodId, subjectSearch]);

  const beginCreateSubject = () => {
    setEditingSubjectId(null);
    setSubjectForm(DEFAULT_SUBJECT_FORM);
  };

  const beginEditSubject = (sub: Subject) => {
    setEditingSubjectId(sub.id);
    setSubjectForm({
      name: sub.name || '',
      credits: sub.credits ?? 3,
      midW: sub.midtermWeight ?? 30,
      finalW: sub.finalWeight ?? 70,
    });

    if (sub.classId) setSelectedClassId(sub.classId);
    if (sub.semester) setSelectedPeriodId(sub.semester);
  };

  const handleSaveSubjectForm = async () => {
    if (!subjectForm.name.trim()) {
      alert('Vui lòng nhập tên môn học.');
      return;
    }

    if (!selectedClassId) {
      alert('Vui lòng chọn lớp.');
      return;
    }

    if (!selectedPeriodId) {
      alert('Vui lòng chọn học kỳ.');
      return;
    }

    if (!validateWeights(subjectForm.midW, subjectForm.finalW)) {
      alert('Tổng %GK và %CK phải bằng 100.');
      return;
    }

    try {
      if (editingSubjectId) {
        const old = subjects.find((s) => s.id === editingSubjectId);
        if (!old) return;

        const updated: Subject = {
          ...old,
          name: subjectForm.name.trim(),
          classId: selectedClassId,
          semester: selectedPeriodId,
          credits: subjectForm.credits,
          midtermWeight: subjectForm.midW,
          finalWeight: subjectForm.finalW,
        };

        await updateGPASubject(updated);
      } else {
        const created: Subject = {
          id: Date.now().toString(),
          name: subjectForm.name.trim(),
          classId: selectedClassId,
          semester: selectedPeriodId,
          credits: subjectForm.credits,
          midtermWeight: subjectForm.midW,
          finalWeight: subjectForm.finalW,
        };

        await createGPASubject(created);
      }

      beginCreateSubject();
      const subs = await getGPASubjects();
      setSubjects(subs);
    } catch (e) {
      alert(`Lỗi lưu môn học: ${(e as Error).message}`);
    }
  };

  const handleDeleteSubject = async (id: string, name: string) => {
    const ok = window.confirm(`Bạn có chắc muốn xóa môn học "${name}"?`);
    if (!ok) return;

    try {
      await deleteGPASubject(id);
      setSubjects((prev) => prev.filter((s) => s.id !== id));
      if (editingSubjectId === id) {
        beginCreateSubject();
      }
    } catch (e) {
      alert(`Lỗi xóa môn học: ${(e as Error).message}`);
    }
  };

  const handleGradeChange = async (
    studentId: string,
    subjectId: string,
    field: 'midtermScore' | 'finalScore',
    value: string,
  ) => {
    const numVal = value === '' ? undefined : validateScore(value);
    const gradeId = `${studentId}_${subjectId}`;
    const currentGrade = grades.find((g) => g.id === gradeId) || { id: gradeId, studentId, subjectId };
    const newGrade = { ...currentGrade, [field]: numVal };

    setGrades((prev) => {
      const idx = prev.findIndex((g) => g.id === gradeId);
      if (idx >= 0) {
        const clone = [...prev];
        clone[idx] = newGrade;
        return clone;
      }
      return [...prev, newGrade];
    });

    try {
      await saveGrade(newGrade);
    } catch (e) {
      console.error(e);
    }
  };

  const getLetterBadgeClass = (letter: string) => {
    if (letter === 'A' || letter === 'A+') return 'bg-green-100 text-green-600';
    if (letter === 'B+' || letter === 'B') return 'bg-blue-100 text-blue-600';
    if (letter === 'C+' || letter === 'C') return 'bg-amber-100 text-amber-700';
    if (letter === 'D' || letter === 'D+') return 'bg-orange-100 text-orange-600';
    if (letter === 'F') return 'bg-red-100 text-red-600';
    return 'bg-slate-100 text-slate-500';
  };

  const renderStudentView = () => {
    let mySubjects = subjects.filter((s) => s.classId === currentUser?.classId);
    if (selectedPeriodId) mySubjects = mySubjects.filter((s) => s.semester === selectedPeriodId);

    const myGrades = grades.filter((g) => g.studentId === currentUser?.username);
    const processed = mySubjects.map((sub) => {
      const grade = myGrades.find((g) => g.subjectId === sub.id) || ({} as Partial<SubjectGrade>);
      const score10 = calculateSubjectScore(grade.midtermScore, grade.finalScore, sub);
      const converted = convertScoreToLetter(score10);
      return { subject: sub, grade, score10, converted };
    });

    const { gpa10, gpa4, totalCredits } = calculateGPA(myGrades, mySubjects);

    return (
      <div className="min-h-screen bg-slate-50 text-slate-900" style={{ fontFamily: 'Public Sans, sans-serif' }}>
        <header className="sticky top-0 z-20 flex items-center bg-white border-b border-slate-200 p-4">
          <button
            type="button"
            onClick={() => navigate('/student-home')}
            className="text-sky-500 size-10 flex items-center justify-center rounded-lg hover:bg-sky-50"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-lg font-bold flex-1 text-center">Bảng điểm GPA Chi tiết</h2>
          <div className="w-10 flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="text-sky-500 size-10 flex items-center justify-center rounded-lg hover:bg-sky-50"
            >
              <Settings size={20} />
            </button>
          </div>
        </header>

        <div className="bg-white border-b border-slate-200 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-full border-2 border-sky-200 bg-sky-50 flex items-center justify-center text-sky-500">
                <User size={28} />
              </div>
              <div>
                <p className="text-xl font-bold">{currentUser?.name || 'Sinh viên'}</p>
                <p className="text-sm text-slate-500">MSSV: {currentUser?.username || 'N/A'}</p>
              </div>
            </div>
            <div className="sm:ml-auto inline-flex items-center gap-2 bg-sky-50 text-sky-600 px-3 py-1.5 rounded-full text-sm font-semibold">
              <CalendarDays size={14} />
              {selectedPeriodName}
            </div>
          </div>
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl p-4 bg-white border border-slate-200 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">GPA Hệ 4</p>
            <p className="text-sky-500 text-3xl font-bold mt-1">{gpa4}</p>
          </div>
          <div className="rounded-xl p-4 bg-white border border-slate-200 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">GPA Hệ 10</p>
            <p className="text-sky-500 text-3xl font-bold mt-1">{gpa10}</p>
          </div>
          <div className="rounded-xl p-4 bg-white border border-slate-200 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Tín chỉ tích lũy</p>
            <p className="text-sky-500 text-3xl font-bold mt-1">{totalCredits}</p>
          </div>
        </div>

        <div className="px-4 pb-[calc(74px+env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Danh sách môn học</h3>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{processed.length} môn học</span>
          </div>

          <div className="mb-4 w-full sm:w-[280px]">
            <select
              className="w-full rounded-lg border-slate-200 bg-white text-sm"
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
            >
              <option value="">Tất cả học kỳ</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            {processed.length === 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-500">
                Chưa có môn học trong học kỳ này.
              </div>
            )}

            {processed.map((item) => {
              const letter = item.converted.char;
              const code = item.subject.id || 'N/A';
              const score10Text = item.score10 === null ? '-' : item.score10;
              const score4Text = item.score10 === null ? '-' : item.converted.gpa4;

              return (
                <div key={item.subject.id} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <div>
                      <h4 className="font-bold leading-snug">{item.subject.name}</h4>
                      <p className="text-xs text-slate-500">Mã môn: {code} • {item.subject.credits || 0} tín chỉ</p>
                    </div>
                    <div className={`text-xs font-bold px-2 py-1 rounded ${getLetterBadgeClass(letter)}`}>{letter}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">GK ({item.subject.midtermWeight ?? 40}%)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={item.grade.midtermScore ?? ''}
                        onChange={(e) => handleGradeChange(currentUser!.username, item.subject.id, 'midtermScore', e.target.value)}
                        className="w-full bg-slate-50 border-slate-200 rounded-lg text-sm focus:ring-sky-500 focus:border-sky-500"
                        placeholder="Nhập điểm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Cuối kỳ ({item.subject.finalWeight ?? 60}%)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={item.grade.finalScore ?? ''}
                        onChange={(e) => handleGradeChange(currentUser!.username, item.subject.id, 'finalScore', e.target.value)}
                        className="w-full bg-slate-50 border-slate-200 rounded-lg text-sm focus:ring-sky-500 focus:border-sky-500"
                        placeholder="Nhập điểm"
                      />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-500 italic">Tự động tính toán</span>
                    <div className="flex gap-4 items-baseline">
                      <span className="text-xs text-slate-400">Hệ 10: <b className="text-slate-700">{score10Text}</b></span>
                      <span className="text-xs text-slate-400">Hệ 4: <b className="text-sky-500">{score4Text}</b></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <StudentBottomNav active="gpa" />
      </div>
    );
  };

  const renderAdminConfigView = () => (
    <div className="max-w-6xl mx-auto px-4 py-6 lg:py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-blue-700">Quản lý môn học</h1>
          <p className="text-slate-500 mt-1">Nhập tên môn học, số tín chỉ, %GK và %CK trong hệ thống</p>
        </div>
        <button
          type="button"
          onClick={beginCreateSubject}
          className="flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-blue-200"
        >
          <Plus size={18} />
          Thêm môn học mới
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Pencil size={18} className="text-blue-700" />
              Thông tin môn học
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Lớp</label>
                <select
                  className="w-full rounded-lg border-slate-300 focus:ring-blue-600 focus:border-blue-600"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                >
                  <option value="">Chọn lớp</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5">Học kỳ</label>
                <select
                  className="w-full rounded-lg border-slate-300 focus:ring-blue-600 focus:border-blue-600"
                  value={selectedPeriodId}
                  onChange={(e) => setSelectedPeriodId(e.target.value)}
                >
                  <option value="">Chọn học kỳ</option>
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5">Tên môn học</label>
                <input
                  type="text"
                  className="w-full rounded-lg border-slate-300 focus:ring-blue-600 focus:border-blue-600"
                  placeholder="VD: Lập trình Java"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5">Số tín chỉ</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className="w-full rounded-lg border-slate-300 focus:ring-blue-600 focus:border-blue-600"
                  value={subjectForm.credits}
                  onChange={(e) => setSubjectForm((prev) => ({ ...prev, credits: Math.max(1, Number(e.target.value) || 1) }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">% GK</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="w-full rounded-lg border-slate-300 pr-8 focus:ring-blue-600 focus:border-blue-600"
                      value={subjectForm.midW}
                      onChange={(e) => {
                        const mid = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                        setSubjectForm((prev) => ({ ...prev, midW: mid, finalW: 100 - mid }));
                      }}
                    />
                    <span className="absolute right-3 top-2 text-slate-400 text-sm">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">% CK</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="w-full rounded-lg border-slate-300 pr-8 focus:ring-blue-600 focus:border-blue-600"
                      value={subjectForm.finalW}
                      onChange={(e) => {
                        const final = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                        setSubjectForm((prev) => ({ ...prev, finalW: final, midW: 100 - final }));
                      }}
                    />
                    <span className="absolute right-3 top-2 text-slate-400 text-sm">%</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleSaveSubjectForm}
                  className="flex-1 bg-blue-700 text-white py-2.5 rounded-lg font-bold hover:bg-blue-800 transition-colors"
                >
                  {editingSubjectId ? 'Cập nhật' : 'Lưu'}
                </button>
                <button
                  type="button"
                  onClick={beginCreateSubject}
                  className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-lg font-bold hover:bg-slate-200 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <h3 className="font-bold text-lg">Danh sách môn học hiện có</h3>
              <div className="relative w-full sm:w-72">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  className="pl-10 pr-4 py-1.5 w-full text-sm rounded-full border-slate-200"
                  placeholder="Tìm kiếm môn học..."
                  value={subjectSearch}
                  onChange={(e) => setSubjectSearch(e.target.value)}
                />
              </div>
            </div>

            {filteredConfigSubjects.length === 0 ? (
              <div className="p-8 text-center text-slate-500">Không có môn học phù hợp.</div>
            ) : (
              <div>
                {filteredConfigSubjects.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors gap-3">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="flex items-center justify-center rounded-xl bg-blue-100 text-blue-700 shrink-0 size-12">
                        <BookOpen size={20} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 truncate">{sub.name}</h4>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                          <p className="text-slate-500 text-xs">Mã: {sub.id}</p>
                          <p className="text-slate-500 text-xs">Tín chỉ: {sub.credits ?? 0}</p>
                          <p className="text-blue-700 text-xs font-medium bg-blue-50 px-2 py-0.5 rounded">
                            GK: {sub.midtermWeight ?? 0}% | CK: {sub.finalWeight ?? 0}%
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => beginEditSubject(sub)}
                        className="p-2 text-slate-400 hover:text-blue-700 transition-colors rounded-lg"
                        title="Sửa"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSubject(sub.id, sub.name)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg"
                        title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdminSummaryView = () => (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 min-h-[600px] flex flex-col overflow-hidden">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-3 bg-gray-50/80">
          <select
            className="border border-gray-200 p-2.5 rounded-xl text-sm font-semibold outline-none focus:ring-2 ring-blue-500"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            <option value="">-- Chọn lớp thống kê --</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            className="border border-gray-200 p-2.5 rounded-xl text-sm font-semibold outline-none focus:ring-2 ring-blue-500"
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
          >
            <option value="">-- Tính GPA tích lũy (Tất cả) --</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {selectedClassId ? (
          <div className="overflow-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold sticky top-0 z-10">
                <tr>
                  <th className="p-4 w-16 text-center">STT</th>
                  <th className="p-4">Sinh viên</th>
                  <th className="p-4 text-center">TC Đạt</th>
                  <th className="p-4 text-center">GPA (10)</th>
                  <th className="p-4 text-center">GPA (4)</th>
                  <th className="p-4 text-center">Xếp loại</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedStudents.map((std, idx) => {
                  const studentGrades = grades.filter((g) => g.studentId === std.id);
                  const filteredSubjects = selectedPeriodId
                    ? subjects.filter((s) => s.semester === selectedPeriodId)
                    : subjects;

                  const { gpa10, gpa4, totalCredits, gpa4Num } = calculateGPA(studentGrades, filteredSubjects);
                  const rank = getClassification(gpa4Num);
                  const rankColor = totalCredits > 0
                    ? `${getClassificationColor(gpa4Num)} font-bold`
                    : 'text-gray-500';

                  return (
                    <tr key={std.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-center text-gray-500">{idx + 1}</td>
                      <td className="p-4">
                        <div className="font-bold text-gray-800">{std.lastName} {std.firstName}</div>
                        <div className="text-xs text-gray-400 font-mono">{std.id}</div>
                      </td>
                      <td className="p-4 text-center font-medium">{totalCredits}</td>
                      <td className="p-4 text-center font-medium text-gray-600">{gpa10}</td>
                      <td className="p-4 text-center font-bold text-blue-700 bg-blue-50/30 rounded-lg">{gpa4}</td>
                      <td className={`p-4 text-center ${rankColor}`}>{rank}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center flex-1 text-gray-400 font-medium">
            Vui lòng chọn lớp để xem thống kê.
          </div>
        )}
      </div>
    </div>
  );

  if (isStudent) {
    return renderStudentView();
  }

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: 'Public Sans, sans-serif' }}>
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-2">
        <div className="inline-flex bg-slate-100 p-1 rounded-xl shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'config' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <BookOpen size={16} /> Cấu hình môn học
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'summary' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <BarChart3 size={16} /> Thống kê GPA
          </button>
        </div>
      </div>

      {activeTab === 'config' ? renderAdminConfigView() : renderAdminSummaryView()}
    </div>
  );
};

export default GPAManager;

