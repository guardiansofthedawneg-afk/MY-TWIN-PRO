import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet, Animated, View, Pressable,
  useWindowDimensions, ActivityIndicator,
} from 'react-native';
import { useTwinStore } from '../store/useTwinStore';
import { ErrorBoundary } from '../components/ErrorBoundary';

export default function RootLayout() {
  const theme       = useTwinStore(s => s.theme);
  const twinEnergy  = useTwinStore(s => s.twinEnergy);
  const menuVisible = useTwinStore(s => s.menuVisible);
  const closeMenu   = useTwinStore(s => s.closeMenu);
  const lang        = useTwinStore(s => s.lang);

  const isDark = theme === 'dark';
  const isRTL  = lang === 'ar';

  const { width: SCREEN_W } = useWindowDimensions();
  // حماية: إذا كانت الأبعاد صفر (بداية التشغيل)، استخدم قيمة افتراضية
  const safeWidth = SCREEN_W > 0 ? SCREEN_W : 400;
  const MENU_W = safeWidth; // القائمة تأخذ العرض الكامل

  // Animated values
  const mainTranslateX = useRef(new Animated.Value(0)).current;
  const mainScale      = useRef(new Animated.Value(1)).current;
  const mainBorder     = useRef(new Animated.Value(0)).current;
  const menuTranslateX = useRef(new Animated.Value(isRTL ? MENU_W : -MENU_W)).current;
  const menuOpacity    = useRef(new Animated.Value(0)).current;

  const [SideMenuComp, setSideMenuComp] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const mod = require('../components/SideMenu');
        if (mod?.default) setSideMenuComp(() => mod.default);
      } catch (e) {
        console.warn('[Layout] SideMenu load failed:', e);
      }
    }, 300);
    return () => clearTimeout(t);
  }, []);

  // تحديث القيم عند تغيير اللغة أو الأبعاد
  useEffect(() => {
    if (!menuVisible) {
      menuTranslateX.setValue(isRTL ? MENU_W : -MENU_W);
      mainTranslateX.setValue(0);
    }
  }, [isRTL, MENU_W]);

  // تشغيل الأنيميشن بأمان تام
  useEffect(() => {
    const mainTarget   = menuVisible ? (isRTL ? -safeWidth * 0.72 : safeWidth * 0.72) : 0;
    const menuTarget   = menuVisible ? 0 : (isRTL ? safeWidth : -safeWidth);
    const scaleTarget  = menuVisible ? 0.88 : 1;
    const borderTarget = menuVisible ? 20 : 0;
    const opacTarget   = menuVisible ? 1 : 0;

    // لا تشغل الأنيميشن إذا كانت القيم غير صالحة
    if (isNaN(mainTarget) || isNaN(menuTarget) || isNaN(scaleTarget)) {
      return;
    }

    Animated.parallel([
      Animated.spring(mainTranslateX, {
        toValue: mainTarget, damping: 22, stiffness: 160, useNativeDriver: true,
      }),
      Animated.spring(mainScale, {
        toValue: scaleTarget, damping: 22, stiffness: 160, useNativeDriver: true,
      }),
      Animated.spring(menuTranslateX, {
        toValue: menuTarget, damping: 22, stiffness: 160, useNativeDriver: true,
      }),
      Animated.timing(menuOpacity, {
        toValue: opacTarget, duration: 200, useNativeDriver: true,
      }),
    ]).start();

    Animated.spring(mainBorder, {
      toValue: borderTarget, damping: 22, stiffness: 160, useNativeDriver: false,
    }).start();
  }, [menuVisible, isRTL, safeWidth]);

  const handleCloseMenu = useCallback(() => closeMenu?.(), [closeMenu]);

  return (
    <ErrorBoundary>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* القائمة الجانبية المنزلقة */}
      <Animated.View
        style={[
          st.menuContainer,
          {
            width:     MENU_W,
            right:     isRTL ? 0 : undefined,
            left:      isRTL ? undefined : 0,
            opacity:   menuOpacity,
            transform: [{ translateX: menuTranslateX }],
            backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
          },
        ]}
        pointerEvents={menuVisible ? 'auto' : 'none'}
      >
        {SideMenuComp ? (
          <SideMenuComp onClose={handleCloseMenu} />
        ) : (
          <View style={st.menuLoading}>
            <ActivityIndicator color="#7C3AED" size="large" />
          </View>
        )}
      </Animated.View>

      {/* الشاشة الرئيسية */}
      <Animated.View style={[
        st.mainScreen,
        {
          transform: [
            { translateX: mainTranslateX },
            { scale:      mainScale      },
          ],
          borderRadius: mainBorder,
          overflow:     'hidden',
          shadowColor:   '#000',
          shadowOffset:  { width: isRTL ? 4 : -4, height: 0 },
          shadowOpacity: 0.3,
          shadowRadius:  12,
          elevation:     20,
        },
      ]}>
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="splash" />
          <Stack.Screen name="twin-mind" />
          <Stack.Screen name="chat" />
          <Stack.Screen name="login" />
          <Stack.Screen name="onboarding" />
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
      </Animated.View>

      {/* طبقة الإغلاق */}
      {menuVisible && (
        <Pressable
          style={[
            st.overlay,
            isRTL ? { right: safeWidth * 0.72, left: 0 } : { left: safeWidth * 0.72, right: 0 },
          ]}
          onPress={handleCloseMenu}
        />
      )}
    </ErrorBoundary>
  );
}

const st = StyleSheet.create({
  mainScreen: {
    flex: 1,
    backgroundColor: '#000',
  },
  menuContainer: {
    position:  'absolute',
    top:       0,
    bottom:    0,
    zIndex:    50,
    elevation: 10,
  },
  menuLoading: {
    flex:            1,
    justifyContent:  'center',
    alignItems:      'center',
  },
  overlay: {
    position:  'absolute',
    top:       0,
    bottom:    0,
    zIndex:    200,
    elevation: 25,
  },
});
