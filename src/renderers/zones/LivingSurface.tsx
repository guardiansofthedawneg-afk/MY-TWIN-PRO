import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle, TouchableOpacity } from 'react-native';
import { useLivingTheme } from '../../../engine/living-theme';
import { Sparkles, Brain, Zap, Star, Cloud, Eye, Search, TrendingUp } from 'lucide-react-native';

export type Variant = 'twin' | 'user' | 'warning' | 'success' | 'memory' | 'dream' | 'task' | 'project' | 'insight' | 'glass';
type AwarenessLevel = 'Dormant' | 'Aware' | 'Focused' | 'DeepThinking' | 'Flow' | 'Conscious';
export type Status = 'idle' | 'thinking' | 'analyzing' | 'learning' | 'remembering' | 'speaking' | 'connecting' | 'planning' | 'researching';
export type Emotion = 'neutral' | 'happy' | 'focused' | 'curious' | 'concerned' | 'inspired' | 'calm';

interface LivingSurfaceProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  variant?: Variant;
  awarenessLevel?: AwarenessLevel;
  status?: Status;
  emotion?: Emotion;
  importance?: number;
  urgency?: number;
  animated?: boolean;
  icon?: any;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  footerMeta?: string;
  onPress?: () => void;
}

function usePulse(min = 0.94, max = 1.06, duration = 2500) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: max, duration, useNativeDriver: true }),
      Animated.timing(anim, { toValue: min, duration, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [min, max, duration]);
  return anim;
}

function useBreath(min = 0.3, max = 0.8, duration = 4000) {
  const anim = useRef(new Animated.Value(min)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: max, duration, useNativeDriver: true }),
      Animated.timing(anim, { toValue: min, duration, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [min, max, duration]);
  return anim;
}

export const LivingSurface = ({
  children, style, variant = 'glass', awarenessLevel = 'Aware',
  status = 'idle', emotion = 'neutral', importance = 50,
  animated = true, icon, title, subtitle, footer, footerMeta, onPress,
}: LivingSurfaceProps) => {
  const theme = useLivingTheme();
  const pulseAnim = usePulse(0.96, 1.04, theme.motion.pulseDuration);
  const breathAnim = useBreath(0.5, 0.9, theme.motion.breathDuration);

  // glow يعتمد على الحالة
  const glowSpeed = status === 'thinking' ? 1500 : status === 'speaking' ? 600 : status === 'remembering' ? 3000 : 2500;
  const glowOpacity = useBreath(0.04, 0.12 + (importance / 100) * 0.1, glowSpeed);

  const variantStyles = useMemo(() => {
    const map: Record<Variant, any> = {
      twin:    { bg: theme.colors.card, border: theme.living.breathingGlow + '50', glow: theme.living.breathingGlow },
      user:    { bg: theme.colors.card, border: theme.colors.border, glow: 'transparent' },
      warning: { bg: '#F59E0B10', border: '#F59E0B50', glow: '#F59E0B' },
      success: { bg: '#10B98110', border: '#10B98150', glow: '#10B981' },
      memory:  { bg: '#8B5CF610', border: '#8B5CF650', glow: theme.living.memory },
      dream:   { bg: '#6366F110', border: '#6366F150', glow: theme.living.dream },
      task:    { bg: '#EC489910', border: '#EC489950', glow: '#EC4899' },
      project: { bg: '#3B82F610', border: '#3B82F650', glow: '#3B82F6' },
      insight: { bg: '#14B8A610', border: '#14B8A650', glow: theme.living.awareness },
      glass:   { bg: theme.colors.card, border: theme.colors.border, glow: 'transparent' },
    };
    return map[variant] || map.glass;
  }, [variant, theme]);

  const emotionColor = useMemo(() => {
    const map: Record<Emotion, string> = {
      neutral: 'transparent', happy: '#F59E0B', focused: '#3B82F6', curious: '#8B5CF6',
      concerned: '#EF4444', inspired: '#10B981', calm: '#14B8A6',
    };
    return map[emotion] || 'transparent';
  }, [emotion]);

  const statusIcon = useMemo(() => {
    const map: Record<Status, any> = {
      idle: Sparkles, thinking: Brain, analyzing: Search, learning: Star,
      remembering: Cloud, speaking: Zap, connecting: Eye, planning: TrendingUp, researching: Search,
    };
    return map[status] || Sparkles;
  }, [status]);

  const StatusIcon = statusIcon;
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Animated.View style={[
      st.surface,
      {
        backgroundColor: variantStyles.bg,
        borderColor: variantStyles.border,
        transform: animated ? [{ scale: pulseAnim }] : undefined,
        opacity: animated ? breathAnim : 1,
        shadowColor: variantStyles.glow,
        borderRadius: theme.radius.lg,
        ...theme.shadow.soft,
      },
      style,
    ]}>
      {/* Glow خلفي ذكي */}
      {variantStyles.glow !== 'transparent' && (
        <Animated.View style={[st.glow, {
          backgroundColor: variantStyles.glow,
          opacity: glowOpacity,
          transform: [{ scale: 1.5 }],
          borderRadius: theme.radius.lg + 20,
        }]} />
      )}

      {/* تأثير عاطفي */}
      {emotionColor !== 'transparent' && (
        <Animated.View style={[st.emotionOverlay, {
          backgroundColor: emotionColor,
          opacity: useBreath(0.02, 0.06, 3500).current,
          borderRadius: theme.radius.lg,
        }]} />
      )}

      <Container onPress={onPress} activeOpacity={0.8} style={st.container}>
        {(icon || title || subtitle) && (
          <View style={st.header}>
            {icon && <View style={st.iconWrap}>{icon}</View>}
            <View style={st.headerText}>
              {title && <Text style={[st.title, { color: theme.colors.text }]}>{title}</Text>}
              {subtitle && <Text style={[st.subtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>}
            </View>
            {status !== 'idle' && StatusIcon && (
              <View style={[st.statusBadge, { backgroundColor: variantStyles.glow + '20' }]}>
                <StatusIcon size={12} stroke={variantStyles.glow} />
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: variantStyles.glow }} />
              </View>
            )}
          </View>
        )}
        <View style={st.body}>{children}</View>
        {(footer || footerMeta) && (
          <View style={st.footer}>
            {footer}
            {footerMeta && <Text style={[st.footerMeta, { color: theme.colors.textSecondary }]}>{footerMeta}</Text>}
          </View>
        )}
      </Container>
    </Animated.View>
  );
};

const st = StyleSheet.create({
  surface: { borderWidth: 1.5, padding: 16, marginBottom: 10, overflow: 'hidden', position: 'relative' },
  container: { zIndex: 2 },
  glow: { position: 'absolute', top: -40, left: -40, right: -40, bottom: -40, zIndex: 0 },
  emotionOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 0 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, zIndex: 2 },
  iconWrap: { marginRight: 10 },
  headerText: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700' },
  subtitle: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  body: { zIndex: 2 },
  footer: { marginTop: 10, borderTopWidth: 0.5, borderTopColor: '#333', paddingTop: 10, zIndex: 2 },
  footerMeta: { fontSize: 11, fontWeight: '500', marginTop: 4 },
});
