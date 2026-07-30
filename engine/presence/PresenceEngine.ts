import { stateBus } from '../../src/core/StateBus';
import { EventBus } from '../../src/core/EventBus';
import { lifeRhythmEngine } from '../life/LifeRhythmEngine';
import { audioMixer } from '../../src/core/AudioMixer';

export interface MicroExpression {
  type: 'core_tilt' | 'breath_variation' | 'gaze_shift' | 'tiny_pulse' | 'membrane_shiver' | 'particle_burst' | 'warmth_flicker' | 'head_nod' | 'head_shake';
  intensity: number;
  duration: number;
  timestamp: number;
}

export interface PresenceState {
  breathPhase: number;
  breathRate: number;
  focusLevel: number;
  energyLevel: number;
  warmth: number;
  emotion: string;
  emotionIntensity: number;
  silenceLevel: number;
  memoryEchoIntensity: number;
  intentIntensity: number;
  microExpressions: MicroExpression[];
}

export class PresenceEngine {
  private state: PresenceState = this.getDefaultState();
  private animationFrame: number | null = null;

  getDefaultState(): PresenceState {
    return {
      breathPhase: 0, breathRate: 4000, focusLevel: 0.5, energyLevel: 0.5, warmth: 0.5,
      emotion: 'neutral', emotionIntensity: 0.5, silenceLevel: 0,
      memoryEchoIntensity: 0, intentIntensity: 0, microExpressions: [],
    };
  }

  startPresenceLoop(): void {
    this.animationFrame = requestAnimationFrame((t) => this.update(t));
    setInterval(() => this.applyLifeRhythm(), 30000);
  }
  stopPresenceLoop(): void { if (this.animationFrame) cancelAnimationFrame(this.animationFrame); }

  private update(timestamp: number): void {
    this.state.breathPhase = (Math.sin(timestamp / (this.state.breathRate / 1000)) + 1) / 2;
    stateBus.emit('presence:state_updated', this.state);
    this.animationFrame = requestAnimationFrame((t) => this.update(t));
  }

  applyLifeRhythm(): void {
    const rhythm = lifeRhythmEngine.getState();
    this.state.breathRate = rhythm.breathRate;
    this.state.energyLevel = rhythm.energy;
    this.state.warmth = rhythm.warmth;
  }

  setEmotion(emotion: string, intensity: number): void {
    this.state.emotion = emotion;
    this.state.emotionIntensity = intensity;
  }

  triggerMemoryEcho(emotion: string): void { this.state.memoryEchoIntensity = 1; }
  
  addMicroExpression(type: MicroExpression['type'], intensity: number): void {
    this.state.microExpressions.push({ type, intensity, duration: 1000, timestamp: Date.now() });
    // تشغيل المؤثرات الصوتية المناسبة
    if (type === 'head_nod') audioMixer.playEffect('comfort');
    else if (type === 'head_shake') audioMixer.playEffect('head_shake');
    else if (type === 'particle_burst') audioMixer.playEffect('surprise');
  }

  getState(): PresenceState { return { ...this.state }; }
}

export const presenceEngine = new PresenceEngine();
