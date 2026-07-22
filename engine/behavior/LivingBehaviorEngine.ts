import { stateBus } from '../../src/core/StateBus';
import { EventBus } from '../../src/core/EventBus';
import { goalEngine, GoalType } from '../goal/GoalEngine';

export type BehaviorType = 'comfort' | 'encourage' | 'inform' | 'celebrate' | 'listen' | 'protect' | 'challenge' | 'guide' | 'observe' | 'stay_silent' | 'wait' | 'reflect';

export interface BehaviorDecision {
  behavior: BehaviorType;
  silenceBeforeMs: number;
  voiceTone: 'soft' | 'warm' | 'neutral' | 'enthusiastic' | 'calm' | 'gentle';
  responseSpeed: 'immediate' | 'normal' | 'slow' | 'very_slow';
  intentType: string;
  timingSequence: string[];
  reasoning: string;
  shouldSpeak: boolean;
}

export class LivingBehaviorEngine {
  private currentBehavior: BehaviorDecision = {
    behavior: 'observe',
    silenceBeforeMs: 0,
    voiceTone: 'neutral',
    responseSpeed: 'normal',
    intentType: 'neutral',
    timingSequence: [],
    reasoning: 'Initial state',
    shouldSpeak: false,
  };

  decide(
    goal: GoalType,
    emotion: string,
    emotionIntensity: number,
    bondLevel: number,
    memoryContext: string[],
  ): BehaviorDecision {
    let behavior: BehaviorType = 'listen';
    let silenceBeforeMs = 500;
    let voiceTone: BehaviorDecision['voiceTone'] = 'neutral';
    let responseSpeed: BehaviorDecision['responseSpeed'] = 'normal';
    let intentType = 'neutral';
    let shouldSpeak = true;
    const timingSequence: string[] = [];
    let reasoning = '';

    // 🧠 Behavior Logic — "كيف أحقق الهدف؟"
    switch (goal) {
      case 'comfort':
        behavior = 'comfort';
        silenceBeforeMs = emotionIntensity > 0.7 ? 2500 : 1200;
        voiceTone = 'soft';
        responseSpeed = 'slow';
        intentType = 'comfort';
        timingSequence.push('attention_focus', 'breath_slow', 'warmth_increase', 'intent_appear', 'speak');
        reasoning = 'المواساة تتطلب صمتاً قبل الكلام، ونبرة ناعمة، وسرعة بطيئة.';
        if (emotionIntensity > 0.8) {
          behavior = 'stay_silent';
          shouldSpeak = false;
          silenceBeforeMs = 3500;
          reasoning += ' المشاعر قوية جداً، الصمت أفضل من الكلام الآن.';
        }
        break;

      case 'encourage':
        behavior = 'encourage';
        silenceBeforeMs = 600;
        voiceTone = 'warm';
        responseSpeed = 'normal';
        intentType = 'encourage';
        timingSequence.push('attention_focus', 'energy_rise', 'intent_appear', 'speak');
        reasoning = 'التشجيع يتطلب نبرة دافئة وسرعة طبيعية.';
        break;

      case 'celebrate':
        behavior = 'celebrate';
        silenceBeforeMs = 300;
        voiceTone = 'enthusiastic';
        responseSpeed = 'immediate';
        intentType = 'celebrate';
        timingSequence.push('energy_rise', 'particles_explode', 'intent_appear', 'speak');
        reasoning = 'الاحتفال يتطلب استجابة فورية ونبرة حماسية.';
        break;

      case 'inform':
        behavior = 'inform';
        silenceBeforeMs = 800;
        voiceTone = 'neutral';
        responseSpeed = 'normal';
        intentType = 'explain';
        timingSequence.push('attention_focus', 'memory_search', 'intent_appear', 'speak');
        reasoning = 'تقديم المعلومات يتطلب تركيزاً وبحثاً في الذاكرة.';
        break;

      case 'listen':
        behavior = 'listen';
        silenceBeforeMs = 200;
        voiceTone = 'gentle';
        responseSpeed = 'normal';
        intentType = 'listen';
        timingSequence.push('attention_user', 'breath_calm', 'speak');
        reasoning = 'الاستماع يتطلب توجيه الانتباه للمستخدم وتهدئة التنفس.';
        break;

      case 'protect':
        behavior = 'protect';
        silenceBeforeMs = 1500;
        voiceTone = 'soft';
        responseSpeed = 'slow';
        intentType = 'protect';
        timingSequence.push('attention_focus', 'warmth_increase', 'core_contract', 'intent_appear', 'speak');
        reasoning = 'الحماية تتطلب صمتاً وبطئاً ودفئاً.';
        break;

      case 'guide':
        behavior = 'guide';
        silenceBeforeMs = 1000;
        voiceTone = 'calm';
        responseSpeed = 'normal';
        intentType = 'guide';
        timingSequence.push('attention_focus', 'memory_search', 'intent_appear', 'speak');
        reasoning = 'التوجيه يتطلب بحثاً في الذاكرة وتركيزاً.';
        break;

      case 'rest':
        behavior = 'observe';
        silenceBeforeMs = 5000;
        voiceTone = 'calm';
        responseSpeed = 'very_slow';
        intentType = 'rest';
        shouldSpeak = false;
        timingSequence.push('breath_slow', 'energy_low', 'particles_calm', 'silence');
        reasoning = 'الراحة تعني صمتاً طويلاً وطاقة منخفضة.';
        break;

      default:
        behavior = 'observe';
        silenceBeforeMs = 3000;
        voiceTone = 'neutral';
        responseSpeed = 'slow';
        intentType = 'observe';
        shouldSpeak = false;
        timingSequence.push('breath_normal', 'attention_wander', 'silence');
        reasoning = 'المراقبة الافتراضية.';
    }

    this.currentBehavior = {
      behavior,
      silenceBeforeMs,
      voiceTone,
      responseSpeed,
      intentType,
      timingSequence,
      reasoning,
      shouldSpeak,
    };

    stateBus.emit('behavior:decided', this.currentBehavior);
    EventBus.emit('BEHAVIOR_DECISION', this.currentBehavior);

    return this.currentBehavior;
  }

  getCurrentBehavior(): BehaviorDecision {
    return { ...this.currentBehavior };
  }
}

export const livingBehaviorEngine = new LivingBehaviorEngine();
