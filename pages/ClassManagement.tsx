
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ClassGroup, Student, User } from '../types';
import { getClasses, createClass, getStudents, importStudents, deleteClass, updateClass, createUsersBatch, getUsers, updateUser, createUser, generateStudentEmail, createStudent, updateStudent, deleteStudent, deleteUser, getActivities } from '../services/storage';
import { Plus, Download, FileSpreadsheet, Trash2, Edit2, X, Check, AlertTriangle, RefreshCw, Save, UserPlus, Lock, ArrowUp, Bell, Search, School, Users as UsersIcon, Activity, UserRoundPlus, MoreVertical, SlidersHorizontal } from 'lucide-react';
import * as XLSX from 'xlsx';
import { autoFitColumns, parseStudentsFromAoa } from '../services/excel';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

const ClassManagement: React.FC = () => {
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [users, setUsers] = useState<User[]>([]); // Danh sách tài khoản tương ứng
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  
  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  
  // Edit/Delete State
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  
  // Password Editing State
  const [editingPassword, setEditingPassword] = useState<Record<string, string>>({});

  // Add/Remove Student Modals
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [addStudentForm, setAddStudentForm] = useState<{ id: string; lastName: string; firstName: string; dob: string; email: string }>(
    { id: '', lastName: '', firstName: '', dob: '', email: '' }
  );
  const [addStudentCreateAccount, setAddStudentCreateAccount] = useState(true);
  const [addStudentAutoEmail, setAddStudentAutoEmail] = useState(true);

  const [removeTarget, setRemoveTarget] = useState<Student | null>(null);
  const [removeAlsoDeleteAccount, setRemoveAlsoDeleteAccount] = useState(false);

  // Edit Student State
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editStudentForm, setEditStudentForm] = useState<{
    id: string;
    lastName: string;
    firstName: string;
    dob: string;
    email: string;
  }>({ id: '', lastName: '', firstName: '', dob: '', email: '' });
  const [editStudentUpdateAccount, setEditStudentUpdateAccount] = useState(true);

  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeClassFilter, setActiveClassFilter] = useState('ALL');
  const [summaryStats, setSummaryStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    totalActivities: 0,
    totalAccounts: 0,
  });
  const [classStudentCounts, setClassStudentCounts] = useState<Record<string, number>>({});

  const toSafeString = (value: unknown, fallback = ''): string => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return `${value}`;
    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      const pick = obj.id ?? obj.value ?? obj.name;
      if (typeof pick === 'string' || typeof pick === 'number' || typeof pick === 'boolean' || typeof pick === 'bigint') {
        return `${pick}`;
      }
      return fallback;
    }
    return fallback;
  };
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sắp xếp sinh viên theo tên (firstName, lastName)
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      // So sánh firstName trước
      const firstNameCompare = (a.firstName || '').localeCompare(b.firstName || '', 'vi');
      if (firstNameCompare !== 0) return firstNameCompare;
      // Nếu firstName giống nhau, so sánh lastName
      return (a.lastName || '').localeCompare(b.lastName || '', 'vi');
    });
  }, [students]);

  const getClassTag = (className: string) => {
    const upper = (className || '').toUpperCase();
    if (upper.includes('CNCD')) return 'CNCD';
    if (upper.includes('CNTT')) return 'CNTT';
    if (upper.includes('CNDT')) return 'CNDT';
    return 'KHAC';
  };

  const classFilters = useMemo(() => {
    const tags = Array.from(new Set(classes.map(c => getClassTag(toSafeString(c.name, toSafeString(c.id, ''))))));
    return ['ALL', ...tags];
  }, [classes]);

  const filteredClasses = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    return classes.filter((cls) => {
      const className = toSafeString(cls.name, '');
      const classId = toSafeString(cls.id, '');
      const byFilter = activeClassFilter === 'ALL' || getClassTag(className || classId) === activeClassFilter;
      const byKeyword = !keyword || className.toLowerCase().includes(keyword) || classId.toLowerCase().includes(keyword);
      return byFilter && byKeyword;
    });
  }, [classes, searchKeyword, activeClassFilter]);

  const filteredStudents = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) return sortedStudents;
    return sortedStudents.filter((s) => {
      const sid = toSafeString(s.id, '');
      const fullName = `${toSafeString(s.lastName, '')} ${toSafeString(s.firstName, '')}`.toLowerCase();
      return sid.toLowerCase().includes(keyword) || fullName.includes(keyword);
    });
  }, [sortedStudents, searchKeyword]);

  const getInitials = (student: Student) => {
    const l = (student.lastName || '').trim();
    const f = (student.firstName || '').trim();
    return `${l.charAt(0)}${f.charAt(0)}`.toUpperCase() || 'SV';
  };

  // Scroll listener for back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadClassData(selectedClassId);
    } else {
      setStudents([]);
      setUsers([]);
    }
  }, [selectedClassId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
        const [classData, allStudents, allActivities, allUsers] = await Promise.all([
          getClasses(),
          getStudents(),
          getActivities(),
          getUsers(),
        ]);

        const normalizedClasses = classData.map((c, index) => {
          const id = toSafeString(c.id, `CLASS_${index + 1}`);
          const name = toSafeString(c.name, id);
          return { ...c, id, name };
        });

        setClasses(normalizedClasses);
        const countMap = allStudents.reduce<Record<string, number>>((acc, s, index) => {
          const sidClass = toSafeString(s.classId, `UNKNOWN_${index}`);
          if (!sidClass) return acc;
          acc[sidClass] = (acc[sidClass] || 0) + 1;
          return acc;
        }, {});
        setClassStudentCounts(countMap);
        setSummaryStats({
          totalClasses: normalizedClasses.length,
          totalStudents: allStudents.length,
          totalActivities: allActivities.length,
          totalAccounts: allUsers.filter(u => u.role === 'student').length,
        });
    } catch (e: any) { 
        console.error(e); 
        setError(e.message || "Không thể tải danh sách lớp.");
    } finally {
        setLoading(false);
    }
  };

  const loadClassData = async (classId: string) => {
    try {
        setLoading(true);
        const [studentData, allUsers] = await Promise.all([
            getStudents(classId),
            getUsers()
        ]);
        const normalizedStudents = studentData.map((s, index) => ({
          ...s,
          id: toSafeString(s.id, `SV_${index + 1}`),
          classId: toSafeString(s.classId, classId),
          firstName: toSafeString(s.firstName, ''),
          lastName: toSafeString(s.lastName, ''),
          dob: toSafeString(s.dob, ''),
          email: toSafeString(s.email, ''),
        }));

        setStudents(normalizedStudents);
        
        // Filter users that belong to this class OR match student IDs
        const classUsers = allUsers.filter(u => 
          u.classId === classId || normalizedStudents.some(s => s.id === u.username)
        );
        setUsers(classUsers);
        setEditingPassword({}); // Reset edit state
    } catch (e) { 
        console.error(e); 
        setError("Lỗi tải dữ liệu sinh viên/tài khoản.");
    } finally {
        setLoading(false);
    }
  };

  const handleCreateClass = async () => {
    if (!newClassName.trim()) return;
    try {
        const newClass: ClassGroup = {
            id: newClassName.trim(),
            name: newClassName.trim(),
        };
        await createClass(newClass);
        setNewClassName('');
        setShowCreateModal(false);
        fetchData();
    } catch (e: any) {
        alert("Lỗi tạo lớp: " + e.message);
    }
  };

  const handleUpdateClass = async (id: string) => {
     if (!editName.trim()) return;
     try {
         await updateClass(id, editName);
         setEditingClassId(null);
         fetchData();
     } catch(e: any) { alert("Lỗi cập nhật: " + e.message); }
  };

  const handleDeleteClass = async (id: string, name: string) => {
     if (window.confirm(`Bạn có chắc muốn xóa lớp "${name}"? Thao tác này sẽ xóa lớp và TẤT CẢ sinh viên trong lớp khỏi database.`)) {
        try {
            await deleteClass(id);
            if (selectedClassId === id) setSelectedClassId(null);
            fetchData();
        } catch(e: any) { alert("Lỗi xóa: " + e.message); }
     }
  };

  // --- ACCOUNT MANAGEMENT HANDLERS ---

  const handlePasswordChangeInput = (username: string, val: string) => {
      setEditingPassword(prev => ({ ...prev, [username]: val }));
  };

  const handleSavePassword = async (user: User) => {
      const newPass = editingPassword[user.username];
      if (newPass === undefined || newPass === user.password) return; // No change
      
      if (!window.confirm(`Đổi mật khẩu cho sinh viên ${user.name} thành "${newPass}"?`)) return;

      try {
          await updateUser({ ...user, password: newPass });
          
          // Update local state
          setUsers(prev => prev.map(u => u.username === user.username ? { ...u, password: newPass } : u));
          setEditingPassword(prev => {
              const newState = { ...prev };
              delete newState[user.username];
              return newState;
          });
          alert("Đã cập nhật mật khẩu!");
      } catch (e) {
          alert("Lỗi cập nhật: " + (e as Error).message);
      }
  };

  const handleCreateSingleAccount = async (student: Student) => {
      const cleanId = student.id.trim();
      const password = cleanId.length > 3 ? cleanId.slice(-3) : cleanId;
      
      // Auto generate email if not present
      const email = student.email || generateStudentEmail(student.lastName, student.firstName, cleanId);

      const newUser: User = {
          username: cleanId,
          password: password,
          name: `${student.lastName} ${student.firstName}`.trim(),
          role: 'student',
          classId: student.classId,
          email: email
      };

      try {
          await createUser(newUser);
          setUsers(prev => [...prev, newUser]);
          alert(`Đã tạo tài khoản cho ${cleanId}.\nEmail: ${email}\nMật khẩu: ${password}`);
      } catch (e) {
          alert("Lỗi tạo tài khoản: " + (e as Error).message);
      }
  };

    const resetAddStudentForm = () => {
      setAddStudentForm({ id: '', lastName: '', firstName: '', dob: '', email: '' });
      setAddStudentCreateAccount(true);
      setAddStudentAutoEmail(true);
    };

    const getAddStudentEmail = (): string => {
      const cleanId = addStudentForm.id.trim();
      if (!cleanId) return addStudentForm.email;
      if (!addStudentAutoEmail) return addStudentForm.email;
      const lastName = addStudentForm.lastName.trim();
      const firstName = addStudentForm.firstName.trim();
      if (!lastName && !firstName) return addStudentForm.email;
      return generateStudentEmail(lastName, firstName, cleanId);
    };

    const handleSubmitAddStudent = async () => {
      if (!selectedClassId) return;
      const id = addStudentForm.id.trim();
      const lastName = addStudentForm.lastName.trim();
      const firstName = addStudentForm.firstName.trim();
      const dob = addStudentForm.dob.trim();
      const email = getAddStudentEmail()?.trim();

      if (!id) return alert('Vui lòng nhập MSSV');
      if (!lastName && !firstName) return alert('Vui lòng nhập họ tên');

      setLoading(true);
      try {
        // If student already exists anywhere, allow moving to this class
        const allStudents = await getStudents();
        const existing = allStudents.find(s => String(s.id).trim().toLowerCase() === id.toLowerCase());

        if (existing) {
          if (existing.classId === selectedClassId) {
            alert(`Sinh viên ${id} đã thuộc lớp này.`);
            return;
          }
          const ok = window.confirm(
            `MSSV ${id} đã tồn tại và đang thuộc lớp "${existing.classId || 'Chưa gán lớp'}".\n` +
            `Bạn có muốn CHUYỂN sang lớp "${selectedClassId}" không?`
          );
          if (!ok) return;

          await updateStudent({
            id,
            classId: selectedClassId,
            // if admin typed new info, keep it; otherwise keep existing
            lastName: lastName || existing.lastName,
            firstName: firstName || existing.firstName,
            dob: dob || existing.dob,
            email: email || existing.email,
          });
        } else {
          const newStudent: Student = {
            id,
            lastName,
            firstName,
            dob,
            classId: selectedClassId,
            email: email || generateStudentEmail(lastName, firstName, id),
          };
          await createStudent(newStudent);
        }

        // Optionally create/update account
        if (addStudentCreateAccount) {
          const allUsers = await getUsers();
          const existingUser = allUsers.find(u => u.username.trim().toLowerCase() === id.toLowerCase());
          const password = id.length > 3 ? id.slice(-3) : id;
          const userPayload: User = {
            username: id,
            password: existingUser?.password || password,
            name: `${lastName} ${firstName}`.trim(),
            role: existingUser?.role || 'student',
            classId: selectedClassId,
            email: email || undefined,
          };
          if (existingUser) {
            await updateUser({ ...existingUser, ...userPayload });
          } else {
            await createUser(userPayload);
          }
        }

        await loadClassData(selectedClassId);
        setShowAddStudentModal(false);
        resetAddStudentForm();
      } catch (e: any) {
        alert('Lỗi thêm sinh viên: ' + (e?.message || String(e)));
      } finally {
        setLoading(false);
      }
    };

    const handleRemoveFromClass = async (student: Student) => {
      if (!selectedClassId) return;
      setLoading(true);
      try {
        await updateStudent({ id: student.id, classId: '' });
        // Keep user account consistent (optional)
        const user = users.find(u => u.username === student.id);
        if (user && user.classId === selectedClassId) {
          await updateUser({ ...user, classId: '' });
        }
        await loadClassData(selectedClassId);
        setRemoveTarget(null);
        setRemoveAlsoDeleteAccount(false);
      } catch (e: any) {
        alert('Lỗi xóa khỏi lớp: ' + (e?.message || String(e)));
      } finally {
        setLoading(false);
      }
    };

    // --- EDIT STUDENT HANDLERS ---
    const openEditStudentModal = (student: Student) => {
      setEditingStudent(student);
      setEditStudentForm({
        id: student.id,
        lastName: student.lastName,
        firstName: student.firstName,
        dob: student.dob,
        email: student.email || generateStudentEmail(student.lastName, student.firstName, student.id),
      });
      setEditStudentUpdateAccount(true);
    };

    const handleSubmitEditStudent = async () => {
      if (!editingStudent || !selectedClassId) return;

      const newId = editStudentForm.id.trim();
      const lastName = editStudentForm.lastName.trim();
      const firstName = editStudentForm.firstName.trim();
      const dob = editStudentForm.dob.trim();
      const email = editStudentForm.email.trim();

      if (!newId) return alert('MSSV không được để trống');
      if (!lastName && !firstName) return alert('Vui lòng nhập họ tên');

      // Check if MSSV changed and new one already exists
      const originalId = editingStudent.id;
      if (newId !== originalId) {
        const allStudents = await getStudents();
        const duplicateStudent = allStudents.find(
          s => s.id.trim().toLowerCase() === newId.toLowerCase() && s.id !== originalId
        );
        if (duplicateStudent) {
          return alert(`MSSV "${newId}" đã tồn tại cho sinh viên khác.`);
        }
      }

      setLoading(true);
      try {
        // If MSSV changed, we need to delete old and create new
        if (newId !== originalId) {
          // Delete old student record
          await deleteStudent(originalId);
          // Create new student with new ID
          const newStudent: Student = {
            id: newId,
            lastName,
            firstName,
            dob,
            classId: selectedClassId,
            email,
          };
          await createStudent(newStudent);

          // Handle user account
          if (editStudentUpdateAccount) {
            const allUsers = await getUsers();
            const oldUser = allUsers.find(u => u.username === originalId);
            if (oldUser) {
              // Delete old user account
              await deleteUser(originalId);
              // Create new user with new username
              const newUser: User = {
                username: newId,
                password: oldUser.password,
                name: `${lastName} ${firstName}`.trim(),
                role: oldUser.role,
                classId: selectedClassId,
                email,
              };
              await createUser(newUser);
            }
          }
        } else {
          // MSSV unchanged, just update
          await updateStudent({
            id: newId,
            lastName,
            firstName,
            dob,
            classId: selectedClassId,
            email,
          });

          // Update user account if needed
          if (editStudentUpdateAccount) {
            const allUsers = await getUsers();
            const existingUser = allUsers.find(u => u.username === newId);
            if (existingUser) {
              await updateUser({
                ...existingUser,
                name: `${lastName} ${firstName}`.trim(),
                classId: selectedClassId,
                email,
              });
            }
          }
        }

        await loadClassData(selectedClassId);
        setEditingStudent(null);
        alert('Đã cập nhật thông tin sinh viên!');
      } catch (e: any) {
        alert('Lỗi cập nhật: ' + (e?.message || String(e)));
      } finally {
        setLoading(false);
      }
    };

    const handleDeleteStudentPermanently = async (student: Student) => {
      if (!selectedClassId) return;
      const ok = window.confirm(
        `XÓA VĨNH VIỄN sinh viên ${student.id}?\n` +
        `Lưu ý: dữ liệu điểm danh/điểm/DRL có thể vẫn tham chiếu MSSV này.`
      );
      if (!ok) return;

      setLoading(true);
      try {
        await deleteStudent(student.id);
        if (removeAlsoDeleteAccount) {
          try {
            await deleteUser(student.id);
          } catch {
            // ignore account deletion failures
          }
        }
        await loadClassData(selectedClassId);
        setRemoveTarget(null);
        setRemoveAlsoDeleteAccount(false);
      } catch (e: any) {
        alert('Lỗi xóa vĩnh viễn: ' + (e?.message || String(e)));
      } finally {
        setLoading(false);
      }
    };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedClassId) {
      alert("Vui lòng chọn lớp trước khi nhập sinh viên!");
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });
        const parsed = parseStudentsFromAoa(data as any);
        if (parsed.errors.length > 0) {
          alert('Không thể nhập Excel:\n- ' + parsed.errors.join('\n- '));
          return;
        }
        if (parsed.warnings.length > 0) {
          console.warn('Excel import warnings:', parsed.warnings);
        }

        const seen = new Set<string>();
        const newStudents: Student[] = parsed.students
          .map((s) => {
            const cleanId = s.id.toString().trim();
            const lastName = (s.lastName || '').toString().trim();
            const firstName = (s.firstName || '').toString().trim();
            const dob = (s.dob || '').toString().trim();
            const email = s.email && s.email.includes('@') ? s.email : generateStudentEmail(lastName, firstName, cleanId);
            return {
              id: cleanId,
              lastName,
              firstName,
              dob,
              classId: selectedClassId,
              email,
            } as Student;
          })
          .filter((s) => {
            if (!s.id) return false;
            const key = s.id.toUpperCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });

        if (newStudents.length > 0) {
          // 1. Import Students into Database (including email)
          await importStudents(newStudents);
          
          // 2. Automatically Create User Accounts
          const newUsers: User[] = newStudents.map(s => {
              const cleanId = s.id.toString().trim();
              const password = cleanId.length > 3 ? cleanId.slice(-3) : cleanId;
              
              return {
                  username: cleanId,
                  password: password,
                  name: `${s.lastName} ${s.firstName}`.trim(),
                  role: 'student',
                  classId: selectedClassId,
                  email: s.email // Sync email to user account
              };
          });
          
          const userRes = await createUsersBatch(newUsers);

          await loadClassData(selectedClassId);
          alert(`Thành công!\n- Đã nhập ${newStudents.length} sinh viên (đã tự tạo email).\n- Đã tự động tạo ${userRes.count} tài khoản đăng nhập.`);
        } else {
            alert("Không tìm thấy dữ liệu. Kiểm tra cột MSSV/Mã SV.");
        }
      } catch (error) {
        alert("Lỗi: " + (error as Error).message);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const downloadStudentImportTemplate = () => {
    const rows = [
      {
        'MSSV/Mã SV': 'CNCD2511016',
        'Họ đệm': 'Lê Khánh',
        'Tên': 'Duy',
        'Ngày sinh': '2004-01-15',
        'Email (tuỳ chọn)': '',
      },
      {
        'MSSV/Mã SV': 'CNCD2511017',
        'Họ đệm': 'Nguyễn Văn',
        'Tên': 'A',
        'Ngày sinh': '2004-05-20',
        'Email (tuỳ chọn)': '',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(rows);
    autoFitColumns(ws, rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SinhVien');
    XLSX.writeFile(wb, 'Mau_Nhap_SinhVien.xlsx');
  };

  const createStudentCardImage = async (student: Student): Promise<string> => {
    const canvas = document.createElement('canvas');
    canvas.width = 600; canvas.height = 250;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 600, 250);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, 596, 246);

    try {
        const qrDataUrl = await QRCode.toDataURL(student.id, { width: 200, margin: 1 });
        const qrImg = new Image();
        qrImg.src = qrDataUrl;
        await new Promise((resolve) => { qrImg.onload = resolve; });
        ctx.drawImage(qrImg, 20, 25, 200, 200);
    } catch (e) {}

    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 28px Arial';
    ctx.fillText(`${student.lastName} ${student.firstName}`, 240, 80);
    ctx.font = '24px Arial';
    ctx.fillText(`MSSV: ${student.id}`, 240, 130);
    ctx.font = '22px Arial';
    ctx.fillStyle = '#555555';
    ctx.fillText(`Ngày sinh: ${student.dob}`, 240, 170);
    return canvas.toDataURL('image/png');
  };

  const generateQRPDF = async () => {
    if (students.length === 0) {
      alert("Lớp chưa có sinh viên."); return;
    }
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;
    const imgWidth = 170;
    const imgHeight = 70;
    
    doc.setFont("helvetica", "bold");
    doc.text(`QR Code - ${classes.find(c => c.id === selectedClassId)?.name}`, pageWidth / 2, 10, { align: 'center' });

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      if (yPos + imgHeight > 280) {
        doc.addPage();
        yPos = 20;
      }
      const imgData = await createStudentCardImage(s);
      doc.addImage(imgData, 'PNG', (pageWidth - imgWidth) / 2, yPos, imgWidth, imgHeight);
      yPos += imgHeight + 10;
    }
    doc.save(`QR_Lop_${selectedClassId}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-sky-500 p-2 rounded-lg text-white">
              <School size={20} />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold leading-tight tracking-tight">Quản lý Lớp học & Tài khoản</h1>
              <p className="text-xs text-slate-500">Hệ thống quản trị viên</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-slate-100 rounded-full text-slate-600" type="button">
              <Bell size={18} />
            </button>
            <div className="h-8 w-8 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-600 font-bold text-sm">AD</div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 text-sm font-medium">Tổng số lớp</span>
              <School className="text-sky-500" size={20} />
            </div>
            <div className="text-2xl font-bold">{summaryStats.totalClasses}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 text-sm font-medium">Tổng sinh viên</span>
              <UsersIcon className="text-sky-500" size={20} />
            </div>
            <div className="text-2xl font-bold">{summaryStats.totalStudents}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 text-sm font-medium">Hoạt động</span>
              <Activity className="text-green-500" size={20} />
            </div>
            <div className="text-2xl font-bold text-green-500">{summaryStats.totalActivities}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 text-sm font-medium">Tài khoản SV</span>
              <UserRoundPlus className="text-sky-500" size={20} />
            </div>
            <div className="text-2xl font-bold">{summaryStats.totalAccounts}</div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:max-w-md">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                placeholder="Tìm kiếm lớp học, MSSV, sinh viên..."
                type="text"
              />
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={downloadStudentImportTemplate}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 px-4 py-2 rounded-xl font-semibold transition-colors"
              type="button"
            >
              <Download size={18} /> Nhập từ Excel
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-sky-500 text-white hover:bg-sky-600 px-4 py-2 rounded-xl font-semibold shadow-sm transition-colors"
              type="button"
            >
              <Plus size={18} /> Thêm lớp mới
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {classFilters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveClassFilter(f)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${activeClassFilter === f ? 'bg-sky-500 text-white border-sky-500' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              type="button"
            >
              {f === 'ALL' ? 'Tất cả lớp' : f}
            </button>
          ))}
        </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md flex items-center justify-between">
            <div className="flex items-center gap-3">
                <AlertTriangle className="text-red-500" />
                <div>
                    <h3 className="text-red-800 font-bold">Lỗi Database</h3>
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            </div>
            <button onClick={fetchData} className="text-red-700 hover:underline flex items-center gap-1 font-bold"><RefreshCw size={16}/> Thử lại</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Class List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-bold px-1 text-slate-800">Danh sách lớp sinh viên</h2>
          <div className="max-h-[680px] overflow-y-auto space-y-3 pr-1">
            {filteredClasses.map(cls => (
              <div
                key={cls.id}
                onClick={() => {
                  if (editingClassId !== cls.id) setSelectedClassId(cls.id);
                }}
                className={`group bg-white p-4 rounded-xl border shadow-sm transition-all ${selectedClassId === cls.id ? 'border-sky-300 border-l-4 border-l-sky-500' : 'border-slate-200 hover:border-sky-200'} ${editingClassId === cls.id ? '' : 'cursor-pointer'}`}
              >
                {editingClassId === cls.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full border border-slate-300 p-2 rounded-lg text-sm bg-white text-gray-900"
                    />
                    <button onClick={() => handleUpdateClass(cls.id)} className="text-green-600"><Check size={16} /></button>
                    <button onClick={() => setEditingClassId(null)} className="text-gray-500"><X size={16} /></button>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div className={`font-bold text-left ${selectedClassId === cls.id ? 'text-sky-700' : 'text-slate-800'}`}>
                        {cls.name}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${selectedClassId === cls.id ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'}`}>
                        {selectedClassId === cls.id ? 'Đang mở' : 'Lớp'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <UsersIcon size={15} /> {classStudentCounts[cls.id] || 0} sinh viên
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingClassId(cls.id); setEditName(cls.name); }}
                          className="text-gray-400 hover:text-blue-500"
                          title="Sửa lớp"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteClass(cls.id, cls.name); }}
                          className="text-gray-400 hover:text-red-500"
                          title="Xóa lớp"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
            {filteredClasses.length === 0 && !loading && <div className="p-4 text-center text-slate-400 text-sm">Không có lớp phù hợp bộ lọc</div>}
            {loading && filteredClasses.length === 0 && <div className="p-4 text-center text-slate-400 text-sm">Đang tải...</div>}
          </div>
        </div>

        {/* Right: Student Table */}
        <div className="lg:col-span-2 space-y-6">
          {selectedClassId ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
                <div>
                  <h2 className="font-bold text-lg text-slate-800">Chi tiết lớp: {classes.find(c => c.id === selectedClassId)?.name}</h2>
                  <p className="text-xs text-slate-500">Danh sách tài khoản sinh viên trong lớp</p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors" type="button" title="Lọc nhanh">
                    <SlidersHorizontal size={18} />
                  </button>
                  <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors" type="button" title="Tùy chọn">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>

              <div className="p-4 border-b border-slate-200 flex flex-wrap gap-2">
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => { resetAddStudentForm(); setShowAddStudentModal(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors"
                  >
                    <UserPlus size={16} /> Thêm SV
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors disabled:bg-gray-400"
                  >
                    {isUploading ? 'Đang lưu...' : <><FileSpreadsheet size={16} /> Nhập Excel</>}
                  </button>
                  <button
                    onClick={downloadStudentImportTemplate}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors border border-gray-200"
                    title="Tải file Excel mẫu (có tiêu đề cột)"
                  >
                    <Download size={16} /> Tải mẫu
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls" className="hidden" />
                  
                  <button 
                    onClick={generateQRPDF}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors"
                  >
                    <Download size={16} /> Xuất PDF QR
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Sinh viên</th>
                      <th className="px-6 py-4">Tên đăng nhập</th>
                      <th className="px-6 py-4">Trạng thái</th>
                      <th className="px-6 py-4 w-64">Mật khẩu</th>
                      <th className="px-6 py-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((student) => {
                      // Tìm account tương ứng
                      const user = users.find(u => u.username === student.id);
                      const currentPass = editingPassword[student.id] !== undefined ? editingPassword[student.id] : (user?.password || '');
                      const isChanged = user && currentPass !== user.password;

                      return (
                      <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                              {getInitials(student)}
                            </div>
                            <div>
                              <div className="font-semibold text-sm text-slate-800">{student.lastName} {student.firstName}</div>
                              <div className="text-[11px] text-slate-500">ID: {student.id} | Lớp: {student.classId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-mono">{student.id}</td>
                        <td className="px-6 py-4">
                          {user ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              Hoạt động
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                              Chưa có tài khoản
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                            {user ? (
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <Lock className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={12}/>
                                        <input 
                                            type="text" 
                                            value={currentPass}
                                            onChange={(e) => handlePasswordChangeInput(student.id, e.target.value)}
                                            className={`w-full pl-6 pr-2 py-1 border rounded text-xs outline-none focus:ring-1 ${isChanged ? 'border-orange-300 bg-orange-50 focus:ring-orange-500' : 'border-gray-200 bg-gray-50 focus:ring-blue-500'}`}
                                            placeholder="Mật khẩu"
                                        />
                                    </div>
                                    {isChanged && (
                                        <button 
                                            onClick={() => handleSavePassword(user)}
                                            className="text-white bg-green-500 hover:bg-green-600 p-1.5 rounded transition-colors shadow-sm"
                                            title="Lưu mật khẩu mới"
                                        >
                                            <Save size={14}/>
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <button 
                                  onClick={() => handleCreateSingleAccount(student)}
                                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded text-xs font-bold border border-blue-200 transition-colors"
                                >
                                  <UserPlus size={12} /> Tạo TK
                                </button>
                            )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditStudentModal(student)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Sửa thông tin"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => { setRemoveTarget(student); setRemoveAlsoDeleteAccount(false); }}
                              className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Xóa thành viên"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                    {filteredStudents.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-10 text-center text-slate-400">
                            {students.length === 0
                              ? 'Danh sách trống. Hãy nhập Excel hoặc thêm thủ công.'
                              : 'Không có sinh viên phù hợp với từ khóa tìm kiếm.'}
                          </td>
                        </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400 gap-2">
              <UsersIcon size={28} className="text-slate-300" />
              <p className="font-semibold text-slate-500">Chọn một lớp để quản lý sinh viên và tài khoản</p>
              <p className="text-sm">Bạn có thể tìm lớp ở thanh tìm kiếm phía trên.</p>
            </div>
          )}
        </div>
      </div>

      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 shadow-xl">
            <h3 className="text-lg font-bold mb-4">Tạo Lớp Mới</h3>
            <input 
              type="text"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="Tên lớp (VD: K13-CNCD2511)"
              className="w-full border border-gray-300 rounded-lg p-2 mb-4 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Hủy</button>
              <button onClick={handleCreateClass} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Tạo</button>
            </div>
          </div>
        </div>
      )}

      {showAddStudentModal && selectedClassId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[95vw] max-w-lg shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Thêm sinh viên vào lớp</h3>
              <button onClick={() => { setShowAddStudentModal(false); }} className="text-gray-500 hover:text-gray-700"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-600">MSSV</label>
                <input
                  value={addStudentForm.id}
                  onChange={(e) => setAddStudentForm(prev => ({ ...prev, id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                  placeholder="VD: CNCD2511016"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600">Họ đệm</label>
                  <input
                    value={addStudentForm.lastName}
                    onChange={(e) => setAddStudentForm(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                    placeholder="VD: Lê Khánh"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600">Tên</label>
                  <input
                    value={addStudentForm.firstName}
                    onChange={(e) => setAddStudentForm(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                    placeholder="VD: Duy"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600">Ngày sinh</label>
                  <input
                    value={addStudentForm.dob}
                    onChange={(e) => setAddStudentForm(prev => ({ ...prev, dob: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                    placeholder="VD: 01/01/2005"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600">Email</label>
                  <input
                    value={addStudentAutoEmail ? getAddStudentEmail() : addStudentForm.email}
                    onChange={(e) => setAddStudentForm(prev => ({ ...prev, email: e.target.value }))}
                    disabled={addStudentAutoEmail}
                    className={`w-full border border-gray-300 rounded-lg p-2 focus:ring-2 outline-none bg-white text-gray-900 ${addStudentAutoEmail ? 'opacity-70' : ''}`}
                    placeholder="Tự tạo hoặc nhập tay"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-2">
                <label className="flex items-center gap-2 text-sm text-gray-700 select-none">
                  <input
                    type="checkbox"
                    checked={addStudentAutoEmail}
                    onChange={(e) => setAddStudentAutoEmail(e.target.checked)}
                  />
                  Tự tạo email theo MSSV
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 select-none">
                  <input
                    type="checkbox"
                    checked={addStudentCreateAccount}
                    onChange={(e) => setAddStudentCreateAccount(e.target.checked)}
                  />
                  Tạo/cập nhật tài khoản đăng nhập
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => { setShowAddStudentModal(false); }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmitAddStudent}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Đang lưu...' : 'Thêm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chỉnh sửa Sinh viên */}
      {editingStudent && selectedClassId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[95vw] max-w-lg shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-blue-700">Chỉnh sửa thông tin sinh viên</h3>
              <button onClick={() => setEditingStudent(null)} className="text-gray-500 hover:text-gray-700"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-600">MSSV <span className="text-orange-500">(có thể thay đổi)</span></label>
                <input
                  value={editStudentForm.id}
                  onChange={(e) => setEditStudentForm(prev => ({ ...prev, id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                  placeholder="VD: CNCD2511016"
                />
                {editStudentForm.id !== editingStudent.id && (
                  <p className="text-xs text-orange-600 mt-1">
                    ⚠️ Đổi MSSV sẽ tạo mới sinh viên và xóa record cũ. Tài khoản sẽ được cập nhật.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600">Họ đệm</label>
                  <input
                    value={editStudentForm.lastName}
                    onChange={(e) => setEditStudentForm(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                    placeholder="VD: Lê Khánh"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600">Tên</label>
                  <input
                    value={editStudentForm.firstName}
                    onChange={(e) => setEditStudentForm(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                    placeholder="VD: Duy"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600">Ngày sinh</label>
                  <input
                    value={editStudentForm.dob}
                    onChange={(e) => setEditStudentForm(prev => ({ ...prev, dob: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                    placeholder="VD: 01/01/2005"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600">Email</label>
                  <input
                    value={editStudentForm.email}
                    onChange={(e) => setEditStudentForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                    placeholder="VD: student@ctuet.edu.vn"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <label className="flex items-center gap-2 text-sm text-gray-700 select-none">
                  <input
                    type="checkbox"
                    checked={editStudentUpdateAccount}
                    onChange={(e) => setEditStudentUpdateAccount(e.target.checked)}
                  />
                  Cập nhật tài khoản đăng nhập (nếu có)
                </label>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
                <p className="font-bold mb-1">Thông tin hiện tại:</p>
                <p>MSSV: <span className="font-mono">{editingStudent.id}</span></p>
                <p>Họ tên: {editingStudent.lastName} {editingStudent.firstName}</p>
                <p>Ngày sinh: {editingStudent.dob || 'Chưa có'}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setEditingStudent(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmitEditStudent}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {removeTarget && selectedClassId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[95vw] max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-red-700">Xóa thành viên lớp</h3>
              <button onClick={() => setRemoveTarget(null)} className="text-gray-500 hover:text-gray-700"><X size={18} /></button>
            </div>

            <div className="text-sm text-gray-700 space-y-2">
              <div>
                <div className="font-bold text-gray-900">{removeTarget.lastName} {removeTarget.firstName}</div>
                <div className="font-mono text-gray-600">MSSV: {removeTarget.id}</div>
              </div>
              <div className="text-xs text-gray-500">
                - “Xóa khỏi lớp” sẽ bỏ gán lớp (không xóa dữ liệu sinh viên).<br/>
                - “Xóa vĩnh viễn” sẽ xóa record sinh viên khỏi DB.
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700 select-none mt-4">
              <input
                type="checkbox"
                checked={removeAlsoDeleteAccount}
                onChange={(e) => setRemoveAlsoDeleteAccount(e.target.checked)}
              />
              Khi xóa vĩnh viễn: xóa luôn tài khoản đăng nhập
            </label>

            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-5">
              <button
                onClick={() => setRemoveTarget(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Đóng
              </button>
              <button
                onClick={() => handleRemoveFromClass(removeTarget)}
                disabled={loading}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-gray-400"
              >
                Xóa khỏi lớp
              </button>
              <button
                onClick={() => handleDeleteStudentPermanently(removeTarget)}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 hover:scale-110"
          title="Quay lại đầu trang"
        >
          <ArrowUp size={24} />
        </button>
      )}
    </div>
  );
};

export default ClassManagement;
