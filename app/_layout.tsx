import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet, Animated, View, Pressable,
  useWindowDimensions, ActivityIndicator, Platform,
} from 'react-native';
import { useTwinStore } from '../store/useTwinStore';
import { ErrorBoundary } from '../components/ErrorBoundary';

// ── ألوان المشاعر ─────────────────────────────────────────────
const EMOTION_COLORS: Record<string, string> = {
  joy:     '#FFD700',
  sadness: '#4A90E2',
  neutral: '#7C3AED',
  fear:    '#9C27B0',
  love:    '#E91E63',
  anger:   '#FF3B30',
};

// ── ParticleField ─────────────────────────────────────────────
const ParticleField = React.memo(({ emotion }: { emotion: string }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const color   = EMOTION_COLORS[emotion] ?? EMOTION_COLORS.neutral;

  useEffect(() => {
    const delay = setTimeout(() => {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.07, duration: 3000, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.02, duration: 3000, useNativeDriver: true }),
        ])
      );
      pulse.start();
    }, 2000);
    return () => clearTimeout(delay);
  }, [emotion]);

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { backgroundColor: color, opacity }]}
      pointerEvents="none"
    />
  );
});

// ── إعدادات التأثير ───────────────────────────────────────────
const MENU_WIDTH_RATIO = 0.78; // 78% من عرض الشاشة
const SCALE_VALUE      = 0.86; // حجم الشاشة عند فتح القائمة
const BORDER_RADIUS    = 24;   // انحناء الشاشة عند فتح القائمة
const SPRING_CONFIG    = { damping: 22, stiffness: 160, useNativeDriver: true };

