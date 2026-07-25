import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { bootstrapCoordinator } from '../src/core/BootstrapCoordinator';
import LivingLightEntity from '../src/renderers/zones/LivingLightEntity';
import AmbientField from '../src/world/AmbientField';

export default function Index() {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // ظهور تدريجي للكيان الحي
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start();

    // بدء الإقلاع مع معالجة الأخطاء
    const boot = async () => {
      try {
        const result = await bootstrapCoordinator.bootstrap();
        // انتظار قصير ليشعر المستخدم بالحضور
        setTimeout(() => {
          if (result.isReturning) {
            router.replace('/living-world');
          } else {
            router.replace('/genesis');
          }
        }, 2000);
      } catch (e) {
        console.warn('[Index] Bootstrap failed, going to genesis:', e);
        // حتى لو فشل الإقلاع، ننتقل إلى genesis بعد تأخير
        setTimeout(() => {
          router.replace('/genesis');
        }, 3000);
      }
    };
    
    boot();
  }, []);

  return (
    <View style={styles.container}>
      <AmbientField />
      <Animated.View style={[styles.entityContainer, { opacity: fadeIn }]}>
        <LivingLightEntity />
      </Animated.View>
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
  entityContainer: {
    position: 'absolute',
    top: '35%',
  },
});
