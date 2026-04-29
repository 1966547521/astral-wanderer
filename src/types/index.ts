export type DamageType = 'physical' | 'fire' | 'ice' | 'shadow' | 'resonance';

export type ShardRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type ShardSlot = 'primary_weapon' | 'secondary_weapon' | 'armor' | 'accessory1' | 'accessory2' | 'resonator';

export type ShardTag = 'fire' | 'ice' | 'shadow' | 'resonance';

export type EnemyAIType = 'attacker' | 'defender' | 'caster' | 'berserker' | 'swarm';

export type EnemyIntent = 'attack' | 'charge' | 'defend' | 'heal' | 'explode';

export type RoomType =
  | 'start'
  | 'combat'
  | 'elite'
  | 'shop'
  | 'altar'
  | 'rest'
  | 'treasure'
  | 'boss'
  | 'empty';

export type GameState =
  | 'main_menu'
  | 'character_select'
  | 'exploring'
  | 'battle'
  | 'event'
  | 'shop'
  | 'altar'
  | 'rest_site'
  | 'treasure_room'
  | 'game_over'
  | 'victory';

export type StatusEffectType =
  | 'burn'
  | 'freeze'
  | 'slow'
  | 'poison'
  | 'shield'
  | 'strength'
  | 'vulnerable'
  | 'dodge';

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface ShardDefinition {
  id: string;
  name: string;
  rarity: ShardRarity;
  slot: ShardSlot;
  tags: ShardTag[];
  apCost: number;
  description: string;
  damage?: number;
  damageType?: DamageType;
  hpBonus?: number;
  shieldBonus?: number;
  statusOnHit?: StatusEffectType;
  statusDuration?: number;
  healAmount?: number;
  passiveEffect?: string;
}

export interface EnemyDefinition {
  id: string;
  name: string;
  aiType: EnemyAIType;
  maxHP: number;
  damage: number;
  shield: number;
  intentPattern: EnemyIntent[];
  specialDamage?: number;
  description: string;
}

export interface EnemyInstance {
  definitionId: string;
  currentHP: number;
  maxHP: number;
  currentShield: number;
  intent: EnemyIntent;
  intentStep: number;
  intentDamage: number;
  statuses: StatusEffectInstance[];
  isAlive: boolean;
}

export interface StatusEffectInstance {
  type: StatusEffectType;
  remainingTurns: number;
  value?: number;
}

export interface PlayerStats {
  maxHP: number;
  currentHP: number;
  currentShield: number;
  maxAP: number;
  currentAP: number;
  baseDamage: number;
  stardust: number;
}

export interface EquippedShards {
  primary_weapon: ShardDefinition | null;
  secondary_weapon: ShardDefinition | null;
  armor: ShardDefinition | null;
  accessory1: ShardDefinition | null;
  accessory2: ShardDefinition | null;
  resonator: ShardDefinition | null;
}

export interface Room {
  col: number;
  row: number;
  type: RoomType;
  explored: boolean;
  isCurrent: boolean;
}

export interface FloorData {
  rooms: Room[];
  cols: number;
  rows: number;
  startIndex: number;
  bossIndex: number;
  floorNumber: number;
  theme: string;
}

export interface InitMessage {
  type: 'init';
  payload: { timestamp: number; message: string };
}
