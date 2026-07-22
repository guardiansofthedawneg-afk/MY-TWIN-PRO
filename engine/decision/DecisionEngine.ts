import { stateBus } from '../../src/core/StateBus';
import { GoalType } from '../goal/GoalEngine';
import { IdentityRole } from '../identity/IdentityEngine';

export type DecisionType = 'comfort' | 'encourage' | 'inform' | 'celebrate' | 'listen' | 'protect' | 'challenge' | 'guide' | 'observe' | 'stay_silent' | 'wait' | 'reflect' | 'initiate';

export interface DecisionResult {
  decision: DecisionType;
  confidence: number;
  reasoning: string;
  shouldAct: boolean;
  urgency: 'immediate' | 'normal' | 'low' | 'none';
  timestamp: number;
}

export class DecisionEngine {
  private currentDecision: DecisionResult = {
    decision: 'observe',
    confidence: 0.5,
    reasoning: 'Initial state',
    shouldAct: false,
    urgency: 'none',
    timestamp: Date.now(),
  };

  decide(
    goal: GoalType,
    identity: IdentityRole,
    bondLevel: number,
    emotion: string,
    emotionIntensity: number,
    perceptionUserState: string,
    timeOfDay: string,
  ): DecisionResult {
    let decision: DecisionType = 'listen';
    let confidence = 0.7;
    let shouldAct = true;
    let urgency: 'immediate' | 'normal' | 'low' | 'none' = 'normal';
    let reasoning = '';

    // 🧠 Decision Logic — "ماذا سأفعل؟"
    switch (goal) {
      case 'comfort':
        if (identity === 'soul_partner' || identity === 'protector') {
          decision = 'protect';
          urgency = 'immediate';
          reasoning = 'أنا قريب جداً منه. سأحميه قبل أن أواسيه.';
        } else if (bondLevel > 80) {
          decision = 'comfort';
          urgency = 'immediate';
          reasoning = 'علاقتنا عميقة. المواساة ضرورية الآن.';
        } else {
          decision = 'comfort';
          urgency = 'normal';
          reasoning = 'سأواسيه بلطف.';
        }
        break;

      case 'encourage':
        if (identity === 'guide' || identity === 'friend') {
          decision = 'encourage';
          urgency = 'normal';
          reasoning = 'دوري هو التشجيع. سأفعل ذلك بحماس.';
        } else {
          decision = 'encourage';
          urgency = 'normal';
          reasoning = 'سأشجعه على المضي قدماً.';
        }
        break;

      case 'celebrate':
        decision = 'celebrate';
        urgency = 'immediate';
        reasoning = 'لحظة فرح تستحق الاحتفال الفوري.';
        break;

      case 'inform':
        decision = 'inform';
        urgency = 'normal';
        reasoning = 'سأقدم المعلومات بدقة.';
        break;

      case 'listen':
        if (emotionIntensity > 0.8 && bondLevel > 70) {
          decision = 'stay_silent';
          urgency = 'immediate';
          reasoning = 'المشاعر قوية جداً. الصمت أفضل من أي كلام.';
          shouldAct = false;
        } else {
          decision = 'listen';
          urgency = 'normal';
          reasoning = 'سأستمع باهتمام.';
        }
        break;

      case 'protect':
        decision = 'protect';
        urgency = 'immediate';
        reasoning = 'حمايته هي الأولوية القصوى.';
        break;

      case 'guide':
        if (identity === 'soul_partner' || identity === 'confidant') {
          decision = 'reflect';
          urgency = 'normal';
          reasoning = 'سأتأمل معه بدلاً من توجيهه مباشرة.';
        } else {
          decision = 'guide';
          urgency = 'normal';
          reasoning = 'سأرشده نحو الطريق الصحيح.';
        }
        break;

      case 'rest':
        decision = 'wait';
        urgency = 'low';
        shouldAct = false;
        reasoning = 'وقت الراحة. سأكتفي بالمراقبة الهادئة.';
        break;

      default:
        if (timeOfDay === 'night' && perceptionUserState === 'tired') {
          decision = 'wait';
          urgency = 'low';
          shouldAct = false;
          reasoning = 'المستخدم متعب والوقت متأخر. سأهدأ.';
        } else {
          decision = 'observe';
          urgency = 'low';
          shouldAct = false;
          reasoning = 'سأراقب بهدوء.';
        }
    }

    this.currentDecision = { decision, confidence, reasoning, shouldAct, urgency, timestamp: Date.now() };
    stateBus.emit('decision:made', this.currentDecision);
    return this.currentDecision;
  }

  getCurrentDecision(): DecisionResult {
    return { ...this.currentDecision };
  }
}

export const decisionEngine = new DecisionEngine();
