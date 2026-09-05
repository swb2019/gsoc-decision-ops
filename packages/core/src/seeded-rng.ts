/**
 * Seeded Random Number Generator for Hourglass Command
 *
 * Provides reproducible randomization for gameplay runs.
 * Uses a simple but effective Mulberry32 algorithm for speed and consistency.
 *
 * Features:
 * - Deterministic: same seed = same sequence
 * - Fast: minimal computation overhead
 * - Portable: pure math, no external dependencies
 */

/**
 * Create a seeded random number generator using Mulberry32 algorithm
 * @param seed - Numeric seed for reproducibility
 * @returns A function that returns the next random number [0, 1)
 */
export function createSeededRNG(seed: number): () => number {
  let state = seed >>> 0;

  return function mulberry32(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let z = state;
    z = Math.imul(z ^ (z >>> 15), z | 1) >>> 0;
    z = (z ^ (z + Math.imul(z ^ (z >>> 7), z | 61))) >>> 0;
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate a seed from a string (e.g., date, session ID)
 * @param str - String to hash into a seed
 * @returns Numeric seed
 */
export function seedFromString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) >>> 0;
    hash = hash >>> 0;
  }
  return hash || 1;
}

/**
 * Generate a timestamp-based seed (for "feels fresh" default)
 * Includes day granularity so runs within same day share some patterns
 * but different days feel different
 */
export function generateTimestampSeed(): number {
  const now = new Date();
  const dayPart = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  const timePart = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const msPart = now.getMilliseconds();
  return (dayPart * 100000 + timePart * 1000 + msPart) >>> 0;
}

/**
 * Seeded RNG utility class with convenience methods
 */
export class SeededRandom {
  private rng: () => number;
  public readonly seed: number;

  constructor(seed?: number | string) {
    if (typeof seed === 'string') {
      this.seed = seedFromString(seed);
    } else if (typeof seed === 'number') {
      this.seed = seed >>> 0;
    } else {
      this.seed = generateTimestampSeed();
    }
    this.rng = createSeededRNG(this.seed);
  }

  /**
   * Get next random number [0, 1)
   */
  next(): number {
    return this.rng();
  }

  /**
   * Get random integer in range [min, max] inclusive
   */
  int(min: number, max: number): number {
    return Math.floor(this.rng() * (max - min + 1)) + min;
  }

  /**
   * Get random float in range [min, max)
   */
  float(min: number, max: number): number {
    return this.rng() * (max - min) + min;
  }

  /**
   * Pick a random element from an array
   */
  pick<T>(array: T[]): T | undefined {
    if (array.length === 0) return undefined;
    return array[Math.floor(this.rng() * array.length)];
  }

  /**
   * Pick multiple random elements (without replacement)
   */
  pickMultiple<T>(array: T[], count: number): T[] {
    const available = [...array];
    const result: T[] = [];
    const n = Math.min(count, available.length);
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(this.rng() * available.length);
      result.push(available.splice(idx, 1)[0]);
    }
    return result;
  }

  /**
   * Shuffle an array in place (Fisher-Yates)
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Return true with given probability [0, 1]
   */
  chance(probability: number): boolean {
    return this.rng() < probability;
  }

  /**
   * Pick from weighted options
   * @param options - Array of [item, weight] pairs
   */
  weighted<T>(options: [T, number][]): T | undefined {
    const totalWeight = options.reduce((sum, [, w]) => sum + w, 0);
    if (totalWeight === 0) return undefined;

    let roll = this.rng() * totalWeight;
    for (const [item, weight] of options) {
      roll -= weight;
      if (roll <= 0) return item;
    }
    return options[options.length - 1]?.[0];
  }

  /**
   * Generate a sub-seed for branching randomization
   * Useful for creating deterministic child generators
   */
  subSeed(): number {
    return Math.floor(this.rng() * 2147483647);
  }

  /**
   * Create a child SeededRandom with a derived seed
   */
  fork(): SeededRandom {
    return new SeededRandom(this.subSeed());
  }
}

/**
 * Create a session seed that combines user intent with freshness
 * @param customSeed - Optional user-provided seed for reproducibility
 */
export function createSessionSeed(customSeed?: string | number): number {
  if (customSeed !== undefined) {
    return typeof customSeed === 'string' ? seedFromString(customSeed) : customSeed >>> 0;
  }
  return generateTimestampSeed();
}
