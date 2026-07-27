import { stateBus } from '../../src/core/StateBus';
import { EventBus } from '../../src/core/EventBus';
import { audioEngine } from '../../src/core/AudioEngine';

export interface DeviceSensors {
  accelerometer: { x: number; y: number; z: number } | null;
  gyroscope: { x: number; y: number; z: number } | null;
  barometer: number | null;
  proximity: number | null;
  deviceBattery: number | null;       // ✅ بطارية الهاتف (مستشعر)
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
    deviceBattery: 100, isCameraReady: false, isMicrophoneReady: false,
    hasUserPermission: false, faceDetected: false, faceBounds: null,
    userWalking: false, userRunning: false, userStationary: true,
    isNightTime: false, isQuietTime: false,
  };

  private isActive: boolean = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  start(): void {
    if (this.isActive) return;
    this.isActive = true;
    this.intervalId = setInterval(() => { this.evaluateSensors(); }, 500);
  }

  stop(): void {
    this.isActive = false;
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
  }

  setUserPermission(granted: boolean): void {
    this.sensors.hasUserPermission = granted;
    if (granted) {
      this.sensors.isCameraReady = true;
      this.sensors.isMicrophoneReady = true;
    }
    stateBus.emit('device:permission_changed', { granted });
  }

  updateBattery(level: number): void {
    const previous = this.sensors.deviceBattery;
    this.sensors.deviceBattery = level;

    // ✅ إذا انخفضت بطارية الهاتف لأقل من 15%، الكيان يشير لذلك
    if (level < 15 && previous && previous >= 15) {
      audioEngine.play('battery_low').catch(() => {});
      // ✅ إرسال إشارة للكيان وليس للطاقة الخاصة به
      EventBus.emit('DEVICE_BATTERY_LOW', { level });
    }
  }

  
  updateAccelerometer(x: number, y: number, z: number): void {
    this.sensors.accelerometer = { x, y, z };
  }
  updateGyroscope(x: number, y: number, z: number): void {
    this.sensors.gyroscope = { x, y, z };
  }
  updateBarometer(pressure: number): void {
    this.sensors.barometer = pressure;
  }
  getStepCount(): number { return 0; }

  getSensors(): DeviceSensors { return { ...this.sensors }; }
  getDeviceBattery(): number { return this.sensors.deviceBattery || 100; }
  isActive_(): boolean { return this.isActive; }

  private evaluateSensors(): void {
    if (!this.sensors.hasUserPermission) return;
    stateBus.emit('device:sensors_updated', this.sensors);
  }
}

export const devicePresenceEngine = new DevicePresenceEngine();
