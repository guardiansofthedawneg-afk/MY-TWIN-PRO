import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { Brain, Eye, Search, Lightbulb, MessageCircle } from 'lucide-react-native';
import { ThinkingPhase } from '../../../src/core/TwinBrain';
import { SPACE, RADIUS } from '../../../src/design/tokens/spacing';
import { TYPO } from '../../../src/design/tokens/typography';
import { useRTL } from '../../../src/lib/useRTL';

interface ThinkingIndicatorProps {
  phase: ThinkingPhase;
}

const PHASE_CONFIG: Record<string, { icon: any; label_ar: string; label_en: string; color: string }> = {
  observe:   { icon: Eye,           label_ar: 'يراقب...',    label_en: 'Observing...',    color: '#A78BFA' },
  understand: { icon: Brain,         label_ar: 'يفهم...',     label_en: 'Understanding...', color: '#7C3AED' },
  recall:    { icon: Search,        label_ar: 'يتذكر...',    label_en: 'Recalling...',    color: '#3B82F6' },
  reason:    { icon: Lightbulb,     label_ar: 'يفكر...',     label_en: 'Reasoning...',    color: '#F59E0B' },
  respond:   { icon: MessageCircle, label_ar: 'يستجيب...',   label_en: 'Responding...',   color: '#10B981' },
};

export default function ThinkingIndicator({ phase }: ThinkingIndicatorProps) {
  const rtl = useRTL();
  const config = PHASE_CONFIG[phase.phase] || PHASE_CONFIG.observe;
  const Icon = config.icon;
  const label = rtl.isRTL ? config.label_ar : config.label_en;

  const progressStyle = useAnimatedStyle(() => ({
    width: `${phase.progress * 100}%`,
  }));

  return (
    <View style={styles.container}>
      <View style={[styles.row, { flexDirection: rtl.flexDirection }]}>
        <View style={[styles.iconWrap, { backgroundColor: config.color + '20' }]}>
          <Icon size={18} stroke={config.color} />
        </View>
        <View style={styles.dotsRow}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[styles.dot, { backgroundColor: config.color, opacity: phase.progress > i * 0.35 ? 1 : 0.3 }]} />
          ))}
        </View>
        <Text style={[styles.label, { color: config.color, textAlign: rtl.textAlign }]}>{label}</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { backgroundColor: config.color }, progressStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: SPACE.lg, paddingBottom: SPACE.sm },
  row: { alignItems: 'center', gap: SPACE.sm },
  iconWrap: { width: 32, height: 32, borderRadius: RADIUS.sm, justifyContent: 'center', alignItems: 'center' },
  dotsRow: { flexDirection: 'row', gap: 3 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { ...TYPO.small, fontWeight: '600' },
  track: { height: 3, backgroundColor: '#2D1B4D', borderRadius: 2, marginTop: SPACE.sm },
  fill: { height: 3, borderRadius: 2 },
});
