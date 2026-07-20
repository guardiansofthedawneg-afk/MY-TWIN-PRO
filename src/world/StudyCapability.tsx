import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { EventBus } from '../core/EventBus';
import { unifiedBrainBridge } from '../core/UnifiedBrainBridge';
import { capabilityResolver } from '../coordinators/CapabilityResolver';
import { economyEngine } from '../services/EconomyEngine';
import { useRTL } from '../../lib/useRTL';
import { useAppTheme } from '../../engine/colors';
import { SPACE, RADIUS } from '../../src/design/tokens/spacing';
import { BookOpen, Target, Brain, ChevronRight, Clock } from 'lucide-react-native';

interface StudyTopic {
  id: string;
  title: string;
  progress: number;
  lastStudied: string;
}

export default function StudyCapability() {
  const { colors } = useAppTheme();
  const { colors } = useAppTheme();
  const rtl = useRTL();
  const { colors } = useAppTheme();
  const { colors } = useAppTheme();
  const [active, setActive] = useState(false);
  const [currentTopic, setCurrentTopic] = useState('');
  const [topics, setTopics] = useState<StudyTopic[]>([]);
  const [lastTopic, setLastTopic] = useState<string>('');

  useEffect(() => {
    const unsub1 = EventBus.on('CAPABILITY_ACTIVATED', (payload: any) => {
      if (payload?.capability === 'study') { setActive(true); loadStudyContext(); }
    });
    const unsub2 = EventBus.on('CAPABILITY_DEACTIVATED', () => setActive(false));
    const unsub3 = EventBus.on('WORKSPACE_CHANGE_REQUESTED', (payload: any) => {
      if (payload?.workspace === 'study') { setActive(true); loadStudyContext(); }
      else if (payload?.workspace === null && active) setActive(false);
    });
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [active]);

  const loadStudyContext = async () => {
    try {
      const saved = await unifiedBrainBridge.getCapabilityMemory('study', 5);
      if (saved.length > 0) {
        setTopics(saved.map(m => ({ id: m.id, title: m.content?.substring(0, 80) || '', progress: m.importance || 50, lastStudied: m.created_at || m.timestamp })));
        setLastTopic(saved[0].content?.substring(0, 80) || '');
      }
    } catch (e) {}
  };

  const addTopic = async () => {
    if (!currentTopic.trim()) return;
    const newTopic: StudyTopic = { id: Date.now().toString(), title: currentTopic.trim(), progress: 0, lastStudied: new Date().toISOString() };
    setTopics(prev => [newTopic, ...prev]);
    try {
      await unifiedBrainBridge.storeMemory('learning', currentTopic.trim(), 60, 'focused', ['study']);
    } catch (e) {}
    setCurrentTopic('');
    
    economyEngine.rewardStudySession();
    
    EventBus.emit('STUDY_TOPIC_ADDED', { topic: newTopic });
  };

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(async () => {
      try {
        const twinState = await unifiedBrainBridge.getTwinState();
        const emotion = twinState?.twin_emotional_state?.current_emotion || 'neutral';
        if (emotion === 'focused' || emotion === 'curious') {
          EventBus.emit('TWIN_SPEAK', { phrase: rtl.isRTL ? 'هل نكمل ما بدأناه؟' : 'Shall we continue where we left off?', tone: 'gentle' });
        }
      } catch (e) {}
    }, 5000);
    return () => clearTimeout(timer);
  }, [active]);

  const handleDeactivate = () => {
    EventBus.emit('CAPABILITY_DEACTIVATED', { capability: 'study', timestamp: Date.now() });
    capabilityResolver.deactivate();
  };

  if (!active) return null;

  return (
    <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(300)} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconWrapLarge, { backgroundColor: '#3B82F620' }]}>
            <BookOpen size={24} stroke=colors.accent />
          </View>
          <View>
            <Text style={styles.headerTitle}>Study World</Text>
            <Text style={styles.headerSubtitle}>{rtl.isRTL ? 'عالم الدراسة' : 'Study World'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={handleDeactivate}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      {lastTopic && (
        <View style={styles.lastTopicCard}>
          <Brain size={16} stroke=colors.accent />
          <Text style={styles.lastTopicText}>{rtl.isRTL ? 'آخر مرة:' : 'Last time:'} {lastTopic}</Text>
        </View>
      )}

      <View style={styles.toolCard}>
        <View style={styles.toolHeader}>
          <Target size={16} stroke=colors.accent />
          <Text style={styles.toolLabel}>{rtl.isRTL ? 'ماذا تريد أن تدرس؟' : 'What do you want to study?'}</Text>
        </View>
        <View style={styles.addRow}>
          <TextInput style={[styles.addInput, { textAlign: rtl.textAlign }]} value={currentTopic} onChangeText={setCurrentTopic} placeholder={rtl.isRTL ? 'مثلاً: فيزياء الكم' : 'e.g., Quantum Physics'} placeholderTextColor=colors.textSecondary onSubmitEditing={addTopic} />
          <TouchableOpacity style={styles.addBtn} onPress={addTopic}>
            <ChevronRight size={18} stroke="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {topics.length > 0 && (
        <View style={styles.topicsList}>
          {topics.map(topic => (
            <View key={topic.id} style={styles.topicItem}>
              <View style={styles.topicInfo}>
                <Clock size={14} stroke=colors.textSecondary />
                <Text style={styles.topicTitle}>{topic.title}</Text>
              </View>
              <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${topic.progress}%` }]} /></View>
            </View>
          ))}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: SPACE.lg, paddingVertical: SPACE.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACE.md },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  iconWrapLarge: { width: 48, height: 48, borderRadius: RADIUS.sm, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: colors.text, fontSize: 20, fontWeight: '700' },
  headerSubtitle: { color: colors.textSecondary, fontSize: 12 },
  closeBtn: { padding: 8, borderRadius: RADIUS.sm, backgroundColor: 'rgba(255,255,255,0.05)' },
  closeText: { color: colors.textSecondary, fontSize: 16, fontWeight: '700' },
  lastTopicCard: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, backgroundColor: 'rgba(59,130,246,0.08)', borderRadius: RADIUS.sm, padding: SPACE.sm, marginBottom: SPACE.md },
  lastTopicText: { color: colors.accent, fontSize: 13, flex: 1 },
  toolCard: { backgroundColor: colors.card, borderRadius: RADIUS.card, borderWidth: 1, borderColor: colors.border, padding: SPACE.md },
  toolHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginBottom: SPACE.sm },
  toolLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  addRow: { flexDirection: 'row', gap: SPACE.sm },
  addInput: { flex: 1, backgroundColor: colors.inputBg, borderRadius: RADIUS.sm, padding: 12, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border },
  addBtn: { width: 44, height: 44, borderRadius: RADIUS.sm, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center' },
  topicsList: { gap: SPACE.sm, marginTop: SPACE.md },
  topicItem: { backgroundColor: 'rgba(26,18,38,0.8)', borderRadius: RADIUS.sm, padding: SPACE.md },
  topicInfo: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginBottom: 8 },
  topicTitle: { color: colors.text, fontSize: 14, fontWeight: '500' },
  progressTrack: { height: 3, backgroundColor: colors.border, borderRadius: 2 },
  progressFill: { height: 3, backgroundColor: colors.accent, borderRadius: 2 },
});
