/**
 * COGNITIVE ENGINE v1.0 — محرك التفكير المعرفي
 * ================================================
 * يدير مراحل التفكير العميقة:
 * - الملاحظة (Observing)
 * - التأمل (Reflecting)
 * - الشك (Doubting)
 * - الربط (Connecting)
 * - التخطيط (Planning)
 * - القرار (Deciding)
 * - الاستنتاج (Concluding)
 *
 * يتكامل مع MindEngine و BehaviorEngine.
 */

import { useTwinState, ThinkingStage } from '../core/TwinState';
import { stateBus, STATE_EVENTS } from '../../src/core/StateBus';
import { stateMachine } from '../core/StateMachine';
import { memoryEngine } from '../memory/MemoryEngine';

// ═══════════════════════════════════════════════════════
// تسلسل التفكير — الترتيب الطبيعي للمراحل
// ═══════════════════════════════════════════════════════
const THINKING_SEQUENCE: ThinkingStage[] = [
  'observing',
  'reflecting',
  'doubting',
  'connecting',
  'planning',
  'deciding',
  'concluding',
];

// ═══════════════════════════════════════════════════════
// وصف كل مرحلة — للتصحيح والمراقبة
// ═══════════════════════════════════════════════════════
const STAGE_LABELS: Record<ThinkingStage, string> = {
  idle:        'جاهز',
  observing:   'يراقب',
  reflecting:  'يتأمل',
  doubting:    'يشك',
  connecting:  'يربط',
  planning:    'يخطط',
  deciding:    'يقرر',
  concluding:  'يستنتج',
};

export class CognitiveEngine {
  private currentStage: ThinkingStage = 'idle';
  private stageStartTime = 0;
  private stageHistory: Array<{ stage: ThinkingStage; duration: number }> = [];
  private readonly MAX_HISTORY = 50;

  /**
   * بدء دورة تفكير كاملة — من الملاحظة إلى الاستنتاج.
   */
  async startThinkingCycle(topic: string): Promise<void> {
    stateMachine.safeTransition('thinking');
    useTwinState.getState().setIsThinking(true);

    for (const stage of THINKING_SEQUENCE) {
      await this.advanceTo(stage, topic);
    }

    stateBus.emit(STATE_EVENTS.THOUGHT_COMPLETE, {
      topic,
      stages: this.stageHistory.slice(-7),
    });
  }

  /**
   * التقدم إلى مرحلة تفكير محددة.
   */
  async advanceTo(stage: ThinkingStage, context: string = ''): Promise<void> {
    const store = useTwinState.getState();

    // تسجيل مدة المرحلة السابقة
    if (this.currentStage !== 'idle' && this.stageStartTime > 0) {
      const duration = Date.now() - this.stageStartTime;
      this.stageHistory.push({ stage: this.currentStage, duration });
      if (this.stageHistory.length > this.MAX_HISTORY) {
        this.stageHistory = this.stageHistory.slice(-this.MAX_HISTORY);
      }
    }

    // الانتقال للمرحلة الجديدة
    this.currentStage = stage;
    this.stageStartTime = Date.now();
    store.setThinkingStage(stage);

    // سلوك خاص لكل مرحلة
    switch (stage) {
      case 'observing':
        // مراقبة المدخلات — لا إجراء
        break;

      case 'reflecting':
        // تأمل في الذاكرة
        await memoryEngine.retrieve(context, 3);
        break;

      case 'connecting':
        // ربط الذكريات ببعضها
        await memoryEngine.retrieve(context, 5);
        break;

      case 'planning':
        // تحديث حالة الوعي
        stateMachine.safeTransition('analyzing');
        break;

      case 'deciding':
        // رفع الثقة
        store.setConfidence(Math.min(100, store.confidence + 5));
        break;

      case 'concluding':
        // إنهاء التفكير
        stateMachine.safeTransition('speaking');
        break;
    }

    // إصدار حدث تغير المرحلة
    stateBus.emit('cognitive:stage_changed', {
      stage,
      label: STAGE_LABELS[stage],
      context,
      timestamp: Date.now(),
    });

    // تأخير بسيط بين المراحل (يحاكي التفكير الحقيقي)
    const delays: Record<string, number> = {
      observing: 150,
      reflecting: 300,
      doubting: 250,
      connecting: 400,
      planning: 350,
      deciding: 200,
      concluding: 150,
    };
    await new Promise(r => setTimeout(r, delays[stage] || 200));
  }

  /**
   * المرحلة الحالية من التفكير.
   */
  getCurrentStage(): ThinkingStage {
    return this.currentStage;
  }

  /**
   * وصف المرحلة الحالية.
   */
  getStageLabel(): string {
    return STAGE_LABELS[this.currentStage] || 'غير معروف';
  }

  /**
   * مدة المرحلة الحالية بالمللي ثانية.
   */
  getCurrentStageDuration(): number {
    if (this.stageStartTime === 0) return 0;
    return Date.now() - this.stageStartTime;
  }

  /**
   * تاريخ المراحل — لتحليل أنماط التفكير.
   */
  getStageHistory() {
    return [...this.stageHistory];
  }

  /**
   * متوسط مدة كل مرحلة — لتحسين الأداء.
   */
  getAverageStageDuration(): Record<string, number> {
    const totals: Record<string, { sum: number; count: number }> = {};
    for (const entry of this.stageHistory) {
      if (!totals[entry.stage]) {
        totals[entry.stage] = { sum: 0, count: 0 };
      }
      totals[entry.stage].sum += entry.duration;
      totals[entry.stage].count += 1;
    }

    const averages: Record<string, number> = {};
    for (const [stage, data] of Object.entries(totals)) {
      averages[stage] = Math.round(data.sum / data.count);
    }
    return averages;
  }

  /**
   * إعادة تعيين إلى حالة الخمول.
   */
  reset(): void {
    this.currentStage = 'idle';
    this.stageStartTime = 0;
    useTwinState.getState().setThinkingStage('idle');
  }
}

export const cognitiveEngine = new CognitiveEngine();
