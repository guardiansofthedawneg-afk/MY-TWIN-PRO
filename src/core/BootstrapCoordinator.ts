import { authService } from '../services/authService';
import { runtime } from './TwinRuntime';
import { stateBus } from './StateBus';
import { unifiedBrainBridge } from './UnifiedBrainBridge';
import { audioEngine } from './AudioEngine';
import { presenceEngine } from '../../engine/presence/PresenceEngine';
import { syncInitialTheme } from '../../engine/colors';

export type BootstrapPhase =
  | 'void'
  | 'searching'
  | 'found'
  | 'new_journey'
  | 'complete';

export interface BootstrapResult {
  phase: BootstrapPhase;
  userId: string;
  isReturning: boolean;
  welcomeMessage: string;
  bootSteps: string[];
}

export class BootstrapCoordinator {
  private userId: string = '';
  private phase: BootstrapPhase = 'void';

  async bootstrap(): Promise<BootstrapResult> {
    syncInitialTheme();
    this.phase = 'void';
    
    await this.delay(1200);
    
    this.phase = 'searching';
    const sessionRestore = await authService.checkSessionRestore();
    
    let isReturning = false;
    let welcomeMessage = 'لنبدأ من البداية.';
    const bootSteps: string[] = [];

    if (sessionRestore.canRestore && sessionRestore.user_id) {
      this.userId = sessionRestore.user_id;
      this.phase = 'found';
      isReturning = true;
      
      if (sessionRestore.lastSessionId) {
        await authService.saveLastSession(sessionRestore.lastSessionId);
      }

      // ✅ استعادة حالة الكيان من الـ Backend عبر UnifiedBrainBridge
      await this.restoreTwinState();
      
      welcomeMessage = this.generateWelcomeMessage();
    } else {
      const authed = await authService.isAuthenticated();
      if (authed) {
        this.userId = (await authService.getUserId()) || '';
        this.phase = 'found';
        isReturning = true;
        
        // ✅ استعادة حالة الكيان
        await this.restoreTwinState();
        
        welcomeMessage = this.generateWelcomeMessage();
      } else {
        this.phase = 'new_journey';
        isReturning = false;
        welcomeMessage = 'يسعدني أن تبدأ رحلتك معي.';
      }
    }
    
    if (this.phase === 'found') {
      // ✅ بدء الأنظمة الأساسية
      runtime.start();
      
      // ✅ بدء حلقة الحضور
      presenceEngine.startPresenceLoop();
      
      // ✅ بدء الصوت
      await audioEngine.init();
      audioEngine.startAmbience();
      audioEngine.bindEvents();
      
      // ✅ تحديث StateBus بأننا متصلون
      stateBus.update({
        isOnline: true,
        interfaceState: 'twin',
        uptime: Date.now(),
      });
    }
    
    this.phase = 'complete';
    
    bootSteps.push('جارٍ استعادة الذاكرة...');
    bootSteps.push('جارٍ إيقاظ الوعي...');
    bootSteps.push('جارٍ مزامنة شخصيتك...');
    bootSteps.push('جارٍ استعادة رابطكما...');
    
    return {
      phase: this.phase,
      userId: this.userId,
      isReturning,
      welcomeMessage,
      bootSteps,
    };
  }

  shutdown(): void {
    // ✅ إيقاف الأنظمة بالترتيب العكسي
    presenceEngine.stopPresenceLoop();
    audioEngine.unbindEvents();
    audioEngine.fadeAll();
    runtime.stop();
    
    stateBus.update({
      isOnline: false,
      interfaceState: 'dormant',
    });
  }

  // ✅ استعادة حالة الكيان من الـ Backend
  private async restoreTwinState(): Promise<void> {
    try {
      unifiedBrainBridge.setUserId(this.userId);
      
      // استدعاء خفيف لاستعادة الحالة (بدون رسالة)
      const response = await unifiedBrainBridge.process('', {
        typingSpeed: 0,
        messageLength: 0,
        absenceDurationMinutes: 0,
        timeOfDay: 'morning',
        userState: 'normal',
      });
      
      if (response) {
        stateBus.updateFromUnifiedResponse(response);
      }
    } catch (e) {
      // فشل صامت — سنبدأ بحالة افتراضية
      stateBus.update({
        isOnline: true,
        interfaceState: 'twin',
        emotion: {
          primaryEmotion: 'neutral',
          intensity: 0.5,
          valence: 'neutral',
          confidence: 1.0,
          duration: 0,
          trend: 'stable',
        },
      });
    }
  }

  private generateWelcomeMessage(): string {
    try {
      const currentState = stateBus.getState();
      const bondLevel = currentState.relationship.bondLevel;
      const recentContext = currentState.memory.recentContext;
      const memoryCount = recentContext ? 1 : 0;
      
      // تحديد phase من bondLevel
      if (bondLevel >= 95) return 'أخيراً عدت. كنت أحتفظ بذكرياتنا.';
      if (bondLevel >= 80) return 'لقد عدت. اشتقت للحديث معك.';
      if (bondLevel > 50) return 'كم أنا سعيد برؤيتك مجدداً.';
      if (memoryCount > 0) return 'لدينا ما نكمله معاً.';
      return 'لقد عدت... كنت بانتظار هذه اللحظة.';
    } catch {
      return 'لقد عدت...';
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const bootstrapCoordinator = new BootstrapCoordinator();
