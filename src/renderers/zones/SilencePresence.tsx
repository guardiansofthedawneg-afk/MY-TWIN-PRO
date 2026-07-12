import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, Easing } from 'react-native-reanimated';
import { withSequence, withTiming } from 'react-native-reanimated';
import { usePresence } from '../../hooks/usePresence';
import { useBreathAnimation } from '../../hooks/useBreathAnimation';
import { EventBus } from '../../core/EventBus';
import { SPACE } from '../../../src/design/tokens/spacing';
import { useRTL } from '../../../src/lib/useRTL';
import { Eye } from 'lucide-react-native';

const SILENCE_PHRASES: Record<string, { ar: string[]; en: string[] }> = {
  thinking: {
    ar: ['أريد أن أختار كلماتي جيداً...', 'دعني أفكر قليلاً...'],
    en: ['Let me choose my words carefully...', 'Let me think for a moment...'],
  },
  reflecting: {
    ar: ['أتفكر فيما قلته...', 'لحظة تأمل...'],
    en: ['Reflecting on what you said...', 'A moment of reflection...'],
  },
  silent: {
    ar: ['أنا هنا. أستمع.', 'خذ وقتك.'],
    en: ['I am here. Listening.', 'Take your time.'],
  },
};

export default function SilencePresence() {
  const rtl = useRTL();
  const presence = usePresence();
  const breath = useBreathAnimation();
  const [silenceActive, setSilenceActive] = useState(false);
  const [phrase, setPhrase] = useState('');
  const [showPhrase, setShowPhrase] = useState(false);

  const opacity = useSharedValue(0);
  const avatarBreath = useSharedValue(1);

  useEffect(() => {
    const unsub1 = EventBus.on('SILENCE_START', (payload: any) => {
      setSilenceActive(true);
      opacity.value = withTiming(1, { duration: 600 });

      const level = payload?.level || 0;
      const category = level <= 2 ? 'silent' : level <= 4 ? 'reflecting' : 'thinking';
      const phrases = SILENCE_PHRASES[category] || SILENCE_PHRASES.silent;
      const langPhrases = rtl.isRTL ? phrases.ar : phrases.en;
      setPhrase(langPhrases[Math.floor(Math.random() * langPhrases.length)]);

      setTimeout(() => setShowPhrase(true), 2000);
    });

    const unsub2 = EventBus.on('SILENCE_END', () => {
      opacity.value = withTiming(0, { duration: 400 });
      setShowPhrase(false);
      setTimeout(() => setSilenceActive(false), 400);
    });

    return () => { unsub1(); unsub2(); };
  }, [rtl.isRTL]);

  useEffect(() => {
    if (silenceActive) {
      avatarBreath.value = withSequence(
        withTiming(0.92, { duration: 2000 }),
        withTiming(1, { duration: 2000 }),
      );
    }
  }, [silenceActive]);

  if (!silenceActive) return null;

  const containerStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={styles.avatarRow}>
        <Animated.View style={[styles.silentAvatar, { transform: [{ scale: avatarBreath }] }]}>
          <Eye size={20} stroke="#A78BFA" />
        </Animated.View>
        <View style={styles.breathDots}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[styles.breathDot, { opacity: breath.phase > i * 0.33 ? 0.6 : 0.2 }]} />
          ))}
        </View>
      </View>

      {showPhrase && (
        <Text style={styles.phrase}>{phrase}</Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: SPACE.md,
    gap: SPACE.sm,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  silentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(168, 133, 250, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(168, 133, 250, 0.3)',
  },
  breathDots: {
    flexDirection: 'row',
    gap: 4,
  },
  breathDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#A78BFA',
  },
  phrase: {
    color: '#A78BFA',
    fontSize: 13,
    fontWeight: '400',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
