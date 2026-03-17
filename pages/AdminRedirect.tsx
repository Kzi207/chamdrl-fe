import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAdminLoggedIn } from '../services/adminAuth';

const AdminRedirect: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Nếu đã đăng nhập, chuyển đến dashboard
    if (isAdminLoggedIn()) {
      navigate('/admin/dashboard', { replace: true });
    } else {
      // Nếu chưa đăng nhập, chuyển đến trang login
      navigate('/admin/login', { replace: true });
    }
  }, [navigate]);

  // Hiển thị loading trong khi chuyển hướng
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mb-4"></div>
        <p className="text-white font-medium">Đang chuyển hướng...</p>
      </div>
    </div>
  );
};

export default AdminRedirect;
