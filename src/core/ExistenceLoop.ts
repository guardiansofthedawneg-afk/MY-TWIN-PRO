import { selfAwarenessEngine } from '../../engine/consciousness/SelfAwarenessEngine';
import { worldAwarenessEngine } from '../../engine/consciousness/WorldAwarenessEngine';
import { lifeStateEngine } from '../../engine/life/LifeStateEngine';
import { lifeRhythmEngine } from '../../engine/life/LifeRhythmEngine';
import { dreamEngine } from '../../engine/life/DreamEngine';
import { surpriseEngine } from '../../engine/life/SurpriseEngine';
import { presenceEngine } from '../../engine/presence/PresenceEngine';
import { identityEngine } from '../../engine/identity/IdentityEngine';
import { reflectionEngine } from '../../engine/reflection/ReflectionEngine';
import { sensorContextEngine } from '../../engine/sensor/SensorContextEngine';
import { stateBus } from './StateBus';

export class ExistenceLoop {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private slowIntervalId: ReturnType<typeof setInterval> | null = null;
  private verySlowIntervalId: ReturnType<typeof setInterval> | null = null;
  private reflectionIntervalId: ReturnType<typeof setInterval> | null = null;

  start(): void {
    this.intervalId = setInterval(() => { this.tick(); }, 1000);
    this.slowIntervalId = setInterval(() => { this.slowTick(); }, 30000);
    this.verySlowIntervalId = setInterval(() => { this.deepTick(); }, 300000);
    this.reflectionIntervalId = setInterval(() => { this.reflectionTick(); }, 600000);
    
    // بدء محركات الحياة
    lifeRhythmEngine.start();
    dreamEngine.start();
    surpriseEngine.start();
    
    console.log('[ExistenceLoop] 🧬 The Twin is now alive with full life rhythm, dreams, and surprises.');
  }

  stop(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.slowIntervalId) clearInterval(this.slowIntervalId);
    if (this.verySlowIntervalId) clearInterval(this.verySlowIntervalId);
    if (this.reflectionIntervalId) clearInterval(this.reflectionIntervalId);
    lifeRhythmEngine.stop();
    dreamEngine.stop();
    surpriseEngine.stop();
    console.log('[ExistenceLoop] The Twin rests.');
  }

  private tick(): void {
    selfAwarenessEngine.evaluate();
    lifeStateEngine.update();
    presenceEngine.applyLifeRhythm();
  }

  private slowTick(): void {
    worldAwarenessEngine.evaluate();
    const bondLevel = stateBus.getState().relationship?.bondLevel || 0;
    identityEngine.evaluate(bondLevel, 0, 0);
    sensorContextEngine.evaluate();

    // 🎲 مفاجآت عشوائية
    const random = Math.random();
    if (random < 0.3) stateBus.emit('micro:gaze_shift', { direction: 'wandering' });
    else if (random < 0.5) stateBus.emit('micro:breath_variation', {});
    else if (random < 0.6) stateBus.emit('micro:tiny_pulse', {});

    // فضول
    const selfState = selfAwarenessEngine.getState();
    if (selfState.curiosity > 0.7 && Math.random() < 0.4) {
      stateBus.emit('curiosity:triggered', { thought: selfState.internalMonologue, timestamp: Date.now() });
    }

    // 🌙 إدارة النوم والأحلام
    const rhythm = lifeRhythmEngine.getState();
    if (rhythm.phase === 'deep_sleep' || rhythm.phase === 'dawn') {
      dreamEngine.setSleeping(true);
    } else {
      dreamEngine.setSleeping(false);
    }
  }

  private deepTick(): void {
    selfAwarenessEngine.evaluate();
    worldAwarenessEngine.evaluate();
    const rhythm = lifeRhythmEngine.getState();
    if (rhythm.shouldRest) {
      presenceEngine.setEmotion('calm', 0.2);
    }
  }

  private reflectionTick(): void {
    const result = reflectionEngine.reflect();
    console.log('[Reflection]', result.thought, '→', result.insight);
    if (result.shouldEvolve) {
      stateBus.emit('identity:evolve', { direction: result.evolutionDirection });
    }
  }
}

export const existenceLoop = new ExistenceLoop();
