/**
 * Admin Authentication Service
 * Hệ thống xác thực riêng cho trang Admin
 */

import { getApiUrl as getBaseApiUrl } from './storage';

const ADMIN_STORAGE_KEY = 'admin_auth_token';
const ADMIN_SESSION_KEY = 'admin_session';

const getApiUrl = (endpoint: string): string => `${getBaseApiUrl()}${endpoint}`;

interface AdminSession {
  username: string;
  loginTime: number;
  expiresAt: number;
}

/**
 * Đăng nhập Admin
 */
export const adminLogin = async (username: string, password: string): Promise<boolean> => {
  try {
    const url = getApiUrl('/admin-api/login');
    console.log('[ADMIN AUTH] Login attempt:', { username, url });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    console.log('[ADMIN AUTH] Response status:', response.status);
    
    const data = await response.json();
    console.log('[ADMIN AUTH] Response data:', data);

    if (data.success && data.token) {
      const session: AdminSession = {
        username: data.username,
        loginTime: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 giờ
      };

      localStorage.setItem(ADMIN_STORAGE_KEY, data.token);
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
      console.log('[ADMIN AUTH] Login successful');
      return true;
    }

    console.log('[ADMIN AUTH] Login failed:', data.error);
    return false;
  } catch (error) {
    console.error('[ADMIN AUTH] Login error:', error);
    return false;
  }
};

/**
 * Đăng xuất Admin
 */
export const adminLogout = (): void => {
  localStorage.removeItem(ADMIN_STORAGE_KEY);
  localStorage.removeItem(ADMIN_SESSION_KEY);
};

/**
 * Kiểm tra đăng nhập Admin
 */
export const isAdminLoggedIn = (): boolean => {
  const token = localStorage.getItem(ADMIN_STORAGE_KEY);
  const sessionStr = localStorage.getItem(ADMIN_SESSION_KEY);

  if (!token || !sessionStr) {
    return false;
  }

  try {
    const session: AdminSession = JSON.parse(sessionStr);
    
    // Kiểm tra hết hạn
    if (Date.now() > session.expiresAt) {
      adminLogout();
      return false;
    }

    return true;
  } catch (error) {
    adminLogout();
    return false;
  }
};

/**
 * Lấy thông tin Admin hiện tại
 */
export const getAdminSession = (): AdminSession | null => {
  const sessionStr = localStorage.getItem(ADMIN_SESSION_KEY);
  
  if (!sessionStr) {
    return null;
  }

  try {
    return JSON.parse(sessionStr);
  } catch (error) {
    return null;
  }
};

/**
 * Lấy token Admin
 */
export const getAdminToken = (): string | null => {
  return localStorage.getItem(ADMIN_STORAGE_KEY);
};

/**
 * Gọi API Admin với authentication
 */
export const adminFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const token = getAdminToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  return fetch(getApiUrl(endpoint), {
    ...options,
    headers,
  });
};
