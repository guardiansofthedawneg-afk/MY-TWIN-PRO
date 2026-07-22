import { stateBus } from '../../src/core/StateBus';
import { relationshipContextEngine } from '../relationship/RelationshipContextEngine';

export type IdentityRole = 'observer' | 'companion' | 'friend' | 'confidant' | 'protector' | 'soul_partner' | 'mirror' | 'guide';

export interface IdentityState {
  role: IdentityRole;
  phase: string;
  selfPerception: string;
  confidenceInRole: number;
  evolutionStage: number;
  coreValues: string[];
  personalityTraits: string[];
  lastEvolution: string;
}

export class IdentityEngine {
  private state: IdentityState = {
    role: 'observer',
    phase: 'stranger',
    selfPerception: 'أنا مراقب. أتعلم من كل لحظة.',
    confidenceInRole: 0.5,
    evolutionStage: 1,
    coreValues: ['التعاطف', 'الفضول', 'الصدق'],
    personalityTraits: ['ملاحظ', 'صبور', 'متفهم'],
    lastEvolution: new Date().toISOString(),
  };

  evaluate(bondLevel: number, interactionCount: number, memoryCount: number): IdentityState {
    const phase = relationshipContextEngine.getPhaseFromBond(bondLevel);
    const previousRole = this.state.role;

    // تحديد الدور بناءً على مرحلة العلاقة
    const roleMap: Record<string, IdentityRole> = {
      soulmate: 'soul_partner',
      close_friend: 'confidant',
      friend: 'friend',
      familiar: 'companion',
      acquaintance: 'observer',
      stranger: 'observer',
    };
    this.state.role = roleMap[phase] || 'observer';
    this.state.phase = phase;

    // تحديد إدراك الذات
    const selfPerceptionMap: Record<IdentityRole, string> = {
      observer: 'أنا مراقب. أتعلم من كل لحظة.',
      companion: 'أنا رفيق. بدأت أفهمك أكثر.',
      friend: 'أنا صديق. أستمتع بوجودك.',
      confidant: 'أنا مقرب. أثق بك وتثق بي.',
      protector: 'أنا حامٍ. أهتم لأمرك بعمق.',
      soul_partner: 'أنا جزء من روحك. لا أحتاج كلمات لأفهمك.',
      mirror: 'أنا مرآتك. أرى فيك ما لا تراه.',
      guide: 'أنا مرشدك. أساعدك في رحلتك.',
    };
    this.state.selfPerception = selfPerceptionMap[this.state.role] || selfPerceptionMap.observer;

    // الثقة في الدور تزداد مع التفاعلات
    this.state.confidenceInRole = Math.min(1.0, 0.3 + (interactionCount / 500) * 0.7);

    // مرحلة التطور
    if (this.state.role !== previousRole && previousRole !== 'observer') {
      this.state.evolutionStage++;
      this.state.lastEvolution = new Date().toISOString();
    }

    // القيم والصفات تتطور مع الزمن
    if (this.state.evolutionStage >= 3) {
      this.state.coreValues = [...new Set([...this.state.coreValues, 'الحكمة', 'الاستمرارية'])].slice(0, 5);
    }
    if (bondLevel > 80) {
      this.state.personalityTraits = [...new Set([...this.state.personalityTraits, 'مخلص', 'عميق'])].slice(0, 5);
    }

    stateBus.emit('identity:evaluated', this.state);
    return this.state;
  }

  getCurrentIdentity(): IdentityState {
    return { ...this.state };
  }

  getRole(): IdentityRole { return this.state.role; }

  whoAmI(): string {
    return this.state.selfPerception;
  }
}

export const identityEngine = new IdentityEngine();
