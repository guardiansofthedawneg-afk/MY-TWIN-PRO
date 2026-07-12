/**
 * BEHAVIOR ENGINE v1.0 – محرك السلوك (المنسق الرئيسي)
 * ======================================================
 * ينسق جميع المحركات الأخرى. هذا هو "الدماغ" الذي يقرر:
 * - متى يفكر التوأم
 * - متى يتحدث
 * - متى يبحث في الذاكرة
 * - كيف يستجيب للمستخدم
 */
import { stateBus, STATE_EVENTS } from '../../src/core/StateBus';
import { useTwinState, ConsciousnessMode } from '../core/TwinState';
import { stateMachine } from '../core/StateMachine';
import { presenceEngine } from '../presence/PresenceEngine';
import { awarenessEngine } from '../awareness/AwarenessEngine';
import { emotionEngine } from '../emotion/EmotionEngine';
import { relationshipEngine } from '../relationship/RelationshipEngine';
import { memoryEngine } from '../memory/MemoryEngine';

type BehaviorRule = {
  condition: (context: any) => boolean;
  action: (context: any) => Promise<void>;
  priority: number;
};

export class BehaviorEngine {

  private contextMode: string = "general";
  setContextMode(mode: string): void { this.contextMode = mode; stateBus.emit("context:aura_changed", { mode }); }
  getContextMode(): string { return this.contextMode; }
  private rules: BehaviorRule[] = [];
  private isProcessing: boolean = false;

  constructor() {
    this.registerDefaultRules();
  }

  private registerDefaultRules(): void {
    // قاعدة: عندما يبدأ المستخدم في الكتابة → التوأم ينتبه
    this.addRule({
      condition: (ctx) => ctx.userActivity === 'typing',
      action: async () => {
        presenceEngine.update('typing');
        awarenessEngine.update('listening');
        stateMachine.safeTransition('listening');
      },
      priority: 10,
    });

    // قاعدة: عندما يتوقف المستخدم عن الكتابة → التوأم يفكر
    this.addRule({
      condition: (ctx) => ctx.userActivity === 'idle' && ctx.hasPendingMessage,
      action: async () => {
        stateMachine.safeTransition('thinking');
        awarenessEngine.update('thinking');
        presenceEngine.update('reading');
      },
      priority: 20,
    });

    // قاعدة: عندما يتكلم المستخدم → التوأم يستمع
    this.addRule({
      condition: (ctx) => ctx.userActivity === 'speaking',
      action: async () => {
        presenceEngine.update('speaking');
        awarenessEngine.update('listening');
        emotionEngine.reactToUserEmotion(ctx.userEmotion || 'neutral');
      },
      priority: 10,
    });

    // قاعدة: بحث في الذاكرة عند الحاجة
    this.addRule({
      condition: (ctx) => ctx.needsMemorySearch && ctx.topic,
      action: async () => {
        stateMachine.safeTransition('searching_memory');
        const memories = await memoryEngine.retrieve(ctx.topic, 3);
        stateBus.emit('behavior:memories_found', { memories, topic: ctx.topic });
        stateMachine.safeTransition('thinking');
      },
      priority: 15,
    });

    // قاعدة: بعد التفكير → تحديث الثقة
    this.addRule({
      condition: (ctx) => ctx.processingComplete,
      action: async () => {
        awarenessEngine.boostConfidence(3);
        awarenessEngine.update('speaking');
      },
      priority: 5,
    });
  }

  addRule(rule: BehaviorRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * تنفيذ السلوك المناسب بناءً على السياق
   */
  async process(context: any): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    useTwinState.getState().setIsProcessing(true);

    for (const rule of this.rules) {
      if (rule.condition(context)) {
        try {
          await rule.action(context);
        } catch (e) {
          console.warn('[BehaviorEngine] Rule failed:', e);
        }
        break; // تنفيذ قاعدة واحدة فقط في كل مرة
      }
    }

    useTwinState.getState().setIsProcessing(false);
    this.isProcessing = false;

    stateBus.emit(STATE_EVENTS.PROCESSING_COMPLETE, { context });
  }

  /**
   * بدء التفكير في رسالة المستخدم
   */
  async startThinking(message: string): Promise<void> {
    const store = useTwinState.getState();
    store.startThinking();
    presenceEngine.update('reading');
    awarenessEngine.update('thinking');

    // التحقق من وجود ذكريات ذات صلة
    const memories = await memoryEngine.retrieve(message, 3);
    if (memories.length > 0) {
      stateBus.emit('behavior:memories_found', { memories, topic: message });
    }

    // تسجيل التفاعل
    relationshipEngine.recordInteraction('positive', message);
  }

  /**
   * الانتهاء من التفكير والاستعداد للتحدث
   */
  async prepareToSpeak(): Promise<void> {
    stateMachine.safeTransition('speaking');
    useTwinState.getState().startSpeaking();
    awarenessEngine.update('speaking');
    presenceEngine.boost(0.3);
  }

  /**
   * الانتهاء من التحدث والعودة للاستماع
   */
  async finishSpeaking(): Promise<void> {
    useTwinState.getState().stopSpeaking();
    stateMachine.safeTransition('listening');
    presenceEngine.fade();
  }

  /**
   * إعادة التعيين إلى حالة الخمول
   */
  reset(): void {
    useTwinState.getState().resetToIdle();
    stateMachine.reset();
    presenceEngine.fade();
  }
}

export const behaviorEngine = new BehaviorEngine();
