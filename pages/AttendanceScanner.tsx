
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';
import { markAttendance, getActivities } from '../services/storage';
import { Activity, Student } from '../types';
import { ArrowLeft, Camera, CheckCircle, XCircle, AlertCircle, ArrowUp } from 'lucide-react';

const AttendanceScanner: React.FC = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [activity, setActivity] = useState<Activity | null>(null);
  const [cameraError, setCameraError] = useState<string>('');
  const [scanResult, setScanResult] = useState<{
    status: 'idle' | 'processing' | 'success' | 'error' | 'duplicate';
    message: string;
    student?: Student;
  }>({ status: 'idle', message: 'Sẵn sàng quét...' });

  // Refs for logic control
  const lastScanTimeRef = useRef<number>(0);
  const lastCodeRef = useRef<string>('');
  const animationFrameRef = useRef<number>(0);
  const videoFrameCallbackIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0); // Throttle decode (ms)
  const isProcessingRef = useRef<boolean>(false); // Lock async calls

  // Native detector (Chrome/Edge Android/Desktop) is typically faster & more robust
  const barcodeDetectorRef = useRef<any>(null);
  const isDetectingRef = useRef<boolean>(false);
  const barcodeDetectorEnabledRef = useRef<boolean>(true);
  const barcodeDetectorErrorCountRef = useRef<number>(0);
  const lastNativeDetectTimeRef = useRef<number>(0);
  const roiOnlyCounterRef = useRef<number>(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const scheduleNextFrame = () => {
    const video = videoRef.current as any;
    if (!video) return;

    // Prefer per-video-frame callback when supported (more stable than rAF)
    if (typeof video.requestVideoFrameCallback === 'function') {
      videoFrameCallbackIdRef.current = video.requestVideoFrameCallback((now: number) => {
        tick(now);
      });
      return;
    }

    animationFrameRef.current = requestAnimationFrame(() => tick(performance.now()));
  };

  useEffect(() => {
    const init = async () => {
      if (!activityId) return;
      const acts = await getActivities();
      const current = acts.find(a => a.id === activityId);
      if (current) setActivity(current);
    };
    init();

    // Prefer native BarcodeDetector when available
    try {
      const WD = (window as any);
      if (WD?.BarcodeDetector && !barcodeDetectorRef.current) {
        barcodeDetectorRef.current = new WD.BarcodeDetector({ formats: ['qr_code'] });
      }
    } catch {
      barcodeDetectorRef.current = null;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [activityId]);

  const startCamera = async () => {
    setCameraError('');
    try {
      // Prefer environment (back) camera
      const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 120, max: 120 }
          } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play().catch(e => console.error("Play error:", e));

        // Try to enable continuous focus/exposure when supported (Android Chrome/Edge)
        const track = stream.getVideoTracks?.()[0];
        if (track && typeof (track as any).applyConstraints === 'function') {
          (track as any)
            .applyConstraints({
              advanced: [
                { focusMode: 'continuous' },
                { exposureMode: 'continuous' },
                { whiteBalanceMode: 'continuous' },
              ],
            })
            .catch(() => {
              // Ignore unsupported constraints
            });
        }

        // Reset loop state
        lastFrameTimeRef.current = 0;
        lastNativeDetectTimeRef.current = 0;
        isDetectingRef.current = false;
        roiOnlyCounterRef.current = 0;
        scheduleNextFrame();
      }
    } catch (err) {
      console.error("Camera error", err);
      let msg = 'Không thể truy cập camera.';
      if (!window.isSecureContext) {
          msg = 'Lỗi bảo mật: Trình duyệt chặn Camera trên kết nối HTTP (IP LAN). Hãy dùng "Tải ảnh lên" hoặc chạy trên Localhost.';
      } else {
          msg = 'Vui lòng cấp quyền truy cập Camera trên trình duyệt.';
      }
      setCameraError(msg);
      setScanResult({ status: 'error', message: msg });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    const video = videoRef.current as any;
    if (video && typeof video.cancelVideoFrameCallback === 'function' && videoFrameCallbackIdRef.current != null) {
      try {
        video.cancelVideoFrameCallback(videoFrameCallbackIdRef.current);
      } catch {
        // ignore
      }
      videoFrameCallbackIdRef.current = null;
    }
  };

  const tick = (frameNowMs: number) => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {

      // 1) FAST PATH: Native detector (async). Avoid overlapping detect() calls.
      // IMPORTANT: When BarcodeDetector is available, do NOT run jsQR in parallel (it tanks FPS).
      if (barcodeDetectorRef.current && barcodeDetectorEnabledRef.current) {
        const nativeIntervalMs = -1; // run immediately without any delay
        if (!isDetectingRef.current && frameNowMs - lastNativeDetectTimeRef.current >= nativeIntervalMs) {
          lastNativeDetectTimeRef.current = frameNowMs;
          isDetectingRef.current = true;
          barcodeDetectorRef.current
            .detect(videoRef.current)
            .then((barcodes: any[]) => {
              const raw = barcodes?.[0]?.rawValue || barcodes?.[0]?.value;
              if (raw) handleScan(String(raw));
              barcodeDetectorErrorCountRef.current = 0;
            })
            .catch(() => {
              // If the API is flaky/blocked, disable after a few errors and fall back to jsQR
              barcodeDetectorErrorCountRef.current += 1;
              if (barcodeDetectorErrorCountRef.current >= 6) {
                barcodeDetectorEnabledRef.current = false;
              }
            })
            .finally(() => {
              isDetectingRef.current = false;
            });
        }

        scheduleNextFrame();
        return;
      }

      // 2) FALLBACK: jsQR - throttle decode frequency (CPU heavy)
      const jsqrIntervalMs = 16; // ~60fps target for faster detection
      if (frameNowMs - lastFrameTimeRef.current < jsqrIntervalMs) {
        scheduleNextFrame();
        return;
      }
      lastFrameTimeRef.current = frameNowMs;

      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        if (ctx) {
          const videoWidth = videoRef.current.videoWidth;
          const videoHeight = videoRef.current.videoHeight;

          // jsQR with center ROI (much faster than full frame)
          // Scan ROI most frames, and occasionally scan full frame in case the QR is off-center.
          const scanFullFrameEvery = 20; // ~0.33s at ~60fps - scan full frame more often
          roiOnlyCounterRef.current = (roiOnlyCounterRef.current + 1) % scanFullFrameEvery;
          const shouldScanFull = roiOnlyCounterRef.current === 0;

          // Speed trick: most frames try non-inverted first (fast). Occasionally try both for robustness.
          const tryBothInversionEvery = 6; // check both inversions more frequently
          const shouldTryBothInversion = roiOnlyCounterRef.current % tryBothInversionEvery === 0;
          const inversionAttempts = shouldTryBothInversion ? 'attemptBoth' : 'dontInvert';

          const MAX_SIDE = 720; // higher ROI resolution for better accuracy
          if (shouldScanFull) {
            // Full frame but downscaled to keep it fast
            const MAX_ANALYSIS_WIDTH = 960;
            let analysisWidth = videoWidth;
            let analysisHeight = videoHeight;
            if (videoWidth > MAX_ANALYSIS_WIDTH) {
              const scale = MAX_ANALYSIS_WIDTH / videoWidth;
              analysisWidth = MAX_ANALYSIS_WIDTH;
              analysisHeight = videoHeight * scale;
            }
            canvas.width = Math.round(analysisWidth);
            canvas.height = Math.round(analysisHeight);
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts,
            });

            if (code?.data) handleScan(code.data);
          } else {
            // Center ROI crop
            const roiSide = Math.floor(Math.min(videoWidth, videoHeight) * 0.62);
            const sx = Math.floor((videoWidth - roiSide) / 2);
            const sy = Math.floor((videoHeight - roiSide) / 2);
            const outSide = Math.min(MAX_SIDE, roiSide);
            canvas.width = outSide;
            canvas.height = outSide;
            ctx.drawImage(videoRef.current, sx, sy, roiSide, roiSide, 0, 0, outSide, outSide);
            const imageData = ctx.getImageData(0, 0, outSide, outSide);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts,
            });

            if (code?.data) handleScan(code.data);
          }
        }
      }
    }
    scheduleNextFrame();
  };

  const handleScan = async (codeData: string) => {
    const now = Date.now();
    
    // 1. Nếu đang xử lý API call thì bỏ qua
    if (isProcessingRef.current) return;

    // 2. LOGIC MÃ CŨ: Nếu mã vừa quét GIỐNG mã trước đó -> Chờ 0.8 giây
    if (codeData === lastCodeRef.current) {
      if (now - lastScanTimeRef.current < 800) return;
    }

    // 3. LOGIC MÃ MỚI: Quét NGAY LẬP TỨC (Không delay)
    
    // --- START PROCESSING ---
    isProcessingRef.current = true;
    lastScanTimeRef.current = now;
    lastCodeRef.current = codeData;

    // Instant feedback: user feels "nhận liền" even if save takes time
    setScanResult({
      status: 'processing',
      message: `Đã nhận mã: ${codeData}. Đang xử lý...`,
    });
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        (navigator as any).vibrate?.(30);
      } catch {
        // ignore
      }
    }

    if (!activityId) {
        isProcessingRef.current = false;
        return;
    }

    try {
        const result = await markAttendance(activityId, codeData);
        
        if (result.status === 'success') {
            setScanResult({
                status: 'success',
                message: 'Điểm danh thành công!',
                student: result.student
            });
        } else if (result.status === 'already_present') {
            setScanResult({
                status: 'duplicate',
                message: 'Sinh viên này đã có mặt!',
                student: result.student
            });
        } else if (result.status === 'student_not_found') {
             setScanResult({
                status: 'error',
                message: `Mã không tồn tại: ${codeData}`
            });
        } else {
            setScanResult({
                status: 'error',
                message: `Lỗi hệ thống`
            });
        }
    } catch (e) {
        console.error(e);
        setScanResult({ status: 'error', message: 'Lỗi kết nối' });
    } finally {
        isProcessingRef.current = false;
    }
  };

  const getStatusColor = () => {
    switch(scanResult.status) {
      case 'processing': return 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-500 text-blue-800';
      case 'success': return 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-500 text-green-800';
      case 'duplicate': return 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-500 text-yellow-800';
      case 'error': return 'bg-gradient-to-br from-red-50 to-pink-50 border-red-500 text-red-800';
      default: return 'bg-gradient-to-br from-white to-slate-50 border-slate-300 text-slate-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-slate-800 to-slate-700 text-white flex items-center gap-4 shadow-lg z-10 border-b border-slate-600">
        <button onClick={() => navigate('/activities')} className="group p-2.5 hover:bg-white/10 bg-slate-700/50 border border-slate-600 rounded-xl transition-all shadow-sm hover:shadow-md">
          <ArrowLeft className="group-hover:text-blue-300 transition-colors" />
        </button>
        <div className="overflow-hidden">
          <h1 className="font-bold text-lg md:text-xl whitespace-nowrap bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">Điểm Danh QR</h1>
          <p className="text-sm text-slate-300 truncate">{activity?.name || 'Đang tải...'}</p>
        </div>
      </div>

      {/* Camera Viewport */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black">
        {!cameraError ? (
            <video 
                ref={videoRef} 
                className="absolute inset-0 w-full h-full object-cover opacity-90" 
                muted 
                playsInline
            />
        ) : (
            <div className="text-center p-6 max-w-sm">
                <div className="bg-red-900/50 text-red-200 p-4 rounded-lg border border-red-500 mb-4">
                    <AlertCircle className="mx-auto mb-2" size={32}/>
                    <p className="text-sm">{cameraError}</p>
                </div>
            </div>
        )}
        
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Scanner Frame Overlay */}
        {!cameraError && (
            <div className="relative z-10 w-[90vw] h-[90vw] max-w-[500px] max-h-[500px] sm:w-[600px] sm:h-[600px] sm:max-w-none sm:max-h-none border-4 border-blue-400/90 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.65),0_0_30px_rgba(96,165,250,0.4)]">
                <div className="absolute top-0 left-0 w-10 h-10 border-t-[5px] border-l-[5px] border-blue-400 -mt-0.5 -ml-0.5 rounded-tl-2xl shadow-[0_0_15px_rgba(96,165,250,0.6)]"></div>
                <div className="absolute top-0 right-0 w-10 h-10 border-t-[5px] border-r-[5px] border-blue-400 -mt-0.5 -mr-0.5 rounded-tr-2xl shadow-[0_0_15px_rgba(96,165,250,0.6)]"></div>
                <div className="absolute bottom-0 left-0 w-10 h-10 border-b-[5px] border-l-[5px] border-blue-400 -mb-0.5 -ml-0.5 rounded-bl-2xl shadow-[0_0_15px_rgba(96,165,250,0.6)]"></div>
                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-[5px] border-r-[5px] border-blue-400 -mb-0.5 -mr-0.5 rounded-br-2xl shadow-[0_0_15px_rgba(96,165,250,0.6)]"></div>
                
                {/* Scanning line animation */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-400 to-transparent shadow-[0_0_15px_rgba(239,68,68,0.9)] animate-[scan_2s_ease-in-out_infinite]"></div>

                <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-white text-sm font-bold px-4 py-2 bg-black/60 rounded-2xl backdrop-blur-md border border-white/20 shadow-lg">
                        📱 Giữ mã QR trong khung
                    </p>
                </div>
            </div>
        )}
      </div>

      {/* Result Panel */}
      <div className="bg-gradient-to-br from-white to-slate-50 z-30 shadow-[0_-5px_30px_rgba(0,0,0,0.4)] pb-6 pt-4 px-4 rounded-t-3xl min-h-[180px] border-t-4 border-blue-200">
        <div className={`p-4 md:p-5 rounded-2xl border-l-[6px] flex items-start gap-3 md:gap-4 transition-all duration-200 shadow-lg ${getStatusColor()}`}>
            {scanResult.status === 'processing' && <Camera className="shrink-0 text-blue-600 mt-1 animate-pulse" size={28} />}
          {scanResult.status === 'success' && <CheckCircle className="shrink-0 text-green-600 mt-1" size={28} />}
          {scanResult.status === 'duplicate' && <AlertCircle className="shrink-0 text-yellow-600 mt-1" size={28} />}
          {scanResult.status === 'error' && <XCircle className="shrink-0 text-red-600 mt-1" size={28} />}
          {scanResult.status === 'idle' && <Camera className="shrink-0 text-slate-400 mt-1" size={28} />}
          
          <div className="flex-1">
            <h3 className="font-black text-xl md:text-2xl leading-tight">
                {scanResult.status === 'idle' ? 'Sẵn sàng' : 
                scanResult.status === 'processing' ? 'Đang xử lý' :
                 scanResult.status === 'success' ? 'Thành công' : 
                 scanResult.status === 'duplicate' ? 'Đã điểm danh' : 'Thất bại'}
            </h3>
            <p className="text-sm md:text-base mt-1 font-semibold opacity-90">{scanResult.message}</p>
            
            {scanResult.student && (
                <div className="mt-4 pt-4 border-t-2 border-black/10 grid grid-cols-1 gap-2 text-sm md:text-base">
                    <div className="font-black text-lg md:text-xl text-gray-900 uppercase">
                        {scanResult.student.lastName} {scanResult.student.firstName}
                    </div>
                    <div className="text-gray-600 font-mono bg-white/50 rounded-lg p-2 inline-block">
                        MSSV: <span className="font-bold text-gray-900">{scanResult.student.id}</span>
                    </div>
                    <div className="text-gray-500 text-xs md:text-sm">
                        🎂 Ngày sinh: {scanResult.student.dob}
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes scan {
            0% { top: 0; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
      `}</style>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 p-3 md:p-4 bg-gradient-to-br from-blue-600 to-cyan-600 text-white rounded-2xl shadow-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 hover:scale-110 border-2 border-blue-400"
          title="Quay lại đầu trang"
        >
          <ArrowUp size={24} />
        </button>
      )}
    </div>
  );
};

export default AttendanceScanner;
