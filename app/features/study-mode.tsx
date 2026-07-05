import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, Animated, RefreshControl,
  Image, Platform, Alert, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../../store/useTwinStore';
import { useTheme } from '../../utils/theme';
import { router } from 'expo-router';
import { apiPost, apiGet } from '../../lib/httpClient';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft, Brain, Sparkles, Zap, Lightbulb, Target, BookOpen,
  RefreshCw, Camera, Image as ImageIcon, X, Check, Save, MessageSquare,
  ChevronDown, TrendingUp, Layers, Clipboard, Copy, Trophy,
  Clock, BarChart3, Smile, Frown, Meh, Activity, Award,
  ChevronRight, Play, Star, Eye,
} from 'lucide-react-native';

const { width: SCREEN_W } = Dimensions.get('window');

let Haptics: any = null;
try { Haptics = require('expo-haptics'); } catch(e) {}
const hapticLight = () => { try { Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light); } catch(e) {} };
const hapticMedium = () => { try { Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Medium); } catch(e) {} };

const T = {
  ar: {
    title: 'أثينا',
    subtitle: 'معلمك الرقمي الحي',
    greeting: 'أهلاً بك، أنا أثينا',
    readyQuestion: 'ماذا تريد أن تتعلم اليوم؟',
    placeholder: 'مثلاً: قانون الجاذبية، التفاضل...',
    takePhoto: 'صورة',
    pickImage: 'معرض',
    start: 'ابدأ التعلم',
    loading: 'أثينا تفكر...',
    explanation: 'الشرح المتكيف',
    fragments: 'أجزاء الدرس',
    analogy: 'تشبيه من حياتك',
    emotionNote: 'ملاحظة شخصية',
    ladderHint: 'تلميح للتقدم',
    questions: 'تحدي الفهم',
    yourAnswer: 'اكتب إجابتك...',
    submit: 'إرسال',
    correct: 'ممتاز! 🎉',
    incorrect: 'حاول مرة أخرى 💪',
    discuss: 'ناقش مع توأمك',
    newSession: 'جلسة جديدة',
    sessionSummary: 'ملخص الجلسة',
    accuracy: 'الدقة',
    depth: 'العمق',
    mastery: 'الإتقان',
    nextReview: 'المراجعة القادمة',
    learningPath: 'مسار التعلم',
    studentState: 'حالتك',
    focus: 'التركيز',
    progress: 'التقدم',
    emptyState: 'ابدأ بكتابة مفهوم للدراسة',
    error: 'فشل التحليل - حاول مجدداً',
  },
  en: {
    title: 'ATHENA',
    subtitle: 'Your Living Digital Teacher',
    greeting: 'Welcome, I am ATHENA',
    readyQuestion: 'What do you want to learn today?',
    placeholder: 'e.g., Gravity, Calculus...',
    takePhoto: 'Camera',
    pickImage: 'Gallery',
    start: 'Start Learning',
    loading: 'ATHENA is thinking...',
    explanation: 'Adaptive Explanation',
    fragments: 'Lesson Fragments',
    analogy: 'Real-life Analogy',
    emotionNote: 'Personal Note',
    ladderHint: 'Next Step Hint',
    questions: 'Bloom Challenge',
    yourAnswer: 'Write your answer...',
    submit: 'Submit',
    correct: 'Excellent! 🎉',
    incorrect: 'Try again 💪',
    discuss: 'Discuss with Twin',
    newSession: 'New Session',
    sessionSummary: 'Session Summary',
    accuracy: 'Accuracy',
    depth: 'Depth',
    mastery: 'Mastery',
    nextReview: 'Next Review',
    learningPath: 'Learning Path',
    studentState: 'Your State',
    focus: 'Focus',
    progress: 'Progress',
    emptyState: 'Enter a concept to start learning',
    error: 'Analysis failed - try again',
  },
};

// ============================================================
// مكونات الواجهة
// ============================================================

