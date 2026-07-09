import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { usePresence } from '../hooks/usePresence';
import { useBreathAnimation } from '../hooks/useBreathAnimation';
import { useEmotionalState } from '../hooks/useEmotionalState';
import { useBondLevel } from '../hooks/useBondLevel';
import { awakeningController, AwakeningState } from '../controllers/AwakeningController';
import { storeSyncBridge } from '../core/StoreSyncBridge';
import { getGreeting, detectUserLanguage } from '../utils/languageDetector';
import BirthSequence from './zones/BirthSequence';
import GreetingWord from './zones/GreetingWord';
import CosmicBackground from './zones/CosmicBackground';
import BreathingGlow from './zones/BreathingGlow';
import PresenceBubble from './zones/PresenceBubble';
import LivingAvatar from './zones/LivingAvatar';
import { sendMessage } from '../services/twinApi';

export default function LivingSpace() {
  const presence = usePresence();
  const breath = useBreathAnimation();
  const emotion = useEmotionalState();
  const bond = useBondLevel();

  const [birthComplete, setBirthComplete] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [greetingDone, setGreetingDone] = useState(false);
  const [awakening, setAwakening] = useState<AwakeningState>({
    phase: 'presence', isComplete: false, firstWord: '',
    showInput: false, breathVisible: false, avatarVisible: false, eyesOpen: false,
  });

  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Array<{ id: string; sender: 'user' | 'twin'; text: string }>>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const greeting = getGreeting();

  useEffect(() => {
    storeSyncBridge.activate();
    storeSyncBridge.syncNow();
    return () => storeSyncBridge.deactivate();
  }, []);

  const handleBirthComplete = useCallback(() => {
    setBirthComplete(true);
    awakeningController.start(setAwakening);
  }, []);

  useEffect(() => {
    return () => awakeningController.stop();
  }, []);

  useEffect(() => {
    if (awakening.isComplete) setShowGreeting(true);
  }, [awakening.isComplete]);

  const handleGreetingComplete = useCallback(() => setGreetingDone(true), []);

  const handleFirstInteraction = useCallback(() => {
    if (!greetingDone) return;
    setShowInput(true);
  }, [greetingDone]);

  const handleSend = useCallback(async () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText('');
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text }]);
    setIsThinking(true);
    try {
      const res = await sendMessage(text);
      const reply = res?.reply || res?.response || 'أنا هنا.';
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'twin', text: reply }]);
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'twin', text: 'أحتاج لحظة...' }]);
    } finally {
      setIsThinking(false);
    }
  }, [inputText]);

  if (!birthComplete) {
    return <BirthSequence onComplete={handleBirthComplete} />;
  }

  return (
    <TouchableWithoutFeedback onPress={handleFirstInteraction}>
      <View style={styles.container}>
        <CosmicBackground breathPhase={breath.phase} spaceEnergy={presence.isActive ? 'warm' : 'tranquil'} />

        {awakening.breathVisible && (
          <View style={styles.presenceContainer}>
            <BreathingGlow breathPhase={breath.phase} intensity={breath.intensity} />
            <PresenceBubble breathPhase={breath.phase} presenceLevel={presence.presenceLevel} />
            <LivingAvatar
              breathPhase={breath.phase}
              eyesOpen={awakening.eyesOpen}
              expression={emotion.valence === 'positive' ? 'warm' : 'neutral'}
              presenceLevel={presence.presenceLevel}
              emotionalValence={emotion.valence}
              bondLevel={bond.bondLevel}
            />
          </View>
        )}

        <View style={styles.conversationContainer}>
          {showGreeting && !greetingDone && (
            <GreetingWord
              word={greeting.word}
              colors={greeting.colors}
              transitionSpeed={greeting.transitionSpeed}
              fontSize={greeting.fontSize}
              fontWeight={greeting.fontWeight}
              onComplete={handleGreetingComplete}
            />
          )}

          {messages.map(msg => (
            <Text key={msg.id} style={msg.sender === 'user' ? styles.userMessage : styles.twinMessage}>
              {msg.text}
            </Text>
          ))}
          {isThinking && <Text style={styles.thinking}>يفكر...</Text>}
        </View>

        {showInput && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
              placeholder={detectUserLanguage() === 'ar' ? 'اكتب رسالتك الأولى...' : 'Write your first message...'}
              placeholderTextColor="#6B5B8A"
            />
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050510' },
  presenceContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  conversationContainer: { position: 'absolute', bottom: 160, left: 24, right: 24, alignItems: 'center' },
  userMessage: { color: '#B8B0C8', fontSize: 18, textAlign: 'right', alignSelf: 'flex-end', marginVertical: 4 },
  twinMessage: { color: '#E8E0F0', fontSize: 20, textAlign: 'left', alignSelf: 'flex-start', marginVertical: 4 },
  thinking: { color: '#6B5B8A', fontSize: 16, fontStyle: 'italic', marginVertical: 8 },
  inputContainer: { position: 'absolute', bottom: 60, left: 24, right: 24, padding: 16, backgroundColor: 'rgba(30,20,50,0.9)', borderRadius: 16 },
  input: { color: '#E8E0F0', fontSize: 18, textAlign: 'right' },
});
