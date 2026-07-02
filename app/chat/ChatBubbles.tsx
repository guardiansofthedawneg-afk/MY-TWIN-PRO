import React, { memo, useRef, useEffect, useMemo, useState, useCallback } from 'react';
import {
  View, Text, Image, StyleSheet, TouchableOpacity,
  Share, Animated, PanResponder, Vibration, Alert,
} from 'react-native';
import {
  Copy, Share2, RotateCcw, ThumbsUp, ThumbsDown,
  X, Reply, Trash2,
} from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import * as WebBrowser from 'expo-web-browser';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

const APP_LOGO = require('../../assets/logo.png');

// ================================================================
// COLORS
// ================================================================
export const COLORS = {
  light: {
    bg: '#FFFFFF', headerBg: '#FAFAFA', border: '#E8E8E8',
    text: '#1A1A1A', subtext: '#8E8E93',
    bubbleUser: '#7C3AED', userText: '#FFFFFF',
    twinText: '#1A1A1A', inputBg: '#F2F2F7', inputBorder: '#E5E5EA',
    sendActive: '#7C3AED', sendInactive: '#C7C7CC',
    retryColor: '#FF3B30', likeActive: '#34C759', dislikeActive: '#FF3B30',
    accent: '#7C3AED', accentLight: '#7C3AED15',
    codeBg: '#1C1C1E', tableBorder: '#E5E5EA',
    blockquoteBg: '#F2F2F7', link: '#5856D6',
    twinBg: '#F9F9FB', shadowColor: '#00000008',
    contextMenuBg: '#FFFFFF', contextMenuShadow: '#00000020',
  },
  dark: {
    bg: '#000000', headerBg: '#1C1C1E', border: '#38383A',
    text: '#FFFFFF', subtext: '#8E8E93',
    bubbleUser: '#7C3AED', userText: '#FFFFFF',
    twinText: '#FFFFFF', inputBg: '#2C2C2E', inputBorder: '#38383A',
    sendActive: '#A78BFA', sendInactive: '#48484A',
    retryColor: '#FF453A', likeActive: '#30D158', dislikeActive: '#FF453A',
    accent: '#A78BFA', accentLight: '#A78BFA15',
    codeBg: '#0A0A0A', tableBorder: '#38383A',
    blockquoteBg: '#2C2C2E', link: '#5E5CE6',
    twinBg: '#0D0D0F', shadowColor: '#FFFFFF05',
    contextMenuBg: '#2C2C2E', contextMenuShadow: '#00000060',
  },
};

const emotionEmoji: Record<string, string> = {
  joy: '😊', sadness: '😢', anger: '😠', fear: '😨', love: '❤️',
  surprise: '😮', neutral: '😌', caring: '🤝', supportive: '💪',
};

