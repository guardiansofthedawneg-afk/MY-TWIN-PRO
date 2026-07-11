/**
 * EVENT BUS — Central Event Bus for MyTwin
 * =========================================
 * Added missing event types for full backward compatibility.
 */
type Listener = (payload?: any) => void;

export type EventName =
  | 'USER_OPEN_APP'
  | 'USER_SEND_MESSAGE'
  | 'AI_START_THINKING'
  | 'AI_FINISH_THINKING'
  | 'MEMORY_SURFACED'
  | 'MEMORY_CREATED'
  | 'TRUST_EVENT'
  | 'RELATIONSHIP_MILESTONE'
  | 'WORKSPACE_TRANSFORM_START'
  | 'WORKSPACE_TRANSFORM_COMPLETE'
  | 'APP_BACKGROUND'
  | 'CAPABILITY_ACTIVATED'
  | 'CAPABILITY_DEACTIVATED'
  | 'STUDY_TOPIC_ADDED'
  | 'TWIN_SPEAK'
  | 'DAILY_STATE_CHANGED'
  | 'LIVING_STATE_APPLIED'
  | 'SIGNATURE_MOMENT'
  | 'SOUL_POINTS_EARNED'
  | 'SOUL_POINTS_SPENT'
  | 'EXPLORER_PASS_ACTIVATED'
  | 'EXPLORER_PASS_EXPIRED'
  | 'AD_REWARD_EARNED'
  | 'PRESENCE_CHANGED'
  | 'EMOTIONAL_STATE_CHANGED'
  | 'EMOTION_CHANGED'
  | 'BOND_CHANGED'
  | 'OPEN_SOUL_OBSERVATORY'
  | string;

class EventBusClass {
  private listeners: Map<string, Listener[]> = new Map();

  on(event: EventName, callback: Listener): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event)!.push(callback);
    return () => {
      const arr = this.listeners.get(event);
      if (arr) { const idx = arr.indexOf(callback); if (idx > -1) arr.splice(idx, 1); }
    };
  }

  emit(event: EventName, payload?: any): void {
    const arr = this.listeners.get(event);
    if (arr) arr.forEach(cb => { try { cb(payload); } catch (e) { console.warn(`[EventBus] Error: ${event}`, e); } });
  }

  clear(): void { this.listeners.clear(); }
}

export const EventBus = new EventBusClass();
