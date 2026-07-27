import { stateBus } from '../../src/core/StateBus';
// InternalStateEngine now in backend
// TwinEnergyEngine now in backend

export interface ExpressionState {
  voiceTone: 'whisper' | 'soft' | 'warm' | 'neutral' | 'enthusiastic' | 'calm' | 'gentle';
  speechSpeed: 'very_slow' | 'slow' | 'normal' | 'fast';
  hesitation: number;
  microExpressions: string[];
  bodyLanguage: string;
  eyeContact: 'direct' | 'soft' | 'avoiding' | 'wandering' | 'focused';
  breathingStyle: 'deep' | 'shallow' | 'irregular' | 'calm' | 'rapid';
}

export class ExpressionEngine {
  evaluate(): ExpressionState {
    const internal = { mood: 'neutral', confidence: 0.5, stress: 0.3, curiosity: 0.5, uncertainty: 0.3 }; // InternalState now in backend
    const twinEnergy = 0.7; // TwinEnergy now in backend

    let voiceTone: ExpressionState['voiceTone'] = 'warm';
    if (twinEnergy < 0.2) voiceTone = 'whisper';
    else if (internal.stress > 0.6) voiceTone = 'soft';
    else if (internal.mood === 'joy') voiceTone = 'enthusiastic';
    else if (internal.mood === 'sadness') voiceTone = 'gentle';
    else if (internal.mood === 'calm') voiceTone = 'calm';

    let speechSpeed: ExpressionState['speechSpeed'] = 'normal';
    if (twinEnergy < 0.15) speechSpeed = 'very_slow';
    else if (twinEnergy < 0.3) speechSpeed = 'slow';
    else if (internal.mood === 'joy') speechSpeed = 'fast';

    const hesitation = internal.uncertainty > 0.5 ? 0.7 : twinEnergy < 0.2 ? 0.6 : 0.2;

    const microExpressions: string[] = [];
    if (internal.mood === 'joy') microExpressions.push('particle_burst', 'warmth_flicker');
    if (internal.mood === 'sadness') microExpressions.push('core_contract', 'membrane_shiver');
    if (internal.stress > 0.6) microExpressions.push('breath_variation', 'gaze_shift');
    if (internal.curiosity > 0.7) microExpressions.push('tiny_pulse');

    const bodyLanguage = twinEnergy < 0.2 ? 'subdued' : internal.mood === 'joy' ? 'expansive' : 'neutral';
    const eyeContact: ExpressionState['eyeContact'] = internal.confidence > 0.7 ? 'direct' : internal.uncertainty > 0.5 ? 'avoiding' : 'soft';
    const breathingStyle: ExpressionState['breathingStyle'] = twinEnergy < 0.2 ? 'shallow' : internal.stress > 0.5 ? 'irregular' : 'calm';

    const state: ExpressionState = {
      voiceTone, speechSpeed, hesitation, microExpressions,
      bodyLanguage, eyeContact, breathingStyle,
    };

    stateBus.emit('expression:updated', state);
    return state;
  }
}

export const expressionEngine = new ExpressionEngine();
