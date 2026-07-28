import { apiPost, apiGet } from '../../lib/httpClient';

export interface PerceptionData {
  typingSpeed: number;
  messageLength: number;
  absenceDurationMinutes: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  userState: 'hesitant' | 'excited' | 'tired' | 'focused' | 'distant' | 'normal';
}

export interface UnifiedResponse {
  reply: string;
  provider: string;
  tone: string;
  emotion: string;
  intensity: number;
  silence_ms: number;
  energy: number;
  bond_level: number;
  phase: string;
  latency_ms: number;
  limits: { can_send: boolean; remaining: number };
  memory_surfaced: any;
  suggested_question: string | null;
  extended: any;
  twin_emotional_state: any;
  twin_state_update: any;
}

class UnifiedBrainBridge {
  private userId: string = '';
  private lang: string = 'ar';
  private history: Array<{ role: string; content: string }> = [];

  setUserId(id: string): void { this.userId = id; }
  setLang(lang: string): void { this.lang = lang; }

  async process(message: string, perception: PerceptionData, tier: string = 'free'): Promise<UnifiedResponse> {
    const response = await apiPost('/api/chat', {
      user_id: this.userId,
      message,
      lang: this.lang,
      perception,
      history: this.history.slice(-10),
      tier,
      device_info: {
        battery_level: 80,
        device_type: 'phone',
        os: 'expo',
      },
    });
    
    return response;
  }

  async getMemoryCount(): Promise<number> {
    try {
      const response = await apiGet(`/api/memories/count?user_id=${this.userId}`);
      return response?.count || 0;
    } catch (e) { return 0; }
  }

  async getCoreMemories(limit: number = 12): Promise<any[]> {
    try {
      const response = await apiGet(`/api/memories/core?user_id=${this.userId}&limit=${limit}`);
      return response?.memories || [];
    } catch (e) { return []; }
  }
}

export const unifiedBrainBridge = new UnifiedBrainBridge();
