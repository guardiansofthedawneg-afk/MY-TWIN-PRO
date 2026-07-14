import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { EventBus } from '../core/EventBus';
import { memoryEngine } from '../../engine/memory/MemoryEngine';
import { capabilityResolver } from '../coordinators/CapabilityResolver';
import { consciousnessCoordinator } from '../coordinators/ConsciousnessCoordinator';
import { economyEngine } from '../services/EconomyEngine';
import { sendMessage } from '../services/twinApi';
import { useRTL } from '../../lib/useRTL';
import { SPACE, RADIUS } from '../../src/design/tokens/spacing';
import { 
  Heart, Brain, Crosshair, Moon, Sparkles, 
  TrendingUp, Wallet, Briefcase, Users, Shield, Clock 
} from 'lucide-react-native';

interface LifeCoachSession {
  id: string;
  title: string;
  type: string;
  content: string;
  timestamp: string;
}

const COACH_CATEGORIES = [
  {
    id: 'coaching', icon: Heart, color: '#EC4899',
    label_ar: 'جلسة', label_en: 'Session',
    actions: [
      { type: 'session', label_ar: 'جلسة كاملة', label_en: 'Full Session', placeholder_ar: 'ما الذي يشغل بالك؟', placeholder_en: 'What is on your mind?' },
    ]
  },
  {
    id: 'goals', icon: Crosshair, color: '#10B981',
    label_ar: 'أهداف', label_en: 'Goals',
    actions: [
      { type: 'assess_goal', label_ar: 'تقييم هدف', label_en: 'Assess Goal', placeholder_ar: 'ما هدفك؟', placeholder_en: 'What is your goal?' },
    ]
  },
  {
    id: 'body', icon: Brain, color: '#3B82F6',
    label_ar: 'جسد', label_en: 'Body',
    actions: [
      { type: 'nutrition', label_ar: 'تغذية', label_en: 'Nutrition', placeholder_ar: 'ما هدفك الغذائي؟', placeholder_en: 'What is your nutrition goal?' },
      { type: 'fitness', label_ar: 'لياقة', label_en: 'Fitness', placeholder_ar: 'ما هدفك الرياضي؟', placeholder_en: 'What is your fitness goal?' },
      { type: 'sleep', label_ar: 'نوم', label_en: 'Sleep', placeholder_ar: 'كيف تنام؟', placeholder_en: 'How do you sleep?' },
    ]
  },
  {
    id: 'mind', icon: Sparkles, color: '#A855F7',
    label_ar: 'عقل', label_en: 'Mind',
    actions: [
      { type: 'decision', label_ar: 'اتخاذ قرار', label_en: 'Make Decision', placeholder_ar: 'ما القرار الذي تواجهه؟', placeholder_en: 'What decision are you facing?' },
    ]
  },
  {
    id: 'life', icon: TrendingUp, color: '#F59E0B',
    label_ar: 'حياة', label_en: 'Life',
    actions: [
      { type: 'financial', label_ar: 'تحليل مالي', label_en: 'Financial', placeholder_ar: 'ما دخلك ومصاريفك؟', placeholder_en: 'What are your income and expenses?' },
      { type: 'career', label_ar: 'مسار وظيفي', label_en: 'Career', placeholder_ar: 'ما مجالك ومهاراتك؟', placeholder_en: 'What is your field and skills?' },
      { type: 'relationship', label_ar: 'علاقات', label_en: 'Relationships', placeholder_ar: 'ما الذي تواجهه في علاقاتك؟', placeholder_en: 'What are you facing in your relationships?' },
    ]
  },
];

