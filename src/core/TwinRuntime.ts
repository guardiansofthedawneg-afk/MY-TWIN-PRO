export class TwinRuntime {
  private active = false;
  start() { this.active = true; }
  stop() { this.active = false; }
  isActive() { return this.active; }
}
export const runtime = new TwinRuntime();
