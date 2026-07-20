/**
 * Design Tokens Colors v2.0 — متوافق مع engine/colors.ts
 * ========================================================
 * نفس ألوان engine/colors.ts لضمان التوافق.
 * يُفضل استخدام useAppTheme() من engine/colors مباشرة.
 */
import { useAppTheme as useEngineTheme } from '../../engine/colors';
import type { ThemeColors } from '../../engine/colors';

// إعادة تصدير النوع
export type { ThemeColors };

// إعادة تصدير useAppTheme من engine/colors (مصدر واحد للحقيقة)
export const useTheme = useEngineTheme;

// دوال مساعدة للتوافق مع الملفات القديمة
export function getBondColor(bondLevel: number, colors: ThemeColors): string {
  if (bondLevel >= 70) return colors.rose;
  if (bondLevel >= 40) return colors.accent;
  return colors.primary;
}

export function getEnergyColor(energy: number, colors: ThemeColors): string {
  if (energy >= 70) return colors.success;
  if (energy >= 30) return colors.gold;
  return colors.danger;
}

export function getEmotionColor(emotion: string, colors: ThemeColors): string {
  const map: Record<string, string> = {
    joy: colors.gold,
    sadness: colors.accent,
    fear: colors.accent,
    love: colors.rose,
    anger: colors.danger,
  };
  return map[emotion] || colors.textSecondary;
}
