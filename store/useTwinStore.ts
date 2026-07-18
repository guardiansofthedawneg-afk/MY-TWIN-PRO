import { create } from 'zustand';
import { useTwinCoreStore } from './useTwinCoreStore';
import { useCreditsStore } from './useCreditsStore';
import { useCapabilityStore } from './useCapabilityStore';
import { useConversationStore } from './useConversationStore';
import { useRelationshipStore } from './useRelationshipStore';
import { useAwarenessStore } from './useAwarenessStore';

interface UnifiedResponse {
  twin_state_update?: {
    bond_delta?: number;
    personality_dna?: Record<string, number>;
    relationship?: {
      bond_level: number;
      stage: string;
      trust: number;
    };
  };
  twin_emotional_state?: {
    current_emotion: string;
    intensity: number;
  };
}

interface TwinStoreState {
  userId: string;
  setUserId: (id: string) => void;
  updateFromUnifiedResponse: (response: UnifiedResponse) => void;
}

export const useTwinStore = create<TwinStoreState>((set, get) => ({
  userId: '',
  setUserId: (id: string) => set({ userId: id }),
  
  updateFromUnifiedResponse: (response: UnifiedResponse) => {
    if (!response) return;
    
    // تحديث relationship store
    if (response.twin_state_update?.relationship) {
      const rel = response.twin_state_update.relationship;
      useRelationshipStore.getState().setBondLevel(rel.bond_level);
    }
    
    // تحديث الوعي
    if (response.twin_emotional_state) {
      useAwarenessStore.getState().setAwarenessScore(
        Math.round(response.twin_emotional_state.intensity * 100)
      );
    }
    
    // تحديث DNA الشخصية في twin core
    if (response.twin_state_update?.personality_dna) {
      useTwinCoreStore.getState().setPersonalityDNA?.(response.twin_state_update.personality_dna);
    }
  },
}));
