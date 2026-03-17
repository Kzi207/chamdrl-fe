import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, History, Server, Cloud, RefreshCw, CheckCircle, AlertTriangle, Clock, Download } from 'lucide-react';
import { getApiUrl } from '../../services/storage';

const API_BASE = getApiUrl();

interface BackupItem {
  name: string;
  date: string;
  source: 'local' | 'cloud';
  size?: number;
}

const BackupRestore: React.FC = () => {
  const location = useLocation();
  const isInAdminPortal = location.pathname.startsWith('/admin');
  const backPath = isInAdminPortal ? '/admin/backup' : '/backup';
  
  const [allBackups, setAllBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filter, setFilter] = useState<'all' | 'local' | 'cloud'>('all');

  useEffect(() => {
    loadAllBackups();
  }, []);

  const loadAllBackups = async () => {
    setLoading(true);
    setMessage(null);
    
    const combined: BackupItem[] = [];

    // Load local backups
    try {
      const localRes = await fetch(`${API_BASE}/backup/list`);
      const localJson = await localRes.json();
      if (localJson.success && localJson.backups) {
        localJson.backups.forEach((b: any) => {
          combined.push({
            name: b.name,
            date: b.date,
            source: 'local',
            size: typeof b.sizeBytes === 'number' ? b.sizeBytes : parseInt(b.size) || 0
          });
        });
      }
    } catch {}

    // Load cloud backups
    try {
      const cloudRes = await fetch(`${API_BASE}/backup/gsheet/list`);
      const cloudJson = await cloudRes.json();
      if (cloudJson.success && cloudJson.backups) {
        cloudJson.backups.forEach((b: any) => {
          combined.push({
            name: b.id || b.name,
            date: b.date,
            source: 'cloud'
          });
        });
      }
    } catch {}

    // Sort by date (newest first)
    combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setAllBackups(combined);
    setLoading(false);
  };

  const restoreBackup = async (backup: BackupItem) => {
    const confirmMsg = backup.source === 'local'
      ? `Khôi phục từ LOCAL: "${backup.name}"?`
      : `Khôi phục từ CLOUD: "${backup.name}"?`;
    
    if (!confirm(`${confirmMsg}\n\n⚠️ Toàn bộ dữ liệu hiện tại sẽ bị ghi đè!`)) return;
    
    setRestoring(backup.name);
    setMessage(null);

    try {
      let res: Response;
      
      if (backup.source === 'local') {
        res = await fetch(`${API_BASE}/backup/restore`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: backup.name })
        });
      } else {
        res = await fetch(`${API_BASE}/backup/gsheet/restore`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: backup.name, sheetName: backup.name })
        });
      }

      if (!res.ok) throw new Error('Không thể khôi phục backup');
      
      setMessage({ 
        type: 'success', 
        text: `✅ Đã khôi phục thành công từ ${backup.source === 'local' ? 'Local' : 'Cloud'}: ${backup.name}` 
      });
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

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const filteredBackups = allBackups.filter(b => {
    if (filter === 'all') return true;
    return b.source === filter;
  });

  const localCount = allBackups.filter(b => b.source === 'local').length;
  const cloudCount = allBackups.filter(b => b.source === 'cloud').length;

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
            <div className="p-2 bg-orange-600 rounded-lg">
              <History className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Khôi Phục Nhanh</h1>
              <p className="text-xs text-slate-400">Restore database từ backup</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Warning Banner */}
        <div className="mb-6 p-4 bg-orange-900/30 border border-orange-700 rounded-xl flex items-center gap-3">
          <AlertTriangle className="text-orange-400 shrink-0" size={24} />
          <div>
            <h3 className="text-orange-400 font-bold">Cảnh báo</h3>
            <p className="text-orange-300/70 text-sm">
              Khôi phục sẽ ghi đè toàn bộ dữ liệu hiện tại. Hãy chắc chắn trước khi thực hiện.
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-slate-600 text-white' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Tất cả ({allBackups.length})
          </button>
          <button
            onClick={() => setFilter('local')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              filter === 'local' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Server size={14} />
            Local ({localCount})
          </button>
          <button
            onClick={() => setFilter('cloud')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              filter === 'cloud' 
                ? 'bg-green-600 text-white' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Cloud size={14} />
            Cloud ({cloudCount})
          </button>

          <button
            onClick={loadAllBackups}
            disabled={loading}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
          >
            <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
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
            <h2 className="font-bold text-white">Chọn backup để khôi phục</h2>
            <p className="text-xs text-slate-400 mt-1">Sắp xếp theo thời gian (mới nhất trước)</p>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
              Đang tải danh sách backup...
            </div>
          ) : filteredBackups.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <History className="mx-auto mb-2 opacity-50" size={32} />
              <p>Không có backup nào</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredBackups.map((backup) => (
                <div
                  key={`${backup.source}-${backup.name}`}
                  className="p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* Source Icon */}
                    <div className={`p-2 rounded-lg ${
                      backup.source === 'local' 
                        ? 'bg-blue-600/20 text-blue-400' 
                        : 'bg-green-600/20 text-green-400'
                    }`}>
                      {backup.source === 'local' ? <Server size={18} /> : <Cloud size={18} />}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-medium text-white">{backup.name}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          backup.source === 'local'
                            ? 'bg-blue-900/50 text-blue-300'
                            : 'bg-green-900/50 text-green-300'
                        }`}>
                          {backup.source === 'local' ? 'Local' : 'Cloud'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatDate(backup.date)}
                        </span>
                        {backup.size && <span>{formatSize(backup.size)}</span>}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => restoreBackup(backup)}
                    disabled={restoring === backup.name}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
                  >
                    {restoring === backup.name ? (
                      <RefreshCw className="animate-spin" size={16} />
                    ) : (
                      <Download size={16} />
                    )}
                    Khôi phục
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-900/20 border border-blue-800 rounded-xl text-blue-300 text-sm">
            <p className="font-bold mb-1 flex items-center gap-2">
              <Server size={16} /> Local Backup
            </p>
            <p className="text-blue-300/70">
              Backup lưu trên server, restore nhanh nhưng có thể mất nếu server hỏng.
            </p>
          </div>
          <div className="p-4 bg-green-900/20 border border-green-800 rounded-xl text-green-300 text-sm">
            <p className="font-bold mb-1 flex items-center gap-2">
              <Cloud size={16} /> Cloud Backup
            </p>
            <p className="text-green-300/70">
              Backup lưu trên Google Sheet, an toàn hơn nhưng restore chậm hơn.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BackupRestore;
