import type { WorkSheet } from 'xlsx';

export type StudentImportField = 'id' | 'lastName' | 'firstName' | 'fullName' | 'dob' | 'email';

export type StudentColumnMapping = Partial<Record<StudentImportField, number>>;

export type StudentImportRow = {
  id: string;
  lastName: string;
  firstName: string;
  dob: string;
  email?: string;
};

export type StudentImportParseResult = {
  students: StudentImportRow[];
  warnings: string[];
  errors: string[];
  meta?: {
    headerRowIndex?: number;
    mapping?: StudentColumnMapping;
    usedFallbackFixedColumns?: boolean;
  };
};

export type AutoFitOptions = {
  minWidth?: number;
  maxWidth?: number;
  padding?: number;
  /** Multiply measured string length to better match Excel's visual width (fonts are proportional). */
  widthFactor?: number;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const valueToText = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
};

const removeAccentsLocal = (str: string) => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd');
};

const normalizeHeader = (value: unknown): string => {
  const raw = valueToText(value);
  const noAccents = removeAccentsLocal(raw);
  return noAccents
    .toLowerCase()
    .trim()
    .replace(/[_\-\/\\|]+/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const tokenize = (normalized: string): string[] => {
  if (!normalized) return [];
  return normalized.split(' ').filter(Boolean);
};

const jaccard = (a: string[], b: string[]): number => {
  if (a.length === 0 || b.length === 0) return 0;
  const sa = new Set(a);
  const sb = new Set(b);
  let inter = 0;
  for (const t of sa) if (sb.has(t)) inter++;
  const union = sa.size + sb.size - inter;
  return union === 0 ? 0 : inter / union;
};

const scoreHeader = (headerNorm: string, synonymNorm: string): number => {
  if (!headerNorm || !synonymNorm) return 0;
  if (headerNorm === synonymNorm) return 1;
  if (headerNorm.includes(synonymNorm) || synonymNorm.includes(headerNorm)) return 0.9;
  const ht = tokenize(headerNorm);
  const st = tokenize(synonymNorm);
  const jac = jaccard(ht, st);
  if (jac >= 0.6) return Math.min(0.85, jac);
  return jac;
};

const FIELD_SYNONYMS: Record<StudentImportField, string[]> = {
  id: ['mssv', 'ma sv', 'ma so sv', 'ma sinh vien', 'student id', 'student code', 'id'],
  lastName: ['ho dem', 'ho lot', 'ho', 'surname', 'last name', 'lastname'],
  firstName: ['ten', 'given name', 'first name', 'firstname'],
  fullName: ['ho va ten', 'ho ten', 'ten sinh vien', 'full name', 'fullname', 'name'],
  dob: ['ngay sinh', 'dob', 'birth date', 'birthday', 'date of birth'],
  email: ['email', 'mail', 'e mail', 'student email'],
};

type HeaderDetect = {
  headerRowIndex: number;
  mapping: StudentColumnMapping;
  confidence: Partial<Record<StudentImportField, number>>;
};

const detectMappingFromHeaderRow = (row: unknown[]): Omit<HeaderDetect, 'headerRowIndex'> => {
  const candidates: Array<{ field: StudentImportField; col: number; score: number }> = [];

  for (let col = 0; col < row.length; col++) {
    const headerNorm = normalizeHeader(row[col]);
    if (!headerNorm) continue;
    (Object.keys(FIELD_SYNONYMS) as StudentImportField[]).forEach((field) => {
      let best = 0;
      for (const s of FIELD_SYNONYMS[field]) {
        const synNorm = normalizeHeader(s);
        const score = scoreHeader(headerNorm, synNorm);
        if (score > best) best = score;
      }
      if (best > 0) candidates.push({ field, col, score: best });
    });
  }

  // Greedy assign highest score first; ensure one column only maps to one field.
  candidates.sort((a, b) => b.score - a.score);
  const mapping: StudentColumnMapping = {};
  const confidence: Partial<Record<StudentImportField, number>> = {};
  const usedCols = new Set<number>();
  const fieldPriority: Record<StudentImportField, number> = {
    id: 100,
    fullName: 90,
    lastName: 80,
    firstName: 70,
    dob: 60,
    email: 50,
  };

  for (const c of candidates) {
    if (mapping[c.field] !== undefined) continue;
    if (usedCols.has(c.col)) continue;
    if (c.score < 0.6) continue;
    mapping[c.field] = c.col;
    confidence[c.field] = c.score;
    usedCols.add(c.col);
  }

  // If a field was not mapped but conflicts prevented it, allow overriding lower priority.
  // (Lightweight: attempt to map remaining fields by ignoring usedCols if the target is not critical.)
  for (const field of (Object.keys(FIELD_SYNONYMS) as StudentImportField[]).sort(
    (a, b) => fieldPriority[b] - fieldPriority[a]
  )) {
    if (mapping[field] !== undefined) continue;
    const best = candidates
      .filter((c) => c.field === field)
      .sort((a, b) => b.score - a.score)[0];
    if (best && best.score >= 0.75) {
      mapping[field] = best.col;
      confidence[field] = best.score;
    }
  }

  return { mapping, confidence };
};

const detectHeaderRow = (data: unknown[][], maxScanRows = 12): HeaderDetect | null => {
  const limit = Math.min(maxScanRows, data.length);
  let best: HeaderDetect | null = null;
  let bestScore = 0;

  for (let r = 0; r < limit; r++) {
    const row = data[r] || [];
    const { mapping, confidence } = detectMappingFromHeaderRow(row);
    const idScore = confidence.id || 0;
    const nameScore = Math.max(confidence.fullName || 0, confidence.lastName || 0, confidence.firstName || 0);
    if (idScore < 0.6 || nameScore < 0.6) continue;

    const total =
      (confidence.id || 0) +
      (confidence.fullName || 0) +
      (confidence.lastName || 0) +
      (confidence.firstName || 0) +
      (confidence.dob || 0) +
      (confidence.email || 0);
    if (total > bestScore) {
      bestScore = total;
      best = { headerRowIndex: r, mapping, confidence };
    }
  }

  return best;
};

const cellToCleanString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'number') {
    // Avoid scientific notation / decimals for IDs
    if (Number.isFinite(value)) {
      const asInt = Math.trunc(value);
      if (Math.abs(value - asInt) < 1e-9) return String(asInt);
    }
    return String(value);
  }
  return String(value).trim();
};

