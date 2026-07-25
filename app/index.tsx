import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { bootstrapCoordinator } from '../src/core/BootstrapCoordinator';
import LivingLightEntity from '../src/renderers/zones/LivingLightEntity';
import AmbientField from '../src/world/AmbientField';

export default function Index() {
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // ظهور تدريجي للكيان
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start();

    // بدء الإقلاع
    bootstrapCoordinator.bootstrap().then(result => {
      setTimeout(() => {
        if (result.isReturning) {
          router.replace('/living-world');
        } else {
          router.replace('/genesis');
        }
      }, 1500);
    }).catch(() => {
      // حتى لو فشل الإقلاع، ننتقل إلى genesis
      setTimeout(() => {
        router.replace('/genesis');
      }, 3000);
    });
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
