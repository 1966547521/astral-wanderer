import type { FloorData, Room, RoomType } from '../types';
import { Random } from '../utils/Random';

const COLS = 6;
const ROWS = 5;
const MIN_ROOMS = 11;
const MAX_ROOMS = 15;

const CELL_W = 120;
const CELL_H = 90;
const CELL_PAD = 12;
const GEN_W = COLS * (CELL_W + CELL_PAD) + CELL_PAD;
const GEN_H = ROWS * (CELL_H + CELL_PAD) + CELL_PAD;

const DIRS: [number, number][] = [
  [0, -1], [0, 1], [-1, 0], [1, 0],
];

export class FloorGenerator {
  private rng: Random;

  constructor(seed?: number) {
    this.rng = new Random(seed);
  }

  generate(floorNumber: number): FloorData {
    const grid: (0 | 1)[] = new Array(COLS * ROWS).fill(0);
    const types: RoomType[] = new Array(COLS * ROWS).fill('empty');
    const randCoeff = floorNumber * 0.3;

    const startCol = 0;
    const startRow = ROWS - 1;
    const startIdx = this.xy(startCol, startRow);

    const bossCol = this.rng.nextInt(4, COLS - 1);
    const bossRow = 0;
    const bossIdx = this.xy(bossCol, bossRow);

    grid[startIdx] = 1;
    types[startIdx] = 'start';

    const path: number[] = [startIdx];
    let cx = startCol, cy = startRow;
    while (cy > bossRow || cx !== bossCol) {
      const candidates: number[] = [];
      if (cy > bossRow && cx === bossCol) {
        candidates.push(0);       // up
      } else if (cy > bossRow) {
        if (cx < bossCol) candidates.push(3, 0);
        else if (cx > bossCol) candidates.push(2, 0);
        else candidates.push(0);
      } else {
        if (cx < bossCol) candidates.push(3);
        else candidates.push(2);
      }
      this.rng.shuffle(candidates);
      let moved = false;
      for (const d of candidates) {
        const [dx, dy] = DIRS[d];
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
        const nIdx = this.xy(nx, ny);
        if (grid[nIdx] === 1) continue;
        grid[nIdx] = 1;
        cx = nx; cy = ny;
        path.push(nIdx);
        moved = true;
        break;
      }
      if (!moved) break;
    }

    const pathSet = new Set(path);
    const borderCells: number[] = [];
    for (const pIdx of path) {
      const px = pIdx % COLS, py = Math.floor(pIdx / COLS);
      for (const [dx, dy] of DIRS) {
        const nx = px + dx, ny = py + dy;
        if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
        const nIdx = this.xy(nx, ny);
        if (!pathSet.has(nIdx) && grid[nIdx] === 0) {
          grid[nIdx] = 1;
          borderCells.push(nIdx);
        }
      }
    }

    const targetCount = this.rng.nextInt(MIN_ROOMS, MAX_ROOMS);
    let currentCount = path.length + borderCells.length;
    const extraCandidates: number[] = [];
    for (const bIdx of borderCells) {
      const bx = bIdx % COLS, by = Math.floor(bIdx / COLS);
      for (const [dx, dy] of DIRS) {
        const nx = bx + dx, ny = by + dy;
        if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
        const nIdx = this.xy(nx, ny);
        if (grid[nIdx] === 0 && !extraCandidates.includes(nIdx)) {
          extraCandidates.push(nIdx);
        }
      }
    }
    this.rng.shuffle(extraCandidates);
    for (const eIdx of extraCandidates) {
      if (currentCount >= targetCount) break;
      grid[eIdx] = 1;
      currentCount++;
    }

    const allActive: number[] = [];
    for (let i = 0; i < COLS * ROWS; i++) {
      if (grid[i] === 1) allActive.push(i);
    }

    for (const idx of allActive) {
      if (types[idx] !== 'empty') continue;
      if (idx === bossIdx) { types[idx] = 'boss'; continue; }
      const roll = this.rng.next();
      if (roll < 0.40) types[idx] = 'combat';
      else if (roll < 0.50) types[idx] = 'elite';
      else if (roll < 0.62) types[idx] = 'shop';
      else if (roll < 0.72) types[idx] = 'rest';
      else if (roll < 0.82) types[idx] = 'treasure';
      else if (roll < 0.90) types[idx] = 'altar';
      else types[idx] = 'combat';
    }

    const rooms: Room[] = [];
    const indexMap: Map<number, number> = new Map();
    for (const idx of allActive) {
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);
      indexMap.set(idx, rooms.length);
      rooms.push({
        col, row,
        type: types[idx],
        explored: idx === startIdx,
        isCurrent: idx === startIdx,
      });
    }

    const themes = ['尘封回廊', '异化深渊', '寂灭核心'];
    return {
      rooms,
      cols: COLS,
      rows: ROWS,
      startIndex: indexMap.get(startIdx)!,
      bossIndex: indexMap.get(bossIdx)!,
      floorNumber,
      theme: themes[Math.min(floorNumber - 1, themes.length - 1)],
    };
  }

  private xy(col: number, row: number): number {
    return row * COLS + col;
  }
}
