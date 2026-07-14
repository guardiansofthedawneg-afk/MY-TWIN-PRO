import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { memoryEngine } from '../../engine/memory/MemoryEngine';
import { relationshipEngine } from '../../engine/relationship/RelationshipEngine';
import { useRTL } from '../../lib/useRTL';
import { SPACE, RADIUS } from '../../src/design/tokens/spacing';
import { Clock, MessageCircle, Heart, Target } from 'lucide-react-native';

interface TimelineEntry {
  id: string;
  type: 'conversation' | 'memory' | 'milestone' | 'goal';
  text: string;
  time: string;
  color: string;
  icon: typeof Clock;
}

export default function DailyTimeline() {
  const rtl = useRTL();
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [visible, setVisible] = useState(false);
  const [lastActiveGoal, setLastActiveGoal] = useState('');

  const buildTimeline = useCallback(async () => {
    const timeline: TimelineEntry[] = [];
    const now = new Date();

    try {
      // 1. ذكريات اليوم
      const todayMemories = await memoryEngine.onThisDay();
      for (const memory of todayMemories.slice(0, 2)) {
        timeline.push({
          id: memory.id,
          type: 'memory',
          text: memory.content.substring(0, 80),
          time: new Date(memory.timestamp).toLocaleTimeString(rtl.isRTL ? 'ar' : 'en', { hour: '2-digit', minute: '2-digit' }),
          color: '#8B5CF6',
          icon: Heart,
        });
      }

      // 2. آخر محادثة
      const recentConversations = await memoryEngine.retrieveByType('conversation', 1);
      if (recentConversations.length > 0) {
        const last = recentConversations[0];
        timeline.push({
          id: last.id,
          type: 'conversation',
          text: last.content.substring(0, 80),
          time: new Date(last.timestamp).toLocaleTimeString(rtl.isRTL ? 'ar' : 'en', { hour: '2-digit', minute: '2-digit' }),
          color: '#A855F7',
          icon: MessageCircle,
        });
      }

      // 3. حالة العلاقة
      const bond = relationshipEngine.getBondLevel();
      const phase = relationshipEngine.getPhase();
      if (bond > 30) {
        timeline.push({
          id: 'relationship',
          type: 'milestone',
          text: rtl.isRTL
            ? `الرابطة: ${phase === 'soulmate' ? 'عميقة جداً' : phase === 'close_friend' ? 'قوية' : 'تنمو'}`
            : `Bond: ${phase === 'soulmate' ? 'Very Deep' : phase === 'close_friend' ? 'Strong' : 'Growing'}`,
          time: now.toLocaleTimeString(rtl.isRTL ? 'ar' : 'en', { hour: '2-digit', minute: '2-digit' }),
          color: '#EC4899',
          icon: Heart,
        });
      }

      // 4. هدف اليوم
      if (lastActiveGoal) {
        timeline.push({
          id: 'daily_goal',
          type: 'goal',
          text: lastActiveGoal,
          time: '',
          color: '#10B981',
          icon: Target,
        });
      }
    } catch (e) {}

    if (timeline.length > 0) {
      setEntries(timeline);
      setVisible(true);
    }
  }, [rtl.isRTL, lastActiveGoal]);

  useEffect(() => {
    const timer = setTimeout(buildTimeline, 5000);
    const interval = setInterval(buildTimeline, 120000);
    return () => { clearTimeout(timer); clearInterval(interval); };
  }, [buildTimeline]);

  if (!visible || entries.length === 0) return null;

  return (
    <Animated.View entering={FadeIn.duration(500)} exiting={FadeOut.duration(300)} style={styles.container}>
      <Text style={styles.title}>{rtl.isRTL ? 'ملخص اليوم' : 'Daily Summary'}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {entries.map(entry => {
          const Icon = entry.icon;
          return (
            <View key={entry.id} style={[styles.entry, { borderColor: entry.color + '30' }]}>
              <View style={[styles.entryIcon, { backgroundColor: entry.color + '15' }]}>
                <Icon size={14} stroke={entry.color} />
              </View>
              <Text style={styles.entryText} numberOfLines={2}>{entry.text}</Text>
              {entry.time !== '' && (
                <Text style={styles.entryTime}>{entry.time}</Text>
              )}
            </View>
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
  },
  title: {
    color: '#A78BFA',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: SPACE.sm,
  },
  scroll: {
    gap: SPACE.sm,
  },
  entry: {
    width: 160,
    backgroundColor: 'rgba(26, 18, 38, 0.8)',
    borderRadius: RADIUS.card,
    borderWidth: 1,
    padding: SPACE.sm,
    gap: 6,
  },
  entryIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  entryText: {
    color: '#E8E0F0',
    fontSize: 12,
    lineHeight: 16,
  },
  entryTime: {
    color: '#6B5B8A',
    fontSize: 10,
  },
});
