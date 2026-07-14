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
import { Image as ImageIcon, Palette, Wand2, Search, Camera, Clock, Sparkles, ChevronRight, Brain } from 'lucide-react-native';

interface ImageSession {
  id: string;
  title: string;
  type: string;
  content: string;
  timestamp: string;
}

const IMAGE_ACTIONS = [
  { type: 'generate', icon: Wand2, color: '#EC4899', label_ar: 'توليد صورة', label_en: 'Generate Image', placeholder_ar: 'صف الصورة التي تريدها...', placeholder_en: 'Describe the image you want...' },
  { type: 'enhance_prompt', icon: Palette, color: '#A855F7', label_ar: 'تحسين الوصف', label_en: 'Enhance Prompt', placeholder_ar: 'ما موضوع الصورة؟', placeholder_en: 'What is the image topic?' },
  { type: 'analyze', icon: Search, color: '#3B82F6', label_ar: 'تحليل صورة', label_en: 'Analyze Image', placeholder_ar: 'الصق الصورة أو وصفها...', placeholder_en: 'Paste the image or describe it...' },
  { type: 'edit', icon: Camera, color: '#F59E0B', label_ar: 'تعديل صورة', label_en: 'Edit Image', placeholder_ar: 'ما التعديل المطلوب؟', placeholder_en: 'What edit do you want?' },
];

export default function AIImageCapability() {
  const rtl = useRTL();
  const [active, setActive] = useState(false);
  const [inputText, setInputText] = useState('');
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ImageSession[]>([]);
  const [lastPrompt, setLastPrompt] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState('');

  useEffect(() => {
    const unsub1 = EventBus.on('CAPABILITY_ACTIVATED', (payload: any) => { if (payload?.capability === 'ai_image') { setActive(true); loadImageContext(); } });
    const unsub2 = EventBus.on('CAPABILITY_DEACTIVATED', () => setActive(false));
    const unsub3 = EventBus.on('WORKSPACE_CHANGE_REQUESTED', (payload: any) => { if (payload?.workspace === 'ai_image') { setActive(true); loadImageContext(); } else if (payload?.workspace === null && active) setActive(false); });
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [active]);

  const loadImageContext = async () => {
    try {
      const saved = await memoryEngine.getCapabilityMemory('ai_image', 5);
      if (saved.length > 0) {
        setSessions(saved.map(m => ({ id: m.id, title: m.content.substring(0, 60), type: m.relatedTo[0] || 'generate', content: m.content, timestamp: m.timestamp })));
        setLastPrompt(saved[0].content.substring(0, 80));
      }
    } catch (e) {}
  };

  const handleQuickAction = async (actionType: string) => {
    if (!inputText.trim() || isProcessing) return;
    setActiveAction(actionType);
    setIsProcessing(true);
    setLastResponse('');

    try {
      const enhancedMessage = `${rtl.isRTL ? 'طلب صورة:' : 'Image request:'} ${actionType}: ${inputText.trim()}`;
      const result = await sendMessage(enhancedMessage, [], rtl.isRTL ? 'ar' : 'en');
      const reply = result?.reply || (rtl.isRTL ? 'تمت المعالجة.' : 'Processed.');

      const newSession: ImageSession = { id: Date.now().toString(), title: inputText.trim().substring(0, 60), type: actionType, content: reply, timestamp: new Date().toISOString() };
      setSessions(prev => [newSession, ...prev.slice(0, 9)]);
      setLastResponse(reply);

      try {
        await memoryEngine.store('learning', inputText.trim(), 60, 'inspired', ['ai_image', actionType]);
        await memoryEngine.storeLongTerm('ai_image_prompt', inputText.trim(), 65, 'ai_image');
      } catch (e) {}

      // 🆕 مكافأة Soul Points
      economyEngine.addPoints('study_session', 10, 'جلسة AI Image Lab');
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
          rtl.isRTL ? 'أريد إنشاء صورة' : 'I want to create an image',
          'inspired'
        );
        if (decision.action === 'check_in') {
          EventBus.emit('TWIN_SPEAK', { phrase: rtl.isRTL ? 'هل تريد إنشاء صورة جديدة؟' : 'Do you want to create a new image?', tone: 'gentle' });
        }
      } catch (e) {}
    }, 8000);
    return () => clearTimeout(timer);
  }, [active]);

  const handleDeactivate = () => {
    EventBus.emit('CAPABILITY_DEACTIVATED', { capability: 'ai_image', timestamp: Date.now() });
    capabilityResolver.deactivate();
  };

  if (!active) return null;

  return (
    <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(300)} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconWrapLarge, { backgroundColor: '#EC489920' }]}>
            <ImageIcon size={24} stroke="#EC4899" />
          </View>
          <View>
            <Text style={styles.headerTitle}>AI Image Lab</Text>
            <Text style={styles.headerSubtitle}>{rtl.isRTL ? 'معمل الصور' : 'Image Lab'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={handleDeactivate}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {lastPrompt && (
          <View style={styles.lastPromptCard}>
            <Brain size={16} stroke="#EC4899" />
            <Text style={styles.lastPromptText}>{rtl.isRTL ? 'آخر وصف:' : 'Last prompt:'} {lastPrompt}</Text>
          </View>
        )}

        <View style={styles.canvasCard}>
          <View style={styles.canvasHeader}>
            <Wand2 size={16} stroke="#EC4899" />
            <Text style={styles.canvasLabel}>{rtl.isRTL ? 'ماذا تريد أن تصنع؟' : 'What do you want to create?'}</Text>
          </View>
          <TextInput
            style={[styles.canvasInput, { textAlign: rtl.textAlign }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder={rtl.isRTL ? 'صف الصورة التي تتخيلها...' : 'Describe the image you imagine...'}
            placeholderTextColor="#4A5568"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <View style={styles.actionsGrid}>
            {IMAGE_ACTIONS.map(action => {
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

          {isProcessing && <Text style={styles.processingText}>{rtl.isRTL ? 'جاري التوليد...' : 'Generating...'}</Text>}

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
                  <ImageIcon size={14} stroke="#EC4899" />
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
  lastPromptCard: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, backgroundColor: 'rgba(236,72,153,0.08)', borderRadius: RADIUS.sm, padding: SPACE.sm, marginBottom: SPACE.md },
  lastPromptText: { color: '#EC4899', fontSize: 13, flex: 1 },
  canvasCard: { backgroundColor: 'rgba(26, 18, 38, 0.95)', borderRadius: RADIUS.card, borderWidth: 1, borderColor: 'rgba(236, 72, 153, 0.25)', padding: SPACE.md },
  canvasHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginBottom: SPACE.sm },
  canvasLabel: { color: '#EC4899', fontSize: 14, fontWeight: '600' },
  canvasInput: { backgroundColor: '#161122', borderRadius: RADIUS.sm, padding: 14, fontSize: 15, color: '#FFFFFF', borderWidth: 1, borderColor: '#2D1B4D', minHeight: 100 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.sm, marginTop: SPACE.md },
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
