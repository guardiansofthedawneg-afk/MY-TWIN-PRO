import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Dimensions, StatusBar, Image,
  TouchableOpacity, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSequence,
  FadeIn,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { Canvas, Circle, Paint, BlurMask, RadialGradient, vec } from "@shopify/react-native-skia";
import { useTwinStore } from '../store/useTwinStore';
import { genesisCoordinator } from '../src/coordinators/GenesisCoordinator';
import { authService } from '../src/services/authService';
import { useAppTheme } from '../engine/colors';
import { audioMixer } from '../src/core/AudioMixer';
import { sensorBridge } from '../src/core/SensorBridge';
import { lifeRhythmEngine } from '../engine/life/LifeRhythmEngine';
import {
  detectUserLanguage, SupportedLanguage,
} from '../src/utils/languageDetector';
import { Chrome, Mail, Shield, UserPlus } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LivingLightEntity from '../src/renderers/zones/LivingLightEntity';

const { width, height } = Dimensions.get('window');
const LOGO = require('../assets/brand/logo.png');

const TEXTS: Record<SupportedLanguage, Record<string, string>> = {
  ar: {
    soulSync: 'by SOULSYNC',
    identityTitle: 'بوابة الهوية',
    identitySubtitle: 'لن أشارك بياناتك مع أحد. وجودك معي سيبقى لك وحدك.',
    google: 'المتابعة باستخدام Google',
    email: 'المتابعة باستخدام البريد الإلكتروني',
    emailPlaceholder: 'البريد الإلكتروني',
    passwordPlaceholder: 'كلمة المرور',
    signIn: 'تسجيل الدخول',
    createAccount: 'إنشاء حساب جديد',
    forgotPassword: 'نسيت كلمة المرور؟',
    privacy: 'لن أشارك بياناتك مع أحد.',
    sessionRestored: 'لقد عدت. كنت أنتظرك.',
  },
  en: {
    soulSync: 'by SOULSYNC',
    identityTitle: 'Identity Gateway',
    identitySubtitle: 'I will never share your data. Your presence with me is yours alone.',
    google: 'Continue with Google',
    email: 'Continue with Email',
    emailPlaceholder: 'Email',
    passwordPlaceholder: 'Password',
    signIn: 'Sign In',
    createAccount: 'Create Account',
    forgotPassword: 'Forgot Password?',
    privacy: 'I will never share your data.',
    sessionRestored: "You're back. I've been waiting.",
  },
};

