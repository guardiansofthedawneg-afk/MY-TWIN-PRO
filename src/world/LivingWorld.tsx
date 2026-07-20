import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableWithoutFeedback, ActivityIndicator } from 'react-native';
import { stateBus } from '../core/StateBus';
import { EventBus } from '../core/EventBus';
import { unifiedBrainBridge, UnifiedResponse } from '../core/UnifiedBrainBridge';
import { perceptionEngine } from '../../engine/perception/PerceptionEngine';
import { presenceEngine } from '../../engine/presence/PresenceEngine';
import { getGreeting } from '../utils/languageDetector';
import { useRTL } from '../../lib/useRTL';
import { useAppTheme } from '../../engine/colors';
import { capabilityOrchestrator } from '../coordinators/CapabilityOrchestrator';
import BirthSequence from '../renderers/zones/BirthSequence';
import GreetingWord from '../renderers/zones/GreetingWord';
import ThinkingIndicator from '../renderers/zones/ThinkingIndicator';
import SignatureMomentOverlay from '../renderers/zones/SignatureMomentOverlay';
import SilencePresence from '../renderers/zones/SilencePresence';
import MemoryRibbon from '../renderers/zones/MemoryRibbon';
import ConnectionField from '../renderers/zones/ConnectionField';
import AmbientField from './AmbientField';
import TwinPresenceZone from './TwinPresenceZone';
import ContextOverlay from './ContextOverlay';
import WorkspacePortal from './WorkspacePortal';
import SoulObservatory from './SoulObservatory/SoulObservatory';
import WorldTransition from './WorldTransition';
import StudyCapability from './StudyCapability';
import DeveloperLabCapability from './DeveloperLabCapability';
import BusinessCapability from './BusinessCapability';
import ContentCreatorCapability from './ContentCreatorCapability';
import DreamCapability from './DreamCapability';
import LifeCoachCapability from './LifeCoachCapability';
import TaskManagerCapability from './TaskManagerCapability';
import AIImageCapability from './AIImageCapability';
import SmartHomeCapability from './SmartHomeCapability';
import QuickActions from './QuickActions';
import DailyTimeline from './DailyTimeline';
import SessionSurface from './SessionSurface';
import LivingTimeline from './LivingTimeline';
import MemoryForest from './MemoryForest';
import LivingLightEntity from '../renderers/zones/LivingLightEntity';
import ConversationSpace from './ConversationSpace';
import { useTwinStore } from '../../store/useTwinStore';
import { audioMixer } from '../core/AudioMixer';
import { SPACE, RADIUS } from '../../src/design/tokens/spacing';

