import { devicePresenceEngine } from '../../engine/device/DevicePresenceEngine';

export class SensorBridge {
  private accelerometerSub: any = null;
  private gyroscopeSub: any = null;
  private barometerSub: any = null;
  private lightSensorSub: any = null;
  private pedometerSub: any = null;
  private audioSimInterval: ReturnType<typeof setInterval> | null = null;
  private isActive = false;

  async start(): Promise<void> {
    if (this.isActive) return;
    this.isActive = true;

    try {
      const { Accelerometer, Gyroscope, Barometer, LightSensor, Pedometer } = await import('expo-sensors');

      this.accelerometerSub = Accelerometer.addListener((data: any) => {
        devicePresenceEngine.updateAccelerometer(data.x, data.y, data.z);
      });
      Accelerometer.setUpdateInterval(100);

      this.gyroscopeSub = Gyroscope.addListener((data: any) => {
        devicePresenceEngine.updateGyroscope(data.x, data.y, data.z);
      });
      Gyroscope.setUpdateInterval(100);

      this.barometerSub = Barometer.addListener((data: any) => {
        devicePresenceEngine.updateBarometer(data.pressure);
      });
      Barometer.setUpdateInterval(5000);

      this.lightSensorSub = LightSensor.addListener((data: any) => {
        devicePresenceEngine.updateLightLevel(data.illuminance);
      });
      LightSensor.setUpdateInterval(1000);

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
          this.pedometerSub = Pedometer.watchStepCount((data: any) => {
            devicePresenceEngine.updateStepCount(data.steps);
          });
        }
      } catch (e) {
        console.log('[SensorBridge] Pedometer not available');
      }

      // محاكاة مستوى الصوت (للتطوير فقط، سيتم استبدالها بميكروفون حقيقي)
      this.startAudioLevelSimulation();

      console.log('[SensorBridge] ✅ All sensors connected');
    } catch (e) {
      console.warn('[SensorBridge] ⚠️ Sensors unavailable:', e);
    }
  }

  private startAudioLevelSimulation(): void {
    this.audioSimInterval = setInterval(() => {
      const level = 0.1 + Math.random() * 0.4; // قيمة وهمية
      devicePresenceEngine.updateAudioLevel(level);
    }, 1000);
  }

  stop(): void {
    this.isActive = false;
    if (this.accelerometerSub) { this.accelerometerSub.remove(); this.accelerometerSub = null; }
    if (this.gyroscopeSub) { this.gyroscopeSub.remove(); this.gyroscopeSub = null; }
    if (this.barometerSub) { this.barometerSub.remove(); this.barometerSub = null; }
    if (this.lightSensorSub) { this.lightSensorSub.remove(); this.lightSensorSub = null; }
    if (this.pedometerSub) { this.pedometerSub.remove(); this.pedometerSub = null; }
    if (this.audioSimInterval) { clearInterval(this.audioSimInterval); this.audioSimInterval = null; }
    console.log('[SensorBridge] All sensors disconnected');
  }
}

export const sensorBridge = new SensorBridge();