/** شريط الحالة العلوي */
const StudentDashboard = React.memo(({ data, colors, isAr, t }: { data: any; colors: any; isAr: boolean; t: any }) => (
  <View style={[stDash.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={stDash.row}>
      <View style={stDash.item}>
        <Smile size={20} stroke={data?.student_emotion === 'joy' ? '#10B981' : '#F59E0B'} />
        <Text style={[stDash.label, { color: colors.subtext }]}>{t.studentState}</Text>
        <Text style={[stDash.value, { color: colors.text }]}>{data?.student_emotion || '—'}</Text>
      </View>
      <View style={stDash.item}>
        <Target size={20} stroke={colors.accent} />
        <Text style={[stDash.label, { color: colors.subtext }]}>{t.focus}</Text>
        <Text style={[stDash.value, { color: colors.text }]}>{data?.accuracy || '—'}</Text>
      </View>
      <View style={stDash.item}>
        <Activity size={20} stroke="#8B5CF6" />
        <Text style={[stDash.label, { color: colors.subtext }]}>{t.progress}</Text>
        <Text style={[stDash.value, { color: colors.text }]}>{data?.depth || 0}/6</Text>
      </View>
    </View>
  </View>
));

const stDash = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-around' },
  item: { alignItems: 'center', gap: 4 },
  label: { fontSize: 11, fontWeight: '600' },
  value: { fontSize: 15, fontWeight: '700' },
});

/** المسار المعرفي */
const KnowledgeGraph = React.memo(({ path, mastered, colors, isAr, t }: { path: string[]; mastered: string[]; colors: any; isAr: boolean; t: any }) => {
  if (!path || path.length === 0) return null;
  return (
    <View style={[stKG.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={stKG.header}>
        <Layers size={18} stroke={colors.accent} />
        <Text style={[stKG.title, { color: colors.text }]}>{t.learningPath}</Text>
      </View>
      <View style={stKG.path}>
        {path.map((item, i) => {
          const isMastered = mastered.includes(item);
          const isCurrent = i === path.length - 1;
          return (
            <View key={i} style={stKG.node}>
              <View style={[stKG.dot, { backgroundColor: isMastered ? '#10B981' : isCurrent ? colors.accent : '#6B7280' }]} />
              <Text style={[stKG.nodeText, { color: isMastered ? '#10B981' : isCurrent ? colors.accent : colors.subtext }]}>
                {isMastered ? '✓ ' : isCurrent ? '● ' : '○ '}{item}
              </Text>
              {i < path.length - 1 && <View style={[stKG.line, { backgroundColor: colors.border }]} />}
            </View>
          );
        })}
      </View>
    </View>
  );
});

const stKG = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '700' },
  path: { paddingLeft: 8 },
  node: { marginBottom: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, marginBottom: 2 },
  nodeText: { fontSize: 13, fontWeight: '600', marginLeft: 6 },
  line: { width: 1, height: 12, marginLeft: 4 },
});

/** شرح متكيف */
const AdaptiveExplanation = React.memo(({ explanation, colors, isAr, t }: { explanation: any; colors: any; isAr: boolean; t: any }) => (
  <View style={[stEx.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={stEx.header}>
      <Lightbulb size={18} stroke={colors.warning} />
      <Text style={[stEx.title, { color: colors.text }]}>{t.explanation}</Text>
    </View>
    <Text style={[stEx.body, { color: colors.subtext }]}>{explanation?.simplified}</Text>
    {explanation?.analogy && (
      <View style={[stEx.subCard, { backgroundColor: colors.accentLight }]}>
        <Zap size={14} stroke={colors.warning} />
        <Text style={[stEx.subText, { color: colors.warning }]}>{t.analogy}: {explanation.analogy}</Text>
      </View>
    )}
    {explanation?.fragments && explanation.fragments.length > 0 && (
      <View style={stEx.fragments}>
        <Text style={[stEx.fragTitle, { color: colors.text }]}>{t.fragments}</Text>
        {explanation.fragments.map((f: string, i: number) => (
          <Text key={i} style={[stEx.fragItem, { color: colors.subtext }]}>• {f}</Text>
        ))}
      </View>
    )}
    {explanation?.emotion_note && (
      <View style={[stEx.emotionNote, { backgroundColor: '#10B98115' }]}>
        <Eye size={14} stroke="#10B981" />
        <Text style={[stEx.emotionText, { color: '#10B981' }]}>{explanation.emotion_note}</Text>
      </View>
    )}
    {explanation?.ladder_hint && (
      <View style={[stEx.ladder, { backgroundColor: '#F59E0B15' }]}>
        <ChevronRight size={14} stroke="#F59E0B" />
        <Text style={[stEx.ladderText, { color: '#F59E0B' }]}>{t.ladderHint}: {explanation.ladder_hint}</Text>
      </View>
    )}
  </View>
));

const stEx = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  title: { fontSize: 16, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 26, marginBottom: 12 },
  subCard: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 12, marginBottom: 10 },
  subText: { flex: 1, fontSize: 13, fontWeight: '600' },
  fragments: { marginBottom: 10 },
  fragTitle: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  fragItem: { fontSize: 13, lineHeight: 22, marginBottom: 4 },
  emotionNote: { flexDirection: 'row', gap: 8, padding: 10, borderRadius: 12, marginBottom: 8 },
  emotionText: { flex: 1, fontSize: 13, fontWeight: '600' },
  ladder: { flexDirection: 'row', gap: 8, padding: 10, borderRadius: 12 },
  ladderText: { flex: 1, fontSize: 13, fontWeight: '600' },
});

