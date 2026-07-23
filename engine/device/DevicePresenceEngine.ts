import { stateBus } from '../../src/core/StateBus';
import { EventBus } from '../../src/core/EventBus';
import { audioMixer } from '../../src/core/AudioMixer';
import { audioEngine } from '../../src/core/AudioEngine';

export interface DeviceSensors {
  accelerometer: { x: number; y: number; z: number } | null;
  gyroscope: { x: number; y: number; z: number } | null;
  barometer: number | null;
  proximity: number | null;
  battery: number | null;
  isCameraReady: boolean;
  isMicrophoneReady: boolean;
  hasUserPermission: boolean;
  faceDetected: boolean;
  faceBounds: { x: number; y: number; width: number; height: number } | null;
  userWalking: boolean;
  userRunning: boolean;
  userStationary: boolean;
  isNightTime: boolean;
  isQuietTime: boolean;
}

export class DevicePresenceEngine {
  private sensors: DeviceSensors = {
    accelerometer: null, gyroscope: null, barometer: null, proximity: null,
    battery: 100, isCameraReady: false, isMicrophoneReady: false,
    hasUserPermission: false, faceDetected: false, faceBounds: null,
    userWalking: false, userRunning: false, userStationary: true,
    isNightTime: false, isQuietTime: false,
  };

  private stepCounter: number = 0;
  private lastStepTime: number = 0;
  private isActive: boolean = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private blinkIntervalId: ReturnType<typeof setInterval> | null = null;
  private lastFaceState: boolean = false;
  private lastProximityState: 'near' | 'far' = 'far';

  start(): void {
    if (this.isActive) return;
    this.isActive = true;
    console.log('[DevicePresence] 🎥 The Twin can now see and feel you.');
    
    this.intervalId = setInterval(() => { this.evaluateSensors(); }, 500);
    
    // رمش عشوائي كل 2-6 ثواني
    this.scheduleRandomBlink();
    
    // عند بدء التشغيل، صوت الكاميرا
    if (this.sensors.isCameraReady) {
      audioEngine.play('camera_look').catch(() => {});
    }
  }

  stop(): void {
    this.isActive = false;
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
    if (this.blinkIntervalId) { clearTimeout(this.blinkIntervalId); this.blinkIntervalId = null; }
    console.log('[DevicePresence] The Twin closes its eyes.');
  }

  private scheduleRandomBlink(): void {
    if (!this.isActive) return;
    const delay = 2000 + Math.random() * 4000;
    this.blinkIntervalId = setTimeout(() => {
      if (this.isActive) {
        // رمشة عين
        audioEngine.play('eye_blink').catch(() => {});
        EventBus.emit('MICRO_EXPRESSION', { type: 'eye_blink' });
        this.scheduleRandomBlink();
      }
    }, delay);
  }

  setUserPermission(granted: boolean): void {
    this.sensors.hasUserPermission = granted;
    if (granted) {
      this.sensors.isCameraReady = true;
      this.sensors.isMicrophoneReady = true;
      audioEngine.play('camera_look').catch(() => {});
    } else {
      this.sensors.isCameraReady = false;
      this.sensors.isMicrophoneReady = false;
    }
    stateBus.emit('device:permission_changed', { granted });
  }

  updateAccelerometer(x: number, y: number, z: number): void {
    this.sensors.accelerometer = { x, y, z };
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    
    if (magnitude > 12) {
      if (!this.sensors.userRunning) {
        this.sensors.userRunning = true;
        this.sensors.userWalking = false;
        this.sensors.userStationary = false;
        // بدء الجري — نبض أسرع
        audioEngine.play('heartbeat_energy').catch(() => {});
      }
    } else if (magnitude > 9.8) {
      if (!this.sensors.userWalking) {
        this.sensors.userWalking = true;
        this.sensors.userRunning = false;
        this.sensors.userStationary = false;
      }
      const now = Date.now();
      if (now - this.lastStepTime > 400) {
        this.stepCounter++;
        this.lastStepTime = now;
        audioEngine.play('heartbeat_energy').catch(() => {});
      }
    } else {
      if (!this.sensors.userStationary) {
        this.sensors.userWalking = false;
        this.sensors.userRunning = false;
        this.sensors.userStationary = true;
      }
    }
  }

