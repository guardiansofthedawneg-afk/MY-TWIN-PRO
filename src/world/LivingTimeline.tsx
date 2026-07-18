import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { timelineCoordinator } from '../coordinators/TimelineCoordinator';
// ✅ identityEngine removed
import { useRTL } from '../../lib/useRTL';
import { SPACE, RADIUS } from '../../src/design/tokens/spacing';
import { Clock, MapPin, TrendingUp, Heart } from 'lucide-react-native';

interface TimelineEntry {
  id: string;
  period: string;
  title: string;
  type: 'memory' | 'milestone' | 'goal' | 'emotion' | 'place';
  icon: typeof Clock;
  color: string;
}

const TYPE_CONFIG: Record<string, { icon: typeof Clock; color: string }> = {
  memory:    { icon: Clock,      color: '#A855F7' },
  milestone: { icon: TrendingUp, color: '#EC4899' },
  goal:      { icon: Heart,      color: '#10B981' },
  place:     { icon: MapPin,     color: '#3B82F6' },
  emotion:   { icon: Heart,      color: '#F59E0B' },
};

export default function LivingTimeline() {
  const rtl = useRTL();
  const [entries, setEntries] = useState<TimelineEntry[]>([]);

  useEffect(() => {
    buildTimeline();
  }, []);

  const buildTimeline = async () => {
    const allEntries: TimelineEntry[] = [];
    const timeline = await timelineCoordinator.buildTimeline();
    const heatmap = identityEngine.getPresenceHeatmap();
    const mostVisited = identityEngine.getMostVisitedWorld();

    for (const event of timeline.slice(0, 8)) {
      const config = TYPE_CONFIG[event.type] || TYPE_CONFIG.memory;
      allEntries.push({
        id: event.id,
        period: new Date(event.date).toLocaleDateString(rtl.isRTL ? 'ar' : 'en'),
        title: event.title,
        type: event.type as TimelineEntry['type'],
        icon: config.icon,
        color: config.color,
      });
    }

    if (mostVisited !== 'living_world') {
      allEntries.push({
        id: 'most_visited',
        period: rtl.isRTL ? 'الأكثر زيارة' : 'Most visited',
        title: mostVisited,
        type: 'place',
        icon: MapPin,
        color: '#3B82F6',
      });
    }

    setEntries(allEntries);
  };

  if (entries.length === 0) return null;

  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.container}>
      <Text style={styles.title}>{rtl.isRTL ? 'رحلة الحياة' : 'Life Journey'}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {entries.map(entry => {
          const Icon = entry.icon;
          return (
            <View key={entry.id} style={[styles.entry, { borderColor: entry.color + '30' }]}>
              <View style={[styles.entryIcon, { backgroundColor: entry.color + '15' }]}>
                <Icon size={14} stroke={entry.color} />
              </View>
              <Text style={styles.entryPeriod}>{entry.period}</Text>
              <Text style={styles.entryText} numberOfLines={2}>{entry.title}</Text>
            </View>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: SPACE.lg, paddingVertical: SPACE.sm },
  title: { color: '#A78BFA', fontSize: 14, fontWeight: '600', marginBottom: SPACE.sm },
  scroll: { gap: SPACE.sm },
  entry: { width: 140, backgroundColor: 'rgba(26,18,38,0.8)', borderRadius: RADIUS.card, borderWidth: 1, padding: SPACE.sm, gap: 6 },
  entryIcon: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  entryPeriod: { color: '#6B5B8A', fontSize: 10 },
  entryText: { color: '#E8E0F0', fontSize: 12, lineHeight: 16 },
});
