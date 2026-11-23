import { describe, it, expect } from 'vitest';
import { nextQuality, qualitySettings } from './globe-quality';

describe('nextQuality', () => {
  it('bleibt bei 25 fps und mehr', () => {
    expect(nextQuality(0, 50, 2000)).toBe(0);
    expect(nextQuality(1, 120, 2000)).toBe(1);
  });
  it('stuft unter 25 fps genau eine Stufe ab, höchstens bis 2', () => {
    expect(nextQuality(0, 49, 2000)).toBe(1);
    expect(nextQuality(1, 10, 2000)).toBe(2);
    expect(nextQuality(2, 1, 2000)).toBe(2);
  });
  it('wertet kein Fenster, das länger als das Doppelte dauerte (Tab war verborgen)', () => {
    expect(nextQuality(0, 3, 60_000)).toBe(0);
  });
});

describe('qualitySettings', () => {
  it('Stufe 0: Pixeldichte höchstens 2, alles an', () => {
    expect(qualitySettings(0, 3)).toEqual({ dpr: 2, clouds: true, bloom: true });
    expect(qualitySettings(0, 1.5)).toEqual({ dpr: 1.5, clouds: true, bloom: true });
  });
  it('Stufe 1: Pixeldichte 1', () => {
    expect(qualitySettings(1, 3)).toEqual({ dpr: 1, clouds: true, bloom: true });
  });
  it('Stufe 2: zusätzlich Wolken und Bloom aus', () => {
    expect(qualitySettings(2, 3)).toEqual({ dpr: 1, clouds: false, bloom: false });
  });
});
