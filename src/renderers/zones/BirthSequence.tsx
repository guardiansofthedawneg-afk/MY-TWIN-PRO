import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Dimensions, StatusBar } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, withRepeat, Easing } from 'react-native-reanimated';
import { audioEngine } from '../../core/AudioEngine';
import { RADIUS } from '../../design/tokens/spacing';
import { useRTL } from '../../../lib/useRTL';

const { width, height } = Dimensions.get('window');
const LOGO_SIZE = 80;

type BirthPhase = 'void' | 'logo_appear' | 'first_pulse' | 'universe_born' | 'transform' | 'halo' | 'eyes' | 'complete';

const PARTICLE_COUNT = 30;

function generateParticles(centerX: number, centerY: number) {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 40 + Math.random() * (Math.min(width, height) * 0.6);
    return {
      id: i, x: centerX + Math.cos(angle) * distance, y: centerY + Math.sin(angle) * distance,
      size: 1.5 + Math.random() * 3, opacity: 0.15 + Math.random() * 0.35, delay: 2000 + Math.random() * 2000,
    };
  });
}

export default function BirthSequence({ onComplete }: { onComplete: () => void }) {
  const rtl = useRTL();
  const [phase, setPhase] = useState<BirthPhase>('void');
  const [particles] = useState(() => generateParticles(width / 2, height / 2));

  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.3);
  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.5);
  const universeOpacity = useSharedValue(0);
  const coreBorderRadius = useSharedValue(20);
  const haloOpacity = useSharedValue(0);
  const haloScale = useSharedValue(0.3);
  const eyesOpacity = useSharedValue(0);

  useEffect(() => {
    StatusBar.setHidden(true);
    const t1 = setTimeout(() => { setPhase('logo_appear'); audioEngine.play('startup_birth'); }, 600);
    const t2 = setTimeout(() => { setPhase('first_pulse'); audioEngine.play('first_breath'); }, 1800);
    const t3 = setTimeout(() => { setPhase('universe_born'); audioEngine.play('awakening_glow'); }, 4500);
    const t4 = setTimeout(() => setPhase('transform'), 7000);
    const t5 = setTimeout(() => setPhase('halo'), 8500);
    const t6 = setTimeout(() => { setPhase('eyes'); audioEngine.play('eyes_open'); }, 10000);
    const t7 = setTimeout(() => { setPhase('complete'); StatusBar.setHidden(false); onComplete(); }, 13000);
    return () => [t1, t2, t3, t4, t5, t6, t7].forEach(clearTimeout);
  }, [onComplete]);

  useEffect(() => {
    if (phase === 'logo_appear') {
      logoOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
      logoScale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.back(1.2)) });
    }
    if (phase === 'first_pulse') {
      glowOpacity.value = withRepeat(withSequence(withTiming(0.35, { duration: 1200 }), withTiming(0.1, { duration: 1200 })), 2);
      glowScale.value = withSequence(withTiming(1.5, { duration: 600 }), withTiming(1.0, { duration: 600 }));
    }
    if (phase === 'universe_born') universeOpacity.value = withTiming(0.7, { duration: 2000, easing: Easing.out(Easing.ease) });
    if (phase === 'transform') {
      coreBorderRadius.value = withTiming(100, { duration: 1500, easing: Easing.inOut(Easing.ease) });
      logoScale.value = withTiming(0.75, { duration: 1500 });
    }
    if (phase === 'halo') {
      haloOpacity.value = withTiming(0.5, { duration: 1000 });
      haloScale.value = withTiming(1.0, { duration: 1200, easing: Easing.out(Easing.back(1.1)) });
    }
    if (phase === 'eyes') eyesOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) });
  }, [phase]);

  return (
    <View style={styles.container}>
      {phase === 'void' && <View style={styles.void} />}
      {(phase === 'universe_born' || phase === 'transform' || phase === 'halo' || phase === 'eyes') && (
        <Animated.View style={[styles.universe, { opacity: universeOpacity }]}>
          {particles.map(p => (
            <View key={p.id} style={[styles.particle, { left: p.x, top: p.y, width: p.size, height: p.size, borderRadius: p.size / 2, opacity: p.opacity, backgroundColor: '#B8A0D0' }]} />
          ))}
        </Animated.View>
      )}
      <View style={styles.center}>
        {(phase === 'first_pulse' || phase === 'universe_born' || phase === 'transform' || phase === 'halo' || phase === 'eyes') && (
          <Animated.View style={[styles.glow, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />
        )}
        {(phase === 'halo' || phase === 'eyes') && <Animated.View style={[styles.halo, { opacity: haloOpacity, transform: [{ scale: haloScale }] }]} />}
        {phase !== 'void' && phase !== 'complete' && (
          <Animated.View style={[styles.coreContainer, { borderRadius: coreBorderRadius, opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
            {phase === 'transform' || phase === 'halo' || phase === 'eyes' ? (
              <Animated.View style={[styles.livingCore, { opacity: eyesOpacity }]}>
                {phase === 'eyes' && <View style={styles.eyesRow}><View style={styles.eye} /><View style={styles.eye} /></View>}
              </Animated.View>
            ) : (
              <Image source={require('../../../assets/brand/logo.png')} style={styles.logo} resizeMode="contain" />
            )}
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' },
  void: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000000' },
  center: { justifyContent: 'center', alignItems: 'center' },
  coreContainer: { width: LOGO_SIZE, height: LOGO_SIZE, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  logo: { width: LOGO_SIZE, height: LOGO_SIZE, tintColor: '#B8A0D0' },
  livingCore: { width: 60, height: 60, borderRadius: RADIUS.avatar, backgroundColor: '#E8D8F8', justifyContent: 'center', alignItems: 'center' },
  eyesRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  eye: { width: 10, height: 8, borderRadius: 2, backgroundColor: '#1A1030', marginHorizontal: 8 },
  glow: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: '#B8A0D0' },
  halo: { position: 'absolute', width: 160, height: 160, borderRadius: 80, borderWidth: 1, borderColor: 'rgba(184,160,208,0.4)' },
  universe: { ...StyleSheet.absoluteFillObject },
  particle: { position: 'absolute' },
});
