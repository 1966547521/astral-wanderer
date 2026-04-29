export interface CharacterData {
  id: string;
  name: string;
  description: string;
  maxHP: number;
  initialShield: number;
  baseDamage: number;
  initialShardId: string;
}

export const ALL_CHARACTERS: CharacterData[] = [
  {
    id: 'flame_wanderer',
    name: '焰心旅者',
    description: '来自一颗被恒星吞噬的星球，愤怒的火焰在他体内燃烧。',
    maxHP: 90,
    initialShield: 0,
    baseDamage: 12,
    initialShardId: 'flame_strike',
  },
  {
    id: 'frost_wanderer',
    name: '霜语旅者',
    description: '曾是星网维护者，寂灭后失去了所有同僚，只剩冷静的理智。',
    maxHP: 80,
    initialShield: 20,
    baseDamage: 10,
    initialShardId: 'ice_barrier',
  },
  {
    id: 'shadow_wanderer',
    name: '影织旅者',
    description: '在虚空暗面中游走的流浪者，擅长躲避与致命一击。',
    maxHP: 70,
    initialShield: 0,
    baseDamage: 13,
    initialShardId: 'shadow_step',
  },
  {
    id: 'resonance_wanderer',
    name: '共鸣旅者',
    description: '能与残留在虚空中的古老意识对话的神秘存在。',
    maxHP: 80,
    initialShield: 0,
    baseDamage: 10,
    initialShardId: 'void_resonance',
  },
];

export function getCharacterById(id: string): CharacterData | undefined {
  return ALL_CHARACTERS.find((c) => c.id === id);
}