/** تحدي بلوم */
const BloomChallenge = React.memo(({ bloomLevel, question, onAnswer, userAnswer, setUserAnswer, loading, answerResult, colors, isAr, t }: any) => (
  <View style={[stBl.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={stBl.header}>
      <Award size={18} stroke="#8B5CF6" />
      <Text style={[stBl.title, { color: colors.text }]}>{t.questions}</Text>
      <View style={[stBl.levelBadge, { backgroundColor: '#8B5CF620' }]}>
        <Text style={[stBl.levelText, { color: '#8B5CF6' }]}>Lv.{bloomLevel || 1}</Text>
      </View>
    </View>
    {question ? (
      <>
        <Text style={[stBl.question, { color: colors.text }]}>{question}</Text>
        <TextInput
          style={[stBl.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
          placeholder={t.yourAnswer}
          placeholderTextColor={colors.subtext}
          value={userAnswer}
          onChangeText={setUserAnswer}
          multiline
          textAlignVertical="top"
        />
        <TouchableOpacity style={[stBl.submitBtn, { backgroundColor: colors.accent }]} onPress={onAnswer} disabled={loading || !userAnswer.trim()}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={stBl.submitText}>{t.submit}</Text>}
        </TouchableOpacity>
        {answerResult && (
          <View style={[stBl.result, { backgroundColor: answerResult.is_correct ? '#10B98115' : '#EF444415', borderColor: answerResult.is_correct ? '#10B981' : '#EF4444' }]}>
            <Text style={[stBl.resultText, { color: answerResult.is_correct ? '#10B981' : '#EF4444' }]}>
              {answerResult.is_correct ? t.correct : t.incorrect}
            </Text>
            {answerResult.feedback && <Text style={[stBl.feedback, { color: colors.subtext }]}>{answerResult.feedback}</Text>}
          </View>
        )}
      </>
    ) : (
      <TouchableOpacity style={[stBl.startBtn, { backgroundColor: colors.accentLight }]} onPress={onAnswer}>
        <Play size={18} stroke={colors.accent} />
        <Text style={[stBl.startText, { color: colors.accent }]}>{t.questions}</Text>
      </TouchableOpacity>
    )}
  </View>
));

const stBl = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '700', flex: 1 },
  levelBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  levelText: { fontSize: 11, fontWeight: '700' },
  question: { fontSize: 17, fontWeight: '600', marginBottom: 16, lineHeight: 26 },
  input: { borderRadius: 14, padding: 14, fontSize: 15, borderWidth: 1, minHeight: 80, marginBottom: 12 },
  submitBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  submitText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  result: { borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 12 },
  resultText: { fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  feedback: { fontSize: 13, textAlign: 'center' },
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16 },
  startText: { fontSize: 15, fontWeight: '700' },
});

