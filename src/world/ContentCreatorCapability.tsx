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
  PenTool, Edit3, Search, TrendingUp, 
  MessageSquare, BookOpen, Camera, Calendar,
  Sparkles, ChevronRight, Brain, Clock, Filter
} from 'lucide-react-native';

interface CreatorSession {
  id: string;
  title: string;
  type: string;
  content: string;
  timestamp: string;
}

const CREATOR_CATEGORIES = [
  {
    id: 'writing', icon: PenTool, color: '#8B5CF6',
    label_ar: 'كتابة', label_en: 'Writing',
    actions: [
      { type: 'outline', label_ar: 'مخطط', label_en: 'Outline', placeholder_ar: 'عنوان المقال...', placeholder_en: 'Article title...', icon: BookOpen },
      { type: 'write', label_ar: 'كتابة', label_en: 'Write', placeholder_ar: 'ما الذي تريد كتابته؟', placeholder_en: 'What do you want to write?', icon: PenTool },
    ]
  },
  {
    id: 'editing', icon: Edit3, color: '#3B82F6',
    label_ar: 'تحرير', label_en: 'Editing',
    actions: [
      { type: 'rewrite', label_ar: 'إعادة صياغة', label_en: 'Rewrite', placeholder_ar: 'النص + التعليمات...', placeholder_en: 'Text + instructions...', icon: Edit3 },
      { type: 'compress', label_ar: 'اختصار', label_en: 'Compress', placeholder_ar: 'النص + الطول المستهدف...', placeholder_en: 'Text + target length...', icon: Edit3 },
      { type: 'expand', label_ar: 'توسيع', label_en: 'Expand', placeholder_ar: 'النص + النقاط الإضافية...', placeholder_en: 'Text + additional points...', icon: Edit3 },
      { type: 'grammar', label_ar: 'تدقيق لغوي', label_en: 'Grammar', placeholder_ar: 'النص للمراجعة...', placeholder_en: 'Text to check...', icon: Edit3 },
      { type: 'tone_shift', label_ar: 'تغيير النبرة', label_en: 'Tone Shift', placeholder_ar: 'النص + النبرة المستهدفة...', placeholder_en: 'Text + target tone...', icon: Edit3 },
    ]
  },
  {
    id: 'seo', icon: Search, color: '#10B981',
    label_ar: 'SEO', label_en: 'SEO',
    actions: [
      { type: 'seo_optimize', label_ar: 'تحسين SEO', label_en: 'Optimize', placeholder_ar: 'المحتوى + الكلمات المفتاحية...', placeholder_en: 'Content + keywords...', icon: TrendingUp },
      { type: 'keywords', label_ar: 'كلمات مفتاحية', label_en: 'Keywords', placeholder_ar: 'الموضوع...', placeholder_en: 'Topic...', icon: Search },
      { type: 'meta', label_ar: 'وصف ميتا', label_en: 'Meta Description', placeholder_ar: 'المحتوى...', placeholder_en: 'Content...', icon: Search },
    ]
  },
  {
    id: 'ads', icon: TrendingUp, color: '#F59E0B',
    label_ar: 'إعلانات', label_en: 'Ads',
    actions: [
      { type: 'ad_copy', label_ar: 'نص إعلاني', label_en: 'Ad Copy', placeholder_ar: 'المنتج + الميزات + الجمهور...', placeholder_en: 'Product + features + audience...', icon: TrendingUp },
    ]
  },
  {
    id: 'story', icon: BookOpen, color: '#EC4899',
    label_ar: 'قصص', label_en: 'Story',
    actions: [
      { type: 'character', label_ar: 'بناء شخصية', label_en: 'Build Character', placeholder_ar: 'الاسم + الدور + الصفات...', placeholder_en: 'Name + role + traits...', icon: BookOpen },
      { type: 'dialogue', label_ar: 'حوار', label_en: 'Dialogue', placeholder_ar: 'الشخصيتين + الموقف...', placeholder_en: 'Characters + situation...', icon: MessageSquare },
    ]
  },
  {
    id: 'research', icon: Brain, color: '#6366F1',
    label_ar: 'بحث', label_en: 'Research',
    actions: [
      { type: 'research', label_ar: 'بحث', label_en: 'Research', placeholder_ar: 'الموضوع...', placeholder_en: 'Topic...', icon: Brain },
      { type: 'fact_check', label_ar: 'تحقق', label_en: 'Fact Check', placeholder_ar: 'النص للتحقق...', placeholder_en: 'Text to verify...', icon: Brain },
    ]
  },
];

