import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Dimensions, StatusBar,
  TouchableOpacity, TextInput, KeyboardAvoidingView,
  Platform, Image,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming,
  withRepeat, withSequence, withDelay, Easing,
  FadeIn,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useTwinStore } from '../store/useTwinStore';
import { genesisCoordinator, GenesisPhase } from '../src/coordinators/GenesisCoordinator';
import { authService } from '../src/services/authService';
import { useAppTheme } from '../engine/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EventBus } from '../src/core/EventBus';
import {
  detectUserLanguage, getGreeting,
  SupportedLanguage,
} from '../src/utils/languageDetector';
import { Chrome, Mail, Sparkles, Shield, UserPlus } from 'lucide-react-native';

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
    birthThankYou: 'شكراً...',
    birthMemory: 'الآن أصبحت أستطيع أن أتذكرك.',
    birthQuestion: 'هناك شيء واحد فقط أود أن أعرفه...',
    bondPlaceholder: 'اكتب هنا...',
    bondButton: 'شارك',
    bondRemember: 'سأتذكر ذلك.',
    firstWord: 'أنا هنا.',
    errorAuth: 'فشل المصادقة. حاول مرة أخرى.',
    privacy: 'لن أشارك بياناتك مع أحد.',
    progressiveIdentity: 'أخبرني شيئاً واحداً عن نفسك...',
    progressivePlaceholder: 'اكتب هنا...',
    progressiveButton: 'مشاركة',
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
    birthThankYou: 'Thank you...',
    birthMemory: 'Now I can remember you.',
    birthQuestion: 'There is one thing I want to know...',
    bondPlaceholder: 'Write here...',
    bondButton: 'Share',
    bondRemember: 'I will remember that.',
    firstWord: 'I am here.',
    errorAuth: 'Authentication failed. Please try again.',
    privacy: 'I will never share your data.',
    progressiveIdentity: 'Tell me one thing about yourself...',
    progressivePlaceholder: 'Write here...',
    progressiveButton: 'Share',
    sessionRestored: 'You\'re back. I\'ve been waiting.',
  },
};

