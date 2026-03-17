
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getStudents, getDRLScores, saveDRLScore, getCurrentUser, uploadProofImage, getGradingPeriods, deleteProofImage, getProofImages } from '../services/storage';
import { Student, DRLScore, GradingPeriod } from '../types';
import { ArrowLeft, CheckCircle, Upload, Trash2, ExternalLink, Loader2, Eye, X, AlertTriangle, Cloud, CloudOff, RefreshCw, Lock, Undo2, Calendar, Download, Check, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import jsPDF from 'jspdf';
import StudentBottomNav from '../components/StudentBottomNav';

const CRITERIA = [
    { id: 'I', content: 'I. Đánh giá về ý thức tham gia học tập', max: 20 },
    { id: 'I.1', content: '1. Kết quả học tập (TB: 2đ, Khá: 3đ, Giỏi: 4đ, Xuất sắc: 5đ)', max: 5, parent: 'I', category: 'Học tập', activity: 'Kết quả học tập' },
    { id: 'I.2', content: '2. Có giấy chứng nhận tham gia lớp kỹ năng học tập', max: 3, parent: 'I', category: 'Học tập', activity: 'Lớp kỹ năng học tập' },
    { id: 'I.3', content: '3. Tham gia Hội thảo / Tọa đàm (3đ/lần)', max: 10, parent: 'I', category: 'Học tập', activity: 'Hội thảo / Tọa đàm' },
    { id: 'I.4', content: '4. Thi học thuật cấp Khoa/Trường (Tham gia: 3đ, Giải: 4-7đ)', max: 7, parent: 'I', category: 'Học tập', activity: 'Thi học thuật cấp Khoa/Trường' },
    { id: 'I.5', content: '5. Thi học thuật cấp Ngoài trường (Tham gia: 4đ, Giải: 5-8đ)', max: 8, parent: 'I', category: 'Học tập', activity: 'Thi học thuật ngoài trường' },
    { id: 'I.6', content: '6. Báo cáo khoa học cấp Khoa (Đạt: 3-8đ)', max: 8, parent: 'I', category: 'Học tập', activity: 'Báo cáo khoa học' },
    { id: 'I.7', content: '7. NCKH cấp Trường (Đạt: 5-10đ)', max: 10, parent: 'I', category: 'Học tập', activity: 'Nghiên cứu khoa học' },
    { id: 'I.8', content: '8. Viết bài báo khoa học (5-8đ)', max: 8, parent: 'I', category: 'Học tập', activity: 'Bài báo khoa học' },
    { id: 'I.9', content: '9. Thi khởi nghiệp cấp Trường (Tham gia: 3đ, Giải: 4-7đ)', max: 7, parent: 'I', category: 'Học tập', activity: 'Thi khởi nghiệp' },
    { id: 'I.10', content: '10. Thi khởi nghiệp Ngoài trường (Tham gia: 4đ, Giải: 5-8đ)', max: 8, parent: 'I', category: 'Học tập', activity: 'Khởi nghiệp ngoài trường' },
    { id: 'I.11', content: '11. Thành viên CLB học thuật (2đ/HK)', max: 2, parent: 'I', category: 'Học tập', activity: 'CLB học thuật' },
    { id: 'I.12', content: '12. Các hoạt động học thuật khác', max: 5, parent: 'I', category: 'Học tập', activity: 'Hoạt động khác' },
    { id: 'II', content: 'II. Đánh giá về ý thức chấp hành nội quy, quy chế', max: 25 },
    { id: 'II.1', content: '1. Ý thức, thái độ trong học tập (Đi học đầy đủ, đúng giờ)', max: 5, parent: 'II', category: 'Nội quy', activity: 'Ý thức học tập' },
    { id: 'II.2', content: '2. Chấp hành tốt nội quy, quy chế Nhà trường', max: 5, parent: 'II', category: 'Nội quy', activity: 'Chấp hành nội quy' },
    { id: 'II.3', content: '3. Thực hiện tốt quy chế thi, kiểm tra', max: 5, parent: 'II', category: 'Nội quy', activity: 'Quy chế thi kiểm tra' },
    { id: 'II.4', content: '4. Chấp hành quy định thư viện', max: 5, parent: 'II', category: 'Nội quy', activity: 'Quy định thư viện' },
    { id: 'II.5', content: '5. Bảo vệ tài sản, phòng học', max: 5, parent: 'II', category: 'Nội quy', activity: 'Bảo vệ tài sản' },
    { id: 'II.6', content: '6. Thực hiện đăng ký ngoại trú', max: 5, parent: 'II', category: 'Nội quy', activity: 'Đăng ký ngoại trú' },
    { id: 'II.7', content: '7. Mặc đồng phục đúng quy định', max: 5, parent: 'II', category: 'Nội quy', activity: 'Mặc đồng phục' },
    { id: 'II.8', content: '8. Tham gia sinh hoạt lớp với CVHT', max: 5, parent: 'II', category: 'Nội quy', activity: 'Sinh hoạt lớp' },
    { id: 'III', content: 'III. Đánh giá về ý thức tham gia hoạt động CT-XH, VH-VN-TT', max: 20 },
    { id: 'III.1', content: '1. Hoạt động bắt buộc do Khoa/Trường tổ chức (3đ/lần)', max: 10, parent: 'III', category: 'Chính trị', activity: 'Hoạt động bắt buộc' },
    { id: 'III.2', content: '2. Đại hội Chi đoàn/Chi hội, sinh hoạt Chi đoàn (3đ/lần)', max: 10, parent: 'III', category: 'Chính trị', activity: 'Chi đoàn/Chi hội' },
    { id: 'III.3', content: '3. Báo cáo chuyên đề chính trị trực tiếp/trực tuyến', max: 10, parent: 'III', category: 'Chính trị', activity: 'Báo cáo chính trị' },
    { id: 'III.4', content: '4. Hoạt động ngoại khóa Khoa/Trường/CLB (1-7đ)', max: 7, parent: 'III', category: 'Hoạt động', activity: 'Ngoại khóa Khoa/Trường' },
    { id: 'III.5', content: '5. Hoạt động ngoại khóa cấp Thành phố trở lên (1-8đ)', max: 8, parent: 'III', category: 'Hoạt động', activity: 'Ngoại khóa cấp TP' },
    { id: 'III.6', content: '6. Được kết nạp Đoàn', max: 5, parent: 'III', category: 'Chính trị', activity: 'Kết nạp Đoàn' },
    { id: 'III.7', content: '7. Được kết nạp Đảng', max: 8, parent: 'III', category: 'Chính trị', activity: 'Kết nạp Đảng' },
    { id: 'III.8', content: '8. Hoạt động điều động của Đoàn/Hội (2-4đ)', max: 10, parent: 'III', category: 'Hoạt động', activity: 'Hoạt động điều động' },
    { id: 'III.9', content: '9. Thành viên các CLB/Đội/Nhóm (2đ/HK)', max: 2, parent: 'III', category: 'Hoạt động', activity: 'CLB/Đội/Nhóm' },
    { id: 'III.10', content: '10. Học tập các bài lý luận chính trị (4đ/lần)', max: 4, parent: 'III', category: 'Chính trị', activity: 'Lý luận chính trị' },
    { id: 'III.11', content: '11. Hoạt động đền ơn đáp nghĩa, thắp nến tri ân (3đ/lần)', max: 10, parent: 'III', category: 'Hoạt động', activity: 'Đền ơn tri ân' },
    { id: 'III.12', content: '12. Lao động tình nguyện tại Trường (3đ/lần)', max: 10, parent: 'III', category: 'Hoạt động', activity: 'Lao động tình nguyện' },
    { id: 'III.13', content: '13. Khen thưởng trong phong trào (5-7đ)', max: 7, parent: 'III', category: 'Thành tích', activity: 'Khen thưởng phong trào' },
    { id: 'III.14', content: '14. Tập thể được khen thưởng (1đ/lần)', max: 2, parent: 'III', category: 'Thành tích', activity: 'Khen thưởng tập thể' },
    { id: 'III.15', content: '15. Các hoạt động khác (1-3đ)', max: 5, parent: 'III', category: 'Hoạt động', activity: 'Hoạt động khác' },
    { id: 'IV', content: 'IV. Đánh giá về ý thức công dân trong quan hệ cộng đồng', max: 25 },
    { id: 'IV.1', content: '1. Chấp hành luật pháp, tuyên truyền pháp luật (10đ)', max: 10, parent: 'IV', category: 'Cộng đồng', activity: 'Chấp hành pháp luật' },
    { id: 'IV.2', content: '2. Tương thân tương ái, giúp đỡ người khó khăn (5đ)', max: 5, parent: 'IV', category: 'Cộng đồng', activity: 'Giúp đỡ cộng đồng' },
    { id: 'IV.3', content: '3. Được biểu dương người tốt việc tốt (5đ)', max: 5, parent: 'IV', category: 'Cộng đồng', activity: 'Biểu dương' },
    { id: 'IV.4', content: '4. Giao lưu các CLB/Đội/Nhóm (3-5đ)', max: 5, parent: 'IV', category: 'Cộng đồng', activity: 'Giao lưu CLB' },
    { id: 'IV.5', content: '5. Chương trình Tư vấn tuyển sinh (5đ)', max: 5, parent: 'IV', category: 'Cộng đồng', activity: 'Tư vấn tuyển sinh' },
    { id: 'IV.6', content: '6. Công tác nhập học (5đ)', max: 5, parent: 'IV', category: 'Cộng đồng', activity: 'Nhập học' },
    { id: 'IV.7', content: '7. Công tác khám sức khỏe đầu khóa (5đ)', max: 5, parent: 'IV', category: 'Cộng đồng', activity: 'Khám sức khỏe' },
    { id: 'IV.8', content: '8. Công tác Ngày hội việc làm (5đ)', max: 5, parent: 'IV', category: 'Cộng đồng', activity: 'Ngày hội việc làm' },
    { id: 'IV.9', content: '9. Công tác Lễ tốt nghiệp (5đ)', max: 5, parent: 'IV', category: 'Cộng đồng', activity: 'Lễ tốt nghiệp' },
    { id: 'IV.10', content: '10. Công tác kiểm tra hồ sơ (5đ)', max: 5, parent: 'IV', category: 'Cộng đồng', activity: 'Kiểm tra hồ sơ' },
    { id: 'IV.11', content: '11. Phiên giao dịch việc làm (1-3đ)', max: 5, parent: 'IV', category: 'Cộng đồng', activity: 'Giao dịch việc làm' },
    { id: 'IV.12', content: '12. Hiến máu tình nguyện (10đ/lần)', max: 10, parent: 'IV', category: 'Cộng đồng', activity: 'Hiến máu' },
    { id: 'IV.13', content: '13. Xuân tình nguyện (4-5đ)', max: 5, parent: 'IV', category: 'Cộng đồng', activity: 'Xuân tình nguyện' },
    { id: 'IV.14', content: '14. Mùa hè xanh (5-7đ)', max: 7, parent: 'IV', category: 'Cộng đồng', activity: 'Mùa hè xanh' },
    { id: 'IV.15', content: '15. Ngày Chủ nhật xanh (3-5đ)', max: 5, parent: 'IV', category: 'Cộng đồng', activity: 'Chủ nhật xanh' },
    { id: 'IV.16', content: '16. Thứ Bảy tình nguyện (3-5đ)', max: 5, parent: 'IV', category: 'Cộng đồng', activity: 'Thứ Bảy tình nguyện' },
    { id: 'IV.17', content: '17. Chào đón tân sinh viên (3-5đ)', max: 5, parent: 'IV', category: 'Cộng đồng', activity: 'Chào đón tân sinh viên' },
    { id: 'IV.18', content: '18. Hoạt động PTBV, Trách nhiệm xã hội (1-3đ)', max: 5, parent: 'IV', category: 'Cộng đồng', activity: 'PTBV/Trách nhiệm xã hội' },
    { id: 'V', content: 'V. Tham gia công tác cán bộ lớp, thành tích đặc biệt', max: 10 },
    { id: 'V.1', content: '1. Tham gia tích cực phong trào Lớp/Đoàn/Hội (3đ)', max: 3, parent: 'V', category: 'Cán bộ', activity: 'Phong trào' },
    { id: 'V.2', content: '2. Cán bộ Lớp/Đoàn/Hội hoàn thành nhiệm vụ (3-5đ)', max: 5, parent: 'V', category: 'Cán bộ', activity: 'Cán bộ hoàn thành NV' },
    { id: 'V.3', content: '3. Đạt giải về học tập, NCKH (3-6đ)', max: 6, parent: 'V', category: 'Thành tích', activity: 'Giải học tập/NCKH' },
    { id: 'V.4', content: '4. Bằng khen UBND Tỉnh/Thành phố (5đ)', max: 5, parent: 'V', category: 'Thành tích', activity: 'Bằng khen' },
    { id: 'V.5', content: '5. Sinh viên 5 tốt cấp Trường/Đoàn viên tiêu biểu (6đ)', max: 6, parent: 'V', category: 'Thành tích', activity: '5 tốt cấp Trường' },
    { id: 'V.6', content: '6. Sinh viên 5 tốt cấp Thành/Trung ương (10đ)', max: 10, parent: 'V', category: 'Thành tích', activity: '5 tốt cấp Thành' },
    { id: 'V.7', content: '7. Đạt danh hiệu Đoàn viên ưu tú (6đ)', max: 6, parent: 'V', category: 'Thành tích', activity: 'Đoàn viên ưu tú' },
    { id: 'V.8', content: '8. Giấy khen tập thể của Đoàn (2đ)', max: 2, parent: 'V', category: 'Thành tích', activity: 'Khen tập thể' },
];

const MAX_PROOF_IMAGES = 10;

type ProofMap = Record<string, string[]>;

const normalizeProofs = (raw: any): ProofMap => {
    const normalized: ProofMap = {};
    if (!raw || typeof raw !== 'object') return normalized;

    for (const [criteriaId, value] of Object.entries(raw)) {
        if (Array.isArray(value)) {
            const urls = value.filter((url): url is string => typeof url === 'string' && !!url);
            if (urls.length > 0) normalized[criteriaId] = urls;
        } else if (typeof value === 'string' && value) {
            normalized[criteriaId] = [value];
        }
    }

    return normalized;
};

const getProofCountByCriteria = (proofMap: ProofMap, criteriaId: string): number => (proofMap[criteriaId] || []).length;

const mergeProofMaps = (baseMap: ProofMap, extraMap: ProofMap): ProofMap => {
    const merged: ProofMap = { ...baseMap };
    for (const [criteriaId, urls] of Object.entries(extraMap)) {
        const current = merged[criteriaId] || [];
        merged[criteriaId] = Array.from(new Set([...current, ...urls]));
    }
    return merged;
};

const DRLForm: React.FC = () => {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const currentUser = getCurrentUser();

    const [student, setStudent] = useState<Student | null>(null);
    const [scoreData, setScoreData] = useState<DRLScore | null>(null);
    const [currentPeriodId, setCurrentPeriodId] = useState<string>('');
    const [periods, setPeriods] = useState<GradingPeriod[]>([]);

    const [scores, setScores] = useState<Record<string, Record<string, number>>>({ self: {}, class: {} });
    const [proofs, setProofs] = useState<ProofMap>({});

    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const targetCriteriaRef = useRef<string>("");

    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [previewIndex, setPreviewIndex] = useState(0);
    const [imageError, setImageError] = useState(false);
    const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const isFirstRun = useRef(true);
    const [isLocked, setIsLocked] = useState(false);
    const [lockReason, setLockReason] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [periodWarning, setPeriodWarning] = useState('');

    const withTimeout = useCallback(async <T,>(promise: Promise<T>, ms: number, message: string): Promise<T> => {
        let timer: ReturnType<typeof setTimeout> | null = null;
        try {
            const timeoutPromise = new Promise<T>((_, reject) => {
                timer = setTimeout(() => reject(new Error(message)), ms);
            });
            return await Promise.race([promise, timeoutPromise]);
        } finally {
            if (timer) clearTimeout(timer);
        }
    }, []);

    // Helper: Check visibility of class score column
    const getVisibility = useCallback(() => {
        const role = currentUser?.role || '';
        const status = scoreData?.status || '';
        return ['admin', 'monitor'].includes(role) || status === 'approved';
    }, [currentUser?.role, scoreData?.status]);

    // Memoized visibility
    const visibility = useMemo(() => ({ class: getVisibility() }), [getVisibility]);

    // Initialize: load periods and check lock
    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            setLoadError('');
            setPeriodWarning('');
            try {
                const params = new URLSearchParams(location.search);
                let pid = params.get('period');
                let periodsList: GradingPeriod[] = [];

                try {
                    periodsList = await withTimeout(
                        getGradingPeriods(),
                        12000,
                        'Tải đợt chấm quá lâu. Vui lòng kiểm tra mạng hoặc thử lại.'
                    );
                } catch {
                    periodsList = [{ id: 'HK1_2024', name: 'Học kỳ mặc định' }];
                    setPeriodWarning('Không tải được đợt chấm từ máy chủ, đang dùng học kỳ mặc định.');
                }

                setPeriods(periodsList);

                if (!pid && periodsList.length > 0) {
                    pid = periodsList[periodsList.length - 1].id;
                } else if (!pid) {
                    pid = 'HK1_2024';
                }

                const targetPeriod = periodsList.find(p => p.id === pid);
                if (targetPeriod && currentUser?.role === 'student') {
                    const now = new Date();
                    const start = targetPeriod.startDate ? new Date(targetPeriod.startDate) : null;
                    const end = targetPeriod.endDate ? new Date(targetPeriod.endDate) : null;
                    if (end) end.setHours(23, 59, 59, 999);

                    if (start && now < start) {
                        setIsLocked(true);
                        setLockReason(`Đợt chấm chưa mở. Bắt đầu từ: ${start.toLocaleDateString('vi-VN')}`);
                    } else if (end && now > end) {
                        setIsLocked(true);
                        setLockReason(`Đợt chấm đã kết thúc vào: ${end.toLocaleDateString('vi-VN')}`);
                    } else {
                        setIsLocked(false);
                        setLockReason('');
                    }
                }

                setCurrentPeriodId(pid);

                const fallbackStudentId = currentUser?.role === 'student' ? currentUser.username : '';
                const targetStudentId = studentId || fallbackStudentId;

                if (!targetStudentId) {
                    setLoadError('Không xác định được MSSV để mở phiếu chấm. Vui lòng đăng nhập lại.');
                    return;
                }

                const loaded = await loadData(targetStudentId, pid);
                if (!loaded) {
                    setLoadError('Không tìm thấy thông tin sinh viên. Vui lòng kiểm tra tài khoản hoặc liên hệ quản trị viên.');
                }
            } catch (e) {
                setLoadError((e as Error).message || 'Không thể tải dữ liệu phiếu chấm.');
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, [studentId, location.search, withTimeout]);

    useEffect(() => setImageError(false), [previewImages, previewIndex]);

    // Auto-save when scores change
    useEffect(() => {
        if (isFirstRun.current || !student || !currentUser) {
            isFirstRun.current = false;
            return;
        }

        // Admin luôn được auto-save, sinh viên chỉ auto-save khi không bị locked
        if (isLocked && currentUser.role === 'student') {
            return;
        }

        setAutoSaveStatus('saving');
        const timer = setTimeout(async () => {
            try {
                await saveToDatabase(scoreData?.status || 'draft');
                setAutoSaveStatus('saved');
            } catch (e) {
                setAutoSaveStatus('error');
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, [scores, proofs, isLocked, student, currentUser, scoreData?.status]);

    const loadData = async (id: string, periodId: string): Promise<boolean> => {
        const [students, allScores] = await Promise.all([
            withTimeout(getStudents(), 12000, 'Tải danh sách sinh viên quá lâu. Vui lòng thử lại.'),
            withTimeout(getDRLScores(), 12000, 'Tải điểm rèn luyện quá lâu. Vui lòng thử lại.')
        ]);

        const s = students.find(st => st.id === id);
        if (!s) {
            setStudent(null);
            return false;
        }
        setStudent(s);

        const existing = allScores.find(sc => sc.studentId === id && sc.semester === periodId);
        const knownProofCategories = existing?.details?.proofs
            ? Object.keys(normalizeProofs(existing.details.proofs))
            : [];
        const proofMapFromServer = await withTimeout(
            getProofImages(id, knownProofCategories),
            12000,
            'Tải minh chứng quá lâu. Vui lòng thử lại.'
        ).catch(() => ({} as Record<string, string[]>));
        const serverProofs = normalizeProofs(proofMapFromServer);

        if (existing) {
            const details = existing.details || {};
            const detailsProofs = normalizeProofs((details as any).proofs);
            const mergedProofs = mergeProofMaps(detailsProofs, serverProofs);

            setScoreData({
                ...existing,
                details: {
                    ...details,
                    proofs: mergedProofs
                }
            } as DRLScore);

            setScores({
                self: (details as any).self || {},
                class: (details as any).class || {}
            });
            setProofs(mergedProofs);
        } else {
            setScores({ self: {}, class: {} });
            setProofs(serverProofs);
            setScoreData(null);
        }
        setTimeout(() => { isFirstRun.current = false; }, 500);
        return true;
    };

    const calculateTotal = (scoresObj: Record<string, number>) => {
        let finalTotal = 0;
        CRITERIA.filter(c => !c.parent).forEach(group => {
            let groupSum = 0;
            CRITERIA.filter(c => c.parent === group.id).forEach(child => {
                groupSum += (scoresObj[child.id] || 0);
            });
            finalTotal += Math.min(groupSum, group.max);
        });
        return Math.min(100, Math.max(0, finalTotal));
    };

    const getGroupTotal = (scoresObj: Record<string, number>, groupId: string) => {
        let groupSum = 0;
        const children = CRITERIA.filter(c => c.parent === groupId);
        children.forEach(child => {
            groupSum += (scoresObj[child.id] || 0);
        });
        return groupSum;
    };

    const criteriaByGroup = useMemo(() => {
        return CRITERIA.filter(c => !c.parent).map(group => ({
            group,
            children: CRITERIA.filter(c => c.parent === group.id)
        }));
    }, []);

    const getRankLabel = (score: number) => {
        if (score >= 90) return 'Xuất sắc';
        if (score >= 80) return 'Tốt';
        if (score >= 65) return 'Khá';
        if (score >= 50) return 'Trung bình';
        return 'Yếu';
    };

    const saveToDatabase = async (status: string, proofsOverride?: ProofMap) => {
        if (!student || !currentUser || !currentPeriodId) return;
        
        // Admin không bị ảnh hưởng bởi isLocked
        // Sinh viên chỉ bị chặn nếu isLocked và không phải đang hủy nộp
        if (isLocked && currentUser.role === 'student' && status !== 'draft') return;

        const totals = {
            self: calculateTotal(scores.self),
            class: calculateTotal(scores.class)
        };

        let bestFinalScore = totals.self;
        if (totals.class > 0 || Object.keys(scores.class).length > 0) bestFinalScore = totals.class;

        // Ghi theo state hien tai de ton trong thao tac xoa minh chung.
        const persistedProofs = normalizeProofs(proofsOverride || proofs);

        const payload: DRLScore = {
            id: scoreData?.id || `${student.id}_${currentPeriodId}`,
            studentId: student.id,
            semester: currentPeriodId,
            selfScore: totals.self,
            classScore: totals.class,
            finalScore: bestFinalScore,
            details: { ...scores, proofs: persistedProofs },
            status: status as any
        };

        await saveDRLScore(payload);
        setScoreData(payload);
        return payload;
    };

    const handleSave = useCallback(async (isSubmit: boolean = false) => {
        if (isLocked && currentUser?.role === 'student') return;
        
        let newStatus = scoreData?.status || 'draft';
        
        if (isSubmit) {
            // Chỉ sinh viên mới đổi status sang 'submitted' khi nộp
            if (currentUser?.role === 'student') {
                newStatus = 'submitted';
                // Lưu một lần cuối trước khi nộp (vì có thể có thay đổi chưa lưu)
                await saveToDatabase(newStatus);
                alert("Đã nộp phiếu chấm thành công! Toàn bộ điểm và minh chứng đã được lưu.");
                navigate('/', { state: { selectedClassId: student?.classId, selectedPeriodId: currentPeriodId } });
                return;
            }
            // Admin/Monitor không đổi status khi "Lưu & Gửi", chỉ lưu điểm
            // Status chỉ thay đổi khi họ nhấn "Duyệt All"
        }

        await saveToDatabase(newStatus);
        setAutoSaveStatus('saved');
        if (isSubmit && currentUser?.role !== 'student') {
            alert("Đã lưu điểm chấm thành công!");
        }
    }, [isLocked, scoreData?.status, currentUser?.role, student?.classId, currentPeriodId, navigate, saveToDatabase]);

    const handleUnsubmit = useCallback(async () => {
        if (!currentUser || currentUser.role !== 'student') {
            alert("Chỉ sinh viên mới có thể hủy nộp.");
            return;
        }
        if (!scoreData || scoreData.status !== 'submitted') {
            alert("Chỉ có thể hủy nộp khi đã nộp phiếu.");
            return;
        }
        if (!window.confirm("Bạn có chắc muốn HỦY NỘP để chỉnh sửa lại?")) return;
        try {
            // Cập nhật state local NGAY LẬP TỨC để UI phản ánh
            const newScoreData = { ...scoreData, status: 'draft' as any };
            setScoreData(newScoreData);
            
            // Mở khóa ngay lập tức
            setIsLocked(false);
            setLockReason('');
            
            // Lưu vào database
            await saveToDatabase('draft');
            
            // Force re-render
            setScores(prev => ({ ...prev }));
            
            alert("Đã hủy nộp. Bạn có thể chỉnh sửa ngay bây giờ.");
        } catch (e) {
            alert("Lỗi: " + (e as Error).message);
            // Nếu lỗi, rollback
            setScoreData(prev => prev ? { ...prev, status: 'submitted' } : null);
        }
    }, [currentUser, scoreData, saveToDatabase]);

    const canEdit = (column: 'self' | 'class') => {
        if (!currentUser) return false;
        const role = currentUser.role;
        
        // Admin luôn có thể chỉnh sửa mọi cột, không bị ảnh hưởng bởi isLocked
        if (role === 'admin') return true;
        
        // Các role khác bị ảnh hưởng bởi isLocked
        if (isLocked) return false;
        
        if (role === 'student') return column === 'self' && (!scoreData || scoreData.status === 'draft');
        if (role === 'monitor' && column === 'class') return !scoreData || ['submitted'].includes(scoreData.status);
        return false;
    };

    const handleUploadClick = (criteriaId: string) => {
        if (isLocked) { alert("Đã hết hạn nộp minh chứng."); return; }

        const proofCount = getProofCountByCriteria(proofs, criteriaId);
        if (proofCount >= MAX_PROOF_IMAGES) {
            alert(`Mỗi mục chỉ được tải tối đa ${MAX_PROOF_IMAGES} ảnh minh chứng.`);
            return;
        }

        targetCriteriaRef.current = criteriaId;
        fileInputRef.current?.click();
    };

    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const criteriaId = targetCriteriaRef.current;
        if (files.length === 0 || !criteriaId || !student) return;

        const proofCountInCriteria = getProofCountByCriteria(proofs, criteriaId);
        const remaining = MAX_PROOF_IMAGES - proofCountInCriteria;

        if (remaining <= 0) {
            alert(`Mục ${criteriaId} đã đủ ${MAX_PROOF_IMAGES} ảnh minh chứng.`);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        const selectedFiles = files.slice(0, remaining);
        if (files.length > remaining) {
            alert(`Bạn chỉ có thể tải thêm ${remaining} ảnh ở mục ${criteriaId} (tối đa ${MAX_PROOF_IMAGES} ảnh/mục).`);
        }

        setUploadingId(criteriaId);
        try {
            const newUrls: string[] = [];

            for (const file of selectedFiles) {
                const ext = file.name.split('.').pop()?.toLowerCase() || '';
                const unsupported = file.type === 'image/heic' || file.type === 'image/heif' || ext === 'heic' || ext === 'heif';
                if (unsupported) {
                    alert(`Bỏ qua ${file.name}: định dạng HEIC/HEIF chưa hỗ trợ xem trực tiếp. Vui lòng đổi sang JPG/PNG/WebP.`);
                    continue;
                }

                if (file.size > 5 * 1024 * 1024) {
                    alert(`Bỏ qua ${file.name}: ảnh phải nhỏ hơn 5MB.`);
                    continue;
                }

                const url = await uploadProofImage(file, student.id, criteriaId);
                newUrls.push(url);
            }

            if (newUrls.length > 0) {
                const mergedProofs: ProofMap = {
                    ...proofs,
                    [criteriaId]: [...(proofs[criteriaId] || []), ...newUrls]
                };

                setProofs(mergedProofs);

                // Luu ngay de khong mat minh chung neu nguoi dung reload som.
                await saveToDatabase(scoreData?.status || 'draft', mergedProofs);
                setAutoSaveStatus('saved');
            }
        } catch (error) {
            setAutoSaveStatus('error');
            alert("Lỗi upload ảnh: " + (error as Error).message);
        } finally {
            setUploadingId(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }, [student, proofs, scoreData?.status]);

    const handleRemoveProof = useCallback(async (criteriaId: string) => {
        if (isLocked || !window.confirm("Bạn muốn xóa minh chứng này?")) return;
        const prevProofs = { ...proofs };
        const newProofs = { ...proofs };
        delete newProofs[criteriaId];

        setProofs(newProofs);

        try {
            if (student) await deleteProofImage(student.id, criteriaId);
            await saveToDatabase(scoreData?.status || 'draft', newProofs);
            setAutoSaveStatus('saved');
            alert('Đã xóa minh chứng của mục này.');
        } catch (e) {
            setProofs(prevProofs);
            setAutoSaveStatus('error');
            alert("Xóa minh chứng thất bại: " + ((e as Error).message || 'Lỗi không xác định'));
            console.error(e);
        }
    }, [isLocked, student, proofs, scoreData?.status]);

    const handleInputChange = useCallback((c: any, valueStr: string, type: 'self' | 'class') => {
        let val = valueStr === '' ? 0 : Math.min(Math.max(Number(valueStr), 0), c.max);
        if (valueStr !== '' && Number(valueStr) > c.max) alert(`Điểm không hợp lệ! Mục này tối đa là ${c.max} điểm.`);
        setScores(prev => ({ ...prev, [type]: { ...prev[type], [c.id]: val } }));
    }, []);

    const openProofGallery = useCallback((urls: string[], startIndex: number = 0) => {
        if (!urls.length) return;
        setPreviewImages(urls);
        setPreviewIndex(Math.min(Math.max(startIndex, 0), urls.length - 1));
    }, []);

    // Xử lý nút Duyệt/Từ chối cho admin với logic toggle
    const handleApproveOrReject = useCallback((c: any, action: 'approve' | 'reject') => {
        const currentClassScore = scores.class[c.id] || 0;
        const selfScore = scores.self[c.id] || 0;
        
        if (action === 'approve') {
            // Nếu đã duyệt rồi (= điểm SV), toggle về 0
            // Nếu chưa duyệt, set = điểm SV
            const newVal = currentClassScore === selfScore && selfScore > 0 ? 0 : selfScore;
            setScores(prev => ({ ...prev, class: { ...prev.class, [c.id]: newVal } }));
        } else {
            // Nếu đã từ chối rồi (= 0), toggle về điểm SV
            // Nếu chưa từ chối, set = 0
            const newVal = currentClassScore === 0 ? selfScore : 0;
            setScores(prev => ({ ...prev, class: { ...prev.class, [c.id]: newVal } }));
        }
    }, [scores]);

    const handleApproveClass = useCallback(async () => {
        if (!window.confirm("Bạn có chắc muốn duyệt điểm cuối cùng?")) return;
        const newScores = { ...scores.class };
        CRITERIA.filter(c => c.parent).forEach(c => {
            if (newScores[c.id] === undefined) newScores[c.id] = scores.self[c.id] || 0;
        });
        setScores(prev => ({ ...prev, class: newScores }));
        await saveToDatabase('approved');
        alert("Đã duyệt điểm thành công!");
    }, [scores]);

    const handleExportPDF = useCallback(async () => {
        if (!student) return;
        setIsExporting(true);
        try {
            const doc = new jsPDF();
            const fontUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf';
            const fontResponse = await fetch(fontUrl);
            const fontBuffer = await fontResponse.arrayBuffer();
            let binary = '';
            const bytes = new Uint8Array(fontBuffer);
            for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
            const base64Font = btoa(binary);

            doc.addFileToVFS('Roboto-Regular.ttf', base64Font);
            doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
            doc.setFont('Roboto');

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            let yPos = 20;

            doc.setFontSize(14);
            doc.text('PHIẾU ĐÁNH GIÁ ĐIỂM RÈN LUYỆN', pageWidth / 2, yPos, { align: 'center' });
            yPos += 10;

            doc.setFontSize(11);
            doc.text(`Họ tên: ${student.lastName} ${student.firstName}`, 15, yPos);
            doc.text(`MSSV: ${student.id}`, 140, yPos);
            yPos += 7;
            doc.text(`Đợt: ${currentPeriodId}`, 15, yPos);
            doc.text(`Trạng thái: ${scoreData?.status || 'Nháp'}`, 140, yPos);
            yPos += 10;

            const cols = [{ header: 'Nội dung', w: 120 }, { header: 'Max', w: 20 }, { header: 'Tự chấm', w: 25 }, { header: 'Lớp', w: 25 }];
            let startX = 15;

            doc.setFillColor(230, 230, 230);
            doc.setFontSize(10);
            let currentX = startX;
            doc.rect(startX, yPos, 190, 8, 'F');
            cols.forEach(c => { doc.text(c.header, currentX + 2, yPos + 6); currentX += c.w; });
            yPos += 8;

            CRITERIA.forEach(c => {
                if (yPos > pageHeight - 20) { doc.addPage(); yPos = 20; }
                const isGroup = !c.parent;
                const rowHeight = isGroup ? 8 : 12;

                if (isGroup) {
                    doc.setFillColor(245, 245, 255);
                    doc.rect(startX, yPos, 190, rowHeight, 'F');
                    doc.text(c.content, startX + 2, yPos + 6);
                    doc.text(String(c.max), startX + 120 + 2, yPos + 6);

                    let x = startX + 140;
                    doc.text(String(getGroupTotal(scores.self, c.id)), x + 5, yPos + 6);
                    x += 25;
                    doc.text(String(visibility.class ? getGroupTotal(scores.class, c.id) : 0), x + 5, yPos + 6);
                    yPos += rowHeight;
                } else {
                    const splitText = doc.splitTextToSize(c.content, 115);
                    const dynamicHeight = Math.max(8, splitText.length * 5 + 4);
                    if (yPos + dynamicHeight > pageHeight - 10) { doc.addPage(); yPos = 20; }

                    doc.text(splitText, startX + 2, yPos + 5);
                    doc.text(String(c.max), startX + 120 + 2, yPos + 5);

                    let x = startX + 140;
                    doc.text(String(scores.self[c.id] || 0), x + 5, yPos + 5);
                    x += 25;
                    doc.text(String(visibility.class ? (scores.class[c.id] || 0) : 0), x + 5, yPos + 5);

                    doc.setDrawColor(220, 220, 220);
                    doc.line(startX, yPos + dynamicHeight, startX + 190, yPos + dynamicHeight);
                    yPos += dynamicHeight;
                }
            });

            if (yPos > pageHeight - 30) { doc.addPage(); yPos = 20; }
            yPos += 5;
            doc.setFillColor(255, 240, 200);
            doc.rect(startX, yPos, 190, 10, 'F');
            doc.setFontSize(12);
            doc.text("TỔNG ĐIỂM", startX + 80, yPos + 7);
            doc.text("100", startX + 120 + 2, yPos + 7);

            let x = startX + 140;
            doc.text(String(calculateTotal(scores.self)), x + 5, yPos + 7);
            x += 25;
            doc.text(String(visibility.class ? calculateTotal(scores.class) : 0), x + 5, yPos + 7);

            doc.save(`DRL_${student.id}_${currentPeriodId}.pdf`);
        } catch (e) {
            alert("Lỗi xuất PDF: " + (e as Error).message);
        } finally {
            setIsExporting(false);
        }
    }, [student, scoreData?.status, currentPeriodId, scores, visibility]);

    const renderInput = useCallback((c: any, type: 'self' | 'class') => {
        const editable = canEdit(type);
        let isVisible = type === 'self' || visibility[type as keyof typeof visibility];
        const val = isVisible ? (scores[type]?.[c.id] !== undefined ? scores[type]?.[c.id] : 0) : 0;

        return (
            <input type="number" min="0" max={c.max} value={val === 0 ? "0" : val.toString()}
                onChange={(e) => handleInputChange(c, e.target.value, type)} 
                disabled={!editable || !isVisible}
                onFocus={(e) => e.target.select()}
                className={`w-full text-center border rounded px-0 py-1 h-7 text-xs ${!editable || !isVisible ? 'bg-gray-100 border-transparent text-gray-500 cursor-not-allowed' : 'bg-white border-blue-300 focus:ring-1 focus:ring-blue-500'}`}
            />
        );
    }, [canEdit, visibility, scores, handleInputChange]);

    const renderProofCell = useCallback((c: any) => {
        if (!c.parent) return null;
        const proofUrls = proofs[c.id] || [];
        const isUploading = uploadingId === c.id;
        const isStudentOwner = currentUser?.role === 'student';
        const canModifyProof = isStudentOwner && canEdit('self');

        return (
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                {isUploading ? (
                    <Loader2 size={16} className="animate-spin text-blue-500" />
                ) : proofUrls.length > 0 ? (
                    <>
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); openProofGallery(proofUrls, 0); }}
                            className="flex items-center gap-1 text-[11px] font-bold bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-md hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 transition-all shadow-sm hover:shadow whitespace-nowrap"
                        >
                            <Eye size={13} /> Xem ảnh ({proofUrls.length})
                        </button>
                        {canModifyProof && proofUrls.length < MAX_PROOF_IMAGES && (
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleUploadClick(c.id); }}
                                className="p-1.5 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-all"
                                title={`Tải thêm ảnh (${proofUrls.length}/${MAX_PROOF_IMAGES})`}
                            >
                                <Upload size={14} />
                            </button>
                        )}
                        {canModifyProof && (
                            <button type="button" onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleRemoveProof(c.id); }}
                                className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all" title="Xóa toàn bộ minh chứng của mục này"><Trash2 size={14} /></button>
                        )}
                    </>
                ) : canModifyProof ? (
                    <button onClick={() => handleUploadClick(c.id)} className="p-2 rounded-lg bg-gradient-to-r from-gray-50 to-slate-100 border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-300 hover:from-blue-50 hover:to-indigo-50 transition-all shadow-sm hover:shadow group">
                        <Upload size={16} className="group-hover:scale-110 transition-transform" />
                    </button>
                ) : (
                    <span className="text-gray-300 text-[10px] italic">--</span>
                )}
            </div>
        );
    }, [proofs, uploadingId, currentUser?.role, canEdit, handleRemoveProof, handleUploadClick, openProofGallery]);

    const handleBack = useCallback(() => {
        navigate(currentUser?.role === 'student' ? '/student-home' : '/drl', { state: { selectedClassId: student?.classId, selectedPeriodId: currentPeriodId } });
    }, [currentUser?.role, navigate, student?.classId, currentPeriodId]);

    const scrollToGroup = useCallback((groupId: string) => {
        const target = document.getElementById(`group-${groupId}`);
        if (!target) return;
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

    if (isLoading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Đang tải phiếu...</div>;

    if (loadError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="max-w-md w-full bg-white rounded-xl border border-red-200 p-5 text-center shadow-sm">
                    <h3 className="text-red-600 font-bold text-lg mb-2">Không thể mở phiếu ĐRL</h3>
                    <p className="text-sm text-slate-600 mb-4">{loadError}</p>
                    <button onClick={handleBack} className="w-full rounded-lg bg-blue-600 py-2.5 text-white font-semibold hover:bg-blue-700 transition-colors" type="button">
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    if (!student) return <div className="min-h-screen flex items-center justify-center text-slate-500">Không tìm thấy sinh viên.</div>;

    const selfTotal = calculateTotal(scores.self);
    const classTotal = calculateTotal(scores.class);
    const currentPeriodName = periods.find(p => p.id === currentPeriodId)?.name || currentPeriodId;
    const isStudent = currentUser?.role === 'student';
    const currentPreviewImage = previewImages[previewIndex] || null;
    const hasMultiPreview = previewImages.length > 1;

    return (
        <div className="relative min-h-screen w-full bg-[#f8f6f6] text-slate-900" style={{ fontFamily: 'Lexend, sans-serif' }}>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/jpeg,image/png,image/webp,image/gif" multiple className="hidden" />

            {/* Image Preview Modal */}
            {currentPreviewImage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" onClick={() => { setPreviewImages([]); setPreviewIndex(0); }}>
                    <div className="relative max-w-4xl w-full max-h-full bg-white rounded-lg overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-3 border-b bg-gray-50">
                            <span className="font-bold text-gray-700">Xem minh chứng ({previewIndex + 1}/{previewImages.length})</span>
                            <div className="flex items-center gap-3">
                                <a href={currentPreviewImage} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline flex items-center gap-1">
                                    <ExternalLink size={14} /> Mở tab mới
                                </a>
                                <button onClick={() => { setPreviewImages([]); setPreviewIndex(0); }} className="p-1 hover:bg-gray-200 rounded-full text-gray-500"><X size={20} /></button>
                            </div>
                        </div>
                        <div className="relative flex-1 p-4 bg-gray-100 flex items-center justify-center overflow-auto min-h-[300px]">
                            {hasMultiPreview && (
                                <button
                                    type="button"
                                    onClick={() => setPreviewIndex((prev) => (prev - 1 + previewImages.length) % previewImages.length)}
                                    aria-label="Ảnh trước"
                                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-blue-600/95 text-white shadow-xl ring-2 ring-white/90 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                            )}

                            {imageError ? (
                                <div className="text-center">
                                    <div className="bg-red-50 p-4 rounded-full inline-block mb-3"><AlertTriangle className="text-red-500" size={32} /></div>
                                    <p className="text-red-600 font-bold">Không thể hiển thị ảnh này.</p>
                                    <p className="text-gray-500 text-sm mb-4">Có thể do định dạng file hoặc lỗi kết nối.</p>
                                    <a href={currentPreviewImage} target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-4 py-2 rounded font-bold inline-flex items-center gap-2 hover:bg-blue-700">
                                        <ExternalLink size={16} /> Thử mở trong tab mới
                                    </a>
                                </div>
                            ) : (
                                <img src={currentPreviewImage} alt="Proof" className="max-w-full max-h-[80vh] object-contain shadow-sm" referrerPolicy="no-referrer" onError={() => setImageError(true)} />
                            )}

                            {hasMultiPreview && (
                                <button
                                    type="button"
                                    onClick={() => setPreviewIndex((prev) => (prev + 1) % previewImages.length)}
                                    aria-label="Ảnh sau"
                                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-blue-600/95 text-white shadow-xl ring-2 ring-white/90 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            )}

                            {hasMultiPreview && (
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 rounded-full bg-black/70 text-white text-xs font-semibold px-3 py-1.5 shadow-lg">
                                    {previewIndex + 1} / {previewImages.length}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto min-h-screen bg-white shadow-xl lg:shadow-none lg:bg-transparent">
                <div className="sticky top-0 z-10 flex items-center bg-white/80 backdrop-blur-md p-4 border-b border-slate-200 justify-between">
                    <button onClick={handleBack} className="text-blue-600 flex size-10 items-center justify-center rounded-full hover:bg-blue-50 transition-colors" type="button">
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="text-slate-900 text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10">Phiếu chấm điểm rèn luyện</h2>
                </div>

                <div className={`p-4 bg-[#f8f6f6] ${isStudent ? 'pb-[220px]' : 'pb-32'}`}>
                    <div className="space-y-4">
                        <div className="space-y-4">
                            <div className="rounded-xl shadow-sm border border-slate-200 bg-white overflow-hidden">
                                <div className="h-2 bg-blue-600 w-full"></div>
                                <div className="p-4">
                                    <p className="text-blue-600 text-xs font-bold uppercase tracking-wider">{currentPeriodName}</p>
                                    <p className="text-slate-900 text-lg font-bold">{student.lastName} {student.firstName}</p>
                                    <div className="flex flex-wrap items-center gap-2 text-slate-500 text-sm mt-1">
                                        <span>MSSV: {student.id}</span>
                                        <span>•</span>
                                        <span>Lớp: {student.classId}</span>
                                    </div>
                                    <div className="mt-3 flex items-center gap-2">
                                        <Calendar size={14} className="text-blue-600" />
                                        <select value={currentPeriodId} onChange={(e) => navigate(`?period=${e.target.value}`, { replace: true })}
                                            className="bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-xs font-bold focus:ring-blue-500 focus:border-blue-500 px-2 py-1">
                                            {periods.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                                        </select>
                                    </div>
                                    <span className={`inline-flex mt-3 font-bold uppercase text-[10px] px-2.5 py-1 rounded-full ${scoreData?.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {scoreData?.status || 'moi tao'}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-blue-50 rounded-xl p-4 flex justify-between items-center border border-blue-200">
                                <div>
                                    <p className="text-xs text-slate-500 font-medium">Tổng điểm dự kiến</p>
                                    <p className="text-2xl font-bold text-blue-600">{selfTotal}<span className="text-sm font-normal text-slate-400 ml-1">/ 100</span></p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="size-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" style={{ animationDuration: '8s' }}></div>
                                    <span className="text-xs font-semibold text-blue-700">Xếp loại: {getRankLabel(selfTotal)}</span>
                                </div>
                            </div>

                            {isLocked && (
                                <div className="bg-orange-50 border border-orange-200 p-3 rounded-xl shadow-sm flex items-start gap-2">
                                    <Lock className="text-orange-500 shrink-0 mt-0.5" size={18} />
                                    <div>
                                        <h3 className="text-orange-800 font-bold text-sm">Đã khóa chỉnh sửa</h3>
                                        <p className="text-orange-700 text-xs">{lockReason}</p>
                                    </div>
                                </div>
                            )}

                            {!isLocked && scoreData?.status === 'submitted' && currentUser?.role === 'student' && (
                                <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl shadow-sm flex items-start gap-2">
                                    <CheckCircle className="text-blue-500 shrink-0 mt-0.5" size={18} />
                                    <p className="text-blue-700 text-xs">Bạn đã nộp phiếu chấm. Nhấn <b>Hủy nộp</b> để chỉnh sửa lại.</p>
                                </div>
                            )}

                            {!isLocked && (
                                <div className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-full bg-white border border-slate-200 w-fit">
                                    {autoSaveStatus === 'saving' && (<><RefreshCw size={13} className="animate-spin text-blue-500" /><span className="text-blue-600">Đang lưu...</span></>)}
                                    {autoSaveStatus === 'saved' && (<><CheckCircle size={13} className="text-green-500" /><span className="text-green-600">Đã tự động lưu</span></>)}
                                    {autoSaveStatus === 'error' && (<><CloudOff size={13} className="text-red-500" /><span className="text-red-600">Lỗi lưu</span></>)}
                                    {autoSaveStatus === 'idle' && (<><Cloud size={13} className="text-gray-400" /><span className="text-gray-400">Sẵn sàng</span></>)}
                                </div>
                            )}

                            {periodWarning && (
                                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl shadow-sm flex items-start gap-2">
                                    <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                                    <p className="text-amber-700 text-xs">{periodWarning}</p>
                                </div>
                            )}
                        </div>

                        <div className="hidden lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-6">
                            <aside className="rounded-xl border border-slate-200 bg-white shadow-sm h-fit sticky top-[92px]">
                                <div className="p-4 border-b border-slate-200 bg-slate-50 rounded-t-xl">
                                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Danh mục tiêu chí</h3>
                                </div>
                                <div className="p-2 space-y-1">
                                    {criteriaByGroup.map(({ group }) => {
                                        const selfGroup = getGroupTotal(scores.self, group.id);
                                        const classGroup = getGroupTotal(scores.class, group.id);
                                        return (
                                            <button
                                                key={`nav-${group.id}`}
                                                type="button"
                                                onClick={() => scrollToGroup(group.id)}
                                                className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-blue-50 transition-colors"
                                            >
                                                <span className="text-sm font-semibold text-slate-700 truncate">{group.id}. {group.content.replace(`${group.id}. `, '')}</span>
                                                <span className="text-xs font-bold text-blue-600 ml-2">{selfGroup}/{group.max}{visibility.class ? ` • ${classGroup}` : ''}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </aside>

                            <div className="space-y-4">
                                <div className="flex flex-col gap-4">
                    {criteriaByGroup.map(({ group, children }, groupIndex) => (
                        <details id={`group-${group.id}`} key={group.id} className="group border border-slate-200 rounded-xl bg-white overflow-hidden" open={groupIndex === 0}>
                            <summary className="flex cursor-pointer items-center justify-between gap-4 p-4 bg-slate-50">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="bg-blue-600 text-white size-8 rounded-lg flex items-center justify-center font-bold shrink-0">{group.id}</div>
                                    <div className="min-w-0">
                                        <p className="text-slate-900 text-sm font-bold truncate">{group.content}</p>
                                        <p className="text-[10px] text-slate-500">Tối đa {group.max}đ • SV: {getGroupTotal(scores.self, group.id)}đ{visibility.class ? ` • Lớp: ${getGroupTotal(scores.class, group.id)}đ` : ''}</p>
                                    </div>
                                </div>
                                <span className="text-slate-400 text-xs group-open:rotate-180 transition-transform">▼</span>
                            </summary>

                            <div className="p-4 flex flex-col gap-6">
                                {children.map((c, idx) => (
                                    <div key={c.id} className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed font-medium">{c.content}</p>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Điểm tự chấm (max {c.max})</label>
                                                {renderInput(c, 'self')}
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Minh chứng</label>
                                                <div className="h-7 flex items-center">{renderProofCell(c)}</div>
                                            </div>

                                            {visibility.class && (
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[10px] font-bold text-blue-400 uppercase">Điểm lớp chấm</label>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-14">{renderInput(c, 'class')}</div>
                                                        {canEdit('class') && currentUser?.role !== 'student' && (
                                                            <>
                                                                <button onClick={() => handleApproveOrReject(c, 'approve')}
                                                                    title={scores.class[c.id] === (scores.self[c.id] || 0) && scores.class[c.id] > 0 ? 'Ấn lại để hủy duyệt' : 'Duyệt điểm SV'}
                                                                    className={`p-1.5 rounded-lg transition-all shadow-sm border ${scores.class[c.id] === (scores.self[c.id] || 0) && scores.class[c.id] > 0 ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-emerald-600 border-emerald-300'}`}>
                                                                    <Check className="w-4 h-4" strokeWidth={3} />
                                                                </button>
                                                                <button onClick={() => handleApproveOrReject(c, 'reject')}
                                                                    title={scores.class[c.id] === 0 ? 'Ấn lại để hủy từ chối' : 'Từ chối (set 0)'}
                                                                    className={`p-1.5 rounded-lg transition-all shadow-sm border ${scores.class[c.id] === 0 ? 'bg-red-500 text-white border-red-600' : 'bg-white text-red-600 border-red-300'}`}>
                                                                    <X className="w-4 h-4" strokeWidth={3} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {idx < children.length - 1 && <hr className="border-slate-100" />}
                                    </div>
                                ))}
                            </div>
                        </details>
                    ))}
                                </div>

                                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 border border-orange-200 rounded-xl">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-orange-100 p-2 rounded-full text-orange-600"><Award size={20} /></div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-sm">TỔNG KẾT</h3>
                                                <p className="text-xs text-slate-500">Điểm tối đa: 100</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-center">
                                            <div className="bg-white rounded-lg py-1 px-2 min-w-[64px]">
                                                <p className="text-[10px] uppercase text-slate-400 font-bold">SV</p>
                                                <p className="text-lg font-extrabold text-slate-800">{selfTotal}</p>
                                            </div>
                                            <div className={`rounded-lg py-1 px-2 min-w-[64px] ${visibility.class ? 'bg-blue-50' : 'bg-white/60'}`}>
                                                <p className="text-[10px] uppercase text-slate-400 font-bold">Lớp</p>
                                                <p className="text-lg font-extrabold text-blue-700">{visibility.class ? classTotal : '-'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    {visibility.class && !isLocked && ['admin', 'monitor'].includes(currentUser?.role || '') && (
                                        <button onClick={handleApproveClass} className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors" type="button">Duyệt All</button>
                                    )}
                                </div>

                                <div className="hidden lg:block bg-white border border-slate-200 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-semibold text-slate-600">Tổng điểm tự chấm</span>
                                        <span className="text-2xl font-black text-blue-600">{selfTotal} / 100</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => handleSave(false)} disabled={isLocked} className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-2.5 text-slate-700 font-bold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" type="button">Lưu nháp</button>
                                        {canEdit(currentUser?.role === 'monitor' ? 'class' : 'self') ? (
                                            <button onClick={() => handleSave(true)} disabled={isLocked} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-white font-bold shadow-lg shadow-blue-600/20 hover:opacity-90 transition-opacity disabled:bg-gray-400" type="button">
                                                <CheckCircle size={18} /> Nộp phiếu
                                            </button>
                                        ) : (
                                            <button onClick={handleExportPDF} disabled={isExporting} className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-2.5 text-white font-bold shadow-lg shadow-purple-600/20 hover:opacity-90 transition-opacity disabled:opacity-60" type="button">
                                                {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />} PDF
                                            </button>
                                        )}
                                    </div>

                                    {currentUser?.role === 'student' && scoreData?.status === 'submitted' && (
                                        <button onClick={handleUnsubmit} className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-amber-500 py-2 text-white text-sm font-bold hover:bg-amber-600 transition-colors" type="button">
                                            <Undo2 size={14} /> Hủy nộp
                                        </button>
                                    )}

                                    {currentUser?.role !== 'student' && (
                                        <button onClick={handleExportPDF} disabled={isExporting} className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg border border-purple-200 bg-purple-50 py-2 text-purple-700 text-sm font-bold hover:bg-purple-100 transition-colors disabled:opacity-60" type="button">
                                            {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Xuất PDF
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 lg:hidden">
                            <div className="flex flex-col gap-4">
                    {criteriaByGroup.map(({ group, children }, groupIndex) => (
                        <details key={`mobile-${group.id}`} className="group border border-slate-200 rounded-xl bg-white overflow-hidden" open={groupIndex === 0}>
                            <summary className="flex cursor-pointer items-center justify-between gap-4 p-4 bg-slate-50">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="bg-blue-600 text-white size-8 rounded-lg flex items-center justify-center font-bold shrink-0">{group.id}</div>
                                    <div className="min-w-0">
                                        <p className="text-slate-900 text-sm font-bold truncate">{group.content}</p>
                                        <p className="text-[10px] text-slate-500">Tối đa {group.max}đ • SV: {getGroupTotal(scores.self, group.id)}đ{visibility.class ? ` • Lớp: ${getGroupTotal(scores.class, group.id)}đ` : ''}</p>
                                    </div>
                                </div>
                                <span className="text-slate-400 text-xs group-open:rotate-180 transition-transform">▼</span>
                            </summary>

                            <div className="p-4 flex flex-col gap-6">
                                {children.map((c, idx) => (
                                    <div key={`mobile-${c.id}`} className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed font-medium">{c.content}</p>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Điểm tự chấm (max {c.max})</label>
                                                {renderInput(c, 'self')}
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Minh chứng</label>
                                                <div className="h-7 flex items-center">{renderProofCell(c)}</div>
                                            </div>

                                            {visibility.class && (
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[10px] font-bold text-blue-400 uppercase">Điểm lớp chấm</label>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-14">{renderInput(c, 'class')}</div>
                                                        {canEdit('class') && currentUser?.role !== 'student' && (
                                                            <>
                                                                <button onClick={() => handleApproveOrReject(c, 'approve')}
                                                                    title={scores.class[c.id] === (scores.self[c.id] || 0) && scores.class[c.id] > 0 ? 'Ấn lại để hủy duyệt' : 'Duyệt điểm SV'}
                                                                    className={`p-1.5 rounded-lg transition-all shadow-sm border ${scores.class[c.id] === (scores.self[c.id] || 0) && scores.class[c.id] > 0 ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-emerald-600 border-emerald-300'}`}>
                                                                    <Check className="w-4 h-4" strokeWidth={3} />
                                                                </button>
                                                                <button onClick={() => handleApproveOrReject(c, 'reject')}
                                                                    title={scores.class[c.id] === 0 ? 'Ấn lại để hủy từ chối' : 'Từ chối (set 0)'}
                                                                    className={`p-1.5 rounded-lg transition-all shadow-sm border ${scores.class[c.id] === 0 ? 'bg-red-500 text-white border-red-600' : 'bg-white text-red-600 border-red-300'}`}>
                                                                    <X className="w-4 h-4" strokeWidth={3} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {idx < children.length - 1 && <hr className="border-slate-100" />}
                                    </div>
                                ))}
                            </div>
                        </details>
                    ))}
                            </div>

                            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 border border-orange-200 rounded-xl">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-orange-100 p-2 rounded-full text-orange-600"><Award size={20} /></div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-sm">TỔNG KẾT</h3>
                                            <p className="text-xs text-slate-500">Điểm tối đa: 100</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-center">
                                        <div className="bg-white rounded-lg py-1 px-2 min-w-[64px]">
                                            <p className="text-[10px] uppercase text-slate-400 font-bold">SV</p>
                                            <p className="text-lg font-extrabold text-slate-800">{selfTotal}</p>
                                        </div>
                                        <div className={`rounded-lg py-1 px-2 min-w-[64px] ${visibility.class ? 'bg-blue-50' : 'bg-white/60'}`}>
                                            <p className="text-[10px] uppercase text-slate-400 font-bold">Lớp</p>
                                            <p className="text-lg font-extrabold text-blue-700">{visibility.class ? classTotal : '-'}</p>
                                        </div>
                                    </div>
                                </div>
                                {visibility.class && !isLocked && ['admin', 'monitor'].includes(currentUser?.role || '') && (
                                    <button onClick={handleApproveClass} className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors" type="button">Duyệt All</button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`fixed lg:hidden left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-lg border-t border-slate-200 px-2 py-1.5 z-[70] ${isStudent ? 'bottom-[62px]' : 'bottom-0'}`}>
                <div className="flex items-center justify-between mb-1 px-1">
                    <span className="text-sm font-extrabold text-slate-700">Tổng điểm tự chấm</span>
                    <span className="text-[17px] leading-none font-black text-blue-600">{selfTotal} / 100</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleSave(false)} disabled={isLocked} className="flex items-center justify-center gap-1 rounded-md border border-slate-300 bg-white py-1.5 text-xs text-slate-700 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" type="button">Lưu nháp</button>
                    {canEdit(currentUser?.role === 'monitor' ? 'class' : 'self') ? (
                        <button onClick={() => handleSave(true)} disabled={isLocked} className="flex items-center justify-center gap-1 rounded-md bg-blue-600 py-1.5 text-xs text-white font-semibold shadow-md shadow-blue-600/25 hover:opacity-90 transition-opacity disabled:bg-gray-400" type="button">
                            <CheckCircle size={14} /> Nộp phiếu
                        </button>
                    ) : (
                        <button onClick={handleExportPDF} disabled={isExporting} className="flex items-center justify-center gap-1 rounded-md bg-purple-600 py-1.5 text-xs text-white font-semibold shadow-md shadow-purple-600/25 hover:opacity-90 transition-opacity disabled:opacity-60" type="button">
                            {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} PDF
                        </button>
                    )}
                </div>

                {currentUser?.role === 'student' && scoreData?.status === 'submitted' && (
                    <button onClick={handleUnsubmit} className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-amber-500 py-2 text-white text-sm font-bold hover:bg-amber-600 transition-colors" type="button">
                        <Undo2 size={14} /> Hủy nộp
                    </button>
                )}

                {currentUser?.role !== 'student' && (
                    <button onClick={handleExportPDF} disabled={isExporting} className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg border border-purple-200 bg-purple-50 py-2 text-purple-700 text-sm font-bold hover:bg-purple-100 transition-colors disabled:opacity-60" type="button">
                        {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Xuất PDF
                    </button>
                )}
            </div>

            {isStudent && <StudentBottomNav active="drl" />}
        </div>
    );
};

export default DRLForm;
