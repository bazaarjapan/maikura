import { describe, it, expect } from 'vitest';
import { RollingFps } from './perf';

describe('perf: RollingFps', () => {
  it('computes instant and average fps', () => {
    const p = new RollingFps(5);
    // simulate 5 frames at 16ms (~62.5fps)
    for (let i = 0; i < 5; i++) p.update(0.016);
    expect(Math.round(p.instant)).toBe(63);
    expect(Math.round(p.average)).toBe(63);
    // one slow frame at 33ms
    p.update(0.033);
    expect(Math.round(p.instant)).toBe(30);
    expect(p.average).toBeLessThan(62);
  });
});
