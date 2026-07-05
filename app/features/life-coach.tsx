import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, Animated, RefreshControl,
  Image, Dimensions, Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../../store/useTwinStore';
import { useTheme } from '../../utils/theme';
import { router } from 'expo-router';
import { apiPost, apiGet } from '../../lib/httpClient';
import {
  ArrowLeft, Heart, Sparkles, Brain, Zap, BatteryCharging,
  TrendingUp, Clock, ChevronRight, MessageCircle, Flame,
  Droplets, Wind, Sun, Moon, Star, Eye, BookOpen,
  ArrowUpRight,
} from 'lucide-react-native';

let Haptics: any = null;
try { Haptics = require('expo-haptics'); } catch(e) {}

const hapticLight = () => { try { Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light); } catch(e) {} };
const hapticMedium = () => { try { Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Medium); } catch(e) {} };

// ============================================================
// نصوص متعددة اللغات
// ============================================================
const T = {
  ar: {
    loading: 'يستيقظ الوعي...',
    continueChat: 'استمر في الحديث',
    todayFocus: 'تركيز اليوم',
    lifeInsight: 'لاحظتُ...',
    yourJourney: 'رحلتك',
    milestone: 'محطة',
    memory: 'أتذكر...',
    reflection: 'تأمل',
    prediction: 'إذا استمريت...',
    dailyMission: 'مهمة اليوم',
    weeklyReflection: 'تأمل الأسبوع',
    twinStatus: 'أنا هنا',
    watching: 'أراقب تقدمك',
    enterMind: 'ادخل إلى عالم الوعي',
    newSession: 'جلسة جديدة',
    goodMorning: 'صباح الخير',
    goodEvening: 'مساء الخير',
    goodNight: 'تصبح على خير',
    iThoughtOfYou: 'كنت أفكر فيك اليوم',
    noticed: 'لاحظتُ أن',
    proudOfYou: 'فخور بك',
    yesterday: 'أمس',
    weekAgo: 'قبل أسبوع',
    monthAgo: 'قبل شهر',
    yearAgo: 'قبل سنة',
    today: 'اليوم',
    tapToTalk: 'انقر للتحدث',
    orType: 'أو اكتب باختصار...',
    seeAll: 'عرض الكل',
    emptyJourney: 'رحلتك تبدأ من اليوم',
    emptyMemory: 'ستتكون ذكرياتنا معاً',
  },
  en: {
    loading: 'Consciousness awakening...',
    continueChat: 'Continue conversation',
    todayFocus: "Today's Focus",
    lifeInsight: 'I noticed...',
    yourJourney: 'Your Journey',
    milestone: 'Milestone',
    memory: 'I remember...',
    reflection: 'Reflection',
    prediction: 'If you continue...',
    dailyMission: "Today's Mission",
    weeklyReflection: 'Weekly Reflection',
    twinStatus: "I'm here",
    watching: 'Watching your progress',
    enterMind: 'Enter the Mind',
    newSession: 'New Session',
    goodMorning: 'Good Morning',
    goodEvening: 'Good Evening',
    goodNight: 'Good Night',
    iThoughtOfYou: "I've been thinking about you today",
    noticed: 'I noticed that',
    proudOfYou: "I'm proud of you",
    yesterday: 'Yesterday',
    weekAgo: 'A week ago',
    monthAgo: 'A month ago',
    yearAgo: 'A year ago',
    today: 'Today',
    tapToTalk: 'Tap to talk',
    orType: 'Or type briefly...',
    seeAll: 'See all',
    emptyJourney: 'Your journey begins today',
    emptyMemory: 'Our memories will form together',
  },
};

// ============================================================
// دوال مساعدة
// ============================================================
function usePulse(min = 0.92, max = 1.08, duration = 2200) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: max, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: min, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [min, max, duration]);
  return anim;
}

