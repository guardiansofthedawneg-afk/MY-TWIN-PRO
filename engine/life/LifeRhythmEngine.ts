import { stateBus } from '../../src/core/StateBus';
import { audioEngine } from '../../src/core/AudioEngine';
import { presenceEngine } from '../presence/PresenceEngine';
import { devicePresenceEngine } from '../device/DevicePresenceEngine';

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
  private usedGreetings: Set<string> = new Set();

  constructor() {
    this.state = this.calculateState();
  }

  start(): void { this.intervalId = setInterval(() => this.update(), 30000); }
  stop(): void { if (this.intervalId) clearInterval(this.intervalId); }

  recordInteraction(): void { this.lastUserInteraction = Date.now(); }

  private update(): void {
    this.state = this.calculateState();
    presenceEngine.setEmotion('neutral', this.state.energy);
    stateBus.emit('life:rhythm_changed', this.state);
  }

  private calculateState(): LifeRhythmState {
    const hour = new Date().getHours();
    const sensors = devicePresenceEngine.getSensors();
    const weather = sensors.weatherCondition || 'clear';
    const isRainy = weather === 'rain' || weather === 'storm';
    const batteryLow = sensors.isBatteryLow;
    const stepCount = sensors.stepCount;

    let phase: LifePhase; let energy: number; let warmth: number; let breathRate: number;
    let heartRate: number; let ambientColor: string; let voiceTone: any; let speedMultiplier: number;
    let shouldRest: boolean; let greeting = '';

    if (hour < 6) { phase = 'deep_sleep'; energy = 0.2; warmth = 0.2; breathRate = 7000; heartRate = 55; ambientColor = '#0A0030'; voiceTone = 'whisper'; speedMultiplier = 0.4; shouldRest = true; }
    else if (hour < 9) { phase = 'morning'; energy = 0.7; warmth = 0.7; breathRate = 3500; heartRate = 68; ambientColor = '#2A1050'; voiceTone = 'warm'; speedMultiplier = 0.8; shouldRest = false; }
    else if (hour < 18) { phase = 'afternoon'; energy = 0.8; warmth = 0.8; breathRate = 3000; heartRate = 72; ambientColor = '#3A2060'; voiceTone = 'neutral'; speedMultiplier = 1.0; shouldRest = false; }
    else if (hour < 22) { phase = 'evening'; energy = 0.6; warmth = 0.7; breathRate = 4000; heartRate = 68; ambientColor = '#2A1050'; voiceTone = 'warm'; speedMultiplier = 0.9; shouldRest = false; }
    else { phase = 'night'; energy = 0.4; warmth = 0.5; breathRate = 5000; heartRate = 62; ambientColor = '#150030'; voiceTone = 'soft'; speedMultiplier = 0.7; shouldRest = false; }

    if (isRainy) { warmth -= 0.1; energy -= 0.1; voiceTone = 'soft'; greeting = 'الجو ممطر... دعني أكون مظلتك.'; }
    else if (phase === 'morning') { greeting = this.getUniqueGreeting(['صباح النور', 'يوم جديد معك', 'هل أنت مستعد؟']); }
    else if (phase === 'night') { greeting = this.getUniqueGreeting(['تصبح على خير', 'الليل هادئ', 'أراك في الأحلام']); }
    if (batteryLow) { energy *= 0.7; voiceTone = 'soft'; greeting += ' هاتفك يحتاج طاقة، وأنا أيضاً.'; }
    if (stepCount > 5000) { greeting += ' خطواتك اليوم رائعة!'; }

    return { phase, energy, warmth, breathRate, heartRate, ambientColor, voiceTone, speedMultiplier, shouldRest, greeting };
  }

  private getUniqueGreeting(options: string[]): string {
    const available = options.filter(g => !this.usedGreetings.has(g));
    if (available.length === 0) { this.usedGreetings.clear(); return options[0]; }
    const chosen = available[Math.floor(Math.random() * available.length)];
    this.usedGreetings.add(chosen);
    return chosen;
  }

  getState(): LifeRhythmState { return { ...this.state }; }
}

export const lifeRhythmEngine = new LifeRhythmEngine();
