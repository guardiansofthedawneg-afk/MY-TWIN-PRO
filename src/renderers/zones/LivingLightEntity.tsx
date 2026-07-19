import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas, Circle, Paint, BlurMask, RadialGradient, SweepGradient, Group, vec } from "@shopify/react-native-skia";
import { useSharedValue, withTiming, useDerivedValue } from "react-native-reanimated";
import { presenceEngine } from '../../../engine/presence/PresenceEngine';
import { useAppTheme } from '../../../engine/colors';
import type { PresenceState } from '../../../engine/presence/PresenceEngine';
import { stateBus } from '../../../src/core/StateBus';

interface LivingLightEntityProps {
  isThinking?: boolean;
  isSpeaking?: boolean;
  isListening?: boolean;
  isRemembering?: boolean;
  onLongPress?: () => void;
}

export default function LivingLightEntity({
  isThinking = false,
  isSpeaking = false,
  isListening = false,
  isRemembering = false,
  onLongPress,
}: LivingLightEntityProps) {
  const { colors } = useAppTheme();
  const initialState = presenceEngine.getLiveState();

  const breathRate = useSharedValue(initialState.breathRate);
  const breathDepth = useSharedValue(initialState.breathDepth);
  const heartRate = useSharedValue(initialState.heartRate);
  const haloIntensity = useSharedValue(initialState.haloIntensity);
  const haloRadius = useSharedValue(initialState.haloRadius);
  const particleVelocity = useSharedValue(initialState.particleVelocity);
  const focusLevel = useSharedValue(initialState.focusLevel);
  const energyLevel = useSharedValue(initialState.energyLevel);
  const warmth = useSharedValue(initialState.warmth);
  const movementFluidity = useSharedValue(initialState.movementFluidity);
  const socialDistance = useSharedValue(initialState.socialDistance);
  
  const gazeX = useSharedValue(110);
  const gazeY = useSharedValue(110);

  // 🆕 إصلاح: استخدام useDerivedValue لحساب نصف قطر شرارة الوعي
  const sparkRadius = useDerivedValue(() => 3 + focusLevel.value, [focusLevel]);

  useEffect(() => {
    const unsubscribe = stateBus.on('presence:state_updated', (event: string, data: any) => {
      const state: PresenceState = data;
      breathRate.value = withTiming(state.breathRate, { duration: 200 });
      breathDepth.value = withTiming(state.breathDepth, { duration: 200 });
      heartRate.value = withTiming(state.heartRate, { duration: 200 });
      haloIntensity.value = withTiming(state.haloIntensity, { duration: 300 });
      haloRadius.value = withTiming(state.haloRadius, { duration: 300 });
      particleVelocity.value = withTiming(state.particleVelocity, { duration: 500 });
      focusLevel.value = withTiming(state.focusLevel, { duration: 300 });
      energyLevel.value = withTiming(state.energyLevel, { duration: 200 });
      warmth.value = withTiming(state.warmth, { duration: 400 });
      movementFluidity.value = withTiming(state.movementFluidity, { duration: 400 });
      socialDistance.value = withTiming(state.socialDistance, { duration: 500 });
      
      if (state.eyeTracking) {
        gazeX.value = withTiming(110 + (Math.random() - 0.5) * 10 * state.focusLevel, { duration: 500 });
        gazeY.value = withTiming(110 + (Math.random() - 0.5) * 10 * state.focusLevel, { duration: 500 });
      } else {
        gazeX.value = withTiming(110 + (Math.random() - 0.5) * 30, { duration: 2000 });
        gazeY.value = withTiming(110 + (Math.random() - 0.5) * 30, { duration: 2000 });
      }
    });

    return () => { unsubscribe(); };
  }, []);

  const SIZE = 220;
  const CENTER = SIZE / 2;
  const BASE_RADIUS = 45;

  return (
    <View style={styles.container}>
      <Canvas style={{ width: SIZE, height: SIZE }}>
        <Group>
          <Circle cx={CENTER} cy={CENTER} r={BASE_RADIUS + 70} opacity={haloIntensity}>
            <Paint><BlurMask blur={50} style="normal" /></Paint>
            <RadialGradient c={vec(CENTER, CENTER)} r={BASE_RADIUS + 70} colors={['#A78BFA40', '#A78BFA00']} />
          </Circle>
          <Circle cx={CENTER} cy={CENTER} r={haloRadius} opacity={0.2}>
            <Paint><BlurMask blur={25} style="normal" /></Paint>
            <RadialGradient c={vec(CENTER, CENTER)} r={haloRadius} colors={['#8A2BE260', '#A78BFA00']} />
          </Circle>
          <Circle cx={CENTER} cy={CENTER} r={BASE_RADIUS + 5} color={`#A78BFA50`}>
            <Paint style="stroke" strokeWidth={2} /><BlurMask blur={5} style="inner" />
          </Circle>
          <Circle cx={CENTER} cy={CENTER} r={BASE_RADIUS * 0.8} opacity={energyLevel}>
            <Paint><BlurMask blur={12} style="inner" /></Paint>
            <SweepGradient c={vec(CENTER, CENTER)} colors={['#A78BFA', '#8A2BE2', '#A78BFA', '#A78BFA80']} />
          </Circle>
          <Circle cx={CENTER} cy={CENTER} r={BASE_RADIUS * 0.4} color="#A78BFA" opacity={warmth}>
            <Paint><BlurMask blur={8} style="solid" /></Paint>
          </Circle>
          {/* 🆕 استخدام sparkRadius (DerivedValue) بدلاً من 3 + focusLevel */}
          <Circle cx={gazeX} cy={gazeY} r={sparkRadius} color="#FFFFFF" opacity={focusLevel} />
        </Group>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: 220, height: 220, alignSelf: 'center', justifyContent: 'center', alignItems: 'center' },
});
