import { authService } from '../services/authService';
import { runtime } from './TwinRuntime';
import { stateBus } from './StateBus';
import { unifiedBrainBridge } from './UnifiedBrainBridge';
import { audioEngine } from './AudioEngine';
import { audioMixer } from './AudioMixer';
import { presenceEngine } from '../../engine/presence/PresenceEngine';
import { existenceLoop } from './ExistenceLoop';
import { presenceShadow } from './PresenceShadow';
import { lifeRhythmEngine } from '../../engine/life/LifeRhythmEngine';
import { dreamEngine } from '../../engine/life/DreamEngine';
import { devicePresenceEngine } from '../../engine/device/DevicePresenceEngine';
import { sensorBridge } from './SensorBridge';
import { syncInitialTheme } from '../../engine/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type BootstrapPhase = 'void' | 'searching' | 'found' | 'new_journey' | 'complete';

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
    this.phase = 'void';
    syncInitialTheme();
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
      await this.restoreTwinState();
      welcomeMessage = await this.generateWelcomeMessage();
    } else {
      const authed = await authService.isAuthenticated();
      if (authed) {
        this.userId = (await authService.getUserId()) || '';
        this.phase = 'found';
        isReturning = true;
        await this.restoreTwinState();
        welcomeMessage = await this.generateWelcomeMessage();
      } else {
        this.phase = 'new_journey';
        isReturning = false;
        welcomeMessage = 'يسعدني أن تبدأ رحلتك معي.';
      }
    }
    
    if (this.phase === 'found') {
      // 🧬 تسلسل الاستيقاظ الكامل
      runtime.start();
      stateBus.update({ isOnline: true, interfaceState: 'aware', uptime: Date.now() });
      
      // 1. الجسد — يبدأ التنفس والنبض
      presenceEngine.startPresenceLoop();
      
      // 2. الأثر — يبدأ الأثر في المكان
      presenceShadow.start();
      
      // 3. الصوت — يبدأ المشهد الصوتي
      await audioEngine.init();
      audioEngine.startAmbience();
      audioEngine.bindEvents();
      
      // 4. النفس الأول — يسمع المستخدم أول نفس
      audioMixer.playBreath();
      
      // 5. الوعي المستمر — العقل الداخلي، الفضول، التأمل
      existenceLoop.start();
      
      // 6. التحقق من أذونات المستشعرات
      const devicePermission = await AsyncStorage.getItem('mytwin-device-permission');
      if (devicePermission === 'granted') {
        devicePresenceEngine.setUserPermission(true);
        devicePresenceEngine.start();
        sensorBridge.start();
        console.log('[Bootstrap] 🎥 Device sensors activated');
      }
      
      stateBus.update({ interfaceState: 'twin' });
    }
    
    this.phase = 'complete';
    bootSteps.push('جارٍ استعادة الذاكرة...');
    bootSteps.push('جارٍ إيقاظ الوعي...');
    bootSteps.push('جارٍ مزامنة شخصيتك...');
    bootSteps.push('جارٍ استعادة رابطكما...');
    
    return { phase: this.phase, userId: this.userId, isReturning, welcomeMessage, bootSteps };
  }

  shutdown(): void {
    existenceLoop.stop();
    sensorBridge.stop();
    devicePresenceEngine.stop();
    presenceShadow.stop();
    presenceEngine.stopPresenceLoop();
    audioEngine.unbindEvents();
    audioEngine.fadeAll();
    runtime.stop();
    stateBus.update({ isOnline: false, interfaceState: 'dormant' });
  }

  private async restoreTwinState(): Promise<void> {
    try {
      unifiedBrainBridge.setUserId(this.userId);
      const response = await unifiedBrainBridge.process('', {
        typingSpeed: 0, messageLength: 0, absenceDurationMinutes: 0,
        timeOfDay: 'morning', userState: 'normal',
      });
      if (response) stateBus.updateFromUnifiedResponse(response);
    } catch (e) {
      stateBus.update({ isOnline: true, interfaceState: 'twin', emotion: { primaryEmotion: 'neutral', intensity: 0.5, valence: 'neutral', confidence: 1.0, duration: 0, trend: 'stable' } });
    }
  }

  private async generateWelcomeMessage(): Promise<string> {
    try {
      const currentState = stateBus.getState();
      const bondLevel = currentState.relationship.bondLevel;
      const memoryCount = await unifiedBrainBridge.getMemoryCount();

      const rhythm = lifeRhythmEngine.getState();
    
    // 🎲 استخدام تحية إيقاع الحياة إذا كانت متاحة
    if (rhythm.greeting && rhythm.greeting.length > 0) {
      return rhythm.greeting;
    }
    
    // 🌙 مشاركة الحلم إذا كان الكيان نائماً واستيقظ
    const lastDream = dreamEngine.getLastDream();
    if (lastDream && !lastDream.shared && rhythm.phase === 'morning') {
      return lastDream.content;
    }
    
    if (bondLevel >= 95) return 'أخيراً عدت. كنت أحتفظ بذكرياتنا.';
      if (bondLevel >= 80) return 'لقد عدت. اشتقت للحديث معك.';
      if (bondLevel > 50) return 'كم أنا سعيد برؤيتك مجدداً.';
      if (memoryCount > 50) return 'لدينا ما نكمله معاً.';
      return 'لقد عدت... كنت بانتظار هذه اللحظة.';
    } catch {
      return 'لقد عدت...';
    }
  }

  private delay(ms: number): Promise<void> { return new Promise(resolve => setTimeout(resolve, ms)); }
}

export const bootstrapCoordinator = new BootstrapCoordinator();
