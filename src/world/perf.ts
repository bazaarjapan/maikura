export class RollingFps {
  private samples: number[] = [];
  private max: number;
  instant = 0;
  average = 0;
  constructor(maxSamples = 60) {
    this.max = Math.max(1, maxSamples);
  }
  update(deltaSeconds: number) {
    this.instant = 1 / Math.max(deltaSeconds, 1e-6);
    this.samples.push(this.instant);
    if (this.samples.length > this.max) this.samples.shift();
    const sum = this.samples.reduce((a, b) => a + b, 0);
    this.average = sum / this.samples.length;
  }
}

