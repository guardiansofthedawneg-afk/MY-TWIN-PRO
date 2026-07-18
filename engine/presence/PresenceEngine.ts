/**
 * PRESENCE ENGINE v3.0 — مستهلك نقي للحضور
 * ============================================
 * لا يعتمد على أي محركات. يستهلك PresenceState من StateBus فقط.
 * يصدر PresenceState موحد 60 مرة في الثانية لتغذية البصريات.
 */
import { stateBus } from '../../src/core/StateBus';

export interface PresenceState {
  breathRate: number; breathDepth: number; heartRate: number; heartVariability: number;
  haloRadius: number; haloIntensity: number; haloColorShift: number;
  particleCount: number; particleVelocity: number; particleSpread: number;
  focusLevel: number; eyeTracking: boolean; eyeBlinkRate: number;
  energyLevel: number; warmth: number; stability: number;
  voicePitch: number; voiceSpeed: number; voiceWarmth: number;
  movementFluidity: number; socialDistance: number;
  glowIntensity: number; breathDuration: number; attentionLevel: number;
}

export class PresenceEngine {
  private animationFrame: number | null = null;
  private lastPresenceState: PresenceState | null = null;

  constructor() {}

  startPresenceLoop(): void {
    if (this.animationFrame !== null) return;
    const loop = () => {
      if (this.animationFrame === null) return;
      const state = this.getLiveState();
      if (state) {
        stateBus.emit('presence:state_updated', state);
      }
      this.animationFrame = requestAnimationFrame(loop);
    };
    this.animationFrame = requestAnimationFrame(loop);
  }

  stopPresenceLoop(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  getLiveState(): PresenceState | null {
    return this.lastPresenceState;
  }

  // ✅ الجديد: استقبال PresenceState من StateBus (عبر updateFromUnifiedResponse)
  applyPresenceState(state: PresenceState): void {
    this.lastPresenceState = state;
  }

  triggerMemoryPresence(): void {
    // boost بسيط
    if (this.lastPresenceState) {
      this.lastPresenceState = {
        ...this.lastPresenceState,
        haloIntensity: Math.min(1, this.lastPresenceState.haloIntensity + 0.3),
        particleVelocity: Math.min(1, this.lastPresenceState.particleVelocity + 0.3),
      };
    }
  }

  setLevel(level: number): void {}
  boost(amount: number): void {}
  fade(): void {}
}

export const presenceEngine = new PresenceEngine();
