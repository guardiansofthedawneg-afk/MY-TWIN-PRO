import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, FlatList, StyleSheet, KeyboardAvoidingView,
  Platform, Image, Animated, Text, Alert,
  TouchableOpacity, Modal, TextInput, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useTwinStore } from '../../store/useTwinStore';
import { useTheme } from '../../utils/theme';
import { apiPost, apiGet } from '../../lib/httpClient';
import { speakResponse, stopSpeaking } from '../../utils/voice_engine';
import { startVoiceCall, endVoiceCall } from '../../utils/voice_call_engine';
import TypingIndicator from '../../components/TypingIndicator';
import {
  Menu, Volume2, VolumeX, Phone, PhoneOff,
  X, Sparkles, ChevronDown,
} from 'lucide-react-native';
import { COLORS, ThinkingBar, WelcomeState, EnergyModal } from './ChatComponents';
import { UserBubble, TwinBubble, ToolChip } from './ChatBubbles';
import { ChatInput } from './ChatInput';

type CallState = 'idle' | 'listening' | 'thinking' | 'speaking';
const { width: SCREEN_W } = Dimensions.get('window');
const APP_LOGO = require('../../assets/logo.png');

let _lastEnergyModalTime = 0;

export default function Chat() {
  const insets = useSafeAreaInsets();
  const {
    userId, twinName, chatHistory, addMessage,
    lang, twinEnergy, setTwinEnergy, updateBond, bondLevel,
    openMenu, voiceEnabled, setVoiceEnabled,
  } = useTwinStore();
  const { isDark } = useTheme();
  const isRTL = lang === 'ar';
  const isAr  = lang === 'ar';
  const colors = isDark ? COLORS.dark : COLORS.light;

  const [input,            setInput]            = useState('');
  const [loading,          setLoading]          = useState(false);
  const [streamingId,      setStreamingId]      = useState<string | null>(null);
  const [showAttach,       setShowAttach]       = useState(false);
  const [activeToolsList,  setActiveToolsList]  = useState<any[]>([]);
  const [isRecording,      setIsRecording]      = useState(false);
  const [showEnergyModal,  setShowEnergyModal]  = useState(false);
  const [adStatus,         setAdStatus]         = useState<any>(null);
  const [thinkingStage,    setThinkingStage]    = useState('idle');
  const [avatarUrl,        setAvatarUrl]        = useState<string | null>(null);
  const [moodLabel,        setMoodLabel]        = useState('');
  const [inCall,           setInCall]           = useState(false);
  const [callTime,         setCallTime]         = useState(0);
  const [callState,        setCallState]        = useState<CallState>('idle');
  const [callReply,        setCallReply]        = useState('');
  const [showScrollBtn,    setShowScrollBtn]    = useState(false);
  const [replyTo,          setReplyTo]          = useState<any>(null);
  const [feedbackVisible,  setFeedbackVisible]  = useState(false);
  const [feedbackText,     setFeedbackText]     = useState('');
  const [feedbackItemId,   setFeedbackItemId]   = useState<string | null>(null);

  const flatRef        = useRef<FlatList>(null);
  const attachAnim     = useRef(new Animated.Value(0)).current;
  const heartbeatAnim  = useRef(new Animated.Value(1)).current;
  const waveAnim1      = useRef(new Animated.Value(0)).current;
  const waveAnim2      = useRef(new Animated.Value(0)).current;
  const waveAnim3      = useRef(new Animated.Value(0)).current;
  const callTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamingText  = useRef('');

  const energyColor = twinEnergy > 60 ? '#34C759' : twinEnergy > 25 ? '#FF9500' : '#FF3B30';

  useEffect(() => {
    let anim: Animated.CompositeAnimation;
    const t = setTimeout(() => {
      anim = Animated.loop(Animated.sequence([
        Animated.timing(heartbeatAnim, { toValue: 1.12, duration: 600, useNativeDriver: true }),
        Animated.timing(heartbeatAnim, { toValue: 1,    duration: 600, useNativeDriver: true }),
      ]));
      anim.start();
    }, 1000);
    return () => { clearTimeout(t); anim?.stop(); };
  }, []);

  useEffect(() => {
    if (!inCall) {
      waveAnim1.setValue(0); waveAnim2.setValue(0); waveAnim3.setValue(0);
      return;
    }
    const anims = [waveAnim1, waveAnim2, waveAnim3].map((a, i) =>
      Animated.loop(Animated.sequence([
        Animated.timing(a, { toValue: 1,   duration: 800 + i * 200, useNativeDriver: true }),
        Animated.timing(a, { toValue: 0.2, duration: 800 + i * 200, useNativeDriver: true }),
      ]))
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, [inCall]);

  useEffect(() => {
    if (inCall) {
      callTimerRef.current = setInterval(() => setCallTime(p => p + 1), 1000);
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      setCallTime(0);
    }
    return () => { if (callTimerRef.current) clearInterval(callTimerRef.current); };
  }, [inCall]);

  useEffect(() => {
    Animated.spring(attachAnim, {
      toValue:  showAttach ? 1 : 0,
      tension:  65, friction: 11, useNativeDriver: true,
    }).start();
  }, [showAttach]);

  useEffect(() => {
    if (!userId) return;
    const g = useTwinStore.getState().twinGender || 'female';
    apiGet(`/api/avatar/get?user_id=${userId}&gender=${g}`)
      .then(res => { if (res?.image_url) setAvatarUrl(res.image_url); })
      .catch(() => {});
    apiGet(`/api/consciousness/status?user_id=${userId}&lang=${lang}`)
      .then((res: any) => { if (res?.mood_label) setMoodLabel(res.mood_label); })
      .catch(() => {});
    apiGet('/api/ads/status').then(setAdStatus).catch(() => {});
  }, [userId, lang]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const handleScroll = useCallback((e: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const distFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
    setShowScrollBtn(distFromBottom > 150);
  }, []);

  const scrollToBottom = useCallback(() => {
    flatRef.current?.scrollToEnd({ animated: true });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleLike = useCallback((item: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addMessage({
      id: 'like_' + Date.now(),
      role: 'twin',
      content: isAr ? 'شكراً لك! 💜' : 'Thank you! 💜',
      timestamp: Date.now(),
    });
    item.liked = true;
  }, [addMessage, isAr]);

  const handleDislike = useCallback((item: any) => {
    setFeedbackItemId(item.id);
    setFeedbackVisible(true);
    item.disliked = true;
  }, []);

  const handleReply = useCallback((item: any) => {
    setReplyTo(item);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const submitFeedback = useCallback(async () => {
    if (!feedbackText.trim()) return;
    try {
      await apiPost('/api/feedback', { message_id: feedbackItemId, feedback: feedbackText, type: 'dislike' });
    } catch {}
    addMessage({
      id: 'fb_' + Date.now(),
      role: 'twin',
      content: isAr ? 'شكراً لملاحظاتك! 💜' : 'Thanks for the feedback! 💜',
      timestamp: Date.now(),
    });
    setFeedbackVisible(false);
    setFeedbackText('');
    setFeedbackItemId(null);
  }, [feedbackText, feedbackItemId, addMessage, isAr]);

  const toggleTTS = useCallback(() => {
    if (voiceEnabled) stopSpeaking();
    setVoiceEnabled(!voiceEnabled);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [voiceEnabled, setVoiceEnabled]);

  const startCall = useCallback(async () => {
    setInCall(true);
    setCallState('listening');
    setCallReply('');
    await startVoiceCall(userId, twinName, lang, (state: string, text?: string) => {
      setCallState(state as CallState);
      if (text) setCallReply(text);
    });
  }, [userId, twinName, lang]);

  const endCall = useCallback(async () => {
    await endVoiceCall();
    setInCall(false);
    setCallState('idle');
    setCallReply('');
  }, []);

  const sendMessage = useCallback(async (msg?: string, imageBase64?: string) => {
    const message = (msg || input).trim();
    if (!message && !imageBase64 && activeToolsList.length === 0) return;
    if (loading) return;

    if (twinEnergy <= 0 && activeToolsList.length === 0) {
      const now = Date.now();
      if (now - _lastEnergyModalTime > 60000) {
        _lastEnergyModalTime = now;
        const freshAds = await apiGet('/api/ads/status').catch(() => null);
        setAdStatus(freshAds);
        setShowEnergyModal(true);
      }
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const msgId = Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    addMessage({
      id:        msgId,
      role:      'user',
      content:   message || '📷',
      image:     imageBase64,
      timestamp: Date.now(),
    });
    setInput('');
    setReplyTo(null);
    setLoading(true);
    setThinkingStage('thinking');

    const twinMsgId = 'twin_' + Date.now().toString(36);
    streamingText.current = '';

    try {
      setThinkingStage('memory');
      await new Promise(r => setTimeout(r, 300));
      setThinkingStage('generating');

      addMessage({
        id:        twinMsgId,
        role:      'twin',
        content:   '',
        timestamp: Date.now(),
      });
      setStreamingId(twinMsgId);

      const response = await apiPost('/api/chat', {
        message,
        history: chatHistory.slice(-10).map(m => ({ role: m.role, content: m.content })),
        lang,
      });

      const reply = response?.reply || (isAr ? 'عذراً، حدث خطأ 💜' : 'Sorry, something went wrong 💜');
      const finalEmotion = response?.emotion?.primary || 'neutral';

      const currentHistory = useTwinStore.getState().chatHistory;
      const updatedHistory = currentHistory.map((m: any) =>
        m.id === twinMsgId
          ? { ...m, content: reply, emotion: finalEmotion, provider: response?.provider }
          : m
      );
      useTwinStore.setState({ chatHistory: updatedHistory });

      setStreamingId(null);
      setThinkingStage('completed');

      if (voiceEnabled && !inCall) {
        try { await speakResponse(reply); } catch {}
      }

      updateBond(Math.min(bondLevel + (Math.random() * 0.3 + 0.1), 100));
      setTimeout(() => setThinkingStage('idle'), 2000);

    } catch (error: any) {
      const currentHistory = useTwinStore.getState().chatHistory;
      const updatedHistory = currentHistory.map((m: any) =>
        m.id === twinMsgId
          ? { ...m, content: isAr ? 'عذراً، حدث خطأ في الاتصال 💜' : 'Connection error 💜', failed: true }
          : m
      );
      useTwinStore.setState({ chatHistory: updatedHistory });
      setStreamingId(null);
    } finally {
      setLoading(false);
    }
  }, [input, loading, voiceEnabled, lang, addMessage, activeToolsList,
      twinEnergy, chatHistory, bondLevel, updateBond, inCall]);

  const send = useCallback(
    (msg?: string, imageBase64?: string) => sendMessage(msg, imageBase64),
    [sendMessage]
  );

  const renderMsg = useCallback(({ item, index }: any) => {
    const isLast = index === chatHistory.length - 1;
    if (item.role === 'user') {
      return (
        <UserBubble
          item={item} isDark={isDark} isRTL={isRTL}
          onReply={handleReply}
        />
      );
    }
    return (
      <TwinBubble
        item={item} isDark={isDark} isRTL={isRTL}
        isLast={isLast} isStreaming={streamingId === item.id}
        onCopy={() => {}} onRetry={() => send(item.content)}
        onRegenerate={() => send(item.content)}
        onLike={() => handleLike(item)} onDislike={() => handleDislike(item)}
        onReply={handleReply}
        lang={lang} twinName={twinName}
      />
    );
  }, [isDark, isRTL, lang, twinName, streamingId, chatHistory.length,
      handleLike, handleDislike, handleReply, send]);

  if (inCall) {
    return (
      <View style={[st.callRoot, { backgroundColor: isDark ? '#0A0014' : '#F5F0FF' }]}>
        <StatusBar style="light" />
        <View style={st.callBgGlow}>
          <Animated.View style={[st.callGlowCircle,  { opacity: waveAnim1, transform: [{ scale: waveAnim1.interpolate({ inputRange: [0,1], outputRange: [0.8, 1.5] }) }] }]} />
          <Animated.View style={[st.callGlowCircle2, { opacity: waveAnim2, transform: [{ scale: waveAnim2.interpolate({ inputRange: [0,1], outputRange: [0.8, 1.3] }) }] }]} />
        </View>
        <View style={st.callContainer}>
          <Animated.View style={{ transform: [{ scale: heartbeatAnim }] }}>
            <View style={st.callAvatarGlow}>
              <Image source={avatarUrl ? { uri: avatarUrl } : APP_LOGO} style={st.callAvatar} />
            </View>
          </Animated.View>
          <Text style={st.callName}>{twinName}</Text>
          <View style={st.callStateRow}>
            <Animated.View style={{ opacity: waveAnim1 }}><Sparkles size={16} stroke={colors.accent} /></Animated.View>
            <Text style={st.callStatus}>
              {callState === 'listening' ? (isAr ? 'أستمع إليك...' : 'Listening...') :
               callState === 'speaking'  ? (isAr ? 'أحدثك...'      : 'Speaking...')  :
               callState === 'thinking'  ? (isAr ? 'أفكر...'        : 'Thinking...')  :
               isAr ? 'جاري الاتصال...' : 'Connecting...'}
            </Text>
          </View>
          {callReply && callState === 'speaking' && (
            <View style={st.callReplyCard}>
              <Text style={st.callReplyText} numberOfLines={3}>{callReply}</Text>
            </View>
          )}
          <Text style={st.callTimeText}>{formatTime(callTime)}</Text>
          <View style={st.callWaveContainer}>
            {[waveAnim1, waveAnim2, waveAnim3, waveAnim1, waveAnim2, waveAnim3, waveAnim1].map((a, i) => (
              <Animated.View key={i} style={[
                st.callWave,
                {
                  height:           20 + (i % 3) * 14,
                  opacity:          a.interpolate({ inputRange: [0.2, 1], outputRange: [0.3, 0.9] }),
                  transform:        [{ scaleY: a }],
                  backgroundColor:  callState === 'speaking' ? '#10B981' : colors.accent,
                },
              ]} />
            ))}
          </View>
        </View>
        <TouchableOpacity style={st.endCallBtn} onPress={endCall} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <PhoneOff size={28} stroke="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={st.backToChatBtn} onPress={endCall}>
          <Text style={st.backToChatText}>{isAr ? 'العودة للمحادثة' : 'Back to Chat'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[st.root, { backgroundColor: colors.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[st.header, {
          paddingTop:         insets.top + 4,
          backgroundColor:    colors.headerBg,
          borderBottomColor:  colors.border,
        }]}>
          <TouchableOpacity onPress={openMenu} style={st.iconBtn}>
            <Menu size={22} stroke={colors.text} />
          </TouchableOpacity>

          <View style={st.headerCenter}>
            <Animated.View style={{ transform: [{ scale: heartbeatAnim }] }}>
              <Image source={avatarUrl ? { uri: avatarUrl } : APP_LOGO} style={st.headerAvatar} />
            </Animated.View>
            <View>
              <Text style={[st.headerName, { color: colors.text }]}>{twinName}</Text>
              <View style={st.headerMeta}>
                {moodLabel ? <Text style={[st.moodText, { color: colors.subtext }]}>{moodLabel}</Text> : null}
                <View style={[st.energyDot, { backgroundColor: energyColor }]} />
                <Text style={[st.energyText, { color: colors.subtext }]}>⚡ {twinEnergy}%</Text>
              </View>
            </View>
          </View>

          <View style={st.headerIcons}>
            <TouchableOpacity onPress={startCall} style={st.iconBtn}>
              <Phone size={20} stroke={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleTTS} style={st.iconBtn}>
              {voiceEnabled
                ? <Volume2  size={20} stroke={colors.accent}  />
                : <VolumeX  size={20} stroke={colors.subtext} />
              }
            </TouchableOpacity>
          </View>
        </View>

        {replyTo && (
          <View style={[st.replyBanner, { backgroundColor: colors.accent + '15', borderLeftColor: colors.accent }]}>
            <Text style={[st.replyBannerText, { color: colors.accent }]} numberOfLines={1}>
              {isAr ? 'رد على: ' : 'Replying to: '}{replyTo.content}
            </Text>
            <TouchableOpacity onPress={() => setReplyTo(null)}>
              <X size={16} stroke={colors.accent} />
            </TouchableOpacity>
          </View>
        )}

        <View style={{ flex: 1 }}>
          <FlatList
            ref={flatRef}
            data={chatHistory}
            keyExtractor={item => item.id}
            renderItem={renderMsg}
            ListHeaderComponent={
              chatHistory.length === 0
                ? <WelcomeState isDark={isDark} lang={lang} twinName={twinName} onSuggestion={send} />
                : null
            }
            ListFooterComponent={
              loading && !streamingId
                ? (
                  <View>
                    <View style={st.typingRow}>
                      <Image source={avatarUrl ? { uri: avatarUrl } : APP_LOGO} style={st.typingAvatar} />
                      <TypingIndicator />
                    </View>
                    <ThinkingBar stage={thinkingStage} isDark={isDark} lang={lang} />
                  </View>
                )
                : null
            }
            contentContainerStyle={st.listContent}
            onContentSizeChange={() => {
              if (!showScrollBtn) flatRef.current?.scrollToEnd({ animated: false });
            }}
            onScroll={handleScroll}
            scrollEventThrottle={100}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          />

          {showScrollBtn && (
            <TouchableOpacity style={[st.scrollBtn, { backgroundColor: colors.accent }]} onPress={scrollToBottom}>
              <ChevronDown size={20} stroke="#FFF" />
            </TouchableOpacity>
          )}
        </View>

        {activeToolsList.length > 0 && (
          <View style={[st.toolsRow, { backgroundColor: colors.headerBg, borderTopColor: colors.border }]}>
            {activeToolsList.map((tool: any) => (
              <ToolChip
                key={tool.id}
                label={tool.label} icon={tool.icon} color={tool.color}
                onClose={() => setActiveToolsList(prev => prev.filter(t => t.id !== tool.id))}
              />
            ))}
          </View>
        )}

        <ChatInput
          input={input} setInput={setInput} loading={loading}
          isRTL={isRTL} isDark={isDark} colors={colors} lang={lang}
          onSend={send}
          showAttach={showAttach} setShowAttach={setShowAttach} attachAnim={attachAnim}
          bottomInset={Math.max(insets.bottom - 8, 4)}
          isRecording={isRecording}
          onMicPress={() => setIsRecording(p => !p)}
          onCallPress={startCall}
          onAddTool={(tool: any) => setActiveToolsList(prev => {
            if (prev.find(t => t.id === tool.id)) return prev;
            return [...prev, tool];
          })}
          activeTools={activeToolsList}
          onRemoveTool={(id: string) => setActiveToolsList(prev => prev.filter(t => t.id !== id))}
        />
      </KeyboardAvoidingView>

      <EnergyModal
        visible={showEnergyModal}
        onClose={() => setShowEnergyModal(false)}
        onWatchAd={async () => {
          setShowEnergyModal(false);
          try {
            const data = await apiPost('/api/ads/reward', { ad_type: 'rewarded' });
            if (data?.success) {
              setTwinEnergy(Math.min(100, twinEnergy + 20));
              setAdStatus(await apiGet('/api/ads/status').catch(() => null));
            }
          } catch {
            Alert.alert(isAr ? 'خطأ' : 'Error', isAr ? 'فشل تحميل الإعلان' : 'Ad failed to load');
          }
        }}
        adStatus={adStatus}
        lang={lang}
      />

      <Modal visible={feedbackVisible} transparent animationType="slide" onRequestClose={() => setFeedbackVisible(false)}>
        <View style={st.modalOverlay}>
          <View style={[st.modalContent, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            <View style={st.modalHeader}>
              <Text style={[st.modalTitle, { color: colors.text }]}>
                {isAr ? 'أخبرنا لماذا؟' : 'Tell us why?'}
              </Text>
              <TouchableOpacity onPress={() => setFeedbackVisible(false)}>
                <X size={24} stroke={colors.text} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[st.modalInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border, textAlign: isAr ? 'right' : 'left' }]}
              placeholder={isAr ? 'اكتب ملاحظاتك...' : 'Write feedback...'}
              placeholderTextColor={colors.subtext}
              value={feedbackText}
              onChangeText={setFeedbackText}
              multiline
            />
            <TouchableOpacity
              style={[st.modalSubmit, { backgroundColor: colors.accent, opacity: feedbackText.trim() ? 1 : 0.5 }]}
              onPress={submitFeedback}
              disabled={!feedbackText.trim()}
            >
              <Text style={st.modalSubmitText}>{isAr ? 'إرسال' : 'Submit'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  root:         { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 0.5 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'center' },
  headerAvatar: { width: 36, height: 36, borderRadius: 18 },
  headerName:   { fontSize: 16, fontWeight: '700' },
  headerMeta:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  moodText:     { fontSize: 11, fontWeight: '500' },
  energyDot:    { width: 6, height: 6, borderRadius: 3 },
  energyText:   { fontSize: 11, fontWeight: '600' },
  headerIcons:  { flexDirection: 'row', gap: 4 },
  iconBtn:      { padding: 8, borderRadius: 10 },
  replyBanner:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderLeftWidth: 3 },
  replyBannerText: { fontSize: 13, fontWeight: '600', flex: 1, marginRight: 8 },
  listContent:  { paddingVertical: 8, flexGrow: 1 },
  typingRow:    { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingVertical: 10, gap: 10 },
  typingAvatar: { width: 28, height: 28, borderRadius: 14 },
  toolsRow:     { flexDirection: 'row', flexWrap: 'wrap', padding: 8, borderTopWidth: 0.5, gap: 6 },
  scrollBtn:    { position: 'absolute', bottom: 16, right: 16, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  callRoot:          { flex: 1, justifyContent: 'center', alignItems: 'center' },
  callBgGlow:        { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  callGlowCircle:    { position: 'absolute', width: SCREEN_W * 0.6, height: SCREEN_W * 0.6, borderRadius: SCREEN_W * 0.3, backgroundColor: '#7C3AED20' },
  callGlowCircle2:   { position: 'absolute', width: SCREEN_W * 0.4, height: SCREEN_W * 0.4, borderRadius: SCREEN_W * 0.2, backgroundColor: '#A78BFA15' },
  callContainer:     { alignItems: 'center', gap: 16, zIndex: 10 },
  callAvatarGlow:    { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#7C3AED', justifyContent: 'center', alignItems: 'center', shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
  callAvatar:        { width: 100, height: 100, borderRadius: 50 },
  callName:          { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  callStateRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  callStatus:        { fontSize: 16, color: '#A78BFA' },
  callReplyCard:     { backgroundColor: '#7C3AED15', borderRadius: 16, padding: 16, maxWidth: '80%', borderWidth: 1, borderColor: '#7C3AED30' },
  callReplyText:     { fontSize: 15, color: '#A78BFA', textAlign: 'center', lineHeight: 24 },
  callTimeText:      { fontSize: 18, fontWeight: '600', color: '#7C3AED' },
  callWaveContainer: { flexDirection: 'row', gap: 4, height: 60, alignItems: 'flex-end' },
  callWave:          { width: 5, borderRadius: 3 },
  endCallBtn:        { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', marginTop: 30, shadowColor: '#EF4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  backToChatBtn:     { marginTop: 16, padding: 10 },
  backToChatText:    { color: '#A78BFA', fontSize: 13, fontWeight: '600' },
  modalOverlay:     { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent:     { width: '90%', borderRadius: 20, padding: 24 },
  modalHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle:       { fontSize: 18, fontWeight: '700' },
  modalInput:       { borderRadius: 14, borderWidth: 1, padding: 14, fontSize: 15, marginBottom: 16, minHeight: 100, textAlignVertical: 'top' },
  modalSubmit:      { borderRadius: 14, padding: 14, alignItems: 'center' },
  modalSubmitText:  { color: '#FFF', fontWeight: '700', fontSize: 16 },
});
