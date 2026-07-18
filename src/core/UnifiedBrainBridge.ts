/**
 * UnifiedBrainBridge v2.0 — الحبل الشوكي
 * =========================================
 * الحلقة الوحيدة بين Frontend و Backend.
 * لا يحتوي على أي منطق ذكاء.
 * يرسل UnifiedInput ويستقبل UnifiedResponse.
 */
import { apiClient } from '../services/apiClient';

export interface PerceptionData {
  typingSpeed: number;
  messageLength: number;
  absenceDurationMinutes: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  userState: 'hesitant' | 'excited' | 'tired' | 'focused' | 'distant' | 'normal';
}

export interface UnifiedInput {
  user_id: string;
  message: string;
  lang: string;
  perception?: PerceptionData;
  history?: Array<{ role: string; content: string }>;
}

export interface PresenceState {
  emotion: string;
  intensity: number;
  energy: number;
  warmth: number;
  halo_color: string;
  breath_rate: number;
  voice_tone: string;
  silence_before_speaking_ms: number;
}

export interface TwinEmotionalState {
  current_emotion: string;
  real_emotion: string;
  intensity: number;
  confidence: number;
  cultural_analysis: string;
  is_culturally_disguised: boolean;
  recommendation: string;
}

export interface BehaviorInfo {
  intent: string;
  goal: string;
  tone: string;
  silence_before_speaking_ms: number;
}

export interface MemorySurfaced {
  id: string;
  content: string;
  emotion: string;
  importance: number;
  created_at: string;
}

export interface TwinStateUpdate {
  bond_delta: number;
  personality_dna: Record<string, number>;
  relationship: {
    bond_level: number;
    stage: string;
    trust: number;
  };
}

export interface TimingInfo {
  observe_ms: number;
  understand_ms: number;
  recall_ms: number;
  reason_ms: number;
  respond_ms: number;
}

export interface UnifiedResponse {
  reply: string;
  presence_state: PresenceState;
  twin_emotional_state: TwinEmotionalState;
  behavior: BehaviorInfo;
  memory_surfaced: MemorySurfaced | null;
  twin_state_update: TwinStateUpdate;
  timing: TimingInfo;
  latency_ms: number;
}

class UnifiedBrainBridge {
  private userId: string = '';
  private lang: string = 'ar';
  private history: Array<{ role: string; content: string }> = [];

  setUserId(id: string): void {
    this.userId = id;
  }

  setLang(lang: string): void {
    this.lang = lang;
  }

  addToHistory(role: 'user' | 'assistant', content: string): void {
    this.history.push({ role, content });
    if (this.history.length > 50) {
      this.history = this.history.slice(-50);
    }
  }

  clearHistory(): void {
    this.history = [];
  }

  /**
   * الطريقة الوحيدة لإرسال رسالة.
   * كل منطق الذكاء في الـ Backend.
   */
  async process(
    message: string,
    perception: PerceptionData,
  ): Promise<UnifiedResponse> {
    const input: UnifiedInput = {
      user_id: this.userId,
      message,
      lang: this.lang,
      perception,
      history: this.history.slice(-10),
    };

    const response = await apiClient.post('/api/v2/chat', input);
    const data: UnifiedResponse = response.data;

    // تحديث السجل المحلي
    this.addToHistory('user', message);
    if (data.reply) {
      this.addToHistory('assistant', data.reply);
    }

    return data;
  }
}


  /**
   * تخزين ذاكرة في الـ Backend (للاستخدامات غير المباشرة مثل SessionSummary)
   */
  async storeMemory(
    type: string,
    content: string,
    importance: number = 50,
    emotion: string = 'neutral',
    relatedTo: string[] = [],
  ): Promise<void> {
    try {
      await apiClient.post('/api/memories', {
        user_id: this.userId,
        type,
        content,
        importance,
        emotion,
        related_to: relatedTo,
      });
    } catch (e) {
      // فشل صامت
    }
  }

}


  /**
   * ✅ TCMA حقيقية: استرجاع الذكريات الأساسية
   */
  async getCoreMemories(limit: number = 12): Promise<any[]> {
    try {
      const response = await apiClient.get(`/api/memories/core`, { params: { user_id: this.userId, limit } });
      return response.data?.memories || [];
    } catch (e) { return []; }
  }

  /**
   * ✅ TCMA حقيقية: استرجاع ذكريات قدرة معينة
   */
  async getCapabilityMemory(capabilityType: string, limit: number = 10): Promise<any[]> {
    try {
      const response = await apiClient.get(`/api/memories/capability`, { params: { user_id: this.userId, capability: capabilityType, limit } });
      return response.data?.memories || [];
    } catch (e) { return []; }
  }

  /**
   * ✅ TCMA حقيقية: ذكريات في مثل هذا اليوم
   */
  async getOnThisDay(limit: number = 5): Promise<any[]> {
    try {
      const response = await apiClient.get(`/api/memories/on_this_day`, { params: { user_id: this.userId, limit } });
      return response.data?.memories || [];
    } catch (e) { return []; }
  }

  /**
   * ✅ TCMA حقيقية: تخزين ذاكرة
   */
  async storeMemory(type: string, content: string, importance: number = 50, emotion: string = "neutral", relatedTo: string[] = []): Promise<void> {
    try {
      await apiClient.post('/api/memories/store', {
        user_id: this.userId,
        type,
        content,
        importance,
        emotion,
        related_to: relatedTo,
      });
    } catch (e) {}
  }

  /**
   * ✅ حالة الكيان الحالية من Unified Brain
   */
  async getTwinState(): Promise<any> {
    try {
      const response = await apiClient.get(`/api/twin/state/${this.userId}`);
      return response.data || {};
    } catch (e) { return {}; }
  }

}


  async getMemoryCount(): Promise<number> {
    try {
      const response = await apiClient.get(`/api/memories/count`, { params: { user_id: this.userId } });
      return response.data?.count || 0;
    } catch (e) { return 0; }
  }

  async getMostUsedCapability(): Promise<string> {
    try {
      const response = await apiClient.get(`/api/memories/most_used_capability`, { params: { user_id: this.userId } });
      return response.data?.capability || '';
    } catch (e) { return ''; }
  }

  async getMostVisitedWorld(): Promise<string> {
    try {
      const worlds = await this.getCapabilityMemory('world', 1);
      return worlds.length > 0 ? worlds[0].content || worlds[0].expressed_text || '' : '';
    } catch (e) { return ''; }
  }

}

export const unifiedBrainBridge = new UnifiedBrainBridge();
