import type { Game } from '../core/Game';
import { getShardsByRarity, ALL_SHARDS } from './shards';
import { Random } from '../utils/Random';

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  options: EventOption[];
}

export interface EventOption {
  text: string;
  action: (game: Game, rng: Random) => EventResult;
}

export interface EventResult {
  message: string;
  hpChange?: number;
  stardustChange?: number;
  shardReward?: string;
  statusEffect?: string;
}

export const ALL_EVENTS: GameEvent[] = [
  {
    id: 'wandering_merchant',
    title: '流浪商人',
    description:
      '一个穿着破旧斗篷的人影在虚空中招手。他的货架上摆放着几件闪烁的物品。"来瞧瞧吧，旅者！用星尘换些有用的东西。"',
    options: [
      {
        text: '花费 60 星尘购买稀有碎片',
        action: (game, rng) => {
          if (game.player.stardust < 60) {
            return { message: '星尘不足！', stardustChange: 0 };
          }
          const rare = getShardsByRarity('rare');
          const shard = rng.pick(rare);
          return { message: `获得了 ${shard.name}！`, stardustChange: -60, shardReward: shard.id };
        },
      },
      {
        text: '威胁商人（概率获得物品或触发战斗）',
        action: (game, rng) => {
          if (rng.chance(0.4)) {
            const shard = rng.pick(ALL_SHARDS);
            return { message: `商人慌忙交出物品——获得了 ${shard.name}！`, shardReward: shard.id };
          }
          return { message: '商人大怒，召唤护卫！进入强制战斗。', hpChange: -10 };
        },
      },
      {
        text: '离开',
        action: () => ({ message: '你礼貌地离开了。' }),
      },
    ],
  },
  {
    id: 'ancient_altar',
    title: '古老祭坛',
    description:
      '一座刻满星网符文的高耸祭坛静静矗立。祭坛中央的凹陷处似乎在等待献祭。',
    options: [
      {
        text: '献祭 15 HP 换取随机增益',
        action: (game, rng) => {
          if (game.player.currentHP <= 15) {
            return { message: '生命值不足以献祭！' };
          }
          const bonuses = [
            { message: '星核闪耀——HP 上限 +10！', hpChange: -5 },
            { message: '力量涌入——攻击力永久 +3！', hpChange: -15 },
            { message: '护甲强韧——获得 20 点护盾！', hpChange: -15 },
          ];
          const result = rng.pick(bonuses);
          return result;
        },
      },
      {
        text: '献祭一个碎片换取传说碎片',
        action: (game, rng) => {
          const legendary = getShardsByRarity('legendary');
          const shard = rng.pick(legendary);
          return { message: `祭坛发出耀眼光芒——获得了传说碎片 ${shard.name}！`, shardReward: shard.id };
        },
      },
      {
        text: '离开',
        action: () => ({ message: '你决定不打扰这座古老的祭坛。' }),
      },
    ],
  },
  {
    id: 'void_rift',
    title: '虚空裂缝',
    description: '一道不稳定裂缝悬浮在半空，内部传来奇异的低语。跳入或许可以传送到别处——也可能遇到危险。',
    options: [
      {
        text: '跳入裂缝（随机传送）',
        action: (game, rng) => {
          return { message: '你被传送到了本层的另一个房间！' };
        },
      },
      {
        text: '投入 30 星尘（概率获得奖励）',
        action: (game, rng) => {
          if (game.player.stardust < 30) {
            return { message: '星尘不足！' };
          }
          if (rng.chance(0.6)) {
            const shard = rng.pick(ALL_SHARDS);
            return { message: `裂缝吐出物品——获得了 ${shard.name}！`, stardustChange: -30, shardReward: shard.id };
          }
          return { message: '裂缝吞没了星尘，什么也没发生……', stardustChange: -30 };
        },
      },
      {
        text: '绕路',
        action: () => ({ message: '你谨慎地绕着裂缝走。' }),
      },
    ],
  },
  {
    id: 'wreckage_log',
    title: '残骸中的日志',
    description:
      '你发现了一具旅者的残骸，手中紧握着一本快要碎裂的日志。',
    options: [
      {
        text: '阅读日志（获得永久属性 +5 HP 上限）',
        action: (game) => {
          game.player.maxHP += 5;
          return { message: '日志中记载了星网的秘密——你感到更强韧了。HP 上限 +5！' };
        },
      },
      {
        text: '搜刮残骸（获得 40 星尘）',
        action: () => ({ message: '从残骸中找到了 40 星尘。', stardustChange: 40 }),
      },
      {
        text: '无视',
        action: () => ({ message: '你选择不打扰死者的安眠。' }),
      },
    ],
  },
  {
    id: 'mysterious_crystal',
    title: '神秘水晶',
    description:
      '一颗悬浮的黑色水晶散发着不稳定的能量。触碰它可能获得强大的力量，也可能被诅咒。',
    options: [
      {
        text: '注入 50 星尘——随机强化或诅咒',
        action: (game, rng) => {
          if (game.player.stardust < 50) {
            return { message: '星尘不足！' };
          }
          if (rng.chance(0.5)) {
            game.player.baseDamage += 5;
            return { message: '水晶发出温和光芒——攻击力永久 +5！', stardustChange: -50 };
          }
          return { message: '水晶爆发出黑暗能量，你感到虚弱……受到 10 点伤害。', stardustChange: -50, hpChange: -10 };
        },
      },
      {
        text: '打碎水晶（获得 80 星尘）',
        action: () => ({ message: '水晶碎裂，星尘散落一地。获得 80 星尘！', stardustChange: 80 }),
      },
      {
        text: '无视',
        action: () => ({ message: '你绕过了这颗不祥的水晶。' }),
      },
    ],
  },
];