  updateGyroscope(x: number, y: number, z: number): void {
    this.sensors.gyroscope = { x, y, z };
    if (Math.abs(x) > 3 || Math.abs(y) > 3) {
      // إمالة الجهاز — صوت دوران
      audioEngine.play('gesture_circle').catch(() => {});
    }
  }

  updateBarometer(pressure: number): void {
    const previous = this.sensors.barometer;
    this.sensors.barometer = pressure;
    if (previous && Math.abs(pressure - previous) > 10) {
      audioEngine.play('particles').catch(() => {});
    }
  }

  updateProximity(distance: number): void {
    const previous = this.sensors.proximity;
    this.sensors.proximity = distance;
    
    if (distance < 3 && this.lastProximityState !== 'near') {
      this.lastProximityState = 'near';
      audioEngine.play('proximity_near').catch(() => {});
      stateBus.emit('life:state_changed', { to: 'listening', reason: 'user_picked_up' });
    } else if (distance > 10 && this.lastProximityState !== 'far') {
      this.lastProximityState = 'far';
      audioEngine.play('proximity_far').catch(() => {});
      stateBus.emit('life:state_changed', { to: 'resting', reason: 'user_moved_away' });
    }
  }

  updateBattery(level: number): void {
    const previous = this.sensors.battery;
    this.sensors.battery = level;
    if (level < 15 && previous && previous >= 15) {
      audioEngine.play('battery_low').catch(() => {});
      stateBus.emit('presence:state_updated', { energyLevel: 0.2, silenceLevel: 0.5 });
    }
  }

  updateFaceDetection(bounds: { x: number; y: number; width: number; height: number } | null): void {
    const wasDetected = this.sensors.faceDetected;
    this.sensors.faceDetected = bounds !== null;
    this.sensors.faceBounds = bounds;
    
    if (bounds && !wasDetected) {
      // وجد وجهًا لأول مرة — صوت الكاميرا
      audioEngine.play('camera_look').catch(() => {});
      EventBus.emit('FACE_DETECTED', bounds);
    } else if (!bounds && wasDetected) {
      EventBus.emit('FACE_LOST', {});
    }
  }

  // إيماءة الموافقة (تُستدعى خارجياً)
  triggerHeadNod(): void {
    audioEngine.play('head_nod').catch(() => {});
  }

  // إيماءة الرفض (تُستدعى خارجياً)
  triggerHeadShake(): void {
    audioEngine.play('head_shake').catch(() => {});
  }

  // إيماءة التمرير (تُستدعى عند Air Gesture)
  triggerGestureSwipe(): void {
    audioEngine.play('gesture_swipe').catch(() => {});
  }

  private evaluateSensors(): void {
    if (!this.sensors.hasUserPermission) return;

    const hour = new Date().getHours();
    this.sensors.isNightTime = hour >= 22 || hour < 5;
    this.sensors.isQuietTime = hour >= 22 || hour < 6;

    stateBus.emit('device:sensors_updated', this.sensors);

    // تشغيل إيقاع الحياة حسب الوقت
    if (hour >= 6 && hour < 9 && this.sensors.userStationary) {
      audioEngine.play('life_rhythm_morning').catch(() => {});
    } else if (this.sensors.isQuietTime && this.sensors.userStationary) {
      audioEngine.play('life_rhythm_night').catch(() => {});
    }
  }

  getSensors(): DeviceSensors { return { ...this.sensors }; }
  isUserActive(): boolean { return !this.sensors.userStationary; }
  getStepCount(): number { return this.stepCounter; }
  isActive_(): boolean { return this.isActive; }
}

export const devicePresenceEngine = new DevicePresenceEngine();
