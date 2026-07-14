import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { EventBus } from '../core/EventBus';
import { memoryEngine } from '../../engine/memory/MemoryEngine';
import { capabilityResolver } from '../coordinators/CapabilityResolver';
import { consciousnessCoordinator } from '../coordinators/ConsciousnessCoordinator';
import { economyEngine } from '../services/EconomyEngine';
import { useRTL } from '../../lib/useRTL';
import { SPACE, RADIUS } from '../../src/design/tokens/spacing';
import { BookOpen, Target, Brain, ChevronRight, Clock } from 'lucide-react-native';

interface StudyTopic {
  id: string;
  title: string;
  progress: number;
  lastStudied: string;
}

export default function StudyCapability() {
  const rtl = useRTL();
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
      const saved = await memoryEngine.getCapabilityMemory('study', 5);
      if (saved.length > 0) {
        setTopics(saved.map(m => ({ id: m.id, title: m.content.substring(0, 80), progress: m.importance, lastStudied: m.timestamp })));
        setLastTopic(saved[0].content.substring(0, 80));
      }
    } catch (e) {}
  };

  const addTopic = async () => {
    if (!currentTopic.trim()) return;
    const newTopic: StudyTopic = { id: Date.now().toString(), title: currentTopic.trim(), progress: 0, lastStudied: new Date().toISOString() };
    setTopics(prev => [newTopic, ...prev]);
    try {
      await memoryEngine.store('learning', currentTopic.trim(), 60, 'focused', ['study']);
      await memoryEngine.storeLongTerm('study_topic', currentTopic.trim(), 65, 'study');
    } catch (e) {}
    setCurrentTopic('');
    
    // 🆕 مكافأة Soul Points
    economyEngine.rewardStudySession();
    
    EventBus.emit('STUDY_TOPIC_ADDED', { topic: newTopic });
  };

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(async () => {
      const decision = await consciousnessCoordinator.decide(
        rtl.isRTL ? 'أريد أن أدرس' : 'I want to study',
        'focused'
      );
      if (decision.action === 'check_in') {
        EventBus.emit('TWIN_SPEAK', { phrase: rtl.isRTL ? 'هل نكمل ما بدأناه؟' : 'Shall we continue where we left off?', tone: 'gentle' });
      }
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
            <BookOpen size={24} stroke="#3B82F6" />
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
          <Brain size={16} stroke="#3B82F6" />
          <Text style={styles.lastTopicText}>{rtl.isRTL ? 'آخر مرة:' : 'Last time:'} {lastTopic}</Text>
        </View>
      )}

      <View style={styles.toolCard}>
        <View style={styles.toolHeader}>
          <Target size={16} stroke="#3B82F6" />
          <Text style={styles.toolLabel}>{rtl.isRTL ? 'ماذا تريد أن تدرس؟' : 'What do you want to study?'}</Text>
        </View>
        <View style={styles.addRow}>
          <TextInput style={[styles.addInput, { textAlign: rtl.textAlign }]} value={currentTopic} onChangeText={setCurrentTopic} placeholder={rtl.isRTL ? 'مثلاً: فيزياء الكم' : 'e.g., Quantum Physics'} placeholderTextColor="#6B5B8A" onSubmitEditing={addTopic} />
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
                <Clock size={14} stroke="#6B5B8A" />
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
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  headerSubtitle: { color: '#6B5B8A', fontSize: 12 },
  closeBtn: { padding: 8, borderRadius: RADIUS.sm, backgroundColor: 'rgba(255,255,255,0.05)' },
  closeText: { color: '#6B5B8A', fontSize: 16, fontWeight: '700' },
  lastTopicCard: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, backgroundColor: 'rgba(59,130,246,0.08)', borderRadius: RADIUS.sm, padding: SPACE.sm, marginBottom: SPACE.md },
  lastTopicText: { color: '#3B82F6', fontSize: 13, flex: 1 },
  toolCard: { backgroundColor: 'rgba(26,18,38,0.9)', borderRadius: RADIUS.card, borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)', padding: SPACE.md },
  toolHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginBottom: SPACE.sm },
  toolLabel: { color: '#A78BFA', fontSize: 13, fontWeight: '600' },
  addRow: { flexDirection: 'row', gap: SPACE.sm },
  addInput: { flex: 1, backgroundColor: '#161122', borderRadius: RADIUS.sm, padding: 12, fontSize: 15, color: '#FFFFFF', borderWidth: 1, borderColor: '#2D1B4D' },
  addBtn: { width: 44, height: 44, borderRadius: RADIUS.sm, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' },
  topicsList: { gap: SPACE.sm, marginTop: SPACE.md },
  topicItem: { backgroundColor: 'rgba(26,18,38,0.8)', borderRadius: RADIUS.sm, padding: SPACE.md },
  topicInfo: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginBottom: 8 },
  topicTitle: { color: '#E8E0F0', fontSize: 14, fontWeight: '500' },
  progressTrack: { height: 3, backgroundColor: '#2D1B4D', borderRadius: 2 },
  progressFill: { height: 3, backgroundColor: '#3B82F6', borderRadius: 2 },
});
