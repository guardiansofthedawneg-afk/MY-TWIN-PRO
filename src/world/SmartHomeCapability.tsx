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
import { Home, Lightbulb, Thermometer, Music, Wifi, Power, Sparkles, Brain, Clock } from 'lucide-react-native';

interface SmartHomeSession {
  id: string;
  title: string;
  type: string;
  content: string;
  timestamp: string;
}

const HOME_ACTIONS = [
  { type: 'command', icon: Power, color: '#10B981', label_ar: 'أمر', label_en: 'Command', placeholder_ar: 'ماذا تريد أن تفعل؟', placeholder_en: 'What do you want to do?' },
  { type: 'status', icon: Home, color: '#3B82F6', label_ar: 'الحالة', label_en: 'Status', placeholder_ar: 'ما الذي تريد معرفته؟', placeholder_en: 'What do you want to know?' },
  { type: 'environment', icon: Thermometer, color: '#F59E0B', label_ar: 'البيئة', label_en: 'Environment', placeholder_ar: 'ما البيئة التي تريدها؟', placeholder_en: 'What environment do you want?' },
  { type: 'automation', icon: Sparkles, color: '#A855F7', label_ar: 'أتمتة', label_en: 'Automation', placeholder_ar: 'ما الذي تريد أتمتته؟', placeholder_en: 'What do you want to automate?' },
  { type: 'predictions', icon: Brain, color: '#EC4899', label_ar: 'توقعات', label_en: 'Predictions', placeholder_ar: 'ماذا تتوقع؟', placeholder_en: 'What do you predict?' },
];

