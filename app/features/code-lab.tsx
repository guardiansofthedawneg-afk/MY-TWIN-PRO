import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, Animated, RefreshControl, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../../store/useTwinStore';
import { useTheme } from '../../utils/theme';
import { router } from 'expo-router';
import { apiPost, apiGet } from '../../lib/httpClient';
import {
  ArrowLeft, Code2, Terminal, GitBranch, Shield, Zap,
  TrendingUp, Server, Cpu, MessageSquare, Lightbulb,
  ChevronRight, Play, FileText, Search, RefreshCw,
  Rocket, BarChart3, Layers, Activity, Clock, Target,
  Award, AlertTriangle, CheckCircle2, Eye, Brain,
} from 'lucide-react-native';

const { width: SCREEN_W } = Dimensions.get('window');

let Haptics: any = null;
try { Haptics = require('expo-haptics'); } catch(e) {}
const hapticLight = () => { try { Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light); } catch(e) {} };

const T = {
  ar: {
    title: 'المكتب الهندسي',
    greeting: 'مرحباً بك في مكتبك الهندسي',
    currentProject: 'المشروع الحالي',
    recentProjects: 'آخر المشاريع',
    quickActions: 'إجراءات سريعة',
    analyzeIdea: 'تحليل فكرة',
    reviewCode: 'مراجعة كود',
    makeDecision: 'اتخاذ قرار',
    startProject: 'مشروع جديد',
    recommendations: 'توصيات CTO',
    insights: 'رؤى اليوم',
    noProject: 'لا يوجد مشروع نشط',
    startNow: 'ابدأ مشروعك الأول',
  },
  en: {
    title: 'Engineering Office',
    greeting: 'Welcome to your Engineering Office',
    currentProject: 'Current Project',
    recentProjects: 'Recent Projects',
    quickActions: 'Quick Actions',
    analyzeIdea: 'Analyze Idea',
    reviewCode: 'Code Review',
    makeDecision: 'Make Decision',
    startProject: 'New Project',
    recommendations: 'CTO Recommendations',
    insights: "Today's Insights",
    noProject: 'No active project',
    startNow: 'Start your first project',
  },
};

