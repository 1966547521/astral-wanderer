import type { EnemyDefinition } from '../types';

export const ALL_ENEMIES: EnemyDefinition[] = [
  {
    id: 'void_spawn',
    name: '虚空幼体',
    aiType: 'attacker',
    maxHP: 35,
    damage: 8,
    shield: 0,
    intentPattern: ['attack', 'attack', 'charge'],
    specialDamage: 16,
    description: '星网裂缝中诞生的畸形生物，只会本能地攻击。',
  },
  {
    id: 'crystal_sentry',
    name: '水晶哨卫',
    aiType: 'defender',
    maxHP: 50,
    damage: 6,
    shield: 10,
    intentPattern: ['defend', 'defend', 'attack'],
    description: '远古文明留下的自动防御体，优先构筑防御。',
  },
  {
    id: 'void_weaver',
    name: '虚空织网者',
    aiType: 'caster',
    maxHP: 40,
    damage: 7,
    shield: 0,
    intentPattern: ['defend', 'attack', 'attack'],
    description: '能操控虚空能量的施法者，会为同伴提供增益。',
  },
  {
    id: 'silence_hound',
    name: '寂灭猎犬',
    aiType: 'berserker',
    maxHP: 55,
    damage: 10,
    shield: 0,
    intentPattern: ['charge', 'attack', 'defend'],
    specialDamage: 25,
    description: '被寂灭扭曲的猎食者，蓄力后释放毁灭性打击。',
  },
  {
    id: 'star_devourer',
    name: '噬星者',
    aiType: 'berserker',
    maxHP: 200,
    damage: 20,
    shield: 10,
    intentPattern: ['defend', 'charge', 'attack', 'attack'],
    specialDamage: 35,
    description: '第一层的守护者，以恒星残骸为食的巨兽。',
  },
  {
    id: 'flesh_amalgam',
    name: '血肉聚合体',
    aiType: 'attacker',
    maxHP: 65,
    damage: 14,
    shield: 5,
    intentPattern: ['attack', 'attack', 'attack', 'charge'],
    specialDamage: 28,
    description: '无数生物在寂灭中融合成的恐怖形态。',
  },
  {
    id: 'void_knight',
    name: '虚空骑士',
    aiType: 'defender',
    maxHP: 80,
    damage: 12,
    shield: 15,
    intentPattern: ['defend', 'attack', 'charge'],
    specialDamage: 24,
    description: '被寂灭转化的远古战士，拥有惊人的防御力。',
  },
  {
    id: 'abyss_lord',
    name: '深渊领主',
    aiType: 'caster',
    maxHP: 280,
    damage: 18,
    shield: 15,
    intentPattern: ['attack', 'defend', 'charge', 'attack'],
    specialDamage: 40,
    description: '第二层的守护者，掌控异化深渊的扭曲存在。',
  },
  {
    id: 'heart_of_silence',
    name: '静默之心',
    aiType: 'berserker',
    maxHP: 400,
    damage: 25,
    shield: 20,
    intentPattern: ['defend', 'attack', 'charge', 'attack', 'attack'],
    specialDamage: 50,
    description: '寂灭的源头——一个渴望"绝对宁静"的远古意识。',
  },
];

export function getEnemyById(id: string): EnemyDefinition | undefined {
  return ALL_ENEMIES.find((e) => e.id === id);
}

export function getEnemyForFloor(floor: number, isBoss: boolean, isElite: boolean): EnemyDefinition[] {
  const enemies = ALL_ENEMIES.filter((e) => {
    if (isBoss) {
      if (floor === 1) return e.id === 'star_devourer';
      if (floor === 2) return e.id === 'abyss_lord';
      return e.id === 'heart_of_silence';
    }
    return (
      e.id !== 'star_devourer' &&
      e.id !== 'abyss_lord' &&
      e.id !== 'heart_of_silence'
    );
  });
  return enemies;
}
