import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiPost, setToken } from './httpClient';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const TOKEN_KEY = 'mytwin-token';
const USER_KEY = 'mytwin-user';

const GOOGLE_CLIENT_ID = '907014926697-cj53f1nj1es27n1a5hhtnp7vv6q8uffn.apps.googleusercontent.com';

export async function saveAuthData(token: string, userId: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
  await AsyncStorage.setItem(USER_KEY, userId);
  await setToken(token);
}

export async function getToken(): Promise<string | null> {
  return await AsyncStorage.getItem(TOKEN_KEY);
}

export async function getUserId(): Promise<string | null> {
  return await AsyncStorage.getItem(USER_KEY);
}

export async function removeToken(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}

export async function login(email: string, password: string): Promise<any> {
  const data = await apiPost('/api/auth/login', { email: email.trim(), password });
  if (data?.token && data?.user_id) {
    await saveAuthData(data.token, data.user_id);
  }
  return data;
}

export async function signup(email: string, password: string, twinName: string, lang: string = 'ar'): Promise<any> {
  const data = await apiPost('/api/auth/signup', {
    email: email.trim(),
    password,
    twin_name: twinName,
    lang,
  });
  if (data?.token && data?.user_id) {
    await saveAuthData(data.token, data.user_id);
  }
  return data;
}

export async function googleLogin(lang: string = 'ar'): Promise<any> {
  try {
    const discovery = await AuthSession.fetchDiscoveryAsync('https://accounts.google.com');

    const redirectUri = AuthSession.makeRedirectUri();

    const request = new AuthSession.AuthRequest({
      clientId: GOOGLE_CLIENT_ID,
      redirectUri,
      scopes: ['profile', 'email'],
      responseType: AuthSession.ResponseType.Token,
    });

    const result = await request.promptAsync(discovery);

    if (result.type === 'success' && result.params.access_token) {
      const accessToken = result.params.access_token;

      const data = await apiPost('/api/auth/google', {
        access_token: accessToken,
        lang,
      });

      if (data?.token && data?.user_id) {
        await saveAuthData(data.token, data.user_id);
        return { token: data.token, user_id: data.user_id, onboarded: data.onboarded || false };
      }
      throw new Error('Google authentication failed on server');
    }

    throw new Error('Google sign-in was cancelled or failed');
  } catch (e: any) {
    console.error('[GoogleLogin] Error:', e);
    throw e;
  }
}

export async function logout(): Promise<void> {
  await removeToken();
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken();
  return !!token;
}