const QUICK_ACTIONS = [
  { type: 'calendar', icon: Calendar, color: '#14B8A6', label_ar: 'تقويم محتوى', label_en: 'Calendar', placeholder_ar: 'الموضوع + المنصة...', placeholder_en: 'Topic + platform...' },
  { type: 'critic', icon: Sparkles, color: '#F97316', label_ar: 'مراجعة ناقد', label_en: 'Critic Review', placeholder_ar: 'النص للمراجعة...', placeholder_en: 'Text to review...' },
  { type: 'repurpose', icon: Filter, color: '#A855F7', label_ar: 'إعادة توظيف', label_en: 'Repurpose', placeholder_ar: 'المحتوى + الصيغة المصدر + الهدف...', placeholder_en: 'Content + source + target format...' },
];

export default function ContentCreatorCapability() {
  const rtl = useRTL();
  const [active, setActive] = useState(false);
  const [inputText, setInputText] = useState('');
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [sessions, setSessions] = useState<CreatorSession[]>([]);
  const [relevantMemories, setRelevantMemories] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState('');
  const [lastSession, setLastSession] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('writing');

  useEffect(() => {
    const unsub1 = EventBus.on('CAPABILITY_ACTIVATED', (payload: any) => {
      if (payload?.capability === 'content_creator') { setActive(true); loadCreatorContext(); }
    });
    const unsub2 = EventBus.on('CAPABILITY_DEACTIVATED', () => setActive(false));
    const unsub3 = EventBus.on('WORKSPACE_CHANGE_REQUESTED', (payload: any) => {
      if (payload?.workspace === 'content_creator') { setActive(true); loadCreatorContext(); }
      else if (payload?.workspace === null && active) { setActive(false); }
    });
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [active]);

  const loadCreatorContext = async () => {
    try {
      const saved = await memoryEngine.getCapabilityMemory('content', 5);
      if (saved.length > 0) {
        setSessions(saved.map(m => ({ id: m.id, title: m.content.substring(0, 60), type: m.relatedTo.find(r => ['content', 'creative', 'writing'].includes(r)) || 'writing', content: m.content, timestamp: m.timestamp })));
        setLastSession(saved[0].content.substring(0, 60));
      }
    } catch (e) {}
  };

  const handleQuickAction = async (actionType: string) => {
    if (!inputText.trim() || isProcessing) return;
    setActiveAction(actionType);
    setIsProcessing(true);
    setLastResponse('');

    try {
      const enhancedMessage = `${rtl.isRTL ? 'طلب إبداعي:' : 'Creative request:'} ${actionType}: ${inputText.trim()}`;
      const result = await sendMessage(enhancedMessage, [], rtl.isRTL ? 'ar' : 'en');
      const reply = result?.reply || (rtl.isRTL ? 'تمت المعالجة.' : 'Processed.');

      const newSession: CreatorSession = { id: Date.now().toString(), title: inputText.trim().substring(0, 60), type: actionType, content: reply, timestamp: new Date().toISOString() };
      setSessions(prev => [newSession, ...prev.slice(0, 9)]);
      setLastResponse(reply);

      try {
        await memoryEngine.store('learning', inputText.trim(), 60, 'inspired', ['content', actionType]);
        await memoryEngine.storeLongTerm('creator_session', inputText.trim(), 65, 'creator');
      } catch (e) {}

      // 🆕 مكافأة Soul Points
      economyEngine.addPoints('study_session', 10, 'جلسة Creative Studio');
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
          rtl.isRTL ? 'أريد صناعة محتوى' : 'I want to create content',
          'inspired'
        );
        if (decision.action === 'check_in') {
          EventBus.emit('TWIN_SPEAK', { phrase: rtl.isRTL ? 'هل تريد صناعة محتوى جديد؟' : 'Do you want to create new content?', tone: 'gentle' });
        }
      } catch (e) {}
    }, 8000);
    return () => clearTimeout(timer);
  }, [active]);

  const handleDeactivate = () => {
    EventBus.emit('CAPABILITY_DEACTIVATED', { capability: 'content_creator', timestamp: Date.now() });
    capabilityResolver.deactivate();
  };

  if (!active) return null;

  const activeCat = CREATOR_CATEGORIES.find(c => c.id === activeCategory) || CREATOR_CATEGORIES[0];

  return (
    <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(300)} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconWrapLarge, { backgroundColor: '#8B5CF620' }]}>
            <PenTool size={24} stroke="#8B5CF6" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Creative Studio</Text>
            <Text style={styles.headerSubtitle}>
              {rtl.isRTL ? 'الاستوديو الإبداعي' : 'Creative Studio'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={handleDeactivate}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {lastSession && (
          <View style={styles.lastSessionCard}>
            <Brain size={16} stroke="#8B5CF6" />
            <Text style={styles.lastSessionText}>{rtl.isRTL ? 'آخر جلسة:' : 'Last session:'} {lastSession}</Text>
          </View>
        )}

        <View style={styles.canvasCard}>
          <View style={styles.canvasHeader}>
            <Sparkles size={16} stroke="#8B5CF6" />
            <Text style={styles.canvasLabel}>
              {rtl.isRTL ? 'ماذا تريد أن تصنع اليوم؟' : 'What do you want to create today?'}
            </Text>
          </View>
          <TextInput
            style={[styles.canvasInput, { textAlign: rtl.textAlign }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder={rtl.isRTL ? 'اكتب فكرتك، مقالك، أو نصك...' : 'Write your idea, article, or text...'}
            placeholderTextColor="#4A5568"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <View style={styles.categoriesRow}>
            {CREATOR_CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryChip, activeCategory === cat.id && { backgroundColor: cat.color + '20', borderColor: cat.color }]}
                  onPress={() => setActiveCategory(cat.id)}
                >
                  <Icon size={14} stroke={cat.color} />
                  <Text style={[styles.categoryLabel, { color: cat.color }]}>
                    {rtl.isRTL ? cat.label_ar : cat.label_en}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.actionsGrid}>
            {activeCat.actions.map(action => {
              const ActionIcon = action.icon;
              const isActive = activeAction === action.type;
              return (
                <TouchableOpacity
                  key={action.type}
                  style={[styles.actionBtn, { borderColor: activeCat.color + '40' }, isActive && { backgroundColor: activeCat.color + '15' }]}
                  onPress={() => handleQuickAction(action.type)}
                  disabled={isProcessing}
                >
                  <ActionIcon size={16} stroke={activeCat.color} />
                  <Text style={[styles.actionLabel, { color: activeCat.color }]}>
                    {rtl.isRTL ? action.label_ar : action.label_en}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.quickActionsRow}>
            {QUICK_ACTIONS.map(action => {
              const ActionIcon = action.icon;
              return (
                <TouchableOpacity
                  key={action.type}
                  style={[styles.quickActionBtn, { borderColor: action.color + '30' }]}
                  onPress={() => handleQuickAction(action.type)}
                  disabled={isProcessing}
                >
                  <ActionIcon size={15} stroke={action.color} />
                  <Text style={[styles.quickActionLabel, { color: action.color }]}>
                    {rtl.isRTL ? action.label_ar : action.label_en}
                  </Text>
                  <ChevronRight size={12} stroke={action.color} opacity={0.5} />
                </TouchableOpacity>
              );
            })}
          </View>

          {isProcessing && (
            <Text style={styles.processingText}>
              {rtl.isRTL ? 'جاري الإبداع...' : 'Creating...'}
            </Text>
          )}

          {lastResponse !== '' && (
            <View style={styles.responseCard}>
              <Text style={styles.responseText} numberOfLines={12}>{lastResponse}</Text>
            </View>
          )}
        </View>

        {sessions.length > 0 && (
          <View style={styles.sessionsSection}>
            <Text style={styles.sectionTitle}>
              {rtl.isRTL ? 'جلسات إبداعية سابقة' : 'Previous Creative Sessions'}
            </Text>
            {sessions.slice(0, 5).map(session => (
              <View key={session.id} style={styles.sessionItem}>
                <View style={[styles.sessionIcon, { backgroundColor: '#8B5CF620' }]}>
                  <PenTool size={14} stroke="#8B5CF6" />
                </View>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionTitle} numberOfLines={1}>{session.title}</Text>
                  <View style={styles.sessionMeta}>
                    <Clock size={10} stroke="#6B5B8A" />
                    <Text style={styles.sessionTime}>
                      {new Date(session.timestamp).toLocaleDateString(rtl.isRTL ? 'ar' : 'en')}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {relevantMemories.length > 0 && (
          <View style={styles.memoriesCard}>
            <View style={styles.memoriesHeader}>
              <Brain size={16} stroke="#8B5CF6" />
              <Text style={styles.memoriesTitle}>
                {rtl.isRTL ? 'تذكرت...' : 'I remember...'}
              </Text>
            </View>
            {relevantMemories.map(memory => (
              <Text key={memory.id} style={styles.memoryText} numberOfLines={2}>
                {memory.content}
              </Text>
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
  lastSessionCard: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, backgroundColor: 'rgba(139,92,246,0.08)', borderRadius: RADIUS.sm, padding: SPACE.sm, marginBottom: SPACE.md },
  lastSessionText: { color: '#8B5CF6', fontSize: 13, flex: 1 },
  canvasCard: { 
    backgroundColor: 'rgba(26, 18, 38, 0.95)', 
    borderRadius: RADIUS.card, 
    borderWidth: 1, 
    borderColor: 'rgba(139, 92, 246, 0.25)', 
    padding: SPACE.md 
  },
  canvasHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginBottom: SPACE.sm },
  canvasLabel: { color: '#8B5CF6', fontSize: 14, fontWeight: '600' },
  canvasInput: { 
    backgroundColor: '#161122', 
    borderRadius: RADIUS.sm, 
    padding: 14, 
    fontSize: 15, 
    color: '#FFFFFF', 
    borderWidth: 1, 
    borderColor: '#2D1B4D', 
    minHeight: 100,
  },
  categoriesRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: SPACE.xs, 
    marginTop: SPACE.md, 
    marginBottom: SPACE.sm 
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryLabel: { fontSize: 12, fontWeight: '600' },
  actionsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: SPACE.sm, 
    marginBottom: SPACE.sm 
  },
  actionBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    paddingHorizontal: 14, 
    paddingVertical: 10, 
    borderRadius: RADIUS.sm, 
    borderWidth: 1.5,
  },
  actionLabel: { fontSize: 13, fontWeight: '600' },
  quickActionsRow: {
    gap: SPACE.sm,
    marginBottom: SPACE.sm,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    marginBottom: 6,
  },
  quickActionLabel: { fontSize: 13, fontWeight: '600', flex: 1 },
  processingText: { color: '#8B5CF6', fontSize: 13, marginTop: SPACE.sm, fontStyle: 'italic' },
  responseCard: { 
    backgroundColor: '#161122', 
    borderRadius: RADIUS.sm, 
    padding: SPACE.md, 
    marginTop: SPACE.md, 
    borderWidth: 1, 
    borderColor: '#2D1B4D' 
  },
  responseText: { color: '#E8E0F0', fontSize: 14, lineHeight: 22 },
  sessionsSection: { marginTop: SPACE.md },
  sectionTitle: { color: '#A78BFA', fontSize: 14, fontWeight: '600', marginBottom: SPACE.sm },
  sessionItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACE.sm, 
    backgroundColor: 'rgba(26, 18, 38, 0.7)', 
    borderRadius: RADIUS.sm, 
    padding: SPACE.sm, 
    marginBottom: 6 
  },
  sessionIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  sessionInfo: { flex: 1 },
  sessionTitle: { color: '#E8E0F0', fontSize: 13, fontWeight: '500' },
  sessionMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  sessionTime: { color: '#6B5B8A', fontSize: 10 },
  memoriesCard: { 
    backgroundColor: 'rgba(139, 92, 246, 0.06)', 
    borderRadius: RADIUS.card, 
    borderWidth: 1, 
    borderColor: 'rgba(139, 92, 246, 0.2)', 
    padding: SPACE.md, 
    marginTop: SPACE.md 
  },
  memoriesHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginBottom: SPACE.sm },
  memoriesTitle: { color: '#8B5CF6', fontSize: 13, fontWeight: '600' },
  memoryText: { color: '#A78BFA', fontSize: 12, lineHeight: 18, marginTop: 4 },
});
