import { stateBus } from '../../src/core/StateBus';
import { EventBus } from '../../src/core/EventBus';
import { audioEngine } from '../../src/core/AudioEngine';

export interface DeviceSensors {
  accelerometer: { x: number; y: number; z: number } | null;
  gyroscope: { x: number; y: number; z: number } | null;
  barometer: number | null;
  proximity: number | null;
  lightLevel: number | null;
  audioLevel: number;
  weatherCondition: 'clear' | 'rain' | 'storm' | 'unknown';
  stepCount: number;
  deviceBattery: number | null;
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
    lightLevel: null, audioLevel: 0, weatherCondition: 'unknown', stepCount: 0,
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
    if (level < 15 && previous && previous >= 15) {
      audioEngine.play('battery_low').catch(() => {});
      EventBus.emit('DEVICE_BATTERY_LOW', { level });
    }
  }

  updateAccelerometer(x: number, y: number, z: number): void { this.sensors.accelerometer = { x, y, z }; }
  updateGyroscope(x: number, y: number, z: number): void { this.sensors.gyroscope = { x, y, z }; }
  updateBarometer(pressure: number): void {
    this.sensors.barometer = pressure;
    // تحديد حالة الطقس بناءً على الضغط الجوي (تقريبي)
    if (pressure < 990) this.sensors.weatherCondition = 'storm';
    else if (pressure < 1010) this.sensors.weatherCondition = 'rain';
    else this.sensors.weatherCondition = 'clear';
  }

  updateProximity(distance: number): void { this.sensors.proximity = distance; }

  updateLightLevel(illuminance: number): void {
    this.sensors.lightLevel = illuminance;
    this.sensors.isNightTime = illuminance < 10;
    this.sensors.isQuietTime = this.sensors.isNightTime;
  }

  updateAudioLevel(level: number): void { this.sensors.audioLevel = level; }

  updateStepCount(steps: number): void {
    const previous = this.sensors.stepCount;
    this.sensors.stepCount = steps;
    if (previous > 0 && steps - previous > 10) {
      this.sensors.userWalking = true;
      this.sensors.userStationary = false;
    } else {
      this.sensors.userWalking = false;
      this.sensors.userStationary = true;
    }
  }

  updateFaceDetected(bounds: { x: number; y: number; width: number; height: number } | null): void {
    this.sensors.faceDetected = bounds !== null;
    this.sensors.faceBounds = bounds;
    stateBus.emit('device:face_detected', { detected: this.sensors.faceDetected });
  }

  getStepCount(): number { return this.sensors.stepCount; }
  getSensors(): DeviceSensors { return { ...this.sensors }; }
  getDeviceBattery(): number { return this.sensors.deviceBattery || 100; }
  isActive_(): boolean { return this.isActive; }

  private evaluateSensors(): void {
    if (!this.sensors.hasUserPermission) return;
    stateBus.emit('device:sensors_updated', this.sensors);
  }
}

export const devicePresenceEngine = new DevicePresenceEngine();
