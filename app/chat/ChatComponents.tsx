import React, { memo, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, Animated,
} from 'react-native';
import {
  Brain, Search, Cloud, Sparkles,
  BatteryCharging, Play, Database,
} from 'lucide-react-native';

export const COLORS = {
  dark: {
    bg: '#0A0014', headerBg: '#1A1226', border: '#2D1B4D',
    text: '#FFFFFF', subtext: '#A78BFA', accent: '#A855F7',
    accentLight: '#A855F715',
    inputBg: '#161122', userBubble: '#1A1226', twinBubble: '#1A1226',
    success: '#10B981',
  },
  light: {
    bg: '#FAFAF8', headerBg: '#FFFFFF', border: '#E8E8E3',
    text: '#2D2D2D', subtext: '#7C6B99', accent: '#7C3AED',
    accentLight: '#7C3AED15',
    inputBg: '#FDFDF9', userBubble: '#FFFFFF', twinBubble: '#F9F9FB',
    success: '#10B981',
  },
};

// ================================================================
// ThinkingBar – شريط التفكير المحسّن
// ================================================================
const STAGES: Record<string, { icon: any; text_ar: string; text_en: string; color: string }> = {
  thinking:         { icon: Brain,     text_ar: 'يفكر...',              text_en: 'Thinking...',         color: '#8B5CF6' },
  memory:           { icon: Database,  text_ar: 'يسترجع الذكريات...',   text_en: 'Recalling memories...', color: '#3B82F6' },
  searching_memory: { icon: Search,    text_ar: 'يبحث في الذكريات...',  text_en: 'Searching memories...', color: '#3B82F6' },
  using_tool:       { icon: Cloud,     text_ar: 'يستخدم الأدوات...',    text_en: 'Using tools...',        color: '#10B981' },
  generating:       { icon: Sparkles,  text_ar: 'يصيغ الرد...',         text_en: 'Crafting response...',  color: '#F59E0B' },
  completed:        { icon: Sparkles,  text_ar: 'تم!',                  text_en: 'Done!',                 color: '#10B981' },
};

export const ThinkingBar = memo(({ stage, isDark, lang }: {
  stage: string; isDark: boolean; lang?: string;
}) => {
  const info     = STAGES[stage];
  const isAr     = lang === 'ar';
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dotAnims  = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    if (!info || stage === 'idle') return;

    // نبضة خفيفة
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.03, duration: 800, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,    duration: 800, useNativeDriver: true }),
    ]));
    pulse.start();

    // نقاط متتالية
    const dots = dotAnims.map((anim, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 200),
        Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.delay(400),
      ]))
    );
    dots.forEach(d => d.start());

    return () => {
      pulse.stop();
      dots.forEach(d => d.stop());
    };
  }, [stage]);

  if (!info || stage === 'idle') return null;
  const Icon = info.icon;

  return (
    <Animated.View style={[
      thSt.container,
      { backgroundColor: info.color + '15', transform: [{ scale: pulseAnim }] },
    ]}>
      <Icon size={15} stroke={info.color} />
      <Text style={[thSt.text, { color: info.color }]}>
        {isAr ? info.text_ar : info.text_en}
      </Text>
      <View style={thSt.dotsRow}>
        {dotAnims.map((anim, i) => (
          <Animated.View
            key={i}
            style={[thSt.dot, { backgroundColor: info.color, opacity: anim }]}
          />
        ))}
      </View>
    </Animated.View>
  );
});

const thSt = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, alignSelf: 'center', marginVertical: 6 },
  text:      { fontSize: 13, fontWeight: '600' },
  dotsRow:   { flexDirection: 'row', gap: 3 },
  dot:       { width: 5, height: 5, borderRadius: 3 },
});