// ── RootLayout ────────────────────────────────────────────────
export default function RootLayout() {
  const theme       = useTwinStore(s => s.theme);
  const twinEnergy  = useTwinStore(s => s.twinEnergy);
  const menuVisible = useTwinStore(s => s.menuVisible);
  const closeMenu   = useTwinStore(s => s.closeMenu);
  const lang        = useTwinStore(s => s.lang);

  const isDark = theme === 'dark';
  const isRTL  = lang === 'ar';

  const { width: SCREEN_W } = useWindowDimensions();
  const MENU_W = SCREEN_W * MENU_WIDTH_RATIO;

  // ── Animated Values ──────────────────────────────────────────
  // الشاشة الرئيسية: تنزاح وتتصغر
  const mainTranslateX = useRef(new Animated.Value(0)).current;
  const mainScale      = useRef(new Animated.Value(1)).current;
  const mainBorder     = useRef(new Animated.Value(0)).current; // non-native

  // القائمة: تنزلق من الجانب
  const menuTranslateX = useRef(new Animated.Value(isRTL ? MENU_W : -MENU_W)).current;
  const menuOpacity    = useRef(new Animated.Value(0)).current;

  // ── تحميل SideMenu بأمان ─────────────────────────────────────
  const [SideMenuComp, setSideMenuComp] = useState<React.ComponentType<any> | null>(null);
  const [menuMounted,  setMenuMounted]  = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const mod = require('../components/SideMenu');
        if (mod?.default) setSideMenuComp(() => mod.default);
      } catch (e) {
        console.warn('[Layout] SideMenu load failed:', e);
      }
    }, 400);
    return () => clearTimeout(t);
  }, []);

  // ── المشاعر ──────────────────────────────────────────────────
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  useEffect(() => {
    if      (twinEnergy > 80) setCurrentEmotion('joy');
    else if (twinEnergy > 50) setCurrentEmotion('neutral');
    else if (twinEnergy > 30) setCurrentEmotion('sadness');
    else                      setCurrentEmotion('fear');
  }, [twinEnergy]);

  // ── إعادة ضبط slideAnim عند تغيير RTL ───────────────────────
  useEffect(() => {
    if (!menuVisible) {
      menuTranslateX.setValue(isRTL ? MENU_W : -MENU_W);
      mainTranslateX.setValue(0);
    }
  }, [isRTL, MENU_W]);

  // ── Animation عند فتح/إغلاق القائمة ─────────────────────────
  useEffect(() => {
    if (menuVisible) {
      // ✅ mount القائمة قبل الأنيميشن
      setMenuMounted(true);
    }

    // حساب اتجاه الحركة حسب اللغة
    // عربي: القائمة من اليمين، الشاشة تنزاح لليسار
    // إنجليزي: القائمة من اليسار، الشاشة تنزاح لليمين
    const mainTarget   = menuVisible
      ? (isRTL ? -SCREEN_W * 0.72 : SCREEN_W * 0.72)
      : 0;
    const menuTarget   = menuVisible ? 0 : (isRTL ? MENU_W : -MENU_W);
    const scaleTarget  = menuVisible ? SCALE_VALUE : 1;
    const borderTarget = menuVisible ? BORDER_RADIUS : 0;
    const opacTarget   = menuVisible ? 1 : 0;

    // الشاشة الرئيسية - native driver
    Animated.parallel([
      Animated.spring(mainTranslateX, { toValue: mainTarget,  ...SPRING_CONFIG }),
      Animated.spring(mainScale,      { toValue: scaleTarget, ...SPRING_CONFIG }),
      Animated.spring(menuTranslateX, { toValue: menuTarget,  ...SPRING_CONFIG }),
      Animated.timing(menuOpacity,    { toValue: opacTarget, duration: 200, useNativeDriver: true }),
    ]).start(({ finished }) => {
      // ✅ unmount القائمة بعد إغلاقها لتحرير الذاكرة
      if (finished && !menuVisible) {
        setMenuMounted(false);
      }
    });

    // borderRadius منفصل (لا يدعم native driver)
    Animated.spring(mainBorder, {
      toValue:   borderTarget,
      damping:   22,
      stiffness: 160,
      useNativeDriver: false,
    }).start();

  }, [menuVisible, isRTL, SCREEN_W, MENU_W]);

  const handleCloseMenu = useCallback(() => closeMenu?.(), [closeMenu]);

  return (
    <ErrorBoundary>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* خلفية القائمة */}
      <View style={[
        st.menuBackground,
        { backgroundColor: isDark ? '#0D0D1A' : '#F0EEF8' },
      ]} />

      {/* ── القائمة الجانبية ────────────────────────────────── */}
      {menuMounted && (
        <Animated.View
          style={[
            st.menuContainer,
            {
              width:     MENU_W,
              // عربي: من اليمين | إنجليزي: من اليسار
              right:     isRTL ? 0 : undefined,
              left:      isRTL ? undefined : 0,
              opacity:   menuOpacity,
              transform: [{ translateX: menuTranslateX }],
            },
          ]}
          pointerEvents={menuVisible ? 'auto' : 'none'}
        >
          {SideMenuComp
            ? <SideMenuComp onClose={handleCloseMenu} />
            : (
              <View style={st.menuLoading}>
                <ActivityIndicator color="#7C3AED" size="large" />
              </View>
            )
          }
        </Animated.View>
      )}

      {/* ── الشاشة الرئيسية ────────────────────────────────── */}
      <Animated.View style={[
        StyleSheet.absoluteFill,
        {
          transform:       [
            { translateX: mainTranslateX },
            { scale:      mainScale      },
          ],
          borderRadius:    mainBorder,
          overflow:        'hidden',
          // ظل يعطي عمق عند الفتح
          shadowColor:     '#000',
          shadowOffset:    { width: isRTL ? 4 : -4, height: 0 },
          shadowOpacity:   0.3,
          shadowRadius:    16,
          elevation:       20,
        },
      ]}>
        <Stack screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 150 }}>
          <Stack.Screen name="index"                       />
          <Stack.Screen name="splash"                      />
          <Stack.Screen name="twin-mind"                   />
          <Stack.Screen name="chat"                        />
          <Stack.Screen name="login"                       />
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

      {/* ── طبقة الإغلاق ────────────────────────────────────── */}
      {menuVisible && (
        <Pressable
          style={[
            st.overlay,
            // الضغط فقط على الجزء الظاهر من الشاشة الرئيسية
            isRTL
              ? { right: MENU_W, left: 0 }
              : { left: MENU_W, right: 0 },
          ]}
          onPress={handleCloseMenu}
        />
      )}
    </ErrorBoundary>
  );
}

// ── Styles ────────────────────────────────────────────────────
const st = StyleSheet.create({
  menuBackground: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
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
