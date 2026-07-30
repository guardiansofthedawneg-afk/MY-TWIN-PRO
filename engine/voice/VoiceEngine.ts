import { stateBus } from '../../src/core/StateBus';
import { audioEngine } from '../../src/core/AudioEngine';

export class VoiceEngine {
  private isActive = false;
  private lastSpeechTime = 0;

  start(): void {
    if (this.isActive) return;
    this.isActive = true;
    this.listenToPresence();
    console.log('[VoiceEngine] 🎤 Listening started');
  }

  stop(): void {
    this.isActive = false;
  }

  private listenToPresence(): void {
    stateBus.on('presence:state_updated', (_: string, data: any) => {
      if (!data || !this.isActive) return;
      
      const now = Date.now();
      if (now - this.lastSpeechTime < 2000) return;

      if (data.isSpeaking) {
        this.lastSpeechTime = now;
        const tone = data.voice_tone || 'neutral';
        this.applyVoiceTone(tone);
      }
    });
  }

  private applyVoiceTone(tone: string): void {
    const toneAudioMap: Record<string, string> = {
      soft: 'breathing_loop',
      warm: 'trust_up',
      neutral: 'ambience_space',
      whisper: 'silence_room',
      enthusiastic: 'success_soft',
    };
    const audioId = toneAudioMap[tone] || 'ambience_space';
    audioEngine.play(audioId).catch(() => {});
  }

  speak(text: string, emotion: string = 'neutral'): void {
    this.lastSpeechTime = Date.now();
    audioEngine.play('speaking_wave').catch(() => {});
    stateBus.emit('voice:speaking', { text, emotion });
  }

  isActive_(): boolean { return this.isActive; }
}

export const voiceEngine = new VoiceEngine();
