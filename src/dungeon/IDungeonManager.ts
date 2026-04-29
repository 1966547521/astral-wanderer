import type { Direction, FloorData, GameState } from '../types';

export interface DungeonSystemCallbacks {
  onStateChange: (state: GameState) => void;
  onRoomEntered: (roomType: string) => void;
  onVictory: () => void;
}

export interface IDungeonManager {
  readonly currentRoomIndex: number;
  readonly floorData: FloorData | null;
  readonly currentFloor: number;
  getAdjacentIndex(currentIdx: number, dir: Direction): number;
  getAdjacentRoomIndices(index: number): number[];
  moveToRoom(index: number): void;
  moveToNextFloor(): void;
  generateFloor(): void;
}
