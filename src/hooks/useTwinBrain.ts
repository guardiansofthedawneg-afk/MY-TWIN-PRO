import { useState, useCallback, useRef } from 'react';
import { unifiedBrainBridge, UnifiedResponse, PerceptionData } from '../core/UnifiedBrainBridge';
import { EventBus } from '../core/EventBus';

export interface ThinkingPhase {
  phase: string;
  label_ar: string;
  label_en: string;
}

export interface BrainResponse {
  reply: string;
  provider: string;
  consciousnessTrace: ThinkingPhase[];
  trustModel: any;
}

interface UseTwinBrainReturn {
  isThinking: boolean;
  thinkingPhase: ThinkingPhase | null;
  streamedText: string;
  sendMessage: (message: string) => Promise<BrainResponse>;
  setUserId: (userId: string) => void;
  setLang: (lang: string) => void;
}

export function useTwinBrain(initialUserId: string = '', initialLang: string = 'ar'): UseTwinBrainReturn {
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingPhase, setThinkingPhase] = useState<ThinkingPhase | null>(null);
  const [streamedText, setStreamedText] = useState('');
  const bridgeRef = useRef(unifiedBrainBridge);

  bridgeRef.current.setUserId(initialUserId);
  bridgeRef.current.setLang(initialLang);

  const send = useCallback(async (message: string): Promise<BrainResponse> => {
    setIsThinking(true);
    EventBus.emit('AI_START_THINKING', { intent: message });

    try {
      const perception: PerceptionData = {
        typingSpeed: 0,
        messageLength: message.length,
        absenceDurationMinutes: 0,
        timeOfDay: 'morning',
        userState: 'normal',
      };
      const response: UnifiedResponse = await bridgeRef.current.process(message, perception);
      
      // استخراج مسار الوعي من الاستجابة
      const trace = response.consciousness_trace || [];
      if (trace.length > 0) {
        setThinkingPhase(trace[trace.length - 1]); // آخر مرحلة
      }

      EventBus.emit('AI_FINISH_THINKING', { response: response.reply });
      
      return {
        reply: response.reply,
        provider: 'unified_brain',
        consciousnessTrace: trace,
        trustModel: response.trust_model || {},
      };
    } catch (error) {
      EventBus.emit('AI_FINISH_THINKING', { response: '' });
      throw error;
    } finally {
      setIsThinking(false);
      setThinkingPhase(null);
    }
  }, []);

  const setUserId = useCallback((userId: string) => { bridgeRef.current.setUserId(userId); }, []);
  const setLang = useCallback((lang: string) => { bridgeRef.current.setLang(lang); }, []);

  return { isThinking, thinkingPhase, streamedText, sendMessage: send, streamMessage: async () => {}, setUserId, setLang };
}
