import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { memoryEngine, MemoryEntry } from '../../engine/memory/MemoryEngine';
import { useRTL } from '../utils/useRTL';
import { SPACE, RADIUS } from '../../src/design/tokens/spacing';
import { BookOpen, Heart, Star, Cloud, Zap } from 'lucide-react-native';

const MEMORY_ICONS: Record<string, typeof BookOpen> = {
  study: BookOpen,
  emotion: Heart,
  achievement: Star,
  dream: Cloud,
  general: Zap,
};

const MEMORY_COLORS: Record<string, string> = {
  fresh:  '#10B981',
  recent: '#3B82F6',
  stable: '#A855F7',
  core:   '#EC4899',
  legacy: '#F59E0B',
};

export default function MemoryForest() {
  const rtl = useRTL();
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const core = memoryEngine.getCoreMemories();
    setMemories(core.slice(0, 12));
  }, []);

  if (memories.length === 0) return null;

  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.container}>
      <Text style={styles.title}>{rtl.isRTL ? 'غابة الذكريات' : 'Memory Forest'}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {memories.map(memory => {
          const isSelected = selected === memory.id;
          const ageColor = MEMORY_COLORS[memory.age] || '#A855F7';
          const MemoryIcon = MEMORY_ICONS[memory.type] || Star;

          return (
            <TouchableOpacity
              key={memory.id}
              style={[styles.tree, isSelected && { borderColor: ageColor }]}
              onPress={() => setSelected(isSelected ? null : memory.id)}
            >
              {/* تاج الشجرة = أيقونة + لون العمر */}
              <View style={[styles.crown, { backgroundColor: ageColor + '20', borderColor: ageColor }]}>
                <MemoryIcon size={18} stroke={ageColor} />
              </View>
              {/* الجذع = خط */}
              <View style={[styles.trunk, { backgroundColor: ageColor }]} />
              {/* الجذور = خطوط صغيرة */}
              <View style={styles.roots}>
                {[0, 1, 2].map(i => (
                  <View key={i} style={[styles.root, { backgroundColor: ageColor + '60' }]} />
                ))}
              </View>
              {/* التفاصيل عند الاختيار */}
              {isSelected && (
                <View style={styles.details}>
                  <Text style={styles.detailText} numberOfLines={2}>{memory.content}</Text>
                  <Text style={styles.detailAge}>{rtl.isRTL ? 'العمر:' : 'Age:'} {memory.age}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: SPACE.lg, paddingVertical: SPACE.sm },
  title: { color: '#A78BFA', fontSize: 14, fontWeight: '600', marginBottom: SPACE.sm },
  scroll: { gap: SPACE.md, paddingBottom: SPACE.sm },
  tree: { alignItems: 'center', gap: 2, width: 70, backgroundColor: 'rgba(26,18,38,0.6)', borderRadius: RADIUS.sm, padding: SPACE.sm, borderWidth: 1, borderColor: 'transparent' },
  crown: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5 },
  trunk: { width: 3, height: 16, borderRadius: 2 },
  roots: { flexDirection: 'row', gap: 8, marginTop: -2 },
  root: { width: 2, height: 8, borderRadius: 1 },
  details: { marginTop: 6, alignItems: 'center' },
  detailText: { color: '#E8E0F0', fontSize: 10, textAlign: 'center', lineHeight: 14 },
  detailAge: { color: '#6B5B8A', fontSize: 9, marginTop: 4 },
});