export default function LivingWorld() {
  const { colors } = useAppTheme();
  const { colors } = useAppTheme();
  const userId = useTwinStore(s => s.userId) || '';
  const rtl = useRTL();
  const { colors } = useAppTheme();
  const greeting = getGreeting();

  const [birthComplete, setBirthComplete] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [greetingDone, setGreetingDone] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Array<{ id: string; sender: 'user' | 'twin'; text: string }>>([]);
  const [showInput, setShowInput] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingPhase, setThinkingPhase] = useState<{ phase: string; progress: number; label: string } | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [memoryEchoVisible, setMemoryEchoVisible] = useState(false);
  const [echoColor, setEchoColor] = useState(colors.accent);
  const [isWriting, setIsWriting] = useState(false);
  const messagesEndRef = useRef<View>(null);

  // تهيئة userId للجسر
  useEffect(() => {
    if (userId) unifiedBrainBridge.setUserId(userId);
  }, [userId]);

  // بدء حلقة الحضور (بعد أن تصبح PresenceEngine مستهلكاً)
  useEffect(() => {
    presenceEngine.startPresenceLoop();
    return () => presenceEngine.stopPresenceLoop();
  }, []);

  // استماع لتغيرات audio من stateBus
  useEffect(() => {
    const unsubscribe = stateBus.on('presence:state_updated', (event: string, data: any) => {
      if (data.warmth > 0.8) audioMixer.setContext('celebration');
      else if (data.focusLevel > 0.8) audioMixer.setContext('study');
      else if (data.energyLevel < 0.3) audioMixer.setContext('silence');
      else audioMixer.setContext('conversation');
    });
    return unsubscribe;
  }, []);

  // استماع لـ MEMORY_SURFACED من EventBus (قد يأتي من UnifiedBrainBridge)
  useEffect(() => {
    const unsub = EventBus.on('MEMORY_SURFACED', (payload: any) => {
      setEchoColor(payload?.color || colors.accent);
      setMemoryEchoVisible(true);
      setTimeout(() => setMemoryEchoVisible(false), 1200);
    });
    return unsub;
  }, []);

  // تحديث آخر رسالة بالـ streamedText
  useEffect(() => {
    if (streamedText && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender === 'twin') {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], text: streamedText };
          return updated;
        });
      }
    }
  }, [streamedText]);

  const handleBirthComplete = useCallback(() => {
    setBirthComplete(true);
    // بدء تسلسل التحية
    setTimeout(() => setShowGreeting(true), 1500);
  }, []);

  const handleGreetingComplete = useCallback(() => {
    setGreetingDone(true);
    setShowInput(true);
  }, []);

  const handleFirstInteraction = useCallback(() => {
    if (!greetingDone) return;
    setShowInput(true);
  }, [greetingDone]);

  // إرسال رسالة
  const handleSend = useCallback(async () => {
    if (!inputText.trim() || isThinking) return;
    const text = inputText.trim();

    // جمع بيانات الإدراك
    const perceptionResult = perceptionEngine.analyze(text);
    const perception = {
      typingSpeed: perceptionResult.typingSpeed || 0,
      messageLength: text.length,
      absenceDurationMinutes: 0,
      timeOfDay: 'morning',
      userState: perceptionResult.userState,
    };

    // إضافة رسالة المستخدم للعرض
    setInputText('');
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user' as const, text }]);
    EventBus.emit('USER_SEND_MESSAGE', { message: text, timestamp: Date.now() });

    // إضافة رسالة مؤقتة للتوأم
    const twinMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: twinMsgId, sender: 'twin', text: '' }]);

    setIsThinking(true);
    setStreamedText('');

    try {
      // إرسال عبر الجسر الموحد
      const response: UnifiedResponse = await unifiedBrainBridge.process(text, {
        typingSpeed: perception.typingSpeed,
        messageLength: perception.messageLength,
        absenceDurationMinutes: perception.absenceDuration,
        timeOfDay: (perception.timeOfDay as 'morning' | 'afternoon' | 'evening' | 'night') || 'morning',
        userState: perception.userState,
      });

      // تحديث StateBus من الاستجابة (سيغذي PresenceEngine و LivingLightEntity)
      stateBus.updateFromUnifiedResponse(response);

      // عرض الذاكرة المسترجعة إن وجدت
      if (response.memory_surfaced) {
        EventBus.emit('MEMORY_SURFACED', {
          memoryId: response.memory_surfaced.id,
          relevance: 0.8,
          emotionalWeight: 0.7,
          color: colors.accent,
        });
      }

      // تحديث حالة التحدث
      setIsSpeaking(response.reply.length > 0);
      setStreamedText(response.reply);
      
      // محاكاة مراحل التفكير (اختياري)
      if (response.timing) {
        setThinkingPhase({ phase: 'observe', progress: 0, label: 'يراقب...' });
        setTimeout(() => setThinkingPhase({ phase: 'understand', progress: 0.25, label: 'يفهم...' }), response.timing.observe_ms);
        setTimeout(() => setThinkingPhase({ phase: 'recall', progress: 0.5, label: 'يتذكر...' }), response.timing.observe_ms + response.timing.understand_ms);
        setTimeout(() => setThinkingPhase({ phase: 'reason', progress: 0.75, label: 'يفكر...' }), response.timing.observe_ms + response.timing.understand_ms + response.timing.recall_ms);
        setTimeout(() => {
          setThinkingPhase(null);
          setIsThinking(false);
        }, response.timing.observe_ms + response.timing.understand_ms + response.timing.recall_ms + response.timing.reason_ms);
      } else {
        setTimeout(() => {
          setThinkingPhase(null);
          setIsThinking(false);
        }, 1000);
      }

      // تحديث Zustand stores
      const store = useTwinStore.getState?.() || {};
      if (response.twin_state_update) {
        store.updateFromUnifiedResponse?.(response);
      }

    } catch (error) {
      console.error('Error processing message:', error);
      setIsThinking(false);
      setThinkingPhase(null);
      setStreamedText('');
    }
  }, [inputText, isThinking]);

  if (!birthComplete) return <BirthSequence onComplete={handleBirthComplete} />;

  return (
    <WorldTransition>
      <TouchableWithoutFeedback onPress={handleFirstInteraction}>
        <View style={styles.container}>
          <AmbientField />
          
          <LivingLightEntity 
            isThinking={isThinking}
            isSpeaking={isSpeaking}
            isListening={!isThinking && !isSpeaking}
            onLongPress={() => EventBus.emit('OPEN_SOUL_OBSERVATORY')}
          />
          
          <SoulObservatory />
          <ConnectionField visible={true} />

          <TwinPresenceZone
            onLongPress={() => EventBus.emit('OPEN_SOUL_OBSERVATORY')}
            memoryEchoVisible={memoryEchoVisible}
            echoColor={echoColor}
            awakeningEyesOpen={true}
          />

          <ContextOverlay />
          <SessionSurface />

          <View style={styles.capabilityContainer}>
            <StudyCapability />
            <DeveloperLabCapability />
            <BusinessCapability />
            <ContentCreatorCapability />
            <DreamCapability />
            <LifeCoachCapability />
            <TaskManagerCapability />
            <AIImageCapability />
            <SmartHomeCapability />
          </View>

          <View style={styles.conversationContainer}>
            <ConversationSpace
              isThinking={isThinking}
              isWriting={isWriting}
            >
              {showGreeting && !greetingDone && (
                <GreetingWord
                  word={greeting.word} colors={greeting.colors}
                  transitionSpeed={greeting.transitionSpeed}
                  fontSize={greeting.fontSize} fontWeight={greeting.fontWeight}
                  onComplete={handleGreetingComplete}
                />
              )}
              {messages.map(msg => (
                <Text key={msg.id} style={[
                  msg.sender === 'user' ? styles.userMessage : styles.twinMessage,
                  { textAlign: msg.sender === 'user' ? rtl.textAlign : (rtl.isRTL ? 'left' : 'right') }
                ]}>
                  {msg.text}
                </Text>
              ))}
              {isThinking && thinkingPhase && <ThinkingIndicator phase={thinkingPhase} lang={rtl.isRTL ? 'ar' : 'en'} />}
              <SilencePresence />
            </ConversationSpace>
          </View>

          <View style={styles.portalContainer}>
            <WorkspacePortal />
          </View>

          <View style={styles.memoryContainer}>
            <MemoryRibbon userId={userId} maxCards={2} />
          </View>

          <QuickActions />
          <DailyTimeline />
          <LivingTimeline />
          <MemoryForest />

          {showInput && (
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { textAlign: rtl.textAlign }]}
                value={inputText}
                onChangeText={(text) => {
                  setInputText(text);
                  setIsWriting(text.length > 0);
                  if (text.length === 1) perceptionEngine.registerTypingStart();
                  perceptionEngine.registerKeystroke(text.length);
                }}
                onSubmitEditing={handleSend}
                editable={!isThinking}
                placeholder={rtl.isRTL ? 'اكتب رسالتك...' : 'Write your message...'}
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          )}

          <SignatureMomentOverlay />
        </View>
      </TouchableWithoutFeedback>
    </WorldTransition>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  capabilityContainer: {
    position: 'absolute', top: 100, left: 0, right: 0, zIndex: 15,
  },
  conversationContainer: {
    position: 'absolute', bottom: 280, left: SPACE.lg, right: SPACE.lg,
    zIndex: 15,
  },
  portalContainer: {
    position: 'absolute', bottom: 180, left: 0, right: 0, zIndex: 12,
  },
  memoryContainer: {
    position: 'absolute', bottom: 100, left: 0, right: 0, zIndex: 11,
  },
  userMessage: { color: colors.textSecondary, fontSize: 18, alignSelf: 'flex-end', marginVertical: SPACE.xs },
  twinMessage: { color: colors.text, fontSize: 20, alignSelf: 'flex-start', marginVertical: SPACE.xs },
  inputContainer: {
    position: 'absolute', bottom: 30, left: SPACE.lg, right: SPACE.lg,
    padding: SPACE.md, backgroundColor: colors.card,
    borderRadius: RADIUS.input, zIndex: 20,
  },
  input: { color: colors.text, fontSize: 18 },
});
