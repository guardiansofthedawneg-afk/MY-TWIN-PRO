import { apiPost, apiGet } from '../../lib/httpClient';
import { googleLogin } from '../../lib/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TOKEN: 'mytwin-token',
  USER: 'mytwin-user',
  DEVICE_TRUSTED: 'mytwin-device-trusted',
  LAST_SESSION: 'mytwin-last-session',
};

export interface AuthResult {
  token: string;
  user_id: string;
  onboarded: boolean;
  twin_name?: string;
  isNewUser: boolean;
}

export interface SessionRestoreResult {
  canRestore: boolean;
  token?: string;
  user_id?: string;
  lastSessionId?: string;
  reason?: string;
}

export class AuthService {
  async login(email: string, password: string): Promise<AuthResult> {
    const data = await apiPost('/api/auth/login', { email: email.trim(), password });
    if (data?.token && data?.user_id) {
      await this.saveAuthData(data.token, data.user_id);
      return { token: data.token, user_id: data.user_id, onboarded: data.onboarded || false, isNewUser: false };
    }
    throw new Error('فشل تسجيل الدخول');
  }

  async signup(email: string, password: string, twinName: string = 'توأمك', lang: string = 'ar'): Promise<AuthResult> {
    const data = await apiPost('/api/auth/signup', { email: email.trim(), password, twin_name: twinName, lang });
    if (data?.token && data?.user_id) {
      await this.saveAuthData(data.token, data.user_id);
      return { token: data.token, user_id: data.user_id, onboarded: false, twin_name: twinName, isNewUser: true };
    }
    throw new Error('فشل إنشاء الحساب');
  }

  async loginWithGoogle(lang: string = 'ar'): Promise<AuthResult> {
    const data = await googleLogin(lang);
    if (data?.token && data?.user_id) {
      await this.saveAuthData(data.token, data.user_id);
      return { token: data.token, user_id: data.user_id, onboarded: data.onboarded || false, isNewUser: !data.onboarded };
    }
    throw new Error('فشل تسجيل الدخول بـ Google');
  }

  async forgotPassword(email: string): Promise<void> {
    await apiPost('/api/auth/forgot-password', { email: email.trim() });
  }

  async logout(): Promise<void> {
    await AsyncStorage.multiRemove([KEYS.TOKEN, KEYS.USER, KEYS.LAST_SESSION]);
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem(KEYS.TOKEN);
    return !!token;
  }

  async getUserId(): Promise<string | null> {
    return await AsyncStorage.getItem(KEYS.USER);
  }

  async checkSessionRestore(): Promise<SessionRestoreResult> {
    const token = await AsyncStorage.getItem(KEYS.TOKEN);
    const userId = await AsyncStorage.getItem(KEYS.USER);
    const lastSession = await AsyncStorage.getItem(KEYS.LAST_SESSION);

    if (token && userId) {
      try {
        const data = await apiGet(`/api/auth/verify-token?user_id=${userId}`);
        if (data?.valid) {
          return { canRestore: true, token, user_id: userId, lastSessionId: lastSession || undefined };
        }
      } catch (e) {}
    }

    return { canRestore: false, reason: 'no_valid_session' };
  }

  async isDeviceTrusted(): Promise<boolean> {
    const trusted = await AsyncStorage.getItem(KEYS.DEVICE_TRUSTED);
    return trusted === 'true';
  }

  async trustDevice(): Promise<void> {
    await AsyncStorage.setItem(KEYS.DEVICE_TRUSTED, 'true');
  }

  async saveLastSession(sessionId: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.LAST_SESSION, sessionId);
  }

  private async saveAuthData(token: string, userId: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.TOKEN, token);
    await AsyncStorage.setItem(KEYS.USER, userId);
  }
}

export const authService = new AuthService();
