import { devicePresenceEngine } from '../../engine/device/DevicePresenceEngine';
import { EventBus } from './EventBus';

export class SensorBridge {
  private accelerometerSub: any = null;
  private gyroscopeSub: any = null;
  private barometerSub: any = null;
  private proximitySub: any = null;
  private lightSensorSub: any = null;
  private pedometerSub: any = null;
  private isActive = false;

  async start(): Promise<void> {
    if (this.isActive) return;
    this.isActive = true;

    try {
      const { Accelerometer, Gyroscope, Barometer, LightSensor, Pedometer } = await import('expo-sensors');
      
      this.accelerometerSub = Accelerometer.addListener(data => {
        devicePresenceEngine.updateAccelerometer(data.x, data.y, data.z);
      });
      Accelerometer.setUpdateInterval(100);

      this.gyroscopeSub = Gyroscope.addListener(data => {
        devicePresenceEngine.updateGyroscope(data.x, data.y, data.z);
      });
      Gyroscope.setUpdateInterval(100);

      this.barometerSub = Barometer.addListener(data => {
        devicePresenceEngine.updateBarometer(data.pressure);
      });
      Barometer.setUpdateInterval(5000);

      this.lightSensorSub = LightSensor.addListener(data => {
        devicePresenceEngine.updateLightLevel(data.illuminance);
      });
      LightSensor.setUpdateInterval(1000);

      // Proximity متاح فقط على بعض الأجهزة
      try {
        const { Proximity } = await import('expo-sensors');
        this.proximitySub = Proximity.addListener(data => {
          devicePresenceEngine.updateProximity(data.distance);
        });
      } catch (e) {
        console.log('[SensorBridge] Proximity sensor not available');
      }

      // Pedometer (عداد الخطوات)
      try {
        const pedometerResult = await Pedometer.isAvailableAsync();
        if (pedometerResult) {
          const end = new Date();
          const start = new Date();
          start.setHours(0, 0, 0, 0);
          const pastStepCount = await Pedometer.getStepCountAsync(start, end);
          if (pastStepCount) {
            devicePresenceEngine.updateStepCount(pastStepCount.steps);
          }
          
          this.pedometerSub = Pedometer.watchStepCount(data => {
            devicePresenceEngine.updateStepCount(data.steps);
          });
        }
      } catch (e) {
        console.log('[SensorBridge] Pedometer not available');
      }

      console.log('[SensorBridge] ✅ All sensors connected (Accel, Gyro, Baro, Light, Prox, Pedometer)');
    } catch (e) {
      console.warn('[SensorBridge] ⚠️ Sensors unavailable:', e);
    }

    // بدء مراقبة البطارية
    this.startBatteryMonitoring();
  }

  private startBatteryMonitoring(): void {
    try {
      const { PowerState } = require('expo-battery');
      // محاكاة: سنستخدم EventBus لاحقاً
    } catch (e) {}
  }

  stop(): void {
    this.isActive = false;
    if (this.accelerometerSub) { this.accelerometerSub.remove(); this.accelerometerSub = null; }
    if (this.gyroscopeSub) { this.gyroscopeSub.remove(); this.gyroscopeSub = null; }
    if (this.barometerSub) { this.barometerSub.remove(); this.barometerSub = null; }
    if (this.proximitySub) { this.proximitySub.remove(); this.proximitySub = null; }
    if (this.lightSensorSub) { this.lightSensorSub.remove(); this.lightSensorSub = null; }
    if (this.pedometerSub) { this.pedometerSub.remove(); this.pedometerSub = null; }
    console.log('[SensorBridge] All sensors disconnected');
  }
}

export const sensorBridge = new SensorBridge();
