import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';

interface GreetingWordProps {
  word: string;
  colors: string[];
  transitionSpeed: number;
  fontSize: number;
  fontWeight: '300' | '400' | '500';
  onComplete?: () => void;
}

/**
 * GREETING WORD — كلمة ترحيب حية
 * ==================================
 * تظهر "مرحباً." أو "Hello." حسب لغة المستخدم.
 * يتغير لونها بشكل متناسق عبر 7 ألوان.
 * تلفت الانتباه بلطف — وكأن الكيان يتنفس بألوانه.
 */
export default function GreetingWord({
  word,
  colors,
  transitionSpeed,
  fontSize,
  fontWeight,
  onComplete,
}: GreetingWordProps) {
  const colorIndex = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // ظهور ناعم
    opacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.ease),
    });

    // دورة الألوان — 7 ألوان
    const totalColors = colors.length;
    let currentIndex = 0;

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % totalColors;
      colorIndex.value = withTiming(currentIndex, {
        duration: transitionSpeed,
        easing: Easing.inOut(Easing.ease),
      });
    }, transitionSpeed + 200); // 800ms لون + 200ms استقرار

    // إكمال بعد 6 ثوانٍ
    const timer = setTimeout(() => {
      clearInterval(interval);
      onComplete?.();
    }, 6000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  // نمط متحرك — اللون يتغير بين 7 قيم
  const animatedStyle = useAnimatedStyle(() => {
    const index = colorIndex.value;
    const fromIndex = Math.floor(index) % colors.length;
    const toIndex = (fromIndex + 1) % colors.length;
    const progress = index - Math.floor(index);

    const color = interpolateColor(
      progress,
      [0, 1],
      [colors[fromIndex], colors[toIndex]]
    );

    return {
      color,
      opacity: opacity.value,
    };
  });

  return (
    <Animated.Text
      style={[
        styles.greeting,
        {
          fontSize,
          fontWeight,
        },
        animatedStyle,
      ]}
    >
      {word}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  greeting: {
    textAlign: 'center',
    letterSpacing: 2,
  },
});
