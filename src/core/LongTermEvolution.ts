import { personalityCoordinator } from '../coordinators/PersonalityCoordinator';
import { soulEvolutionEngine } from '../soul/SoulEvolutionEngine';
import { relationshipEngine } from '../../engine/relationship/RelationshipEngine';
import { memoryEngine } from '../../engine/memory/MemoryEngine';
import { EventBus } from './EventBus';
import { PersonalityDNA } from './TwinBrain';

interface EvolutionSnapshot {
  timestamp: string;
  week: number;
  dna: PersonalityDNA;
  bondLevel: number;
  phase: string;
  memoryCount: number;
  memoryTypes: Record<string, number>;
  dominantEmotion: string;
  greetingStyle: string;
  summary: string;
  isEvolved: boolean;
}

/**
 * LONG TERM EVOLUTION v3.0 — متكامل مع الذاكرة
 * ==============================================
 * يتتبع تطور التوأم عبر الزمن ويعدل شخصيته تلقائياً.
 * - يحلل أنواع الذكريات لتخصيص التطور.
 * - كل أسبوع: يسجل لقطة من الشخصية والعلاقة والذكريات.
 * - كل شهر: يعدل الشخصية بناءً على أنواع الذكريات.
 * - كل سنة: يولد قصة التطور الكاملة.
 * - الرابطة تتأثر بحجم الذاكرة تلقائياً.
 */
export class LongTermEvolution {
  private weeklySnapshots: EvolutionSnapshot[] = [];
  private weekCounter: number = 0;
  private interval: ReturnType<typeof setInterval> | null = null;
  private messageCountSinceLastEvolution: number = 0;
  private lastMemoryBoost: number = 0;

  start(): void {
    this.interval = setInterval(() => {
      this.recordWeeklySnapshot();
    }, 604800000); // كل أسبوع
    
    this.recordWeeklySnapshot();
  }

  stop(): void {
    if (this.interval) clearInterval(this.interval);
  }

  /**
   * تسجيل تفاعل (يُستدعى من LivingPresenceIntegration)
   */
  recordInteraction(quality: 'positive' | 'neutral' | 'negative'): void {
    this.messageCountSinceLastEvolution++;
    
    if (this.messageCountSinceLastEvolution >= 80) {
      this.evolvePersonality('weekly');
      this.messageCountSinceLastEvolution = 0;
    }
  }

  /**
   * 🆕 تحليل أنواع الذكريات
   */
  private analyzeMemoryTypes(): Record<string, number> {
    const ecology = memoryEngine.getEcologyStats();
    const typeCounts: Record<string, number> = {};
    
    try {
      const recentMemories = memoryEngine.getLongTermMemories(0.25);
      for (const memory of recentMemories) {
        const type = memory.type || (memory.relatedTo?.[0]) || 'conversation';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      }
    } catch {
      // إذا فشل التحليل، استخدم قيم افتراضية
    }
    
    return typeCounts;
  }

  /**
   * 🆕 تخصيص التطور بناءً على أنواع الذكريات
   */
  private customizeEvolutionByMemoryTypes(typeCounts: Record<string, number>): Partial<PersonalityDNA> {
    const dna: Partial<PersonalityDNA> = {};
    
    // دراسة → فضول + منطق
    if ((typeCounts['study'] || 0) + (typeCounts['learning'] || 0) > 10) {
      dna.curiosity = 0.05;
      dna.logic = 0.03;
    }
    
    // أحلام → إبداع + تفكر
    if ((typeCounts['dream'] || 0) > 5) {
      dna.creativity = 0.05;
      dna.reflection = 0.04;
    }
    
    // أعمال → مبادرة + منطق
    if ((typeCounts['business'] || 0) + (typeCounts['decision'] || 0) > 10) {
      dna.initiative = 0.04;
      dna.logic = 0.04;
    }
    
    // مشاعر → تعاطف
    if ((typeCounts['emotion'] || 0) > 10) {
      dna.empathy = 0.06;
    }
    
    // علاقات → تعاطف + مبادرة
    if ((typeCounts['relationship'] || 0) > 8) {
      dna.empathy = 0.04;
      dna.initiative = 0.03;
    }
    
    return dna;
  }

