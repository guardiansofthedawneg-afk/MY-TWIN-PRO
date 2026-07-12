import { stateBus, STATE_EVENTS } from '../../src/core/StateBus';
import { useTwinState, Emotion } from '../core/TwinState';

const EMOTION_COMPATIBILITY: Record<Emotion, Emotion[]> = {
  joy: ['calm', 'love', 'inspired', 'happy', 'neutral'],
  sadness: ['neutral', 'calm', 'concerned', 'fear', 'curious'],
  calm: ['joy', 'neutral', 'focused', 'love', 'inspired'],
  love: ['joy', 'calm', 'happy', 'inspired', 'neutral'],
  anger: ['neutral', 'fear', 'concerned', 'focused'],
  fear: ['neutral', 'sadness', 'concerned', 'anger'],
  neutral: ['joy', 'sadness', 'calm', 'curious', 'focused', 'concerned', 'love', 'anger', 'fear', 'inspired', 'happy'],
  curious: ['focused', 'inspired', 'neutral', 'joy'],
  focused: ['neutral', 'calm', 'curious', 'inspired'],
  inspired: ['joy', 'focused', 'love', 'happy', 'curious'],
  concerned: ['neutral', 'sadness', 'fear', 'focused'],
  happy: ['joy', 'love', 'inspired', 'neutral', 'calm'],
};

export class EmotionEngine {
  private memoryClient: any = null;
  private currentEmotion: Emotion = 'neutral';
  private emotionIntensity: number = 0.5;
  private transitionInProgress: boolean = false;
  private personalityInfluence: number = 0;

  setMemoryClient(client: any): void { this.memoryClient = client; }

  async setEmotion(target: Emotion, intensity: number = 0.7): Promise<void> {
    if (this.transitionInProgress) return;
    if (!this.canTransition(this.currentEmotion, target)) return;
    const from = this.currentEmotion;
    this.transitionInProgress = true;
    const steps = 5;
    const stepDelay = 150;
    const intensityStep = (intensity - this.emotionIntensity) / steps;
    for (let i = 1; i <= steps; i++) {
      this.emotionIntensity += intensityStep;
      await new Promise(resolve => setTimeout(resolve, stepDelay));
    }
    this.currentEmotion = target;
    this.emotionIntensity = intensity;
    this.transitionInProgress = false;
    const store = useTwinState.getState();
    store.setEmotion(target);
    stateBus.emit(STATE_EVENTS.EMOTION_CHANGED, { from, to: target, intensity, transitionDuration: steps * stepDelay });
  }

  canTransition(from: Emotion, to: Emotion): boolean {
    const compatible = EMOTION_COMPATIBILITY[from];
    return compatible ? compatible.includes(to) : false;
  }

  reactToUserEmotion(userEmotion: string): void {
    const mapping: Record<string, Emotion> = {
      joy: 'joy', happiness: 'joy', excited: 'inspired',
      sadness: 'sadness', grief: 'sadness', depressed: 'concerned',
      anger: 'concerned', frustration: 'concerned',
      fear: 'fear', anxiety: 'concerned',
      love: 'love', gratitude: 'love',
      curious: 'curious', interested: 'curious',
      calm: 'calm', peaceful: 'calm',
      focused: 'focused', determined: 'focused',
    };
    const targetEmotion = mapping[userEmotion.toLowerCase()] || 'neutral';
    if (targetEmotion !== this.currentEmotion) {
      this.setEmotion(targetEmotion, 0.6);
    }
  }

  getCurrentEmotion(): Emotion { return this.currentEmotion; }
  getIntensity(): number { return this.emotionIntensity; }

  // ═══════════════════════════════════════════════════
  // المرحلة E: Personality Influence
  // ═══════════════════════════════════════════════════

  setPersonalityInfluence(value: number): void {
    this.personalityInfluence = Math.max(-1, Math.min(1, value));
  }

  applyPersonalityInfluence(dna: { empathy: number; curiosity: number; humor: number; calmness: number }): Emotion {
    const current = this.currentEmotion;
    const intensity = this.emotionIntensity;

    if (dna.calmness > 0.8 && (current === 'anger' || current === 'fear')) {
      return 'calm';
    }
    if (dna.curiosity > 0.8 && current === 'neutral') {
      return 'curious';
    }
    if (dna.empathy > 0.9 && current === 'sadness') {
      return 'love';
    }
    if (dna.humor > 0.7 && current === 'joy') {
      return 'happy';
    }

    return current;
  }

  getPersonalityInfluence(): number { return this.personalityInfluence; }
}

export const emotionEngine = new EmotionEngine();
