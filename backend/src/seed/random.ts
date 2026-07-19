/** Deterministic PRNG (mulberry32) and sampling helpers for seed data. */

export class Rng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** Uniform float in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  float(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  pick<T>(items: readonly T[]): T {
    return items[this.int(0, items.length - 1)];
  }

  /** Pick according to [item, weight] pairs. */
  weighted<T>(entries: readonly (readonly [T, number])[]): T {
    const total = entries.reduce((sum, [, w]) => sum + w, 0);
    let roll = this.next() * total;
    for (const [item, weight] of entries) {
      roll -= weight;
      if (roll <= 0) return item;
    }
    return entries[entries.length - 1][0];
  }

  chance(probability: number): boolean {
    return this.next() < probability;
  }

  hex(length: number): string {
    let out = '';
    for (let i = 0; i < length; i++) out += this.int(0, 15).toString(16);
    return out.toUpperCase();
  }

  digits(length: number): string {
    let out = '';
    for (let i = 0; i < length; i++) out += this.int(0, 9).toString();
    return out;
  }

  mac(): string {
    const octets: string[] = [];
    for (let i = 0; i < 6; i++) octets.push(this.hex(2));
    return octets.join(':');
  }
}
