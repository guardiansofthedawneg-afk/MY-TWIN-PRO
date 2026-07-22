import { stateBus } from '../../src/core/StateBus';
import { EventBus } from '../../src/core/EventBus';
import { livingBehaviorEngine, BehaviorDecision } from '../behavior/LivingBehaviorEngine';
import { lifeStateEngine, LifeState } from '../life/LifeStateEngine';

export interface MicroExpression {
  type: 'core_tilt' | 'breath_variation' | 'gaze_shift' | 'tiny_pulse' | 'membrane_shiver' | 'particle_burst' | 'warmth_flicker';
  intensity: number;
  duration: number;
  timestamp: number;
}

export interface PresenceState {
  breathPhase: number;
  breathRate: number;
  heartPhase: number;
  heartRate: number;
  pulseIntensity: number;
  focusLevel: number;
  attentionLevel: number;
  gazeDirection: 'user' | 'internal' | 'memory' | 'wandering';
  energyLevel: number;
  warmth: number;
  emotion: string;
  emotionIntensity: number;
  transitionProgress: number;
  silenceLevel: number;
  isSilent: boolean;
  memoryEchoIntensity: number;
  memoryEchoEmotion: string;
  intentType: string | null;
  intentIntensity: number;
  lifeState: LifeState;
  microExpressions: MicroExpression[];
  behaviorSequence: string[];
  sequenceStep: number;
}

export class PresenceEngine {
  private animationFrame: number | null = null;
  private lastTimestamp: number = 0;
  private state: PresenceState;
  private isActive: boolean = false;
  private behaviorTimer: ReturnType<typeof setTimeout> | null = null;
  private microExpressions: MicroExpression[] = [];

  constructor() {
    this.state = this.getDefaultState();
    this.listenToBehavior();
    this.listenToLifeState();
    this.listenToMicroEvents();
  }

  private getDefaultState(): PresenceState {
    return {
      breathPhase: 0, breathRate: 4000, heartPhase: 0, heartRate: 68,
      pulseIntensity: 0.5, focusLevel: 0.5, attentionLevel: 0.5,
      gazeDirection: 'wandering', energyLevel: 0.5, warmth: 0.5,
      emotion: 'neutral', emotionIntensity: 0.5, transitionProgress: 1.0,
      silenceLevel: 0, isSilent: false,
      memoryEchoIntensity: 0, memoryEchoEmotion: '',
      intentType: null, intentIntensity: 0,
      lifeState: 'observing',
      microExpressions: [],
      behaviorSequence: [],
      sequenceStep: 0,
    };
  }

  private listenToBehavior(): void {
    stateBus.on('behavior:decided', (_: string, data: BehaviorDecision) => {
      if (!data) return;
      this.state.intentType = data.intentType;
      this.state.intentIntensity = 0.8;
      this.state.behaviorSequence = [...data.timingSequence];
      this.state.sequenceStep = 0;
      this.state.silenceLevel = data.shouldSpeak ? 0 : 0.8;
      this.state.isSilent = !data.shouldSpeak;

      if (data.silenceBeforeMs > 0 && !data.shouldSpeak) {
        this.startSilence();
        this.behaviorTimer = setTimeout(() => {
          this.endSilence();
        }, data.silenceBeforeMs);
      }

      this.executeSequence(data.timingSequence);
    });
  }

  private listenToLifeState(): void {
    stateBus.on('life:state_changed', (_: string, data: any) => {
      if (!data) return;
      this.state.lifeState = data.to;
    });
  }

  private listenToMicroEvents(): void {
    stateBus.on('micro:gaze_shift', () => {
      this.addMicroExpression('gaze_shift', 0.3, 2000);
      this.state.gazeDirection = 'wandering';
      setTimeout(() => { this.state.gazeDirection = 'user'; }, 2500);
    });

    stateBus.on('micro:breath_variation', () => {
      this.addMicroExpression('breath_variation', 0.4, 3000);
      this.state.breathRate = 4000 + (Math.random() - 0.5) * 2000;
      setTimeout(() => { this.state.breathRate = 4000; }, 4000);
    });

    stateBus.on('micro:tiny_pulse', () => {
      this.addMicroExpression('tiny_pulse', 0.5, 1000);
      this.state.pulseIntensity = 0.8;
      setTimeout(() => { this.state.pulseIntensity = 0.5; }, 1500);
    });
  }

  private executeSequence(sequence: string[]): void {
    let delay = 0;
    sequence.forEach((step, i) => {
      delay += 400 + Math.random() * 300;
      setTimeout(() => {
        this.state.sequenceStep = i + 1;
        this.applySequenceStep(step);
      }, delay);
    });
  }

