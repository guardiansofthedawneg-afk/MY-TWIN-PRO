import { audioEngine } from './AudioEngine';
import { stateBus } from './StateBus';

const EMOTION_AUDIO_MAP: Record<string, string[]> = {
  joy: ['celebration', 'success_soft'],
  sadness: ['silence_room', 'breathing_loop'],
  calm: ['silence_room', 'breathing_loop'],
  love: ['heartbeat_energy', 'bond_pulse'],
  anger: ['silence_room', 'energy_hum'],
  fear: ['silence_room', 'neural_hum'],
  neutral: ['ambience_space', 'breathing_loop'],
};

const BEHAVIOR_AUDIO: Record<string, string> = {
  comfort: 'trust_up',
  explain: 'thinking_start',
  joke: 'success_soft',
  celebrate: 'milestone',
  protect: 'bond_pulse',
  guide: 'workspace_enter',
};

const MICRO_AUDIO: Record<string, string> = {
  gaze_shift: '',
  breath_variation: 'first_breath',
  tiny_pulse: 'heartbeat_energy',
  membrane_shiver: 'memory_whisper',
  particle_burst: 'particles',
  core_tilt: '',
  warmth_flicker: '',
};

export class AudioMixer {
  private currentContext: string = 'conversation';
  private activeLayers: Set<string> = new Set();
  private lastMicroAudio: number = 0;

  constructor() {
    this.initBaseLayers();
    this.listenToPresence();
  }

  private async initBaseLayers(): Promise<void> {
    await audioEngine.init();
    audioEngine.startAmbience();
  }

  private listenToPresence(): void {
    stateBus.on('presence:state_updated', (_: string, data: any) => {
      if (!data) return;

      // Emotion-based audio
      if (data.emotion && data.emotionIntensity > 0.3) {
        this.setEmotionAudio(data.emotion);
      }

      // Micro-expression audio (throttled)
      const now = Date.now();
      if (data.microExpressions && data.microExpressions.length > 0 && now - this.lastMicroAudio > 5000) {
        const latest = data.microExpressions[data.microExpressions.length - 1];
        const audioId = MICRO_AUDIO[latest.type];
        if (audioId) {
          this.lastMicroAudio = now;
          audioEngine.play(audioId).catch(() => {});
        }
      }

      // Silence dynamics
      if (data.silenceLevel > 0.5) {
        this.activeLayers.forEach(id => audioEngine.stop(id).catch(() => {}));
        this.activeLayers.clear();
      }
    });
  }

  setContext(context: string): void { this.currentContext = context; }

  playEffect(effect: string): void {
    const id = BEHAVIOR_AUDIO[effect] || effect;
    if (id) audioEngine.play(id).catch(() => {});
  }

  setEmotionAudio(emotion: string): void {
    this.activeLayers.forEach(id => audioEngine.stop(id).catch(() => {}));
    this.activeLayers.clear();
    const layers = EMOTION_AUDIO_MAP[emotion] || EMOTION_AUDIO_MAP.neutral;
    layers.forEach(id => {
      audioEngine.play(id).catch(() => {});
      this.activeLayers.add(id);
    });
  }

  playBreath(): void { audioEngine.play('first_breath').catch(() => {}); }
  playHeartbeat(): void { audioEngine.play('heartbeat_energy').catch(() => {}); }
  playMemoryEcho(): void { audioEngine.play('memory_found').catch(() => {}); }
  playThinking(): void { audioEngine.play('thinking_start').catch(() => {}); }
  playTyping(): void { audioEngine.play('typing').catch(() => {}); }
  playSilence(): void { this.activeLayers.forEach(id => audioEngine.stop(id).catch(() => {})); this.activeLayers.clear(); }

  getCurrentContext(): string { return this.currentContext; }
}

export const audioMixer = new AudioMixer();
