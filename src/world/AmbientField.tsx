import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming,
  withRepeat, Easing, withDelay,
} from 'react-native-reanimated';
import { useEmotionalState } from '../hooks/useEmotionalState';
import { usePresence } from '../hooks/usePresence';
import { livingPresenceCoordinator } from '../core/LivingPresenceCoordinator';
import { useBreathAnimation } from '../hooks/useBreathAnimation';
import { useBondLevel } from '../hooks/useBondLevel';

const { width, height } = Dimensions.get('window');

const EMOTION_GRADIENTS: Record<string, string[]> = {
  joy:       ['#1A1020', '#2A1A30', '#1A0820'],
  sadness:   ['#0A1020', '#0A1528', '#080820'],
  calm:      ['#0A1020', '#0A1820', '#081018'],
  love:      ['#1A0818', '#200818', '#180820'],
  anger:     ['#1A0808', '#200808', '#180808'],
  fear:      ['#100818', '#120820', '#0A0818'],
  neutral:   ['#0A0A14', '#0C0C18', '#080810'],
  curious:   ['#0A0A18', '#0C0C1A', '#080812'],
  focused:   ['#080A18', '#0A0C1A', '#060818'],
  inspired:  ['#0A1018', '#0C121A', '#080E16'],
  concerned: ['#140A0A', '#180C0C', '#100808'],
};

interface Particle {
  x: number; y: number; size: number;
  speed: number; opacity: Animated.SharedValue<number>;
  translateX: Animated.SharedValue<number>;
  translateY: Animated.SharedValue<number>;
}

export default function AmbientField() {
  const emotion = useEmotionalState();
  const presence = usePresence();
  const breath = useBreathAnimation();
  const bond = useBondLevel();

  const gradientOpacity = useSharedValue(0.6);
  const particles = useRef<Particle[]>(
    Array.from({ length: 15 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 1 + Math.random() * 3,
      speed: 8000 + Math.random() * 12000,
      opacity: useSharedValue(0),
      translateX: useSharedValue(0),
      translateY: useSharedValue(0),
    }))
  ).current;

  const colors = EMOTION_GRADIENTS[emotion.emotion] || EMOTION_GRADIENTS.neutral;

  useEffect(() => {
    gradientOpacity.value = withTiming(
      0.4 + presence.presenceLevel * 0.04 + bond.bondLevel * 0.03,
      { duration: 3000 }
    );
  }, [emotion.emotion, presence.presenceLevel, bond.bondLevel]);

  useEffect(() => {
    particles.forEach((p, i) => {
      p.opacity.value = withDelay(
        i * 400,
        withRepeat(
          withTiming(0.12 + bond.bondLevel * 0.03, {
            duration: p.speed, easing: Easing.inOut(Easing.sin),
          }),
          -1, true
        )
      );
      p.translateX.value = withRepeat(
        withTiming((Math.random() - 0.5) * 40, {
          duration: p.speed * 1.5, easing: Easing.inOut(Easing.sin),
        }),
        -1, true
      );
      p.translateY.value = withRepeat(
        withTiming(-20 - Math.random() * 30, {
          duration: p.speed, easing: Easing.inOut(Easing.sin),
        }),
        -1, true
      );
    });
  }, [bond.bondLevel]);

  const fieldStyle = useAnimatedStyle(() => ({
    opacity: gradientOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.gradient, { backgroundColor: colors[0] }, fieldStyle]}>
        <View style={[styles.gradientOverlay, { backgroundColor: colors[1] }]} />
        <View style={[styles.gradientOverlay2, { backgroundColor: colors[2] }]} />
      </Animated.View>
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              left: p.x, top: p.y, width: p.size, height: p.size,
              borderRadius: p.size / 2,
              backgroundColor: emotion.valence === 'positive' ? '#B8A0D0' : '#6B8AB0',
              opacity: p.opacity,
              transform: [
                { translateX: p.translateX },
                { translateY: p.translateY },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject },
  gradient: { ...StyleSheet.absoluteFillObject },
  gradientOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.5 },
  gradientOverlay2: { ...StyleSheet.absoluteFillObject, opacity: 0.3 },
  particle: { position: 'absolute' },
});
