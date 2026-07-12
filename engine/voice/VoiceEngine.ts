/**
 * VOICE ENGINE v3.0 – محرك الصوت المتكامل (TTS + STT)
 * ========================================================
 * يدير: التحدث، الاستماع، المقاطعات، طابور الصوت، شخصية الصوت.
 */
import { stateBus, STATE_EVENTS } from '../../src/core/StateBus';
import { useTwinState, Emotion } from '../core/TwinState';
import { relationshipEngine } from '../relationship/RelationshipEngine';

type VoicePersonality = 'friend' | 'mentor' | 'romantic' | 'energetic' | 'calm' | 'genz';

interface VoiceConfig { rate: number; pitch: number; volume: number; personality: VoicePersonality; }
interface VoiceMessage { text: string; priority: number; onComplete?: () => void; }

export class VoiceEngine {
  private config: VoiceConfig = { rate: 1.0, pitch: 1.0, volume: 0.8, personality: 'friend' };
  private isSpeaking: boolean = false;
  private isListening: boolean = false;
  private queue: VoiceMessage[] = [];

  adaptToEmotion(emotion: Emotion): void {
    const map: Record<Emotion, Partial<VoiceConfig>> = {
      joy: { rate: 1.2, pitch: 1.15, volume: 0.9 }, sadness: { rate: 0.8, pitch: 0.9, volume: 0.6 },
      calm: { rate: 0.9, pitch: 1.0, volume: 0.7 }, love: { rate: 1.0, pitch: 1.05, volume: 0.85 },
      anger: { rate: 1.3, pitch: 0.95, volume: 0.85 }, fear: { rate: 1.1, pitch: 1.1, volume: 0.7 },
      neutral: { rate: 1.0, pitch: 1.0, volume: 0.8 }, curious: { rate: 1.05, pitch: 1.1, volume: 0.75 },
      focused: { rate: 0.95, pitch: 0.95, volume: 0.8 }, inspired: { rate: 1.15, pitch: 1.1, volume: 0.9 },
      concerned: { rate: 0.85, pitch: 0.95, volume: 0.75 }, happy: { rate: 1.25, pitch: 1.2, volume: 0.9 },
    };
    this.config = { ...this.config, ...(map[emotion] || map.neutral) };
  }

  adaptToRelationship(): void {
    const map: Record<string, Partial<VoiceConfig>> = {
      stranger: { rate: 0.9, volume: 0.7 }, acquaintance: { rate: 0.95, volume: 0.75 },
      friend: { rate: 1.0, volume: 0.8 }, close_friend: { rate: 1.05, volume: 0.85 },
      soulmate: { rate: 1.1, volume: 0.9 },
    };
    this.config = { ...this.config, ...(map[relationshipEngine.getPhase()] || map.friend) };
  }

  async speak(text: string, priority: number = 5): Promise<void> {
    this.queue.push({ text, priority });
    this.queue.sort((a, b) => b.priority - a.priority);
    if (!this.isSpeaking) await this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) return;
    const msg = this.queue.shift()!;
    this.isSpeaking = true;
    useTwinState.getState().startSpeaking();
    stateBus.emit(STATE_EVENTS.STARTED_SPEAKING, { text: msg.text, config: this.config });
    await new Promise(r => setTimeout(r, msg.text.length * 50));
    this.isSpeaking = false;
    useTwinState.getState().stopSpeaking();
    stateBus.emit(STATE_EVENTS.STOPPED_SPEAKING, {});
    msg.onComplete?.();
    await this.processQueue();
  }

  // ── STT (Speech to Text) ──────────────────────────────
  async startListening(): Promise<void> {
    this.isListening = true;
    useTwinState.getState().setIsListening(true);
    stateBus.emit('voice:listening_started', {});
  }

  async stopListening(): Promise<string> {
    this.isListening = false;
    useTwinState.getState().setIsListening(false);
    stateBus.emit('voice:listening_stopped', {});
    return ''; // النص الفعلي يأتي من expo-speech في الواجهة الأمامية
  }

  async transcribe(audioBase64: string): Promise<string> {
    // محاولة استخدام HuggingFace Whisper
    try {
      const HF_KEY = process.env.HUGGINGFACE_API_KEY;
      if (HF_KEY) {
        const response = await fetch('https://api-inference.huggingface.co/models/openai/whisper-large-v3', {
          method: 'POST', headers: { 'Authorization': `Bearer ${HF_KEY}` },
          body: JSON.stringify({ inputs: audioBase64 }),
        });
        const result = await response.json();
        return result?.text || '';
      }
    } catch (e) {}
    return '';
  }

  interrupt(): void { this.queue = []; this.isSpeaking = false; useTwinState.getState().stopSpeaking(); }
  getIsSpeaking(): boolean { return this.isSpeaking; }
  getIsListening(): boolean { return this.isListening; }
  setPersonality(p: VoicePersonality): void { this.config.personality = p; }
  getConfig(): VoiceConfig { return { ...this.config }; }
}

export const voiceEngine = new VoiceEngine();
