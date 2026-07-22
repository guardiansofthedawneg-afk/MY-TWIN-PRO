import { useState, useCallback, useRef } from 'react';
import { unifiedBrainBridge, UnifiedResponse, PerceptionData } from '../core/UnifiedBrainBridge';
import { perceptionEngine } from '../../engine/perception/PerceptionEngine';
import { contextEngine } from '../../engine/context/ContextEngine';
import { memoryContextEngine } from '../../engine/memory/MemoryContextEngine';
import { relationshipContextEngine } from '../../engine/relationship/RelationshipContextEngine';
import { identityEngine } from '../../engine/identity/IdentityEngine';
import { goalEngine } from '../../engine/goal/GoalEngine';
import { decisionEngine } from '../../engine/decision/DecisionEngine';
import { livingBehaviorEngine } from '../../engine/behavior/LivingBehaviorEngine';
import { presenceEngine } from '../../engine/presence/PresenceEngine';
import { worldAwarenessEngine } from '../../engine/consciousness/WorldAwarenessEngine';
import { lifeStateEngine } from '../../engine/life/LifeStateEngine';
import { stateBus } from '../core/StateBus';
import { EventBus } from '../core/EventBus';

export interface ThinkingPhase {
  phase: string;
  progress: number;
  label: string;
}

export interface BrainResponse {
  reply: string;
  provider: string;
  emotion: string;
  thinkingPhases: ThinkingPhase[];
  memoryStored: boolean;
  relationshipDelta: number;
}

interface UseTwinBrainReturn {
  isThinking: boolean;
  thinkingPhase: ThinkingPhase | null;
  streamedText: string;
  sendMessage: (message: string) => Promise<BrainResponse>;
  streamMessage: (message: string) => Promise<void>;
  setUserId: (userId: string) => void;
  setLang: (lang: string) => void;
}

const PHASE_LABELS: Record<string, { ar: string; en: string }> = {
  observe:     { ar: 'ألاحظ...',       en: 'Observing...' },
  perceive:    { ar: 'أدرك ما حدث...',  en: 'Perceiving...' },
  context:     { ar: 'أفهم السياق...',  en: 'Understanding context...' },
  remember:    { ar: 'أتذكر...',        en: 'Remembering...' },
  relate:      { ar: 'أفهم علاقتنا...', en: 'Understanding our bond...' },
  identity:    { ar: 'أعرف من أنا...',  en: 'Knowing who I am...' },
  goal:        { ar: 'أحدد هدفي...',    en: 'Setting my goal...' },
  decide:      { ar: 'أتخذ قراري...',   en: 'Making my decision...' },
  behave:      { ar: 'أخطط لسلوكي...',  en: 'Planning my behavior...' },
  respond:     { ar: 'أستجيب...',       en: 'Responding...' },
};

