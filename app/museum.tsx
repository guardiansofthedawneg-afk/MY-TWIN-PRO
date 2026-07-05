import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Animated, Image, TextInput, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore, TwinStyle, TwinGender, ReplyStyle } from '../store/useTwinStore';
import { useTheme } from '../utils/theme';
import { router } from 'expo-router';
import { apiGet } from '../lib/httpClient';
import {
  ArrowLeft, Heart, Brain, Zap, Sparkles, TrendingUp,
  Fingerprint, User, Activity, Star, Crown,
  Palette, Save, Smile, RotateCcw, Volume2, Mic,
  Wand2, CheckCircle2, Edit3,
} from 'lucide-react-native';

const T = {
  ar: {
    museumTitle: 'متحف توأمك', customizeTitle: 'تخصيص توأمك',
    loading: 'جاري تحميل متحفك...', fingerprint: 'البصمة الرقمية',
    notGenerated: 'لم تُولّد بعد', journeyStats: 'إحصائيات الرحلة',
    bond: 'الرابطة', energy: 'الطاقة', phase: 'المرحلة', traits: 'سمات',
    consciousness: 'رحلة وعيك', consciousnessMsg: 'كل محادثة مع توأمك تكشف طبقة جديدة من شخصيتك...',
    twinName: 'اسم التوأم', enterName: 'أدخل الاسم',
    genderVoice: 'الجنس والصوت', female: 'أنثى', male: 'ذكر',
    voicePersonality: 'شخصية الصوت', replyLength: 'طول الرد',
    short: 'مختصر', medium: 'متوسط', long: 'مفصل',
    personality: 'نمط الشخصية', maxTraits: '5 صفات كحد أقصى',
    saveChanges: 'حفظ التغييرات', saved: 'تم حفظ التغييرات',
    reset: 'استعادة الافتراضي', resetTitle: 'إعادة التعيين',
    resetMsg: 'هل تريد استعادة الإعدادات الافتراضية؟',
    cancel: 'إلغاء', confirmReset: 'تعيين',
    enterNameError: 'الرجاء إدخال اسم', mood: 'مزاج التوأم',
    relationship: 'العلاقة',
    phaseLabels: { introduction: 'تعارف', trust_building: 'بناء ثقة', deepening: 'تعمق', growth: 'نمو', mature: 'نضج' } as Record<string, string>,
    emotionLabels: { joy: 'فرح', sadness: 'حزن', anger: 'غضب', fear: 'قلق', love: 'حب', neutral: 'حياد' } as Record<string, string>,
    voiceLabels: { friend: 'صديق', mentor: 'مرشد', romantic: 'رومانسي', energetic: 'حيوي', calm: 'هادئ', genz: 'عصري' } as Record<string, string>,
    styleLabels: { supportive: 'داعم', coach: 'مدرب', wise: 'حكيم', fun: 'مرح', calm: 'هادئ' } as Record<string, string>,
    traitNames: { 'حنون': 'حنون', 'متفائل': 'متفائل', 'ذكي': 'ذكي', 'مخلص': 'مخلص', 'صبور': 'صبور', 'قوي': 'قوي', 'حساس': 'حساس', 'مغامر': 'مغامر', 'عملي': 'عملي', 'خجول': 'خجول' } as Record<string, string>,
  },
  en: {
    museumTitle: 'Twin Museum', customizeTitle: 'Customize Twin',
    loading: 'Loading your museum...', fingerprint: 'Digital Fingerprint',
    notGenerated: 'Not generated yet', journeyStats: 'Journey Stats',
    bond: 'Bond', energy: 'Energy', phase: 'Phase', traits: 'Traits',
    consciousness: 'Your Consciousness Journey', consciousnessMsg: 'Every conversation with your Twin reveals a new layer...',
    twinName: 'Twin Name', enterName: 'Enter name',
    genderVoice: 'Gender & Voice', female: 'Female', male: 'Male',
    voicePersonality: 'Voice Personality', replyLength: 'Reply Length',
    short: 'Short', medium: 'Medium', long: 'Long',
    personality: 'Personality Style', maxTraits: 'Max 5 traits',
    saveChanges: 'Save Changes', saved: 'Changes saved',
    reset: 'Reset', resetTitle: 'Reset',
    resetMsg: 'Reset to default settings?', cancel: 'Cancel',
    confirmReset: 'Reset', enterNameError: 'Please enter a name',
    mood: 'Twin Mood', relationship: 'Relationship',
    phaseLabels: { introduction: 'Intro', trust_building: 'Trust', deepening: 'Deepening', growth: 'Growth', mature: 'Mature' } as Record<string, string>,
    emotionLabels: { joy: 'Joy', sadness: 'Sadness', anger: 'Anger', fear: 'Fear', love: 'Love', neutral: 'Neutral' } as Record<string, string>,
    voiceLabels: { friend: 'Friend', mentor: 'Mentor', romantic: 'Romantic', energetic: 'Energetic', calm: 'Calm', genz: 'Gen Z' } as Record<string, string>,
    styleLabels: { supportive: 'Supportive', coach: 'Coach', wise: 'Wise', fun: 'Fun', calm: 'Calm' } as Record<string, string>,
    traitNames: { 'حنون': 'Affectionate', 'متفائل': 'Optimistic', 'ذكي': 'Intelligent', 'مخلص': 'Loyal', 'صبور': 'Patient', 'قوي': 'Strong', 'حساس': 'Sensitive', 'مغامر': 'Adventurous', 'عملي': 'Practical', 'خجول': 'Shy' } as Record<string, string>,
  },
};

