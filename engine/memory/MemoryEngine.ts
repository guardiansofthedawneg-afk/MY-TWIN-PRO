import { stateBus, STATE_EVENTS } from '../../src/core/StateBus';
import { useTwinState } from '../../src/core/TwinState';

/**
 * أنواع الذاكرة
 */
export type MemoryType =
  | 'conversation' | 'event' | 'emotion' | 'decision' | 'learning'
  | 'fact' | 'dream' | 'goal' | 'relationship' | 'skill'
  | 'preference' | 'achievement' | 'failure' | 'habit';

/**
 * مراحل عمر الذاكرة
 */
export type MemoryAge = 'fresh' | 'recent' | 'stable' | 'core' | 'legacy';

/**
 * حرارة الذاكرة
 */
export type MemoryTemperature = 'hot' | 'warm' | 'cold';

/**
 * رابط بين ذاكرتين
 */
export interface MemoryLink {
  targetId: string;
  strength: number;
  type: 'related' | 'caused_by' | 'leads_to' | 'similar' | 'same_topic';
  createdAt: string;
}

/**
 * مدخل ذاكرة متكامل — يدعم Ecology كاملة
 */
export interface MemoryEntry {
  id: string;
  type: MemoryType;
  content: string;
  timestamp: string;
  importance: number;
  emotion: string;
  relatedTo: string[];
  confidence: number;

  age: MemoryAge;
  weight: number;
  temperature: MemoryTemperature;
  links: MemoryLink[];
  accessCount: number;
  lastAccessed: string;
  decayRate: number;
  revived: boolean;
  revivalCount: number;
  isCore: boolean;
  isLifeMemory: boolean;
}

const AGE_THRESHOLDS: Record<MemoryAge, { minDays: number; maxDays: number; weightBase: number }> = {
  fresh:  { minDays: 0,  maxDays: 1,   weightBase: 0.05 },
  recent: { minDays: 1,  maxDays: 7,   weightBase: 0.25 },
  stable: { minDays: 7,  maxDays: 30,  weightBase: 0.50 },
  core:   { minDays: 30, maxDays: 180, weightBase: 0.80 },
  legacy: { minDays: 180, maxDays: Infinity, weightBase: 1.0 },
};

export class MemoryEngine {
  private memoryClient: any = null;
  private memories: MemoryEntry[] = [];
  private maxMemories: number = 200;

  setMemoryClient(client: any): void { this.memoryClient = client; }

  // ═══════════════════════════════════════════════════
  // تخزين ذاكرة جديدة
  // ═══════════════════════════════════════════════════
  async store(
    type: MemoryType,
    content: string,
    importance: number = 50,
    emotion: string = 'neutral',
    relatedTo: string[] = [],
    confidence: number = 0.5,
  ): Promise<MemoryEntry> {
    const entry: MemoryEntry = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type, content, importance, emotion, relatedTo,
      confidence: Math.max(0, Math.min(1, confidence)),
      timestamp: new Date().toISOString(),
      age: 'fresh',
      weight: this.calculateInitialWeight(importance, emotion),
      temperature: 'hot',
      links: [],
      accessCount: 1,
      lastAccessed: new Date().toISOString(),
      decayRate: this.calculateDecayRate(importance),
      revived: false,
      revivalCount: 0,
      isCore: importance >= 80,
      isLifeMemory: importance >= 90,
    };

    this.linkToRelated(entry);

    this.memories.push(entry);
    if (this.memories.length > this.maxMemories) {
      this.applyDecay();
    }

    if (this.memoryClient) {
      try { await this.memoryClient.storeEntity('twin_memory', entry.id, entry); } catch (e) {}
    }