  private applySequenceStep(step: string): void {
    switch (step) {
      case 'attention_focus': this.state.focusLevel = 0.9; this.state.gazeDirection = 'user'; break;
      case 'attention_user': this.state.gazeDirection = 'user'; this.state.focusLevel = 0.7; break;
      case 'attention_wander': this.state.gazeDirection = 'wandering'; this.state.focusLevel = 0.2; break;
      case 'breath_slow': this.state.breathRate = 6000; break;
      case 'breath_calm': this.state.breathRate = 4500; break;
      case 'breath_normal': this.state.breathRate = 4000; break;
      case 'energy_rise': this.state.energyLevel = 0.8; break;
      case 'energy_low': this.state.energyLevel = 0.3; break;
      case 'warmth_increase': this.state.warmth = 0.9; break;
      case 'core_contract': this.addMicroExpression('core_tilt', 0.6, 1500); break;
      case 'particles_explode': this.addMicroExpression('particle_burst', 0.9, 2000); break;
      case 'particles_calm': this.state.energyLevel = 0.4; break;
      case 'memory_search': this.state.gazeDirection = 'memory'; this.addMicroExpression('membrane_shiver', 0.5, 2000); break;
      case 'intent_appear': this.state.intentIntensity = 1.0; break;
      case 'silence': this.state.isSilent = true; break;
      case 'speak': this.state.isSilent = false; this.state.intentIntensity = 0; break;
    }
  }

  private addMicroExpression(type: MicroExpression['type'], intensity: number, duration: number): void {
    const expr: MicroExpression = { type, intensity, duration, timestamp: Date.now() };
    this.microExpressions.push(expr);
    this.state.microExpressions = [...this.microExpressions.slice(-5)];
    setTimeout(() => {
      this.microExpressions = this.microExpressions.filter(e => e !== expr);
      this.state.microExpressions = [...this.microExpressions.slice(-5)];
    }, duration);
  }

  startPresenceLoop(): void {
    if (this.animationFrame !== null) return;
    this.isActive = true;
    this.lastTimestamp = performance.now();
    const loop = (timestamp: number) => {
      if (!this.isActive) return;
      const delta = timestamp - this.lastTimestamp;
      this.lastTimestamp = timestamp;
      this.update(delta);
      stateBus.emit('presence:state_updated', this.state);
      this.animationFrame = requestAnimationFrame(loop);
    };
    this.animationFrame = requestAnimationFrame(loop);
  }

  stopPresenceLoop(): void {
    this.isActive = false;
    if (this.animationFrame !== null) { cancelAnimationFrame(this.animationFrame); this.animationFrame = null; }
    if (this.behaviorTimer) { clearTimeout(this.behaviorTimer); this.behaviorTimer = null; }
  }

  private update(delta: number): void {
    const now = performance.now();
    const breathCycle = this.state.breathRate;
    this.state.breathPhase = (Math.sin((now % breathCycle) / breathCycle * Math.PI * 2) + 1) / 2;
    const heartInterval = 60000 / this.state.heartRate;
    this.state.heartPhase = (now % heartInterval) / heartInterval;
    if (this.state.memoryEchoIntensity > 0) { this.state.memoryEchoIntensity *= 0.97; if (this.state.memoryEchoIntensity < 0.01) this.state.memoryEchoIntensity = 0; }
    if (this.state.intentIntensity > 0) { this.state.intentIntensity *= 0.95; if (this.state.intentIntensity < 0.01) { this.state.intentIntensity = 0; this.state.intentType = null; } }
  }

  setEmotion(emotion: string, intensity: number): void {
    this.state.emotion = emotion;
    this.state.emotionIntensity = intensity;
    const config: Record<string, { breathRate: number; heartRate: number; energy: number; warmth: number }> = {
      joy: { breathRate: 2500, heartRate: 78, energy: 0.8, warmth: 0.9 },
      sadness: { breathRate: 6000, heartRate: 58, energy: 0.3, warmth: 0.6 },
      calm: { breathRate: 5000, heartRate: 60, energy: 0.4, warmth: 0.7 },
      love: { breathRate: 3500, heartRate: 72, energy: 0.6, warmth: 0.95 },
      anger: { breathRate: 2200, heartRate: 88, energy: 0.9, warmth: 0.3 },
      fear: { breathRate: 3000, heartRate: 92, energy: 0.5, warmth: 0.4 },
      neutral: { breathRate: 4000, heartRate: 68, energy: 0.5, warmth: 0.5 },
    };
    const cfg = config[emotion] || config.neutral;
    this.state.breathRate = cfg.breathRate;
    this.state.heartRate = cfg.heartRate;
    this.state.energyLevel = cfg.energy;
    this.state.warmth = cfg.warmth;
  }

  triggerMemoryEcho(emotion: string): void { this.state.memoryEchoIntensity = 1; this.state.memoryEchoEmotion = emotion; }
  startSilence(): void { this.state.isSilent = true; EventBus.emit('SILENCE_START', {}); }
  endSilence(): void { this.state.isSilent = false; EventBus.emit('SILENCE_END', {}); }
  getState(): PresenceState { return { ...this.state }; }
}

export const presenceEngine = new PresenceEngine();
