/**
 * MIND ENGINE v1.0 — محرك العقل المركزي
 * ========================================
 * ينسق عمليات التفكير والتحليل والاستدلال.
 * هذا هو "العقل" الذي يربط:
 * - الذاكرة (MemoryEngine)
 * - المشاعر (EmotionEngine)
 * - العلاقة (RelationshipEngine)
 * - التفكير المعرفي (CognitiveEngine)
 *
 * يعمل كجسر بين BehaviorEngine وكل المحركات المعرفية.
 */

import { useTwinState, ConsciousnessMode } from '../core/TwinState';
import { stateBus, STATE_EVENTS } from '../../src/core/StateBus';
import { stateMachine } from '../core/StateMachine';
import { memoryEngine } from '../memory/MemoryEngine';
import { emotionEngine } from '../emotion/EmotionEngine';
import { relationshipEngine } from '../relationship/RelationshipEngine';

export interface MindContext {
  userMessage: string;
  userEmotion: string;
  currentTopic: string;
  timeOfDay: string;
  recentTopics: string[];
  conversationHistory: Array<{ role: string; content: string }>;
}

export interface ThoughtResult {
  response: string;
  emotion: string;
  confidence: number;
  memoriesUsed: string[];
  thinkingTime: number;
}

export class MindEngine {
  private isProcessing = false;
  private thinkingStartTime = 0;

  /**
   * عملية تفكير كاملة — من استلام الرسالة إلى إنتاج الرد.
   */
  async think(context: MindContext): Promise<ThoughtResult> {
    if (this.isProcessing) {
      return {
        response: '',
        emotion: 'neutral',
        confidence: 0,
        memoriesUsed: [],
        thinkingTime: 0,
      };
    }

    this.isProcessing = true;
    this.thinkingStartTime = Date.now();
    const store = useTwinState.getState();

    try {
      // ── المرحلة 1: الاستماع والانتباه ──
      stateMachine.safeTransition('listening');
      store.setMode('listening');

      // ── المرحلة 2: تحليل المشاعر ──
      stateMachine.safeTransition('emotional');
      if (context.userEmotion) {
        emotionEngine.reactToUserEmotion(context.userEmotion);
      }

      // ── المرحلة 3: البحث في الذاكرة ──
      stateMachine.safeTransition('searching_memory');
      const memories = await memoryEngine.smartRetrieve({
        currentEmotion: emotionEngine.getCurrentEmotion(),
        currentTopic: context.currentTopic,
        timeOfDay: context.timeOfDay,
        recentTopics: context.recentTopics,
      }, 5);

      const memoryContents = memories.map(m => m.content);

      // ── المرحلة 4: التفكير العميق ──
      stateMachine.safeTransition('deep_thinking');
      store.setMode('deep_thinking');

      // تسجيل التفاعل في العلاقة
      await relationshipEngine.recordInteraction('positive', context.userMessage);

      // ── المرحلة 5: تجميع النتيجة ──
      const thinkingTime = Date.now() - this.thinkingStartTime;

      return {
        response: '', // يملأه CognitiveEngine أو AI
        emotion: emotionEngine.getCurrentEmotion(),
        confidence: store.confidence,
        memoriesUsed: memoryContents,
        thinkingTime,
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * بدء التفكير في رسالة مستخدم
   */
  async startThinking(message: string): Promise<void> {
    stateMachine.safeTransition('thinking');
    useTwinState.getState().setMode('thinking');
    stateBus.emit('mind:thinking_started', { message, timestamp: Date.now() });
  }

  /**
   * إنهاء التفكير والعودة للاستماع
   */
  finishThinking(): void {
    stateMachine.safeTransition('listening');
    useTwinState.getState().setMode('listening');
    stateBus.emit('mind:thinking_finished', { timestamp: Date.now() });
  }

  /**
   * الدخول في حالة تحليل عميق
   */
  async deepAnalyze(topic: string): Promise<void> {
    stateMachine.safeTransition('analyzing');
    useTwinState.getState().setMode('analyzing');
    await memoryEngine.retrieve(topic, 10);
  }

  isThinking(): boolean {
    return this.isProcessing;
  }

  getThinkingDuration(): number {
    if (!this.isProcessing) return 0;
    return Date.now() - this.thinkingStartTime;
  }
}

export const mindEngine = new MindEngine();