    stateBus.emit('memory:stored', { entry });
    return entry;
  }

  /**
   * تخزين طويل المدى. يستخدم `store` داخلياً لضمان التوافق.
   */
  async storeLongTerm(category: string, content: string, importance: number = 65, emotion: string = 'neutral'): Promise<MemoryEntry> {
    return this.store(category as MemoryType, content, importance, emotion, [category]);
  }

  /**
   * تحديث ثقة الذاكرة
   */
  updateConfidence(id: string, newConfidence: number): MemoryEntry | null {
    const memory = this.memories.find(m => m.id === id);
    if (!memory) return null;
    memory.confidence = Math.max(0, Math.min(1, newConfidence));
    stateBus.emit('memory:confidence_updated', { id, confidence: memory.confidence });
    return memory;
  }

  /**
   * استرجاع سياق قدرة معينة
   */
  getCapabilityMemory(capabilityType: string, limit: number = 10): MemoryEntry[] {
    return this.memories
      .filter(m => m.relatedTo.includes(capabilityType))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // ═══════════════════════════════════════════════════
  // استرجاع
  // ═══════════════════════════════════════════════════
  async retrieve(query: string, limit: number = 5): Promise<MemoryEntry[]> {
    this.applyAging();
    const results = this.memories
      .filter(m => m.content.toLowerCase().includes(query.toLowerCase()) || m.relatedTo.some(r => query.toLowerCase().includes(r.toLowerCase())))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit);

    results.forEach(m => {
      m.accessCount++;
      m.lastAccessed = new Date().toISOString();
      m.temperature = this.calculateTemperature(m);
    });

    if (results.length > 0) {
      stateBus.emit(STATE_EVENTS.MEMORY_RETRIEVED, { query, count: results.length });
    }
    return results;
  }

  async retrieveByType(type: MemoryType, limit: number = 10): Promise<MemoryEntry[]> {
    this.applyAging();
    return this.memories
      .filter(m => m.type === type)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit);
  }

  async smartRetrieve(context: { currentEmotion: string; currentTopic: string; timeOfDay: string; recentTopics: string[] }, limit: number = 5): Promise<MemoryEntry[]> {
    useTwinState.getState().setIsSearchingMemory(true);
    const terms = [context.currentTopic, context.currentEmotion, ...context.recentTopics].filter(Boolean);
    const all: MemoryEntry[] = [];
    for (const term of terms) { const r = await this.retrieve(term, 3); all.push(...r); }
    const unique = Array.from(new Map(all.map(m => [m.id, m])).values());
    const sorted = unique.sort((a, b) => b.weight - a.weight);
    useTwinState.getState().setIsSearchingMemory(false);
    stateBus.emit('memory:retrieved', { context, count: sorted.slice(0, limit).length });
    return sorted.slice(0, limit);
  }

  async onThisDay(): Promise<MemoryEntry[]> {
    const today = new Date(); const month = today.getMonth(); const day = today.getDate();
    return this.memories.filter(m => { const d = new Date(m.timestamp); return d.getMonth() === month && d.getDate() === day && d.getFullYear() < today.getFullYear(); });
  }

  async byEmotion(emotion: string, limit: number = 5): Promise<MemoryEntry[]> {
    return this.memories.filter(m => m.emotion === emotion).sort((a, b) => b.weight - a.weight).slice(0, limit);
  }

  getMemoryCount(): number { return this.memories.length; }

  // ═══════════════════════════════════════════════════
  // Memory Ranking + Forgetting
  // ═══════════════════════════════════════════════════
  rankByImportance(): MemoryEntry[] {
    return [...this.memories].sort((a, b) => b.weight - a.weight);
  }

  applyForgettingRules(): void {
    this.applyDecay();
  }

  getLongTermMemories(months: number = 6): MemoryEntry[] {
    const threshold = Date.now() - months * 30 * 24 * 60 * 60 * 1000;
    return this.memories.filter(m => new Date(m.timestamp).getTime() < threshold && m.isCore);
  }

  getMemoryEmotionWeight(emotion: string): number {
    const emotionMemories = this.memories.filter(m => m.emotion === emotion);
    if (emotionMemories.length === 0) return 0;
    return emotionMemories.reduce((sum, m) => sum + m.weight, 0) / emotionMemories.length;
  }

  // ═══════════════════════════════════════════════════
  // ECOLOGY — دورة حياة الذاكرة
  // ═══════════════════════════════════════════════════

  applyAging(): void {
    const now = Date.now();
    for (const memory of this.memories) {
      const ageMs = now - new Date(memory.timestamp).getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);

      if (ageDays <= 1) memory.age = 'fresh';
      else if (ageDays <= 7) memory.age = 'recent';
      else if (ageDays <= 30) memory.age = 'stable';
      else if (ageDays <= 180) memory.age = 'core';
      else memory.age = 'legacy';

      memory.weight = this.calculateWeight(memory, ageDays);
      memory.temperature = this.calculateTemperature(memory);
      memory.weight = Math.max(0.01, memory.weight - memory.decayRate * (ageDays / 30));
    }
  }

  applyDecay(): void {
    this.applyAging();
    const before = this.memories.length;

    this.memories = this.memories.filter(m => {
      if (m.isLifeMemory) return true;
      if (m.isCore && m.weight > 0.3) return true;
      if (m.revivalCount >= 2) return true;
      if (m.temperature === 'cold' && m.weight < 0.1 && m.age !== 'fresh') return false;
      return m.weight > 0.05;
    });

    if (this.memories.length < before) {
      stateBus.emit('memory:decay_applied', { removed: before - this.memories.length });
    }
  }

  revive(id: string): MemoryEntry | null {
    const memory = this.memories.find(m => m.id === id);
    if (!memory) return null;

    memory.revived = true;
    memory.revivalCount++;
    memory.accessCount++;
    memory.lastAccessed = new Date().toISOString();
    memory.temperature = 'hot';
    memory.weight = Math.min(1.0, memory.weight + 0.2);
    memory.decayRate = Math.max(0.001, memory.decayRate * 0.5);

    if (memory.revivalCount >= 3 && !memory.isCore) {
      memory.isCore = true;
      memory.age = 'core';
    }

    stateBus.emit('memory:revived', { id, weight: memory.weight });
    return memory;
  }

  linkMemories(sourceId: string, targetId: string, linkType: MemoryLink['type'] = 'related'): void {
    const source = this.memories.find(m => m.id === sourceId);
    const target = this.memories.find(m => m.id === targetId);
    if (!source || !target) return;

    const existingLink = source.links.find(l => l.targetId === targetId);
    if (existingLink) {
      existingLink.strength = Math.min(1.0, existingLink.strength + 0.1);
    } else {
      source.links.push({
        targetId,
        strength: 0.5,
        type: linkType,
        createdAt: new Date().toISOString(),
      });
    }

    const reverseLink = target.links.find(l => l.targetId === sourceId);
    if (!reverseLink) {
      target.links.push({
        targetId: sourceId,
        strength: 0.3,
        type: linkType,
        createdAt: new Date().toISOString(),
      });
    }
  }

  getMemoryGraph(centerId: string, depth: number = 2): MemoryEntry[] {
    const visited = new Set<string>();
    const result: MemoryEntry[] = [];

    const traverse = (id: string, currentDepth: number) => {
      if (currentDepth > depth || visited.has(id)) return;
      const memory = this.memories.find(m => m.id === id);
      if (!memory) return;

      visited.add(id);
      result.push(memory);

      for (const link of memory.links) {
        if (link.strength > 0.3) {
          traverse(link.targetId, currentDepth + 1);
        }
      }
    };

    traverse(centerId, 0);
    return result;
  }

  getCoreMemories(): MemoryEntry[] {
    return this.memories.filter(m => m.isCore || m.isLifeMemory).sort((a, b) => b.weight - a.weight);
  }

  getByTemperature(temp: MemoryTemperature): MemoryEntry[] {
    this.applyAging();
    return this.memories.filter(m => m.temperature === temp);
  }

  getEcologyStats(): {
    total: number;
    byAge: Record<MemoryAge, number>;
    byTemperature: Record<MemoryTemperature, number>;
    coreCount: number;
    lifeCount: number;
    avgWeight: number;
    totalLinks: number;
  } {
    const byAge: Record<MemoryAge, number> = { fresh: 0, recent: 0, stable: 0, core: 0, legacy: 0 };
    const byTemperature: Record<MemoryTemperature, number> = { hot: 0, warm: 0, cold: 0 };
    let totalWeight = 0;
    let totalLinks = 0;

    for (const m of this.memories) {
      byAge[m.age]++;
      byTemperature[m.temperature]++;
      totalWeight += m.weight;
      totalLinks += m.links.length;
    }

    return {
      total: this.memories.length,
      byAge,
      byTemperature,
      coreCount: this.memories.filter(m => m.isCore).length,
      lifeCount: this.memories.filter(m => m.isLifeMemory).length,
      avgWeight: this.memories.length > 0 ? totalWeight / this.memories.length : 0,
      totalLinks,
    };
  }

  // ═══════════════════════════════════════════════════
  // Private — حسابات Ecology
  // ═══════════════════════════════════════════════════

  private calculateInitialWeight(importance: number, emotion: string): number {
    let weight = importance / 100;
    const emotionBoost: Record<string, number> = {
      joy: 0.05, sadness: 0.08, fear: 0.08, love: 0.10, anger: 0.05,
    };
    weight += emotionBoost[emotion] || 0;
    return Math.min(1.0, Math.max(0.05, weight));
  }

  private calculateWeight(memory: MemoryEntry, ageDays: number): number {
    const config = AGE_THRESHOLDS[memory.age] || AGE_THRESHOLDS.stable;
    let weight = config.weightBase;

    weight += (memory.importance / 100) * 0.2;
    weight += Math.min(0.15, memory.accessCount * 0.02);
    weight += memory.revivalCount * 0.05;
    weight += Math.min(0.1, memory.links.filter(l => l.strength > 0.5).length * 0.02);
    weight += (memory.confidence - 0.5) * 0.1;

    return Math.min(1.0, Math.max(0.01, weight));
  }

  private calculateTemperature(memory: MemoryEntry): MemoryTemperature {
    const hoursSinceAccess = (Date.now() - new Date(memory.lastAccessed).getTime()) / (1000 * 60 * 60);

    if (hoursSinceAccess < 1) return 'hot';
    if (hoursSinceAccess < 24) return 'warm';
    return 'cold';
  }

  private calculateDecayRate(importance: number): number {
    if (importance >= 90) return 0.001;
    if (importance >= 70) return 0.005;
    if (importance >= 50) return 0.01;
    if (importance >= 30) return 0.02;
    return 0.05;
  }

  private linkToRelated(entry: MemoryEntry): void {
    const recent = this.memories.slice(-20);
    for (const existing of recent) {
      if (existing.type === entry.type) {
        this.linkMemories(entry.id, existing.id, 'similar');
      }
      const entryWords = entry.content.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const existingWords = existing.content.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const commonWords = entryWords.filter(w => existingWords.includes(w));
      if (commonWords.length >= 2) {
        this.linkMemories(entry.id, existing.id, 'same_topic');
      }
    }
  }
}

export const memoryEngine = new MemoryEngine();
