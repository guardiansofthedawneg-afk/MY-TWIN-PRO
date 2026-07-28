import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Pressable } from 'react-native';
import {
  Canvas, Circle, Path, Group, Paint, BlurMask,
  RadialGradient, SweepGradient, Oval, vec, Line as SkiaLine
} from "@shopify/react-native-skia";
import {
  useSharedValue, withTiming, useDerivedValue,
  withRepeat, withSequence, withDelay, Easing
} from "react-native-reanimated";
import { stateBus } from '../../../src/core/StateBus';
import { audioMixer } from '../../../src/core/AudioMixer';
import { useAppTheme } from '../../../engine/colors';
import { devicePresenceEngine } from '../../../engine/device/DevicePresenceEngine';

interface LivingLightEntityProps {
  isThinking?: boolean;
  isSpeaking?: boolean;
  isListening?: boolean;
  onLongPress?: () => void;
  onPress?: () => void;
}

// أبعاد الشاشة الكاملة
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ENTITY_SIZE = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) * 0.9;
const CX = ENTITY_SIZE / 2;
const CY = ENTITY_SIZE / 2;

// ═══════════════════════════════════════════════
// توليد مسار الغشاء الحي (لا يزال غير دائري)
// ═══════════════════════════════════════════════
const generateMembranePath = (
  phase: number, scale: number, points: number,
  focusLevel: number, emotionIntensity: number
) => {
  const radius = (ENTITY_SIZE * 0.22) * scale;
  let d = '';
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const distortion =
      Math.sin(angle * 4 + phase) * (12 + emotionIntensity * 8) +
      Math.cos(angle * 6 + phase * 0.7) * (8 + focusLevel * 6) +
      focusLevel * Math.sin(angle * 2) * 5;
    const r = radius + distortion;
    const x = CX + Math.cos(angle) * r;
    const y = CY + Math.sin(angle) * r;
    if (i === 0) d += `M ${x} ${y}`;
    else d += ` L ${x} ${y}`;
  }
  d += ' Z';
  return d;
};

// ═══════════════════════════════════════════════
// العين اللوزية: مسار بيضاوي مقطعي
// ═══════════════════════════════════════════════
const generateEyePath = (
  centerX: number, centerY: number,
  eyeWidth: number, eyeHeight: number,
  gazeX: number, gazeY: number
) => {
  const left = centerX - eyeWidth / 2 + gazeX;
  const right = centerX + eyeWidth / 2 + gazeX;
  const top = centerY - eyeHeight / 2 + gazeY;
  const bottom = centerY + eyeHeight / 2 + gazeY;
  // شكل لوزي باستخدام منحنى بيزير
  return `M ${centerX} ${top} 
    C ${right + eyeWidth * 0.3} ${top + eyeHeight * 0.2}, 
      ${right + eyeWidth * 0.3} ${bottom - eyeHeight * 0.2}, 
      ${centerX} ${bottom} 
    C ${left - eyeWidth * 0.3} ${bottom - eyeHeight * 0.2}, 
      ${left - eyeWidth * 0.3} ${top + eyeHeight * 0.2}, 
      ${centerX} ${top} Z`;
};

