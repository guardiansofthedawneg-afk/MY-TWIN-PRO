import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { digitalSoul } from '../../soul/DigitalSoul';
// ✅ relationshipEngine removed — use stateBus
import { emotionEngine } from '../../../engine/emotion/EmotionEngine';
import { usePresence } from '../../hooks/usePresence';

const SOUL_COLORS: Record<string, string> = {
  friend: '#A855F7',
  mentor: '#3B82F6',
  study_partner: '#10B981',
  guide: '#F59E0B',
  listener: '#8B5CF6',
  collaborator: '#EC4899',
  protector: '#6366F1',
  mirror: '#14B8A6',
  cheerleader: '#F97316',
};

export default function SoulPulse() {
  const soul = digitalSoul.read();
  const presence = usePresence();
  const bond = relationshipEngine.getBondLevel();
  const emotion = emotionEngine.getCurrentEmotion();

  const color = SOUL_COLORS[soul.core.role] || '#A855F7';
  const pulseOpacity = useSharedValue(0.1);
  const pulseScale = useSharedValue(0.8);

  useEffect(() => {
    const harmony = soul.resonance.harmony;
    const speed = 4000 - harmony * 2000;
    const intensity = 0.1 + harmony * 0.25;

    pulseOpacity.value = withRepeat(
      withTiming(intensity, { duration: speed, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    pulseScale.value = withRepeat(
      withTiming(1.0 + harmony * 0.2, { duration: speed, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [soul.resonance.harmony]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View
        style={[
          styles.ring,
          { borderColor: color, width: 180, height: 180, borderRadius: 90 },
          ringStyle,
        ]}
      />
      <Animated.View style={[styles.core, { backgroundColor: color, opacity: pulseOpacity }]}>
        <View style={styles.innerDot} />
      </Animated.View>
      {soul.resonance.syncLevel === 'complete' && (
        <View style={styles.particles}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.particle,
                { backgroundColor: color, transform: [{ rotate: `${i * 120}deg` }] },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  core: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  innerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    opacity: 0.8,
  },
  particles: {
    position: 'absolute',
    width: 200,
    height: 200,
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    top: 0,
    left: '50%',
    marginLeft: -2,
  },
});
