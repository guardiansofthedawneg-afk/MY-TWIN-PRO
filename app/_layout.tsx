import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet, Animated, View,
  Pressable, useWindowDimensions, ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// ✅ لا يوجد أي import من store هنا
// الـ store يُستخدم فقط داخل AppLayout بعد SafeAreaProvider

function AppLayout() {
  // ✅ كل الـ hooks داخل component واحد بعد SafeAreaProvider
  const [storeReady,    setStoreReady]    = useState(false);
  const [menuVisible,   setMenuVisible]   = useState(false);
  const [SideMenuComp,  setSideMenuComp]  = useState<any>(null);
  const [menuMounted,   setMenuMounted]   = useState(false);
  const [isDark,        setIsDark]        = useState(false);
  const [isRTL,         setIsRTL]         = useState(false);
  const [emotion,       setEmotion]       = useState('neutral');

  const { width: SCREEN_W } = useWindowDimensions();
  const safeW = SCREEN_W > 0 ? SCREEN_W : 400;

  // Animated values
  const mainX = useRef(new Animated.Value(0)).current;
  const mainS = useRef(new Animated.Value(1)).current;
  const mainB = useRef(new Animated.Value(0)).current;
  const menuX = useRef(new Animated.Value(-safeW)).current;
  const menuO = useRef(new Animated.Value(0)).current;
  const bgO   = useRef(new Animated.Value(0)).current;

  // ✅ تهيئة الـ store بعد mount بأمان
  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | null = null;

    const initStore = async () => {
      try {
        const { useTwinStore } = require('../store/useTwinStore');
        const store = useTwinStore.getState();

        if (!mounted) return;

        // قراءة القيم الأولية
        setIsDark(store.theme === 'dark');
        setIsRTL(store.lang === 'ar');
        setMenuVisible(store.menuVisible || false);

        // طاقة → مشاعر
        const energy = store.twinEnergy ?? 100;
        if      (energy > 80) setEmotion('joy');
        else if (energy > 50) setEmotion('neutral');
        else if (energy > 30) setEmotion('sadness');
        else                  setEmotion('fear');

        // ✅ subscribe للتغييرات
        unsubscribe = useTwinStore.subscribe((state: any) => {
          if (!mounted) return;
          setIsDark(state.theme === 'dark');
          setIsRTL(state.lang === 'ar');
          setMenuVisible(state.menuVisible || false);

          const e = state.twinEnergy ?? 100;
          if      (e > 80) setEmotion('joy');
          else if (e > 50) setEmotion('neutral');
          else if (e > 30) setEmotion('sadness');
          else             setEmotion('fear');
        });

        setStoreReady(true);

        // تحميل SideMenu بعد store
        setTimeout(() => {
          if (!mounted) return;
          try {
            const mod = require('../components/SideMenu');
            if (mod?.default) setSideMenuComp(() => mod.default);
          } catch (e) {
            console.warn('[Layout] SideMenu load failed');
          }
        }, 500);

      } catch (e) {
        console.warn('[Layout] Store init failed:', e);
        setStoreReady(true); // نكمل حتى بدون store
      }
    };

    initStore();
    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  // ✅ إعادة ضبط عند تغيير RTL
  useEffect(() => {
    if (!menuVisible) {
      menuX.setValue(isRTL ? safeW : -safeW);
      mainX.setValue(0);
    }
  }, [isRTL, safeW]);

  // ✅ Animation القائمة
  useEffect(() => {
    if (!storeReady) return;
    if (menuVisible) setMenuMounted(true);

    const mainTarget  = menuVisible ? (isRTL ? -safeW * 0.72 : safeW * 0.72) : 0;
    const menuTarget  = menuVisible ? 0 : (isRTL ? safeW : -safeW);
    const scaleTarget = menuVisible ? 0.88 : 1;
    const opacTarget  = menuVisible ? 1 : 0;

    Animated.parallel([
      Animated.spring(mainX, { toValue: mainTarget,  damping: 22, stiffness: 160, useNativeDriver: true }),
      Animated.spring(mainS, { toValue: scaleTarget, damping: 22, stiffness: 160, useNativeDriver: true }),
      Animated.spring(menuX, { toValue: menuTarget,  damping: 22, stiffness: 160, useNativeDriver: true }),
      Animated.timing(menuO, { toValue: opacTarget,  duration: 200,               useNativeDriver: true }),
      Animated.timing(bgO,   { toValue: opacTarget,  duration: 200,               useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished && !menuVisible) setMenuMounted(false);
    });

    Animated.spring(mainB, {
      toValue: menuVisible ? 20 : 0,
      damping: 22, stiffness: 160, useNativeDriver: false,
    }).start();
  }, [menuVisible, isRTL, safeW, storeReady]);

  // ✅ Particle background
  const EMOTION_COLORS: Record<string, string> = {
    joy: '#FFD700', sadness: '#4A90E2', neutral: '#7C3AED',
    fear: '#9C27B0', love: '#E91E63', anger: '#FF3B30',
  };

  const handleCloseMenu = useCallback(() => {
    try {
      const { useTwinStore } = require('../store/useTwinStore');
      useTwinStore.getState().closeMenu?.();
    } catch {}
    setMenuVisible(false);
  }, []);

  // ✅ شاشة تحميل بسيطة
  if (!storeReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0014', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* خلفية عاطفية */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: EMOTION_COLORS[emotion] ?? '#7C3AED', opacity: bgO.interpolate({ inputRange: [0,1], outputRange: [0.04, 0.07] }) },
        ]}
        pointerEvents="none"
      />

      {/* القائمة الجانبية */}
      {menuMounted && (
        <Animated.View style={[
          st.menu,
          {
            width:      safeW,
            right:      isRTL ? 0 : undefined,
            left:       isRTL ? undefined : 0,
            opacity:    menuO,
            transform:  [{ translateX: menuX }],
            backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
          },
        ]}
          pointerEvents={menuVisible ? 'auto' : 'none'}
        >
          {SideMenuComp
            ? <SideMenuComp onClose={handleCloseMenu} />
            : <View style={st.loading}><ActivityIndicator color="#7C3AED" size="large" /></View>
          }
        </Animated.View>
      )}

      {/* الشاشة الرئيسية */}
      <Animated.View style={[
        st.main,
        {
          transform:    [{ translateX: mainX }, { scale: mainS }],
          borderRadius: mainB,
          overflow:     'hidden',
          shadowColor:   '#000',
          shadowOffset:  { width: isRTL ? 4 : -4, height: 0 },
          shadowOpacity: menuVisible ? 0.3 : 0,
          shadowRadius:  12,
          elevation:     menuVisible ? 20 : 0,
        },
      ]}>
        <Stack screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 150 }}>
          <Stack.Screen name="index"                       />
          <Stack.Screen name="splash"                      />
          <Stack.Screen name="login"                       />
          <Stack.Screen name="twin-mind"                   />
          <Stack.Screen name="chat"                        />
          <Stack.Screen name="onboarding"                  />
          <Stack.Screen name="museum"                      />
          <Stack.Screen name="memories"                    />
          <Stack.Screen name="relationship"                />
          <Stack.Screen name="stories"                     />
          <Stack.Screen name="profile"                     />
          <Stack.Screen name="settings"                    />
          <Stack.Screen name="subscription"                />
          <Stack.Screen name="referral"                    />
          <Stack.Screen name="features/index"              />
          <Stack.Screen name="features/study-mode"         />
          <Stack.Screen name="features/code-lab"           />
          <Stack.Screen name="features/business-analyzer"  />
          <Stack.Screen name="features/life-coach"         />
          <Stack.Screen name="features/image-creator"      />
          <Stack.Screen name="features/dreams"             />
          <Stack.Screen name="features/content-creator"    />
          <Stack.Screen name="features/smart-home"         />
          <Stack.Screen name="features/task-manager"       />
        </Stack>
      </Animated.View>

      {/* طبقة الإغلاق */}
      {menuVisible && (
        <Pressable
          style={[
            st.overlay,
            isRTL
              ? { right: safeW * 0.72, left: 0 }
              : { left:  safeW * 0.72, right: 0 },
          ]}
          onPress={handleCloseMenu}
        />
      )}
    </>
  );
}

// ✅ SafeAreaProvider يلف كل شيء
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppLayout />
    </SafeAreaProvider>
  );
}

const st = StyleSheet.create({
  main:    { flex: 1, backgroundColor: '#000' },
  menu:    { position: 'absolute', top: 0, bottom: 0, zIndex: 50, elevation: 10 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: { position: 'absolute', top: 0, bottom: 0, zIndex: 200, elevation: 25 },
});
