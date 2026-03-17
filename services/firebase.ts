import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, Auth } from 'firebase/auth';
import { getFirebaseConfig } from './storage';

// Dung POPUP cho tat ca thiet bi (PC + mobile).
// KHONG dung signInWithRedirect vi Safari ITP / iOS WebKit block third-party cookies
// cua Firebase (cross-origin qua firebaseapp.com) khien getRedirectResult() luon null.

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let provider: GoogleAuthProvider | undefined;

const friendlyError = (error: any): string => {
    const code: string = error?.code || '';
    const msg: string = error?.message || '';

    const errorMap: Record<string, string> = {
        'auth/unauthorized-domain': `Domain "${window.location.hostname}" chua duoc phep trong Firebase Console. Vui long lien he quan tri vien.`,
        'auth/operation-not-allowed': 'Dang nhap Google chua duoc bat. Vui long lien he quan tri vien.',
        'auth/network-request-failed': 'Loi ket noi mang. Vui long kiem tra internet va thu lai.',
        'auth/popup-closed-by-user': '',
        'auth/cancelled-popup-request': '',
        'auth/popup-blocked': 'Trinh duyet da chan cua so dang nhap.\nVui long cho phep popup cho trang nay roi thu lai.',
        'auth/too-many-requests': 'Qua nhieu lan thu. Vui long doi vai phut roi thu lai.'
    };

    return errorMap[code] ?? (msg || 'Loi dang nhap Google. Vui long thu lai.');
};

export const isFirebaseConfigured = (): boolean => {
    try {
        const cfg = getFirebaseConfig();
        const ok = Boolean(cfg?.apiKey && cfg.authDomain && cfg.apiKey !== 'PASTE_YOUR_API_KEY_HERE' && cfg.apiKey.length > 20);
        console.log('[Firebase] Configured:', ok, '| Domain:', cfg?.authDomain);
        return ok;
    } catch (e) {
        console.error('[Firebase] Config check error:', e);
        return false;
    }
};

export const initFirebase = (): boolean => {
    try {
        if (!isFirebaseConfigured()) return false;

        if (!app) {
            const cfg = getFirebaseConfig();
            const apps = getApps();
            app = apps.length ? apps[0] : initializeApp(cfg);
            auth = getAuth(app);
            provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            provider.addScope('email');
            provider.addScope('profile');
            console.log('[Firebase] Initialized  Domain:', cfg.authDomain);
        }
        return true;
    } catch (e) {
        console.error('[Firebase] Init error:', e);
        return false;
    }
};

export const signInWithGoogle = async (): Promise<any> => {
    console.log('[Firebase] signInWithGoogle called | online:', navigator.onLine);

    if (!navigator.onLine) {
        throw new Error('Khong co ket noi internet. Vui long kiem tra mang va thu lai.');
    }

    if (!auth || !provider) {
        if (!initFirebase() || !auth || !provider) {
            throw new Error(!isFirebaseConfigured() ? 'Vui long vao Cai dat de dan ma cau hinh Firebase.' : 'Khoi tao Firebase that bai. Vui long tai lai trang.');
        }
    }

    try {
        console.log('[Firebase] Opening popup...');
        const result = await signInWithPopup(auth, provider);
        console.log('[Firebase] Popup success:', result.user?.email);
        return result.user;
    } catch (error: any) {
        console.error('[Firebase] Popup error:', error.code, error.message);
        const errMsg = friendlyError(error);
        if (!errMsg) return null; // popup-closed-by-user / cancelled
        throw new Error(errMsg);
    }
};

initFirebase();
