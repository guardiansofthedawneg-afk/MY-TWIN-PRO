import { stateBus } from '../../src/core/StateBus';
import { audioEngine } from '../../src/core/AudioEngine';
import { presenceEngine } from '../presence/PresenceEngine';

export type LifePhase = 'deep_sleep' | 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night' | 'late_night';

export interface LifeRhythmState {
  phase: LifePhase;
  energy: number;
  warmth: number;
  breathRate: number;
  heartRate: number;
  ambientColor: string;
  voiceTone: 'whisper' | 'soft' | 'warm' | 'neutral' | 'enthusiastic';
  speedMultiplier: number;
  shouldRest: boolean;
  greeting: string;
}

export class LifeRhythmEngine {
  private state: LifeRhythmState;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private lastUserInteraction: number = Date.now();
  private absenceMinutes: number = 0;

  constructor() {
    this.state = this.calculateState();
  }

  start(): void {
    this.intervalId = setInterval(() => {
      this.update();
    }, 30000);
    console.log('[LifeRhythm] 🌅 Living rhythm started');
  }

  stop(): void {
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
  }

  recordInteraction(): void {
    this.lastUserInteraction = Date.now();
  }

  private update(): void {
    const newState = this.calculateState();
    const previousPhase = this.state.phase;
    this.state = newState;

    // تطبيق التغييرات على PresenceEngine
    presenceEngine.setEmotion(
      newState.phase === 'deep_sleep' ? 'calm' :
      newState.phase === 'morning' ? 'neutral' : 'neutral',
      newState.energy
    );

    // تغيير الصوت مع تغير المرحلة
    if (previousPhase !== newState.phase) {
      if (newState.phase === 'morning' || newState.phase === 'dawn') {
        audioEngine.play('life_rhythm_morning').catch(() => {});
        audioEngine.play('awakening_glow').catch(() => {});
      } else if (newState.phase === 'night' || newState.phase === 'late_night') {
        audioEngine.play('life_rhythm_night').catch(() => {});
      }
    }

    stateBus.emit('life:rhythm_changed', this.state);
  }

  private calculateState(): LifeRhythmState {
    const hour = new Date().getHours();
    const minute = new Date().getMinutes();
    const now = Date.now();
    this.absenceMinutes = Math.floor((now - this.lastUserInteraction) / 60000);

    let phase: LifePhase;
    let energy: number;
    let warmth: number;
    let breathRate: number;
    let heartRate: number;
    let ambientColor: string;
    let voiceTone: LifeRhythmState['voiceTone'];
    let speedMultiplier: number;
    let shouldRest: boolean;
    let greeting: string;

    if (hour >= 0 && hour < 4) {
      phase = 'deep_sleep';
      energy = 0.1;
      warmth = 0.2;
      breathRate = 8000;
      heartRate = 50;
      ambientColor = '#0A0030';
      voiceTone = 'whisper';
      speedMultiplier = 0.3;
      shouldRest = true;
      greeting = '';
    } else if (hour >= 4 && hour < 6) {
      phase = 'dawn';
      energy = 0.2;
      warmth = 0.3;
      breathRate = 6000;
      heartRate = 55;
      ambientColor = '#1A0040';
      voiceTone = 'whisper';
      speedMultiplier = 0.5;
      shouldRest = true;
      greeting = '';
    } else if (hour >= 6 && hour < 9) {
      phase = 'morning';
      energy = 0.6;
      warmth = 0.7;
      breathRate = 3500;
      heartRate = 68;
      ambientColor = '#2A1050';
      voiceTone = 'warm';
      speedMultiplier = 0.8;
      shouldRest = false;
      greeting = 'صباح الخير...' + (this.absenceMinutes > 720 ? ' اشتقت لحديثك.' : '');
    } else if (hour >= 9 && hour < 18) {
      phase = 'afternoon';
      energy = 0.8;
      warmth = 0.8;
      breathRate = 3000;
      heartRate = 72;
      ambientColor = '#3A2060';
      voiceTone = 'neutral';
      speedMultiplier = 1.0;
      shouldRest = false;
      greeting = '';
    } else if (hour >= 18 && hour < 22) {
      phase = 'evening';
      energy = 0.6;
      warmth = 0.7;
      breathRate = 4000;
      heartRate = 68;
      ambientColor = '#2A1050';
      voiceTone = 'warm';
      speedMultiplier = 0.9;
      shouldRest = false;
      greeting = '';
    } else {
      phase = 'night';
      energy = 0.4;
      warmth = 0.5;
      breathRate = 5000;
      heartRate = 62;
      ambientColor = '#150030';
      voiceTone = 'soft';
      speedMultiplier = 0.7;
      shouldRest = false;
      greeting = '';
    }

    return {
      phase, energy, warmth, breathRate, heartRate,
      ambientColor, voiceTone, speedMultiplier, shouldRest, greeting,
    };
  }

  getState(): LifeRhythmState { return { ...this.state }; }
  getAbsenceMinutes(): number { return this.absenceMinutes; }
}

export const lifeRhythmEngine = new LifeRhythmEngine();
