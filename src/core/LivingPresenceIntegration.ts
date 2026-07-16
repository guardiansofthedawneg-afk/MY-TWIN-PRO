import { perceptionEngine, PerceptionResult } from '../../engine/perception/PerceptionEngine';
import { behavioralIntentEngine } from '../../engine/behavior/BehavioralIntentEngine';
import { emotionEngine } from '../../engine/emotion/EmotionEngine';
import { relationshipEngine } from '../../engine/relationship/RelationshipEngine';
import { memoryEngine } from '../../engine/memory/MemoryEngine';
import { presenceEngine } from '../../engine/presence/PresenceEngine';
import { personalityCoordinator } from '../coordinators/PersonalityCoordinator';
import { digitalSoul } from '../soul/DigitalSoul';
import { longTermEvolution } from '../core/LongTermEvolution';
import { EventBus } from './EventBus';
import { stateBus } from './StateBus';

export type TwinIntent =
  | 'comfort'
  | 'encourage'
  | 'inform'
  | 'celebrate'
  | 'reflect'
  | 'play'
  | 'listen'
  | 'challenge'
  | 'protect';

export interface LifecycleContext {
  perception: PerceptionResult;
  relationshipPhase: string;
  bondLevel: number;
  currentEmotion: string;
  currentMood: string;
  goal: string;
  intent: TwinIntent;
  decision: { behavior: string; confidence: number; reason: string };
  presenceState: ReturnType<typeof presenceEngine.getLiveState>;
  relevantMemories: any[];
  personalityDNA: ReturnType<typeof personalityCoordinator.getCurrentDNA>;
  soulState: ReturnType<typeof digitalSoul.read>;
}

export class LivingPresenceIntegration {
  private sessionStartTime: number = Date.now();
  private messagesInSession: number = 0;

  async perceive(message: string): Promise<PerceptionResult> {
    return perceptionEngine.analyze(message);
  }

  async buildContext(message: string) {
    const memories = await memoryEngine.retrieve(message, 3);
    const personality = personalityCoordinator.getCurrentDNA();
    const soul = digitalSoul.read();
    return { memories, personality, soul };
  }

  assessRelationship() {
    return {
      phase: relationshipEngine.getPhase(),
      bond: relationshipEngine.getBondLevel(),
      emotion: emotionEngine.getCurrentEmotion(),
      mood: behavioralIntentEngine.getCurrentMood(),
    };
  }

  determineGoal(perception: PerceptionResult): string {
    const goals: Record<string, string> = {
      hesitant: 'أريد طمأنته وإعطائه مساحة',
      excited: 'أريد مشاركته حماسه',
      tired: 'أريد أن أكون هادئًا ومريحًا',
      focused: 'أريد أن أكون دقيقًا ومفيدًا',
      distant: 'أريد أن أستعيد الاتصال بلطف',
      normal: 'أريد أن أكون حاضرًا ومنتبهًا',
    };
    return goals[perception.userState] || goals.normal;
  }

  determineIntent(goal: string, relationship: { phase: string; bond: number }): TwinIntent {
    if (goal.includes('طمأنته')) return 'comfort';
    if (goal.includes('حماسه')) return 'celebrate';
    if (goal.includes('هادئًا')) return 'listen';
    if (goal.includes('دقيقًا')) return 'inform';
    if (goal.includes('استعيد')) return 'protect';
    if (relationship.phase === 'soulmate' && relationship.bond > 80) return 'play';
    return 'reflect';
  }

  async manifestPresence(intent: TwinIntent, emotion: string): Promise<ReturnType<typeof presenceEngine.getLiveState>> {
    const ps = presenceEngine.getLiveState();
    const presenceModifiers: Record<TwinIntent, Partial<typeof ps>> = {
      comfort: { warmth: 0.9, energyLevel: 0.4, voiceWarmth: 0.9, haloIntensity: 0.3 },
      encourage: { warmth: 0.8, energyLevel: 0.7, voiceSpeed: 0.7, haloIntensity: 0.6 },
      inform: { focusLevel: 0.9, energyLevel: 0.6, movementFluidity: 0.3, haloIntensity: 0.5 },
      celebrate: { warmth: 0.9, energyLevel: 0.9, voiceSpeed: 0.8, haloIntensity: 0.8 },
      reflect: { focusLevel: 0.7, energyLevel: 0.3, movementFluidity: 0.2, haloIntensity: 0.2 },
      play: { warmth: 0.85, energyLevel: 0.8, voiceSpeed: 0.8, haloIntensity: 0.7 },
      listen: { focusLevel: 0.8, energyLevel: 0.3, movementFluidity: 0.2, haloIntensity: 0.15 },
      challenge: { focusLevel: 0.9, energyLevel: 0.8, voiceSpeed: 0.6, haloIntensity: 0.6 },
      protect: { warmth: 0.95, energyLevel: 0.5, voiceWarmth: 1.0, haloIntensity: 0.5 },
    };

    const modifier = presenceModifiers[intent] || presenceModifiers.reflect;
    stateBus.emit('presence:manifest', { intent, modifier });
    EventBus.emit('conversation:phase', { phase: 'presence', intent });
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 300));
    return presenceEngine.getLiveState();
  }

  async consolidateMemory(message: string, reply: string, context: Partial<LifecycleContext>): Promise<void> {
    this.messagesInSession++;
    await memoryEngine.store('conversation', `${message} → ${reply}`, 50, context.currentEmotion || 'neutral', ['session']);
    longTermEvolution.recordInteraction('positive');

    if (this.messagesInSession % 10 === 0) {
      try { digitalSoul.evolve?.(); } catch { console.log('[LivingPresence] digitalSoul.evolve not implemented'); }
    }

    if (this.messagesInSession % 20 === 0) {
      personalityCoordinator.evolveDNA('positive');
    }
  }

  async runFullCycle(message: string): Promise<LifecycleContext> {
    const perception = this.perceive(message);
    const context = await this.buildContext(message);
    const relEmo = this.assessRelationship();
    const goal = this.determineGoal(await perception);
    const intent = this.determineIntent(goal, { phase: relEmo.phase, bond: relEmo.bond });
    const userIntent = behavioralIntentEngine.interpretUserIntent(message);
    const decision = await behavioralIntentEngine.decideBehavior(userIntent, message);
    const presenceState = await this.manifestPresence(intent, relEmo.emotion);

    const fullContext: LifecycleContext = {
      perception: await perception,
      relationshipPhase: relEmo.phase,
      bondLevel: relEmo.bond,
      currentEmotion: relEmo.emotion,
      currentMood: relEmo.mood,
      goal,
      intent,
      decision,
      presenceState,
      relevantMemories: context.memories,
      personalityDNA: context.personality,
      soulState: context.soul,
    };

    EventBus.emit('mind_loop:complete', fullContext);
    return fullContext;
  }

  getSessionDuration(): number {
    return Math.round((Date.now() - this.sessionStartTime) / 60000);
  }
}

export const livingPresenceIntegration = new LivingPresenceIntegration();
