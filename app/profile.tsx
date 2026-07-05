import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Animated, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../store/useTwinStore';
import { useTheme } from '../utils/theme';
import { router } from 'expo-router';
import { apiGet } from '../lib/httpClient';
import {
  ArrowLeft, User, Shield, Star, Zap, TrendingUp,
  Brain, Heart, Activity, Clock, Award, Settings, Crown,
  LogOut, ChevronRight, Sparkles, Fingerprint, Eye,
  MessageSquare, Target, Lightbulb, Smile, BookOpen,
} from 'lucide-react-native';

const T = {
  ar: {
    title: 'حسابي', loading: 'جاري تحميل بياناتك...',
    identity: 'هويتك الرقمية', stats: 'إحصائيات الكيان',
    insights: 'ما يراه توأمك فيك', account: 'الحساب',
    settings: 'الإعدادات', subscription: 'باقات الوعي',
    privacy: 'الخصوصية', about: 'حول التطبيق',
    logout: 'تسجيل الخروج', messages: 'رسائل',
    energy: 'طاقة', bond: 'رابطة', phase: 'مرحلة',
    points: 'نقطة', mood: 'مزاج التوأم', health: 'صحة العلاقة',
    stories: 'قصصنا', noInsights: 'تحدث مع توأمك أكثر لتظهر استنتاجات عن شخصيتك',
    phaseLabels: { introduction: 'تعارف', trust_building: 'بناء ثقة', deepening: 'تعمق', growth: 'نمو', mature: 'نضج' } as Record<string, string>,
  },
  en: {
    title: 'My Profile', loading: 'Loading your data...',
    identity: 'Your Digital Identity', stats: 'Entity Statistics',
    insights: 'What Your Twin Sees in You', account: 'Account',
    settings: 'Settings', subscription: 'Consciousness Plans',
    privacy: 'Privacy', about: 'About',
    logout: 'Sign Out', messages: 'Messages',
    energy: 'Energy', bond: 'Bond', phase: 'Phase',
    points: 'Points', mood: 'Twin Mood', health: 'Relationship Health',
    stories: 'Our Stories', noInsights: 'Talk to your Twin more to reveal insights about your personality',
    phaseLabels: { introduction: 'Introduction', trust_building: 'Trust Building', deepening: 'Deepening', growth: 'Growth', mature: 'Mature' } as Record<string, string>,
  },
};

export default function Profile() {
  const insets = useSafeAreaInsets();
  const {
    userId, twinName, lang, tier, bondLevel, twinEnergy,
    journeyPhase, totalMessages, points, userStats,
    getUserStats, logout: storeLogout,
  } = useTwinStore();
  const theme = useTheme();
  const isAr = lang === 'ar';
  const isDark = theme.isDark;
  const t = T[lang] || T['ar'];

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [identity, setIdentity] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [fingerprint, setFingerprint] = useState<any>(null);
  const [twinState, setTwinState] = useState<any>(null);
  const [economy, setEconomy] = useState<any>(null);
  const [storiesCount, setStoriesCount] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isMounted = useRef(true);

  const colors = useMemo(() => ({
    bg: isDark ? '#0A0014' : '#FAFAF8', card: isDark ? '#1A1226' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#2D2D2D', subtext: isDark ? '#A78BFA' : '#7C6B99',
    accent: '#7C3AED', accentLight: '#7C3AED20', border: isDark ? '#2D1B4D' : '#E8E8E3',
    success: '#10B981', warning: '#F59E0B', danger: '#EF4444',
    green: '#10B981', pink: '#EC4899', gold: '#F59E0B', blue: '#3B82F6',
  }), [isDark]);

  const fetchProfileData = useCallback(async (showRefresh = false) => {
    if (!userId) return;
    if (showRefresh) setRefreshing(true); else setLoading(true);
    try {
      await getUserStats();
      const [id, ins, fp, ts, re, stories] = await Promise.all([
        apiGet(`/api/memories?user_id=${userId}&limit=1`).catch(() => null),
        apiGet(`/api/memories/reflections?user_id=${userId}`).catch(() => null),
        apiGet(`/api/fingerprint/get?user_id=${userId}`).catch(() => null),
        apiGet(`/api/twin/state?user_id=${userId}&lang=${lang}`).catch(() => null),
        apiGet(`/api/relationship/economy?user_id=${userId}`).catch(() => null),
        apiGet(`/api/memories/stories?user_id=${userId}&lang=${lang}`).catch(() => []),
      ]);
      if (!isMounted.current) return;
      setIdentity(id); setInsights(ins); setFingerprint(fp);
      if (ts) setTwinState(ts);
      if (re) setEconomy(re);
      if (stories?.stories) setStoriesCount(stories.stories.length);
    } catch (e) {}
    finally {
      if (isMounted.current) {
        setLoading(false); setRefreshing(false);
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
      }
    }
  }, [userId, lang, getUserStats]);

  useEffect(() => {
    isMounted.current = true;
    fetchProfileData();
    return () => { isMounted.current = false; };
  }, [fetchProfileData]);

  const handleLogout = useCallback(() => {
    storeLogout();
    router.replace('/login');
  }, [storeLogout]);

  if (loading && !refreshing) {
    return (
      <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[st.loadingText, { color: colors.subtext, marginTop: 12 }]}>{t.loading}</Text>
      </View>
    );
  }

  const traits = fingerprint?.traits || [];
  const totalInsights = insights?.insights?.length || insights?.total_insights || 0;
  const phaseLabel = t.phaseLabels[journeyPhase] || journeyPhase;

  return (
    <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={st.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchProfileData(true)} colors={[colors.accent]} />} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* باقي الـ JSX كما هو */}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16, paddingBottom: 50 },
  loadingText: { fontSize: 15 },
});
