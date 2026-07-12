/**
 * PRESENCE ENGINE v1.0 — محرك الحضور
 * ====================================
 * يدير مستويات حضور التوأم الرقمي.
 * يتحكم في شدة التوهج، سرعة التنفس، ومستوى الانتباه.
 *
 * التكامل:
 *   - يقرأ ويكتب عبر useTwinState (PresenceLevel, AwarenessLevel)
 *   - يصدر الأحداث عبر stateBus القديم
 *   - يستدعيه BehaviorEngine
 *   - يتزامن مع TwinRuntime عبر StoreSyncBridge لاحقاً
 */

import { useTwinState, PresenceLevel, AwarenessLevel } from '../core/TwinState';
import { stateBus, STATE_EVENTS } from '../../src/core/StateBus';

// ═══════════════════════════════════════════════════════
// تعيين مستويات الحضور إلى مستويات الوعي
// ═══════════════════════════════════════════════════════
const PRESENCE_TO_AWARENESS: Record<PresenceLevel, AwarenessLevel> = {
  dormant: 'Dormant',
  aware:   'Aware',
  focused: 'Focused',
  deep:    'DeepThinking',
  flow:    'Flow',
};

// ═══════════════════════════════════════════════════════
// خصائص كل مستوى حضور
// ═══════════════════════════════════════════════════════
interface PresenceProfile {
  glowIntensity: number;    // 0.0 – 1.0
  breathDuration: number;   // مللي ثانية
  attentionLevel: number;   // 0 – 100
  energyConsumption: number; // 0.0 – 1.0
  label: string;
}

const PRESENCE_PROFILES: Record<PresenceLevel, PresenceProfile> = {
  dormant: { glowIntensity: 0.10, breathDuration: 10000, attentionLevel: 5,  energyConsumption: 0.02, label: 'خامل' },
  aware:   { glowIntensity: 0.30, breathDuration: 7000,  attentionLevel: 40, energyConsumption: 0.10, label: 'منتبه' },
  focused: { glowIntensity: 0.60, breathDuration: 5000,  attentionLevel: 75, energyConsumption: 0.25, label: 'مركّز' },
  deep:    { glowIntensity: 0.85, breathDuration: 4000,  attentionLevel: 95, energyConsumption: 0.50, label: 'عميق' },
  flow:    { glowIntensity: 1.00, breathDuration: 3500,  attentionLevel: 100, energyConsumption: 0.80, label: 'فيضان' },
};

export class PresenceEngine {
  private currentProfile: PresenceProfile;
  private boostLevel: number = 0; // تعزيز مؤقت (0 – 0.5)

  constructor() {
    this.currentProfile = PRESENCE_PROFILES.aware;
  }

  /**
   * تحديث مستوى الحضور بناءً على حدث
   */
  update(event: string): void {
    const mapping: Record<string, PresenceLevel> = {
      typing:      'focused',
      reading:     'focused',
      speaking:    'flow',
      listening:   'aware',
      idle:        'aware',
      sleeping:    'dormant',
      thinking:    'deep',
      processing:  'deep',
      searching:   'focused',
    };

    const targetLevel = mapping[event] || 'aware';
    this.setLevel(targetLevel);
  }

  /**
   * تعيين مستوى حضور محدد
   */
  setLevel(level: PresenceLevel): void {
    const store = useTwinState.getState();
    const previousLevel = store.presenceLevel;

    if (previousLevel === level) return;

    // تحديث الحالة
    store.setPresence(level);
    store.setAwarenessLevel(PRESENCE_TO_AWARENESS[level]);

    const profile = PRESENCE_PROFILES[level];
    store.setAttention(profile.attentionLevel);
    store.setEnergy(
      Math.round(profile.energyConsumption * 100)
    );

    this.currentProfile = {
      ...profile,
      glowIntensity: Math.min(1, profile.glowIntensity + this.boostLevel),
    };

    // إصدار الحدث
    stateBus.emit(STATE_EVENTS.PRESENCE_CHANGED, {
      from: previousLevel,
      to: level,
      profile: this.currentProfile,
    });

    // تغيير الوعي تبعاً للحضور
    stateBus.emit(STATE_EVENTS.AWARENESS_CHANGED, {
      level: PRESENCE_TO_AWARENESS[level],
      triggeredBy: 'presence',
    });
  }

  /**
   * تعزيز مؤقت للحضور (لحظات الذروة)
   */
  boost(amount: number): void {
    this.boostLevel = Math.min(0.5, this.boostLevel + amount);
    // ينخفض التعزيز تلقائياً بعد 3 ثوانٍ
    setTimeout(() => {
      this.boostLevel = Math.max(0, this.boostLevel - amount);
    }, 3000);
  }

  /**
   * إطفاء التعزيز والعودة للحالة الطبيعية
   */
  fade(): void {
    this.boostLevel = 0;
    const store = useTwinState.getState();
    const currentLevel = store.presenceLevel;
    this.currentProfile = {
      ...PRESENCE_PROFILES[currentLevel],
      glowIntensity: PRESENCE_PROFILES[currentLevel].glowIntensity,
    };
  }

  /**
   * قراءة الخصائص الحالية
   */
  getProfile(): PresenceProfile {
    return { ...this.currentProfile };
  }

  getGlowIntensity(): number {
    return this.currentProfile.glowIntensity;
  }

  getBreathDuration(): number {
    return this.currentProfile.breathDuration;
  }

  getAttentionLevel(): number {
    return this.currentProfile.attentionLevel;
  }

  /**
   * هل التوأم في حالة تسمح بالتفاعل؟
   */
  isInteractive(): boolean {
    const level = useTwinState.getState().presenceLevel;
    return level !== 'dormant';
  }

  /**
   * هل التوأم في حالة حضور عميق؟
   */
  isDeepPresence(): boolean {
    const level = useTwinState.getState().presenceLevel;
    return level === 'deep' || level === 'flow';
  }
}

export const presenceEngine = new PresenceEngine();