/** ملخص الجلسة */
const SessionSummary = React.memo(({ summary, colors, isAr, t }: { summary: any; colors: any; isAr: boolean; t: any }) => (
  <View style={[stSum.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={stSum.header}>
      <BarChart3 size={18} stroke={colors.accent} />
      <Text style={[stSum.title, { color: colors.text }]}>{t.sessionSummary}</Text>
    </View>
    <View style={stSum.grid}>
      <View style={stSum.item}><Text style={[stSum.label, { color: colors.subtext }]}>{t.accuracy}</Text><Text style={[stSum.value, { color: '#10B981' }]}>{summary?.accuracy || '—'}</Text></View>
      <View style={stSum.item}><Text style={[stSum.label, { color: colors.subtext }]}>{t.depth}</Text><Text style={[stSum.value, { color: colors.accent }]}>{summary?.depth_reached || '—'}</Text></View>
      <View style={stSum.item}><Text style={[stSum.label, { color: colors.subtext }]}>{t.mastery}</Text><Text style={[stSum.value, { color: '#8B5CF6' }]}>{summary?.mastery || '—'}</Text></View>
      <View style={stSum.item}><Text style={[stSum.label, { color: colors.subtext }]}>{t.nextReview}</Text><Text style={[stSum.value, { color: '#F59E0B' }]}>{summary?.next_review || '—'}</Text></View>
    </View>
  </View>
));

const stSum = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  title: { fontSize: 16, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  item: { width: (SCREEN_W - 64) / 2 - 6, alignItems: 'center', padding: 12, borderRadius: 14, backgroundColor: '#7C3AED08' },
  label: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
  value: { fontSize: 20, fontWeight: '800' },
});

// ============================================================
// المكون الرئيسي — ATHENA Study Mode
// ============================================================
export default function StudyMode() {
  const insets = useSafeAreaInsets();
  const { lang, userId, twinName, hasHydrated } = useTwinStore();
  const isAr = lang === 'ar';
  const isDark = useTheme().isDark;
  const t = T[lang] || T['ar'];

  const [concept, setConcept] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [answerResult, setAnswerResult] = useState<any>(null);
  const [sessionSummary, setSessionSummary] = useState<any>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const colors = useMemo(() => ({
    bg: isDark ? '#0A0014' : '#FAFAF8',
    card: isDark ? '#1A1226' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#2D2D2D',
    subtext: isDark ? '#A78BFA' : '#6B7280',
    accent: '#3B82F6',
    accentLight: '#3B82F620',
    border: isDark ? '#2D1B4D' : '#E8E8E3',
    inputBg: isDark ? '#161122' : '#FDFDF9',
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
  }), [isDark]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const handleTakePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return Alert.alert(isAr ? 'صلاحية' : 'Permission', isAr ? 'يحتاج الكاميرا' : 'Camera needed');
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const handleStartSession = useCallback(async () => {
    if (!concept.trim() && !imageUri) return;
    setLoading(true);
    setSessionActive(true);
    setAnswerResult(null);
    setSessionSummary(null);
    try {
      const result = await apiPost('/api/study/start', {
        user_id: userId,
        concept: concept.trim() || 'تحليل الصورة المرفقة',
        age_group: 'young_adult',
        language: lang,
      });
      setSessionData(result);
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    } catch (e) {
      setSessionData({ explanation: { simplified: t.error } });
    } finally { setLoading(false); }
  }, [concept, imageUri, userId, lang]);

  const handleAskQuestion = async () => {
    setLoading(true);
    try {
      const result = await apiPost('/api/study/questions', {
        concept: sessionData?.concept || concept,
        bloom_level: sessionData?.current_depth || 1,
        age_group: 'young_adult',
        language: lang,
        count: 1,
        user_id: userId,
      });
      setCurrentQuestion(result?.questions?.[0]?.question || 'ما هو فهمك للمفهوم؟');
    } catch (e) {} finally { setLoading(false); }
  };

  const handleAnswer = async () => {
    if (!userAnswer.trim()) return;
    setLoading(true);
    try {
      const result = await apiPost('/api/study/answer', { user_id: userId, answer: userAnswer.trim(), lang });
      setAnswerResult(result);
      setUserAnswer('');
      if (result?.next_action === 'deepen') setCurrentQuestion('');
    } catch (e) {} finally { setLoading(false); }
  };

  const handleEndSession = async () => {
    try {
      const result = await apiPost('/api/study/end', { user_id: userId });
      setSessionSummary(result);
    } catch (e) {}
    setSessionActive(false);
    setCurrentQuestion('');
    setAnswerResult(null);
  };

  const handleDiscuss = () => {
    useTwinStore.getState().loadProjectContext({
      type: 'study',
      title: sessionData?.concept || concept,
      preview: sessionData?.explanation?.simplified?.substring(0, 120) || '',
      data: { concept, explanation: sessionData?.explanation },
    });
    router.push('/chat');
  };

  if (!hasHydrated) {
    return (
      <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ color: colors.subtext, marginTop: 12 }}>{t.loading}</Text>
      </View>
    );
  }

  return (
    <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      <View style={[st.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} stroke={colors.text} /></TouchableOpacity>
        <View style={st.headerCenter}>
          <Brain size={22} stroke={colors.accent} />
          <Text style={[st.headerTitle, { color: colors.text }]}>{t.title}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={st.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {!sessionActive && (
          <View style={st.idleContainer}>
            <Text style={[st.greeting, { color: colors.text }]}>{t.greeting}</Text>
            <Text style={[st.readyQuestion, { color: colors.subtext }]}>{t.readyQuestion}</Text>
            <View style={[st.inputCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                style={[st.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                placeholder={t.placeholder}
                placeholderTextColor={colors.subtext}
                value={concept}
                onChangeText={setConcept}
                multiline numberOfLines={3}
                textAlignVertical="top"
              />
              {imageUri && (
                <View style={st.imagePreview}>
                  <Image source={{ uri: imageUri }} style={st.image} />
                  <TouchableOpacity onPress={() => setImageUri(null)} style={st.removeImage}><X size={18} stroke="#FFF" /></TouchableOpacity>
                </View>
              )}
              <View style={st.imageActions}>
                <TouchableOpacity style={[st.imageBtn, { borderColor: colors.border }]} onPress={handleTakePhoto}><Camera size={16} stroke={colors.subtext} /><Text style={[st.imageBtnText, { color: colors.subtext }]}>{t.takePhoto}</Text></TouchableOpacity>
                <TouchableOpacity style={[st.imageBtn, { borderColor: colors.border }]} onPress={handlePickImage}><ImageIcon size={16} stroke={colors.subtext} /><Text style={[st.imageBtnText, { color: colors.subtext }]}>{t.pickImage}</Text></TouchableOpacity>
              </View>
              <TouchableOpacity style={[st.startBtn, { backgroundColor: colors.accent, opacity: (concept.trim() || imageUri) ? 1 : 0.6 }]} onPress={handleStartSession} disabled={loading || (!concept.trim() && !imageUri)}>
                {loading ? <ActivityIndicator color="#FFF" /> : <><Sparkles size={20} stroke="#FFF" /><Text style={st.startBtnText}>{t.start}</Text></>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {sessionActive && sessionData && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <StudentDashboard data={{ ...sessionData, accuracy: answerResult?.accuracy, depth: sessionData?.current_depth }} colors={colors} isAr={isAr} t={t} />
            <KnowledgeGraph path={sessionData?.learning_path || []} mastered={[]} colors={colors} isAr={isAr} t={t} />
            <AdaptiveExplanation explanation={sessionData?.explanation} colors={colors} isAr={isAr} t={t} />
            <BloomChallenge
              bloomLevel={sessionData?.current_depth || 1}
              question={currentQuestion}
              onAnswer={currentQuestion ? handleAnswer : handleAskQuestion}
              userAnswer={userAnswer}
              setUserAnswer={setUserAnswer}
              loading={loading}
              answerResult={answerResult}
              colors={colors}
              isAr={isAr}
              t={t}
            />
            {sessionSummary && <SessionSummary summary={sessionSummary} colors={colors} isAr={isAr} t={t} />}
            <View style={st.toolbar}>
              <TouchableOpacity onPress={handleDiscuss} style={st.discussBtn}><MessageSquare size={16} stroke="#7C3AED" /><Text style={st.discussBtnText}>{t.discuss}</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleEndSession} style={[st.endBtn, { borderColor: colors.danger }]}><Text style={[st.endBtnText, { color: colors.danger }]}>{t.newSession}</Text></TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 50 },
  greeting: { fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  readyQuestion: { fontSize: 15, textAlign: 'center', marginBottom: 24 },
  idleContainer: { alignItems: 'center' },
  inputCard: { borderRadius: 24, padding: 20, borderWidth: 1, width: '100%', alignItems: 'center' },
  input: { width: '100%', borderRadius: 16, padding: 16, fontSize: 15, borderWidth: 1, marginBottom: 16 },
  imagePreview: { position: 'relative', marginBottom: 12 },
  image: { width: 200, height: 150, borderRadius: 16 },
  removeImage: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 4 },
  imageActions: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  imageBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  imageBtnText: { fontSize: 13, fontWeight: '600' },
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, width: '100%', gap: 8 },
  startBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 },
  discussBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#7C3AED15', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  discussBtnText: { fontSize: 13, fontWeight: '700', color: '#7C3AED' },
  endBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, borderWidth: 1 },
  endBtnText: { fontSize: 13, fontWeight: '700' },
});