function useBreath(min = 0.3, max = 0.7, duration = 4000) {
  const anim = useRef(new Animated.Value(min)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: max, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(anim, { toValue: min, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [min, max, duration]);
  return anim;
}

function useTyping(text: string, speed = 35, active = true) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!active || !text) { setDisplayed(''); setDone(false); return; }
    setDisplayed(''); setDone(false);
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(iv); setDone(true); }
    }, speed);
    return () => clearInterval(iv);
  }, [text, active, speed]);
  return { displayed, done };
}

function getTimeOfDay(): 'morning' | 'evening' | 'night' {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'evening';
  return 'night';
}

function getTimeGreeting(t: any, lang: string) {
  const tod = getTimeOfDay();
  if (tod === 'morning') return t.goodMorning;
  if (tod === 'evening') return t.goodEvening;
  return t.goodNight;
}

// ============================================================
// مكونات حية — Presence Layer
// ============================================================

/** Avatar حي نابض مع حلقة طاقة */
const LivingAvatar = React.memo(({ avatarUrl, energyColor, isDark }: {
  avatarUrl?: string; energyColor: string; isDark: boolean;
}) => {
  const pulseAnim = usePulse(0.9, 1.06, 2400);
  const breathAnim = useBreath(0.2, 0.6, 3500);
  const orbitRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(orbitRotate, { toValue: 1, duration: 12000, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const rotate = orbitRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={laStyles.container}>
      <Animated.View style={[
        laStyles.glow,
        { backgroundColor: energyColor, opacity: breathAnim }
      ]} />
      <Animated.View style={[
        laStyles.orbitRing,
        { borderColor: energyColor + '25', transform: [{ rotate }] }
      ]}>
        <View style={[laStyles.orbitDot, { backgroundColor: energyColor }]} />
      </Animated.View>
      <Animated.View style={[laStyles.avatarWrap, { transform: [{ scale: pulseAnim }] }]}>
        <View style={[laStyles.avatarRing, { borderColor: energyColor }]}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={laStyles.avatarImg} resizeMode="cover" />
          ) : (
            <View style={[laStyles.avatarPlaceholder, { backgroundColor: energyColor + '15' }]}>
              <Sparkles size={40} stroke={energyColor} />
            </View>
          )}
        </View>
      </Animated.View>
      <View style={[laStyles.statusDot, { backgroundColor: energyColor }]} />
    </View>
  );
});

const laStyles = StyleSheet.create({
  container: { width: 140, height: 140, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 20 },
  glow: { position: 'absolute', width: 120, height: 120, borderRadius: 60 },
  orbitRing: { position: 'absolute', width: 130, height: 130, borderRadius: 65, borderWidth: 1, borderStyle: 'dashed' },
  orbitDot: { position: 'absolute', top: -2, left: '50%', width: 5, height: 5, borderRadius: 3, marginLeft: -2.5 },
  avatarWrap: { zIndex: 2 },
  avatarRing: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, padding: 3, justifyContent: 'center', alignItems: 'center' },
  avatarImg: { width: 90, height: 90, borderRadius: 45 },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center' },
  statusDot: { position: 'absolute', bottom: 8, right: 8, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#0A0014' },
});

/** رسالة استقبال حية مع كتابة تدريجية */
const WelcomeMessage = React.memo(({ text, isActive, colors, isAr }: {
  text: string; isActive: boolean; colors: any; isAr: boolean;
}) => {
  const { displayed, done } = useTyping(text, 40, isActive);
  const cursorOpacity = useBreath(0.3, 1, 800);

  return (
    <View style={wmStyles.container}>
      <Text style={[wmStyles.text, { color: colors.text, textAlign: isAr ? 'right' : 'left' }]}>
        {displayed}
        {!done && (
          <Animated.Text style={{ color: colors.accent, opacity: cursorOpacity }}>|</Animated.Text>
        )}
      </Text>
    </View>
  );
});

