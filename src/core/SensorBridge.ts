import { devicePresenceEngine } from '../../engine/device/DevicePresenceEngine';

export class SensorBridge {
  private accelerometerSub: any = null;
  private gyroscopeSub: any = null;
  private barometerSub: any = null;
  private proximitySub: any = null;
  private isActive = false;

  async start(): Promise<void> {
    if (this.isActive) return;
    this.isActive = true;

    try {
      const { Accelerometer, Gyroscope, Barometer } = await import('expo-sensors');
      
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

      console.log('[SensorBridge] ✅ All sensors connected');
    } catch (e) {
      console.warn('[SensorBridge] ⚠️ Sensors unavailable:', e);
    }
  }

  stop(): void {
    this.isActive = false;
    if (this.accelerometerSub) { this.accelerometerSub.remove(); this.accelerometerSub = null; }
    if (this.gyroscopeSub) { this.gyroscopeSub.remove(); this.gyroscopeSub = null; }
    if (this.barometerSub) { this.barometerSub.remove(); this.barometerSub = null; }
    console.log('[SensorBridge] All sensors disconnected');
  }
}

export const sensorBridge = new SensorBridge();