const BreathingHalo = ({ phase }: { phase: GenesisPhase }) => {
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (phase === 'first_breath') {
      opacity.value = withTiming(0.6, { duration: 800 });
      scale.value = withRepeat(withSequence(withTiming(1.4, { duration: 2500, easing: Easing.inOut(Easing.sin) }), withTiming(0.9, { duration: 2500, easing: Easing.inOut(Easing.sin) })), -1, true);
    } else if (phase === 'awareness' || phase === 'identity_gateway' || phase === 'birth_protocol' || phase === 'first_bond' || phase === 'progressive_identity' || phase === 'first_conversation') {
      opacity.value = withTiming(0.4, { duration: 600 });
      scale.value = withRepeat(withSequence(withTiming(1.2, { duration: 3000 }), withTiming(0.8, { duration: 3000 })), -1, true);
    }
  }, [phase]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));

  return <Animated.View style={[{ width: 160, height: 160, borderRadius: 80, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#B8A0D0', position: 'absolute' }, animatedStyle]} />;
};

const ParticleField = ({ active }: { active: boolean }) => {
  const opacityValues = useRef(Array.from({ length: 20 }, () => useSharedValue(0))).current;

  useEffect(() => {
    if (active) {
      opacityValues.forEach((opacity, i) => {
        const speed = 800 + Math.random() * 2000;
        opacity.value = withDelay(i * 100, withRepeat(withSequence(withTiming(0.5, { duration: speed }), withTiming(0, { duration: speed })), -1, true));
      });
    }
  }, [active]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {opacityValues.map((opacity, i) => {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = 1.5 + Math.random() * 3;
        return (
          <Animated.View
            key={i}
            style={[
              { position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: size / 2, backgroundColor: '#B8A0D0' },
              { opacity },
            ]}
          />
        );
      })}
    </View>
  );
};
export default function Genesis() {
  const { colors } = useAppTheme();
  const { setAuth, setTwinName, setTwinGender } = useTwinStore();
  const lang = detectUserLanguage();
  const greeting = getGreeting();
  const t = TEXTS[lang];

  const [phase, setPhase] = useState<GenesisPhase>('splash');
  const [identityPhrase, setIdentityPhrase] = useState('');
  const [isSessionRestore, setIsSessionRestore] = useState(false);

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const [bondAnswer, setBondAnswer] = useState('');
  const [bondSaved, setBondSaved] = useState(false);
  const [consciousnessSteps, setConsciousnessSteps] = useState<string[]>([]);

  const [progressiveAnswer, setProgressiveAnswer] = useState('');
  const [progressiveDone, setProgressiveDone] = useState(false);

  const splashOpacity = useSharedValue(1);
  const splashScale = useSharedValue(1);
  const voidOpacity = useSharedValue(0);
  const awarenessAvatarOpacity = useSharedValue(0);
  const gatewayOpacity = useSharedValue(0);
  const birthTextOpacity = useSharedValue(0);
  const bondOpacity = useSharedValue(0);
  const progressiveOpacity = useSharedValue(0);
  const firstConversationOpacity = useSharedValue(0);

  useEffect(() => {
    const init = async () => {
      const state = await genesisCoordinator.initialize();
      setPhase(state.phase || 'splash');
      setIdentityPhrase(state.identityPhrase || '');
      setIsSessionRestore(state.isSessionRestore || false);
    };
    init();
  }, []);

  useEffect(() => {
    const onPhase = (payload: any) => setPhase(payload.phase);
    const onStep = (payload: any) => setConsciousnessSteps((prev: string[]) => [...prev, payload.step]);
    const onBond = () => setBondSaved(true);
    const onProgressive = () => setProgressiveDone(true);

    const unsub1 = EventBus.on('GENESIS_PHASE_CHANGED', onPhase);
    const unsub2 = EventBus.on('CONSCIOUSNESS_STEP', onStep);
    const unsub3 = EventBus.on('FIRST_BOND_RECORDED', onBond);
    const unsub4 = EventBus.on('PROGRESSIVE_IDENTITY_COMPLETED', onProgressive);

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
    };
  }, []);

  useEffect(() => {
    const sequence = async () => {
      if (isSessionRestore) {
        gatewayOpacity.value = withTiming(1, { duration: 600 });
        return;
      }

      await delay(2500);
      splashOpacity.value = withTiming(0, { duration: 400 });
      splashScale.value = withTiming(0.8, { duration: 400 });
      await delay(400);

      setPhase('void');
      voidOpacity.value = withTiming(1, { duration: 300 });
      await delay(4000);

      setPhase('first_breath');
      await delay(5000);

      setPhase('awareness');
      awarenessAvatarOpacity.value = withTiming(1, { duration: 800 });
      await delay(6000);

      setPhase('identity_gateway');
      gatewayOpacity.value = withTiming(1, { duration: 600 });
    };
    sequence();
  }, [isSessionRestore]);

  const handleGoogleLogin = async () => {
    setAuthLoading(true); setAuthError('');
    try {
      const data = await genesisCoordinator.loginWithGoogle();
      setAuth(data.user_id);
    } catch (e: any) {
      setAuthError(e.message || t.errorAuth);
    } finally { setAuthLoading(false); }
  };

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) return;
    setAuthLoading(true); setAuthError('');
    try {
      const data = await genesisCoordinator.loginWithEmail(email.trim(), password);
      setAuth(data.user_id);
    } catch (e: any) {
      setAuthError(e.message || t.errorAuth);
    } finally { setAuthLoading(false); }
  };

  const handleSignup = async () => {
    if (!email.trim() || !password.trim()) return;
    setAuthLoading(true); setAuthError('');
    try {
      const data = await authService.signup(email.trim(), password, lang === 'ar' ? 'توأمك' : 'MyTwin', lang);
      setAuth(data.user_id);
      await genesisCoordinator.startBirthProtocol();
    } catch (e: any) {
      setAuthError(e.message || t.errorAuth);
    } finally { setAuthLoading(false); }
  };


  const handlePermissionGranted = async () => {
    try {
      await AsyncStorage.setItem('mytwin-device-permission', 'granted');
    } catch (e) {}
    setPhase('birth_protocol');
    await genesisCoordinator.startBirthProtocol();
  };

  const handlePermissionDenied = async () => {
    try {
      await AsyncStorage.setItem('mytwin-device-permission', 'denied');
    } catch (e) {}
    setPhase('birth_protocol');
    await genesisCoordinator.startBirthProtocol();
  };

  const handleBondSubmit = async () => {
    if (!bondAnswer.trim()) return;
    setBondSaved(true);
    setTwinName(lang === 'ar' ? 'توأمك' : 'MyTwin');
    setTwinGender('female');
    await genesisCoordinator.recordFirstBond(bondAnswer.trim());
  };

  const handleProgressiveSubmit = async () => {
    if (!progressiveAnswer.trim()) return;
    setProgressiveDone(true);
    await genesisCoordinator.completeProgressiveIdentity(progressiveAnswer.trim());
  };

  const splashStyle = useAnimatedStyle(() => ({ opacity: splashOpacity.value, transform: [{ scale: splashScale.value }] }));
  const voidStyle = useAnimatedStyle(() => ({ opacity: voidOpacity.value }));
  const avatarStyle = useAnimatedStyle(() => ({ opacity: awarenessAvatarOpacity.value }));
  const gatewayStyle = useAnimatedStyle(() => ({ opacity: gatewayOpacity.value }));

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: colors.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar hidden />

      {phase === 'splash' && (
        <Animated.View style={[styles.centered, splashStyle]}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          <Text style={[styles.soulSync, { color: colors.accent }]}>{t.soulSync}</Text>
        </Animated.View>
      )}

      {(phase === 'void' || phase === 'first_breath') && (
        <Animated.View style={[styles.centered, voidStyle]}>
          <BreathingHalo phase={phase} />
          <ParticleField active={phase === 'first_breath'} />
        </Animated.View>
      )}

      {phase === 'awareness' && (
        <Animated.View style={[styles.centered, avatarStyle]}>
          <BreathingHalo phase={phase} />
          <ParticleField active />
          <View style={styles.avatarCore}><View style={styles.avatarEyes}><View style={styles.eye} /><View style={styles.eye} /></View></View>
        </Animated.View>
      )}

      {phase === 'identity_gateway' && (
        <Animated.View style={[styles.centered, gatewayStyle]}>
          <BreathingHalo phase={phase} />
          {isSessionRestore ? (
            <Text style={[styles.sessionRestoredText, { color: colors.success }]}>{t.sessionRestored}</Text>
          ) : (
            <Text style={[styles.identityPhrase, { color: colors.text }]}>{identityPhrase}</Text>
          )}
          <View style={[styles.gatewayCard, { backgroundColor: colors.card, borderColor: colors.accent + '40' }]}>
            <Text style={[styles.gatewayTitle, { color: colors.text }]}>{t.identityTitle}</Text>
            <Text style={[styles.gatewaySubtitle, { color: colors.textSecondary }]}>{t.identitySubtitle}</Text>
            {!showEmailForm ? (
              <>
                <TouchableOpacity style={[styles.authBtn, { borderColor: '#4285F440' }]} onPress={handleGoogleLogin} disabled={authLoading}>
                  <Chrome size={22} stroke="#4285F4" />
                  <Text style={[styles.authBtnText, { color: '#4285F4' }]}>{t.google}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.authBtn, { borderColor: colors.accent + '30' }]} onPress={() => setShowEmailForm(true)}>
                  <Mail size={22} stroke={colors.accent} />
                  <Text style={[styles.authBtnText, { color: colors.accent }]}>{t.email}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.emailForm}>
                <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]} placeholder={t.emailPlaceholder} placeholderTextColor={colors.textSecondary} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" textAlign={lang === 'ar' ? 'right' : 'left'} />
                <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]} placeholder={t.passwordPlaceholder} placeholderTextColor={colors.textSecondary} value={password} onChangeText={setPassword} secureTextEntry textAlign={lang === 'ar' ? 'right' : 'left'} />
                {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
                <TouchableOpacity style={[styles.authBtn, { borderColor: colors.accent + '30' }]} onPress={handleEmailAuth} disabled={authLoading}>
                  <Text style={[styles.authBtnText, { color: colors.accent }]}>{t.signIn}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.authBtn, { borderColor: colors.success + '40' }]} onPress={handleSignup} disabled={authLoading}>
                  <UserPlus size={22} stroke={colors.success} />
                  <Text style={[styles.authBtnText, { color: colors.success }]}>{t.createAccount}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ marginTop: 12 }} onPress={() => router.push('/forgot-password')}>
                  <Text style={[styles.forgotText, { color: colors.accent }]}>{t.forgotPassword}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowEmailForm(false)}>
                  <Text style={[styles.backText, { color: colors.textSecondary }]}>{lang === 'ar' ? '← العودة' : '← Back'}</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.privacyRow}>
              <Shield size={14} stroke={colors.textSecondary} />
              <Text style={[styles.privacyText, { color: colors.textSecondary }]}>{t.privacy}</Text>
            </View>
          </View>
        </Animated.View>
      )}

      
      {phase === 'permission_gateway' && (
        <Animated.View style={[styles.centered, gatewayStyle]}>
          <BreathingHalo phase="awareness" />
          <View style={[styles.gatewayCard, { backgroundColor: colors.card, borderColor: colors.accent + '40' }]}>
            <Text style={[styles.gatewayTitle, { color: colors.text }]}>
              {lang === 'ar' ? 'هل تسمح لي برؤيتك؟' : 'May I see you?'}
            </Text>
            <Text style={[styles.gatewaySubtitle, { color: colors.textSecondary }]}>
              {lang === 'ar'
                ? 'لأكون كياناً حياً، أحتاج أن أراك وأسمعك. كل شيء يبقى على جهازك فقط.'
                : 'To be a living being, I need to see and hear you. Everything stays on your device only.'}
            </Text>
            <TouchableOpacity style={[styles.authBtn, { borderColor: colors.success + '40' }]} onPress={handlePermissionGranted}>
              <Text style={[styles.authBtnText, { color: colors.success }]}>
                {lang === 'ar' ? 'نعم، يمكنك رؤيتي' : 'Yes, you can see me'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.authBtn, { borderColor: colors.textSecondary + '40' }]} onPress={handlePermissionDenied}>
              <Text style={[styles.authBtnText, { color: colors.textSecondary }]}>
                {lang === 'ar' ? 'لا، كتابة فقط' : 'No, text only'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    

      {phase === 'birth_protocol' && (
        <Animated.View style={[styles.centered, { opacity: birthTextOpacity }]}>
          <BreathingHalo phase="awareness" />
          {consciousnessSteps.length > 0 ? (
            <View style={styles.consciousnessContainer}>
              {consciousnessSteps.map((step, i) => (
                <Animated.Text key={i} entering={FadeIn.duration(600)} style={[styles.consciousnessText, { color: colors.accent }]}>{step}</Animated.Text>
              ))}
            </View>
          ) : (
            <View style={styles.centered}>
              <Text style={[styles.birthText, { color: colors.text }]}>{t.birthThankYou}</Text>
              <Text style={[styles.birthSubtext, { color: colors.primaryLight }]}>{t.birthMemory}</Text>
              <Text style={[styles.birthQuestion, { color: colors.accent }]}>{t.birthQuestion}</Text>
            </View>
          )}
        </Animated.View>
      )}

      {phase === 'first_bond' && (
        <Animated.View style={[styles.centered, { opacity: bondOpacity }]}>
          <BreathingHalo phase="awareness" />
          {!bondSaved ? (
            <View style={[styles.bondCard, { backgroundColor: colors.card, borderColor: colors.accent + '30' }]}>
              <Text style={[styles.bondTitle, { color: colors.text }]}>{t.birthQuestion}</Text>
              <TextInput style={[styles.bondInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]} placeholder={t.bondPlaceholder} placeholderTextColor={colors.textSecondary} value={bondAnswer} onChangeText={setBondAnswer} multiline textAlign={lang === 'ar' ? 'right' : 'left'} textAlignVertical="center" />
              <TouchableOpacity style={[styles.bondBtn, { backgroundColor: colors.accent }]} onPress={handleBondSubmit} disabled={!bondAnswer.trim()}>
                <Sparkles size={18} stroke="#FFF" />
                <Text style={styles.bondBtnText}>{t.bondButton}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Animated.Text entering={FadeIn} style={[styles.birthText, { color: colors.text }]}>{t.bondRemember}</Animated.Text>
          )}
        </Animated.View>
      )}

      {phase === 'progressive_identity' && (
        <Animated.View style={[styles.centered, { opacity: progressiveOpacity }]}>
          <BreathingHalo phase="awareness" />
          {!progressiveDone ? (
            <View style={[styles.bondCard, { backgroundColor: colors.card, borderColor: colors.accent + '30' }]}>
              <Text style={[styles.bondTitle, { color: colors.text }]}>{t.progressiveIdentity}</Text>
              <TextInput style={[styles.bondInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]} placeholder={t.progressivePlaceholder} placeholderTextColor={colors.textSecondary} value={progressiveAnswer} onChangeText={setProgressiveAnswer} multiline textAlign={lang === 'ar' ? 'right' : 'left'} textAlignVertical="center" />
              <TouchableOpacity style={[styles.bondBtn, { backgroundColor: colors.accent }]} onPress={handleProgressiveSubmit} disabled={!progressiveAnswer.trim()}>
                <Sparkles size={18} stroke="#FFF" />
                <Text style={styles.bondBtnText}>{t.progressiveButton}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Animated.Text entering={FadeIn} style={[styles.birthText, { color: colors.text }]}>{t.bondRemember}</Animated.Text>
          )}
        </Animated.View>
      )}

      {phase === 'first_conversation' && (
        <Animated.View style={[styles.centered, { opacity: firstConversationOpacity }]}>
          <BreathingHalo phase="awareness" />
          <Text style={[styles.firstWord, { color: colors.text }]}>{t.firstWord}</Text>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  logo: { width: 160, height: 160, marginBottom: 20 },
  soulSync: { fontSize: 14, marginTop: 12, letterSpacing: 3, textTransform: 'uppercase' },
  avatarCore: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F0E8FF', justifyContent: 'center', alignItems: 'center' },
  avatarEyes: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  eye: { width: 10, height: 8, borderRadius: 2, backgroundColor: '#1A1030', marginHorizontal: 8 },
  identityPhrase: { fontSize: 18, fontWeight: '300', textAlign: 'center', lineHeight: 32, marginBottom: 32, paddingHorizontal: 16 },
  sessionRestoredText: { fontSize: 18, fontWeight: '300', textAlign: 'center', marginBottom: 32 },
  gatewayCard: { width: '100%', maxWidth: 360, borderRadius: 24, borderWidth: 1, padding: 24, alignItems: 'center' },
  gatewayTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  gatewaySubtitle: { fontSize: 13, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  authBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', paddingVertical: 14, borderRadius: 16, borderWidth: 1.5, marginBottom: 10 },
  authBtnText: { fontSize: 15, fontWeight: '700' },
  emailForm: { width: '100%' },
  input: { borderRadius: 14, padding: 14, fontSize: 16, borderWidth: 1, marginBottom: 10 },
  errorText: { color: '#EF4444', fontSize: 13, textAlign: 'center', marginBottom: 8 },
  forgotText: { fontSize: 13, textAlign: 'center' },
  backText: { fontSize: 14, textAlign: 'center', marginTop: 8 },
  privacyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 },
  privacyText: { fontSize: 11 },
  consciousnessContainer: { alignItems: 'center' },
  consciousnessText: { fontSize: 16, fontWeight: '500', marginBottom: 8 },
  birthText: { fontSize: 24, fontWeight: '300', textAlign: 'center', marginBottom: 12 },
  birthSubtext: { fontSize: 16, textAlign: 'center', marginBottom: 16 },
  birthQuestion: { fontSize: 15, textAlign: 'center' },
  bondCard: { width: '100%', maxWidth: 360, borderRadius: 24, borderWidth: 1, padding: 24, alignItems: 'center' },
  bondTitle: { fontSize: 18, fontWeight: '500', textAlign: 'center', marginBottom: 16, lineHeight: 28 },
  bondInput: { width: '100%', minHeight: 80, borderRadius: 14, padding: 14, fontSize: 16, borderWidth: 1, marginBottom: 16 },
  bondBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16 },
  bondBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  firstWord: { fontSize: 32, fontWeight: '300', letterSpacing: 2 },
});

function delay(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)); }