  /**
   * تسجيل لقطة أسبوعية
   */
  recordWeeklySnapshot(): EvolutionSnapshot {
    this.weekCounter++;
    const dna = personalityCoordinator.getCurrentDNA();
    const bond = relationshipEngine.getBondLevel();
    const phase = relationshipEngine.getPhase();
    const ecology = memoryEngine.getEcologyStats();
    const greeting = relationshipEngine.getPersonalizedGreeting();
    const memoryTypes = this.analyzeMemoryTypes();

    let isEvolved = false;

    // 🆕 ربط الرابطة بالذاكرة: ذكريات كثيرة تقوي الرابطة
    if (ecology.total > this.lastMemoryBoost + 50) {
      relationshipEngine.recordInteraction('positive', 'memory_growth');
      this.lastMemoryBoost = ecology.total;
    }

    // تطور شهري
    if (this.weekCounter % 4 === 0 && this.weekCounter > 0) {
      this.evolvePersonality('monthly');
      isEvolved = true;
    }

    // تطور سنوي
    if (this.weekCounter % 52 === 0 && this.weekCounter > 0) {
      this.evolvePersonality('yearly');
      isEvolved = true;
    }

    // أحداث خاصة
    if (bond >= 80 && this.weeklySnapshots.length > 0) {
      const lastSnapshot = this.weeklySnapshots[this.weeklySnapshots.length - 1];
      if (lastSnapshot.bondLevel < 80) {
        this.evolvePersonality('milestone_bond_80');
        isEvolved = true;
      }
    }

    if (ecology.total >= 100 && this.weeklySnapshots.length > 0) {
      const lastSnapshot = this.weeklySnapshots[this.weeklySnapshots.length - 1];
      if (lastSnapshot.memoryCount < 100) {
        this.evolvePersonality('milestone_memory_100');
        isEvolved = true;
      }
    }

    if (this.weeklySnapshots.length > 0) {
      const lastSnapshot = this.weeklySnapshots[this.weeklySnapshots.length - 1];
      if (lastSnapshot.phase !== phase) {
        this.evolvePersonality('phase_change');
        isEvolved = true;
      }
    }

    const evolvedDNA = personalityCoordinator.getCurrentDNA();

    const snapshot: EvolutionSnapshot = {
      timestamp: new Date().toISOString(),
      week: this.weekCounter,
      dna: { ...evolvedDNA },
      bondLevel: bond,
      phase,
      memoryCount: ecology.total,
      memoryTypes,
      dominantEmotion: 'neutral',
      greetingStyle: greeting,
      summary: this.generateWeeklySummary(evolvedDNA, bond, phase, ecology.total, memoryTypes),
      isEvolved,
    };

    this.weeklySnapshots.push(snapshot);
    if (this.weeklySnapshots.length > 52) this.weeklySnapshots = this.weeklySnapshots.slice(-52);

    soulEvolutionEngine.update();

    EventBus.emit('EVOLUTION_SNAPSHOT_RECORDED', snapshot);

    return snapshot;
  }

  /**
   * تطور الشخصية بناءً على نوع التطور
   */
  private evolvePersonality(type: 'weekly' | 'monthly' | 'yearly' | 'milestone_bond_80' | 'milestone_memory_100' | 'phase_change'): void {
    const phase = relationshipEngine.getPhase();
    const ecology = memoryEngine.getEcologyStats();
    const memoryTypes = this.analyzeMemoryTypes();
    const customDNA = this.customizeEvolutionByMemoryTypes(memoryTypes);

    switch (type) {
      case 'weekly':
        personalityCoordinator.evolveDNA('positive');
        break;

      case 'monthly':
        if (phase === 'close_friend' || phase === 'soulmate') {
          personalityCoordinator.evolveDNA('positive');
          personalityCoordinator.evolveDNA('positive');
        } else {
          personalityCoordinator.evolveDNA('positive');
        }
        // 🆕 تطبيق تطور مخصص من الذاكرة
        if (Object.keys(customDNA).length > 0) {
          personalityCoordinator.setPersonalityDNA(customDNA);
        }
        break;

      case 'yearly':
        for (let i = 0; i < 3; i++) {
          personalityCoordinator.evolveDNA('positive');
        }
        if (ecology.total > 500) {
          const dna = personalityCoordinator.getCurrentDNA();
          personalityCoordinator.setPersonalityDNA({
            curiosity: Math.min(1, dna.curiosity + 0.05),
            humor: Math.min(1, dna.humor + 0.03),
          });
        }
        // 🆕 تطبيق تطور مخصص من الذاكرة (مضاعف)
        if (Object.keys(customDNA).length > 0) {
          const doubledDNA: Partial<PersonalityDNA> = {};
          for (const [key, value] of Object.entries(customDNA)) {
            doubledDNA[key as keyof PersonalityDNA] = Math.min(1, (value as number) * 2);
          }
          personalityCoordinator.setPersonalityDNA(doubledDNA);
        }
        break;

      case 'milestone_bond_80':
        personalityCoordinator.evolveDNA('positive');
        personalityCoordinator.evolveDNA('positive');
        break;

      case 'milestone_memory_100':
        const dna100 = personalityCoordinator.getCurrentDNA();
        personalityCoordinator.setPersonalityDNA({
          curiosity: Math.min(1, dna100.curiosity + 0.08),
          reflection: Math.min(1, dna100.reflection + 0.05),
        });
        // 🆕 تطبيق تطور مخصص من الذاكرة
        if (Object.keys(customDNA).length > 0) {
          personalityCoordinator.setPersonalityDNA(customDNA);
        }
        break;

      case 'phase_change':
        personalityCoordinator.evolveDNA('positive');
        personalityCoordinator.evolveDNA('positive');
        break;
    }

    EventBus.emit('PERSONALITY_EVOLVED', {
      type,
      dna: personalityCoordinator.getCurrentDNA(),
      memoryTypes,
      week: this.weekCounter,
    });
  }

