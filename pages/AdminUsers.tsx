import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Users, Search, ArrowLeft, RefreshCw, Mail, Calendar, Shield, UserPlus, Edit, Trash2, X } from 'lucide-react';
import { isAdminLoggedIn, adminFetch } from '../services/adminAuth';
import { createUser, updateUser, deleteUser } from '../services/storage';

interface SystemUser {
  id: number;
  username: string;
  role: string;
  name: string;
  email?: string;
  lastLogin?: string;
  createdAt: string;
}

interface NewUser {
  username: string;
  password: string;
  name: string;
  role: 'admin' | 'monitor' | 'bch' | 'doankhoa' | 'student';
  classId?: string;
}

const AdminUsers: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<SystemUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  // Modal state
  const [showUserModal, setShowUserModal] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [newUser, setNewUser] = useState<NewUser>({
    username: '',
    password: '',
    name: '',
    role: 'student',
    classId: '',
  });

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      navigate('/admin/login');
      return;
    }
    loadUsers();
  }, [navigate]);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, roleFilter, users]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await adminFetch('/admin-api/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
        setFilteredUsers(data.data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClick = () => {
    setNewUser({
      username: '',
      password: '',
      name: '',
      role: 'student',
      classId: '',
    });
    setIsEditingUser(false);
    setShowUserModal(true);
  };

  const handleEditClick = (user: SystemUser) => {
    setNewUser({
      username: user.username,
      password: '', // Don't show password
      name: user.name,
      role: user.role as any,
      classId: '',
    });
    setIsEditingUser(true);
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditingUser) {
        await updateUser(newUser as any);
        alert('✅ Cập nhật tài khoản thành công!');
      } else {
        await createUser(newUser as any);
        alert('✅ Thêm tài khoản thành công!');
      }
      setShowUserModal(false);
      loadUsers();
    } catch (error) {
      alert('❌ Lỗi: ' + (error as Error).message);
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (!window.confirm(`⚠️ Bạn chắc chắn muốn xóa user: ${username}?\n\nHành động này không thể hoàn tác!`)) {
      return;
    }
    try {
      await deleteUser(username);
      alert('✅ Đã xóa tài khoản thành công!');
      loadUsers();
    } catch (error) {
      alert('❌ Lỗi xóa user: ' + (error as Error).message);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const getRoleBadgeColor = (role: string): string => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-800 border-red-200',
      monitor: 'bg-blue-100 text-blue-800 border-blue-200',
      bch: 'bg-purple-100 text-purple-800 border-purple-200',
      doankhoa: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      student: 'bg-green-100 text-green-800 border-green-200',
    };
    return colors[role] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getRoleLabel = (role: string): string => {
    const labels: Record<string, string> = {
      admin: 'Quản trị viên',
      monitor: 'Lớp trưởng',
      bch: 'BCH',
      doankhoa: 'Đoàn Khoa',
      student: 'Sinh viên',
    };
    return labels[role] || role;
  };

  const uniqueRoles = Array.from(new Set(users.map(u => u.role)));

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Quay lại Dashboard</span>
          </Link>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <Users className="text-blue-600" size={32} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Quản lý Người dùng</h1>
                  <p className="text-gray-600 mt-1">Tổng số: {users.length} người dùng</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleAddClick}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all font-bold shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <UserPlus size={18} />
                  Thêm User
                </button>
                <button
                  onClick={loadUsers}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 font-bold shadow-md"
                >
                  <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                  Làm mới
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tìm kiếm
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm theo tên, username, email..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lọc theo vai trò
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tất cả vai trò</option>
                {uniqueRoles.map(role => (
                  <option key={role} value={role}>{getRoleLabel(role)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="mx-auto mb-4 animate-spin text-blue-600" size={40} />
              <p className="text-gray-600">Đang tải dữ liệu...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-gray-600">Không tìm thấy người dùng</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Người dùng
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Vai trò
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Lần đăng nhập cuối
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Ngày tạo
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-gray-800">{user.name}</div>
                          <div className="text-sm text-gray-600">@{user.username}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                          <Shield size={12} />
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.email ? (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail size={14} />
                            {user.email}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Chưa có</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {user.lastLogin ? (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar size={14} />
                            {new Date(user.lastLogin).toLocaleString('vi-VN')}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Chưa đăng nhập</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditClick(user)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors text-sm font-medium"
                            title="Chỉnh sửa user"
                          >
                            <Edit size={14} />
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.username)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium"
                            title="Xóa user"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {uniqueRoles.map(role => {
            const count = users.filter(u => u.role === role).length;
            return (
              <div key={role} className="bg-white rounded-lg shadow p-4 border border-gray-200">
                <div className="text-2xl font-bold text-gray-800">{count}</div>
                <div className="text-sm text-gray-600 mt-1">{getRoleLabel(role)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add/Edit User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slideUp">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-cyan-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                {isEditingUser ? (
                  <>
                    <Edit size={20} className="text-orange-600" />
                    Cập nhật Tài khoản
                  </>
                ) : (
                  <>
                    <UserPlus size={20} className="text-green-600" />
                    Thêm Tài khoản Mới
                  </>
                )}
              </h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Tên đăng nhập (Username) *
                </label>
                <input
                  type="text"
                  required
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  disabled={isEditingUser}
                  className={`w-full border-2 px-4 py-2.5 rounded-xl outline-none transition-all ${
                    isEditingUser
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-300'
                      : 'bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                  }`}
                  placeholder="VD: admin, mssv, email..."
                />
                {isEditingUser && (
                  <p className="text-xs text-gray-500 mt-1">Username không thể thay đổi</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Mật khẩu {isEditingUser ? '(để trống nếu không đổi)' : '*'}
                </label>
                <input
                  type="text"
                  required={!isEditingUser}
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full border-2 border-gray-300 px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 transition-all"
                  placeholder={isEditingUser ? 'Nhập mật khẩu mới để thay đổi' : 'Mật khẩu'}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Họ và Tên *</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full border-2 border-gray-300 px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 transition-all"
                  placeholder="VD: Nguyễn Văn A"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Vai trò (Quyền hạn) *
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                  className="w-full border-2 border-gray-300 px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 transition-all"
                >
                  <option value="student">Sinh viên</option>
                  <option value="monitor">Lớp trưởng / Ban cán sự</option>
                  <option value="bch">BCH (Ban Chấp Hành)</option>
                  <option value="doankhoa">Đoàn Khoa</option>
                  <option value="admin">Quản trị viên (Admin)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Mã lớp (tuỳ chọn)
                </label>
                <input
                  type="text"
                  value={newUser.classId}
                  onChange={(e) => setNewUser({ ...newUser, classId: e.target.value })}
                  className="w-full border-2 border-gray-300 px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 transition-all"
                  placeholder="VD: DH21CS01"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-colors font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={`flex-1 text-white py-3 rounded-xl transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-105 ${
                    isEditingUser
                      ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                  }`}
                >
                  {isEditingUser ? '💾 Lưu Thay Đổi' : '➕ Thêm Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
