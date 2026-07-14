import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { router } from 'expo-router';
import { bootstrapCoordinator, BootstrapPhase } from '../src/core/BootstrapCoordinator';
import SoulPulse from '../src/renderers/zones/SoulPulse';
import BreathingGlow from '../src/renderers/zones/BreathingGlow';

export default function Index() {
  const [phase, setPhase] = useState<BootstrapPhase>('void');
  const opacity = useRef(new Animated.Value(0)).current;
  const messageOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // ظهور تدريجي للطبقات
    Animated.timing(opacity, {
      toValue: 1,
      duration: 1500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // بدء رحلة الإقلاع
    bootstrap();
  }, []);

  const bootstrap = async () => {
    const result = await bootstrapCoordinator.bootstrap();
    setPhase(result.phase);

    // ظهور رسالة "وجدتك." أو "لنبدأ."
    Animated.timing(messageOpacity, {
      toValue: 1,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // الانتقال إلى الوجهة المناسبة بعد 3 ثوانٍ
    setTimeout(() => {
      if (result.isReturning) {
        // ✅ تم تصحيح المسار ليشير مباشرة إلى شاشة LivingWorld الحقيقية
        router.replace('/living-world');
      } else {
        router.replace('/genesis');
      }
    }, 3000);
  };

  const getMessage = () => {
    if (phase === 'searching') return 'أبحث عن حضورك...';
    if (phase === 'found') return 'وجدتك.';
    if (phase === 'new_journey') return 'لنبدأ من البداية.';
    return '';
  };

  return (
    <View style={styles.container}>
      {/* طبقات الحضور الحية */}
      <Animated.View style={[styles.pulseContainer, { opacity }]}>
        <SoulPulse />
      </Animated.View>
      
      <Animated.View style={[styles.breathContainer, { opacity }]}>
        <BreathingGlow
          color={phase === 'found' ? '#A78BFA' : '#7C3AED'}
          speed={phase === 'searching' ? 1.4 : 0.8}
        />
      </Animated.View>

      {/* الكلمة الحية */}
      {phase !== 'void' && (
        <Animated.View style={[styles.messageContainer, { opacity: messageOpacity }]}>
          <Text style={styles.message}>{getMessage()}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0014',
  },
  pulseContainer: {
    position: 'absolute',
    top: '40%',
  },
  breathContainer: {
    position: 'absolute',
    top: '45%',
  },
  messageContainer: {
    position: 'absolute',
    bottom: '25%',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  message: {
    color: '#E8E0F0',
    fontSize: 28,
    fontWeight: '300',
    textAlign: 'center',
    letterSpacing: 1.5,
  },
});