export default function SmartHomeCapability() {
  const rtl = useRTL();
  const [active, setActive] = useState(false);
  const [inputText, setInputText] = useState('');
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SmartHomeSession[]>([]);
  const [lastCommand, setLastCommand] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState('');

  useEffect(() => {
    const unsub1 = EventBus.on('CAPABILITY_ACTIVATED', (payload: any) => { if (payload?.capability === 'smart_home') { setActive(true); loadHomeContext(); } });
    const unsub2 = EventBus.on('CAPABILITY_DEACTIVATED', () => setActive(false));
    const unsub3 = EventBus.on('WORKSPACE_CHANGE_REQUESTED', (payload: any) => { if (payload?.workspace === 'smart_home') { setActive(true); loadHomeContext(); } else if (payload?.workspace === null && active) setActive(false); });
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [active]);

  const loadHomeContext = async () => {
    try {
      const saved = await memoryEngine.getCapabilityMemory('smart_home', 5);
      if (saved.length > 0) {
        setSessions(saved.map(m => ({ id: m.id, title: m.content.substring(0, 60), type: m.relatedTo[0] || 'command', content: m.content, timestamp: m.timestamp })));
        setLastCommand(saved[0].content.substring(0, 80));
      }
    } catch (e) {}
  };

  const handleQuickAction = async (actionType: string) => {
    if (!inputText.trim() || isProcessing) return;
    setActiveAction(actionType);
    setIsProcessing(true);
    setLastResponse('');

    try {
      const enhancedMessage = `${rtl.isRTL ? 'طلب منزل ذكي:' : 'Smart home request:'} ${actionType}: ${inputText.trim()}`;
      const result = await sendMessage(enhancedMessage, [], rtl.isRTL ? 'ar' : 'en');
      const reply = result?.reply || (rtl.isRTL ? 'تم التنفيذ.' : 'Executed.');

      const newSession: SmartHomeSession = { id: Date.now().toString(), title: inputText.trim().substring(0, 60), type: actionType, content: reply, timestamp: new Date().toISOString() };
      setSessions(prev => [newSession, ...prev.slice(0, 9)]);
      setLastResponse(reply);

      try {
        await memoryEngine.store('decision', inputText.trim(), 50, 'neutral', ['smart_home', actionType]);
        await memoryEngine.storeLongTerm('smart_home_command', inputText.trim(), 50, 'smart_home');
      } catch (e) {}

      // 🆕 مكافأة Soul Points
      economyEngine.addPoints('study_session', 5, 'أمر منزل ذكي');
    } catch (e) {
      setLastResponse(rtl.isRTL ? 'حدث خطأ.' : 'An error occurred.');
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
          rtl.isRTL ? 'أحتاج التحكم بالمنزل' : 'I need to control my home',
          'neutral'
        );
        if (decision.action === 'check_in') {
          EventBus.emit('TWIN_SPEAK', { phrase: rtl.isRTL ? 'هل تحتاج شيئاً في المنزل؟' : 'Do you need anything at home?', tone: 'gentle' });
        }
      } catch (e) {}
    }, 8000);
    return () => clearTimeout(timer);
  }, [active]);

  const handleDeactivate = () => {
    EventBus.emit('CAPABILITY_DEACTIVATED', { capability: 'smart_home', timestamp: Date.now() });
    capabilityResolver.deactivate();
  };

  if (!active) return null;

  return (
    <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(300)} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconWrapLarge, { backgroundColor: '#10B98120' }]}>
            <Home size={24} stroke="#10B981" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Smart Home</Text>
            <Text style={styles.headerSubtitle}>{rtl.isRTL ? 'المنزل الذكي' : 'Smart Home'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={handleDeactivate}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {lastCommand && (
          <View style={styles.lastCommandCard}>
            <Brain size={16} stroke="#10B981" />
            <Text style={styles.lastCommandText}>{rtl.isRTL ? 'آخر أمر:' : 'Last command:'} {lastCommand}</Text>
          </View>
        )}

        <View style={styles.canvasCard}>
          <View style={styles.canvasHeader}>
            <Power size={16} stroke="#10B981" />
            <Text style={styles.canvasLabel}>{rtl.isRTL ? 'ماذا تريد أن تفعل في منزلك؟' : 'What do you want to do at home?'}</Text>
          </View>
          <TextInput
            style={[styles.canvasInput, { textAlign: rtl.textAlign }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder={rtl.isRTL ? 'مثلاً: شغل الإضاءة، اضبط الحرارة...' : 'e.g., Turn on lights, adjust temperature...'}
            placeholderTextColor="#4A5568"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <View style={styles.actionsGrid}>
            {HOME_ACTIONS.map(action => {
              const Icon = action.icon;
              return (
                <TouchableOpacity
                  key={action.type}
                  style={[styles.actionBtn, { borderColor: action.color + '40' }, activeAction === action.type && { backgroundColor: action.color + '15' }]}
                  onPress={() => handleQuickAction(action.type)}
                  disabled={isProcessing}
                >
                  <Icon size={16} stroke={action.color} />
                  <Text style={[styles.actionLabel, { color: action.color }]}>{rtl.isRTL ? action.label_ar : action.label_en}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {isProcessing && <Text style={styles.processingText}>{rtl.isRTL ? 'جاري التنفيذ...' : 'Executing...'}</Text>}

          {lastResponse !== '' && (
            <View style={styles.responseCard}>
              <Text style={styles.responseText} numberOfLines={10}>{lastResponse}</Text>
            </View>
          )}
        </View>

        {sessions.length > 0 && (
          <View style={styles.sessionsSection}>
            <Text style={styles.sectionTitle}>{rtl.isRTL ? 'أوامر سابقة' : 'Previous Commands'}</Text>
            {sessions.slice(0, 5).map(session => (
              <View key={session.id} style={styles.sessionItem}>
                <View style={[styles.sessionIcon, { backgroundColor: '#10B98120' }]}>
                  <Home size={14} stroke="#10B981" />
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
  lastCommandCard: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, backgroundColor: 'rgba(16,185,129,0.08)', borderRadius: RADIUS.sm, padding: SPACE.sm, marginBottom: SPACE.md },
  lastCommandText: { color: '#10B981', fontSize: 13, flex: 1 },
  canvasCard: { backgroundColor: 'rgba(26, 18, 38, 0.95)', borderRadius: RADIUS.card, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.25)', padding: SPACE.md },
  canvasHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginBottom: SPACE.sm },
  canvasLabel: { color: '#10B981', fontSize: 14, fontWeight: '600' },
  canvasInput: { backgroundColor: '#161122', borderRadius: RADIUS.sm, padding: 14, fontSize: 15, color: '#FFFFFF', borderWidth: 1, borderColor: '#2D1B4D', minHeight: 80 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.sm, marginTop: SPACE.md },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: RADIUS.sm, borderWidth: 1.5 },
  actionLabel: { fontSize: 13, fontWeight: '600' },
  processingText: { color: '#10B981', fontSize: 13, marginTop: SPACE.sm, fontStyle: 'italic' },
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
