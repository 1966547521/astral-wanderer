import { System } from '../ecs/System';
import { Game } from '../core/Game';
import { getEnemyById, getEnemyForFloor } from '../data/enemies';
import { ALL_SHARDS } from '../data/shards';
import { Random } from '../utils/Random';
import type { EnemyInstance, StatusEffectInstance, ShardDefinition } from '../types';

export class CombatSystem extends System {
  private game: Game;
  private enemies: EnemyInstance[] = [];
  private rng: Random;
  private turnCount: number = 0;
  private battleEnded: boolean = false;
  public selectedTarget: number = 0;
  public pendingLoot: ShardDefinition[] = [];
  public lootClaimed: boolean = false;

  constructor(game: Game) {
    super();
    this.game = game;
    this.rng = new Random();
  }

  get state() {
    return { enemies: this.enemies, turnCount: this.turnCount, battleEnded: this.battleEnded };
  }

  get aliveEnemies(): EnemyInstance[] {
    return this.enemies.filter(e => e.isAlive);
  }

  startBattle(roomType: string, floorNumber: number): void {
    const isBoss = roomType === 'boss';
    const isElite = roomType === 'elite';

    this.enemies = [];
    this.turnCount = 0;
    this.battleEnded = false;
    this.selectedTarget = 0;
    this.pendingLoot = [];
    this.lootClaimed = false;

    const pool = getEnemyForFloor(floorNumber, isBoss, isElite);
    const count = isBoss ? 1 : isElite ? 2 : this.rng.nextInt(1, 2);

    for (let i = 0; i < count; i++) {
      const tpl = this.rng.pick(pool);
      this.enemies.push({
        definitionId: tpl.id, currentHP: tpl.maxHP, maxHP: tpl.maxHP,
        currentShield: tpl.shield, intent: 'attack', intentStep: 0,
        intentDamage: tpl.damage, statuses: [], isAlive: true,
      });
    }

    this.applyArmorShieldBonus();
    this.game.player.currentAP = this.game.player.maxAP;
    this.updateEnemyIntents();
  }

  selectTarget(index: number): boolean {
    if (index < 0 || index >= this.enemies.length) return false;
    if (!this.enemies[index].isAlive) return false;
    this.selectedTarget = index;
    return true;
  }

  private updateEnemyIntents(): void {
    for (const en of this.enemies) {
      if (!en.isAlive) continue;
      const def = getEnemyById(en.definitionId);
      if (!def) continue;
      en.intent = def.intentPattern[en.intentStep % def.intentPattern.length];
      en.intentStep++;
      if (en.intent === 'attack') en.intentDamage = def.damage;
      else if (en.intent === 'charge') en.intentDamage = def.specialDamage ?? def.damage * 2;
      else en.intentDamage = 0;
    }
  }

  getEnemyIntentText(en: EnemyInstance): string {
    if (!en.isAlive) return '已击败';
    switch (en.intent) {
      case 'attack': return `攻击 ${en.intentDamage}`;
      case 'charge': return `蓄力 ${en.intentDamage}`;
      case 'defend': return '防御 +5盾';
      case 'heal': return '治疗 +10';
      case 'explode': return `自爆 ${en.intentDamage}`;
    }
  }

  hasPassive(effect: string): boolean {
    const eq = this.game.equippedShards;
    for (const s of Object.values(eq)) {
      if (s?.passiveEffect === effect) return true;
    }
    return false;
  }

  getDamageBonus(): number {
    return this.hasPassive('damage_bonus') ? 3 : 0;
  }