const splitFullName = (fullNameRaw: string): { lastName: string; firstName: string } => {
  const fullName = fullNameRaw.replace(/\s+/g, ' ').trim();
  if (!fullName) return { lastName: '', firstName: '' };
  const parts = fullName.split(' ');
  if (parts.length === 1) return { lastName: '', firstName: parts[0] };
  return { lastName: parts.slice(0, -1).join(' '), firstName: parts[parts.length - 1] };
};

/**
 * Parse student rows from an Excel worksheet converted with `XLSX.utils.sheet_to_json(ws, { header: 1 })`.
 * - Auto-detects header row and column mapping by name.
 * - Falls back to legacy fixed columns if no header is detected.
 */
export function parseStudentsFromAoa(data: unknown[][]): StudentImportParseResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const students: StudentImportRow[] = [];

  if (!data || data.length === 0) {
    return { students: [], warnings: [], errors: ['File Excel trống hoặc không đọc được dữ liệu.'] };
  }

  const header = detectHeaderRow(data);
  let headerRowIndex = header?.headerRowIndex ?? 0;
  let mapping: StudentColumnMapping = header?.mapping ?? {};
  let usedFallbackFixedColumns = false;

  if (!header) {
    // Legacy fallback: [STT, MSSV, Họ Đệm, Tên, Ngày Sinh]
    usedFallbackFixedColumns = true;
    warnings.push('Không nhận diện được hàng tiêu đề; dùng chế độ cột cố định (MSSV=B, Họ đệm=C, Tên=D, Ngày sinh=E).');
    mapping = { id: 1, lastName: 2, firstName: 3, dob: 4 };
    headerRowIndex = 0;
  }

  if (mapping.id === undefined) {
    errors.push('Thiếu cột MSSV/Mã SV (bắt buộc).');
    return { students: [], warnings, errors, meta: { headerRowIndex, mapping, usedFallbackFixedColumns } };
  }

  const startRow = headerRowIndex + 1;
  for (let r = startRow; r < data.length; r++) {
    const row = data[r] || [];
    const rowArr = Array.isArray(row) ? row : [];
    const anyValue = rowArr.some((c) => cellToCleanString(c) !== '');
    if (!anyValue) continue;

    const id = cellToCleanString(rowArr[mapping.id]);
    if (!id) continue;

    const lastName = mapping.lastName !== undefined ? cellToCleanString(rowArr[mapping.lastName]) : '';
    const firstName = mapping.firstName !== undefined ? cellToCleanString(rowArr[mapping.firstName]) : '';
    const fullName = mapping.fullName !== undefined ? cellToCleanString(rowArr[mapping.fullName]) : '';
    const dob = mapping.dob !== undefined ? cellToCleanString(rowArr[mapping.dob]) : '';
    const email = mapping.email !== undefined ? cellToCleanString(rowArr[mapping.email]) : '';

    let finalLastName = lastName;
    let finalFirstName = firstName;
    if ((!finalLastName || !finalFirstName) && fullName) {
      const split = splitFullName(fullName);
      if (!finalLastName) finalLastName = split.lastName;
      if (!finalFirstName) finalFirstName = split.firstName;
    }

    students.push({
      id: id.trim(),
      lastName: finalLastName.trim(),
      firstName: finalFirstName.trim(),
      dob: dob.trim(),
      email: email ? email.trim() : undefined,
    });
  }

  if (students.length === 0) {
    errors.push('Không tìm thấy dòng dữ liệu sinh viên hợp lệ (kiểm tra MSSV và hàng tiêu đề).');
  }

  return { students, warnings, errors, meta: { headerRowIndex, mapping, usedFallbackFixedColumns } };
}

/**
 * Auto-fit worksheet column widths based on the longest text in each column.
 * Works best when the sheet was generated from an array of objects.
 */
export function autoFitColumns(
  ws: WorkSheet,
  rows: Array<Record<string, unknown>>,
  options: AutoFitOptions = {}
) {
  const { minWidth = 10, maxWidth = 100, padding = 6, widthFactor = 1.1 } = options;

  if (!rows || rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  if (headers.length === 0) return;

  const maxLens = headers.map((h) => Array.from(h).length);

  for (const row of rows) {
    headers.forEach((header, idx) => {
      const text = valueToText(row[header]);
      const len = Array.from(text).length;
      if (len > maxLens[idx]) maxLens[idx] = len;
    });
  }

  ws['!cols'] = maxLens.map((len) => {
    const weighted = Math.ceil(len * widthFactor);
    return { wch: clamp(weighted + padding, minWidth, maxWidth) };
  });
}