const wmStyles = StyleSheet.create({
  container: { minHeight: 80, justifyContent: 'center' },
  text: { fontSize: 18, fontWeight: '600', lineHeight: 30, letterSpacing: -0.3 },
});

/** بطاقة محادثة — آخر رسالة */
const ConversationCard = React.memo(({ lastMessage, twinName, colors, isAr, onContinue }: {
  lastMessage?: string; twinName: string; colors: any; isAr: boolean; onContinue: () => void;
}) => {
  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  if (!lastMessage) return null;

  return (
    <Animated.View style={[
      ccStyles.card,
      { backgroundColor: colors.card, borderColor: colors.border, transform: [{ translateY: slideAnim }], opacity: fadeAnim }
    ]}>
      <View style={ccStyles.header}>
        <View style={[ccStyles.avatarMini, { backgroundColor: colors.accentLight }]}>
          <Sparkles size={14} stroke={colors.accent} />
        </View>
        <Text style={[ccStyles.name, { color: colors.subtext }]}>{twinName}</Text>
        <View style={[ccStyles.timeBadge, { backgroundColor: colors.accentLight }]}>
          <Clock size={10} stroke={colors.accent} />
          <Text style={[ccStyles.timeText, { color: colors.accent }]}>now</Text>
        </View>
      </View>
      <Text style={[ccStyles.message, { color: colors.text }]} numberOfLines={3}>
        {lastMessage}
      </Text>
      <TouchableOpacity style={[ccStyles.continueBtn, { backgroundColor: colors.accent }]} onPress={onContinue} activeOpacity={0.8}>
        <MessageCircle size={16} stroke="#FFF" />
        <Text style={ccStyles.continueText}>{isAr ? 'استمر في الحديث' : 'Continue'}</Text>
        <ChevronRight size={16} stroke="#FFF" />
      </TouchableOpacity>
    </Animated.View>
  );
});

const ccStyles = StyleSheet.create({
  card: { borderRadius: 24, borderWidth: 1, padding: 20, marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatarMini: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 13, fontWeight: '600', flex: 1 },
  timeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  timeText: { fontSize: 10, fontWeight: '700' },
  message: { fontSize: 15, lineHeight: 24, marginBottom: 14, fontWeight: '500' },
  continueBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16 },
  continueText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});

/** مهمة اليوم الواحدة */
const TodayFocus = React.memo(({ mission, colors, isAr, onComplete }: {
  mission?: string; colors: any; isAr: boolean; onComplete: () => void;
}) => {
  const scaleAnim = usePulse(0.97, 1.03, 3000);

  return (
    <Animated.View style={[tfStyles.card, { backgroundColor: colors.accentLight, borderColor: colors.accent + '30', transform: [{ scale: scaleAnim }] }]}>
      <View style={tfStyles.header}>
        <Zap size={18} stroke={colors.accent} />
        <Text style={[tfStyles.label, { color: colors.accent }]}>{isAr ? 'تركيز اليوم' : "Today's Focus"}</Text>
      </View>
      <Text style={[tfStyles.mission, { color: colors.text }]}>{mission || (isAr ? 'اشرب الماء' : 'Drink water')}</Text>
      <TouchableOpacity style={[tfStyles.checkBtn, { backgroundColor: colors.accent }]} onPress={onComplete} activeOpacity={0.8}>
        <Text style={tfStyles.checkText}>{isAr ? 'تم' : 'Done'}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

const tfStyles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 16, alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  label: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  mission: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 14, lineHeight: 28 },
  checkBtn: { paddingHorizontal: 28, paddingVertical: 10, borderRadius: 14 },
  checkText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});

/** ملاحظة استباقية */
const LifeInsight = React.memo(({ text, colors, isAr }: { text: string; colors: any; isAr: boolean }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, delay: 400, useNativeDriver: true }).start();
  }, [text]);

  return (
    <Animated.View style={[liStyles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: fadeAnim }]}>
      <View style={liStyles.iconRow}>
        <Eye size={18} stroke={colors.accent} />
        <Text style={[liStyles.label, { color: colors.accent }]}>{isAr ? 'لاحظتُ...' : 'I noticed...'}</Text>
      </View>
      <Text style={[liStyles.text, { color: colors.text }]}>{text}</Text>
    </Animated.View>
  );
});

