/**
 * COLOR TOKENS v2.0 — مرجع الألوان الموحد
 * ==========================================
 * يصدر كل الألوان من engine/colors.ts + engine/living-theme.ts
 * في واجهة واحدة. لا يعيد تعريف أي لون — فقط يجمعه.
 *
 * التكامل:
 *   - engine/colors.ts — الألوان الأساسية
 *   - engine/living-theme.ts — ألوان حية مرتبطة بحالة التوأم
 */

// ── إعادة تصدير الألوان الأساسية ──────────────────────
export {
  DARK_THEME,
  LIGHT_THEME,
  FONTS,
  SPACING,
  useColors,
  useAppTheme,
} from '../../../engine/colors';
export type { ThemeColors } from '../../../engine/colors';

// ── ألوان حية مرتبطة بحالة التوأم ──────────────────
export { useLivingTheme } from '../../../engine/living-theme';
export type {
  LivingTheme,
  MotionConfig,
  GlassConfig,
  GlowConfig,
  LivingColors,
} from '../../../engine/living-theme';

// ── دوال مساعدة للألوان (تعتمد على engine/colors) ──
import type { ThemeColors } from '../../../engine/colors';
import { useAppTheme } from '../../../engine/colors';

export function getBondColor(bondLevel: number, colors?: ThemeColors): string {
  const c = colors || useAppTheme().colors;
  if (bondLevel >= 70) return c.rose;
  if (bondLevel >= 40) return c.accent;
  return c.primary;
}

export function getEnergyColor(energy: number, colors?: ThemeColors): string {
  const c = colors || useAppTheme().colors;
  if (energy >= 70) return c.success;
  if (energy >= 30) return c.gold;
  return c.danger;
}

export function getEmotionColor(emotion: string, colors?: ThemeColors): string {
  const c = colors || useAppTheme().colors;
  const map: Record<string, string> = {
    joy: c.gold,
    sadness: '#3B82F6',
    fear: c.accent,
    love: c.rose,
    anger: c.danger,
  };
  return map[emotion] || c.textSecondary;
}
