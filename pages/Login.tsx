
import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login, getCurrentUser, loginWithGoogleAccount } from '../services/storage';
import { Lock, User, AlertCircle, ArrowRight, GraduationCap } from 'lucide-react';
import { signInWithGoogle, isFirebaseConfigured } from '../services/firebase';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [googleError, setGoogleError] = useState('');
    const [hasFirebase] = useState(() => isFirebaseConfigured());

    const navigate = useNavigate();
    const location = useLocation();

    const handlePostLogin = useCallback((user: any) => {
        if (user?.role === 'student') {
            navigate('/student-home', { replace: true });
            return;
        }

        navigate('/admin-home', { replace: true });
    }, [navigate]);

    // Nếu đã đăng nhập rồi thì redirect luôn
    const currentUser = getCurrentUser();
    if (currentUser) {
        handlePostLogin(currentUser);
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await login(username, password);
            if (result.success) {
                handlePostLogin(result.user);
            } else {
                setError(result.message || 'Đăng nhập thất bại.');
            }
        } catch (e: any) {
            console.error("Login Error:", e);
            setError(e.message || 'Lỗi kết nối Server.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        console.log('[Login] handleGoogleLogin clicked \u2014 online:', navigator.onLine);
        if (!navigator.onLine) {
            setGoogleError('Không có kết nối internet. Vui lòng kiểm tra mạng và thử lại.');
            return;
        }

        setGoogleLoading(true);
        setGoogleError('');

        try {
            console.log('[Login] Calling signInWithGoogle...');
            const googleUser = await signInWithGoogle();
            console.log('[Login] signInWithGoogle returned:', googleUser ? { email: googleUser.email } : null);

            if (!googleUser) {
                // Mobile: đang redirect (trang sẽ reload) → không làm gì thêm
                // Desktop: user đóng popup → clear loading
                console.log('[Login] googleUser null \u2014 either redirecting or popup closed');
                setGoogleLoading(false);
                return;
            }

            // Desktop popup path: có user ngay
            if (!googleUser.email) {
                console.error('[Login] googleUser has no email:', googleUser);
                setGoogleError('Không lấy được email từ tài khoản Google. Vui lòng thử lại.');
                setGoogleLoading(false);
                return;
            }

            console.log('[Login] Popup success, calling loginWithGoogleAccount for:', googleUser.email);
            const result = await loginWithGoogleAccount(googleUser.email, googleUser.displayName || 'Student');
            console.log('[Login] loginWithGoogleAccount result:', result);

            if (result.success) {
                console.log('[Login] ✅ Login success via popup, navigating...');
                handlePostLogin(result.user);
            } else {
                console.error('[Login] ❌ loginWithGoogleAccount failed:', result.message);
                setGoogleError(result.message || 'Tài khoản không tồn tại trong hệ thống.');
                setGoogleLoading(false);
            }
        } catch (e: any) {
            console.error('[Login] handleGoogleLogin catch:', e.message, e);
            setGoogleError(e.message || 'Lỗi đăng nhập Google. Vui lòng thử lại.');
            setGoogleLoading(false);
        }
    };

    // Xác định tiêu đề hệ thống hiển thị trên form
    const getSystemName = () => {
        const from = (location.state as any)?.from || '';
        if (from.includes('/drl')) return 'Hệ Thống Điểm Rèn Luyện';
        if (from.includes('/gpa')) return 'Cổng Thông Tin Đào Tạo';
        if (from.includes('/dashboard')) return 'Quản Lý Điểm Danh';
        return 'Hệ thống thông tin học thuật trực tuyến';
    };

    return (
        <div className="relative min-h-screen bg-[#f8f6f6] px-4 py-6 flex items-center justify-center" style={{ fontFamily: 'Lexend, sans-serif' }}>
            {googleLoading && (
                <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center">
                    <div className="bg-white rounded-xl p-7 shadow-2xl text-center max-w-sm mx-4 border border-slate-100">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#137fec] border-t-transparent mb-4"></div>
                        <p className="text-slate-700 font-semibold mb-1">Đang xử lý đăng nhập Google...</p>
                        <p className="text-sm text-slate-500">Vui lòng đợi trong giây lát</p>
                    </div>
                </div>
            )}

            <div className="pointer-events-none fixed inset-0 -z-10 opacity-15">
                <div className="absolute -top-28 -right-36 h-80 w-80 rounded-full bg-[#137fec]/50 blur-[90px]" />
                <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-[#137fec]/30 blur-[110px]" />
            </div>

            <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl border border-slate-200">
                <div className="bg-[#137fec] px-8 py-8 text-white flex flex-col items-center text-center">
                    <div className="mb-4 rounded-full bg-white/20 p-3">
                            <GraduationCap size={36} />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">Quản lý Sinh viên</h1>
                        <p className="text-sm text-white/85 mt-1">{getSystemName()}</p>
                </div>

                <div className="px-6 sm:px-8 py-7">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-slate-900">Đăng nhập</h2>
                        <p className="text-sm text-slate-500 mt-1">Chào mừng bạn trở lại, vui lòng nhập thông tin của bạn.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700" htmlFor="username">
                                Email hoặc Mã sinh viên
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-[#137fec] focus:border-transparent"
                                    placeholder="VD: SV123456"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-700" htmlFor="password">
                                    Mật khẩu
                                </label>
                                <span className="text-xs font-semibold text-[#137fec]">&nbsp;</span>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-[#137fec] focus:border-transparent"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg animate-fadeIn text-left">
                                <div className="flex items-start gap-2">
                                    <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                                    <span className="text-sm text-red-700 font-bold">{error}</span>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#137fec] hover:bg-[#0f72d6] text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-[#137fec]/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Đang kiểm tra...' : <><span>Đăng nhập</span><ArrowRight size={18} /></>}
                        </button>
                    </form>

                    <div className="relative my-7">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-3 font-medium tracking-wide text-slate-500">Hoặc đăng nhập với</span>
                        </div>
                    </div>

                    {googleError && !error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start gap-2">
                                <AlertCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
                                <span className="text-sm text-red-700">{googleError}</span>
                            </div>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={googleLoading || loading}
                        className={`w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-200 rounded-lg bg-white text-slate-700 hover:bg-slate-50 transition-colors font-semibold ${!hasFirebase ? 'opacity-70 grayscale' : ''} ${googleLoading ? 'opacity-75' : ''}`}
                        title={!hasFirebase ? 'Cần cấu hình Firebase trong Cài đặt' : ''}
                    >
                        {googleLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-slate-400 border-t-[#ec5b13] rounded-full animate-spin"></div>
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Google
                            </>
                        )}
                    </button>

                    <div className="mt-7 text-center text-sm text-slate-600">
                        Bạn chưa có tài khoản?
                        <span className="ml-1 font-bold text-[#137fec]">Đăng ký ngay</span>
                    </div>

                    <div className="mt-8 text-center text-slate-400 text-xs">
                        <p>© 2025 Quản lý Sinh viên. Tất cả quyền được bảo lưu.</p>
                        <div className="flex justify-center gap-4 mt-2">
                            <button className="hover:text-[#137fec] transition-colors" type="button">Điều khoản</button>
                            <button className="hover:text-[#137fec] transition-colors" type="button">Bảo mật</button>
                            <button className="hover:text-[#137fec] transition-colors" type="button">Hỗ trợ</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