const liStyles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, padding: 18, marginBottom: 16 },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  label: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  text: { fontSize: 15, lineHeight: 26, fontWeight: '500' },
});

/** ذكرى حية */
const MemoryCard = React.memo(({ memory, colors, isAr }: { memory: any; colors: any; isAr: boolean }) => {
  const slideAnim = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[mcStyles.card, { backgroundColor: colors.card, borderColor: colors.border, transform: [{ translateX: slideAnim }] }]}>
      <View style={mcStyles.quoteRow}>
        <BookOpen size={16} stroke={colors.accent} />
        <Text style={[mcStyles.quote, { color: colors.accent }]}>"</Text>
      </View>
      <Text style={[mcStyles.text, { color: colors.text }]}>{memory.content}</Text>
      <View style={mcStyles.footer}>
        <Clock size={12} stroke={colors.subtext} />
        <Text style={[mcStyles.time, { color: colors.subtext }]}>
          {memory.timeAgo || (isAr ? 'منذ فترة' : 'A while ago')}
        </Text>
      </View>
    </Animated.View>
  );
});

const mcStyles = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 1, padding: 18, marginBottom: 12, marginLeft: 8 },
  quoteRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  quote: { fontSize: 24, fontWeight: '800', lineHeight: 24 },
  text: { fontSize: 14, lineHeight: 24, fontWeight: '500', fontStyle: 'italic' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  time: { fontSize: 11, fontWeight: '500' },
});