export function useTwinBrain(initialUserId: string = '', initialLang: string = 'ar'): UseTwinBrainReturn {
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingPhase, setThinkingPhase] = useState<ThinkingPhase | null>(null);
  const [streamedText, setStreamedText] = useState('');
  const bridgeRef = useRef(unifiedBrainBridge);

  bridgeRef.current.setUserId(initialUserId);
  bridgeRef.current.setLang(initialLang);

  const emitPhase = (phase: string, progress: number, lang: string) => {
    const labels = PHASE_LABELS[phase] || PHASE_LABELS.observe;
    const label = lang === 'ar' ? labels.ar : labels.en;
    setThinkingPhase({ phase, progress, label });
    EventBus.emit('AI_COGNITIVE_PHASE', { phase, progress });
  };

  const send = useCallback(async (message: string): Promise<BrainResponse> => {
    setIsThinking(true);
    const lang = initialLang;

    // 1. الإدراك — "ماذا حدث؟"
    emitPhase('perceive', 0.05, lang);
    const perception = perceptionEngine.analyze(message);
    worldAwarenessEngine.recordInteraction();
    await new Promise(r => setTimeout(r, 150));

    // 2. السياق — "ما الذي أعرفه عن هذا الحدث؟"
    emitPhase('context', 0.15, lang);
    const context = contextEngine.build(perception);
    await new Promise(r => setTimeout(r, 150));

    // 3. الذاكرة — "هل مررت بهذا من قبل؟"
    emitPhase('remember', 0.25, lang);
    const memoryCtx = await memoryContextEngine.build(message);
    if (memoryCtx.hasRelatedContext) {
      presenceEngine.triggerMemoryEcho(memoryCtx.dominantPastEmotion);
    }
    await new Promise(r => setTimeout(r, 200));

    // 4. العلاقة — "من هذا الشخص بالنسبة لي؟"
    emitPhase('relate', 0.40, lang);
    const relationship = relationshipContextEngine.evaluate();
    const bondLevel = stateBus.getState().relationship?.bondLevel || 0;
    await new Promise(r => setTimeout(r, 150));

    // 5. الهوية — "من أنا الآن بالنسبة له؟"
    emitPhase('identity', 0.50, lang);
    const identity = identityEngine.evaluate(bondLevel, 0, memoryCtx.memoryCount);
    await new Promise(r => setTimeout(r, 150));

    // 6. الهدف — "ماذا أريد أن أحقق؟"
    emitPhase('goal', 0.60, lang);
    const currentEmotion = perception.valence === 'negative' ? 'sadness' : perception.valence === 'positive' ? 'joy' : 'neutral';
    const goal = goalEngine.determineGoal(
      perception.userState,
      currentEmotion,
      bondLevel,
      relationship.phase,
      perception.timeOfDay,
      memoryCtx.recentMemories,
    );
    await new Promise(r => setTimeout(r, 150));

    // 7. القرار — "ماذا سأفعل؟"
    emitPhase('decide', 0.70, lang);
    const decision = decisionEngine.decide(
      goal.primaryGoal,
      identity.role,
      bondLevel,
      currentEmotion,
      perception.valence === 'negative' ? 0.7 : perception.valence === 'positive' ? 0.6 : 0.4,
      perception.userState,
      perception.timeOfDay,
    );
    await new Promise(r => setTimeout(r, 150));

    // 8. السلوك — "كيف سأفعل؟"
    emitPhase('behave', 0.80, lang);
    const behavior = livingBehaviorEngine.decide(
      goal.primaryGoal,
      currentEmotion,
      perception.valence === 'negative' ? 0.7 : perception.valence === 'positive' ? 0.6 : 0.4,
      bondLevel,
      memoryCtx.recentMemories,
    );

    // 9. تحديث حالة الحياة
    if (decision.shouldAct) {
      lifeStateEngine.transition('speaking', 'responding to user');
    } else {
      lifeStateEngine.transition('observing', 'choosing silence');
    }

    // 10. إرسال الطلب إلى الخادم
    emitPhase('respond', 0.90, lang);
    EventBus.emit('AI_START_THINKING', { intent: message, confidence: 0.8 });

    try {
      const perceptionData: PerceptionData = {
        typingSpeed: perception.typingSpeed,
        messageLength: message.length,
        absenceDurationMinutes: perception.absenceDuration,
        timeOfDay: perception.timeOfDay,
        userState: perception.userState,
      };

      const response: UnifiedResponse = await bridgeRef.current.process(message, perceptionData);

      if (response.reply) {
        const phases: ThinkingPhase[] = [
          { phase: 'observe', progress: 0.1, label: PHASE_LABELS.perceive[lang === 'ar' ? 'ar' : 'en'] },
          { phase: 'understand', progress: 0.4, label: PHASE_LABELS.context[lang === 'ar' ? 'ar' : 'en'] },
          { phase: 'recall', progress: 0.6, label: PHASE_LABELS.remember[lang === 'ar' ? 'ar' : 'en'] },
          { phase: 'reason', progress: 0.8, label: PHASE_LABELS.decide[lang === 'ar' ? 'ar' : 'en'] },
          { phase: 'respond', progress: 1.0, label: PHASE_LABELS.respond[lang === 'ar' ? 'ar' : 'en'] },
        ];

        EventBus.emit('AI_FINISH_THINKING', { response: response.reply, confidence: 0.9 });
        if (response.memory_surfaced) {
          EventBus.emit('MEMORY_CREATED', { memoryId: response.memory_surfaced.id, layer: 'context' });
        }

        return {
          reply: response.reply,
          provider: 'unified_brain',
          emotion: response.twin_emotional_state?.current_emotion || 'neutral',
          thinkingPhases: phases,
          memoryStored: !!response.memory_surfaced,
          relationshipDelta: response.twin_state_update?.bond_delta || 0,
        };
      }

      return {
        reply: '',
        provider: 'consciousness',
        emotion: 'neutral',
        thinkingPhases: [],
        memoryStored: false,
        relationshipDelta: 0,
      };
    } catch (error) {
      EventBus.emit('AI_FINISH_THINKING', { response: '', confidence: 0 });
      throw error;
    } finally {
      setIsThinking(false);
      setThinkingPhase(null);
      lifeStateEngine.transition('observing', 'finished responding');
    }
  }, [initialLang]);

  const stream = useCallback(async (message: string): Promise<void> => {
    setIsThinking(true);
    setStreamedText('');
    const response = await send(message);
    if (response.reply) {
      for (let i = 0; i < response.reply.length; i++) {
        setStreamedText(response.reply.substring(0, i + 1));
        await new Promise(r => setTimeout(r, 15));
      }
    }
    setIsThinking(false);
  }, [send]);

  const setUserId = useCallback((userId: string) => { bridgeRef.current.setUserId(userId); }, []);
  const setLang = useCallback((lang: string) => { bridgeRef.current.setLang(lang); }, []);

  return { isThinking, thinkingPhase, streamedText, sendMessage: send, streamMessage: stream, setUserId, setLang };
}
