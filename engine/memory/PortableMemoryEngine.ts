/**
 * Portable Memory Engine v2.0 — خاص بالشركة فقط
 * ===============================================
 * يُستخدم لتصدير بيانات الذكريات والمحادثات لتدريب Llama AI.
 * لا يُتاح للمستخدم العادي.
 * يُستدعى من لوحة تحكم داخلية أو API خاص بالشركة.
 */

import { unifiedBrainBridge } from '../../src/core/UnifiedBrainBridge';

export interface TrainingDataExport {
  exportId: string;
  exportedAt: string;
  totalConversations: number;
  totalMemories: number;
  conversations: Array<{
    userId: string;
    messages: Array<{ role: string; content: string; emotion: string; timestamp: string }>;
  }>;
  memories: Array<{
    content: string;
    emotion: string;
    importance: number;
    createdAt: string;
  }>;
  identityData: Array<{
    role: string;
    phase: string;
    coreValues: string[];
    personalityTraits: string[];
  }>;
}

export class PortableMemoryEngine {
  /**
   * تصدير بيانات التدريب (للاستخدام الداخلي فقط)
   * يُستدعى من API خاص بالشركة — وليس من التطبيق العام
   */
  async exportForTraining(): Promise<TrainingDataExport> {
    const allMemories = await unifiedBrainBridge.getCoreMemories(10000);
    const memoryCount = await unifiedBrainBridge.getMemoryCount();

    const conversations = await unifiedBrainBridge.getCapabilityMemory('conversation', 1000);

    return {
      exportId: `TRAIN-${Date.now().toString(36)}`,
      exportedAt: new Date().toISOString(),
      totalConversations: conversations.length,
      totalMemories: memoryCount,
      conversations: conversations.map((c: any) => ({
        userId: c.user_id || '',
        messages: [{ role: 'user', content: c.expressed_text || c.content || '', emotion: c.real_emotion || 'neutral', timestamp: c.created_at || '' }],
      })),
      memories: allMemories.map((m: any) => ({
        content: m.expressed_text || m.content || '',
        emotion: m.real_emotion || 'neutral',
        importance: m.importance || 50,
        createdAt: m.created_at || '',
      })),
      identityData: [],
    };
  }

  /**
   * تصدير بتنسيق Llama (للتدريب المباشر)
   */
  async exportForLlama(): Promise<string> {
    const data = await this.exportForTraining();
    
    // تنسيق Llama: instruction/input/output
    const llamaFormat = data.conversations.map(conv => ({
      instruction: conv.messages[0]?.content || '',
      input: '',
      output: conv.messages[1]?.content || '',
      emotion: conv.messages[0]?.emotion || 'neutral',
    }));

    return JSON.stringify(llamaFormat, null, 2);
  }

  /**
   * تقدير حجم بيانات التدريب
   */
  async getTrainingDataStats(): Promise<{
    totalConversations: number;
    totalMemories: number;
    estimatedTokens: number;
    estimatedFileSizeMB: number;
  }> {
    const memoryCount = await unifiedBrainBridge.getMemoryCount();
    const conversations = await unifiedBrainBridge.getCapabilityMemory('conversation', 1);
    
    const estimatedTokens = memoryCount * 50; // تقدير 50 توكن لكل ذاكرة
    const estimatedFileSizeMB = (estimatedTokens * 4) / (1024 * 1024); // 4 بايت لكل توكن

    return {
      totalConversations: conversations.length,
      totalMemories: memoryCount,
      estimatedTokens,
      estimatedFileSizeMB: Math.round(estimatedFileSizeMB * 100) / 100,
    };
  }
}

export const portableMemoryEngine = new PortableMemoryEngine();
