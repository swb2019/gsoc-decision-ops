import { describe, it, expect } from 'vitest';
import {
  createSeededRNG,
  seedFromString,
  generateTimestampSeed,
  SeededRandom,
  createSessionSeed,
} from '../seeded-rng.js';

describe('Seeded RNG', () => {
  describe('createSeededRNG', () => {
    it('produces deterministic sequences for same seed', () => {
      const rng1 = createSeededRNG(12345);
      const rng2 = createSeededRNG(12345);

      const seq1 = [rng1(), rng1(), rng1(), rng1(), rng1()];
      const seq2 = [rng2(), rng2(), rng2(), rng2(), rng2()];

      expect(seq1).toEqual(seq2);
    });

    it('produces different sequences for different seeds', () => {
      const rng1 = createSeededRNG(12345);
      const rng2 = createSeededRNG(54321);

      const seq1 = [rng1(), rng1(), rng1()];
      const seq2 = [rng2(), rng2(), rng2()];

      expect(seq1).not.toEqual(seq2);
    });

    it('produces values in range [0, 1)', () => {
      const rng = createSeededRNG(42);
      for (let i = 0; i < 1000; i++) {
        const value = rng();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });
  });

  describe('seedFromString', () => {
    it('produces consistent seed from same string', () => {
      const seed1 = seedFromString('test-seed');
      const seed2 = seedFromString('test-seed');
      expect(seed1).toBe(seed2);
    });

    it('produces different seeds from different strings', () => {
      const seed1 = seedFromString('seed-one');
      const seed2 = seedFromString('seed-two');
      expect(seed1).not.toBe(seed2);
    });

    it('returns 1 for empty string', () => {
      const seed = seedFromString('');
      expect(seed).toBe(1);
    });
  });

  describe('generateTimestampSeed', () => {
    it('returns a positive number', () => {
      const seed = generateTimestampSeed();
      expect(seed).toBeGreaterThan(0);
      expect(Number.isInteger(seed)).toBe(true);
    });
  });

  describe('SeededRandom class', () => {
    describe('constructor', () => {
      it('accepts numeric seed', () => {
        const rng = new SeededRandom(42);
        expect(rng.seed).toBe(42);
      });

      it('accepts string seed', () => {
        const rng = new SeededRandom('my-seed');
        expect(rng.seed).toBe(seedFromString('my-seed'));
      });

      it('generates timestamp seed when no seed provided', () => {
        const rng = new SeededRandom();
        expect(rng.seed).toBeGreaterThan(0);
      });
    });

    describe('int()', () => {
      it('returns integers in range [min, max]', () => {
        const rng = new SeededRandom(123);
        for (let i = 0; i < 100; i++) {
          const value = rng.int(5, 10);
          expect(value).toBeGreaterThanOrEqual(5);
          expect(value).toBeLessThanOrEqual(10);
          expect(Number.isInteger(value)).toBe(true);
        }
      });

      it('is deterministic', () => {
        const rng1 = new SeededRandom(456);
        const rng2 = new SeededRandom(456);

        const seq1 = [rng1.int(0, 100), rng1.int(0, 100), rng1.int(0, 100)];
        const seq2 = [rng2.int(0, 100), rng2.int(0, 100), rng2.int(0, 100)];

        expect(seq1).toEqual(seq2);
      });
    });

    describe('float()', () => {
      it('returns floats in range [min, max)', () => {
        const rng = new SeededRandom(789);
        for (let i = 0; i < 100; i++) {
          const value = rng.float(0.5, 2.5);
          expect(value).toBeGreaterThanOrEqual(0.5);
          expect(value).toBeLessThan(2.5);
        }
      });
    });

    describe('pick()', () => {
      it('returns undefined for empty array', () => {
        const rng = new SeededRandom(111);
        expect(rng.pick([])).toBeUndefined();
      });

      it('returns element from array', () => {
        const rng = new SeededRandom(222);
        const arr = ['a', 'b', 'c', 'd'];
        const picked = rng.pick(arr);
        expect(arr).toContain(picked);
      });

      it('is deterministic', () => {
        const rng1 = new SeededRandom(333);
        const rng2 = new SeededRandom(333);
        const arr = [1, 2, 3, 4, 5];

        expect(rng1.pick(arr)).toBe(rng2.pick(arr));
      });
    });

    describe('pickMultiple()', () => {
      it('returns requested count of elements', () => {
        const rng = new SeededRandom(444);
        const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const picked = rng.pickMultiple(arr, 5);

        expect(picked).toHaveLength(5);
        picked.forEach((item) => expect(arr).toContain(item));
      });

      it('returns all elements if count exceeds array length', () => {
        const rng = new SeededRandom(555);
        const arr = [1, 2, 3];
        const picked = rng.pickMultiple(arr, 10);

        expect(picked).toHaveLength(3);
      });

      it('returns unique elements (no duplicates)', () => {
        const rng = new SeededRandom(666);
        const arr = [1, 2, 3, 4, 5];
        const picked = rng.pickMultiple(arr, 5);

        const uniqueSet = new Set(picked);
        expect(uniqueSet.size).toBe(5);
      });
    });

    describe('shuffle()', () => {
      it('returns array of same length', () => {
        const rng = new SeededRandom(777);
        const arr = [1, 2, 3, 4, 5];
        const shuffled = rng.shuffle(arr);

        expect(shuffled).toHaveLength(5);
      });

      it('contains same elements', () => {
        const rng = new SeededRandom(888);
        const arr = [1, 2, 3, 4, 5];
        const shuffled = rng.shuffle(arr);

        expect(shuffled.sort()).toEqual(arr.sort());
      });

      it('does not modify original array', () => {
        const rng = new SeededRandom(999);
        const arr = [1, 2, 3, 4, 5];
        const original = [...arr];
        rng.shuffle(arr);

        expect(arr).toEqual(original);
      });

      it('is deterministic', () => {
        const rng1 = new SeededRandom(1111);
        const rng2 = new SeededRandom(1111);
        const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

        expect(rng1.shuffle(arr)).toEqual(rng2.shuffle(arr));
      });
    });

    describe('chance()', () => {
      it('returns boolean', () => {
        const rng = new SeededRandom(2222);
        const result = rng.chance(0.5);
        expect(typeof result).toBe('boolean');
      });

      it('returns true with probability near expected', () => {
        const rng = new SeededRandom(3333);
        let trueCount = 0;
        const iterations = 1000;

        for (let i = 0; i < iterations; i++) {
          if (rng.chance(0.3)) trueCount++;
        }

        const ratio = trueCount / iterations;
        expect(ratio).toBeGreaterThan(0.2);
        expect(ratio).toBeLessThan(0.4);
      });
    });

    describe('weighted()', () => {
      it('returns undefined for empty options', () => {
        const rng = new SeededRandom(4444);
        expect(rng.weighted([])).toBeUndefined();
      });

      it('returns item from options', () => {
        const rng = new SeededRandom(5555);
        const options: [string, number][] = [
          ['a', 1],
          ['b', 2],
          ['c', 3],
        ];
        const result = rng.weighted(options);
        expect(['a', 'b', 'c']).toContain(result);
      });

      it('favors higher weighted items', () => {
        const rng = new SeededRandom(6666);
        const options: [string, number][] = [
          ['rare', 1],
          ['common', 100],
        ];

        let rareCount = 0;
        for (let i = 0; i < 1000; i++) {
          if (rng.weighted(options) === 'rare') rareCount++;
        }

        expect(rareCount).toBeLessThan(50);
      });
    });

    describe('fork()', () => {
      it('creates a new SeededRandom with derived seed', () => {
        const parent = new SeededRandom(7777);
        const child = parent.fork();

        expect(child).toBeInstanceOf(SeededRandom);
        expect(child.seed).not.toBe(parent.seed);
      });

      it('produces deterministic child seeds', () => {
        const parent1 = new SeededRandom(8888);
        const parent2 = new SeededRandom(8888);

        const child1 = parent1.fork();
        const child2 = parent2.fork();

        expect(child1.seed).toBe(child2.seed);
      });
    });
  });

  describe('createSessionSeed', () => {
    it('returns numeric seed from number', () => {
      const seed = createSessionSeed(12345);
      expect(seed).toBe(12345);
    });

    it('returns seed from string', () => {
      const seed = createSessionSeed('my-session');
      expect(seed).toBe(seedFromString('my-session'));
    });

    it('returns timestamp seed when no argument', () => {
      const seed = createSessionSeed();
      expect(seed).toBeGreaterThan(0);
    });
  });
});
