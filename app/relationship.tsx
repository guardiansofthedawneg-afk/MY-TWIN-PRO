import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, RefreshControl, Modal, Platform,
  KeyboardAvoidingView, TextInput, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../store/useTwinStore';
import { useTheme } from '../utils/theme';
import { router } from 'expo-router';
import { apiGet, apiPost, apiDelete } from '../lib/httpClient';
import {
  Heart, Target, Plus, Trash2, X, TrendingUp,
  Star, Zap, Activity, Award, ArrowLeft, RefreshCw,
  CheckCircle2, Circle,
} from 'lucide-react-native';
import CircleProgress from '../components/CircleProgress';
import BondTimeline from '../components/BondTimeline';

const T = {
  ar: {
    title: 'حديقة الرابطة',
    loading: 'جاري تحميل علاقتك...',
    dimensions: 'أبعاد العلاقة',
    journey: 'رحلة الوعي',
    phase: 'المرحلة',
    attachment: 'نمط التعلق',
    goals: 'أهداف النمو',
    newGoal: 'هدف جديد',
    goalPlaceholder: 'ماذا تريد أن تحقق مع توأمك؟',
    save: 'حفظ الهدف',
    noGoals: 'لا توجد أهداف بعد. أضف هدفك الأول!',
    completed: 'مكتمل',
    active: 'نشط',
    deleteConfirm: 'هل تريد حذف هذا الهدف؟',
    cancel: 'إلغاء',
    delete: 'حذف',
    economyTitle: 'اقتصاد العلاقة',
    health: 'صحة العلاقة',
    trust: 'ثقة',
    intimacy: 'حميمية',
    respect: 'احترام',
    shared: 'تاريخ مشترك',
    recovery: 'تعافي',
  },
  en: {
    title: 'Bond Garden',
    loading: 'Loading your relationship...',
    dimensions: 'Relationship Dimensions',
    journey: 'Consciousness Journey',
    phase: 'Phase',
    attachment: 'Attachment Style',
    goals: 'Growth Goals',
    newGoal: 'New Goal',
    goalPlaceholder: 'What do you want to achieve together?',
    save: 'Save Goal',
    noGoals: 'No goals yet. Add your first goal!',
    completed: 'Completed',
    active: 'Active',
    deleteConfirm: 'Delete this goal?',
    cancel: 'Cancel',
    delete: 'Delete',
    economyTitle: 'Relationship Economy',
    health: 'Relationship Health',
    trust: 'Trust',
    intimacy: 'Intimacy',
    respect: 'Respect',
    shared: 'Shared History',
    recovery: 'Recovery',
  },
};

const getDescription = (value: number, lang: string) => {
  if (lang === 'ar') {
    if (value >= 80) return 'عميقة جداً';
    if (value >= 60) return 'قوية';
    if (value >= 40) return 'في تطور';
    if (value >= 20) return 'بداية واعدة';
    return 'جديدة';
  }
  if (value >= 80) return 'Very Deep';
  if (value >= 60) return 'Strong';
  if (value >= 40) return 'Growing';
  if (value >= 20) return 'Promising Start';
  return 'New';
};

const ATTACHMENT_LABELS: Record<string, { ar: string; en: string }> = {
  secure: { ar: 'آمن', en: 'Secure' },
  anxious: { ar: 'قلق', en: 'Anxious' },
  avoidant: { ar: 'متجنب', en: 'Avoidant' },
  disorganized: { ar: 'غير منظم', en: 'Disorganized' },
  unknown: { ar: 'غير معروف', en: 'Unknown' },
};

const PHASE_LABELS: Record<string, { ar: string; en: string }> = {
  introduction: { ar: 'تعارف', en: 'Introduction' },
  trust_building: { ar: 'بناء ثقة', en: 'Trust Building' },
  deepening: { ar: 'تعمق', en: 'Deepening' },
  growth: { ar: 'نمو', en: 'Growth' },
  mature: { ar: 'نضج', en: 'Mature' },
};

interface Goal {
  id: string;
  title: string;
  status: string;
  progress: number;
}

export default function Relationship() {
  const insets = useSafeAreaInsets();
  const { lang, journeyPhase, attachmentStyle } = useTwinStore();
  const theme = useTheme();
  const isAr = lang === 'ar';
  const isDark = theme.isDark;
  const t = T[lang] || T['ar'];

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [economy, setEconomy] = useState<any>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const userId = useTwinStore(s => s.userId);

  const colors = useMemo(() => ({
    bg: isDark ? '#0A0014' : '#FAFAF8',
    card: isDark ? '#1A1226' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#2D2D2D',
    subtext: isDark ? '#A78BFA' : '#7C6B99',
    accent: '#7C3AED',
    accentLight: '#7C3AED20',
    border: isDark ? '#2D1B4D' : '#E8E8E3',
    inputBg: isDark ? '#161122' : '#FDFDF9',
    success: '#10B981', warning: '#F59E0B', danger: '#EF4444',
    pink: '#EC4899', blue: '#3B82F6', purple: '#8B5CF6', gold: '#F59E0B',
  }), [isDark]);

  const fetchData = useCallback(async (showRefresh = false) => {
    if (!userId) return;
    if (showRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [goalsData, economyData] = await Promise.all([
        apiGet('/api/goals/').catch(() => []),
        apiGet(`/api/relationship/economy?user_id=${userId}`).catch(() => null),
      ]);
      setGoals(goalsData || []);
      if (economyData) setEconomy(economyData);
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    } catch (e) { console.error('Relationship fetch:', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [userId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddGoal = async () => {
    if (!newGoalTitle.trim()) return;
    setSaving(true);
    try {
      const result = await apiPost('/api/goals/', { title: newGoalTitle.trim(), category: 'relationship', priority: 3 });
      if (result) setGoals(prev => [result, ...prev]);
      setNewGoalTitle(''); setShowAddGoal(false);
    } catch (e) { console.error('Add goal:', e); }
    finally { setSaving(false); }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await apiDelete(`/api/goals/${goalId}`);
      setGoals(prev => prev.filter(g => g.id !== goalId));
    } catch (e) { console.error('Delete goal:', e); }
  };

  const phaseInfo = PHASE_LABELS[journeyPhase] || PHASE_LABELS.introduction;
  const attachmentInfo = ATTACHMENT_LABELS[attachmentStyle] || ATTACHMENT_LABELS.unknown;

  if (loading) {
    return (
      <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[st.loadingText, { color: colors.subtext, marginTop: 12 }]}>{t.loading}</Text>
      </View>
    );
  }

  return (
    <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={st.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} colors={[colors.accent]} />} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <BondTimeline />
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
