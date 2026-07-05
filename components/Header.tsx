import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../store/useTwinStore';
import { useTheme } from '../utils/theme';
import { useRouter, usePathname } from 'expo-router';
import { Menu, ChevronLeft, Sparkles } from 'lucide-react-native';

const ROUTE_TITLES: Record<string, { ar: string; en: string }> = {
  '/twin-mind': { ar: 'مركز الوعي', en: 'Mind Center' },
  '/chat': { ar: 'الوعي', en: 'Mind' },
  '/memories': { ar: 'الذكريات', en: 'Memories' },
  '/relationship': { ar: 'الرابطة', en: 'Bond' },
  '/museum': { ar: 'المتحف', en: 'Museum' },
  '/profile': { ar: 'الملف الشخصي', en: 'Profile' },
  '/settings': { ar: 'الإعدادات', en: 'Settings' },
  '/subscription': { ar: 'الاشتراك', en: 'Subscription' },
  '/referral': { ar: 'الإحالات', en: 'Referral' },
  '/features/index': { ar: 'عالم القدرات', en: 'Power Universe' },
  '/features/code-lab': { ar: 'مختبر البرمجة', en: 'Code Lab' },
  '/features/business-analyzer': { ar: 'تحليل الأعمال', en: 'Business' },
  '/features/study-mode': { ar: 'وضع الدراسة', en: 'Study Mode' },
  '/features/life-coach': { ar: 'مدرب الحياة', en: 'Life Coach' },
  '/features/image-creator': { ar: 'مولد الصور', en: 'Image Lab' },
  '/features/dreams': { ar: 'تفسير الأحلام', en: 'Dreams' },
  '/features/content-creator': { ar: 'مُحترف الكتابة', en: 'Content Creator' },
  '/features/smart-home': { ar: 'المنزل الذكي', en: 'Smart Home' },
  '/features/task-manager': { ar: 'مدير المهام', en: 'Task Manager' },
};

/**
 * 🧠 Header مركزي ذكي
 * - يُعرض تلقائياً في كل الشاشات (عبر Stack header)
 * - يتكيف مع RTL/LTR
 * - يُظهر زر القائمة أو الرجوع حسب السياق
 */
const Header = memo(() => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { lang, openMenu } = useTwinStore();
  const theme = useTheme();
  const isAr = lang === 'ar';

  const title = ROUTE_TITLES[pathname] || { ar: 'MY TWIN', en: 'MY TWIN' };
  const showBack = pathname !== '/twin-mind' && pathname !== '/index' && pathname !== '/';

  const handleMenu = useCallback(() => {
    if (typeof openMenu === 'function') openMenu();
  }, [openMenu]);

  const handleBack = useCallback(() => {
    try { router.back(); } catch (e) {}
  }, [router]);

  return (
    <View style={[
      styles.container,
      {
        paddingTop: insets.top + 8,
        paddingHorizontal: 16,
        backgroundColor: theme.card,
        borderBottomColor: theme.border,
      }
    ]}>
      <View style={styles.row}>
        {/* Left/Right Button */}
        {showBack ? (
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: theme.accentLight }]}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <ChevronLeft
              size={22}
              stroke={theme.accent}
              style={{ transform: [{ scaleX: isAr ? -1 : 1 }] }}
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: theme.accentLight }]}
            onPress={handleMenu}
            activeOpacity={0.7}
          >
            <Menu size={22} stroke={theme.accent} />
          </TouchableOpacity>
        )}

        {/* Title */}
        <View style={styles.titleWrap}>
          <Sparkles size={16} stroke={theme.accent} />
          <Text style={[styles.title, { color: theme.text }]}>
            {isAr ? title.ar : title.en}
          </Text>
        </View>

        {/* Spacer for balance */}
        <View style={styles.spacer} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 100,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    height: 56,
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  spacer: {
    width: 40,
  },
});

export default Header;
