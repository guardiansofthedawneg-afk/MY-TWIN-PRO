import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas, Circle, Paint, BlurMask, RadialGradient, vec } from "@shopify/react-native-skia";
import { useSharedValue, withTiming } from "react-native-reanimated";
import { stateBus } from '../core/StateBus';
import { useAppTheme } from '../../engine/colors';

export default function AmbientField() {
  const { colors } = useAppTheme();
  const energyLevel = useSharedValue(0.5);
  const emotionColor = useSharedValue(colors.accent);
  const silenceLevel = useSharedValue(0);
  const [surprisePulse, setSurprisePulse] = useState(false);

  useEffect(() => {
    const unsub = stateBus.on('presence:state_updated', (_: string, data: any) => {
      if (!data) return;
      energyLevel.value = withTiming(data.energyLevel || 0.5, { duration: 2000 });
      silenceLevel.value = withTiming(data.silenceLevel || 0, { duration: 1000 });

      const emotionColors: Record<string, string> = {
        joy: '#F59E0B', sadness: '#3B82F6', calm: '#10B981', love: '#EC4899',
        anger: '#EF4444', fear: '#A78BFA', neutral: colors.accent,
      };
      emotionColor.value = withTiming(emotionColors[data.emotion] || colors.accent, { duration: 3000 });

      // Surprise micro-pulse
      if (Math.random() < 0.05 && data.silenceLevel < 0.3) {
        setSurprisePulse(true);
        setTimeout(() => setSurprisePulse(false), 800);
      }
    });
    return unsub;
  }, [colors]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Canvas style={{ flex: 1 }}>
        {/* Base ambient layer */}
        <Circle cx={140} cy={400} r={280} opacity={energyLevel}>
          <Paint><BlurMask blur={90} style="normal" /></Paint>
          <RadialGradient c={vec(140, 400)} r={280} colors={[emotionColor.value + '08', 'transparent']} />
        </Circle>

        {/* Secondary depth layer */}
        <Circle cx={240} cy={250} r={200} opacity={0.3 - silenceLevel.value * 0.2}>
          <Paint><BlurMask blur={70} style="normal" /></Paint>
          <RadialGradient c={vec(240, 250)} r={200} colors={[emotionColor.value + '06', 'transparent']} />
        </Circle>

        {/* Surprise pulse */}
        {surprisePulse && (
          <Circle cx={180} cy={300} r={150} opacity={0.15}>
            <Paint><BlurMask blur={40} style="normal" /></Paint>
            <RadialGradient c={vec(180, 300)} r={150} colors={['#FFFFFF20', 'transparent']} />
          </Circle>
        )}
      </Canvas>
    </View>
  );
}