export default function LifeCoachCapability() {
  const rtl = useRTL();
  const [active, setActive] = useState(false);
  const [inputText, setInputText] = useState('');
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [sessions, setSessions] = useState<LifeCoachSession[]>([]);
  const [lastTopic, setLastTopic] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('coaching');

  useEffect(() => {
    const unsub1 = EventBus.on('CAPABILITY_ACTIVATED', (payload: any) => { if (payload?.capability === 'life_coach') { setActive(true); loadCoachContext(); } });
    const unsub2 = EventBus.on('CAPABILITY_DEACTIVATED', () => setActive(false));
    const unsub3 = EventBus.on('WORKSPACE_CHANGE_REQUESTED', (payload: any) => { if (payload?.workspace === 'life_coach') { setActive(true); loadCoachContext(); } else if (payload?.workspace === null && active) setActive(false); });
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [active]);

  const loadCoachContext = async () => {
    try {
      const saved = await memoryEngine.getCapabilityMemory('life_coach', 5);
      if (saved.length > 0) {
        setSessions(saved.map(m => ({ id: m.id, title: m.content.substring(0, 60), type: m.relatedTo[0] || 'session', content: m.content, timestamp: m.timestamp })));
        setLastTopic(saved[0].content.substring(0, 80));
      }
    } catch (e) {}
  };

  const handleQuickAction = async (actionType: string) => {
    if (!inputText.trim() || isProcessing) return;
    setActiveAction(actionType);
    setIsProcessing(true);
    setLastResponse('');

    try {
      const enhancedMessage = `${rtl.isRTL ? 'طلب استشارة:' : 'Coaching request:'} ${actionType}: ${inputText.trim()}`;
      const result = await sendMessage(enhancedMessage, [], rtl.isRTL ? 'ar' : 'en');
      const reply = result?.reply || (rtl.isRTL ? 'تمت المعالجة.' : 'Processed.');

      const newSession: LifeCoachSession = { id: Date.now().toString(), title: inputText.trim().substring(0, 60), type: actionType, content: reply, timestamp: new Date().toISOString() };
      setSessions(prev => [newSession, ...prev.slice(0, 9)]);
      setLastResponse(reply);

      try {
        await memoryEngine.store('decision', inputText.trim(), 65, 'concerned', ['life_coach', actionType]);
        await memoryEngine.storeLongTerm('life_coach_session', inputText.trim(), 65, 'life_coach');
      } catch (e) {}

      // 🆕 مكافأة Soul Points
      economyEngine.addPoints('study_session', 15, 'جلسة Life Coach');
    } catch (e) {
      setLastResponse(rtl.isRTL ? 'حدث خطأ. حاول مرة أخرى.' : 'An error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
      setInputText('');
    }
  };

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(async () => {
      try {
        const decision = await consciousnessCoordinator.decide(
          rtl.isRTL ? 'أحتاج استشارة حياتية' : 'I need life coaching',
          'concerned'
        );
        if (decision.action === 'check_in') {
          EventBus.emit('TWIN_SPEAK', { phrase: rtl.isRTL ? 'كيف تشعر اليوم؟' : 'How are you feeling today?', tone: 'gentle' });
        }
      } catch (e) {}
    }, 8000);
    return () => clearTimeout(timer);
  }, [active]);

  const handleDeactivate = () => {
    EventBus.emit('CAPABILITY_DEACTIVATED', { capability: 'life_coach', timestamp: Date.now() });
    capabilityResolver.deactivate();
  };

  if (!active) return null;

  const activeCat = COACH_CATEGORIES.find(c => c.id === activeCategory) || COACH_CATEGORIES[0];

  return (
    <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(300)} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconWrapLarge, { backgroundColor: '#EC489920' }]}>
            <Heart size={24} stroke="#EC4899" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Life Coach</Text>
            <Text style={styles.headerSubtitle}>{rtl.isRTL ? 'مدرب الحياة' : 'Life Coach'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={handleDeactivate}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {lastTopic && (
          <View style={styles.lastTopicCard}>
            <Brain size={16} stroke="#EC4899" />
            <Text style={styles.lastTopicText}>{rtl.isRTL ? 'آخر مرة:' : 'Last time:'} {lastTopic}</Text>
          </View>
        )}

        <View style={styles.canvasCard}>
          <View style={styles.canvasHeader}>
            <Sparkles size={16} stroke="#EC4899" />
            <Text style={styles.canvasLabel}>{rtl.isRTL ? 'ما الذي يشغل بالك؟' : 'What is on your mind?'}</Text>
          </View>
          <TextInput
            style={[styles.canvasInput, { textAlign: rtl.textAlign }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder={rtl.isRTL ? 'تحدث معي بحرية...' : 'Talk to me freely...'}
            placeholderTextColor="#4A5568"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <View style={styles.categoriesRow}>
            {COACH_CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryChip, activeCategory === cat.id && { backgroundColor: cat.color + '20', borderColor: cat.color }]}
                  onPress={() => setActiveCategory(cat.id)}
                >
                  <Icon size={14} stroke={cat.color} />
                  <Text style={[styles.categoryLabel, { color: cat.color }]}>{rtl.isRTL ? cat.label_ar : cat.label_en}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.actionsGrid}>
            {activeCat.actions.map(action => {
              const ActionIcon = activeCat.icon;
              return (
                <TouchableOpacity
                  key={action.type}
                  style={[styles.actionBtn, { borderColor: activeCat.color + '40' }, activeAction === action.type && { backgroundColor: activeCat.color + '15' }]}
                  onPress={() => handleQuickAction(action.type)}
                  disabled={isProcessing}
                >
                  <ActionIcon size={16} stroke={activeCat.color} />
                  <Text style={[styles.actionLabel, { color: activeCat.color }]}>{rtl.isRTL ? action.label_ar : action.label_en}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {isProcessing && <Text style={styles.processingText}>{rtl.isRTL ? 'جاري التحليل...' : 'Analyzing...'}</Text>}

          {lastResponse !== '' && (
            <View style={styles.responseCard}>
              <Text style={styles.responseText} numberOfLines={10}>{lastResponse}</Text>
            </View>
          )}
        </View>

        {sessions.length > 0 && (
          <View style={styles.sessionsSection}>
            <Text style={styles.sectionTitle}>{rtl.isRTL ? 'جلسات سابقة' : 'Previous Sessions'}</Text>
            {sessions.slice(0, 5).map(session => (
              <View key={session.id} style={styles.sessionItem}>
                <View style={[styles.sessionIcon, { backgroundColor: '#EC489920' }]}>
                  <Heart size={14} stroke="#EC4899" />
                </View>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionTitle} numberOfLines={1}>{session.title}</Text>
                  <Text style={styles.sessionTime}>{new Date(session.timestamp).toLocaleDateString(rtl.isRTL ? 'ar' : 'en')}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: SPACE.lg, paddingVertical: SPACE.md, maxHeight: '75%' },
  scroll: { gap: SPACE.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACE.md },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  iconWrapLarge: { width: 48, height: 48, borderRadius: RADIUS.sm, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  headerSubtitle: { color: '#6B5B8A', fontSize: 12 },
  closeBtn: { padding: 8, borderRadius: RADIUS.sm, backgroundColor: 'rgba(255,255,255,0.05)' },
  closeText: { color: '#6B5B8A', fontSize: 16, fontWeight: '700' },
  lastTopicCard: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, backgroundColor: 'rgba(236,72,153,0.08)', borderRadius: RADIUS.sm, padding: SPACE.sm, marginBottom: SPACE.md },
  lastTopicText: { color: '#EC4899', fontSize: 13, flex: 1 },
  canvasCard: { backgroundColor: 'rgba(26, 18, 38, 0.95)', borderRadius: RADIUS.card, borderWidth: 1, borderColor: 'rgba(236, 72, 153, 0.25)', padding: SPACE.md },
  canvasHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginBottom: SPACE.sm },
  canvasLabel: { color: '#EC4899', fontSize: 14, fontWeight: '600' },
  canvasInput: { backgroundColor: '#161122', borderRadius: RADIUS.sm, padding: 14, fontSize: 15, color: '#FFFFFF', borderWidth: 1, borderColor: '#2D1B4D', minHeight: 100 },
  categoriesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.xs, marginTop: SPACE.md, marginBottom: SPACE.sm },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: 'transparent' },
  categoryLabel: { fontSize: 12, fontWeight: '600' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.sm, marginBottom: SPACE.sm },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: RADIUS.sm, borderWidth: 1.5 },
  actionLabel: { fontSize: 13, fontWeight: '600' },
  processingText: { color: '#EC4899', fontSize: 13, marginTop: SPACE.sm, fontStyle: 'italic' },
  responseCard: { backgroundColor: '#161122', borderRadius: RADIUS.sm, padding: SPACE.md, marginTop: SPACE.md, borderWidth: 1, borderColor: '#2D1B4D' },
  responseText: { color: '#E8E0F0', fontSize: 14, lineHeight: 22 },
  sessionsSection: { marginTop: SPACE.md },
  sectionTitle: { color: '#A78BFA', fontSize: 14, fontWeight: '600', marginBottom: SPACE.sm },
  sessionItem: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, backgroundColor: 'rgba(26, 18, 38, 0.7)', borderRadius: RADIUS.sm, padding: SPACE.sm, marginBottom: 6 },
  sessionIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  sessionInfo: { flex: 1 },
  sessionTitle: { color: '#E8E0F0', fontSize: 13, fontWeight: '500' },
  sessionTime: { color: '#6B5B8A', fontSize: 10 },
});
