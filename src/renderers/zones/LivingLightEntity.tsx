import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas, Circle, Path, Group, Paint, BlurMask, RadialGradient, SweepGradient, vec } from "@shopify/react-native-skia";
import { useSharedValue, withTiming, useDerivedValue } from "react-native-reanimated";
import { stateBus } from '../../../src/core/StateBus';
import { useAppTheme } from '../../../engine/colors';

interface LivingLightEntityProps {
  isThinking?: boolean;
  isSpeaking?: boolean;
  isListening?: boolean;
  onLongPress?: () => void;
}

const W = 280, H = 280, CX = W / 2, CY = H / 2;

const generateMembranePath = (phase: number, scale: number, points: number, focusLevel: number) => {
  const radius = 55 * scale;
  let d = '';
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const distortion = Math.sin(angle * 4 + phase) * 10 + Math.cos(angle * 6 + phase * 0.7) * 6 + focusLevel * Math.sin(angle * 2) * 4;
    const r = radius + distortion;
    const x = CX + Math.cos(angle) * r;
    const y = CY + Math.sin(angle) * r;
    if (i === 0) d += `M ${x} ${y}`;
    else d += ` L ${x} ${y}`;
  }
  d += ' Z';
  return d;
};

export default function LivingLightEntity({
  isThinking = false, isSpeaking = false, isListening = false, onLongPress,
}: LivingLightEntityProps) {
  const { colors } = useAppTheme();

  const breathPhase = useSharedValue(0);
  const focusLevel = useSharedValue(0.5);
  const energyLevel = useSharedValue(0.5);
  const warmth = useSharedValue(0.5);
  const memoryEchoIntensity = useSharedValue(0);
  const intentIntensity = useSharedValue(0);
  const membranePhase = useSharedValue(0);

  const [emotionColor, setEmotionColor] = useState(colors.accent);
  const [gazeDirection, setGazeDirection] = useState(0);

  useEffect(() => {
    const unsubscribe = stateBus.on('presence:state_updated', (_: string, data: any) => {
      if (!data) return;
      breathPhase.value = data.breathPhase || 0;
      focusLevel.value = withTiming(data.focusLevel || 0.5, { duration: 300 });
      energyLevel.value = withTiming(data.energyLevel || 0.5, { duration: 300 });
      warmth.value = withTiming(data.warmth || 0.5, { duration: 500 });
      memoryEchoIntensity.value = withTiming(data.memoryEchoIntensity || 0, { duration: 300 });
      intentIntensity.value = withTiming(data.intentIntensity || 0, { duration: 300 });
      setGazeDirection(data.gazeDirection === 'user' ? 1 : data.gazeDirection === 'memory' ? -1 : 0);

      const emotionColors: Record<string, string> = {
        joy: '#F59E0B', sadness: '#3B82F6', calm: '#10B981', love: '#EC4899',
        anger: '#EF4444', fear: '#A78BFA', neutral: colors.accent,
      };
      setEmotionColor(emotionColors[data.emotion] || colors.accent);

      membranePhase.value = withTiming(membranePhase.value + 0.5, { duration: 2000 });
    });
    return unsubscribe;
  }, [colors]);

  const membranePath = useDerivedValue(() => generateMembranePath(membranePhase.value, 1.0, 60, focusLevel.value), [membranePhase, focusLevel]);
  const coreRadius = useDerivedValue(() => 12 + breathPhase.value * 8, [breathPhase]);

  const particles = useRef(
    Array.from({ length: 120 }, (_, i) => ({
      id: i,
      angle: Math.random() * Math.PI * 2,
      radius: 35 + Math.random() * 90,
      speed: 0.1 + Math.random() * 0.5,
      size: 1 + Math.random() * 2.5,
      opacity: 0.2 + Math.random() * 0.5,
      lifePhase: Math.random() * Math.PI * 2,
      orbitType: Math.random() > 0.6 ? 'orbit' : Math.random() > 0.5 ? 'attract' : 'escape',
    }))
  ).current;

  return (
    <View style={styles.container}>
      <Canvas style={{ width: W, height: H }}>
        <Group>
          {/* 1. Ambient Fog */}
          <Circle cx={CX} cy={CY} r={140} opacity={0.06 + energyLevel.value * 0.04}>
            <Paint><BlurMask blur={60} style="normal" /></Paint>
            <RadialGradient c={vec(CX, CY)} r={140} colors={[emotionColor + '30', 'transparent']} />
          </Circle>

          {/* 2. Fluid Membrane */}
          <Path path={membranePath} color={emotionColor} opacity={0.12} style="fill">
            <Paint><BlurMask blur={12} style="normal" /></Paint>
          </Path>
          <Path path={membranePath} color={emotionColor} opacity={0.25} style="stroke" strokeWidth={1.2}>
            <Paint><BlurMask blur={4} style="solid" /></Paint>
          </Path>

          {/* 3. Light Fog */}
          {[0, 1, 2, 3, 4].map(i => {
            const angle = (i / 5) * Math.PI * 2 + gazeDirection * 0.3;
            const dist = 40 + energyLevel.value * 50;
            const x = CX + Math.cos(angle) * dist;
            const y = CY + Math.sin(angle) * dist;
            return (
              <Circle key={i} cx={x} cy={y} r={15 + energyLevel.value * 10} opacity={0.08 + focusLevel.value * 0.12}>
                <Paint><BlurMask blur={18} style="normal" /></Paint>
                <RadialGradient c={vec(x, y)} r={20} colors={[emotionColor + '30', 'transparent']} />
              </Circle>
            );
          })}

          {/* 4. Living Particles */}
          {particles.map(p => {
            const lifeSin = Math.sin(Date.now() / 3000 + p.lifePhase);
            const currentRadius = p.orbitType === 'orbit' ? p.radius :
              p.orbitType === 'attract' ? p.radius * (0.7 + lifeSin * 0.3) : p.radius * (1.3 + lifeSin * 0.3);
            const px = CX + Math.cos(p.angle + Date.now() / 5000 * p.speed) * currentRadius;
            const py = CY + Math.sin(p.angle + Date.now() / 5000 * p.speed) * currentRadius;
            return (
              <Circle key={p.id} cx={px} cy={py} r={p.size} color={emotionColor} opacity={p.opacity * energyLevel.value}>
                <Paint><BlurMask blur={2} style="solid" /></Paint>
              </Circle>
            );
          })}

          {/* 5. Memory Echo */}
          {memoryEchoIntensity.value > 0.01 && (
            <Circle cx={CX} cy={CY} r={60 * memoryEchoIntensity.value} opacity={memoryEchoIntensity.value * 0.35}>
              <Paint style="stroke" strokeWidth={1.5} /><BlurMask blur={8} style="normal" />
              <RadialGradient c={vec(CX, CY)} r={60} colors={['#FFFFFF30', 'transparent']} />
            </Circle>
          )}

          {/* 6. Intent Field */}
          {intentIntensity.value > 0.01 && (
            <Circle cx={CX} cy={CY} r={75} opacity={intentIntensity.value * 0.25}>
              <Paint style="stroke" strokeWidth={1.2} /><BlurMask blur={10} style="normal" />
              <SweepGradient c={vec(CX, CY)} colors={['#F59E0B30', '#EC489930', '#F59E0B30']} />
            </Circle>
          )}

          {/* 7. Plasma Core */}
          <Circle cx={CX} cy={CY} r={coreRadius} color={emotionColor} opacity={warmth}>
            <Paint><BlurMask blur={7} style="solid" /></Paint>
          </Circle>
          <Circle cx={CX} cy={CY} r={3 + breathPhase.value * 2} color="#FFFFFF" opacity={0.5}>
            <Paint><BlurMask blur={2} style="solid" /></Paint>
          </Circle>
        </Group>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: W, height: H, alignSelf: 'center', justifyContent: 'center', alignItems: 'center' },
});