  useShard(slot: string, targetIdx: number): { success: boolean; message: string } {
    if (this.battleEnded) return { success: false, message: '战斗已结束。' };
    const player = this.game.player;
    const sh = this.game.equippedShards[slot as keyof typeof this.game.equippedShards];
    if (!sh) return { success: false, message: '该槽位没有装备碎片。' };
    if (sh.apCost > player.currentAP) return { success: false, message: 'AP 不足！' };
    const t = this.enemies[targetIdx];
    if (!t || !t.isAlive) return { success: false, message: '目标已死亡。' };

    player.currentAP -= sh.apCost;

    const isWeapon = slot === 'primary_weapon' || slot === 'secondary_weapon';
    const hasDamage = sh.damage !== undefined;
    const bonusDmg = hasDamage ? this.getDamageBonus() : 0;
    let dmg = hasDamage ? (sh.damage! + (isWeapon ? player.baseDamage + bonusDmg : 0)) : 0;

    let blocked = 0;
    if (dmg > 0 && t.currentShield > 0) {
      blocked = Math.min(t.currentShield, dmg);
      t.currentShield -= blocked;
      dmg -= blocked;
    }
    const finalDmg = dmg;
    if (finalDmg > 0) t.currentHP -= finalDmg;

    if (sh.statusOnHit && sh.statusDuration) {
      const exist = t.statuses.find(s => s.type === sh.statusOnHit);
      if (exist) exist.remainingTurns = sh.statusDuration;
      else t.statuses.push({ type: sh.statusOnHit!, remainingTurns: sh.statusDuration });
    }

    if (sh.healAmount) {
      player.currentHP = Math.min(player.maxHP, player.currentHP + sh.healAmount);
    }
    if (sh.shieldBonus) {
      player.currentShield = Math.min(30, player.currentShield + sh.shieldBonus);
    }

    if (hasDamage) {
      if (this.hasPassive('lifesteal')) {
        const heal = Math.ceil(finalDmg * 0.3);
        player.currentHP = Math.min(player.maxHP, player.currentHP + heal);
      }
    }

    if (!hasDamage && sh.passiveEffect) {
      this.activatePassive(sh.passiveEffect);
    }

    if (t.currentHP <= 0) {
      t.currentHP = 0; t.isAlive = false;
      if (this.selectedTarget === targetIdx) {
        const nx = this.aliveEnemies[0];
        if (nx) this.selectedTarget = this.enemies.indexOf(nx);
      }
    }

    if (hasDamage) {
      let msg = `${sh.name}: 造成 ${finalDmg} 伤`;
      if (blocked > 0) msg += ` (${blocked}被护盾吸收)`;
      if (this.hasPassive('lifesteal') && finalDmg > 0) msg += '  +吸血';
      return { success: true, message: msg };
    }
    if (sh.healAmount) return { success: true, message: `${sh.name}: 恢复 ${sh.healAmount} HP` };
    if (sh.shieldBonus) return { success: true, message: `${sh.name}: 获得 ${sh.shieldBonus} 护盾` };
    if (sh.passiveEffect === 'dodge') return { success: true, message: `${sh.name}: 进入闪避状态 (30%)` };
    return { success: true, message: `${sh.name}` };
  }

  private activatePassive(effect: string): void {
    switch (effect) {
      case 'dodge':
        break;
    }
  }

  private applyArmorShieldBonus(): void {
    const eq = this.game.equippedShards;
    let totalShield = 0;
    for (const s of Object.values(eq)) {
      if (s?.shieldBonus) totalShield += s.shieldBonus;
    }
    if (totalShield > 0) {
      this.game.player.currentShield = Math.min(30, this.game.player.currentShield + totalShield);
    }
  }

  endPlayerTurn(): void {
    if (this.battleEnded) return;
    const p = this.game.player;
    if (p.currentAP > 0) { p.currentShield += p.currentAP * 3; p.currentShield = Math.min(p.currentShield, 30); }
    this.executeEnemyActions();
    this.applyArmorShieldBonus();
    this.updateEnemyIntents();
    this.checkBattleEnd();
    const maxAP = 3 + (this.hasPassive('extra_ap') ? 1 : 0);
    p.maxAP = maxAP;
    p.currentAP = maxAP;
    this.turnCount++;
  }

  private executeEnemyActions(): void {
    const p = this.game.player;
    const hasDodge = this.hasPassive('dodge');

    for (const en of this.enemies) {
      if (!en.isAlive) continue;
      const fr = en.statuses.find(s => s.type === 'freeze');
      if (fr && fr.remainingTurns > 0) { fr.remainingTurns--; if (fr.remainingTurns <= 0) en.statuses = en.statuses.filter(s => s !== fr); this.tickBurns(en); continue; }

      switch (en.intent) {
        case 'attack': {
          if (hasDodge && this.rng.chance(0.3)) break;
          let d = en.intentDamage; if (p.currentShield > 0) { const a = Math.min(p.currentShield, d); p.currentShield -= a; d -= a; } p.currentHP -= Math.max(0, d); break;
        }
        case 'charge': break;
        case 'defend': en.currentShield += 5; break;
        case 'heal': en.currentHP = Math.min(en.maxHP, en.currentHP + 10); break;
        case 'explode': {
          if (hasDodge && this.rng.chance(0.3)) { en.currentHP = 0; en.isAlive = false; break; }
          let d = en.intentDamage; if (p.currentShield > 0) { const a = Math.min(p.currentShield, d); p.currentShield -= a; d -= a; } p.currentHP -= Math.max(0, d); en.currentHP = 0; en.isAlive = false; break;
        }
      }
      this.tickBurns(en);
    }
  }