// ================================================================
// WelcomeState
// ================================================================
export const WelcomeState = memo(({ isDark, lang, twinName, onSuggestion }: any) => {
  const c   = isDark ? COLORS.dark : COLORS.light;
  const isAr = lang === 'ar';

  const suggestions = isAr ? [
    { text: 'اليوم كان عندي يوم مليان أحداث وحابب أشاركه معاك', icon: '📅' },
    { text: 'فيه حاجة مفرحاني قوي وعايز أحكيلك عليها',           icon: '😊' },
    { text: 'أنا محتار في موضوع معين ومش عارف أتصرف',             icon: '🤔' },
    { text: 'عندي حلم كبير نفسي أوصل له',                         icon: '💭' },
  ] : [
    { text: 'I had such an eventful day and I want to tell you about it', icon: '📅' },
    { text: 'Something really made me happy and I want to share it',       icon: '😊' },
    { text: "I'm confused about something and don't know what to do",      icon: '🤔' },
    { text: 'I have a big dream I really want to achieve',                 icon: '💭' },
  ];

  return (
    <View style={wSt.container}>
      <View style={[wSt.iconWrap, { backgroundColor: c.accent + '15' }]}>
        <Sparkles size={40} stroke={c.accent} />
      </View>
      <Text style={[wSt.title, { color: c.text }]}>
        {isAr ? `مرحباً ${twinName || ''}! أنا في انتظارك` : `Hi ${twinName || ''}! I'm all ears`}
      </Text>
      <Text style={[wSt.sub, { color: c.subtext }]}>
        {isAr
          ? 'أخبرني عن يومك، أفكارك، أو أي شيء يشغل بالك'
          : 'Tell me about your day, thoughts, or anything on your mind'}
      </Text>
      <View style={wSt.suggestionsWrap}>
        {suggestions.map((s, i) => (
          <TouchableOpacity
            key={i}
            style={[wSt.chip, { backgroundColor: c.inputBg, borderColor: c.border }]}
            onPress={() => onSuggestion(s.text)}
            activeOpacity={0.7}
          >
            <Text style={wSt.chipEmoji}>{s.icon}</Text>
            <Text style={[wSt.chipText, { color: c.text }]}>{s.text}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
});

const wSt = StyleSheet.create({
  container:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 24 },
  iconWrap:       { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title:          { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  sub:            { fontSize: 15, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  suggestionsWrap:{ gap: 10, width: '100%' },
  chip:           { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 16, borderWidth: 1 },
  chipEmoji:      { fontSize: 20 },
  chipText:       { fontSize: 15, fontWeight: '500', flex: 1 },
});

// ================================================================
// EnergyModal
// ================================================================
export const EnergyModal = memo(({ visible, onClose, onWatchAd, adStatus, lang }: any) => {
  const isAr = lang === 'ar';
  const t    = (ar: string, en: string) => isAr ? ar : en;
  const ENERGY_PER_AD = 20;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={eSt.overlay}>
        <View style={eSt.card}>
          <BatteryCharging size={56} stroke="#7C3AED" style={{ alignSelf: 'center', marginBottom: 16 }} />
          <Text style={eSt.title}>{t('الطاقة منتهية', 'Out of Energy')}</Text>
          <Text style={eSt.body}>
            {t(`شاهد إعلاناً واحصل على ${ENERGY_PER_AD}% طاقة`, `Watch an ad for ${ENERGY_PER_AD}% energy`)}
          </Text>
          {adStatus?.remaining_today > 0 ? (
            <TouchableOpacity style={eSt.watchBtn} onPress={onWatchAd} activeOpacity={0.85}>
              <Play size={20} stroke="#FFF" />
              <Text style={eSt.watchText}>{t('مشاهدة إعلان', 'Watch Ad')}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={eSt.exhaustedText}>{t('استنفدت الإعلانات اليومية', 'Daily ads exhausted')}</Text>
          )}
          <TouchableOpacity onPress={onClose} style={eSt.closeBtn}>
            <Text style={eSt.closeText}>{t('إغلاق', 'Close')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

const eSt = StyleSheet.create({
  overlay:       { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 30 },
  card:          { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 30, alignItems: 'center', width: '100%', maxWidth: 350 },
  title:         { fontSize: 22, fontWeight: '800', color: '#1A1226', marginBottom: 12 },
  body:          { fontSize: 15, color: '#7C6B99', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  watchBtn:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#7C3AED', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  watchText:     { color: '#FFF', fontWeight: '700', fontSize: 16 },
  exhaustedText: { fontSize: 13, color: '#EF4444', textAlign: 'center', marginBottom: 16 },
  closeBtn:      { marginTop: 16, padding: 10 },
  closeText:     { fontSize: 14, color: '#6B7280' },
});