export default function LivingLightEntity({
  isThinking = false, isSpeaking = false, isListening = false,
  onLongPress, onPress,
}: LivingLightEntityProps) {
  const { colors } = useAppTheme();

  // ── القيم المشتركة (Shared Values) ──
  const breathPhase = useSharedValue(0);
  const focusLevel = useSharedValue(0.5);
  const energyLevel = useSharedValue(0.5);
  const warmth = useSharedValue(0.5);
  const memoryEchoIntensity = useSharedValue(0);
  const intentIntensity = useSharedValue(0);
  const membranePhase = useSharedValue(0);
  const silenceLevel = useSharedValue(0);

  // ── قيم العينين ──
  const eyeBlink = useSharedValue(0); // 0=مفتوح, 1=مغلق
  const eyeGazeX = useSharedValue(0);
  const eyeGazeY = useSharedValue(0);
  const eyeScale = useSharedValue(1);

  // ── حالة محلية ──
  const [emotionColor, setEmotionColor] = useState(colors.accent);
  const [gazeDirection, setGazeDirection] = useState<'user' | 'internal' | 'memory' | 'wandering'>('user');
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [isBlinking, setIsBlinking] = useState(false);
  const [headTilt, setHeadTilt] = useState(0);

  // ── الاستماع لـ StateBus ──
  useEffect(() => {
    const unsubscribe = stateBus.on('presence:state_updated', (_: string, data: any) => {
      if (!data) return;

      // تحديث القيم الأساسية
      breathPhase.value = data.breathPhase || 0;
      focusLevel.value = withTiming(data.focusLevel || 0.5, { duration: 300 });
      energyLevel.value = withTiming(data.energyLevel || 0.5, { duration: 300 });
      warmth.value = withTiming(data.warmth || 0.5, { duration: 500 });
      memoryEchoIntensity.value = withTiming(data.memoryEchoIntensity || 0, { duration: 300 });
      intentIntensity.value = withTiming(data.intentIntensity || 0, { duration: 300 });
      silenceLevel.value = withTiming(data.silenceLevel || 0, { duration: 1000 });

      // لون المشاعر
      const emotionColors: Record<string, string> = {
        joy: '#F59E0B', sadness: '#3B82F6', calm: '#10B981', love: '#EC4899',
        anger: '#EF4444', fear: '#A78BFA', neutral: colors.accent,
      };
      const newColor = emotionColors[data.emotion] || colors.accent;
      setEmotionColor(newColor);
      setCurrentEmotion(data.emotion || 'neutral');

      // اتجاه النظرة
      const newGaze = data.gazeDirection || 'user';
      setGazeDirection(newGaze);

      // تحديث حركة العينين
      if (newGaze === 'user') {
        eyeGazeX.value = withTiming(0, { duration: 400 });
        eyeGazeY.value = withTiming(-2, { duration: 400 });
      } else if (newGaze === 'memory') {
        eyeGazeX.value = withTiming(-8, { duration: 400 });
        eyeGazeY.value = withTiming(-4, { duration: 400 });
      } else if (newGaze === 'internal') {
        eyeGazeX.value = withTiming(0, { duration: 400 });
        eyeGazeY.value = withTiming(6, { duration: 400 });
      } else {
        eyeGazeX.value = withTiming(4, { duration: 800 });
        eyeGazeY.value = withTiming(-1, { duration: 800 });
      }

      // إمالة الرأس عند التفكير
      if (data.isThinking) {
        setHeadTilt(-3);
      } else if (data.microExpressions?.some((m: any) => m.type === 'core_tilt')) {
        setHeadTilt(2);
        setTimeout(() => setHeadTilt(0), 1500);
      } else {
        setHeadTilt(0);
      }

      // تحديث الغشاء
      membranePhase.value = withTiming(membranePhase.value + 0.5, { duration: 2000 });

      // صدى الذاكرة
      if (data.memoryEchoIntensity > 0.5) {
        audioMixer.playMemoryEcho();
      }

      // تغيير المشاعر
      if (data.emotion !== currentEmotion) {
        audioMixer.setEmotionAudio(data.emotion);
      }
    });

    return unsubscribe;
  }, [colors, currentEmotion]);

  // ── دورة الرمش الطبيعية ──
  useEffect(() => {
    const blink = () => {
      eyeBlink.value = withSequence(
        withTiming(1, { duration: 60, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 120, easing: Easing.inOut(Easing.ease) }),
      );
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 200);
      // رمشة مزدوجة أحياناً
      if (Math.random() < 0.15) {
        setTimeout(() => {
          eyeBlink.value = withSequence(
            withTiming(1, { duration: 50 }),
            withTiming(0, { duration: 100 }),
          );
        }, 300);
      }
    };

    const scheduleNext = () => {
      const delay = 2500 + Math.random() * 5000;
      return setTimeout(() => {
        blink();
        scheduleNext();
      }, delay);
    };

    const timer = setTimeout(() => {
      blink();
      scheduleNext();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // ── استجابة للكلام والاستماع ──
  useEffect(() => {
    if (isSpeaking) {
      // توسع العينين قليلاً عند الكلام
      eyeScale.value = withTiming(1.15, { duration: 300 });
      audioMixer.playBreath();
    } else if (isListening) {
      // تركيز العينين
      eyeScale.value = withTiming(1.0, { duration: 300 });
    } else {
      eyeScale.value = withTiming(1.0, { duration: 600 });
    }
  }, [isSpeaking, isListening]);

  // ─ـ استخدام المستشعرات للتفاعل مع حركة الهاتف ──
  useEffect(() => {
    const interval = setInterval(() => {
      const sensors = devicePresenceEngine.getSensors();
      if (sensors.accelerometer) {
        const { x, y } = sensors.accelerometer;
        // حركة خفيفة للعينين مع ميل الهاتف
        const tiltX = Math.max(-5, Math.min(5, -x * 3));
        const tiltY = Math.max(-3, Math.min(3, y * 2));
        if (!isSpeaking && !isThinking) {
          eyeGazeX.value = withTiming(tiltX, { duration: 500 });
          eyeGazeY.value = withTiming(tiltY, { duration: 500 });
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isSpeaking, isThinking]);

  // ─ـ تنفس مستمر مع صوت ─ـ
  useEffect(() => {
    const breathInterval = setInterval(() => {
      if (breathPhase.value < 0.1 || breathPhase.value > 0.9) {
        audioMixer.playBreath();
      }
    }, 4000);
    return () => clearInterval(breathInterval);
  }, []);


  // ═══════════════════════════════════════════════
  // الجسيمات الحية (120 جسيم)
  // ═══════════════════════════════════════════════
  const particles = useRef(
    Array.from({ length: 120 }, (_, i) => ({
      id: i,
      angle: Math.random() * Math.PI * 2,
      radius: ENTITY_SIZE * 0.12 + Math.random() * ENTITY_SIZE * 0.35,
      speed: 0.1 + Math.random() * 0.5,
      size: 1.2 + Math.random() * 2.8,
      opacity: 0.2 + Math.random() * 0.5,
      lifePhase: Math.random() * Math.PI * 2,
      orbitType: Math.random() > 0.6 ? 'orbit' as const
        : Math.random() > 0.5 ? 'attract' as const
        : 'escape' as const,
      colorShift: Math.random() > 0.5,
    }))
  ).current;

  // ═══════════════════════════════════════════════
  // المسارات المشتقة (Derived Values)
  // ═══════════════════════════════════════════════
  const membranePath = useDerivedValue(
    () => generateMembranePath(
      membranePhase.value, 1.0, 60,
      focusLevel.value,
      Math.abs(warmth.value - 0.5) * 2
    ),
    [membranePhase, focusLevel, warmth]
  );

  const coreRadius = useDerivedValue(
    () => 14 + breathPhase.value * 10 + energyLevel.value * 4,
    [breathPhase, energyLevel]
  );

  // العين اليسرى
  const leftEyePath = useDerivedValue(() => {
    const eyeW = 18 + eyeScale.value * 3;
    const eyeH = 10 + eyeScale.value * 2 + (isBlinking ? -8 : 0);
    return generateEyePath(
      CX - 22, CY - 8,
      eyeW, Math.max(1, eyeH),
      eyeGazeX.value, eyeGazeY.value
    );
  }, [eyeScale, eyeGazeX, eyeGazeY, isBlinking]);

  // العين اليمنى
  const rightEyePath = useDerivedValue(() => {
    const eyeW = 18 + eyeScale.value * 3;
    const eyeH = 10 + eyeScale.value * 2 + (isBlinking ? -8 : 0);
    return generateEyePath(
      CX + 22, CY - 8,
      eyeW, Math.max(1, eyeH),
      eyeGazeX.value, eyeGazeY.value
    );
  }, [eyeScale, eyeGazeX, eyeGazeY, isBlinking]);

  // توهج العينين
  const eyeGlowRadius = useDerivedValue(
    () => 10 + breathPhase.value * 4,
    [breathPhase]
  );

  // ═══════════════════════════════════════════════
  // الرسم النهائي
  // ═══════════════════════════════════════════════
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.container, { transform: [{ rotate: `${headTilt}deg` }] }]}
    >
      <Canvas style={{ width: ENTITY_SIZE, height: ENTITY_SIZE }}>
        <Group>
          {/* ── الطبقة 1: الضباب المحيط (Ambient Fog) ── */}
          <Circle
            cx={CX} cy={CY}
            r={ENTITY_SIZE * 0.5}
            opacity={0.04 + energyLevel.value * 0.05 + silenceLevel.value * -0.02}
          >
            <Paint><BlurMask blur={60} style="normal" /></Paint>
            <RadialGradient
              c={vec(CX, CY)} r={ENTITY_SIZE * 0.5}
              colors={[emotionColor + '25', 'transparent']}
            />
          </Circle>

          {/* ── الطبقة 2: الغشاء الحي (Fluid Membrane) ── */}
          <Path
            path={membranePath}
            color={emotionColor}
            opacity={0.1 + focusLevel.value * 0.08}
            style="fill"
          >
            <Paint><BlurMask blur={14} style="normal" /></Paint>
          </Path>
          <Path
            path={membranePath}
            color={emotionColor}
            opacity={0.2 + energyLevel.value * 0.15}
            style="stroke"
            strokeWidth={1.5}
          >
            <Paint><BlurMask blur={4} style="solid" /></Paint>
          </Path>

          {/* ── الطبقة 3: ضباب الضوء (Light Fog) ── */}
          {[0, 1, 2, 3, 4].map(i => {
            const angle = (i / 5) * Math.PI * 2 + (gazeDirection === 'user' ? 0 : gazeDirection === 'memory' ? -0.4 : 0.2);
            const dist = ENTITY_SIZE * 0.15 + energyLevel.value * ENTITY_SIZE * 0.2;
            const x = CX + Math.cos(angle) * dist;
            const y = CY + Math.sin(angle) * dist;
            return (
              <Circle
                key={i}
                cx={x} cy={y}
                r={18 + energyLevel.value * 14}
                opacity={0.06 + focusLevel.value * 0.14}
              >
                <Paint><BlurMask blur={20} style="normal" /></Paint>
                <RadialGradient
                  c={vec(x, y)} r={22}
                  colors={[emotionColor + '35', 'transparent']}
                />
              </Circle>
            );
          })}

          {/* ── الطبقة 4: الجسيمات الحية (Living Particles) ── */}
          {particles.map(p => {
            const lifeSin = Math.sin(Date.now() / 3000 + p.lifePhase);
            const currentRadius = p.orbitType === 'orbit'
              ? p.radius
              : p.orbitType === 'attract'
                ? p.radius * (0.7 + lifeSin * 0.3)
                : p.radius * (1.3 + lifeSin * 0.3);
            const px = CX + Math.cos(p.angle + Date.now() / 5000 * p.speed) * currentRadius;
            const py = CY + Math.sin(p.angle + Date.now() / 5000 * p.speed) * currentRadius;
            const particleColor = p.colorShift
              ? (warmth.value > 0.6 ? '#FFD700' : emotionColor)
              : emotionColor;
            return (
              <Circle
                key={p.id}
                cx={px} cy={py}
                r={p.size * (0.8 + energyLevel.value * 0.4)}
                color={particleColor}
                opacity={p.opacity * (0.6 + energyLevel.value * 0.5)}
              >
                <Paint><BlurMask blur={2.5} style="solid" /></Paint>
              </Circle>
            );
          })}

          {/* ── الطبقة 5: صدى الذاكرة (Memory Echo) ── */}
          {memoryEchoIntensity.value > 0.01 && (
            <>
              <Circle
                cx={CX} cy={CY}
                r={ENTITY_SIZE * 0.22 * memoryEchoIntensity.value}
                opacity={memoryEchoIntensity.value * 0.35}
              >
                <Paint style="stroke" strokeWidth={1.5} />
                <BlurMask blur={10} style="normal" />
                <RadialGradient
                  c={vec(CX, CY)} r={ENTITY_SIZE * 0.22}
                  colors={['#FFFFFF40', '#FFFFFF10', 'transparent']}
                />
              </Circle>
              {/* ومضات ذاكرة جانبية */}
              {[0, 1, 2].map(i => {
                const mAngle = (i / 3) * Math.PI * 2 + Date.now() / 3000;
                const mDist = ENTITY_SIZE * 0.25 * memoryEchoIntensity.value;
                const mx = CX + Math.cos(mAngle) * mDist;
                const my = CY + Math.sin(mAngle) * mDist;
                return (
                  <Circle key={`m-${i}`} cx={mx} cy={my} r={3} color="#FFFFFF" opacity={0.4}>
                    <Paint><BlurMask blur={2} style="solid" /></Paint>
                  </Circle>
                );
              })}
            </>
          )}

          {/* ── الطبقة 6: حقل النية (Intent Field) ── */}
          {intentIntensity.value > 0.01 && (
            <Circle
              cx={CX} cy={CY}
              r={ENTITY_SIZE * 0.28}
              opacity={intentIntensity.value * 0.3}
            >
              <Paint style="stroke" strokeWidth={1.8} />
              <BlurMask blur={12} style="normal" />
              <SweepGradient
                c={vec(CX, CY)}
                colors={[emotionColor + '40', '#FFFFFF30', emotionColor + '40']}
              />
            </Circle>
          )}

          {/* ── الطبقة 7: نواة البلازما (Plasma Core) ── */}
          <Circle cx={CX} cy={CY} r={coreRadius} color={emotionColor} opacity={0.8 * warmth.value}>
            <Paint><BlurMask blur={10} style="solid" /></Paint>
          </Circle>
          <Circle cx={CX} cy={CY} r={4 + breathPhase.value * 3} color="#FFFFFF" opacity={0.6}>
            <Paint><BlurMask blur={3} style="solid" /></Paint>
          </Circle>

          {/* ── الطبقة 8: العينان (The Eyes) ── */}
          {/* توهج خلف العينين */}
          <Circle cx={CX - 22} cy={CY - 8} r={eyeGlowRadius} color={emotionColor} opacity={0.15}>
            <Paint><BlurMask blur={8} style="normal" /></Paint>
          </Circle>
          <Circle cx={CX + 22} cy={CY - 8} r={eyeGlowRadius} color={emotionColor} opacity={0.15}>
            <Paint><BlurMask blur={8} style="normal" /></Paint>
          </Circle>

          {/* العين اليسرى */}
          <Path path={leftEyePath} color={emotionColor} opacity={0.9} style="fill">
            <Paint><BlurMask blur={1.5} style="solid" /></Paint>
          </Path>
          <Path path={leftEyePath} color="#FFFFFF" opacity={0.3} style="stroke" strokeWidth={0.8}>
            <Paint><BlurMask blur={1} style="solid" /></Paint>
          </Path>

          {/* العين اليمنى */}
          <Path path={rightEyePath} color={emotionColor} opacity={0.9} style="fill">
            <Paint><BlurMask blur={1.5} style="solid" /></Paint>
          </Path>
          <Path path={rightEyePath} color="#FFFFFF" opacity={0.3} style="stroke" strokeWidth={0.8}>
            <Paint><BlurMask blur={1} style="solid" /></Paint>
          </Path>

          {/* بؤبؤ العين (نقطة ضوء بيضاء) */}
          <Circle
            cx={CX - 22 + eyeGazeX.value * 1.5}
            cy={CY - 8 + eyeGazeY.value * 1.5}
            r={2.5 + eyeScale.value * 0.3}
            color="#FFFFFF"
            opacity={0.7}
          >
            <Paint><BlurMask blur={1} style="solid" /></Paint>
          </Circle>
          <Circle
            cx={CX + 22 + eyeGazeX.value * 1.5}
            cy={CY - 8 + eyeGazeY.value * 1.5}
            r={2.5 + eyeScale.value * 0.3}
            color="#FFFFFF"
            opacity={0.7}
          >
            <Paint><BlurMask blur={1} style="solid" /></Paint>
          </Circle>

          {/* ── تموجات الصمت (Silence Ripples) ── */}
          {silenceLevel.value > 0.3 && (
            <Circle
              cx={CX} cy={CY}
              r={ENTITY_SIZE * 0.3}
              opacity={silenceLevel.value * 0.2}
            >
              <Paint style="stroke" strokeWidth={0.5} />
              <BlurMask blur={20} style="normal" />
              <RadialGradient
                c={vec(CX, CY)} r={ENTITY_SIZE * 0.3}
                colors={['#FFFFFF15', 'transparent']}
              />
            </Circle>
          )}
        </Group>
      </Canvas>
    </Pressable>
  );
}


// ═══════════════════════════════════════════════
// الأنماط
// ═══════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    width: ENTITY_SIZE,
    height: ENTITY_SIZE,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

