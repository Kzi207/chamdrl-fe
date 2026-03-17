
import React, { useState, useEffect, useRef } from 'react';
import { getUsers, createUser, updateUser, deleteUser, saveApiConfig, getApiUrl, checkSystemStatus, getCurrentUser, changePassword, getFirebaseConfig, saveFirebaseConfig, checkMixedContent, loadConfigFromServer, getStudents, updateStudent } from '../services/storage';
import { Save, UserPlus, Trash2, Users, CheckCircle, XCircle, RefreshCw, Globe, AlertTriangle, Lock, Edit, X, Cloud, ArrowLeft, ArrowUp, ArrowRight } from 'lucide-react';
import { User } from '../types';
import { initFirebase } from '../services/firebase';
import { useNavigate } from 'react-router-dom';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const loggedIn = !!currentUser;
  const isAdmin = currentUser?.role === 'admin';
  
  // Logic: If logged in, default to Profile. If not, default to Firebase (Config mode)
  const [activeTab, setActiveTab] = useState<'connection' | 'users' | 'profile' | 'firebase'>(loggedIn ? 'profile' : 'firebase');
  
  const [apiUrl, setApiUrl] = useState('');
  const [serverStatus, setServerStatus] = useState<'checking' | 'ok' | 'error' | 'warning'>('checking');
  const [statusMsg, setStatusMsg] = useState('');
  const [mixedContentWarning, setMixedContentWarning] = useState<string>('');
  const [isSaved, setIsSaved] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Firebase State
  const [firebaseJson, setFirebaseJson] = useState('');

  // User Mgmt State
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', name: '', role: 'monitor' as const, classId: '' });
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);

  // Change Password State
  const [passData, setPassData] = useState({ old: '', new: '', confirm: '' });

    // Student Profile Edit State
    const [studentName, setStudentName] = useState('');
    const [studentEmail, setStudentEmail] = useState('');
    const [studentPhone, setStudentPhone] = useState('');
    const [studentMajor, setStudentMajor] = useState('Công nghệ thông tin');
    const [studentAvatar, setStudentAvatar] = useState('');
    const [studentClassName, setStudentClassName] = useState('Sinh viên');
    const [profileSaving, setProfileSaving] = useState(false);
    const [showChangePasswordPanel, setShowChangePasswordPanel] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  useEffect(() => {
    const initSettings = async () => {
      // Load config from server first
      await loadConfigFromServer();
      
      setApiUrl(getApiUrl());
      checkConnection();
      
      const fbConfig = getFirebaseConfig();
      if (fbConfig) {
          setFirebaseJson(JSON.stringify(fbConfig, null, 2));
      } else {
          // Default template
          setFirebaseJson(`{
  "apiKey": "PASTE_YOUR_API_KEY_HERE",
  "authDomain": "YOUR_PROJECT.firebaseapp.com",
  "projectId": "YOUR_PROJECT_ID",
  "storageBucket": "YOUR_PROJECT.appspot.com",
  "messagingSenderId": "SENDER_ID",
  "appId": "APP_ID"
}`);
      }
    };
    
    initSettings();
  }, []);

    useEffect(() => {
        if (!currentUser || currentUser.role !== 'student') return;

        const loadStudentProfile = async () => {
            try {
                const list = await getStudents();
                const profile = list.find(s => s.id === currentUser.username);

                const fallbackName = currentUser.name || '';
                const profileName = profile ? `${profile.lastName} ${profile.firstName}`.trim() : fallbackName;
                setStudentName(profileName || fallbackName);
                setStudentEmail(profile?.email || currentUser.email || '');
                setStudentClassName(profile?.classId ? `Lớp ${profile.classId}` : 'Sinh viên');

                const metaRaw = localStorage.getItem(`student_profile_meta_${currentUser.username}`);
                if (metaRaw) {
                    const meta = JSON.parse(metaRaw);
                    setStudentPhone(meta.phone || '');
                    setStudentMajor(meta.major || 'Công nghệ thông tin');
                    setStudentAvatar(meta.avatar || '');
                } else {
                    setStudentAvatar('');
                }
            } catch (e) {
                setStudentName(currentUser.name || '');
                setStudentEmail(currentUser.email || '');
                setStudentAvatar('');
            }
        };

        loadStudentProfile();
    }, [currentUser?.role, currentUser?.username]);

  useEffect(() => {
    if (activeTab === 'users' && serverStatus === 'ok' && isAdmin) fetchUsers();
  }, [activeTab, serverStatus]);

  const checkConnection = async () => {
      setServerStatus('checking');
      setMixedContentWarning('');
      
      // Check mixed content
      const mixedCheck = checkMixedContent();
      if (!mixedCheck.isSecure && mixedCheck.warning) {
          setMixedContentWarning(mixedCheck.warning);
          setServerStatus('warning');
          setStatusMsg('Cảnh báo: Mixed Content (HTTPS/HTTP)');
          return;
      }
      
      const res = await checkSystemStatus();
      setServerStatus(res.status as any);
      setStatusMsg(res.message);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setIsSaved(false);
    setIsSynced(false);
    
    try {
      const success = await saveApiConfig(apiUrl);
      setIsSaved(true);
      setIsSynced(success);
      
      checkConnection();
      
      setTimeout(() => {
        setIsSaved(false);
        setIsSynced(false);
      }, 3000);
    } catch (error) {
      console.error('Save config error:', error);
      setIsSaved(true);
      setIsSynced(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveFirebase = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      
      try {
          const config = JSON.parse(firebaseJson);
          if (config.apiKey === "PASTE_YOUR_API_KEY_HERE") {
              alert("Vui lòng thay thế giá trị mẫu bằng thông tin thật từ Firebase Console.");
              setIsSaving(false);
              return;
          }
          
          const success = await saveFirebaseConfig(config);
          const initSuccess = initFirebase(); // Re-init service
          
          if (initSuccess && success) {
            alert("✅ Đã lưu cấu hình và khởi tạo Firebase thành công!\n📁 Config đã được đồng bộ lên server.");
          } else if (initSuccess) {
            alert("✅ Đã lưu cấu hình và khởi tạo Firebase thành công!\n⚠️ Nhưng chưa đồng bộ được lên server (sẽ lưu local).");
          } else {
            alert("⚠️ Đã lưu cấu hình, nhưng khởi tạo Firebase thất bại.\nVui lòng kiểm tra lại thông tin config.");
          }
      } catch (e) {
          alert("❌ Lỗi: Chuỗi JSON không hợp lệ.\nVui lòng kiểm tra dấu ngoặc và dấu phẩy.");
      } finally {
          setIsSaving(false);
      }
  };

  const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
          const data = await getUsers();
          setUsers(data);
      } catch (error) {
          console.error(error);
      } finally {
          setLoadingUsers(false);
      }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          if (isEditingUser) {
              await updateUser(newUser as any);
              alert("Cập nhật tài khoản thành công!");
          } else {
              await createUser(newUser as any);
              alert("Thêm tài khoản thành công!");
          }
          setNewUser({ username: '', password: '', name: '', role: 'monitor', classId: '' });
          setIsEditingUser(false);
          setShowUserModal(false);
          fetchUsers();
      } catch (e) {
          alert("Lỗi: " + (e as Error).message);
      }
  };

  const handleAddClick = () => {
      setNewUser({ username: '', password: '', name: '', role: 'monitor', classId: '' });
      setIsEditingUser(false);
      setShowUserModal(true);
  };

  const handleEditClick = (user: User) => {
      setNewUser({
          username: user.username,
          password: user.password,
          name: user.name,
          role: user.role as any,
          classId: user.classId || ''
      });
      setIsEditingUser(true);
      setShowUserModal(true);
  };

  const handleDeleteUser = async (username: string) => {
      if(!window.confirm(`Bạn chắc chắn muốn xóa user: ${username}?`)) return;
      try {
          await deleteUser(username);
          fetchUsers();
      } catch (e) {
          alert("Lỗi xóa user");
      }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (passData.new !== passData.confirm) {
          alert("Mật khẩu xác nhận không khớp!");
          return;
      }
      if (currentUser?.password && passData.old !== currentUser.password) {
          alert("Mật khẩu cũ không đúng!");
          return;
      }
      try {
          await changePassword(currentUser!.username, passData.new);
          alert("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
      } catch (e) {
          alert("Lỗi đổi mật khẩu");
      }
  };

  const splitName = (fullName: string) => {
      const normalized = fullName.trim().replace(/\s+/g, ' ');
      if (!normalized) return { lastName: '', firstName: '' };
      const parts = normalized.split(' ');
      if (parts.length === 1) return { lastName: '', firstName: parts[0] };
      const firstName = parts[parts.length - 1];
      const lastName = parts.slice(0, -1).join(' ');
      return { lastName, firstName };
  };

  const handleReloadStudentProfile = async () => {
      if (!currentUser || currentUser.role !== 'student') return;
      try {
          const list = await getStudents();
          const profile = list.find(s => s.id === currentUser.username);
          setStudentName(profile ? `${profile.lastName} ${profile.firstName}`.trim() : (currentUser.name || ''));
          setStudentEmail(profile?.email || currentUser.email || '');

          const metaRaw = localStorage.getItem(`student_profile_meta_${currentUser.username}`);
          if (metaRaw) {
              const meta = JSON.parse(metaRaw);
              setStudentPhone(meta.phone || '');
              setStudentMajor(meta.major || 'Công nghệ thông tin');
              setStudentAvatar(meta.avatar || '');
          } else {
              setStudentPhone('');
              setStudentMajor('Công nghệ thông tin');
              setStudentAvatar('');
          }
      } catch {
          setStudentName(currentUser.name || '');
          setStudentEmail(currentUser.email || '');
          setStudentAvatar('');
      }
  };

  const handleAvatarPickClick = () => {
      avatarInputRef.current?.click();
  };

  const handleAvatarSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
          alert('Vui lòng chọn tệp ảnh hợp lệ.');
          e.target.value = '';
          return;
      }

      const maxBytes = 2 * 1024 * 1024;
      if (file.size > maxBytes) {
          alert('Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 2MB.');
          e.target.value = '';
          return;
      }

      const reader = new FileReader();
      reader.onload = () => {
          setStudentAvatar(String(reader.result || ''));
      };
      reader.onerror = () => {
          alert('Không thể đọc tệp ảnh. Vui lòng thử lại.');
      };
      reader.readAsDataURL(file);
      e.target.value = '';
  };

  const handleRemoveAvatar = () => {
      setStudentAvatar('');
  };

  const handleSaveStudentProfile = async () => {
      if (!currentUser || currentUser.role !== 'student') return;
      if (!studentName.trim()) {
          alert('Vui lòng nhập họ và tên.');
          return;
      }

      setProfileSaving(true);
      try {
          const { lastName, firstName } = splitName(studentName);

          // Cập nhật thông tin trong bảng sinh viên
          await updateStudent({
              id: currentUser.username,
              lastName,
              firstName,
              email: studentEmail.trim(),
          });

          // Cập nhật thông tin tài khoản đăng nhập
          await updateUser({
              ...currentUser,
              name: studentName.trim(),
              email: studentEmail.trim(),
          });

          // Lưu metadata cục bộ cho các trường mở rộng
          localStorage.setItem(`student_profile_meta_${currentUser.username}`, JSON.stringify({
              phone: studentPhone.trim(),
              major: studentMajor,
              avatar: studentAvatar,
          }));

          // Đồng bộ current_user trong localStorage để giao diện cập nhật ngay
          localStorage.setItem('current_user', JSON.stringify({
              ...currentUser,
              name: studentName.trim(),
              email: studentEmail.trim(),
          }));

          alert('Đã lưu thay đổi hồ sơ.');
      } catch (e: any) {
          alert('Lưu thất bại: ' + (e?.message || 'Lỗi không xác định'));
      } finally {
          setProfileSaving(false);
      }
  };

  if (currentUser?.role === 'student') {
      const initials = studentName
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((w) => w.charAt(0).toUpperCase())
          .join('') || 'SV';

      return (
          <div className="bg-[#f8f6f6] text-slate-900 min-h-screen">
              <div className="relative flex h-auto min-h-screen w-full flex-col max-w-md mx-auto bg-[#f8f6f6] shadow-xl">
                  <div className="flex items-center p-4 justify-between sticky top-0 bg-[#f8f6f6]/90 backdrop-blur-md z-10 border-b border-slate-200">
                      <button
                          onClick={() => navigate(-1)}
                          className="text-slate-900 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-blue-100 transition-colors"
                          title="Quay lại"
                          type="button"
                      >
                          <ArrowLeft size={20} />
                      </button>
                      <h2 className="text-slate-900 text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10">Chỉnh sửa hồ sơ</h2>
                  </div>

                  <div className="flex p-6">
                      <div className="flex w-full flex-col gap-6 items-center">
                          <div className="flex gap-4 flex-col items-center relative">
                              <div className="rounded-full border-4 border-blue-200 size-32 shadow-lg overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center text-3xl font-bold">
                                  {studentAvatar ? (
                                      <img src={studentAvatar} alt="Ảnh đại diện" className="h-full w-full object-cover" />
                                  ) : initials}
                              </div>
                              <button
                                  className="absolute right-0 bg-blue-600 text-white p-2 rounded-full shadow-md hover:scale-105 transition-transform bottom-2"
                                  type="button"
                                  title="Đổi ảnh"
                                  onClick={handleAvatarPickClick}
                              >
                                  <Edit size={14} />
                              </button>
                              <div className="flex flex-col items-center justify-center">
                                  <p className="text-slate-900 text-xl font-bold leading-tight tracking-tight text-center">{studentName || currentUser.name}</p>
                                  <p className="text-blue-700 font-medium text-sm text-center">{studentClassName}</p>
                              </div>
                          </div>
                          <input
                              ref={avatarInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleAvatarSelected}
                          />
                          <button
                              className="flex min-w-[140px] items-center justify-center rounded-xl h-10 px-6 bg-blue-100 text-blue-700 text-sm font-bold hover:bg-blue-200 transition-colors"
                              type="button"
                              onClick={handleAvatarPickClick}
                          >
                              <span>Thay đổi ảnh</span>
                          </button>
                          {studentAvatar && (
                              <button
                                  className="text-sm font-semibold text-red-600 hover:text-red-700"
                                  type="button"
                                  onClick={handleRemoveAvatar}
                              >
                                  Xóa ảnh hiện tại
                              </button>
                          )}
                      </div>
                  </div>

                  <div className="px-4 pb-4">
                      <h3 className="text-slate-900 text-lg font-bold leading-tight tracking-tight pb-4 pt-2 border-b border-blue-100">Thông tin cá nhân</h3>
                      <div className="flex flex-col gap-5 py-4">
                          <label className="flex flex-col w-full">
                              <p className="text-slate-700 text-sm font-semibold pb-1.5 ml-1">Họ và tên</p>
                              <input className="flex w-full rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 border border-slate-200 bg-white h-12 px-4 text-base transition-all" placeholder="Nhập họ và tên" type="text" value={studentName} onChange={(e) => setStudentName(e.target.value)} />
                          </label>

                          <label className="flex flex-col w-full opacity-70">
                              <p className="text-slate-700 text-sm font-semibold pb-1.5 ml-1">Mã số sinh viên (Chỉ đọc)</p>
                              <div className="flex items-center w-full rounded-xl text-slate-500 border border-slate-200 bg-slate-100 h-12 px-4 text-base cursor-not-allowed">
                                  {currentUser.username}
                              </div>
                          </label>

                          <label className="flex flex-col w-full">
                              <p className="text-slate-700 text-sm font-semibold pb-1.5 ml-1">Email</p>
                              <input className="flex w-full rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 border border-slate-200 bg-white h-12 px-4 text-base transition-all" placeholder="example@university.edu.vn" type="email" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} />
                          </label>

                          <label className="flex flex-col w-full">
                              <p className="text-slate-700 text-sm font-semibold pb-1.5 ml-1">Số điện thoại</p>
                              <input className="flex w-full rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 border border-slate-200 bg-white h-12 px-4 text-base transition-all" placeholder="Nhập số điện thoại" type="tel" value={studentPhone} onChange={(e) => setStudentPhone(e.target.value)} />
                          </label>

                          <label className="flex flex-col w-full">
                              <p className="text-slate-700 text-sm font-semibold pb-1.5 ml-1">Chuyên ngành</p>
                              <select className="flex w-full rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 border border-slate-200 bg-white h-12 px-4 text-base appearance-none transition-all" value={studentMajor} onChange={(e) => setStudentMajor(e.target.value)}>
                                  <option>Công nghệ thông tin</option>
                                  <option>Kinh tế quốc tế</option>
                                  <option>Quản trị kinh doanh</option>
                                  <option>Kỹ thuật phần mềm</option>
                              </select>
                          </label>
                      </div>
                  </div>

                  <div className="px-4 pb-28">
                      <h3 className="text-slate-900 text-lg font-bold leading-tight tracking-tight pb-4 pt-2 border-b border-blue-100">Bảo mật</h3>
                      <div className="flex flex-col gap-4 py-4">
                          <button
                              onClick={() => setShowChangePasswordPanel((v) => !v)}
                              className="flex items-center justify-between w-full p-4 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
                              type="button"
                          >
                              <div className="flex items-center gap-3 text-blue-700 font-semibold">
                                  <Lock size={18} />
                                  <span>Đổi mật khẩu</span>
                              </div>
                              <ArrowRight size={16} className={`text-blue-700 transition-transform ${showChangePasswordPanel ? 'rotate-90' : ''}`} />
                          </button>

                          {showChangePasswordPanel && (
                              <form onSubmit={handleChangePassword} className="space-y-3 bg-white border border-slate-200 rounded-xl p-4">
                                  <input
                                      type="password"
                                      value={passData.old}
                                      onChange={e => setPassData({ ...passData, old: e.target.value })}
                                      className="w-full border border-slate-200 p-3 rounded-lg bg-white text-gray-900"
                                      placeholder="Mật khẩu cũ"
                                      required
                                  />
                                  <input
                                      type="password"
                                      value={passData.new}
                                      onChange={e => setPassData({ ...passData, new: e.target.value })}
                                      className="w-full border border-slate-200 p-3 rounded-lg bg-white text-gray-900"
                                      placeholder="Mật khẩu mới"
                                      required
                                  />
                                  <input
                                      type="password"
                                      value={passData.confirm}
                                      onChange={e => setPassData({ ...passData, confirm: e.target.value })}
                                      className="w-full border border-slate-200 p-3 rounded-lg bg-white text-gray-900"
                                      placeholder="Nhập lại mật khẩu mới"
                                      required
                                  />
                                  <button type="submit" className="w-full bg-blue-700 text-white py-2.5 rounded-lg hover:bg-blue-800 font-bold transition-colors">
                                      Cập nhật mật khẩu
                                  </button>
                              </form>
                          )}
                      </div>
                  </div>

                  <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-4 bg-[#f8f6f6]/95 backdrop-blur-lg border-t border-slate-200 flex gap-3">
                      <button
                          onClick={handleReloadStudentProfile}
                          className="flex-1 h-12 rounded-xl bg-slate-200 text-slate-700 font-bold hover:bg-slate-300 transition-colors"
                          type="button"
                      >
                          Hủy
                      </button>
                      <button
                          onClick={handleSaveStudentProfile}
                          disabled={profileSaving}
                          className="flex-[2] h-12 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/25 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-60"
                          type="button"
                      >
                          {profileSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
          <button 
              onClick={() => navigate(-1)} 
              className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
              title="Quay lại"
          >
              <ArrowLeft size={24}/>
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Cài đặt Hệ thống</h1>
      </div>

      {/* Info Banner */}
      <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
          <div className="flex items-start gap-3">
              <Cloud size={20} className="text-blue-600 shrink-0 mt-0.5"/>
              <div className="flex-1">
                  <p className="font-bold text-blue-900 mb-1">💾 Cấu hình được đồng bộ tự động</p>
                  <p className="text-sm text-blue-800 leading-relaxed">
                      Tất cả các cài đặt (API URL, Firebase Config) sẽ được tự động lưu vào server (<code className="bg-blue-100 px-1 py-0.5 rounded text-xs">config.json</code>) 
                      và áp dụng cho tất cả thiết bị. URL mặc định: <code className="bg-blue-100 px-1 py-0.5 rounded text-xs">https://database.kzii.site</code>
                  </p>
              </div>
          </div>
      </div>

      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
          {loggedIn && (
              <button 
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'profile' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                  <Lock size={18} /> Tài khoản cá nhân
              </button>
          )}
          
          <button 
              onClick={() => setActiveTab('firebase')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'firebase' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
              <Cloud size={18} /> Cấu hình Firebase
          </button>

          <button 
                onClick={() => setActiveTab('connection')}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'connection' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
                <Globe size={18} /> Kết nối Database
            </button>

          {isAdmin && (
                <button 
                    onClick={() => setActiveTab('users')}
                    className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Users size={18} /> Quản lý Users (Admin)
                </button>
          )}
      </div>

      {loggedIn && activeTab === 'profile' && (
          <div className="max-w-md bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-fadeIn">
              <h3 className="font-bold text-lg mb-4 text-gray-800">Đổi Mật Khẩu</h3>
              <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu cũ</label>
                      <input 
                        type="password" 
                        value={passData.old} 
                        onChange={e => setPassData({...passData, old: e.target.value})}
                        className="w-full border p-2 rounded-lg bg-white" required 
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                      <input 
                        type="password" 
                        value={passData.new} 
                        onChange={e => setPassData({...passData, new: e.target.value})}
                        className="w-full border p-2 rounded-lg bg-white" required 
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nhập lại mật khẩu mới</label>
                      <input 
                        type="password" 
                        value={passData.confirm} 
                        onChange={e => setPassData({...passData, confirm: e.target.value})}
                        className="w-full border p-2 rounded-lg bg-white" required 
                      />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium">
                      Cập nhật mật khẩu
                  </button>
              </form>
          </div>
      )}

      {activeTab === 'firebase' && (
          <div className="max-w-2xl bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-fadeIn">
              <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2">
                  <Cloud className="text-orange-500"/> Cấu hình Đăng nhập Google
              </h3>
              <div className="mb-4 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <p className="mb-2 font-bold">Hướng dẫn:</p>
                  <ol className="list-decimal list-inside space-y-1">
                      <li>Truy cập <a href="https://console.firebase.google.com" target="_blank" className="text-blue-600 underline">Firebase Console</a>.</li>
                      <li>Tạo Project mới &rarr; Vào <b>Project Settings</b>.</li>
                      <li>Cuộn xuống mục "Your apps" &rarr; Chọn Web (&lt;/&gt;) &rarr; Copy toàn bộ đoạn <code>const firebaseConfig = &#123;...&#125;;</code> (chỉ lấy phần trong ngoặc nhọn).</li>
                      <li>Dán vào ô bên dưới và lưu lại.</li>
                  </ol>
              </div>
              <form onSubmit={handleSaveFirebase} className="space-y-4">
                  <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Firebase Config (JSON)</label>
                      <textarea 
                        rows={10}
                        value={firebaseJson} 
                        onChange={e => setFirebaseJson(e.target.value)}
                        className="w-full border p-3 rounded-lg bg-gray-50 font-mono text-xs text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder={`{\n  "apiKey": "...",\n  "authDomain": "...",\n  "projectId": "...",\n  ... \n}`}
                        required 
                      />
                  </div>
                  <button 
                      type="submit" 
                      disabled={isSaving}
                      className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-white font-bold shadow-sm transition-all ${
                          isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'
                      }`}
                  >
                      {isSaving ? (
                          <><RefreshCw size={18} className="animate-spin" /> Đang lưu...</>
                      ) : (
                          <><Save size={18} /> Lưu Cấu Hình Firebase</>
                      )}
                  </button>
                  <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
                      <Cloud size={14} />
                      Cấu hình sẽ tự động đồng bộ lên server
                  </p>
              </form>
          </div>
      )}

      {activeTab === 'connection' && (
        <div className="space-y-6 max-w-3xl animate-fadeIn">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                 <div className="flex justify-between items-center mb-4">
                     <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">Trạng thái Kết nối</h2>
                     <div className={`text-sm px-3 py-1 rounded-full flex items-center gap-1 font-bold ${
                         serverStatus === 'ok' ? 'bg-green-100 text-green-700' : 
                         serverStatus === 'error' ? 'bg-red-100 text-red-700' :
                         serverStatus === 'warning' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100'
                     }`}>
                         {serverStatus === 'ok' ? <CheckCircle size={14}/> : 
                          serverStatus === 'error' ? <XCircle size={14}/> :
                          serverStatus === 'warning' ? <AlertTriangle size={14}/> : <RefreshCw size={14} className="animate-spin"/>}
                         {statusMsg || 'Đang kiểm tra...'}
                     </div>
                </div>

                {mixedContentWarning && (
                    <div className="mb-4 p-4 bg-orange-50 border-l-4 border-orange-500 rounded-r-lg">
                        <div className="flex items-start gap-3">
                            <AlertTriangle size={20} className="text-orange-600 shrink-0 mt-0.5"/>
                            <div className="flex-1">
                                <p className="font-bold text-orange-800 mb-1">Cảnh báo Mixed Content</p>
                                <p className="text-sm text-orange-700 leading-relaxed whitespace-pre-line">{mixedContentWarning}</p>
                                <div className="mt-2 text-xs text-orange-600">
                                    <p className="font-semibold mb-1">Giải pháp:</p>
                                    <ul className="list-disc list-inside space-y-1 ml-2">
                                        <li>Sử dụng API với HTTPS (khuyến nghị)</li>
                                        <li>Hoặc truy cập trang web qua HTTP thay vì HTTPS</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-orange-500"/>
                        Nếu kết nối thất bại, vui lòng liên hệ Admin để kiểm tra Server.
                    </p>
                </div>

                <form onSubmit={handleSaveConfig} className="space-y-4 pt-2 border-t border-gray-100">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Server API URL
                        </label>
                        {window.location.hostname !== 'localhost' && (
                            <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                                <Lock size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-blue-700">
                                    <strong>Khóa trong Production:</strong> API URL được cố định tại <code className="bg-blue-100 px-1 py-0.5 rounded">https://database.kzii.site</code> để đảm bảo bảo mật và ổn định. Chỉ có thể thay đổi trong môi trường development (localhost).
                                </p>
                            </div>
                        )}
                        <input 
                            type="url" 
                            value={apiUrl}
                            onChange={(e) => setApiUrl(e.target.value)}
                            disabled={window.location.hostname !== 'localhost'}
                            className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 ${
                                window.location.hostname !== 'localhost' 
                                    ? 'bg-gray-100 cursor-not-allowed opacity-75' 
                                    : 'bg-white'
                            }`}
                            placeholder="https://database.kzii.site"
                            required
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={isSaving || window.location.hostname !== 'localhost'}
                        className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-white font-medium transition-all ${
                            (isSaving || window.location.hostname !== 'localhost') ? 'bg-gray-400 cursor-not-allowed' :
                            isSaved ? (isSynced ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700') : 
                            'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                        {window.location.hostname !== 'localhost' ? (
                            <><Lock size={18} /> Khóa trong Production</>
                        ) : isSaving ? (
                            <><RefreshCw size={18} className="animate-spin" /> Đang lưu...</>
                        ) : isSaved ? (
                            isSynced ? (
                                <><CheckCircle size={18} /> Đã lưu & đồng bộ server!</>
                            ) : (
                                <><CheckCircle size={18} /> Đã lưu local (chưa sync server)</>
                            )
                        ) : (
                            <><Save size={18} /> Lưu Cấu Hình Server</>
                        )}
                    </button>
                    {isSaved && !isSynced && (
                        <p className="text-xs text-orange-600 text-center mt-2 flex items-center justify-center gap-1">
                            <AlertTriangle size={14} />
                            Cấu hình đã lưu ở trình duyệt nhưng chưa đồng bộ được lên server
                        </p>
                    )}
                    {isSaved && isSynced && (
                        <p className="text-xs text-green-600 text-center mt-2 flex items-center justify-center gap-1">
                            <Cloud size={14} />
                            Cấu hình đã được đồng bộ lên server và sẽ áp dụng cho tất cả các thiết bị
                        </p>
                    )}
                </form>
            </div>
        </div>
      )}

      {loggedIn && activeTab === 'users' && (
        <div className="animate-fadeIn">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><Users size={20}/> Danh sách Người dùng</h3>
                <button 
                    onClick={handleAddClick}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-sm"
                >
                    <UserPlus size={16}/> Thêm Tài khoản
                </button>
            </div>

            <div className="bg-white p-0 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {serverStatus !== 'ok' ? (
                    <div className="p-6 bg-orange-50 text-orange-700 rounded-lg text-sm m-4">Vui lòng kết nối Server để quản lý tài khoản.</div>
                ) : loadingUsers ? (
                    <div className="p-8 text-center text-gray-500 flex justify-center items-center gap-2"><RefreshCw className="animate-spin" size={16}/> Đang tải...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
                                <tr>
                                    <th className="p-4">Username</th>
                                    <th className="p-4">Họ Tên</th>
                                    <th className="p-4">Vai trò</th>
                                    <th className="p-4 text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.map(u => (
                                    <tr key={u.username} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-medium">{u.username}</td>
                                        <td className="p-4">{u.name}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                u.role === 'admin' ? 'bg-red-100 text-red-700' :
                                                u.role === 'monitor' ? 'bg-green-100 text-green-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>{u.role}</span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleEditClick(u)}
                                                    className="text-blue-600 hover:text-blue-800 p-1.5 bg-blue-50 rounded hover:bg-blue-100 transition-colors flex items-center gap-1 font-medium"
                                                    title="Sửa thông tin"
                                                >
                                                    <Edit size={16} /> Sửa
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteUser(u.username)}
                                                    className="text-red-600 hover:text-red-800 p-1.5 bg-red-50 rounded hover:bg-red-100 transition-colors"
                                                    title="Xóa tài khoản"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400">Danh sách trống</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* MODAL POPUP */}
            {showUserModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
                        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                {isEditingUser ? <Edit size={18} className="text-orange-600"/> : <UserPlus size={18} className="text-blue-600"/>}
                                {isEditingUser ? 'Cập nhật Tài khoản' : 'Thêm Tài khoản Mới'}
                            </h3>
                            <button onClick={() => setShowUserModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200">
                                <X size={20}/>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSaveUser} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập (Username)</label>
                                <input 
                                    type="text" required
                                    value={newUser.username}
                                    onChange={e => setNewUser({...newUser, username: e.target.value})}
                                    disabled={isEditingUser}
                                    className={`w-full border p-2.5 rounded-lg outline-none bg-white text-gray-900 ${isEditingUser ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`}
                                    placeholder="VD: admin, mssv..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                                <input 
                                    type="text" required
                                    value={newUser.password}
                                    onChange={e => setNewUser({...newUser, password: e.target.value})}
                                    className="w-full border p-2.5 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-gray-900"
                                    placeholder={isEditingUser ? "Nhập MK mới để thay đổi" : "Mật khẩu"}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và Tên</label>
                                <input 
                                    type="text" required
                                    value={newUser.name}
                                    onChange={e => setNewUser({...newUser, name: e.target.value})}
                                    className="w-full border p-2.5 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-gray-900"
                                    placeholder="VD: Nguyễn Văn A"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò (Quyền hạn)</label>
                                <select 
                                    value={newUser.role}
                                    onChange={e => setNewUser({...newUser, role: e.target.value as any})}
                                    className="w-full border p-2.5 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-gray-900"
                                >
                                    <option value="student">Sinh viên</option>
                                    <option value="monitor">Ban cán sự (Lớp trưởng)</option>
                                    <option value="admin">Quản trị viên (Admin)</option>
                                    <option value="student">Sinh viên</option>
                                </select>
                            </div>
                            
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 transition-colors font-bold">
                                    Hủy
                                </button>
                                <button type="submit" disabled={serverStatus !== 'ok'} className={`flex-1 text-white py-2.5 rounded-lg transition-colors font-bold disabled:bg-gray-400 ${isEditingUser ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                    {isEditingUser ? 'Lưu Thay Đổi' : 'Thêm Mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
      )}

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 p-3 bg-gray-700 text-white rounded-full shadow-lg hover:bg-gray-800 transition-all duration-300 hover:scale-110"
          title="Quay lại đầu trang"
        >
          <ArrowUp size={24} />
        </button>
      )}
    </div>
  );
};

export default Settings;