// ================================================================
// Context Menu – قائمة السياق عند Long Press
// ================================================================
const ContextMenu = memo(({
  visible, x, y, isDark, isUser, onCopy, onShare, onReply,
  onRetry, onDelete, onClose,
}: any) => {
  const c       = isDark ? COLORS.dark : COLORS.light;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, damping: 15, stiffness: 200, useNativeDriver: true }),
        Animated.timing(opacAnim,  { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
        Animated.timing(opacAnim,  { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const actions = [
    { icon: Copy,      label: 'نسخ',         onPress: onCopy,   color: c.text   },
    { icon: Reply,     label: 'رد',           onPress: onReply,  color: c.accent },
    { icon: Share2,    label: 'مشاركة',       onPress: onShare,  color: c.text   },
    ...(!isUser ? [{ icon: RotateCcw, label: 'إعادة', onPress: onRetry, color: '#F59E0B' }] : []),
    { icon: Trash2,    label: 'حذف',          onPress: onDelete, color: '#EF4444' },
  ];

  return (
    <>
      <TouchableOpacity style={st.menuOverlay} onPress={onClose} activeOpacity={1} />
      <Animated.View style={[
        st.contextMenu,
        {
          backgroundColor:  c.contextMenuBg,
          shadowColor:      c.contextMenuShadow,
          opacity:          opacAnim,
          transform:        [{ scale: scaleAnim }],
          top:              Math.max(y - 120, 60),
          left:             isUser ? undefined : 16,
          right:            isUser ? 16 : undefined,
        },
      ]}>
        {actions.map((a, i) => (
          <TouchableOpacity
            key={i}
            style={[st.menuItem, i < actions.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: isDark ? '#444' : '#F0F0F0' }]}
            onPress={() => { onClose(); a.onPress?.(); }}
            activeOpacity={0.7}
          >
            <a.icon size={16} stroke={a.color} />
            <Text style={[st.menuItemText, { color: a.color }]}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </>
  );
});

// ================================================================
// Markdown Renderer
// ================================================================
export const MarkdownRenderer = memo(({ content, isDark }: { content: string; isDark: boolean }) => {
  const c      = isDark ? COLORS.dark : COLORS.light;
  const styles = useMemo(() => ({
    body:         { color: c.twinText, fontSize: 16, lineHeight: 26 },
    code_inline:  { backgroundColor: c.codeBg, color: '#FF375F', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    code_block:   { backgroundColor: c.codeBg, padding: 16, borderRadius: 12, marginVertical: 12 },
    link:         { color: c.link, fontWeight: '600' as const },
    blockquote:   { backgroundColor: c.blockquoteBg, borderLeftColor: c.accent, borderLeftWidth: 3, paddingLeft: 16, paddingVertical: 4, borderRadius: 4 },
    table:        { borderColor: c.tableBorder, borderWidth: 1, borderRadius: 8 },
  }), [isDark]);

  const handleLinkPress = (url: string): boolean => {
    WebBrowser.openBrowserAsync(url).catch(() => {});
    return true;
  };

  return <Markdown style={styles as any} onLinkPress={handleLinkPress}>{content}</Markdown>;
});

// ================================================================
// Streaming Cursor – مؤشر الكتابة الحي
// ================================================================
const StreamingCursor = memo(({ color }: { color: string }) => {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const blink = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]));
    blink.start();
    return () => blink.stop();
  }, []);
  return <Animated.View style={[st.cursor, { backgroundColor: color, opacity }]} />;
});

