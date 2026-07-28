import { authService } from '../services/authService';
import { stateBus } from './StateBus';
import { unifiedBrainBridge } from './UnifiedBrainBridge';
import { presenceEngine } from '../../engine/presence/PresenceEngine';
import { lifeRhythmEngine } from '../../engine/life/LifeRhythmEngine';
import { sensorBridge } from './SensorBridge';
import { runtime } from './TwinRuntime';
import { syncInitialTheme } from '../../engine/colors';

export class BootstrapCoordinator {
  private userId: string = '';

  async bootstrap(): Promise<{ userId: string; isReturning: boolean }> {
    syncInitialTheme();
    await this.delay(1200);
    
    const sessionRestore = await authService.checkSessionRestore();
    let isReturning = false;

    if (sessionRestore.canRestore && sessionRestore.user_id) {
      this.userId = sessionRestore.user_id;
      isReturning = true;
    } else {
      const authed = await authService.isAuthenticated();
      if (authed) {
        this.userId = (await authService.getUserId()) || '';
        isReturning = true;
      }
    }
    
    if (isReturning && this.userId) {
      unifiedBrainBridge.setUserId(this.userId);
      try {
        const response = await unifiedBrainBridge.process('', {
          typingSpeed: 0, messageLength: 0, absenceDurationMinutes: 0,
          timeOfDay: 'morning', userState: 'normal',
        });
        if (response) stateBus.updateFromUnifiedResponse(response);
      } catch (e) {
        console.warn('[Bootstrap] State restore failed:', e);
      }
    }

    // بدء المحركات الحيوية
    try { presenceEngine.startPresenceLoop(); } catch (e) { console.warn(e); }
    try { lifeRhythmEngine.start(); } catch (e) { console.warn(e); }
    try { sensorBridge.start(); } catch (e) { console.warn(e); }
    try { runtime.start(); } catch (e) { console.warn(e); }

    stateBus.update({ isOnline: true, interfaceState: 'twin', uptime: Date.now() });
    
    return { userId: this.userId, isReturning };
  }

  shutdown(): void {
    try { presenceEngine.stopPresenceLoop(); } catch (e) {}
    try { lifeRhythmEngine.stop(); } catch (e) {}
    try { sensorBridge.stop(); } catch (e) {}
    try { runtime.stop(); } catch (e) {}
    stateBus.update({ isOnline: false, interfaceState: 'dormant' });
  }

  private delay(ms: number): Promise<void> { return new Promise(resolve => setTimeout(resolve, ms)); }
}

export const bootstrapCoordinator = new BootstrapCoordinator();
