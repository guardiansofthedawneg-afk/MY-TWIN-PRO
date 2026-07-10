import { capabilityResolver, CapabilityType } from './CapabilityResolver';
import { unifiedCapabilityMemory } from './UnifiedCapabilityMemory';
import { consciousnessCoordinator, Decision } from './ConsciousnessCoordinator';
import { EventBus } from '../core/EventBus';

/**
 * نتيجة تنسيق القدرات
 */
export interface OrchestrationResult {
  primaryCapability: CapabilityType;
  secondaryCapabilities: CapabilityType[];
  decision: Decision;
  memoriesUsed: number;
  crossLinks: number;
  reasoning: string;
}

/**
 * CAPABILITY ORCHESTRATOR
 * ========================
 * ليس قدرة جديدة. بل العقل الذي ينسق بين جميع القدرات.
 *
 * عندما يقول المستخدم "عندي امتحان بكرة وعايز أركز وبعدها اعمل صورة للملخص":
 * 1. يحلل النية
 * 2. يبحث في الذاكرة الموحدة
 * 3. يقرر: Study → AI Image
 * 4. ينسق التنفيذ
 *
 * 0 محركات جديدة. طبقة تنسيق فقط.
 */
export class CapabilityOrchestrator {
  /**
   * تنسيق القدرات بناءً على نية المستخدم وسياقه
   */
  async orchestrate(
    message: string,
    userId: string,
  ): Promise<OrchestrationResult> {
    const primary = capabilityResolver.resolve(message);
    const decision = await consciousnessCoordinator.decide(message, 'neutral');

    // البحث في الذاكرة الموحدة عن سياق إضافي
    let secondaryCapabilities: CapabilityType[] = [];
    let memoriesUsed = 0;
    let crossLinks = 0;

    if (primary.confidence > 0.5) {
      try {
        // البحث عن روابط عبر القدرات
        const links = await unifiedCapabilityMemory.findCrossCapabilityLinks(userId);
        crossLinks = links.length;

        // جلب ذكريات ذات صلة
        const recentUnified = await unifiedCapabilityMemory.getRecentUnified(userId, 10);
        memoriesUsed = recentUnified.length;

        // تحديد قدرات ثانوية بناءً على الروابط
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

        // إذا كان القرار يشير إلى قدرة إضافية
        if (decision.action === 'suggest_workspace' && decision.workspaceType) {
          const suggested = decision.workspaceType as CapabilityType;
          if (suggested !== primary.capability && !secondaryCapabilities.includes(suggested)) {
            secondaryCapabilities.push(suggested);
          }
        }
      } catch (e) {}
    }

    const reasoning = this.buildReasoning(primary.capability, secondaryCapabilities, crossLinks);

    // إصدار حدث التنسيق
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

    // تنشيط القدرة الأساسية
    const primary = capabilities[0];
    capabilityResolver.activate(primary);

    // جدولة القدرات الثانوية
    for (let i = 1; i < capabilities.length; i++) {
      setTimeout(() => {
        capabilityResolver.activate(capabilities[i]);
      }, i * 2000);
    }
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