// ================================================================
// User Bubble
// ================================================================
export const UserBubble = memo(({ item, isDark, isRTL, onReply, onDelete }: any) => {
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const translateX  = useRef(new Animated.Value(0)).current;
  const [menuVisible, setMenuVisible]   = useState(false);
  const [menuPos,     setMenuPos]       = useState({ x: 0, y: 0 });
  const bubbleRef   = useRef<View>(null);
  const c           = isDark ? COLORS.dark : COLORS.light;
  const time        = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, []);

  // Swipe to reply
  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dy) < 20,
    onPanResponderMove: (_, g) => {
      if (isRTL ? g.dx > 0 : g.dx < 0) {
        translateX.setValue(isRTL ? Math.min(g.dx, 60) : Math.max(g.dx, -60));
      }
    },
    onPanResponderRelease: (_, g) => {
      if (Math.abs(g.dx) > 40) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onReply?.(item);
      }
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
    },
  })).current;

  const handleLongPress = useCallback(() => {
    bubbleRef.current?.measure((_, __, ___, ____, px, py) => {
      setMenuPos({ x: px, y: py });
      setMenuVisible(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    });
  }, []);

  return (
    <>
      <Animated.View
        style={[st.userRow, { opacity: fadeAnim, transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          ref={bubbleRef}
          onLongPress={handleLongPress}
          delayLongPress={350}
          activeOpacity={0.9}
        >
          <View style={[st.userBubble, { backgroundColor: c.bubbleUser }]}>
            {item.replyTo && (
              <View style={st.replyPreview}>
                <Text style={st.replyPreviewText} numberOfLines={1}>{item.replyTo.content}</Text>
              </View>
            )}
            <Text style={[st.userText, { color: '#FFF' }]}>{item.content}</Text>
            <Text style={[st.userTime, { color: 'rgba(255,255,255,0.6)' }]}>{time}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      <ContextMenu
        visible={menuVisible}
        x={menuPos.x}
        y={menuPos.y}
        isDark={isDark}
        isUser
        onClose={() => setMenuVisible(false)}
        onCopy={() => Clipboard.setStringAsync(item.content)}
        onShare={() => Share.share({ message: item.content })}
        onReply={() => onReply?.(item)}
        onDelete={() => onDelete?.(item.id)}
      />
    </>
  );
});

// ================================================================
// Twin Bubble
// ================================================================
export const TwinBubble = memo(({
  item, isDark, isRTL, isLast, onCopy, onRetry, onRegenerate,
  onLike, onDislike, onReply, onDelete, lang, twinName, isStreaming,
}: any) => {
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPos,     setMenuPos]     = useState({ x: 0, y: 0 });
  const bubbleRef = useRef<View>(null);
  const c         = isDark ? COLORS.dark : COLORS.light;
  const time      = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const emotion   = item.emotion || 'neutral';
  const emoji     = emotionEmoji[emotion] || '😌';
  const isLiked   = item.liked === true;
  const isDisliked = item.disliked === true;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  // Swipe to reply
  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dy) < 20,
    onPanResponderMove: (_, g) => {
      if (isRTL ? g.dx < 0 : g.dx > 0) {
        translateX.setValue(isRTL ? Math.max(g.dx, -60) : Math.min(g.dx, 60));
      }
    },
    onPanResponderRelease: (_, g) => {
      if (Math.abs(g.dx) > 40) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onReply?.(item);
      }
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
    },
  })).current;

  const handleLongPress = useCallback(() => {
    bubbleRef.current?.measure((_, __, ___, ____, px, py) => {
      setMenuPos({ x: px, y: py });
      setMenuVisible(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    });
  }, []);

  const handleCopy = useCallback(() => {
    Clipboard.setStringAsync(item.content);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [item.content]);

  const handleLike = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onLike?.(item);
  }, [item, onLike]);

  const handleDislike = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDislike?.(item);
  }, [item, onDislike]);

  return (
    <>
      <Animated.View
        style={[st.twinRow, { opacity: fadeAnim, transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <View style={st.twinAvatarContainer}>
          <Image source={APP_LOGO} style={st.twinAvatar} />
          <Text style={[st.twinName, { color: c.text }]}>{twinName || 'MyTwin'}</Text>
          {item.emotion && <Text style={st.emotionEmoji}>{emoji}</Text>}
          <Text style={[st.timestamp, { color: c.subtext }]}>{time}</Text>
        </View>

        <TouchableOpacity
          ref={bubbleRef}
          onLongPress={handleLongPress}
          delayLongPress={350}
          activeOpacity={0.95}
        >
          {item.replyTo && (
            <View style={[st.replyBanner, { backgroundColor: c.accent + '15', borderLeftColor: c.accent }]}>
              <Text style={[st.replyBannerText, { color: c.accent }]} numberOfLines={1}>
                {item.replyTo.content}
              </Text>
            </View>
          )}
          <View style={[st.twinCard, { backgroundColor: c.twinBg, borderColor: c.border }]}>
            <View style={st.twinContent}>
              <MarkdownRenderer content={item.content} isDark={isDark} />
              {isStreaming && <StreamingCursor color={c.accent} />}
            </View>

            {!isStreaming && (
              <View style={[st.actionRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity onPress={handleCopy} style={st.actionBtn}>
                  <Copy size={15} stroke={c.subtext} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Share.share({ message: item.content })} style={st.actionBtn}>
                  <Share2 size={15} stroke={c.subtext} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onReply?.(item)} style={st.actionBtn}>
                  <Reply size={15} stroke={c.subtext} />
                </TouchableOpacity>
                {isLast && (
                  <TouchableOpacity onPress={() => onRegenerate?.(item)} style={st.actionBtn}>
                    <RotateCcw size={15} stroke={c.subtext} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={handleLike}
                  style={[st.actionBtn, isLiked && { backgroundColor: c.likeActive + '20' }]}
                >
                  <ThumbsUp size={15} stroke={isLiked ? c.likeActive : c.subtext} fill={isLiked ? c.likeActive : 'none'} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDislike}
                  style={[st.actionBtn, isDisliked && { backgroundColor: c.dislikeActive + '20' }]}
                >
                  <ThumbsDown size={15} stroke={isDisliked ? c.dislikeActive : c.subtext} fill={isDisliked ? c.dislikeActive : 'none'} />
                </TouchableOpacity>
              </View>
            )}

            {item.failed && (
              <TouchableOpacity onPress={() => onRetry?.(item)} style={st.retryBtn}>
                <RotateCcw size={14} stroke={c.retryColor} />
                <Text style={[st.retryText, { color: c.retryColor }]}>
                  {lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>

      <ContextMenu
        visible={menuVisible}
        x={menuPos.x}
        y={menuPos.y}
        isDark={isDark}
        isUser={false}
        onClose={() => setMenuVisible(false)}
        onCopy={handleCopy}
        onShare={() => Share.share({ message: item.content })}
        onReply={() => onReply?.(item)}
        onRetry={() => onRetry?.(item)}
        onDelete={() => onDelete?.(item.id)}
      />
    </>
  );
});

// ================================================================
// Tool Chip
// ================================================================
export const ToolChip = memo(({ label, icon: Icon, color, onClose }: any) => (
  <View style={[st.toolChip, { backgroundColor: color + '12', borderColor: color + '25' }]}>
    <Icon size={14} stroke={color} />
    <Text style={[st.toolChipText, { color }]}>{label}</Text>
    {onClose && (
      <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <X size={12} stroke={color} />
      </TouchableOpacity>
    )}
  </View>
));

// ================================================================
// Styles
// ================================================================
const st = StyleSheet.create({
  // User
  userRow:    { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 20, paddingHorizontal: 12 },
  userBubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, borderBottomRightRadius: 4, maxWidth: '85%' },
  userText:   { fontSize: 16, lineHeight: 24 },
  userTime:   { fontSize: 10, marginTop: 4, textAlign: 'right' },
  // Twin
  twinRow:             { marginBottom: 24, paddingHorizontal: 12 },
  twinAvatarContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10, flexWrap: 'wrap' },
  twinAvatar:          { width: 36, height: 36, borderRadius: 18 },
  twinName:            { fontSize: 14, fontWeight: '700' },
  twinCard:            { borderRadius: 20, borderWidth: 0.5, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  emotionEmoji:        { fontSize: 14 },
  timestamp:           { fontSize: 11 },
  twinContent:         { marginBottom: 12, flexDirection: 'row', flexWrap: 'wrap' },
  actionRow:           { alignItems: 'center', gap: 2, marginTop: 4, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: '#E8E8EA' },
  actionBtn:           { padding: 8, borderRadius: 8 },
  retryBtn:            { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: 10, backgroundColor: 'rgba(255,59,48,0.08)', alignSelf: 'flex-start', marginTop: 8 },
  retryText:           { fontSize: 13, fontWeight: '600' },
  // Reply
  replyPreview:        { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: 8, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: 'rgba(255,255,255,0.6)' },
  replyPreviewText:    { color: 'rgba(255,255,255,0.9)', fontSize: 12 },
  replyBanner:         { borderLeftWidth: 3, borderRadius: 8, padding: 10, marginBottom: 6 },
  replyBannerText:     { fontSize: 13, fontWeight: '600' },
  // Context Menu
  menuOverlay:     { ...StyleSheet.absoluteFillObject, zIndex: 998 },
  contextMenu:     { position: 'absolute', zIndex: 999, borderRadius: 14, paddingVertical: 6, minWidth: 160, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 20 },
  menuItem:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  menuItemText:    { fontSize: 15, fontWeight: '600' },
  // Streaming
  cursor:          { width: 2, height: 18, borderRadius: 1, marginLeft: 2, marginTop: 4 },
  // Tool Chip
  toolChip:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  toolChipText: { fontSize: 13, fontWeight: '600' },
});
