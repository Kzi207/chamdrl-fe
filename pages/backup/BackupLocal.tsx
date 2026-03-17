import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Server, Download, Trash2, RefreshCw, Plus, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { getApiUrl } from '../../services/storage';

const API_BASE = getApiUrl();

interface BackupFile {
  filename: string;
  createdAt: string;
  sizeBytes?: number;
  sizeLabel?: string;
}

const BackupLocal: React.FC = () => {
  const location = useLocation();
  const isInAdminPortal = location.pathname.startsWith('/admin');
  const backPath = isInAdminPortal ? '/admin/backup' : '/backup';
  
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/backup/list`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Không thể tải danh sách backup');
      
      // Map sang format chuẩn
      setBackups((data.backups || []).map((b: any) => ({
        filename: b.name,
        createdAt: b.date,
        sizeBytes: typeof b.sizeBytes === 'number' ? b.sizeBytes : undefined,
        sizeLabel: b.size
      })));
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    setCreating(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/backup/create`, { method: 'POST' });
      if (!res.ok) throw new Error('Không thể tạo backup');
      const data = await res.json();
      const filename = data.filename || data.file;
      setMessage({ type: 'success', text: `Đã tạo backup: ${filename}` });
      loadBackups();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setCreating(false);
    }
  };

  const restoreBackup = async (filename: string) => {
    if (!confirm(`Bạn có chắc muốn khôi phục database từ "${filename}"?\n\n⚠️ Toàn bộ dữ liệu hiện tại sẽ bị ghi đè!`)) return;
    
    setRestoring(filename);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/backup/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: filename })
      });
      if (!res.ok) throw new Error('Không thể khôi phục backup');
      setMessage({ type: 'success', text: `Đã khôi phục thành công từ ${filename}` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setRestoring(null);
    }
  };

  const deleteBackup = async (filename: string) => {
    if (!confirm(`Bạn có chắc muốn xóa backup "${filename}"?`)) return;
    
    setDeleting(filename);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/backup/delete?file=${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Không thể xóa backup');
      setMessage({ type: 'success', text: `Đã xóa ${filename}` });
      loadBackups();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setDeleting(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatSizeLabel = (sizeBytes?: number, sizeLabel?: string) => {
    if (typeof sizeBytes === 'number') return formatSize(sizeBytes);
    if (sizeLabel) return sizeLabel;
    return 'N/A';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            <div className="p-2 bg-blue-600 rounded-lg">
              <Server className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Backup Local</h1>
              <p className="text-xs text-slate-400">Quản lý backup trên server</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Actions */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={createBackup}
            disabled={creating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {creating ? (
              <RefreshCw className="animate-spin" size={18} />
            ) : (
              <Plus size={18} />
            )}
            {creating ? 'Đang tạo...' : 'Tạo Backup Mới'}
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
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <h2 className="font-bold text-white">Danh sách Backup ({backups.length})</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
              Đang tải...
            </div>
          ) : backups.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Server className="mx-auto mb-2 opacity-50" size={32} />
              <p>Chưa có backup nào</p>
              <p className="text-sm mt-1">Nhấn "Tạo Backup Mới" để bắt đầu</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {backups.map((backup) => (
                <div
                  key={backup.filename}
                  className="p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{backup.filename}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {formatDate(backup.createdAt)}
                      </span>
                      <span>{formatSizeLabel(backup.sizeBytes, backup.sizeLabel)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => restoreBackup(backup.filename)}
                      disabled={restoring === backup.filename}
                      className="flex items-center gap-1 px-3 py-2 bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded-lg transition-colors disabled:opacity-50 text-sm"
                    >
                      {restoring === backup.filename ? (
                        <RefreshCw className="animate-spin" size={14} />
                      ) : (
                        <Download size={14} />
                      )}
                      Restore
                    </button>

                    <button
                      onClick={() => deleteBackup(backup.filename)}
                      disabled={deleting === backup.filename}
                      className="flex items-center gap-1 px-3 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition-colors disabled:opacity-50 text-sm"
                    >
                      {deleting === backup.filename ? (
                        <RefreshCw className="animate-spin" size={14} />
                      ) : (
                        <Trash2 size={14} />
                      )}
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-800 rounded-xl text-blue-300 text-sm">
          <p className="font-bold mb-1">💡 Lưu ý:</p>
          <ul className="list-disc list-inside space-y-1 text-blue-300/70">
            <li>Backup được lưu tại thư mục <code className="bg-slate-800 px-1 rounded">be/backups/</code></li>
            <li>Nên tạo backup trước khi thực hiện các thay đổi lớn</li>
            <li>Restore sẽ ghi đè toàn bộ dữ liệu hiện tại</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default BackupLocal;
