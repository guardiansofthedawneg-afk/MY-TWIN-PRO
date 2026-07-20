import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../../engine/colors';
import { Brain } from 'lucide-react-native';

interface ThinkingIndicatorProps {
  phase: { phase: string; label_ar: string; label_en: string } | null;
  lang: string;
}

export default function ThinkingIndicator({ phase, lang }: ThinkingIndicatorProps) {
  const { colors } = useAppTheme();
  const isAr = lang === 'ar';

  if (!phase) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.accent + '30' }]}>
      <Brain size={14} stroke={colors.accent} />
      <Text style={[styles.text, { color: colors.accent }]}>
        {isAr ? phase.label_ar : phase.label_en}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
  },
});
