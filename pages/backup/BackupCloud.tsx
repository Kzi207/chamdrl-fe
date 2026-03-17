import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Cloud, Download, RefreshCw, Upload, CheckCircle, AlertTriangle, Clock, ExternalLink } from 'lucide-react';
import { getApiUrl } from '../../services/storage';

const API_BASE = getApiUrl();

interface CloudBackup {
  id: string;
  date: string;
}

const BackupCloud: React.FC = () => {
  const location = useLocation();
  const isInAdminPortal = location.pathname.startsWith('/admin');
  const backPath = isInAdminPortal ? '/admin/backup' : '/backup';
  
  const [backups, setBackups] = useState<CloudBackup[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [apiConfigured, setApiConfigured] = useState(true);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/backup/gsheet/list`);
      const data = await res.json();
      
      if (!data.success) {
        if (data.error?.includes('not configured') || data.error?.includes('GOOGLE_SHEET_API')) {
          setApiConfigured(false);
          throw new Error('Google Sheet API chưa được cấu hình');
        }
        throw new Error(data.error || 'Không thể tải danh sách');
      }
      
      const normalized = (data.backups || []).map((b: any) => ({
        id: b.id || b.name,
        date: b.date
      })).filter((b: any) => b.id);
      setBackups(normalized);
      setApiConfigured(true);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const uploadToCloud = async () => {
    setUploading(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/backup/gsheet/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saveLocal: false })
      });
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.message || data.error || 'Không thể upload backup');
      }
      
      setMessage({ type: 'success', text: 'Đã upload backup lên Google Sheet thành công!' });
      loadBackups();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setUploading(false);
    }
  };

  const restoreFromCloud = async (backupId: string) => {
    if (!confirm(`Bạn có chắc muốn khôi phục database từ "${backupId}"?\n\n⚠️ Toàn bộ dữ liệu hiện tại sẽ bị ghi đè!`)) return;
    
    setRestoring(backupId);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/backup/gsheet/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: backupId })
      });
      if (!res.ok) throw new Error('Không thể khôi phục backup');
      setMessage({ type: 'success', text: `Đã khôi phục thành công từ ${backupId}` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setRestoring(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            to={backPath}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="text-slate-400" size={20} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-600 rounded-lg">
              <Cloud className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Google Sheet Cloud</h1>
              <p className="text-xs text-slate-400">Backup trên đám mây</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* API Not Configured Warning */}
        {!apiConfigured && (
          <div className="mb-6 p-6 bg-yellow-900/30 border border-yellow-700 rounded-2xl">
            <div className="flex items-start gap-4">
              <AlertTriangle className="text-yellow-400 shrink-0 mt-1" size={24} />
              <div>
                <h3 className="text-yellow-400 font-bold text-lg mb-2">Cần cấu hình Google Sheet API</h3>
                <p className="text-yellow-300/70 mb-4">
                  Để sử dụng tính năng backup đám mây, bạn cần:
                </p>
                <ol className="list-decimal list-inside text-yellow-300/70 space-y-2 mb-4">
                  <li>Tạo Google Apps Script từ file <code className="bg-slate-800 px-1 rounded">docs/google-apps-script-backup.js</code></li>
                  <li>Deploy thành Web App và copy URL</li>
                  <li>Thêm vào file <code className="bg-slate-800 px-1 rounded">.env</code>: <code className="bg-slate-800 px-1 rounded">GOOGLE_SHEET_API=URL_của_bạn</code></li>
                  <li>Khởi động lại server</li>
                </ol>
                <a 
                  href="https://script.google.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                >
                  <ExternalLink size={16} />
                  Mở Google Apps Script
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {apiConfigured && (
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={uploadToCloud}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <RefreshCw className="animate-spin" size={18} />
              ) : (
                <Upload size={18} />
              )}
              {uploading ? 'Đang upload...' : 'Upload Backup Lên Cloud'}
            </button>

            <button
              onClick={loadBackups}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
            >
              <RefreshCw className={loading ? 'animate-spin' : ''} size={18} />
              Làm mới
            </button>
          </div>
        )}

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-900/30 border border-green-700 text-green-400' 
              : 'bg-red-900/30 border border-red-700 text-red-400'
          }`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
            {message.text}
          </div>
        )}

        {/* Backup List */}
        {apiConfigured && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-700">
              <h2 className="font-bold text-white flex items-center gap-2">
                <Cloud size={18} className="text-green-400" />
                Backup trên Google Sheet ({backups.length})
              </h2>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                Đang tải từ Google Sheet...
              </div>
            ) : backups.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Cloud className="mx-auto mb-2 opacity-50" size={32} />
                <p>Chưa có backup nào trên cloud</p>
                <p className="text-sm mt-1">Nhấn "Upload Backup Lên Cloud" để bắt đầu</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {backups.map((backup) => (
                  <div
                    key={backup.id}
                    className="p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-white flex items-center gap-2">
                        <Cloud size={16} className="text-green-400" />
                        {backup.id}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {formatDate(backup.date)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => restoreFromCloud(backup.id)}
                      disabled={restoring === backup.id}
                      className="flex items-center gap-1 px-3 py-2 bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded-lg transition-colors disabled:opacity-50 text-sm"
                    >
                      {restoring === backup.id ? (
                        <RefreshCw className="animate-spin" size={14} />
                      ) : (
                        <Download size={14} />
                      )}
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Info */}
        <div className="mt-6 p-4 bg-green-900/20 border border-green-800 rounded-xl text-green-300 text-sm">
          <p className="font-bold mb-1">☁️ Ưu điểm của Cloud Backup:</p>
          <ul className="list-disc list-inside space-y-1 text-green-300/70">
            <li>Dữ liệu được lưu trữ an toàn trên Google Drive</li>
            <li>Có thể truy cập từ bất kỳ đâu</li>
            <li>Không mất dữ liệu khi server gặp sự cố</li>
            <li>Dễ dàng chia sẻ và di chuyển dữ liệu</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default BackupCloud;
