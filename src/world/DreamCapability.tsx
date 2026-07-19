import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { EventBus } from '../core/EventBus';
import { unifiedBrainBridge } from '../core/UnifiedBrainBridge';
import { capabilityResolver } from '../coordinators/CapabilityResolver';
import { economyEngine } from '../services/EconomyEngine';
import { sendMessage } from '../services/twinApi';
import { useRTL } from '../../lib/useRTL';
import { useAppTheme } from '../../engine/colors';
import { SPACE, RADIUS } from '../../src/design/tokens/spacing';
import { Moon, Compass, TrendingUp, Search, Clock, GitBranch, Sparkles, ChevronRight, Brain } from 'lucide-react-native';

interface DreamSession {
  id: string;
  title: string;
  type: string;
  content: string;
  timestamp: string;
}

const DREAM_ACTIONS = [
  { type: 'interpret', icon: Moon, color: colors.accent, label_ar: 'فسر حلمي', label_en: 'Interpret Dream', placeholder_ar: 'احكِ لي حلمك...', placeholder_en: 'Tell me your dream...' },
  { type: 'dna', icon: Compass, color: '#6366F1', label_ar: 'بصمتي الحلمية', label_en: 'Dream DNA', placeholder_ar: 'ما نمط أحلامي؟', placeholder_en: 'What is my dream pattern?' },
  { type: 'patterns', icon: TrendingUp, color: '#A855F7', label_ar: 'أنماط متكررة', label_en: 'Recurring Patterns', placeholder_ar: 'ما الذي يتكرر في أحلامي؟', placeholder_en: 'What repeats in my dreams?' },
  { type: 'symbols', icon: Search, color: '#EC4899', label_ar: 'بحث عن رمز', label_en: 'Search Symbol', placeholder_ar: 'ما معنى هذا الرمز؟', placeholder_en: 'What does this symbol mean?' },
  { type: 'forecast', icon: Sparkles, color: '#F59E0B', label_ar: 'توقعات', label_en: 'Forecast', placeholder_ar: 'ما الذي تخبرني به أحلامي؟', placeholder_en: 'What are my dreams telling me?' },
];

