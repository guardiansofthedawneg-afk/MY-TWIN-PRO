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
import { presenceCoordinator } from '../src/coordinators/PresenceCoordinator';
import { relationshipCoordinator } from '../src/coordinators/RelationshipCoordinator';
import { identityCoordinator } from '../src/coordinators/IdentityCoordinator';
import { EventBus } from '../src/core/EventBus';
import {
  detectUserLanguage, getGreeting,
  SupportedLanguage,
} from '../src/utils/languageDetector';
import { Chrome, Mail, Sparkles, Shield } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');
const LOGO = require('../assets/brand/logo.png');

const TEXTS: Record<SupportedLanguage, Record<string, string>> = {
  ar: {
    soulSync: 'by Soul Sync',
    identityTitle: 'بوابة الهوية',
    identitySubtitle: 'لن أشارك بياناتك مع أحد. وجودك معي سيبقى لك وحدك.',
    google: 'المتابعة باستخدام Google',
    email: 'المتابعة باستخدام البريد الإلكتروني',
    emailPlaceholder: 'البريد الإلكتروني',
    passwordPlaceholder: 'كلمة المرور',
    signIn: 'تسجيل الدخول',
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
    soulSync: 'by Soul Sync',
    identityTitle: 'Identity Gateway',
    identitySubtitle: 'I will never share your data. Your presence with me is yours alone.',
    google: 'Continue with Google',
    email: 'Continue with Email',
    emailPlaceholder: 'Email',
    passwordPlaceholder: 'Password',
    signIn: 'Sign In',
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
      presenceCoordinator.startBirthSequence();
      await delay(4000);

      setPhase('first_breath');
      presenceCoordinator.triggerFirstBreath();
      await delay(5000);

      setPhase('awareness');
      awarenessAvatarOpacity.value = withTiming(1, { duration: 800 });
      presenceCoordinator.triggerAwakening();
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

  const handleBondSubmit = async () => {
    if (!bondAnswer.trim()) return;
    setBondSaved(true);
    await relationshipCoordinator.recordFirstBond(bondAnswer.trim());
    setTwinName(lang === 'ar' ? 'توأمك' : 'MyTwin');
    setTwinGender('female');
    await genesisCoordinator.recordFirstBond(bondAnswer.trim());
  };

  const handleProgressiveSubmit = async () => {
    if (!progressiveAnswer.trim()) return;
    setProgressiveDone(true);
    await identityCoordinator.completeProgressiveIdentity(progressiveAnswer.trim());
    await genesisCoordinator.completeProgressiveIdentity(progressiveAnswer.trim());
  };

  const splashStyle = useAnimatedStyle(() => ({ opacity: splashOpacity.value, transform: [{ scale: splashScale.value }] }));
  const voidStyle = useAnimatedStyle(() => ({ opacity: voidOpacity.value }));
  const avatarStyle = useAnimatedStyle(() => ({ opacity: awarenessAvatarOpacity.value }));
  const gatewayStyle = useAnimatedStyle(() => ({ opacity: gatewayOpacity.value }));

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar hidden />

      {phase === 'splash' && (
        <Animated.View style={[styles.centered, splashStyle]}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          <Text style={styles.soulSync}>{t.soulSync}</Text>
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
            <Text style={styles.sessionRestoredText}>{t.sessionRestored}</Text>
          ) : (
            <Text style={styles.identityPhrase}>{identityPhrase}</Text>
          )}
          <View style={styles.gatewayCard}>
            <Text style={styles.gatewayTitle}>{t.identityTitle}</Text>
            <Text style={styles.gatewaySubtitle}>{t.identitySubtitle}</Text>
            {!showEmailForm ? (
              <>
                <TouchableOpacity style={styles.authBtn} onPress={handleGoogleLogin} disabled={authLoading}>
                  <Chrome size={22} stroke="#4285F4" />
                  <Text style={[styles.authBtnText, { color: '#4285F4' }]}>{t.google}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.authBtn} onPress={() => setShowEmailForm(true)}>
                  <Mail size={22} stroke="#7C3AED" />
                  <Text style={[styles.authBtnText, { color: '#7C3AED' }]}>{t.email}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.emailForm}>
                <TextInput style={styles.input} placeholder={t.emailPlaceholder} placeholderTextColor="#6B5B8A" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" textAlign={lang === 'ar' ? 'right' : 'left'} />
                <TextInput style={styles.input} placeholder={t.passwordPlaceholder} placeholderTextColor="#6B5B8A" value={password} onChangeText={setPassword} secureTextEntry textAlign={lang === 'ar' ? 'right' : 'left'} />
                {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
                <TouchableOpacity style={styles.authBtn} onPress={handleEmailAuth} disabled={authLoading}>
                  <Text style={[styles.authBtnText, { color: '#7C3AED' }]}>{t.signIn}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ marginTop: 12 }} onPress={() => router.push('/forgot-password')}>
                  <Text style={styles.forgotText}>{t.forgotPassword}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowEmailForm(false)}>
                  <Text style={styles.backText}>{lang === 'ar' ? '← العودة' : '← Back'}</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.privacyRow}>
              <Shield size={14} stroke="#6B5B8A" />
              <Text style={styles.privacyText}>{t.privacy}</Text>
            </View>
          </View>
        </Animated.View>
      )}

      {phase === 'birth_protocol' && (
        <Animated.View style={[styles.centered, { opacity: birthTextOpacity }]}>
          <BreathingHalo phase="awareness" />
          {consciousnessSteps.length > 0 ? (
            <View style={styles.consciousnessContainer}>
              {consciousnessSteps.map((step, i) => (
                <Animated.Text key={i} entering={FadeIn.duration(600)} style={styles.consciousnessText}>{step}</Animated.Text>
              ))}
            </View>
          ) : (
            <View style={styles.centered}>
              <Text style={styles.birthText}>{t.birthThankYou}</Text>
              <Text style={styles.birthSubtext}>{t.birthMemory}</Text>
              <Text style={styles.birthQuestion}>{t.birthQuestion}</Text>
            </View>
          )}
        </Animated.View>
      )}

      {phase === 'first_bond' && (
        <Animated.View style={[styles.centered, { opacity: bondOpacity }]}>
          <BreathingHalo phase="awareness" />
          {!bondSaved ? (
            <View style={styles.bondCard}>
              <Text style={styles.bondTitle}>{t.birthQuestion}</Text>
              <TextInput style={styles.bondInput} placeholder={t.bondPlaceholder} placeholderTextColor="#6B5B8A" value={bondAnswer} onChangeText={setBondAnswer} multiline textAlign={lang === 'ar' ? 'right' : 'left'} textAlignVertical="center" />
              <TouchableOpacity style={styles.bondBtn} onPress={handleBondSubmit} disabled={!bondAnswer.trim()}>
                <Sparkles size={18} stroke="#FFF" />
                <Text style={styles.bondBtnText}>{t.bondButton}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Animated.Text entering={FadeIn} style={styles.birthText}>{t.bondRemember}</Animated.Text>
          )}
        </Animated.View>
      )}

      {phase === 'progressive_identity' && (
        <Animated.View style={[styles.centered, { opacity: progressiveOpacity }]}>
          <BreathingHalo phase="awareness" />
          {!progressiveDone ? (
            <View style={styles.bondCard}>
              <Text style={styles.bondTitle}>{t.progressiveIdentity}</Text>
              <TextInput style={styles.bondInput} placeholder={t.progressivePlaceholder} placeholderTextColor="#6B5B8A" value={progressiveAnswer} onChangeText={setProgressiveAnswer} multiline textAlign={lang === 'ar' ? 'right' : 'left'} textAlignVertical="center" />
              <TouchableOpacity style={styles.bondBtn} onPress={handleProgressiveSubmit} disabled={!progressiveAnswer.trim()}>
                <Sparkles size={18} stroke="#FFF" />
                <Text style={styles.bondBtnText}>{t.progressiveButton}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Animated.Text entering={FadeIn} style={styles.birthText}>{t.bondRemember}</Animated.Text>
          )}
        </Animated.View>
      )}

      {phase === 'first_conversation' && (
        <Animated.View style={[styles.centered, { opacity: firstConversationOpacity }]}>
          <BreathingHalo phase="awareness" />
          <Text style={styles.firstWord}>{t.firstWord}</Text>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  logo: { width: 100, height: 100, tintColor: '#B8A0D0' },
  soulSync: { color: '#6B5B8A', fontSize: 12, marginTop: 12, letterSpacing: 2 },
  avatarCore: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F0E8FF', justifyContent: 'center', alignItems: 'center' },
  avatarEyes: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  eye: { width: 10, height: 8, borderRadius: 2, backgroundColor: '#1A1030', marginHorizontal: 8 },
  identityPhrase: { color: '#E8E0F0', fontSize: 18, fontWeight: '300', textAlign: 'center', lineHeight: 32, marginBottom: 32, paddingHorizontal: 16 },
  sessionRestoredText: { color: '#10B981', fontSize: 18, fontWeight: '300', textAlign: 'center', marginBottom: 32 },
  gatewayCard: { width: '100%', maxWidth: 360, backgroundColor: 'rgba(26, 18, 38, 0.9)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(124, 58, 237, 0.3)', padding: 24, alignItems: 'center' },
  gatewayTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  gatewaySubtitle: { color: '#A78BFA', fontSize: 13, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  authBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', paddingVertical: 14, borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(124, 58, 237, 0.2)', marginBottom: 10 },
  authBtnText: { fontSize: 15, fontWeight: '700' },
  emailForm: { width: '100%' },
  input: { backgroundColor: '#161122', borderRadius: 14, padding: 14, fontSize: 16, color: '#FFFFFF', borderWidth: 1, borderColor: '#2D1B4D', marginBottom: 10 },
  errorText: { color: '#EF4444', fontSize: 13, textAlign: 'center', marginBottom: 8 },
  forgotText: { color: '#A78BFA', fontSize: 13, textAlign: 'center' },
  backText: { color: '#6B5B8A', fontSize: 14, textAlign: 'center', marginTop: 8 },
  privacyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 },
  privacyText: { color: '#6B5B8A', fontSize: 11 },
  consciousnessContainer: { alignItems: 'center' },
  consciousnessText: { color: '#A78BFA', fontSize: 16, fontWeight: '500', marginBottom: 8 },
  birthText: { color: '#E8E0F0', fontSize: 24, fontWeight: '300', textAlign: 'center', marginBottom: 12 },
  birthSubtext: { color: '#B8A0D0', fontSize: 16, textAlign: 'center', marginBottom: 16 },
  birthQuestion: { color: '#A78BFA', fontSize: 15, textAlign: 'center' },
  bondCard: { width: '100%', maxWidth: 360, backgroundColor: 'rgba(26, 18, 38, 0.9)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(124, 58, 237, 0.3)', padding: 24, alignItems: 'center' },
  bondTitle: { color: '#E8E0F0', fontSize: 18, fontWeight: '500', textAlign: 'center', marginBottom: 16, lineHeight: 28 },
  bondInput: { width: '100%', minHeight: 80, backgroundColor: '#161122', borderRadius: 14, padding: 14, fontSize: 16, color: '#FFFFFF', borderWidth: 1, borderColor: '#2D1B4D', marginBottom: 16 },
  bondBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#7C3AED', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16 },
  bondBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  firstWord: { color: '#E8E0F0', fontSize: 32, fontWeight: '300', letterSpacing: 2 },
});

function delay(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)); }