const VOICE_PERSONALITIES = ['friend', 'mentor', 'romantic', 'energetic', 'calm', 'genz'];
const STYLES_LIST: TwinStyle[] = ['supportive', 'coach', 'wise', 'fun', 'calm'];
const REPLY_LENGTHS: ReplyStyle[] = ['short', 'medium', 'long'];
const GENDERS: TwinGender[] = ['female', 'male'];

const TRAITS_OPTIONS = [
  { ar: 'حنون', en: 'Affectionate', icon: Heart, color: '#EC4899' },
  { ar: 'متفائل', en: 'Optimistic', icon: Sparkles, color: '#F59E0B' },
  { ar: 'ذكي', en: 'Intelligent', icon: Wand2, color: '#3B82F6' },
  { ar: 'مخلص', en: 'Loyal', icon: Star, color: '#8B5CF6' },
  { ar: 'صبور', en: 'Patient', icon: Smile, color: '#10B981' },
  { ar: 'قوي', en: 'Strong', icon: User, color: '#EF4444' },
  { ar: 'حساس', en: 'Sensitive', icon: Heart, color: '#6366F1' },
  { ar: 'مغامر', en: 'Adventurous', icon: Star, color: '#F97316' },
  { ar: 'عملي', en: 'Practical', icon: CheckCircle2, color: '#14B8A6' },
  { ar: 'خجول', en: 'Shy', icon: Smile, color: '#A855F7' },
];

export default function TwinMuseum() {
  const insets = useSafeAreaInsets();
  const {
    userId, twinName, bondLevel, twinEnergy, journeyPhase,
    twinGender, twinStyle, replyStyle, twinTraits,
    setTwinName, setTwinGender, setTwinStyle, setReplyStyle, setTwinTraits,
    voiceEnabled, setVoiceEnabled, voicePersonality, lang,
    setVoicePersonality,
  } = useTwinStore();
  const theme = useTheme();
  const isAr = lang === 'ar';
  const isDark = theme.isDark;
  const t = T[lang] || T['ar'];

  const [loading, setLoading] = useState(true);
  const [fingerprint, setFingerprint] = useState<any>(null);
  const [avatar, setAvatar] = useState<any>(null);
  const [twinState, setTwinState] = useState<any>(null);
  const [economy, setEconomy] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'museum' | 'customize'>('museum');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isMounted = useRef(true);

  const [name, setName] = useState(twinName || '');
  const [gender, setGender] = useState<TwinGender>(twinGender || 'female');
  const [style, setStyle] = useState<TwinStyle>(twinStyle || 'supportive');
  const [reply, setReply] = useState<ReplyStyle>(replyStyle || 'medium');
  const [selectedTraits, setSelectedTraits] = useState<string[]>(twinTraits || []);
  const [saved, setSaved] = useState(false);
  const [voicePersonalityState, setVoicePersonalityState] = useState(voicePersonality || 'friend');

  const colors = useMemo(() => ({
    bg: isDark ? '#0A0014' : '#FAFAF8', card: isDark ? '#1A1226' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#2D2D2D', subtext: isDark ? '#A78BFA' : '#7C6B99',
    accent: '#7C3AED', accentLight: '#7C3AED20', border: isDark ? '#2D1B4D' : '#E8E8E3',
    inputBg: isDark ? '#161122' : '#FDFDF9', gold: '#F59E0B', pink: '#EC4899',
    blue: '#3B82F6', green: '#10B981', success: '#10B981',
  }), [isDark]);

  useEffect(() => {
    setName(twinName || '');
    setGender(twinGender || 'female');
    setStyle(twinStyle || 'supportive');
    setReply(replyStyle || 'medium');
    setSelectedTraits(twinTraits || []);
    setVoicePersonalityState(voicePersonality || 'friend');
  }, []);

  const loadMuseumData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [fp, av, ts, re] = await Promise.all([
        apiGet(`/api/fingerprint/get?user_id=${userId}`),
        apiGet(`/api/avatar/get?user_id=${userId}`),
        apiGet(`/api/twin/state?user_id=${userId}&lang=${lang}`).catch(() => null),
        apiGet(`/api/relationship/economy?user_id=${userId}`).catch(() => null),
      ]);
      if (!isMounted.current) return;
      setFingerprint(fp); setAvatar(av);
      if (ts) setTwinState(ts);
      if (re) setEconomy(re);
    } catch (e) {}
    finally {
      if (isMounted.current) {
        setLoading(false);
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
      }
    }
  }, [userId, lang]);

  useEffect(() => {
    isMounted.current = true;
    loadMuseumData();
    return () => { isMounted.current = false; };
  }, [loadMuseumData]);

  const handleSave = useCallback(() => {
    if (!name.trim()) { Alert.alert(isAr ? 'خطأ' : 'Error', t.enterNameError); return; }
    setTwinName(name.trim()); setTwinGender(gender); setTwinStyle(style);
    setReplyStyle(reply); setTwinTraits(selectedTraits); setVoiceEnabled(true);
    setVoicePersonality(voicePersonalityState); setSaved(true);
    Alert.alert('✅', t.saved);
  }, [name, gender, style, reply, selectedTraits, voicePersonalityState]);

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
      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
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