export default function DreamCapability() {
  const rtl = useRTL();
  const { colors } = useAppTheme();
  const [active, setActive] = useState(false);
  const [inputText, setInputText] = useState('');
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [sessions, setSessions] = useState<DreamSession[]>([]);
  const [lastDream, setLastDream] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState('');
  const [dreamCount, setDreamCount] = useState(0);

  useEffect(() => {
    const unsub1 = EventBus.on('CAPABILITY_ACTIVATED', (payload: any) => { if (payload?.capability === 'dream') { setActive(true); loadDreamContext(); } });
    const unsub2 = EventBus.on('CAPABILITY_DEACTIVATED', () => setActive(false));
    const unsub3 = EventBus.on('WORKSPACE_CHANGE_REQUESTED', (payload: any) => { if (payload?.workspace === 'dream') { setActive(true); loadDreamContext(); } else if (payload?.workspace === null && active) setActive(false); });
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [active]);

  const loadDreamContext = async () => {
    try {
      const saved = await unifiedBrainBridge.getCapabilityMemory('dream', 5);
      if (saved.length > 0) {
        setSessions(saved.map(m => ({ id: m.id, title: m.content?.substring(0, 60) || '', type: 'dream', content: m.content, timestamp: m.created_at || m.timestamp })));
        setLastDream(saved[0].content?.substring(0, 80) || '');
        setDreamCount(saved.length);
      }
    } catch (e) {}
  };

  const handleQuickAction = async (actionType: string) => {
    if (!inputText.trim() || isProcessing) return;
    setActiveAction(actionType);
    setIsProcessing(true);
    setLastResponse('');

    try {
      const enhancedMessage = `${rtl.isRTL ? 'طلب حلمي:' : 'Dream request:'} ${actionType}: ${inputText.trim()}`;
      const result = await sendMessage(enhancedMessage, [], rtl.isRTL ? 'ar' : 'en');
      const reply = result?.reply || (rtl.isRTL ? 'تم التحليل.' : 'Analysis complete.');

      const newSession: DreamSession = { id: Date.now().toString(), title: inputText.trim().substring(0, 60), type: actionType, content: reply, timestamp: new Date().toISOString() };
      setSessions(prev => [newSession, ...prev.slice(0, 9)]);
      setLastResponse(reply);
      setDreamCount(prev => prev + 1);

      try {
        await unifiedBrainBridge.storeMemory('dream', inputText.trim(), 70, 'curious', ['dream', actionType]);
      } catch (e) {}

      economyEngine.rewardDream();
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
        const twinState = await unifiedBrainBridge.getTwinState();
        const emotion = twinState?.twin_emotional_state?.current_emotion || 'neutral';
        if (emotion === 'curious' || emotion === 'focused') {
          EventBus.emit('TWIN_SPEAK', { phrase: rtl.isRTL ? 'هل حلمت الليلة؟' : 'Did you dream tonight?', tone: 'gentle' });
        }
      } catch (e) {}
    }, 8000);
    return () => clearTimeout(timer);
  }, [active]);

  const handleDeactivate = () => {
    EventBus.emit('CAPABILITY_DEACTIVATED', { capability: 'dream', timestamp: Date.now() });
    capabilityResolver.deactivate();
  };

  if (!active) return null;

  return (
    <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(300)} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconWrapLarge, { backgroundColor: '#8B5CF620' }]}>
            <Moon size={24} stroke="#8B5CF6" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Dream World</Text>
            <Text style={styles.headerSubtitle}>{rtl.isRTL ? 'عالم الأحلام' : 'Dream World'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={handleDeactivate}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.canvasCard}>
          <View style={styles.canvasHeader}>
            <Moon size={16} stroke="#8B5CF6" />
            <Text style={styles.canvasLabel}>{rtl.isRTL ? 'احكِ لي حلمك...' : 'Tell me your dream...'}</Text>
          </View>
          <TextInput
            style={[styles.canvasInput, { textAlign: rtl.textAlign }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder={rtl.isRTL ? 'احكِ لي ما رأيته الليلة...' : 'Tell me what you saw tonight...'}
            placeholderTextColor="#4A5568"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {lastDream && (
            <View style={styles.lastDreamCard}>
              <Brain size={16} stroke="#8B5CF6" />
              <Text style={styles.lastDreamText}>{rtl.isRTL ? 'آخر حلم:' : 'Last dream:'} {lastDream}</Text>
            </View>
          )}

          {dreamCount > 0 && (
            <View style={styles.statsRow}>
              <Text style={styles.statText}>{dreamCount} {rtl.isRTL ? 'حلم' : 'dreams'}</Text>
            </View>
          )}

          <View style={styles.actionsGrid}>
            {DREAM_ACTIONS.map(action => {
              const IconComponent = action.icon;
              return (
                <TouchableOpacity
                  key={action.type}
                  style={[styles.actionBtn, { borderColor: action.color + '40' }, activeAction === action.type && { backgroundColor: action.color + '15' }]}
                  onPress={() => handleQuickAction(action.type)}
                  disabled={isProcessing}
                >
                  <IconComponent size={16} stroke={action.color} />
                  <Text style={[styles.actionLabel, { color: action.color }]}>{rtl.isRTL ? action.label_ar : action.label_en}</Text>
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
            <Text style={styles.sectionTitle}>{rtl.isRTL ? 'سجل الأحلام' : 'Dream History'}</Text>
            {sessions.slice(0, 5).map(session => (
              <View key={session.id} style={styles.sessionItem}>
                <View style={[styles.sessionIcon, { backgroundColor: '#8B5CF620' }]}>
                  <Moon size={14} stroke="#8B5CF6" />
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
  headerTitle: { color: colors.text, fontSize: 20, fontWeight: '700' },
  headerSubtitle: { color: colors.textSecondary, fontSize: 12 },
  closeBtn: { padding: 8, borderRadius: RADIUS.sm, backgroundColor: 'rgba(255,255,255,0.05)' },
  closeText: { color: colors.textSecondary, fontSize: 16, fontWeight: '700' },
  canvasCard: { backgroundColor: colors.card, borderRadius: RADIUS.card, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.25)', padding: SPACE.md },
  canvasHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginBottom: SPACE.sm },
  canvasLabel: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  canvasInput: { backgroundColor: colors.inputBg, borderRadius: RADIUS.sm, padding: 14, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border, minHeight: 100 },
  lastDreamCard: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, backgroundColor: 'rgba(139,92,246,0.08)', borderRadius: RADIUS.sm, padding: SPACE.sm, marginTop: SPACE.sm },
  lastDreamText: { color: colors.accent, fontSize: 13, flex: 1 },
  statsRow: { marginTop: SPACE.sm, alignItems: 'center' },
  statText: { color: colors.textSecondary, fontSize: 12 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.sm, marginTop: SPACE.md },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: RADIUS.sm, borderWidth: 1.5 },
  actionLabel: { fontSize: 13, fontWeight: '600' },
  processingText: { color: colors.accent, fontSize: 13, marginTop: SPACE.sm, fontStyle: 'italic' },
  responseCard: { backgroundColor: colors.inputBg, borderRadius: RADIUS.sm, padding: SPACE.md, marginTop: SPACE.md, borderWidth: 1, borderColor: colors.border },
  responseText: { color: colors.text, fontSize: 14, lineHeight: 22 },
  sessionsSection: { marginTop: SPACE.md },
  sectionTitle: { color: colors.textSecondary, fontSize: 14, fontWeight: '600', marginBottom: SPACE.sm },
  sessionItem: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, backgroundColor: colors.card, borderRadius: RADIUS.sm, padding: SPACE.sm, marginBottom: 6 },
  sessionIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  sessionInfo: { flex: 1 },
  sessionTitle: { color: colors.text, fontSize: 13, fontWeight: '500' },
  sessionTime: { color: colors.textSecondary, fontSize: 10 },
});
