import { Subject, SubjectGrade } from '../types';

// Hằng số cho thang điểm
export const SCORE_SCALE = {
  MIN: 0,
  MAX: 10,
} as const;

// Thang điểm chữ và GPA 4.0
export const GRADE_SCALE = [
  { min: 9., char: 'A', gpa4: 4.0, text: 'Xuất sắc' },
  { min: 8.5, char: 'A', gpa4: 3.8, text: 'Xuất sắc' },
  { min: 8.0, char: 'B+', gpa4: 3.5, text: 'Giỏi' },
  { min: 7.0, char: 'B', gpa4: 3.0, text: 'Khá' },
  { min: 6.5, char: 'C+', gpa4: 2.5, text: 'TB Khá' },
  { min: 5.5, char: 'C', gpa4: 2.0, text: 'Trung bình' },
  { min: 5.0, char: 'D+', gpa4: 1.5, text: 'TB Yếu' },
  { min: 4.0, char: 'D', gpa4: 1.0, text: 'Yếu' },
  { min: 0, char: 'F', gpa4: 0, text: 'Kém' },
] as const;

// Phân loại học lực theo GPA 4.0
export const CLASSIFICATION_SCALE = [
  { min: 3.6, text: 'Xuất sắc', color: 'text-emerald-600' },
  { min: 3.2, text: 'Giỏi', color: 'text-blue-600' },
  { min: 2.5, text: 'Khá', color: 'text-indigo-600' },
  { min: 2.0, text: 'Trung bình', color: 'text-amber-600' },
  { min: 0, text: 'Yếu', color: 'text-red-600' },
] as const;

/**
 * Tính điểm tổng kết môn học (hệ 10)
 * @param midterm - Điểm giữa kỳ
 * @param final - Điểm cuối kỳ
 * @param subject - Thông tin môn học (chứa trọng số)
 * @returns Điểm tổng kết hoặc null nếu thiếu dữ liệu
 */
export const calculateSubjectScore = (
  midterm: number | undefined,
  final: number | undefined,
  subject: Subject
): number | null => {
  // Nếu thiếu cả 2 điểm thì không tính được
  if (midterm === undefined && final === undefined) return null;

  const midVal = midterm ?? 0;
  const finalVal = final ?? 0;
  const midWeight = (subject.midtermWeight ?? 40) / 100;
  const finalWeight = (subject.finalWeight ?? 60) / 100;

  return Math.round((midVal * midWeight + finalVal * finalWeight) * 100) / 100;
};

/**
 * Chuyển đổi điểm số sang điểm chữ và GPA 4.0
 * @param score10 - Điểm hệ 10
 * @returns Object chứa điểm chữ, GPA 4.0 và xếp loại
 */
export const convertScoreToLetter = (score10: number | null) => {
  if (score10 === null) {
    return { char: '-', gpa4: 0, text: '-' };
  }

  const grade = GRADE_SCALE.find(g => score10 >= g.min);
  return grade || { char: 'F', gpa4: 0, text: 'Kém' };
};

/**
 * Tính GPA tích lũy
 * @param grades - Danh sách điểm các môn
 * @param subjects - Danh sách môn học
 * @returns Object chứa GPA 10, GPA 4, tổng tín chỉ
 */
export const calculateGPA = (
  grades: SubjectGrade[],
  subjects: Subject[]
) => {
  let totalCredits = 0;
  let totalScore4 = 0;
  let totalScore10 = 0;

  grades.forEach(grade => {
    const subject = subjects.find(s => s.id === grade.subjectId);
    if (!subject || !subject.credits) return;

    const score10 = calculateSubjectScore(
      grade.midtermScore,
      grade.finalScore,
      subject
    );

    if (score10 !== null) {
      const converted = convertScoreToLetter(score10);
      totalCredits += subject.credits;
      totalScore10 += score10 * subject.credits;
      totalScore4 += converted.gpa4 * subject.credits;
    }
  });

  const gpa10 = totalCredits > 0 ? (totalScore10 / totalCredits).toFixed(2) : '0.00';
  const gpa4 = totalCredits > 0 ? (totalScore4 / totalCredits).toFixed(2) : '0.00';

  return {
    gpa10,
    gpa4,
    totalCredits,
    gpa4Num: parseFloat(gpa4),
  };
};

/**
 * Xếp loại học lực dựa trên GPA 4.0
 * @param gpa4 - GPA hệ 4.0
 * @returns Xếp loại học lực
 */
export const getClassification = (gpa4: number): string => {
  if (gpa4 === 0) return 'Chưa xếp loại';
  const classification = CLASSIFICATION_SCALE.find(c => gpa4 >= c.min);
  return classification?.text || 'Chưa xếp loại';
};

/**
 * Lấy màu sắc cho xếp loại
 * @param gpa4 - GPA hệ 4.0
 * @returns Class CSS cho màu sắc
 */
export const getClassificationColor = (gpa4: number): string => {
  const classification = CLASSIFICATION_SCALE.find(c => gpa4 >= c.min);
  return classification?.color || 'text-gray-500';
};

/**
 * Validate điểm số
 * @param score - Điểm cần validate
 * @returns Điểm đã được chuẩn hóa
 */
export const validateScore = (score: string): number => {
  let numVal = parseFloat(score);
  if (isNaN(numVal)) return 0;
  if (numVal < SCORE_SCALE.MIN) return SCORE_SCALE.MIN;
  if (numVal > SCORE_SCALE.MAX) return SCORE_SCALE.MAX;
  return numVal;
};

/**
 * Validate trọng số môn học
 * @param midWeight - Trọng số giữa kỳ
 * @param finalWeight - Trọng số cuối kỳ
 * @returns true nếu hợp lệ
 */
export const validateWeights = (midWeight: number, finalWeight: number): boolean => {
  return midWeight + finalWeight === 100;
};