  private tickBurns(en: EnemyInstance): void {
    if (!en.isAlive) return;
    const ns: StatusEffectInstance[] = [];
    for (const st of en.statuses) {
      if (st.type === 'burn') en.currentHP -= Math.ceil(en.maxHP * 0.05);
      else if (st.type === 'poison') en.currentHP -= Math.ceil(en.maxHP * 0.08);
      st.remainingTurns--;
      if (st.remainingTurns > 0) ns.push(st);
    }
    en.statuses = ns;
    if (en.currentHP <= 0) { en.currentHP = 0; en.isAlive = false; }
  }

  private generateLoot(roomType: string): ShardDefinition[] {
    const isBoss = roomType === 'boss';
    const isElite = roomType === 'elite';
    const count = isBoss ? 4 : isElite ? 3 : 3;

    const weights: Record<string, number> = isBoss
      ? { common: 0.05, rare: 0.30, epic: 0.40, legendary: 0.25 }
      : isElite
      ? { common: 0.20, rare: 0.40, epic: 0.30, legendary: 0.10 }
      : { common: 0.45, rare: 0.35, epic: 0.17, legendary: 0.03 };

    const pool = ALL_SHARDS.filter(s => {
      if (isBoss && s.rarity === 'common') return false;
      return true;
    });

    const result: ShardDefinition[] = [];
    const used = new Set<string>();
    for (let i = 0; i < count; i++) {
      const roll = this.rng.next();
      let tier: string;
      if (roll < weights.common) tier = 'common';
      else if (roll < weights.common + weights.rare) tier = 'rare';
      else if (roll < weights.common + weights.rare + weights.epic) tier = 'epic';
      else tier = 'legendary';

      const candidates = pool.filter(s => s.rarity === tier && !used.has(s.id));
      const pick = candidates.length > 0 ? this.rng.pick(candidates) : this.rng.pick(pool.filter(s => !used.has(s.id)));
      if (pick) { result.push(pick); used.add(pick.id); }
    }
    return result;
  }

  private checkBattleEnd(): void {
    const allDead = this.enemies.every(e => !e.isAlive);
    if (allDead) {
      this.battleEnded = true;
      const room = this.game.dungeonSystem?.floorData?.rooms[this.game.dungeonSystem.currentRoomIndex];
      if (room?.type !== 'boss') {
        this.pendingLoot = this.generateLoot(room?.type ?? 'combat');
        this.lootClaimed = false;
      } else {
        this.game.dungeonSystem?.moveToNextFloor();
      }
      return;
    }
    if (this.game.player.currentHP <= 0) {
      this.game.player.currentHP = 0;
      this.battleEnded = true;
      this.game.endRun(false);
    }
  }

  claimLoot(index: number): ShardDefinition | null {
    if (index < 0 || index >= this.pendingLoot.length) return null;
    const shard = this.pendingLoot[index];
    this.lootClaimed = true;

    const equip = this.game.equippedShards;
    if (shard.slot === 'primary_weapon') equip.primary_weapon = shard;
    else if (shard.slot === 'secondary_weapon') equip.secondary_weapon = shard;
    else if (shard.slot === 'armor') equip.armor = shard;
    else if (shard.slot === 'accessory1') equip.accessory1 = shard;
    else if (shard.slot === 'accessory2') equip.accessory2 = shard;
    else if (shard.slot === 'resonator') equip.resonator = shard;

    if (shard.hpBonus) this.game.player.maxHP += shard.hpBonus;
    if (shard.passiveEffect === 'extra_ap') this.game.player.maxAP += 1;

    return shard;
  }

  update(_dt: number): void {}
}
