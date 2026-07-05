import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Animated, View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTwinStore } from "../store/useTwinStore";
import { ErrorBoundary } from "../components/ErrorBoundary";
import SideMenu from '../components/SideMenu';
import Header from '../components/Header';
import { Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { apiGet } from '../lib/httpClient';

const EMOTION_COLORS: Record<string, string> = {
  joy: '#FFD700', sadness: '#4A90E2', neutral: '#7C3AED', fear: '#9C27B0', love: '#E91E63', anger: '#FF3B30'
};

/* ============================================================
   حقل الجسيمات العاطفي
   ============================================================ */
const ParticleField = React.memo(({ emotion }: { emotion: string }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const color = EMOTION_COLORS[emotion] || EMOTION_COLORS.neutral;
  useEffect(() => {
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 0.08, duration: 3000, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.02, duration: 3000, useNativeDriver: true })
    ]));
    pulse.start();
    return () => pulse.stop();
  }, [emotion]);
  return <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: color, opacity }]} pointerEvents="none" />;
});

/* ============================================================
   بطاقة الوعي الذكية
   ============================================================ */
const ConsciousnessCard = React.memo(({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const router = useRouter();
  const userId = useTwinStore(s => s.userId);
  const lang = useTwinStore(s => s.lang);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [notification, setNotification] = useState<any>(null);

  useEffect(() => {
    if (!visible || !userId) return;
    let cancelled = false;
    const fetchData = async () => {
      try {
        const res = await apiGet(`/api/awareness/check?user_id=${userId}&lang=${lang}`);
        if (!cancelled && res?.notification) {
          setNotification(res.notification);
          Animated.spring(fadeAnim, { toValue: 1, friction: 8, useNativeDriver: true }).start();
        }
      } catch (e) {}
    };
    fetchData();
    return () => { cancelled = true; };
  }, [visible, userId, lang]);

  if (!visible || !notification) return null;

  return (
    <Animated.View style={[
      st.card,
      {
        opacity: fadeAnim,
        transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0,1], outputRange: [50, 0] }) }]
      }
    ]}>
      <TouchableOpacity style={st.cardInner} activeOpacity={0.8} onPress={() => { router.push('/chat'); onClose(); }}>
        <Sparkles size={18} stroke="#7C3AED" />
        <View style={{ flex: 1 }}>
          <Text style={st.cardTitle} numberOfLines={1}>{notification.title}</Text>
          <Text style={st.cardBody} numberOfLines={2}>{notification.body}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={onClose} style={st.cardClose} hitSlop={{ top:10, bottom:10, left:10, right:10 }}>
        <Text style={{ color: '#A78BFA', fontWeight: '700', fontSize: 16 }}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

/* ============================================================
   المكون الجذري — محصّن ضد أي crash
   ============================================================ */
export default function RootLayout() {
  const hasHydrated = useTwinStore(s => s.hasHydrated);
  const theme = useTwinStore(s => s.theme);
  const twinEnergy = useTwinStore(s => s.twinEnergy);
  const menuVisible = useTwinStore(s => s.menuVisible);
  const closeMenu = useTwinStore(s => s.closeMenu);
  const userId = useTwinStore(s => s.userId);
  const isDark = theme === 'dark';
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [showConsciousnessCard, setShowConsciousnessCard] = useState(false);

  useEffect(() => {
    if (twinEnergy > 80) setCurrentEmotion('joy');
    else if (twinEnergy > 50) setCurrentEmotion('neutral');
    else if (twinEnergy > 30) setCurrentEmotion('sadness');
    else setCurrentEmotion('fear');
  }, [twinEnergy]);

  useEffect(() => {
    if (!userId) return;
    const firstCheck = setTimeout(() => setShowConsciousnessCard(true), 10 * 60 * 1000);
    const interval = setInterval(() => setShowConsciousnessCard(true), 60 * 60 * 1000);
    return () => { clearTimeout(firstCheck); clearInterval(interval); };
  }, [userId]);

  const handleCloseCard = useCallback(() => setShowConsciousnessCard(false), []);
  const handleCloseMenu = useCallback(() => {
    if (typeof closeMenu === 'function') closeMenu();
  }, [closeMenu]);

  // 🛡️ شاشة التحميل — تمنع White Screen نهائياً
  if (!hasHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0014' }}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={{ color: '#A78BFA', marginTop: 16, fontSize: 14 }}>جاري تهيئة الوعي...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ParticleField emotion={currentEmotion} />

        <SideMenu visible={menuVisible} onClose={handleCloseMenu}>
          <Stack
            screenOptions={{
              headerShown: true,
              header: () => <Header />,
              animation: 'fade',
              animationDuration: 150,
              contentStyle: { backgroundColor: isDark ? '#0A0014' : '#FAFAF8' },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="splash" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="twin-mind" />
            <Stack.Screen name="chat" />
            <Stack.Screen name="museum" />
            <Stack.Screen name="memories" />
            <Stack.Screen name="relationship" />
            <Stack.Screen name="stories" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="subscription" />
            <Stack.Screen name="referral" />
            <Stack.Screen name="features/index" />
            <Stack.Screen name="features/study-mode" />
            <Stack.Screen name="features/code-lab" />
            <Stack.Screen name="features/business-analyzer" />
            <Stack.Screen name="features/life-coach" />
            <Stack.Screen name="features/image-creator" />
            <Stack.Screen name="features/dreams" />
            <Stack.Screen name="features/content-creator" />
            <Stack.Screen name="features/smart-home" />
            <Stack.Screen name="features/task-manager" />
          </Stack>
        </SideMenu>

        <ConsciousnessCard visible={showConsciousnessCard} onClose={handleCloseCard} />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const st = StyleSheet.create({
  card: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#1A1226',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#7C3AED',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10000,
    elevation: 20,
  },
  cardInner: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardTitle: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  cardBody: { color: '#A78BFA', fontSize: 12, marginTop: 3, lineHeight: 18 },
  cardClose: { padding: 8 },
});