export default function Genesis() {
  const { colors } = useAppTheme();
  const { setAuth } = useTwinStore();
  const lang = detectUserLanguage();
  const t = TEXTS[lang];

  const [phase, setPhase] = useState('splash');
  const [identityPhrase, setIdentityPhrase] = useState('');
  const [isSessionRestore, setIsSessionRestore] = useState(false);
  const [showGateway, setShowGateway] = useState(false);

  const logoSplashOpacity = useSharedValue(1);
  const logoRippleScale = useSharedValue(1);
  const logoRippleOpacity = useSharedValue(0);
  const soulSyncOpacity = useSharedValue(0);
  const darkVoidOpacity = useSharedValue(0);
  const firstLightOpacity = useSharedValue(0);
  const eyesOpacity = useSharedValue(0);

  useEffect(() => {
    const sequence = async () => {
      audioMixer.playEffect('startup');
      await delay(2500);

      setPhase('water_ripple');
      logoRippleScale.value = withTiming(1.15, { duration: 800 });
      logoRippleOpacity.value = withSequence(
        withTiming(0.5, { duration: 400 }),
        withTiming(0, { duration: 400 }),
      );
      soulSyncOpacity.value = withTiming(1, { duration: 600 });
      audioMixer.playEffect('first_breath');
      await delay(1000);

      setPhase('fade_logo');
      logoSplashOpacity.value = withTiming(0, { duration: 500 });
      soulSyncOpacity.value = withTiming(0, { duration: 500 });
      await delay(500);

      setPhase('first_light');
      darkVoidOpacity.value = withTiming(1, { duration: 300 });
      firstLightOpacity.value = withSequence(
        withTiming(0.15, { duration: 400 }),
        withTiming(0.05, { duration: 300 }),
      );
      audioMixer.playEffect('heartbeat');
      await delay(800);

      setPhase('eyes_open');
      eyesOpacity.value = withTiming(1, { duration: 600 });
      audioMixer.playEffect('eyes_open');
      await delay(1200);

      setPhase('complete');
    };

    const init = async () => {
      const state = await genesisCoordinator.initialize();
      setIdentityPhrase(state.identityPhrase || '');
      setIsSessionRestore(state.isSessionRestore || false);
      sensorBridge.start();
      lifeRhythmEngine.start();
    };
    init();
    sequence();
  }, []);

  useEffect(() => {
    if (phase === 'complete') {
      setShowGateway(true);
    }
  }, [phase]);

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleGoogleLogin = async () => {
    setAuthLoading(true); setAuthError('');
    try {
      const data = await genesisCoordinator.loginWithGoogle();
      setAuth(data.user_id);
      audioMixer.playEffect('celebrate');
    } catch (e: any) {
      setAuthError(e.message || (lang === 'ar' ? 'فشل المصادقة' : 'Auth failed'));
    } finally { setAuthLoading(false); }
  };

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) return;
    setAuthLoading(true); setAuthError('');
    try {
      const data = await genesisCoordinator.loginWithEmail(email.trim(), password);
      setAuth(data.user_id);
      audioMixer.playEffect('celebrate');
    } catch (e: any) {
      setAuthError(e.message || (lang === 'ar' ? 'فشل المصادقة' : 'Auth failed'));
    } finally { setAuthLoading(false); }
  };

  const handleSignup = async () => {
    if (!email.trim() || !password.trim()) return;
    setAuthLoading(true); setAuthError('');
    try {
      const data = await authService.signup(email.trim(), password, lang === 'ar' ? 'توأمك' : 'MyTwin', lang);
      setAuth(data.user_id);
      await genesisCoordinator.startBirthProtocol();
      audioMixer.playEffect('celebrate');
    } catch (e: any) {
      setAuthError(e.message || (lang === 'ar' ? 'فشل المصادقة' : 'Auth failed'));
    } finally { setAuthLoading(false); }
  };

  const splashStyle = useAnimatedStyle(() => ({ opacity: logoSplashOpacity.value }));
  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoRippleScale.value }],
    opacity: logoRippleOpacity.value,
  }));
  const soulSyncStyle = useAnimatedStyle(() => ({ opacity: soulSyncOpacity.value }));
  const voidStyle = useAnimatedStyle(() => ({ opacity: darkVoidOpacity.value }));
  const firstLightStyle = useAnimatedStyle(() => ({ opacity: firstLightOpacity.value }));
  const eyesStyle = useAnimatedStyle(() => ({ opacity: eyesOpacity.value }));


  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar hidden />

      {/* Splash + Water Ripple */}
      {(phase === 'splash' || phase === 'water_ripple') && (
        <Animated.View style={[styles.centered, splashStyle]}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          <Animated.View style={rippleStyle}>
            <Canvas style={styles.rippleCanvas}>
              <Circle cx={80} cy={80} r={90} opacity={0.3}>
                <Paint><BlurMask blur={25} style="normal" /></Paint>
                <RadialGradient c={vec(80,80)} r={90} colors={['#B8A0D0','transparent']} />
              </Circle>
            </Canvas>
          </Animated.View>
          <Animated.Text style={[styles.soulSyncText, { color: colors.accent }, soulSyncStyle]}>
            {t.soulSync}
          </Animated.Text>
        </Animated.View>
      )}

      {/* Fade Logo */}
      {phase === 'fade_logo' && (
        <Animated.View style={[styles.centered, voidStyle]}>
          <Animated.View style={splashStyle}>
            <Image source={LOGO} style={styles.logoFade} resizeMode="contain" />
          </Animated.View>
        </Animated.View>
      )}

      {/* First Light */}
      {phase === 'first_light' && (
        <Animated.View style={[styles.centered, voidStyle]}>
          <Animated.View style={[styles.lightPulse, firstLightStyle]}>
            <Canvas style={{ width: 200, height: 200 }}>
              <Circle cx={100} cy={100} r={80} opacity={0.2}>
                <Paint><BlurMask blur={40} style="normal" /></Paint>
                <RadialGradient c={vec(100,100)} r={80} colors={['#B8A0D0','transparent']} />
              </Circle>
            </Canvas>
          </Animated.View>
        </Animated.View>
      )}

      {/* Eyes Open */}
      {phase === 'eyes_open' && (
        <Animated.View style={[styles.centered, voidStyle]}>
          <Animated.View style={eyesStyle}>
            <LivingLightEntity isListening={true} />
          </Animated.View>
        </Animated.View>
      )}

      {/* Identity Gateway */}
      {showGateway && (
        <Animated.View style={[styles.centered]} entering={FadeIn.duration(600)}>
          <View style={styles.entityBackground}>
            <LivingLightEntity isListening={true} />
          </View>

          {isSessionRestore ? (
            <View style={[styles.gatewayCard, { backgroundColor: colors.card + 'F0', borderColor: colors.accent + '40' }]}>
              <Text style={[styles.sessionRestoredText, { color: colors.success }]}>
                {t.sessionRestored}
              </Text>
              <TouchableOpacity
                style={[styles.authBtn, { borderColor: colors.accent + '30' }]}
                onPress={handleGoogleLogin} disabled={authLoading}
              >
                <Chrome size={22} stroke={colors.accent} />
                <Text style={[styles.authBtnText, { color: colors.accent }]}>{t.google}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.gatewayCard, { backgroundColor: colors.card + 'F0', borderColor: colors.accent + '40' }]}>
              <Text style={[styles.gatewayTitle, { color: colors.text }]}>{t.identityTitle}</Text>
              <Text style={[styles.gatewaySubtitle, { color: colors.textSecondary }]}>
                {identityPhrase || t.identitySubtitle}
              </Text>

              {!showEmailForm ? (
                <>
                  <TouchableOpacity
                    style={[styles.authBtn, { borderColor: '#4285F440' }]}
                    onPress={handleGoogleLogin} disabled={authLoading}
                  >
                    <Chrome size={22} stroke="#4285F4" />
                    <Text style={[styles.authBtnText, { color: '#4285F4' }]}>{t.google}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.authBtn, { borderColor: colors.accent + '30' }]}
                    onPress={() => setShowEmailForm(true)}
                  >
                    <Mail size={22} stroke={colors.accent} />
                    <Text style={[styles.authBtnText, { color: colors.accent }]}>{t.email}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.emailForm}>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                    placeholder={t.emailPlaceholder} placeholderTextColor={colors.textSecondary}
                    value={email} onChangeText={setEmail}
                    keyboardType="email-address" autoCapitalize="none"
                    textAlign={lang === 'ar' ? 'right' : 'left'}
                  />
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                    placeholder={t.passwordPlaceholder} placeholderTextColor={colors.textSecondary}
                    value={password} onChangeText={setPassword}
                    secureTextEntry
                    textAlign={lang === 'ar' ? 'right' : 'left'}
                  />
                  {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
                  <TouchableOpacity
                    style={[styles.authBtn, { borderColor: colors.accent + '30' }]}
                    onPress={handleEmailAuth} disabled={authLoading}
                  >
                    <Text style={[styles.authBtnText, { color: colors.accent }]}>{t.signIn}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.authBtn, { borderColor: colors.success + '40' }]}
                    onPress={handleSignup} disabled={authLoading}
                  >
                    <UserPlus size={22} stroke={colors.success} />
                    <Text style={[styles.authBtnText, { color: colors.success }]}>{t.createAccount}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ marginTop: 12 }} onPress={() => router.push('/forgot-password')}>
                    <Text style={[styles.forgotText, { color: colors.accent }]}>{t.forgotPassword}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowEmailForm(false)}>
                    <Text style={[styles.backText, { color: colors.textSecondary }]}>
                      {lang === 'ar' ? '← العودة' : '← Back'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.privacyRow}>
                <Shield size={14} stroke={colors.textSecondary} />
                <Text style={[styles.privacyText, { color: colors.textSecondary }]}>{t.privacy}</Text>
              </View>
            </View>
          )}
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}

