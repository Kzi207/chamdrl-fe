
import {
  Student, ClassGroup, Activity, AttendanceRecord, User,
  Subject, SubjectGrade, DRLScore, GradingPeriod
} from '../types';

const API_KEY = 'kzi207-khoaktck-cncd2511';
let proofApiMode: 'unknown' | 'bulk' | 'legacy' = 'unknown';
const STORAGE_KEY_URL = 'api_url';
const STORAGE_KEY_USER = 'current_user';
const STORAGE_KEY_FIREBASE = 'firebase_config';

// Cache cho config từ server
let cachedConfig: any = null;
let cachedConfigAt = 0;
let configRequest: Promise<any> | null = null;
const CONFIG_TTL_MS = 5 * 60 * 1000;

const DEFAULT_FIREBASE_CONFIG = {
  "apiKey": "AIzaSyALqNYmM4mwrpgttm9AFmc8sPOIvUMGuUw",
  "authDomain": "loign-d92d1.firebaseapp.com",
  "projectId": "loign-d92d1",
  "storageBucket": "loign-d92d1.firebasestorage.app",
  "messagingSenderId": "1027255878750",
  "appId": "1:1027255878750:web:566bbbc6b75c30a98160cf",
  "measurementId": "G-KRFHT72YJR"
}

// --- UTILS ---
// Hàm loại bỏ dấu tiếng Việt và chuẩn hóa
export const removeAccents = (str: string) => {
  return str.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .trim()
    .toLowerCase();
};

// Hàm tự động tạo email: [chữ cái đầu họ lót][tên][mssv]@student.ctuet.edu.vn
// VD: Lê Khánh Duy, CNCD2511016 -> lkduycncd2511016@student.ctuet.edu.vn
export const generateStudentEmail = (lastName: string, firstName: string, mssv: string): string => {
  // 1. Xử lý Họ Lót: "Lê Khánh" -> ["l", "k"]
  const safeLast = removeAccents(lastName);
  const initials = safeLast.split(/\s+/).map(word => word.charAt(0)).join('');

  // 2. Xử lý Tên: 
  const safeFirst = removeAccents(firstName);

  // 3. Xử lý MSSV: "CNCD2511016" -> "cncd2511016"
  const safeMssv = mssv.trim().toLowerCase();

  return `${initials}${safeFirst}${safeMssv}@student.ctuet.edu.vn`;
};

// --- CONFIG ---
// Lấy config từ server
export const loadConfigFromServer = async (forceRefresh = false): Promise<any> => {
  const now = Date.now();

  if (!forceRefresh && cachedConfig && (now - cachedConfigAt) < CONFIG_TTL_MS) {
    return cachedConfig;
  }

  if (!forceRefresh && configRequest) {
    return configRequest;
  }

  configRequest = (async () => {
    try {
      const response = await fetch('/config.json', { cache: 'no-cache' });
      if (response.ok) {
        const config = await response.json();
        cachedConfig = config;
        cachedConfigAt = Date.now();
        return config;
      }
    } catch (error) {
      console.warn('[Config] Failed to load from server:', error);
    } finally {
      configRequest = null;
    }

    return cachedConfig;
  })();

  return configRequest;
};

export const getApiUrl = (): string => {
  // Ưu tiên biến môi trường để có thể ép FE gọi đúng BE local
  const envApiUrl = (import.meta as any)?.env?.VITE_API_URL as string | undefined;
  if (envApiUrl && envApiUrl.trim()) {
    return envApiUrl.trim().replace(/\/$/, '');
  }

  // Development mode fallback khi chưa cấu hình env
  const host = window.location.hostname;
  const isDevHost = host === 'localhost' || host === '127.0.0.1';

  if (isDevHost) {
    return 'http://localhost:3004';
  }

  // Production: dùng same-origin proxy để tránh lỗi CORS từ browser
  // Xóa bất kỳ override nào trong localStorage
  const storedUrl = localStorage.getItem(STORAGE_KEY_URL);
  if (storedUrl && storedUrl !== '/api-proxy') {
    console.warn('[API] Removing custom URL from localStorage, forcing default: /api-proxy');
    localStorage.removeItem(STORAGE_KEY_URL);
  }

  return '/api-proxy';
};

