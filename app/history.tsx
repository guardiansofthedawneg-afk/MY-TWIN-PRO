import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
  RefreshControl, Alert, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../store/useTwinStore';
import { useTheme } from '../utils/theme';
import { router } from 'expo-router';
import { apiGet, apiDelete } from '../lib/httpClient';
import {
  Code2, Heart, MessageCircle, Search, Trash2, X,
  Sparkles, GraduationCap, TrendingUp, PenLine, Moon,
  FolderOpen, ChevronRight, Clock, Filter,
} from 'lucide-react-native';

// أيقونات وألوان حسب نوع المشروع
const PROJECT_TYPES: Record<string, { icon: any; color: string; label_ar: string; label_en: string }> = {
  chat: { icon: MessageCircle, color: '#7C3AED', label_ar: 'محادثة', label_en: 'Chat' },
  life_coach: { icon: Heart, color: '#EC4899', label_ar: 'مدرب الحياة', label_en: 'Life Coach' },
  code_lab: { icon: Code2, color: '#10B981', label_ar: 'المعمل', label_en: 'Code Lab' },
  study: { icon: GraduationCap, color: '#3B82F6', label_ar: 'دراسة', label_en: 'Study' },
  business: { icon: TrendingUp, color: '#F59E0B', label_ar: 'تحليل أعمال', label_en: 'Business' },
  content: { icon: PenLine, color: '#8B5CF6', label_ar: 'محتوى', label_en: 'Content' },
  dream: { icon: Moon, color: '#6366F1', label_ar: 'حلم', label_en: 'Dream' },
  default: { icon: FolderOpen, color: '#6B7280', label_ar: 'مشروع', label_en: 'Project' },
};

const TABS = [
  { key: 'all', label_ar: 'الكل', label_en: 'All' },
  { key: 'chat', label_ar: 'المحادثات', label_en: 'Chats' },
  { key: 'life_coach', label_ar: 'مدرب الحياة', label_en: 'Life Coach' },
  { key: 'code_lab', label_ar: 'المعمل', label_en: 'Code Lab' },
];

