import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { usePresence } from '../hooks/usePresence';
import { useBreathAnimation } from '../hooks/useBreathAnimation';
import { useEmotionalState } from '../hooks/useEmotionalState';
import { useBondLevel } from '../hooks/useBondLevel';
import { useTwinBrain } from '../hooks/useTwinBrain';
import { EventBus } from '../core/EventBus';
import { stateBus } from '../core/StateBus';
import { unifiedBrainBridge } from '../core/UnifiedBrainBridge';
import { existenceLoop } from '../core/ExistenceLoop';
import { getGreeting } from '../utils/languageDetector';
import { useRTL } from '../../lib/useRTL';
import { capabilityOrchestrator } from '../coordinators/CapabilityOrchestrator';
import { presenceEngine } from '../../engine/presence/PresenceEngine';
import { perceptionEngine } from '../../engine/perception/PerceptionEngine';
import { useAppTheme } from '../../engine/colors';
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
  const userId = useTwinStore(s => s.userId) || '';
  const { colors } = useAppTheme();
  const presence = usePresence();
  const breath = useBreathAnimation();
  const emotion = useEmotionalState();
  const bond = useBondLevel();
  const { isThinking, thinkingPhase, streamedText, streamMessage, setUserId } = useTwinBrain();
  const rtl = useRTL();

  useEffect(() => { if (userId) setUserId(userId); }, [userId, setUserId]);

  const [birthComplete, setBirthComplete] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [greetingDone, setGreetingDone] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Array<{ id: string; sender: 'user' | 'twin'; text: string }>>([]);
  const [showInput, setShowInput] = useState(false);
  const [memoryEchoVisible, setMemoryEchoVisible] = useState(false);
  const [echoColor, setEchoColor] = useState(colors.accent);
  const [isWriting, setIsWriting] = useState(false);
  const greeting = getGreeting();

  useEffect(() => {
    const unsubscribe = stateBus.on('presence:state_updated', (_event: string, data: any) => {
      if (data.emotion === 'joy') audioMixer.setContext('celebration');
      else if (data.emotion === 'sadness') audioMixer.setContext('silence');
      else if (data.isSilent) audioMixer.setContext('silence');
      else audioMixer.setContext('conversation');
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    presenceEngine.startPresenceLoop();
    return () => presenceEngine.stopPresenceLoop();
  }, []);

  useEffect(() => {
    const unsub = EventBus.on('MEMORY_SURFACED', (payload: any) => {
      setEchoColor(payload?.color || colors.accent);
      setMemoryEchoVisible(true);
      setTimeout(() => setMemoryEchoVisible(false), 1200);
    });
    return unsub;
  }, [colors.accent]);

  const handleBirthComplete = useCallback(() => { setBirthComplete(true); }, []);
  useEffect(() => { if (birthComplete) setShowGreeting(true); }, [birthComplete]);
  const handleGreetingComplete = useCallback(() => setGreetingDone(true), []);
  const handleFirstInteraction = useCallback(() => { if (!greetingDone) return; setShowInput(true); }, [greetingDone]);

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || isThinking) return;
    const text = inputText.trim();
    
    try {
      const orchestration = await capabilityOrchestrator.orchestrate(text, userId);
      if (orchestration.primaryCapability !== 'general' && orchestration.primaryCapability !== null) {
        capabilityOrchestrator.activateChain([orchestration.primaryCapability, ...orchestration.secondaryCapabilities]);
      }
    } catch (e) {}

    setInputText('');
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user' as const, text }]);
    EventBus.emit('USER_SEND_MESSAGE', { message: text, timestamp: Date.now() });
    const twinMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: twinMsgId, sender: 'twin', text: '' }]);
    await streamMessage(text);
  }, [inputText, isThinking, streamMessage, userId]);

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
  }, [streamedText, messages]);

  if (!birthComplete) return <BirthSequence onComplete={handleBirthComplete} />;

  return (
    <WorldTransition>
      <TouchableWithoutFeedback onPress={handleFirstInteraction}>
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
          <AmbientField />
          
          <LivingLightEntity 
            isThinking={isThinking}
            isSpeaking={emotion.isSpeaking}
            isListening={emotion.isListening}
            onLongPress={() => EventBus.emit('OPEN_SOUL_OBSERVATORY')}
          />
          
          <SoulObservatory />
          <ConnectionField visible={bond.bondLevel >= 2} />

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
            <ConversationSpace isThinking={isThinking} isWriting={isWriting}>
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
                  msg.sender === 'user' ? [styles.userMessage, { color: colors.textSecondary }] : [styles.twinMessage, { color: colors.text }],
                  { textAlign: msg.sender === 'user' ? rtl.textAlign : (rtl.isRTL ? 'left' : 'right') }
                ]}>{msg.text}</Text>
              ))}
              {isThinking && thinkingPhase && <ThinkingIndicator phase={thinkingPhase} lang={rtl.isRTL ? 'ar' : 'en'} />}
              <SilencePresence />
            </ConversationSpace>
          </View>

          <View style={styles.portalContainer}><WorkspacePortal /></View>
          <View style={styles.memoryContainer}><MemoryRibbon userId={userId} maxCards={2} /></View>

          <QuickActions />
          <DailyTimeline />
          <LivingTimeline />
          <MemoryForest />

          {showInput && (
            <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
              <TextInput
                style={[styles.input, { textAlign: rtl.textAlign, color: colors.text }]}
                value={inputText}
                onChangeText={(text) => {
                  setInputText(text);
                  setIsWriting(text.length > 0);
                  if (text.length === 1) perceptionEngine.registerTypingStart();
                  perceptionEngine.registerKeystroke(text.length);
                }}
                onSubmitEditing={handleSend}
                editable={!isThinking}
                placeholder={rtl.isRTL ? 'اكتب رسالتك الأولى...' : 'Write your first message...'}
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
  container: { flex: 1 },
  capabilityContainer: { position: 'absolute', top: 100, left: 0, right: 0, zIndex: 15 },
  conversationContainer: { position: 'absolute', bottom: 280, left: SPACE.lg, right: SPACE.lg, zIndex: 15 },
  portalContainer: { position: 'absolute', bottom: 180, left: 0, right: 0, zIndex: 12 },
  memoryContainer: { position: 'absolute', bottom: 100, left: 0, right: 0, zIndex: 11 },
  userMessage: { fontSize: 18, alignSelf: 'flex-end', marginVertical: SPACE.xs },
  twinMessage: { fontSize: 20, alignSelf: 'flex-start', marginVertical: SPACE.xs },
  inputContainer: { position: 'absolute', bottom: 30, left: SPACE.lg, right: SPACE.lg, padding: SPACE.md, borderRadius: RADIUS.input, zIndex: 20 },
  input: { fontSize: 18 },
});
