import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';

export default function Index() {
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      router.replace('/genesis');
    }, 2000);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.core, { opacity: fadeIn }]}>
        <View style={styles.light} />
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
  core: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#A855F740',
    justifyContent: 'center',
    alignItems: 'center',
  },
  light: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#A855F7',
    opacity: 0.8,
  },
});
