/**
 * Type Definitions - Student Attendance System
 */

// === APP CONFIG ===
export interface AppConfig {
  apiUrl: string;
  lockApiUrl?: boolean;
  websiteLogo?: string;
  footerText?: string;
  maintenance?: {
    enabled: boolean;
    allowAccess: boolean;
    message?: string;
  };
  contacts?: {
    phone?: string;
    email?: string;
    zalo?: string;
    facebook?: string;
  };
  [key: string]: any; // Allow additional properties
}

// === CORE ENTITIES ===
export interface Student {
  id: string;          // MSSV
  lastName: string;    // Họ đệm
  firstName: string;   // Tên
  dob: string;         // Ngày sinh
  classId: string;
  email?: string;
}

export interface ClassGroup {
  id: string;
  name: string;
  description?: string;
}

export interface Subject {
  id: string;
  name: string;
  classId: string;
  credits?: number;
  midtermWeight?: number;  // Default: 30
  finalWeight?: number;    // Default: 70
  semester?: string;       // Link to GradingPeriod.id
}

export interface Activity {
  id: string;
  name: string;
  dateTime: string;
  subjectId: string;
  classId: string;
}

// === ATTENDANCE & GRADES ===
export interface AttendanceRecord {
  id: string;
  activityId: string;
  studentId: string;
  timestamp: string;
}

export interface SubjectGrade {
  id: string;          // studentId_subjectId
  studentId: string;
  subjectId: string;
  midtermScore?: number;
  finalScore?: number;
}

// === USER & AUTH ===
export type UserRole = 'admin' | 'monitor' | 'student';

export interface User {
  username: string;
  password: string;
  name: string;
  role: UserRole;
  classId?: string;
  email?: string;
}

// === DRL (Điểm rèn luyện) ===
export type DRLStatus = 'draft' | 'submitted' | 'class_approved' | 'bch_approved' | 'faculty_approved' | 'approved' | 'finalized' | 'rejected';

export interface GradingPeriod {
  id: string;          // VD: HK1_2024
  name: string;        // VD: Học kỳ 1, Năm học 2024-2025
  startDate?: string;
  endDate?: string;
  isDefault?: boolean;
}

export interface DRLScore {
  id: string;
  studentId: string;
  semester: string;    // Link to GradingPeriod.id
  selfScore: number;
  classScore: number;
  bchScore?: number;
  facultyScore?: number;
  finalScore: number;
  details: any;
  status: DRLStatus;
}

// === FILE UPLOAD ===
export interface FileUpload {
  id?: number;
  studentId: string;
  category: string;
  fileName: string;
  filePath: string;
  fileUrl?: string;
}

// === STATISTICS ===
export interface AttendanceStats {
  activityId: string;
  activityName: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  presentRate: number;
}

// === API RESPONSE ===
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
}

export interface MarkAttendanceResult {
  status: 'success' | 'already_present' | 'student_not_found';
  student?: Student;
}

// === Aliases for backward compatibility ===
export type Grade = SubjectGrade;
export type Attendance = AttendanceRecord;
export type ActivityStats = AttendanceStats;