export default function DigitalCTO() {
  const insets = useSafeAreaInsets();
  const { lang, userId, twinName, hasHydrated, bondLevel } = useTwinStore();
  const isAr = lang === 'ar';
  const isDark = useTheme().isDark;
  const t = T[lang] || T['ar'];

  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mode, setMode] = useState<'dashboard' | 'analyze' | 'review' | 'decision'>('dashboard');
  const [input, setInput] = useState('');
  const [result, setResult] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [thinkingStage, setThinkingStage] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const colors = useMemo(() => ({
    bg: isDark ? '#0A0014' : '#FAFAF8',
    card: isDark ? '#1A1226' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#2D2D2D',
    subtext: isDark ? '#A78BFA' : '#6B7280',
    accent: '#10B981',
    accentLight: '#10B98115',
    border: isDark ? '#2D1B4D' : '#E8E8E3',
    inputBg: isDark ? '#161122' : '#FDFDF9',
    warning: '#F59E0B',
    danger: '#EF4444',
  }), [isDark]);

  const fetchDashboard = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await apiGet(`/api/engineering/dashboard/${userId}?lang=${lang}`);
      setDashboard(data);
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    } catch (e) {}
    setLoading(false);
    setRefreshing(false);
  }, [userId, lang]);

  useEffect(() => {
    if (!hasHydrated) return;
    fetchDashboard();
  }, [hasHydrated]);

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setProcessing(true);
    setThinkingStage('جاري تحليل الفكرة...');
    setResult(null);
    try {
      const res = await apiPost('/api/engineering/analyze-idea', { user_id: userId, idea: input, lang });
      setResult(res);
    } catch (e) {}
    setProcessing(false);
    setThinkingStage('');
  };

  if (!hasHydrated || loading) {
    return (
      <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      <View style={[st.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} stroke={colors.text} /></TouchableOpacity>
        <Text style={[st.headerTitle, { color: colors.text }]}>{t.title}</Text>
        <TouchableOpacity onPress={fetchDashboard}><RefreshCw size={20} stroke={colors.subtext} /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={st.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDashboard(); }} />}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* بطاقة الترحيب */}
          <View style={[st.greetingCard, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}>
            <Brain size={24} stroke={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={[st.greetingText, { color: colors.accent }]}>{t.greeting}</Text>
              <Text style={[st.greetingSub, { color: colors.subtext }]}>
                {twinName || (isAr ? 'مهندس' : 'Engineer')} • {dashboard?.stats?.total_projects || 0} {isAr ? 'مشاريع' : 'projects'}
              </Text>
            </View>
          </View>

          {/* إجراءات سريعة */}
          <Text style={[st.sectionTitle, { color: colors.text }]}>{t.quickActions}</Text>
          <View style={st.quickActionsGrid}>
            <TouchableOpacity style={[st.quickAction, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setMode('analyze')}>
              <Lightbulb size={28} stroke={colors.accent} />
              <Text style={[st.quickActionText, { color: colors.text }]}>{t.analyzeIdea}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[st.quickAction, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setMode('review')}>
              <Search size={28} stroke={colors.warning} />
              <Text style={[st.quickActionText, { color: colors.text }]}>{t.reviewCode}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[st.quickAction, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setMode('decision')}>
              <GitBranch size={28} stroke="#7C3AED" />
              <Text style={[st.quickActionText, { color: colors.text }]}>{t.makeDecision}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[st.quickAction, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setMode('analyze')}>
              <Rocket size={28} stroke={colors.danger} />
              <Text style={[st.quickActionText, { color: colors.text }]}>{t.startProject}</Text>
            </TouchableOpacity>
          </View>

          {/* توصيات CTO */}
          {dashboard?.recommendations?.length > 0 && (
            <View style={st.section}>
              <Text style={[st.sectionTitle, { color: colors.text }]}>{t.recommendations}</Text>
              {dashboard.recommendations.slice(0, 3).map((rec: any, i: number) => (
                <View key={i} style={[st.recCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Target size={16} stroke={colors.accent} />
                  <Text style={[st.recText, { color: colors.text }]}>{rec.recommendation || rec}</Text>
                </View>
              ))}
            </View>
          )}

          {/* رؤى اليوم */}
          {dashboard?.insights?.length > 0 && (
            <View style={st.section}>
              <Text style={[st.sectionTitle, { color: colors.text }]}>{t.insights}</Text>
              {dashboard.insights.slice(0, 3).map((insight: string, i: number) => (
                <View key={i} style={[st.insightCard, { backgroundColor: colors.accentLight }]}>
                  <Eye size={14} stroke={colors.accent} />
                  <Text style={[st.insightText, { color: colors.accent }]}>{insight}</Text>
                </View>
              ))}
            </View>
          )}

          {/* معالج التحليل (عند اختيار إجراء) */}
          {mode !== 'dashboard' && (
            <View style={[st.wizardCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                style={[st.input, { backgroundColor: colors.inputBg, color: colors.text }]}
                placeholder={mode === 'analyze' ? 'صف فكرة مشروعك...' : mode === 'review' ? 'الصق الكود...' : 'ما القرار الذي تريد اتخاذه؟'}
                placeholderTextColor={colors.subtext}
                value={input}
                onChangeText={setInput}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
              <TouchableOpacity style={[st.btn, { backgroundColor: colors.accent }]} onPress={handleAnalyze} disabled={processing}>
                {processing ? <ActivityIndicator color="#FFF" /> : <><Play size={18} stroke="#FFF" /><Text style={st.btnText}>تنفيذ</Text></>}
              </TouchableOpacity>
              {thinkingStage ? <Text style={[st.thinkingText, { color: colors.subtext }]}>{thinkingStage}</Text> : null}
              {result && (
                <View style={[st.resultCard, { backgroundColor: colors.inputBg }]}>
                  <Text style={[st.resultText, { color: colors.text }]}>{JSON.stringify(result, null, 2).substring(0, 1500)}</Text>
                </View>
              )}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}
const st = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 50 },

  greetingCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 20, borderWidth: 1, marginBottom: 20 },
  greetingText: { fontSize: 18, fontWeight: '800' },
  greetingSub: { fontSize: 13, marginTop: 4 },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12 },

  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  quickAction: { width: (SCREEN_W - 52) / 2, padding: 20, borderRadius: 18, borderWidth: 1, alignItems: 'center', gap: 10 },
  quickActionText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },

  recCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  recText: { flex: 1, fontSize: 14, fontWeight: '500' },

  insightCard: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, marginBottom: 6 },
  insightText: { flex: 1, fontSize: 13, fontWeight: '500' },

  wizardCard: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 24 },
  input: { borderRadius: 16, padding: 16, fontSize: 15, borderWidth: 1, minHeight: 100, marginBottom: 12 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  btnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  thinkingText: { textAlign: 'center', marginTop: 12, fontSize: 13 },
  resultCard: { borderRadius: 14, padding: 14, marginTop: 12 },
  resultText: { fontSize: 12, fontFamily: 'monospace', lineHeight: 20 },
});
const st2 = StyleSheet.create({
  discussBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, marginTop: 12 },
  discussBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});
