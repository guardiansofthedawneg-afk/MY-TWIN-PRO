import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { stateBus, STATE_EVENTS } from '../../../src/core/StateBus';
import { useAppTheme } from '../../../engine/colors';

interface TrustPulseProps {
  size?: number;
}

export default function TrustPulse({ size = 16 }: TrustPulseProps) {
  const { colors } = useAppTheme();
  const [trust, setTrust] = useState(
    () => stateBus.getState().relationship.trustScore * 100 || 50
  );
  const [pulsing, setPulsing] = useState(false);
  const pulseOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(0.5);

  useEffect(() => {
    const unsub = stateBus.on(STATE_EVENTS.BOND_CHANGED, (data: any) => {
      const newTrust = data?.bondLevel || stateBus.getState().relationship.bondLevel;
      if (newTrust > trust) {
        setPulsing(true);
        pulseOpacity.value = withSequence(
          withTiming(0.6, { duration: 400 }),
          withTiming(0, { duration: 800, easing: Easing.out(Easing.ease) }),
        );
        pulseScale.value = withSequence(
          withTiming(2.5, { duration: 400 }),
          withTiming(3.5, { duration: 800, easing: Easing.out(Easing.ease) }),
        );
        setTimeout(() => setPulsing(false), 1200);
      }
      setTrust(newTrust);
    });
    return () => unsub();
  }, [trust]);

  const getColor = () => {
    if (trust >= 80) return colors.success;
    if (trust >= 60) return colors.accent;
    if (trust >= 40) return colors.gold;
    return '#6B7280';
  };

  const color = getColor();
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <>
      <Animated.View
        style={[
          styles.pulse,
          {
            width: size * 2,
            height: size * 2,
            borderRadius: size,
            borderColor: color,
          },
          animatedStyle,
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          styles.core,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  core: {
    position: 'absolute',
    alignSelf: 'center',
  },
  pulse: {
    position: 'absolute',
    borderWidth: 1.5,
    alignSelf: 'center',
  },
});
