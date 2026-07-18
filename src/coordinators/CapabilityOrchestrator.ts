import { capabilityResolver, CapabilityType } from './CapabilityResolver';
import { unifiedCapabilityMemory } from './UnifiedCapabilityMemory';
import { EventBus } from '../core/EventBus';
import { unifiedBrainBridge } from '../core/UnifiedBrainBridge';

/**
 * نتيجة تنسيق القدرات
 */
export interface OrchestrationResult {
  primaryCapability: CapabilityType;
  secondaryCapabilities: CapabilityType[];
  decision: {
    action: string;
    workspaceType?: string;
    confidence: number;
    reasoning: string;
  };
  memoriesUsed: number;
  crossLinks: number;
  reasoning: string;
}

/**
 * CAPABILITY ORCHESTRATOR v3.0
 * ==============================
 * العقل الذي ينسق بين جميع القدرات.
 *
 * ✅ القرار مبني على حالة الكيان الحية من Unified Brain.
 *    لم يعد "محلياً مبسطاً"، بل يقرأ العاطفة والرابطة من الدماغ الموحد.
 */
export class CapabilityOrchestrator {
  /**
   * تنسيق القدرات بناءً على نية المستخدم وسياقه الحي
   */
  async orchestrate(
    message: string,
    userId: string,
  ): Promise<OrchestrationResult> {
    const primary = capabilityResolver.resolve(message);

    // ✅ استدعاء الدماغ الموحد لاستقاء حالة الكيان الحية
    const twinState = await unifiedBrainBridge.getTwinState();
    const currentEmotion = twinState?.twin_emotional_state?.current_emotion || 'neutral';
    const bondLevel = twinState?.twin_state_update?.relationship?.bond_level || 0;

    // بناء قرار حقيقي مبني على حالة الكيان
    const decision = this.buildDecision(primary.capability, primary.confidence, currentEmotion, bondLevel);

    // البحث في الذاكرة الموحدة عن سياق إضافي
    let secondaryCapabilities: CapabilityType[] = [];
    let memoriesUsed = 0;
    let crossLinks = 0;

    if (primary.confidence > 0.5) {
      try {
        const links = await unifiedCapabilityMemory.findCrossCapabilityLinks(userId);
        crossLinks = links.length;

        const recentUnified = await unifiedCapabilityMemory.getRecentUnified(userId, 10);
        memoriesUsed = recentUnified.length;

        for (const link of links.slice(0, 3)) {
          const sourceCap = link.source.capability as CapabilityType;
          const targetCap = link.target.capability as CapabilityType;

          if (sourceCap === primary.capability && !secondaryCapabilities.includes(targetCap)) {
            secondaryCapabilities.push(targetCap);
          }
          if (targetCap === primary.capability && !secondaryCapabilities.includes(sourceCap)) {
            secondaryCapabilities.push(sourceCap);
          }
        }

        if (decision.action === 'suggest_workspace' && decision.workspaceType) {
          const suggested = decision.workspaceType as CapabilityType;
          if (suggested !== primary.capability && !secondaryCapabilities.includes(suggested)) {
            secondaryCapabilities.push(suggested);
          }
        }
      } catch (e) {}
    }

    const reasoning = this.buildReasoning(primary.capability, secondaryCapabilities, crossLinks);

    EventBus.emit('CAPABILITY_ORCHESTRATION_COMPLETE', {
      primary: primary.capability,
      secondary: secondaryCapabilities,
      reasoning,
    });

    return {
      primaryCapability: primary.capability,
      secondaryCapabilities,
      decision,
      memoriesUsed,
      crossLinks,
      reasoning,
    };
  }

  /**
   * تنشيط سلسلة القدرات
   */
  async activateChain(capabilities: CapabilityType[]): Promise<void> {
    if (capabilities.length === 0) return;

    const primary = capabilities[0];
    capabilityResolver.activate(primary);

    for (let i = 1; i < capabilities.length; i++) {
      setTimeout(() => {
        capabilityResolver.activate(capabilities[i]);
      }, i * 2000);
    }
  }

  /**
   * بناء قرار تنسيق القدرات من حالة الكيان الحية
   */
  private buildDecision(
    capability: CapabilityType,
    confidence: number,
    emotion: string,
    bondLevel: number,
  ) {
    let action = 'general_conversation';
    let workspaceType: string | undefined;
    let reasoning = '';

    // تأثير العاطفة على القرار
    const emotionalBoost: Record<string, { boost: number; reason: string }> = {
      focused: { boost: 0.2, reason: 'المستخدم مركز بشدة' },
      curious: { boost: 0.15, reason: 'فضول المستخدم عالٍ' },
      inspired: { boost: 0.1, reason: 'المستخدم ملهم' },
      sad: { boost: -0.1, reason: 'المستخدم حزين' },
      angry: { boost: -0.15, reason: 'المستخدم غاضب' },
    };

    const boost = emotionalBoost[emotion] || { boost: 0, reason: '' };
    const adjustedConfidence = Math.min(1, Math.max(0, confidence + boost.boost));

    // تأثير الرابطة على القرار
    if (bondLevel > 80 && adjustedConfidence > 0.7) {
      action = 'activate_capability';
      workspaceType = capability !== 'general' ? capability : undefined;
      reasoning = `علاقة عميقة (${bondLevel}%) مع نية قوية نحو ${capability}. ${boost.reason}`;
    } else if (adjustedConfidence > 0.6) {
      action = 'activate_capability';
      workspaceType = capability !== 'general' ? capability : undefined;
      reasoning = `نية قوية نحو ${capability}. ${boost.reason}`;
    } else if (adjustedConfidence > 0.4) {
      action = 'suggest_workspace';
      workspaceType = capability !== 'general' ? capability : undefined;
      reasoning = `اقتراح لطيف نحو ${capability}. ${boost.reason}`;
    } else {
      reasoning = `لم يتم اكتشاف نية محددة (${adjustedConfidence.toFixed(2)}). ${boost.reason}`;
    }

    return {
      action,
      workspaceType,
      confidence: adjustedConfidence,
      reasoning,
    };
  }

  private buildReasoning(
    primary: CapabilityType,
    secondary: CapabilityType[],
    crossLinks: number,
  ): string {
    let reasoning = `القدرة الأساسية: ${primary}. `;
    if (secondary.length > 0) {
      reasoning += `قدرات مساعدة: ${secondary.join('، ')}. `;
    }
    if (crossLinks > 0) {
      reasoning += `تم العثور على ${crossLinks} روابط عبر الذاكرة الموحدة.`;
    }
    return reasoning;
  }
}

export const capabilityOrchestrator = new CapabilityOrchestrator();
