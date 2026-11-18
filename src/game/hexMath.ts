/**
 * Hexagonal Mathematics & Grid Geometry for Roads & Boats
 * Using Pointy-Topped Axial Coordinates (q, r)
 */

import { HexCoordinate, HexOrientation } from './types';

// Axial hex neighbor directions (q, r) — shared topology for both pointy-top and flat-top grids
export const HEX_DIRECTIONS: HexCoordinate[] = [
  { q: 1, r: 0 },
  { q: 0, r: 1 },
  { q: -1, r: 1 },
  { q: -1, r: 0 },
  { q: 0, r: -1 },
  { q: 1, r: -1 },
];

export function hexToKey(q: number, r: number): string {
  return `${q},${r}`;
}

export function parseHexKey(key: string): HexCoordinate {
  const [q, r] = key.split(',').map(Number);
  return { q, r };
}

export function getHexNeighbors(q: number, r: number): HexCoordinate[] {
  return HEX_DIRECTIONS.map(dir => ({
    q: q + dir.q,
    r: r + dir.r,
  }));
}

export function areHexNeighbors(a: HexCoordinate, b: HexCoordinate): boolean {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return HEX_DIRECTIONS.some(dir => dir.q === dq && dir.r === dr);
}

export function hexDistance(a: HexCoordinate, b: HexCoordinate): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

/**
 * Normalized canonical Edge Key between two hexes:
 * Sorts hex keys alphabetically so edge between (0,0) and (1,0) is always "0,0|1,0"
 */
export function getEdgeKey(q1: number, r1: number, q2: number, r2: number): string {
  const key1 = hexToKey(q1, r1);
  const key2 = hexToKey(q2, r2);
  return key1 < key2 ? `${key1}|${key2}` : `${key2}|${key1}`;
}

export function parseEdgeKey(edgeKey: string): [HexCoordinate, HexCoordinate] {
  const [keyA, keyB] = edgeKey.split('|');
  return [parseHexKey(keyA), parseHexKey(keyB)];
}

/**
 * Axial hex pixel coordinates (supports pointy-topped default and flat-topped)
 * radius: outer radius from center to vertex
 */
export function hexToPixel(
  q: number,
  r: number,
  radius: number,
  orientation: HexOrientation = 'pointy'
): { x: number; y: number } {
  if (orientation === 'flat') {
    const x = radius * ((3 / 2) * q);
    const y = radius * (Math.sqrt(3) * (r + q / 2));
    return { x, y };
  }
  const x = radius * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const y = radius * ((3 / 2) * r);
  return { x, y };
}

/**
 * Returns the 6 corner points for a hexagon SVG polygon
 */
export function getHexCornerPoints(
  centerX: number,
  centerY: number,
  radius: number,
  orientation: HexOrientation = 'pointy'
): string {
  const points: string[] = [];
  const offsetDeg = orientation === 'flat' ? 0 : -30;
  for (let i = 0; i < 6; i++) {
    const angleDeg = 60 * i + offsetDeg;
    const angleRad = (Math.PI / 180) * angleDeg;
    const px = centerX + radius * Math.cos(angleRad);
    const py = centerY + radius * Math.sin(angleRad);
    points.push(`${px.toFixed(2)},${py.toFixed(2)}`);
  }
  return points.join(' ');
}

/**
 * Computes the shared edge midpoint and line segment endpoints between two adjacent hexes
 */
export function getSharedEdgeSegment(
  q1: number,
  r1: number,
  q2: number,
  r2: number,
  radius: number,
  orientation: HexOrientation = 'pointy'
): {
  midX: number;
  midY: number;
  p1: { x: number; y: number };
  p2: { x: number; y: number };
  angle: number;
} {
  const c1 = hexToPixel(q1, r1, radius, orientation);
  const c2 = hexToPixel(q2, r2, radius, orientation);
  const midX = (c1.x + c2.x) / 2;
  const midY = (c1.y + c2.y) / 2;

  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  const halfEdge = (radius * 0.95) / 2;
  const perpX = (-dy / dist) * halfEdge;
  const perpY = (dx / dist) * halfEdge;

  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return {
    midX,
    midY,
    p1: { x: midX - perpX, y: midY - perpY },
    p2: { x: midX + perpX, y: midY + perpY },
    angle,
  };
}
