// @vitest-environment jsdom

/** Unit tests for the page and viewport coordinate helpers. */

import { describe, it, expect } from 'vitest';
import { clientToPage, pageToClient, distance } from './geometry';

function setScroll(x: number, y: number): void {
  Object.defineProperty(window, 'scrollX', { value: x, configurable: true });
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
}

describe('distance', () => {
  it('measures the euclidean distance between two points', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    expect(distance({ x: 1, y: 1 }, { x: 4, y: 5 })).toBe(5);
  });

  it('is zero for a point and itself', () => {
    expect(distance({ x: 7, y: 9 }, { x: 7, y: 9 })).toBe(0);
  });
});

describe('clientToPage and pageToClient', () => {
  it('are identity when the page is not scrolled', () => {
    setScroll(0, 0);
    expect(clientToPage(10, 20)).toEqual({ x: 10, y: 20 });
    expect(pageToClient({ x: 10, y: 20 })).toEqual({ x: 10, y: 20 });
  });

  it('add and subtract the scroll offset', () => {
    setScroll(100, 200);
    try {
      expect(clientToPage(10, 20)).toEqual({ x: 110, y: 220 });
      expect(pageToClient({ x: 110, y: 220 })).toEqual({ x: 10, y: 20 });
    } finally {
      setScroll(0, 0);
    }
  });

  it('round-trips a point back to itself', () => {
    setScroll(40, 80);
    try {
      expect(pageToClient(clientToPage(33, 66))).toEqual({ x: 33, y: 66 });
    } finally {
      setScroll(0, 0);
    }
  });
});