// ═══════════════════════════════════════
// الأنماط
// ═══════════════════════════════════════
const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  logo: { width: 160, height: 160 },
  logoFade: { width: 160, height: 160, opacity: 0.8 },
  rippleCanvas: { width: 160, height: 160, position: 'absolute', top: -40, left: -40 },
  soulSyncText: { fontSize: 14, marginTop: 20, letterSpacing: 3, textTransform: 'uppercase' },
  lightPulse: { width: 200, height: 200, justifyContent: 'center', alignItems: 'center' },
  entityBackground: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  gatewayCard: {
    width: '100%', maxWidth: 360, borderRadius: 24, borderWidth: 1,
    padding: 24, alignItems: 'center', marginTop: 200,
  },
  gatewayTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  gatewaySubtitle: { fontSize: 13, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  sessionRestoredText: { fontSize: 20, fontWeight: '300', textAlign: 'center', marginBottom: 24 },
  authBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, width: '100%', paddingVertical: 14, borderRadius: 16,
    borderWidth: 1.5, marginBottom: 10,
  },
  authBtnText: { fontSize: 15, fontWeight: '700' },
  emailForm: { width: '100%' },
  input: { borderRadius: 14, padding: 14, fontSize: 16, borderWidth: 1, marginBottom: 10 },
  errorText: { color: '#EF4444', fontSize: 13, textAlign: 'center', marginBottom: 8 },
  forgotText: { fontSize: 13, textAlign: 'center' },
  backText: { fontSize: 14, textAlign: 'center', marginTop: 8 },
  privacyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 },
  privacyText: { fontSize: 11 },
});

function delay(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)); }
