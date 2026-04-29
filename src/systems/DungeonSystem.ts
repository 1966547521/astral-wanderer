import { System } from '../ecs/System';
import { FloorGenerator } from '../dungeon/FloorGenerator';
import type { Direction, FloorData, GameState } from '../types';
import type { DungeonSystemCallbacks, IDungeonManager } from '../dungeon/IDungeonManager';

const DIRS: [number, number][] = [[0, -1], [0, 1], [-1, 0], [1, 0]];

export class DungeonSystem extends System implements IDungeonManager {
  public floorData: FloorData | null = null;
  public currentRoomIndex: number = 0;
  public currentFloor: number = 0;
  private generator: FloorGenerator;
  private callbacks: DungeonSystemCallbacks;

  constructor(callbacks: DungeonSystemCallbacks) {
    super();
    this.callbacks = callbacks;
    this.generator = new FloorGenerator();
  }

  generateFloor(): void {
    this.currentFloor = this.currentFloor || 1;
    this.floorData = this.generator.generate(this.currentFloor);
    this.currentRoomIndex = this.floorData.startIndex;
  }

  getAdjacentIndex(currentIdx: number, dir: Direction): number {
    if (!this.floorData) return -1;
    const cur = this.floorData.rooms[currentIdx];
    const dMap: Record<Direction, [number, number]> = {
      up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0],
    };
    const [dc, dr] = dMap[dir];
    const nc = cur.col + dc, nr = cur.row + dr;

    for (let i = 0; i < this.floorData.rooms.length; i++) {
      const r = this.floorData.rooms[i];
      if (r.col === nc && r.row === nr) return i;
    }
    return -1;
  }

  getAdjacentRoomIndices(currentIdx: number): number[] {
    const result: number[] = [];
    for (const [dc, dr] of DIRS) {
      if (!this.floorData) continue;
      const cur = this.floorData.rooms[currentIdx];
      const nc = cur.col + dc, nr = cur.row + dr;
      for (let i = 0; i < this.floorData.rooms.length; i++) {
        const r = this.floorData.rooms[i];
        if (r.col === nc && r.row === nr) { result.push(i); break; }
      }
    }
    return result;
  }

  moveToRoom(roomIndex: number): void {
    if (!this.floorData) return;
    if (roomIndex < 0 || roomIndex >= this.floorData.rooms.length) return;

    const adjacent = this.getAdjacentRoomIndices(this.currentRoomIndex);
    if (!adjacent.includes(roomIndex) && roomIndex !== this.currentRoomIndex) return;

    const prev = this.floorData.rooms[this.currentRoomIndex];
    if (prev.type !== 'start' && prev.type !== 'boss' && prev.type !== 'empty') {
      prev.type = 'empty';
    }
    prev.isCurrent = false;

    this.currentRoomIndex = roomIndex;
    const target = this.floorData.rooms[roomIndex];
    target.explored = true;
    target.isCurrent = true;

    this.callbacks.onRoomEntered(target.type);

    const stateMap: Partial<Record<string, GameState>> = {
      combat: 'battle',
      elite: 'battle',
      shop: 'shop',
      altar: 'altar',
      rest: 'rest_site',
      treasure: 'treasure_room',
      boss: 'battle',
    };
    this.callbacks.onStateChange(stateMap[target.type] ?? 'exploring');
  }

  moveToNextFloor(): void {
    this.currentFloor++;
    if (this.currentFloor > 3) {
      this.callbacks.onVictory();
      return;
    }
    this.generateFloor();
    this.callbacks.onStateChange('exploring');
  }

  update(_deltaTime: number): void {}
}
