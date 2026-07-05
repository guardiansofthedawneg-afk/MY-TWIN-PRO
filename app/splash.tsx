import React, { useEffect, useRef } from 'react';
import {
  View, Image, Text, StyleSheet, Animated, Dimensions, StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

const SPLASH_BG = require('../assets/splash.png');
const LOGO = require('../assets/logo.png');
const { width, height } = Dimensions.get('window');

// 🛡️ ثوابت بدلاً من useTheme (لتجنب flash)
const DARK_BG = '#0A0014';
const LIGHT_BG = '#FAFAF8';
const TEXT_DARK = '#FFFFFF';
const TEXT_LIGHT = '#1A1226';
const SUB_DARK = 'rgba(255, 255, 255, 0.85)';
const SUB_LIGHT = 'rgba(26, 18, 38, 0.8)';

const NeuronNetwork = ({ isDark }: { isDark: boolean }) => {
  // ... نفس الكود ...
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* ... */}
    </View>
  );
};

export default function Splash() {
  // 🛡️ اقرأ theme من AsyncStorage مباشرة (بدون useTwinStore)
  const [isDark, setIsDark] = React.useState(true);
  
  useEffect(() => {
    AsyncStorage.getItem('mytwin-store-v4').then((stored) => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed?.state?.theme === 'light') setIsDark(false);
        } catch (e) {}
      }
    });
  }, []);

  const logoScale = useRef(new Animated.Value(0.2)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const byOpacity = useRef(new Animated.Value(0)).current;

  const textColor = isDark ? TEXT_DARK : TEXT_LIGHT;
  const subColor = isDark ? SUB_DARK : SUB_LIGHT;
  const bgColor = isDark ? DARK_BG : LIGHT_BG;

  useEffect(() => {
    let soundObject: Audio.Sound | null = null;
    let isMounted = true;

    const initSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../assets/start.mp3'),
          { shouldPlay: false }
        );
        if (!isMounted) { sound.unloadAsync().catch(() => {}); return; }
        soundObject = sound;
        await sound.playAsync().catch(() => {});
      } catch (e) {}
    };

    initSound();

    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
      Animated.timing(titleOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(byOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(async () => {
      if (!isMounted) return;
      try {
        if (soundObject) {
          await soundObject.stopAsync().catch(() => {});
          await soundObject.unloadAsync().catch(() => {});
        }
      } catch (e) {}
      
      try {
        const storedUserId = await AsyncStorage.getItem('mytwin-user');
        if (!isMounted) return;
        router.replace(storedUserId ? '/twin-mind' : '/login');
      } catch (e) {
        if (!isMounted) return;
        router.replace('/login');
      }
    }, 6000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (soundObject) soundObject.unloadAsync().catch(() => {});
    };
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar hidden />
      {isDark && <Image source={SPLASH_BG} style={styles.bgImage} resizeMode="cover" />}
      <NeuronNetwork isDark={isDark} />
      <View style={styles.content}>
        <Animated.View style={[styles.logoWrapper, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
          <View style={[styles.logoGlow, isDark && styles.logoGlowDark]}>
            <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          </View>
        </Animated.View>
        <Animated.Text style={[styles.appName, { opacity: titleOpacity, color: textColor }]}>
          My Twin
        </Animated.Text>
        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity, color: subColor }]}>
          Your Twin AI .. Always There
        </Animated.Text>
      </View>
      <Animated.View style={[styles.footer, { opacity: byOpacity }]}>
        <Text style={[styles.by, { color: '#FBBF24' }]}>By SOULSYNC</Text>
        <Text style={[styles.copy, { color: subColor }]}>© 2026 Soul Sync Ltd.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bgImage: { position: 'absolute', width, height },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  logoWrapper: { marginBottom: 25 },
  logoGlow: {
    shadowColor: '#A855F7', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 10,
  },
  logoGlowDark: { shadowOpacity: 0.9, shadowRadius: 30, elevation: 25 },
  logo: { width: 170, height: 170, borderRadius: 34 },
  appName: { fontSize: 48, fontWeight: '900', letterSpacing: 2, textShadowColor: 'rgba(168, 85, 247, 0.8)', textShadowRadius: 25, marginBottom: 15 },
  tagline: { fontSize: 16, fontWeight: '500', letterSpacing: 2, textAlign: 'center', paddingHorizontal: 40, marginBottom: 40 },
  footer: { position: 'absolute', bottom: 70, alignItems: 'center', zIndex: 10 },
  by: { fontSize: 17, fontWeight: '700', letterSpacing: 5, textTransform: 'uppercase', marginBottom: 10 },
  copy: { fontSize: 12 },
});