// Kiểm tra mixed content (HTTPS page với HTTP API)
export const checkMixedContent = (): { isSecure: boolean; warning?: string } => {
  const pageProtocol = window.location.protocol;
  const apiUrl = getApiUrl();
  const apiProtocol = apiUrl.startsWith('https') ? 'https:' : 'http:';

  if (pageProtocol === 'https:' && apiProtocol === 'http:') {
    return {
      isSecure: false,
      warning: 'Cảnh báo: Trang web đang dùng HTTPS nhưng API là HTTP. Trình duyệt (đặc biệt trên mobile) có thể chặn kết nối. Vui lòng sử dụng API với HTTPS hoặc truy cập trang qua HTTP.'
    };
  }

  return { isSecure: true };
};

export const saveApiConfig = async (url: string): Promise<boolean> => {
  // PRODUCTION: Không cho phép thay đổi API URL
  const isDev = window.location.hostname === 'localhost';
  if (!isDev) {
    console.warn('[Config] API URL is locked in production: /api-proxy');
    return false;
  }

  const cleanUrl = url.replace(/\/$/, '');

  // Lưu vào localStorage trước (chỉ trong dev)
  localStorage.setItem(STORAGE_KEY_URL, cleanUrl);

  // Lưu vào server config
  try {
    const config = cachedConfig || await loadConfigFromServer() || {};
    config.apiUrl = cleanUrl;

    const response = await fetch(`${cleanUrl}/config/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify(config)
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        cachedConfig = config;
        console.log('[Config] API URL saved to server');
        return true;
      }
    }
  } catch (error) {
    console.warn('[Config] Failed to save to server:', error);
  }

  // Log cảnh báo nếu có mixed content
  const check = checkMixedContent();
  if (!check.isSecure) {
    console.warn('[Mixed Content]', check.warning);
  }

  return false;
};

export const resetApiConfig = () => {
  localStorage.removeItem(STORAGE_KEY_URL);
}

// --- FIREBASE CONFIG ---
export const getFirebaseConfig = (): any => {
  // Priority: localStorage > cached config > default
  const str = localStorage.getItem(STORAGE_KEY_FIREBASE);
  if (str) {
    try {
      return JSON.parse(str);
    } catch {
      // Fall through to next priority
    }
  }

  if (cachedConfig && cachedConfig.firebaseConfig) {
    return cachedConfig.firebaseConfig;
  }

  return DEFAULT_FIREBASE_CONFIG;
};

export const saveFirebaseConfig = async (config: any): Promise<boolean> => {
  // Lưu vào localStorage trước
  localStorage.setItem(STORAGE_KEY_FIREBASE, JSON.stringify(config));

  // Lưu vào server config
  try {
    const serverConfig = cachedConfig || await loadConfigFromServer() || {};
    serverConfig.firebaseConfig = config;

    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/config/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify(serverConfig)
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        cachedConfig = serverConfig;
        console.log('[Config] Firebase config saved to server');
        return true;
      }
    }
  } catch (error) {
    console.warn('[Config] Failed to save Firebase config to server:', error);
  }

  return false;
};

// --- SQL CONFIG ---
const STORAGE_KEY_SQL = 'sql_config';

export interface SqlConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export const getSqlConfig = (): SqlConfig | null => {
  const str = localStorage.getItem(STORAGE_KEY_SQL);
  try {
    return str ? JSON.parse(str) : null;
  } catch {
    return null;
  }
};

export const saveSqlConfig = (config: SqlConfig) => {
  localStorage.setItem(STORAGE_KEY_SQL, JSON.stringify(config));
};


// --- CORE API ---
// Hàm fetch với timeout
function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 30000): Promise<Response> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Kết nối quá chậm. Vui lòng kiểm tra mạng và thử lại.'));
    }, timeout);

    fetch(url, options)
      .then(response => {
        clearTimeout(timer);
        resolve(response);
      })
      .catch(error => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

// Hàm retry cho fetch
async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 2, timeout = 30000): Promise<Response> {
  let lastError: Error | null = null;

  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetchWithTimeout(url, options, timeout);
      return response;
    } catch (error: any) {
      lastError = error;
      console.warn(`[Fetch Retry ${i + 1}/${retries + 1}] Failed:`, error.message);

      // Nếu là lần thử cuối, throw error
      if (i === retries) {
        throw error;
      }

      // Đợi một chút trước khi retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, i), 5000)));
    }
  }

  throw lastError || new Error('Fetch failed');
}

async function fetchAPI(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body?: any): Promise<any> {
  const baseUrl = getApiUrl();
  if (!baseUrl) throw new Error("Chưa cấu hình API URL");

  // Removed apikey from URL query
  const url = `${baseUrl}/${endpoint}`;

  console.log(`[API] ${method} ${url}`);

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY // Add API Key to Headers
    },
    // Thêm mode và credentials cho CORS
    mode: 'cors',
    credentials: 'omit'
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetchWithRetry(url, options, 2, 30000); // 2 retries, 30s timeout

    console.log(`[API] Response status: ${res.status}`);

    if (!res.ok) {
      const errText = await res.text();

      // Xử lý các mã lỗi cụ thể
      if (res.status === 403) {
        throw new Error('Truy cập bị từ chối. IP có thể đang bị chặn do quá nhiều yêu cầu.');
      }
      if (res.status === 429) {
        throw new Error('Quá nhiều yêu cầu. Vui lòng đợi ít giây và thử lại.');
      }
      if (res.status >= 500) {
        throw new Error('Lỗi máy chủ. Vui lòng thử lại sau.');
      }

      throw new Error(`Lỗi Server (${res.status}): ${errText}`);
    }

    const data = await res.json();
    console.log(`[API] Response data:`, data);
    return data;
  } catch (e: any) {
    console.error("[API] Fetch Error:", e);
    console.error("[API] Error details:", {
      name: e.name,
      message: e.message,
      stack: e.stack
    });

    // Xử lý lỗi mạng
    if (e.message && e.message.includes('Failed to fetch')) {
      throw new Error(`Không thể kết nối đến máy chủ\n\nAPI: ${baseUrl}\n\nVui lòng kiểm tra:\n1. Kết nối internet (thử 4G nếu WiFi không ổn)\n2. URL API trong Cài đặt\n3. Máy chủ đang hoạt động\n4. Firewall/Antivirus không chặn kết nối`);
    }
    if (e.message && (e.message.includes('NetworkError') || e.message.includes('network'))) {
      throw new Error(`Lỗi mạng\n\nAPI: ${baseUrl}\n\nVui lòng:\n1. Kiểm tra kết nối internet\n2. Thử chuyển mạng (WiFi ↔ 4G)\n3. Tắt VPN nếu đang bật`);
    }
    if (e.message && e.message.includes('quá chậm')) {
      throw new Error(`Kết nối quá chậm (timeout)\n\nAPI: ${baseUrl}\n\nCó thể:\n1. Mạng chậm\n2. Máy chủ quá tải\n3. Thử lại sau ít phút`);
    }

    throw e;
  }
}

export const checkSystemStatus = async (): Promise<{ status: string; message: string }> => {
  try {
    const res = await fetchWithTimeout(`${getApiUrl()}/status`, {}, 10000); // 10s timeout cho check status
    if (res.ok) return { status: 'ok', message: 'Kết nối thành công' };
    return { status: 'error', message: `Lỗi Server (${res.status})` };
  } catch (e: any) {
    console.error('System status check error:', e);

    if (e.message && e.message.includes('quá chậm')) {
      return { status: 'error', message: 'Kết nối quá chậm (timeout). Kiểm tra mạng hoặc URL API.' };
    }
    if (e.message && (e.message.includes('Failed to fetch') || e.message.includes('NetworkError'))) {
      return { status: 'error', message: 'Không thể kết nối. Kiểm tra URL/Mạng/Máy chủ' };
    }

    return { status: 'error', message: e.message || 'Không thể kết nối (Kiểm tra URL/Mạng)' };
  }
}

// --- AUTH ---
export const isLoggedIn = (): boolean => {
  return !!localStorage.getItem(STORAGE_KEY_USER);
};

export const getCurrentUser = (): User | null => {
  const str = localStorage.getItem(STORAGE_KEY_USER);
  return str ? JSON.parse(str) : null;
};

export const login = async (username: string, pass: string): Promise<{ success: boolean; message?: string; user?: User }> => {
  try {
    const user = await fetchAPI('login', 'POST', { username, password: pass });

    if (user && user.username) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      return { success: true, user };
    }
    return { success: false, message: 'Sai tên đăng nhập hoặc mật khẩu' };
  } catch (e: any) {
    console.error('[Login] Error:', e);
    return { success: false, message: e.message || 'Lỗi kết nối Server' };
  }
};

export const loginWithGoogleAccount = async (email: string, fullName: string): Promise<{ success: boolean; message?: string; user?: User }> => {
  try {
    console.log('[Google Login] Processing:', { email, fullName });
    console.log('[Google Login] API URL:', getApiUrl());

    // 1. Kiểm tra domain (Cho phép @ctuet.edu.vn và @student.ctuet.edu.vn)
    if (!email.endsWith('ctuet.edu.vn')) {
      return { success: false, message: 'Chỉ chấp nhận email trường (@ctuet.edu.vn hoặc @student.ctuet.edu.vn)' };
    }

    // 2. Tìm user trong DB bằng email trước (chính xác nhất)
    console.log('[Google Login] Fetching users from API...');
    const users = await getUsers();
    console.log('[Google Login] Got', users.length, 'users from API');
    let user = users.find((u: User) => u.email === email);

    // 3. Nếu không tìm thấy bằng email, thử tìm bằng MSSV trích xuất từ email
    if (!user) {
      // Logic: Email dạng "lkduycncd2511016@..." -> tìm "cncd2511016"
      // Regex: Tìm chuỗi bắt đầu bằng ít nhất 1 chữ cái và theo sau là số, nằm ở cuối local part
      const localPart = email.split('@')[0];
      const mssvMatch = localPart.match(/([a-zA-Z]+\d+)$/);

      let extractedMssv = '';
      // Nếu format là lkduycncd... thì ta cần trích xuất phần CNCD...
      // Logic mới: Tìm chuỗi có dạng (Ký tự + Số) dài nhất có thể là MSSV
      // Thử regex tìm MSSV chuẩn (ví dụ CNCD, DCCN...)
      const codeMatch = localPart.match(/([a-zA-Z]{4}\d+)/); // Tìm 4 chữ cái + số (VD: CNCD25...)

      if (codeMatch) {
        extractedMssv = codeMatch[0].toUpperCase();
      } else if (mssvMatch) {
        extractedMssv = mssvMatch[0].toUpperCase();
      } else {
        // Fallback: Tìm số cuối cùng
        const numMatch = localPart.match(/(\d+)$/);
        if (numMatch) extractedMssv = numMatch[0]; // Có thể sai nếu chỉ có số
      }

      if (extractedMssv) {
        user = users.find((u: User) => u.username.toUpperCase() === extractedMssv);

        // Nếu tìm thấy user bằng MSSV nhưng chưa có email -> Cập nhật email
        if (user && !user.email) {
          user.email = email;
          await updateUser(user);
        }
      }
    }

    // 4. Nếu vẫn không tìm thấy -> Tạo mới (trường hợp chưa nhập danh sách lớp)
    if (!user) {
      // Cố gắng tìm thông tin sinh viên từ bảng students (có thể admin đã nhập SV nhưng chưa tạo TK)
      const studentsList = await getStudents();

      // Logic trích xuất MSSV lại lần nữa để tìm trong bảng students
      const localPart = email.split('@')[0];
      const codeMatch = localPart.match(/([a-zA-Z]{4}\d+)/);
      let mssv = codeMatch ? codeMatch[0].toUpperCase() : localPart.toUpperCase();

      const existingStudentInfo = studentsList.find(s => s.id.toUpperCase() === mssv);

      // Tạo mật khẩu mặc định (3 số cuối)
      const defaultPass = mssv.length > 3 ? mssv.slice(-3) : mssv;

      user = {
        username: mssv,
        password: defaultPass,
        name: existingStudentInfo ? `${existingStudentInfo.lastName} ${existingStudentInfo.firstName}` : fullName,
        role: 'student',
        classId: existingStudentInfo ? existingStudentInfo.classId : '',
        email: email
      };
      await createUser(user);
    }

    console.log('[Google Login] Success:', user);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    return { success: true, user };

  } catch (e: any) {
    console.error("[Google Login] Error:", e);

    // Enhanced error messages
    if (e.message && e.message.includes('Không thể kết nối')) {
      return {
        success: false,
        message: `Không thể kết nối máy chủ\n\n${e.message}\n\n🔍 Kiểm tra:\n1. Tắt Ad Blocker (uBlock, AdBlock...)\n2. Thử chuyển mạng WiFi/4G\n3. Xóa cache và reload (Ctrl+Shift+R)`
      };
    }

    return { success: false, message: e.message || 'Lỗi xử lý đăng nhập Google. Vui lòng thử lại.' };
  }
};

export const logout = () => {
  localStorage.removeItem(STORAGE_KEY_USER);
};

export const changePassword = async (username: string, newPassword: string): Promise<void> => {
  await fetchAPI('change-password', 'POST', { username, newPassword });
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.username === username) {
    currentUser.password = newPassword;
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
  }
}

// --- CLASSES ---
export const getClasses = async (): Promise<ClassGroup[]> => fetchAPI('classes');
export const createClass = async (cls: ClassGroup): Promise<void> => fetchAPI('classes', 'POST', cls);
export const updateClass = async (id: string, name: string): Promise<void> => fetchAPI('classes', 'PUT', { id, name });
export const deleteClass = async (id: string): Promise<void> => {
  // Get all students in the class first
  const classStudents = await getStudents(id);

  // Delete all students in the class
  for (const student of classStudents) {
    await deleteStudent(student.id);
  }

  // Delete the class itself
  await fetchAPI(`classes?id=${id}`, 'DELETE', { id });
};

// --- STUDENTS ---
export const getStudents = async (classId?: string): Promise<Student[]> => {
  return fetchAPI(classId ? `students?classId=${classId}` : 'students');
};

export const importStudents = async (students: Student[]): Promise<void> => {
  await fetchAPI('students', 'POST', students);
};

export const createStudent = async (student: Student): Promise<void> => {
  await fetchAPI('students', 'POST', student);
};

export const updateStudent = async (student: Partial<Student> & { id: string }): Promise<void> => {
  await fetchAPI('students', 'PUT', student);
};

export const deleteStudent = async (id: string): Promise<void> => {
  await fetchAPI(`students?id=${encodeURIComponent(id)}`, 'DELETE', { id });
};

// --- USERS ---
export const getUsers = async (): Promise<User[]> => fetchAPI('users');
export const createUser = async (user: User): Promise<void> => fetchAPI('users', 'POST', user);
export const updateUser = async (user: User): Promise<void> => fetchAPI('users', 'PUT', user);
export const deleteUser = async (username: string): Promise<void> => fetchAPI(`users?username=${username}`, 'DELETE', { username });

export const createUsersBatch = async (users: User[]): Promise<{ success: boolean; count: number }> => {
  return fetchAPI('users-batch', 'POST', users);
}

export const resetUsersBatch = async (users: User[]): Promise<{ success: boolean; count: number }> => {
  return fetchAPI('users-reset-pass', 'POST', users);
}

// --- SUBJECTS ---
export const getSubjects = async (): Promise<Subject[]> => fetchAPI('subjects');
export const createSubject = async (sub: Subject): Promise<void> => fetchAPI('subjects', 'POST', sub);
export const updateSubject = async (sub: Subject): Promise<void> => fetchAPI('subjects', 'PUT', sub);
export const deleteSubject = async (id: string): Promise<void> => fetchAPI(`subjects?id=${id}`, 'DELETE', { id });

// --- ATTENDANCE SUBJECTS (Môn học cho điểm danh) ---
export const getAttendanceSubjects = async (): Promise<any[]> => fetchAPI('attendance-subjects');
export const createAttendanceSubject = async (sub: { id: string; name: string; classId: string; semester?: string }): Promise<void> => fetchAPI('attendance-subjects', 'POST', sub);
export const updateAttendanceSubject = async (sub: { id: string; name: string; classId: string; semester?: string }): Promise<void> => fetchAPI('attendance-subjects', 'PUT', sub);
export const deleteAttendanceSubject = async (id: string): Promise<void> => fetchAPI(`attendance-subjects?id=${id}`, 'DELETE', { id });

// --- GPA SUBJECTS (Môn học cho tính điểm) ---
export const getGPASubjects = async (): Promise<Subject[]> => fetchAPI('gpa-subjects');
export const createGPASubject = async (sub: Subject): Promise<void> => fetchAPI('gpa-subjects', 'POST', sub);
export const updateGPASubject = async (sub: Subject): Promise<void> => fetchAPI('gpa-subjects', 'PUT', sub);
export const deleteGPASubject = async (id: string): Promise<void> => fetchAPI(`gpa-subjects?id=${id}`, 'DELETE', { id });

// --- ACTIVITIES ---
export const getActivities = async (): Promise<Activity[]> => fetchAPI('activities');
export const createActivity = async (act: Activity): Promise<void> => fetchAPI('activities', 'POST', act);
export const deleteActivity = async (id: string): Promise<void> => fetchAPI(`activities?id=${id}`, 'DELETE', { id });

// --- ATTENDANCE ---
export const getAttendance = async (activityId?: string): Promise<AttendanceRecord[]> => {
  return fetchAPI(activityId ? `attendance?activityId=${activityId}` : 'attendance');
};

export const markAttendance = async (activityId: string, studentId: string): Promise<{ status: 'success' | 'already_present' | 'student_not_found'; student?: Student }> => {
  const allStudents = await getStudents();
  const student = allStudents.find(s => s.id === studentId);
  if (!student) return { status: 'student_not_found' };

  const attendance = await getAttendance(activityId);
  if (attendance.some(a => a.studentId === studentId)) {
    return { status: 'already_present', student };
  }

  const record: AttendanceRecord = {
    id: `${activityId}_${studentId}`,
    activityId,
    studentId,
    timestamp: new Date().toISOString()
  };
  await fetchAPI('attendance', 'POST', record);
  return { status: 'success', student };
};

export const deleteAttendance = async (activityId: string, studentId: string): Promise<void> => {
  const id = `${activityId}_${studentId}`;
  await fetchAPI(`attendance?id=${id}`, 'DELETE', { id });
};

// --- GRADES ---
export const getGrades = async (subjectId?: string): Promise<SubjectGrade[]> => {
  return fetchAPI(subjectId ? `grades?subjectId=${subjectId}` : 'grades');
}
export const saveGrade = async (grade: SubjectGrade): Promise<void> => {
  await fetchAPI('grades', 'POST', grade);
}

// --- DRL ---
export const getGradingPeriods = async (): Promise<GradingPeriod[]> => fetchAPI('grading_periods');
export const createGradingPeriod = async (p: GradingPeriod): Promise<void> => fetchAPI('grading_periods', 'POST', p);
export const updateGradingPeriod = async (p: GradingPeriod): Promise<void> => fetchAPI('grading_periods', 'PUT', p);
export const deleteGradingPeriod = async (id: string): Promise<void> => fetchAPI(`grading_periods?id=${id}`, 'DELETE', { id });

export const getDRLScores = async (): Promise<DRLScore[]> => fetchAPI('drl_scores');
export const saveDRLScore = async (score: DRLScore): Promise<void> => fetchAPI('drl_scores', 'POST', score);

// --- FILE UPLOAD ---
export const uploadProofImage = async (file: File, studentId: string, category: string): Promise<string> => {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await fetchAPI('upload', 'POST', {
          fileName: file.name,
          fileData: base64,
          studentId,
          category
        });
        if (res.url_anh) resolve(res.url_anh);
        else reject(new Error("Upload failed"));
      } catch (e) { reject(e); }
    };
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
};

export const deleteProofImage = async (studentId: string, category: string, url?: string): Promise<void> => {
  let endpoint = `delimg?tk_sv=${encodeURIComponent(studentId)}&muc_danh_gia=${encodeURIComponent(category)}`;
  if (url) {
    endpoint += `&url=${encodeURIComponent(url)}`;
  }
  await fetchAPI(endpoint, 'GET');
}

export const getProofImages = async (studentId: string, categories: string[] = []): Promise<Record<string, string[]>> => {
  const baseUrl = getApiUrl();
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY
  };

  const normalizeProofs = (raw: any): Record<string, string[]> => {
    const normalized: Record<string, string[]> = {};
    if (!raw || typeof raw !== 'object') return normalized;

    Object.entries(raw).forEach(([k, v]) => {
      if (Array.isArray(v)) {
        const urls = v.filter((url): url is string => typeof url === 'string' && !!url);
        if (urls.length) normalized[k] = urls;
      } else if (typeof v === 'string' && v) {
        normalized[k] = [v];
      }
    });

    return normalized;
  };

  if (proofApiMode !== 'legacy') {
    try {
      const bulkRes = await fetch(`${baseUrl}/api/get-proofs?tk_sv=${encodeURIComponent(studentId)}`, {
        method: 'GET',
        headers,
        mode: 'cors',
        credentials: 'omit'
      });

      if (bulkRes.ok) {
        proofApiMode = 'bulk';
        const bulkData = await bulkRes.json();
        return normalizeProofs(bulkData?.proofs);
      }

      if (bulkRes.status === 404) {
        proofApiMode = 'legacy';
      } else {
        // 429/5xx: khong fallback de tranh bao request.
        return {};
      }
    } catch {
      return {};
    }
  }

  const legacyProofs: Record<string, string[]> = {};
  const uniqCategories = Array.from(new Set(categories)).filter(Boolean);

  // Fallback legacy chi query nhung muc da biet co du lieu.
  if (uniqCategories.length === 0) return legacyProofs;

  for (const category of uniqCategories) {
    try {
      const res = await fetch(`${baseUrl}/api/get-proof?tk_sv=${encodeURIComponent(studentId)}&muc_danh_gia=${encodeURIComponent(category)}`, {
        method: 'GET',
        headers,
        mode: 'cors',
        credentials: 'omit'
      });

      if (res.status === 429) {
        break;
      }

      if (!res.ok) continue;

      const data = await res.json();
      if (data?.url_anh) {
        legacyProofs[category] = [data.url_anh];
      }
    } catch {
      // Ignore to continue loading other categories.
    }
  }

  return legacyProofs;
}