export default function History() {
  const insets = useSafeAreaInsets();
  const { lang, userId, hasHydrated } = useTwinStore();
  const isAr = lang === 'ar';
  const isDark = useTheme().isDark;
  const t = useCallback((ar: string, en: string) => (isAr ? ar : en), [isAr]);

  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const colors = useMemo(() => ({
    bg: isDark ? '#0A0014' : '#FAFAF8',
    card: isDark ? '#1A1226' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#2D2D2D',
    subtext: isDark ? '#A78BFA' : '#6B7280',
    accent: '#7C3AED',
    border: isDark ? '#2D1B4D' : '#E8E8E3',
    inputBg: isDark ? '#161122' : '#FDFDF9',
    danger: '#EF4444',
  }), [isDark]);

  const fetchProjects = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await apiGet(`/api/projects?user_id=${userId}`);
      if (res && Array.isArray(res.projects)) {
        setProjects(res.projects);
      } else if (Array.isArray(res)) {
        setProjects(res);
      } else {
        setProjects([]);
      }
    } catch (e) {
      console.warn('History fetch failed', e);
      setProjects([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!hasHydrated) return;
    fetchProjects();
  }, [hasHydrated]);

  const filteredProjects = useMemo(() => {
    let result = projects;
    if (activeTab !== 'all') {
      result = result.filter(p => p.type === activeTab);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        (p.title || '').toLowerCase().includes(query)
      );
    }
    return [...result].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  }, [projects, activeTab, searchQuery]);

  const handleDelete = useCallback((projectId: string) => {
    Alert.alert(
      t('حذف المشروع', 'Delete Project'),
      t('هل أنت متأكد؟', 'Are you sure?'),
      [
        { text: t('إلغاء', 'Cancel'), style: 'cancel' },
        {
          text: t('حذف', 'Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await apiDelete(`/api/projects?project_id=${projectId}`);
              setProjects(prev => prev.filter(p => p.id !== projectId));
            } catch (e) {
              Alert.alert(t('خطأ', 'Error'), t('فشل الحذف', 'Failed to delete'));
            }
          },
        },
      ]
    );
  }, [t]);

  const handleDiscuss = useCallback((project: any) => {
    router.push({
      pathname: '/chat',
      params: { projectId: project.id, projectType: project.type }
    } as any);
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (days === 0) return t('اليوم', 'Today');
      if (days === 1) return t('أمس', 'Yesterday');
      if (days < 7) return t(`منذ ${days} أيام`, `${days} days ago`);
      return date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US');
    } catch { return ''; }
  };

  if (!hasHydrated || loading) {
    return (
      <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ color: colors.subtext, marginTop: 12 }}>
          {t('جاري تحميل المشاريع...', 'Loading projects...')}
        </Text>
      </View>
    );
  }

  return (
    <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      <View style={st.header}>
        <Text style={[st.title, { color: colors.text }]}>
          {t('سجل المشاريع', 'Project History')}
        </Text>
        <Text style={[st.subtitle, { color: colors.subtext }]}>
          {t(`${filteredProjects.length} مشروع`, `${filteredProjects.length} projects`)}
        </Text>
      </View>

      <View style={[st.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
        <Search size={18} stroke={colors.subtext} />
        <TextInput
          style={[st.searchInput, { color: colors.text }]}
          placeholder={t('ابحث عن مشروع...', 'Search projects...')}
          placeholderTextColor={colors.subtext}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={18} stroke={colors.subtext} />
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        horizontal
        data={TABS}
        keyExtractor={(item) => item.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={st.tabsContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[st.tab, { borderColor: activeTab === item.key ? colors.accent : colors.border }, activeTab === item.key && { backgroundColor: colors.accent + '15' }]}
            onPress={() => setActiveTab(item.key)}
          >
            <Text style={[st.tabText, { color: activeTab === item.key ? colors.accent : colors.subtext }]}>
              {t(item.label_ar, item.label_en)}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={filteredProjects}
        keyExtractor={(item) => item.id || Math.random().toString()}
        contentContainerStyle={st.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProjects(); }} colors={[colors.accent]} tintColor={colors.accent} />}
        renderItem={({ item }) => {
          const typeInfo = PROJECT_TYPES[item.type] || PROJECT_TYPES.default;
          const Icon = typeInfo.icon;

          return (
            <TouchableOpacity
              style={[st.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleDiscuss(item)}
              activeOpacity={0.7}
            >
              <View style={[st.iconWrap, { backgroundColor: typeInfo.color + '15' }]}>
                <Icon size={22} stroke={typeInfo.color} />
              </View>

              <View style={st.cardContent}>
                <Text style={[st.cardTitle, { color: colors.text }]} numberOfLines={2}>
                  {item.title || t('بدون عنوان', 'Untitled')}
                </Text>
                <View style={st.cardMeta}>
                  <View style={[st.typeBadge, { backgroundColor: typeInfo.color + '20' }]}>
                    <Text style={[st.typeText, { color: typeInfo.color }]}>
                      {t(typeInfo.label_ar, typeInfo.label_en)}
                    </Text>
                  </View>
                  <Clock size={12} stroke={colors.subtext} />
                  <Text style={[st.dateText, { color: colors.subtext }]}>
                    {formatDate(item.created_at)}
                  </Text>
                </View>
              </View>

              <View style={st.actions}>
                <TouchableOpacity style={[st.actionBtn, { backgroundColor: colors.accent + '15' }]} onPress={() => handleDiscuss(item)}>
                  <MessageCircle size={16} stroke={colors.accent} />
                </TouchableOpacity>
                <TouchableOpacity style={[st.actionBtn, { backgroundColor: colors.danger + '15' }]} onPress={() => handleDelete(item.id)}>
                  <Trash2 size={16} stroke={colors.danger} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={st.empty}>
            <FolderOpen size={56} stroke={colors.subtext} opacity={0.4} />
            <Text style={[st.emptyTitle, { color: colors.subtext }]}>
              {t('لا توجد مشاريع', 'No projects yet')}
            </Text>
            <Text style={[st.emptySub, { color: colors.subtext }]}>
              {t('جميع محادثاتك ومشاريعك ستظهر هنا', 'All your conversations and projects will appear here')}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 14, fontWeight: '500' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginVertical: 12, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 15 },
  tabsContainer: { paddingHorizontal: 16, marginBottom: 12, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, marginRight: 8 },
  tabText: { fontSize: 13, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, borderWidth: 1, padding: 14, marginBottom: 10, gap: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  cardContent: { flex: 1, gap: 6 },
  cardTitle: { fontSize: 15, fontWeight: '600', lineHeight: 22 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  typeText: { fontSize: 10, fontWeight: '700' },
  dateText: { fontSize: 11, fontWeight: '500' },
  actions: { gap: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