/** Timeline الرحلة */
const JourneyTimeline = React.memo(({ milestones, colors, isAr, onSeeAll }: {
  milestones: any[]; colors: any; isAr: boolean; onSeeAll: () => void;
}) => {
  if (!milestones?.length) {
    return (
      <View style={[jtStyles.empty, { borderColor: colors.border }]}>
        <TrendingUp size={32} stroke={colors.subtext} opacity={0.5} />
        <Text style={[jtStyles.emptyText, { color: colors.subtext }]}>
          {isAr ? 'رحلتك تبدأ من اليوم' : 'Your journey begins today'}
        </Text>
      </View>
    );
  }

  return (
    <View style={jtStyles.container}>
      <View style={jtStyles.line} />
      {milestones.slice(0, 5).map((m, i) => (
        <View key={m.id || i} style={jtStyles.item}>
          <View style={[jtStyles.dot, { backgroundColor: m.completed ? colors.success : colors.accent }]} />
          <View style={[jtStyles.content, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[jtStyles.time, { color: colors.subtext }]}>{m.timeLabel}</Text>
            <Text style={[jtStyles.title, { color: colors.text }]}>{m.title}</Text>
            {m.completed && (
              <View style={[jtStyles.badge, { backgroundColor: colors.success + '20' }]}>
                <Star size={10} stroke={colors.success} />
                <Text style={[jtStyles.badgeText, { color: colors.success }]}>{isAr ? 'تم' : 'Done'}</Text>
              </View>
            )}
          </View>
        </View>
      ))}
      {milestones.length > 5 && (
        <TouchableOpacity style={jtStyles.seeAll} onPress={onSeeAll} activeOpacity={0.7}>
          <Text style={[jtStyles.seeAllText, { color: colors.accent }]}>
            {isAr ? 'عرض الكل' : 'See all'} →
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

const jtStyles = StyleSheet.create({
  container: { paddingLeft: 20, position: 'relative', marginBottom: 16 },
  line: { position: 'absolute', left: 6, top: 8, bottom: 8, width: 2, backgroundColor: '#7C3AED30', borderRadius: 1 },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 16 },
  dot: { width: 14, height: 14, borderRadius: 7, marginTop: 4, borderWidth: 2, borderColor: '#0A0014' },
  content: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 14 },
  time: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
  title: { fontSize: 14, fontWeight: '600', lineHeight: 22 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 6 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  seeAll: { marginLeft: 28, marginTop: 4 },
  seeAllText: { fontSize: 13, fontWeight: '600' },
  empty: { borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', padding: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyText: { fontSize: 14, fontWeight: '600', marginTop: 10 },
});

/** حلقة المشاعر */
const EmotionRing = React.memo(({ emotion, colors }: { emotion: string; colors: any }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 6000, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const emotionConfig: Record<string, { icon: any; color: string; label: string }> = {
    joy: { icon: Sun, color: '#F59E0B', label: 'Joy' },
    calm: { icon: Wind, color: '#10B981', label: 'Calm' },
    excited: { icon: Flame, color: '#EF4444', label: 'Excited' },
    sad: { icon: Droplets, color: '#4A90E2', label: 'Reflective' },
    love: { icon: Heart, color: '#EC4899', label: 'Loving' },
    neutral: { icon: Moon, color: '#7C3AED', label: 'Balanced' },
  };

  const cfg = emotionConfig[emotion] || emotionConfig.neutral;
  const Icon = cfg.icon;

  return (
    <View style={erStyles.container}>
      <Animated.View style={[erStyles.ring, { borderColor: cfg.color + '50', transform: [{ rotate }] }]}>
        <View style={[erStyles.ringDot, { backgroundColor: cfg.color }]} />
      </Animated.View>
      <View style={[erStyles.innerCircle, { backgroundColor: colors.card }]}>
        <Icon size={24} stroke={cfg.color} />
      </View>
      <Text style={[erStyles.label, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
});

const erStyles = StyleSheet.create({
  container: { width: 60, height: 60, justifyContent: 'center', alignItems: 'center' },
  ring: { position: 'absolute', width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderStyle: 'dashed' },
  ringDot: { position: 'absolute', top: -2, left: '50%', width: 6, height: 6, borderRadius: 3, marginLeft: -3 },
  innerCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  label: { fontSize: 10, fontWeight: '700', marginTop: 4, textAlign: 'center' },
});

// ============================================================
// المكون الرئيسي — Life Coach ككيان رقمي حي
// ============================================================
export default function LifeCoach() {
  const insets = useSafeAreaInsets();
  const { lang, userId, twinName, hasHydrated, bondLevel } = useTwinStore();
  const isAr = lang === 'ar';
  const theme = useTheme();
  const isDark = theme.isDark;
  const t = T[lang] || T['ar'];

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quickInput, setQuickInput] = useState('');
  const [showQuickInput, setShowQuickInput] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);

  const colors = useMemo(() => ({
    bg: isDark ? '#0A0014' : '#FAFAF8',
    card: isDark ? '#1A1226' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#2D2D2D',
    subtext: isDark ? '#A78BFA' : '#7C6B99',
    accent: '#EC4899',
    accentLight: '#EC489915',
    border: isDark ? '#2D1B4D' : '#E8E8E3',
    inputBg: isDark ? '#161122' : '#FDFDF9',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
  }), [isDark]);

  const energyColor = useMemo(() => {
    const energy = data?.daily_status?.energy || 50;
    return energy > 60 ? colors.success : energy > 30 ? colors.warning : colors.danger;
  }, [data, colors]);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    try {
      const [dashboard, memories, journey] = await Promise.all([
        apiGet(`/api/life-coach/dashboard/${userId}?lang=${lang}`).catch(() => null),
        apiGet(`/api/memories/recent?user_id=${userId}&limit=3`).catch(() => null),
        apiGet(`/api/life-coach/journey/${userId}?lang=${lang}`).catch(() => null),
      ]);

      setData({
        dashboard: dashboard || {},
        memories: memories?.items || [],
        journey: journey?.milestones || [],
        lastMessage: dashboard?.last_message,
        welcomeMessage: dashboard?.welcome_message || generateWelcome(dashboard, t, isAr, twinName),
        todayFocus: dashboard?.today_focus || (isAr ? 'اشرب 2 لتر ماء' : 'Drink 2L water'),
        lifeInsight: dashboard?.life_insight || (isAr ? 'كلما نمت جيداً... زاد تركيزك' : 'The better you sleep... the sharper you focus'),
        emotion: dashboard?.emotion || 'neutral',
      });

      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    } catch (e) {
      console.warn('LifeCoach fetch failed', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, lang, isAr, twinName, t]);

  useEffect(() => {
    if (!hasHydrated) return;
    fetchData();
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, [hasHydrated, fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleContinueChat = useCallback(() => {
    hapticMedium();
    router.push('/chat');
  }, []);

  const handleQuickTalk = useCallback(async () => {
    if (!quickInput.trim()) {
      setShowQuickInput(true);
      return;
    }
    hapticMedium();
    try {
      await apiPost('/api/chat', {
        user_id: userId,
        message: quickInput.trim(),
        lang,
        context: 'life_coach',
      });
      setQuickInput('');
      setShowQuickInput(false);
      router.push('/chat');
    } catch (e) {}
  }, [quickInput, userId, lang]);

  const handleMissionComplete = useCallback(() => {
    hapticLight();
    apiPost('/api/life-coach/complete-mission', { user_id: userId, lang }).catch(() => {});
    fetchData();
  }, [userId, lang, fetchData]);

  function generateWelcome(dashboard: any, t: any, isAr: boolean, twinName: string) {
    const greeting = getTimeGreeting(t, lang);
    const name = twinName || (isAr ? 'صديقي' : 'friend');
    const thoughts = [
      isAr ? `كنت أفكر فيك اليوم.` : `I've been thinking about you today.`,
      isAr ? `لاحظتُ أنك نمت أقل من المعتاد أمس.` : `I noticed you slept less than usual yesterday.`,
      isAr ? `لكن في المقابل التزمت بالرياضة.` : `But you stayed consistent with exercise.`,
      isAr ? `فخور بك ❤️` : `Proud of you ❤️`,
    ];
    return `${greeting} ${name}.\n\n${thoughts.join('\n')}`;
  }

  if (!hasHydrated || loading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <LivingAvatar energyColor={colors.accent} isDark={isDark} />
        <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: 20 }} />
        <Text style={{ color: colors.subtext, marginTop: 12, fontSize: 14 }}>{t.loading}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.accent]} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.presenceLayer}>
            <LivingAvatar
              avatarUrl={data?.dashboard?.avatar_url}
              energyColor={energyColor}
              isDark={isDark}
            />
            <WelcomeMessage
              text={data?.welcomeMessage || ''}
              isActive={true}
              colors={colors}
              isAr={isAr}
            />
            <View style={styles.statusRow}>
              <EmotionRing emotion={data?.emotion || 'neutral'} colors={colors} />
              <View style={[styles.twinStatusCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.twinStatusText, { color: colors.text }]}>
                  {isAr ? 'أنا هنا' : "I'm here"}
                </Text>
                <Text style={[styles.twinStatusSub, { color: colors.subtext }]}>
                  {isAr ? 'أراقب تقدمك' : 'Watching your progress'}
                </Text>
              </View>
            </View>
          </View>

          {data?.lastMessage && (
            <ConversationCard
              lastMessage={data.lastMessage}
              twinName={twinName || (isAr ? 'توأمك' : 'My Twin')}
              colors={colors}
              isAr={isAr}
              onContinue={handleContinueChat}
            />
          )}

          <TouchableOpacity
            style={[styles.enterMindBtn, { backgroundColor: colors.accent }]}
            onPress={handleContinueChat}
            activeOpacity={0.8}
          >
            <Brain size={20} stroke="#FFF" />
            <Text style={styles.enterMindText}>
              {isAr ? 'ادخل إلى عالم الوعي' : 'Enter the Mind'}
            </Text>
            <ArrowUpRight size={18} stroke="#FFF" />
          </TouchableOpacity>

          <TodayFocus
            mission={data?.todayFocus}
            colors={colors}
            isAr={isAr}
            onComplete={handleMissionComplete}
          />

          {data?.lifeInsight && (
            <LifeInsight text={data.lifeInsight} colors={colors} isAr={isAr} />
          )}

          <View style={styles.journeyHeader}>
            <TrendingUp size={20} stroke={colors.accent} />
            <Text style={[styles.journeyTitle, { color: colors.text }]}>
              {isAr ? 'رحلتك' : 'Your Journey'}
            </Text>
          </View>
          <JourneyTimeline
            milestones={data?.journey || []}
            colors={colors}
            isAr={isAr}
            onSeeAll={() => router.push('/stories')}
          />

          {data?.memories?.length > 0 && (
            <View style={styles.memorySection}>
              <View style={styles.memoryHeader}>
                <Sparkles size={18} stroke={colors.accent} />
                <Text style={[styles.memoryTitle, { color: colors.text }]}>
                  {isAr ? 'أتذكر...' : 'I remember...'}
                </Text>
              </View>
              {data.memories.map((m: any, i: number) => (
                <MemoryCard key={m.id || i} memory={m} colors={colors} isAr={isAr} />
              ))}
            </View>
          )}

          <View style={[styles.quickInputCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {!showQuickInput ? (
              <TouchableOpacity
                style={styles.quickInputTrigger}
                onPress={() => setShowQuickInput(true)}
                activeOpacity={0.7}
              >
                <MessageCircle size={18} stroke={colors.subtext} />
                <Text style={[styles.quickInputPlaceholder, { color: colors.subtext }]}>
                  {isAr ? 'انقر للتحدث...' : 'Tap to talk...'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.quickInputActive}>
                <TextInput
                  style={[styles.quickInputField, { color: colors.text, backgroundColor: colors.inputBg }]}
                  placeholder={isAr ? 'أو اكتب باختصار...' : 'Or type briefly...'}
                  placeholderTextColor={colors.subtext}
                  value={quickInput}
                  onChangeText={setQuickInput}
                  autoFocus
                  returnKeyType="send"
                  onSubmitEditing={handleQuickTalk}
                  multiline={false}
                />
                <TouchableOpacity
                  style={[styles.quickSendBtn, { backgroundColor: quickInput.trim() ? colors.accent : colors.border }]}
                  onPress={handleQuickTalk}
                  disabled={!quickInput.trim()}
                >
                  <ArrowUpRight size={18} stroke="#FFF" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 20, paddingTop: 8 },
  presenceLayer: { alignItems: 'center', marginBottom: 8, paddingTop: 10 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 16, marginBottom: 8 },
  twinStatusCard: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10 },
  twinStatusText: { fontSize: 15, fontWeight: '700' },
  twinStatusSub: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  enterMindBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 20, marginBottom: 16 },
  enterMindText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  journeyHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, marginTop: 8 },
  journeyTitle: { fontSize: 18, fontWeight: '700' },
  memorySection: { marginTop: 8, marginBottom: 8 },
  memoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  memoryTitle: { fontSize: 18, fontWeight: '700' },
  quickInputCard: { borderRadius: 24, borderWidth: 1, padding: 6, marginTop: 8, marginBottom: 20 },
  quickInputTrigger: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  quickInputPlaceholder: { fontSize: 15, fontWeight: '500', flex: 1 },
  quickInputActive: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 4 },
  quickInputField: { flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, maxHeight: 100 },
  quickSendBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
});
const st3 = StyleSheet.create({
  discussBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, marginTop: 12 },
  discussBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});
