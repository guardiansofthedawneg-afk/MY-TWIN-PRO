import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
// ✅ memoryEngine removed — use stateBus
import { useTwinState } from '../../../engine/core/TwinState';
import { SPACE, RADIUS } from '../../../src/design/tokens/spacing';
import { Calendar, Heart, Sparkles } from 'lucide-react-native';

interface ContextItem {
  id: string;
  type: 'memory' | 'emotion' | 'event';
  text: string;
  color: string;
  icon: typeof Calendar;
}

export default function ContextRibbon() {
  const [items, setItems] = useState<ContextItem[]>([]);
  const [visible, setVisible] = useState(false);

  const fetchContext = useCallback(async () => {
    try {
      const now = new Date();
      const ribbonItems: ContextItem[] = [];

      const todayMemories = await memoryEngine.onThisDay();
      if (todayMemories.length > 0) {
        ribbonItems.push({
          id: 'today',
          type: 'event',
          text: `في مثل هذا اليوم: ${todayMemories[0].content.substring(0, 60)}...`,
          color: '#F59E0B',
          icon: Calendar,
        });
      }

      const emotionMemories = await memoryEngine.byEmotion(
        useTwinState.getState().emotion,
        1,
      );
      if (emotionMemories.length > 0) {
        ribbonItems.push({
          id: 'emotion',
          type: 'emotion',
          text: `آخر مرة شعرت بهذا: ${emotionMemories[0].content.substring(0, 50)}...`,
          color: '#EC4899',
          icon: Heart,
        });
      }

      const recent = await memoryEngine.retrieveByType('event', 1);
      if (recent.length > 0) {
        ribbonItems.push({
          id: 'recent',
          type: 'memory',
          text: `قبل أيام: ${recent[0].content.substring(0, 60)}...`,
          color: '#A855F7',
          icon: Sparkles,
        });
      }

      if (ribbonItems.length > 0) {
        setItems(ribbonItems);
        setVisible(true);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchContext, 5000);
    const interval = setInterval(fetchContext, 120000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchContext]);

  if (!visible || items.length === 0) return null;

  return (
    <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(300)}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.chip, { borderColor: item.color + '40' }]}
              activeOpacity={0.8}
            >
              <Icon size={12} stroke={item.color} />
              <Text style={[styles.text, { color: item.color }]} numberOfLines={1}>
                {item.text}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.sm,
    gap: SPACE.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.xs + 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    backgroundColor: 'rgba(26, 18, 38, 0.8)',
  },
  text: {
    fontSize: 11,
    fontWeight: '500',
    maxWidth: 200,
  },
});
