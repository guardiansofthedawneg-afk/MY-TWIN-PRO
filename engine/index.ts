/**
 * ENGINE INDEX v2.1 — تصدير موحد لجميع المحركات
 * =================================================
 * تحديث: إضافة المحركات الجديدة (StateMachine, Presence, Awareness)
 */

// ── Core ───────────────────────────────────────────
export { useTwinState } from './core/TwinState';
export type {
  ConsciousnessMode,
  Emotion,
  PresenceLevel,
  AwarenessLevel,
  TwinState,
  ThinkingStage,
} from './core/TwinState';

export { stateBus, STATE_EVENTS } from '../../src/core/StateBus';
export { stateMachine } from './core/StateMachine';

// ── Engines ────────────────────────────────────────
export { presenceEngine } from './presence/PresenceEngine';
export { awarenessEngine } from './awareness/AwarenessEngine';
export { emotionEngine } from './emotion/EmotionEngine';
export { relationshipEngine } from './relationship/RelationshipEngine';
export { memoryEngine } from './memory/MemoryEngine';
export { behaviorEngine } from './behavior/BehaviorEngine';

// ── Mind ───────────────────────────────────────────
export { mindEngine } from './mind/MindEngine';
export { cognitiveEngine } from './mind/CognitiveEngine';

// ── Voice ──────────────────────────────────────────
export { voiceEngine } from './voice/VoiceEngine';
export { voicePersona } from './voice/VoicePersona';
export { voiceSynthesizer } from './voice/VoiceSynthesizer';
export { voiceCallManager } from './voice/VoiceCallManager';

// ── Theme ──────────────────────────────────────────
export { useColors, getColors, FONTS, SPACING, useAppTheme } from './colors';
export type { ThemeColors } from './colors';
export { useLivingTheme } from './living-theme';
export type { LivingTheme } from './living-theme';
export type { MemoryType, MemoryAge, MemoryTemperature, MemoryLink, MemoryEntry } from './memory/MemoryEngine';