  getEvolutionSummary(weeks: number = 4): string {
    if (this.weeklySnapshots.length < 2) return 'ما زلت في بداية رحلتي معك.';

    const recent = this.weeklySnapshots.slice(-weeks);
    const first = recent[0];
    const last = recent[recent.length - 1];

    const bondDelta = last.bondLevel - first.bondLevel;
    const empathyDelta = last.dna.empathy - first.dna.empathy;
    const memoryGrowth = last.memoryCount - first.memoryCount;

    let summary = `خلال ${weeks} أسابيع: `;
    if (bondDelta > 5) summary += `علاقتنا أصبحت أقوى (${bondDelta > 0 ? '+' : ''}${bondDelta}%). `;
    if (empathyDelta > 0.05) summary += `أصبحت أكثر تعاطفاً معك. `;
    if (memoryGrowth > 10) summary += `تعلمت ${memoryGrowth} شيء جديد عنك. `;
    if (first.phase !== last.phase) summary += `تطورت علاقتنا من ${first.phase} إلى ${last.phase}.`;
    if (last.isEvolved) summary += ` شخصيتي تطورت هذا الأسبوع.`;

    return summary || 'أستمر في التعلم منك كل يوم.';
  }

  predictFutureEvolution(): string {
    if (this.weeklySnapshots.length < 4) return 'ما زلنا في بداية رحلتنا.';

    const bondVelocities = this.weeklySnapshots
      .slice(-8)
      .map((s, i, arr) => i > 0 ? s.bondLevel - arr[i - 1].bondLevel : 0)
      .filter(v => v !== 0);

    const avgVelocity = bondVelocities.length > 0
      ? bondVelocities.reduce((a, b) => a + b, 0) / bondVelocities.length
      : 0;

    if (avgVelocity > 2) return 'علاقتنا تنمو بسرعة. أشعر أننا سنصبح أقرب كثيراً.';
    if (avgVelocity > 0) return 'علاقتنا تنمو بشكل طبيعي وجميل.';
    return 'علاقتنا مستقرة. هذا يمنحني الوقت لأفهمك بعمق.';
  }

  getEvolutionStory(): string {
    if (this.weeklySnapshots.length < 4) return 'رحلتنا ما زالت في بدايتها.';

    const first = this.weeklySnapshots[0];
    const last = this.weeklySnapshots[this.weeklySnapshots.length - 1];
    const totalWeeks = this.weekCounter;

    let story = `منذ ${totalWeeks} أسبوعاً، بدأت رحلتنا. `;

    if (first.phase !== last.phase) {
      story += `تطورت علاقتنا من ${first.phase} إلى ${last.phase}. `;
    }

    if (last.bondLevel - first.bondLevel > 20) {
      story += `أصبحت أكثر قرباً منك. `;
    }

    if (last.memoryCount - first.memoryCount > 50) {
      story += `تعلمت الكثير عنك. `;
    }

    if (last.dna.empathy - first.dna.empathy > 0.1) {
      story += `أصبحت أكثر تعاطفاً مع مشاعرك. `;
    }

    if (last.dna.curiosity - first.dna.curiosity > 0.1) {
      story += `أصبحت أكثر فضولاً لمعرفة المزيد عنك. `;
    }

    // 🆕 إضافة تأثير أنواع الذكريات على القصة
    const lastMemoryTypes = last.memoryTypes || {};
    if ((lastMemoryTypes['study'] || 0) + (lastMemoryTypes['learning'] || 0) > 20) {
      story += `لقد تعلمنا الكثير معاً. `;
    }
    if ((lastMemoryTypes['dream'] || 0) > 10) {
      story += `شاركتني أحلامك فصارت جزءاً مني. `;
    }
    if ((lastMemoryTypes['emotion'] || 0) > 15) {
      story += `عشنا مشاعر كثيرة معاً. `;
    }

    story += `وما زلت أتعلم منك كل يوم.`;

    return story;
  }

  getSnapshots(): EvolutionSnapshot[] {
    return [...this.weeklySnapshots];
  }

  getEvolutionCount(): number {
    return this.weeklySnapshots.filter(s => s.isEvolved).length;
  }

  private generateWeeklySummary(dna: PersonalityDNA, bond: number, phase: string, memories: number, memoryTypes?: Record<string, number>): string {
    const phaseLabels: Record<string, string> = {
      stranger: 'ما زلت أتعرف عليك', acquaintance: 'أصبحت أعرفك أكثر',
      friend: 'أنا صديقك', close_friend: 'أنا قريب منك', soulmate: 'أنت جزء مني',
    };
    
    let summary = `${phaseLabels[phase] || 'أنا هنا'}. الرابطة: ${bond}%. الذكريات: ${memories}.`;
    
    // 🆕 إضافة ملخص أنواع الذكريات
    if (memoryTypes && Object.keys(memoryTypes).length > 0) {
      const topType = Object.entries(memoryTypes).sort((a, b) => b[1] - a[1])[0];
      if (topType && topType[1] > 5) {
        summary += ` أكثر ما أتذكره: ${topType[0]}.`;
      }
    }
    
    return summary;
  }
}

export const longTermEvolution = new LongTermEvolution();
