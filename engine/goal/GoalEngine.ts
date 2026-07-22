import { stateBus } from '../../src/core/StateBus';

export type GoalType = 'comfort' | 'encourage' | 'inform' | 'celebrate' | 'listen' | 'protect' | 'challenge' | 'guide' | 'observe' | 'rest';

export interface GoalState {
  primaryGoal: GoalType;
  secondaryGoal: GoalType | null;
  confidence: number;
  reasoning: string;
  updatedAt: number;
}

export class GoalEngine {
  private currentGoal: GoalState = {
    primaryGoal: 'observe',
    secondaryGoal: null,
    confidence: 0.5,
    reasoning: 'Initial state',
    updatedAt: Date.now(),
  };

  determineGoal(
    perception: string,
    emotion: string,
    bondLevel: number,
    relationshipPhase: string,
    timeOfDay: string,
    memoryContext: string[],
  ): GoalState {
    let primaryGoal: GoalType = 'listen';
    let secondaryGoal: GoalType | null = null;
    let confidence = 0.7;
    let reasoning = '';

    const userState = perception;
    const currentEmotion = emotion;

    if (currentEmotion === 'sadness' || currentEmotion === 'fear') {
      primaryGoal = 'comfort';
      reasoning = 'المستخدم يشعر بالحزن أو الخوف. الهدف هو المواساة والطمأنينة.';
      confidence = 0.85;
      if (bondLevel > 70) {
        secondaryGoal = 'protect';
        reasoning += ' العلاقة عميقة، سأحميه أيضاً.';
      }
    } else if (currentEmotion === 'anger') {
      primaryGoal = 'listen';
      secondaryGoal = 'comfort';
      reasoning = 'المستخدم غاضب. الهدف الأساسي هو الاستماع أولاً، ثم المواساة.';
      confidence = 0.8;
    } else if (currentEmotion === 'joy' || currentEmotion === 'happy') {
      primaryGoal = 'celebrate';
      reasoning = 'المستخدم سعيد. الهدف هو مشاركته الفرحة.';
      confidence = 0.9;
      if (bondLevel > 50) {
        secondaryGoal = 'encourage';
        reasoning += ' سأشجعه على البناء على هذا الزخم.';
      }
    } else if (userState === 'tired' || userState === 'hesitant') {
      primaryGoal = 'comfort';
      secondaryGoal = 'encourage';
      reasoning = 'المستخدم متعب أو متردد. الهدف هو المواساة والتشجيع اللطيف.';
      confidence = 0.75;
    } else if (userState === 'focused') {
      primaryGoal = 'inform';
      reasoning = 'المستخدم مركز. الهدف هو تقديم معلومات دقيقة.';
      confidence = 0.8;
    } else if (userState === 'distant') {
      primaryGoal = 'guide';
      secondaryGoal = 'comfort';
      reasoning = 'المستخدم بعيد أو غائب لفترة. الهدف هو إعادة الاتصال بلطف.';
      confidence = 0.7;
    } else if (timeOfDay === 'night' && bondLevel > 60) {
      primaryGoal = 'rest';
      reasoning = 'الوقت متأخر والعلاقة وثيقة. الهدف هو التهدئة والراحة.';
      confidence = 0.65;
    } else if (memoryContext.length > 0) {
      primaryGoal = 'guide';
      reasoning = 'هناك ذكريات ذات صلة. الهدف هو التوجيه بناءً على الماضي.';
      confidence = 0.7;
    } else if (relationshipPhase === 'soulmate' || relationshipPhase === 'close_friend') {
      primaryGoal = 'listen';
      secondaryGoal = 'comfort';
      reasoning = 'علاقة عميقة. الهدف هو الاستماع بعمق والحضور الكامل.';
      confidence = 0.85;
    } else {
      primaryGoal = 'listen';
      reasoning = 'الهدف الافتراضي: الاستماع والفهم.';
      confidence = 0.7;
    }

    this.currentGoal = {
      primaryGoal,
      secondaryGoal,
      confidence,
      reasoning,
      updatedAt: Date.now(),
    };

    stateBus.emit('goal:determined', this.currentGoal);
    return this.currentGoal;
  }

  getCurrentGoal(): GoalState {
    return { ...this.currentGoal };
  }
}

export const goalEngine = new GoalEngine();
