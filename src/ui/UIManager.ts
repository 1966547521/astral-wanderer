import { Game } from '../core/Game';
import type { CombatSystem } from '../systems/CombatSystem';
import type { IDungeonManager } from '../dungeon/IDungeonManager';
import type { ShardDefinition } from '../types';
import { ALL_CHARACTERS, type CharacterData } from '../data/characters';
import { getShardById } from '../data/shards';
import { Random } from '../utils/Random';

const C = {
  accent: '#e0c050', accentBright: '#f0d870',
  text: '#d0d0e0', textDim: '#8888a0',
  hpGreen: '#44cc66', hpYellow: '#ddaa30', hpRed: '#e04040',
  apGold: '#ffc830', shield: '#4499dd',
  btn: '#282850', btnBorder: '#c0a040',
  danger: '#e04040', rare: '#5599dd', epic: '#aa55dd', legendary: '#f0a030',
  current: '#e8c050', selected: '#ff6644', nav: '#50ff70',
};

const L = {
  TOP_H: 70, BOT_H: 32, PAD: 20,
  CARD_W: 170, CARD_H: 280, CARD_GAP: 24,
  CELL_W: 108, CELL_H: 78, GAP: 6,
} as const;

interface ClickTarget { x: number; y: number; w: number; h: number; action: () => void; }

function rColor(r: string): string {
  if (r === 'rare') return C.rare; if (r === 'epic') return C.epic;
  if (r === 'legendary') return C.legendary; return C.textDim;
}

export class UIManager {
  private g: Game; private rng: Random;
  private msg = ''; private clicks: ClickTarget[] = [];
  public showInventory = false;

  constructor(private game: Game) {
    this.g = game; this.rng = new Random();
    const cvs = this.g.renderer.context.canvas;
    cvs.addEventListener('click', (e: MouseEvent) => {
      const rect = cvs.getBoundingClientRect();
      const sx = cvs.width / rect.width, sy = cvs.height / rect.height;
      const cx = (e.clientX - rect.left) * sx, cy = (e.clientY - rect.top) * sy;
      for (let i = this.clicks.length - 1; i >= 0; i--) {
        const t = this.clicks[i];
        if (cx >= t.x && cx <= t.x + t.w && cy >= t.y && cy <= t.y + t.h) { t.action(); return; }
      }
    });
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') { const s = this.g.stateMachine.getCurrentState(); if (s === 'exploring' || s === 'battle') this.g.stateMachine.setState('main_menu'); }
      if (e.key === 'i' || e.key === 'I') this.showInventory = !this.showInventory;
      if ((e.key === 'e' || e.key === 'E') && this.ct && !this.ct.state.battleEnded) { if (this.g.stateMachine.getCurrentState() === 'battle') { this.ct.endPlayerTurn(); this.msg = ''; } }
      if (e.key === 'ArrowUp' || e.key === 'w') this.move('up');
      if (e.key === 'ArrowDown' || e.key === 's') this.move('down');
      if (e.key === 'ArrowLeft' || e.key === 'a') this.move('left');
      if (e.key === 'ArrowRight' || e.key === 'd') this.move('right');
    });
  }

  private move(dir: 'up'|'down'|'left'|'right'): void {
    if (this.g.stateMachine.getCurrentState() !== 'exploring') return;
    const d = this.d; if (!d) return;
    const a = d.getAdjacentIndex(d.currentRoomIndex, dir);
    if (a >= 0) d.moveToRoom(a);
  }

  private begin(): void { this.clicks = []; }
  private get R() { return this.g.renderer; }
  private get W(): number { return this.R.context.canvas.width; }
  private get H(): number { return this.R.context.canvas.height; }
  private get d(): IDungeonManager | null { return this.g.dungeonSystem; }
  private get ct(): CombatSystem | null { return this.g.combatSystem; }
  private tTop(): number { return L.TOP_H; }
  private tBot(): number { return this.H - L.BOT_H; }
  private tH(): number { return this.tBot() - this.tTop(); }

  private btn(text: string, x: number, y: number, bw: number, bh: number, action: () => void, accent = true): void {
    const c = accent ? C.btnBorder : C.textDim;
    this.R.drawRoundedRect(x, y, bw, bh, 5, C.btn, 0.9);
    this.R.drawRoundedOutline(x, y, bw, bh, 5, c);
    this.R.drawText(text, x + bw / 2, y + bh / 2 - 7, c, 13, 'center');
    this.clicks.push({ x, y, w: bw, h: bh, action });
  }

  private topBar(showFloor: boolean): void {
    const p = this.g.player;
    this.R.drawRect(0, 0, this.W, L.TOP_H, 'rgba(18,18,38,0.7)', 1);
    this.R.drawHPBar(L.PAD, 6, 240, 20, p.currentHP, p.maxHP);
    this.R.drawShieldBar(L.PAD, 30, 240, p.currentShield);
    this.R.drawAP(L.PAD, 44, p.currentAP, p.maxAP);
    this.R.drawText(`★ ${p.stardust}`, L.PAD + 80, 46, C.accent, 12);
    if (showFloor && (this.d?.currentFloor ?? 0) > 0) {
      this.R.drawTextBold(`${this.d?.currentFloor ?? 0}F`, this.W - L.PAD, 6, C.accent, 16, 'right');
      if (this.d?.floorData) this.R.drawText(this.d.floorData.theme, this.W - L.PAD, 26, C.textDim, 11, 'right');
    }
  }

  renderMainMenu(): void {
    this.begin();
    const W = this.W, H = this.H, tY = H * 0.14;
    this.R.drawTextBold('✦ 星 界 旅 者 ✦', W / 2, tY, C.accentBright, 42, 'center');
    this.R.drawText('A S T R A L   W A N D E R E R', W / 2, tY + 48, C.textDim, 13, 'center');
    this.R.drawRect(W / 2 - 140, tY + 68, 280, 1, 'rgba(200,160,80,0.25)', 1);
    this.R.drawText('回合制  Roguelite  地牢探险', W / 2, tY + 80, C.text, 14, 'center');
    this.btn('开 始 新 旅 程', W / 2 - 120, H * 0.44, 240, 50, () => this.g.stateMachine.setState('character_select'));
    this.R.drawText(`${this.g.runNumber} 次旅程  |  ${this.g.temporalCrystals} 结晶`, W / 2, H * 0.58, C.textDim, 12, 'center');
    this.R.drawText('WASD/方向键移动  ·  I 背包  ·  点击碎片攻击', W / 2, H * 0.70, '#555', 11, 'center');
  }

  renderCharacterSelect(): void {
    this.begin();
    const W = this.W, H = this.H;
    this.R.drawTextBold('选 择 旅 者', W / 2, 22, C.accent, 22, 'center');
    const tw = ALL_CHARACTERS.length * L.CARD_W + (ALL_CHARACTERS.length - 1) * L.CARD_GAP;
    const sx = (W - tw) / 2;
    ALL_CHARACTERS.forEach((ch, i) => this.charCard(ch, sx + i * (L.CARD_W + L.CARD_GAP), 60, () => this.selectChar(ch)));
    this.R.drawText('点击角色卡牌开始旅程', W / 2, H - 42, C.textDim, 11, 'center');
  }

  private charCard(ch: CharacterData, x: number, y: number, action: () => void): void {
    const w = L.CARD_W, h = L.CARD_H, p = 14;
    this.R.drawRoundedRect(x, y, w, h, 8, 'rgba(22,24,44,0.9)', 1);
    this.R.drawRoundedOutline(x, y, w, h, 8, 'rgba(55,55,90,0.6)');
    let ly = y + p;
    this.R.drawTextBold(ch.name, x + w / 2, ly, C.accent, 15, 'center'); ly += 26;
    for (const ln of this.wrap(ch.description, w - p * 2, 10)) { this.R.drawText(ln, x + p, ly, C.textDim, 10); ly += 14; }
    ly += 6; this.R.drawRect(x + p, ly, w - p * 2, 1, 'rgba(50,50,80,0.4)', 1); ly += 10;
    this.R.drawText(`HP ${ch.maxHP}`, x + p, ly, C.hpGreen, 12); ly += 20;
    this.R.drawText(`盾 ${ch.initialShield}`, x + p, ly, C.shield, 12); ly += 20;
    this.R.drawText(`攻 ${ch.baseDamage}`, x + p, ly, C.apGold, 12); ly += 20;
    const sh = getShardById(ch.initialShardId);
    if (sh) { this.R.drawText('初始碎片', x + p, ly, C.textDim, 9); ly += 13; this.R.drawText(sh.name, x + p, ly, rColor(sh.rarity), 10); }
    this.R.drawPlayerCharacter(x + w / 2, y + h - 68, 0.55, C.accent);
    this.btn('选 择', x + w / 2 - 35, y + h - 38, 70, 28, action);
  }

  private selectChar(ch: CharacterData): void {
    this.showInventory = false;
    this.g.currentCharacter = ch.id;
    this.g.player.maxHP = ch.maxHP; this.g.player.currentHP = ch.maxHP;
    this.g.player.currentShield = ch.initialShield; this.g.player.baseDamage = ch.baseDamage;
    this.g.startRun();
  }

  renderBattle(): void {
    this.begin();
    const W = this.W; const combat = this.ct; if (!combat) return;
    const st = combat.state;
    this.topBar(true);

    const eTop = this.tTop() + 4, eH = 170;
    this.R.drawPanel(L.PAD, eTop, W - L.PAD * 2, eH, `敌 人 (${combat.aliveEnemies.length}/${st.enemies.length})`, C.danger);

    combat.aliveEnemies.forEach((en) => {
      const ri = st.enemies.indexOf(en), ey = eTop + 36 + ri * 46;
      const sel = ri === combat.selectedTarget;
      this.R.drawRoundedRect(L.PAD + 12, ey - 1, W - L.PAD * 2 - 24, 42, 4, sel ? 'rgba(50,15,15,0.5)' : 'transparent', 1);
      if (sel) { this.R.drawRoundedOutline(L.PAD + 12, ey - 1, W - L.PAD * 2 - 24, 42, 4, C.selected, 2); this.R.drawText('▸', L.PAD + 16, ey + 12, C.selected, 14); }
      this.R.drawEnemyShape(L.PAD + 62, ey + 19, 0.55, false, false);
      this.R.drawTextBold(en.definitionId, L.PAD + 102, ey + 2, C.danger, 13);
      this.R.drawHPBar(L.PAD + 102, ey + 20, 190, 14, en.currentHP, en.maxHP);
      if (en.currentShield > 0) this.R.drawShieldBar(L.PAD + 102, ey + 38, 190, en.currentShield);
      this.R.drawText(`意图: ${combat.getEnemyIntentText(en)}`, L.PAD + 300, ey + 22, '#e09040', 11);
      if (!st.battleEnded) this.clicks.push({ x: L.PAD + 12, y: ey - 1, w: W - L.PAD * 2 - 24, h: 42, action: () => combat.selectTarget(ri) });
    });

    if (st.battleEnded) {
      if (combat.pendingLoot.length > 0 && !combat.lootClaimed) {
        this.renderLootSelect(combat, eTop, eH);
      } else if (combat.lootClaimed || combat.pendingLoot.length === 0) {
        const bw = 280, bh = 150, bx = (W - bw) / 2, by = this.tTop() + (this.tH() - bh) / 2;
        this.R.drawOverlayPanel(bx, by, bw, bh, C.accent);
        this.R.drawTextBold('✦ 胜 利 ✦', W / 2, by + 28, C.accentBright, 28, 'center');
        this.R.drawText('房间已被清空', W / 2, by + 66, C.text, 14, 'center');
        this.btn('继 续', W / 2 - 45, by + 100, 90, 36, () => this.g.stateMachine.setState('exploring'));
      }
      return;
    }

    const aTop = eTop + eH + 8;
    const weaponSlots: string[] = ['primary_weapon', 'secondary_weapon'];
    const weapons = weaponSlots
      .map(slot => [slot, this.g.equippedShards[slot as keyof typeof this.g.equippedShards]])
      .filter(([, s]) => s !== null) as [string, ShardDefinition][];
    const passives = Object.entries(this.g.equippedShards)
      .filter(([slot, s]) => s !== null && !weaponSlots.includes(slot)) as [string, ShardDefinition][];

    const weaponRowY = aTop + 4;
    const weaponH = 50;

    if (weapons.length > 0) {
      this.R.drawTextBold('武器:', L.PAD + 4, weaponRowY - 2, C.accent, 12);
      weapons.forEach(([slot, sh], i) => {
        const sx = L.PAD + 48 + i * 148;
        const dis = this.g.player.currentAP < sh.apCost;
        this.R.drawShardCard(sx, weaponRowY, 140, weaponH, sh.name, sh.apCost, shardBrief(sh), rColor(sh.rarity), dis);
        if (!dis) this.clicks.push({ x: sx, y: weaponRowY, w: 140, h: weaponH, action: () => { this.msg = combat.useShard(slot, combat.selectedTarget).message; } });
      });
    }

    this.btn('E 结束回合', W - L.PAD - 150, weaponRowY + 4, 140, 40, () => { combat.endPlayerTurn(); this.msg = ''; });

    const passivesY = weaponRowY + weaponH + 8;
    if (passives.length > 0) {
      let pxBox = L.PAD + 4;
      for (const [, sh] of passives) {
        const label = `${slotLabel(sh.slot)}: ${sh.name}`;
        const tw = this.R.context.measureText(label).width + 24;
        const bw = Math.max(80, tw);
        this.R.drawRoundedRect(pxBox, passivesY, bw, 26, 4, 'rgba(35,35,60,0.88)', 1);
        this.R.drawRoundedOutline(pxBox, passivesY, bw, 26, 4, rColor(sh.rarity), 1);
        this.R.drawText(label, pxBox + bw / 2, passivesY + 6, rColor(sh.rarity), 10, 'center');
        pxBox += bw + 6;
      }
    }

    const hintY = passivesY + 32;
    if (!this.msg && combat.aliveEnemies.length > 0 && this.g.player.currentAP > 0)
      this.R.drawText(`${combat.aliveEnemies.length > 1 ? '点击敌人切换目标 · ' : ''}选择武器攻击`, W / 2, hintY, C.textDim, 11, 'center');
    if (this.msg) this.R.drawText(this.msg, W / 2, this.H - L.BOT_H + 6, C.accent, 11, 'center');
  }

  private renderLootSelect(combat: CombatSystem, _eTop: number, _eH: number): void {
    const W = this.W;
    const pw = Math.min(620, W - 40), ph = 240;
    const px = (W - pw) / 2, py = this.tTop() + (this.tH() - ph) / 2;
    this.R.drawOverlayPanel(px, py, pw, ph, C.accent);
    this.R.drawTextBold('✦  战 利 品  —  选择一件碎片  ✦', W / 2, py + 16, C.accentBright, 18, 'center');
    this.R.drawRect(px + 20, py + 42, pw - 40, 1, 'rgba(200,160,80,0.3)', 1);

    const loot = combat.pendingLoot;
    const cardW = (pw - 60) / loot.length;
    loot.forEach((sh, i) => {
      const cx = px + 20 + i * (cardW + 8) + 4;
      const cy = py + 54, cw = cardW - 8, ch = 140;
      this.R.drawRoundedRect(cx, cy, cw, ch, 6, '#222240', 0.95);
      this.R.drawRoundedOutline(cx, cy, cw, ch, 6, rColor(sh.rarity), 1.5);
      this.R.drawTextBold(sh.name, cx + cw / 2, cy + 8, rColor(sh.rarity), 13, 'center');

      const tags: Record<string, string> = {
        primary_weapon: '主武器', secondary_weapon: '副武器', armor: '护甲',
        accessory1: '饰品', accessory2: '饰品', resonator: '共鸣器',
      };
      this.R.drawText(tags[sh.slot] ?? sh.slot, cx + cw / 2, cy + 30, C.textDim, 10, 'center');
      this.R.drawText(`AP ${sh.apCost}`, cx + cw / 2, cy + 46, C.apGold, 10, 'center');
      this.R.drawText(sh.description, cx + cw / 2, cy + 64, C.textDim, 9, 'center');

      const rarLabel: Record<string, string> = { common: '普通', rare: '稀有', epic: '史诗', legendary: '传说' };
      this.R.drawText(rarLabel[sh.rarity] ?? '', cx + cw / 2, cy + 86, rColor(sh.rarity), 10, 'center');

      this.clicks.push({ x: cx, y: cy, w: cw, h: ch, action: () => {
        const claimed = combat.claimLoot(i);
        if (claimed) this.msg = `获得 ${claimed.name}！已装备到 ${tags[claimed.slot] ?? claimed.slot}`;
      }});
    });

    this.R.drawText('点击碎片卡牌选择', W / 2, py + 208, C.textDim, 10, 'center');
    this.btn('跳 过 (不选择)', W / 2 - 55, py + 214, 110, 26, () => { combat.lootClaimed = true; }, false);
  }

  renderMap(): void {
    this.begin();
    const W = this.W;
    const dungeon = this.d;
    if (!dungeon || !dungeon.floorData) return;
    const fl = dungeon.floorData;

    this.topBar(true);

    const curIdx = dungeon.currentRoomIndex;
    const adjSet = new Set(dungeon.getAdjacentRoomIndices(curIdx));

    const mX = L.PAD + 4, mY = this.tTop() + 4;
    const mW = W - L.PAD * 2 - 8;
    const mH = this.tBot() - mY;

    this.R.drawPanel(mX, mY, mW, mH, `${fl.floorNumber}F  ${fl.theme}  ·  ${roomName(fl.rooms[curIdx]?.type ?? 'start')}`);

    const cols = fl.cols, rows = fl.rows;
    const cw = L.CELL_W, ch = L.CELL_H, g = L.GAP;

    let minCol = cols, maxCol = 0;
    for (const r of fl.rooms) {
      if (r.col < minCol) minCol = r.col;
      if (r.col > maxCol) maxCol = r.col;
    }
    if (minCol > 0) minCol--;
    if (maxCol < cols - 1) maxCol++;

    const usedCols = maxCol - minCol + 1;
    const gTW = usedCols * (cw + g) + g, gTH = rows * (ch + g) + g;
    const scale = Math.min((mW - 24) / gTW, (mH - 56) / gTH);
    const oX = mX + (mW - gTW * scale) / 2;
    const oY = mY + 46 + (mH - 54 - gTH * scale) / 2;

    for (let row = 0; row < rows; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const cx = oX + ((col - minCol) * (cw + g) + g) * scale;
        const cy = oY + (row * (ch + g) + g) * scale;
        const scw = cw * scale, sch = ch * scale;

        const room = fl.rooms.find(r => r.col === col && r.row === row);
        if (!room) { this.R.drawRoundedRect(cx, cy, scw, sch, 3, '#141428', 0.4); continue; }

        const idx = fl.rooms.indexOf(room);
        const isAdj = adjSet.has(idx);

        this.R.drawGridCell(cx, cy, scw, sch, room.type, room.explored, room.isCurrent, isAdj);

        if (isAdj && idx !== curIdx) {
          this.clicks.push({ x: cx, y: cy, w: scw, h: sch, action: () => dungeon.moveToRoom(idx) });
        }
      }
    }

    this.R.drawText('WASD/方向键移动 · I 背包 · 点击绿框格子进入 · ESC 菜单', W / 2, this.H - L.BOT_H + 8, C.textDim, 10, 'center');

    if (this.showInventory) this.drawInventory();
  }

  private drawInventory(): void {
    const W = this.W;
    const iw = 340, ih = 320;
    const ix = W - iw - L.PAD - 8, iy = this.tTop() + 4;
    this.R.drawOverlayPanel(ix, iy, iw, ih, C.accent);
    this.R.drawTextBold('背 包  /  碎 片', ix + iw / 2, iy + 12, C.accentBright, 16, 'center');
    this.R.drawRect(ix + 12, iy + 36, iw - 24, 1, 'rgba(50,50,80,0.4)', 1);

    const slots: [string, string][] = [
      ['primary_weapon', '主武器'], ['secondary_weapon', '副武器'],
      ['armor', '护甲'], ['accessory1', '饰品1'],
      ['accessory2', '饰品2'], ['resonator', '共鸣器'],
    ];
    let sy = iy + 46;
    for (const [key, label] of slots) {
      const sh = this.g.equippedShards[key as keyof typeof this.g.equippedShards];
      this.R.drawText(label, ix + 18, sy, C.textDim, 11);
      if (sh) {
        this.R.drawText(sh.name, ix + 72, sy, rColor(sh.rarity), 12);
        this.R.drawText(`${sh.description}`, ix + 18, sy + 16, C.textDim, 9);
      } else {
        this.R.drawText('(空)', ix + 72, sy, '#444', 11);
      }
      sy += 38;
    }
    this.R.drawRect(ix + 12, sy + 2, iw - 24, 1, 'rgba(50,50,80,0.35)', 1); sy += 12;
    this.R.drawText(`★ ${this.g.player.stardust}`, ix + 18, sy, C.accent, 11);
    this.R.drawText(`结晶: ${this.g.temporalCrystals}`, ix + 18, sy + 18, C.textDim, 10);
    this.R.drawText('按 I 关闭', ix + iw / 2, iy + ih - 22, C.textDim, 10, 'center');
  }

  renderEvent(): void { this.overlay('事 件', '一个未知事件正在等待……'); }
  renderShop(): void { this.overlay('流 浪 商 人', '用星尘交换物品 (开发中)'); }

  renderRest(): void {
    this.begin(); this.topBar(true);
    const W = this.W, pw = 360, ph = 210, px = (W - pw) / 2, py = this.tTop() + (this.tH() - ph) / 2;
    this.R.drawOverlayPanel(px, py, pw, ph, C.accent);
    this.R.drawTextBold('休 息 点', W / 2, py + 22, C.accentBright, 22, 'center');
    this.R.drawText('虚空废墟中的安全角落', W / 2, py + 54, C.text, 12, 'center');
    this.R.drawText(`HP: ${this.g.player.currentHP} / ${this.g.player.maxHP}`, W / 2, py + 78, C.hpGreen, 14, 'center');
    this.btn('恢复 30% HP', W / 2 - 60, py + 112, 120, 36, () => {
      this.g.player.currentHP = Math.min(this.g.player.maxHP, this.g.player.currentHP + Math.floor(this.g.player.maxHP * 0.3));
      this.g.stateMachine.setState('exploring');
    });
    this.btn('不休息，继续', W / 2 - 60, py + 156, 120, 28, () => this.g.stateMachine.setState('exploring'), false);
  }

  renderAltar(): void { this.overlay('古 老 祭 坛', '付出代价换取力量 (开发中)'); }
  renderTreasure(): void { this.overlay('宝 箱 房', '打开宝箱获得随机碎片 (开发中)'); }

  private overlay(title: string, desc: string): void {
    this.begin(); this.topBar(true);
    const W = this.W, pw = 380, ph = 170, px = (W - pw) / 2, py = this.tTop() + (this.tH() - ph) / 2;
    this.R.drawOverlayPanel(px, py, pw, ph, C.accent);
    this.R.drawTextBold(title, W / 2, py + 28, C.accentBright, 20, 'center');
    this.R.drawText(desc, W / 2, py + 62, C.text, 13, 'center');
    this.btn('继 续 探 索', W / 2 - 50, py + 108, 100, 34, () => this.g.stateMachine.setState('exploring'));
  }

  renderGameOver(): void {
    this.begin();
    const W = this.W, H = this.H, pw = 400, ph = 230, px = (W - pw) / 2, py = (H - ph) / 2 - 30;
    this.R.drawOverlayPanel(px, py, pw, ph, C.danger);
    this.R.drawTextBold('旅 程 终 结', W / 2, py + 30, C.danger, 30, 'center');
    this.R.drawText(`你在第 ${this.d?.currentFloor ?? 0} 层倒下了……`, W / 2, py + 70, C.text, 15, 'center');
    this.R.drawText(`获得 ${this.g.temporalCrystals} 时空结晶`, W / 2, py + 94, C.accent, 13, 'center');
    this.btn('返回主菜单', W / 2 - 65, py + 134, 130, 40, () => this.g.stateMachine.setState('main_menu'));
    this.btn('再来一局', W / 2 - 65, py + 180, 130, 30, () => this.g.stateMachine.setState('character_select'), false);
  }

  renderVictory(): void {
    this.begin();
    const W = this.W, H = this.H, pw = 420, ph = 250, px = (W - pw) / 2, py = (H - ph) / 2 - 40;
    this.R.drawOverlayPanel(px, py, pw, ph, C.accent);
    this.R.drawTextBold('✦ 虚 空 征 服 ✦', W / 2, py + 30, C.accentBright, 30, 'center');
    this.R.drawText('你击败了静默之心，星网恢复了平静。', W / 2, py + 68, C.text, 15, 'center');
    this.R.drawText(`获得 ${this.g.temporalCrystals} 时空结晶`, W / 2, py + 90, C.accent, 13, 'center');
    this.btn('继续旅程', W / 2 - 65, py + 140, 130, 42, () => this.g.stateMachine.setState('character_select'));
    this.btn('返回主菜单', W / 2 - 65, py + 190, 130, 32, () => this.g.stateMachine.setState('main_menu'), false);
  }

  private wrap(text: string, maxW: number, fs: number): string[] {
    const ctx = this.R.context;
    ctx.font = `${fs}px "Segoe UI", "Microsoft YaHei", sans-serif`;
    const lines: string[] = []; let line = '';
    for (const c of text.split('')) {
      if (ctx.measureText(line + c).width > maxW && line.length > 0) { lines.push(line); line = c; }
      else line += c;
    }
    if (line) lines.push(line);
    return lines;
  }
}

function shardBrief(sh: ShardDefinition): string {
  if (sh.damage) {
    let s = `${sh.damage}伤`;
    if (sh.damageType) s += ` ${sh.damageType === 'physical' ? '物理' : sh.damageType === 'fire' ? '火' : sh.damageType === 'ice' ? '冰' : sh.damageType === 'shadow' ? '暗' : '共鸣'}`;
    if (sh.statusOnHit) s += ` +${sh.statusOnHit}`;
    return s;
  }
  if (sh.healAmount) return `${sh.healAmount}回复`;
  if (sh.shieldBonus) return `${sh.shieldBonus}盾`;
  if (sh.hpBonus) return `+${sh.hpBonus}HP`;
  if (sh.passiveEffect) {
    const m: Record<string, string> = { damage_bonus: '+伤', extra_ap: '+AP', lifesteal: '吸血', rewind: '回溯', dodge: '闪避' };
    return m[sh.passiveEffect] ?? sh.passiveEffect;
  }
  return sh.description.slice(0, 10);
}

function slotLabel(t: string): string {
  const m: Record<string, string> = {
    primary_weapon: '主武', secondary_weapon: '副武', armor: '护甲',
    accessory1: '饰品', accessory2: '饰品', resonator: '共鸣',
  };
  return m[t] ?? t;
}

function roomName(t: string): string {
  const m: Record<string, string> = {
    start: '起始', combat: '战斗', elite: '精英', shop: '商店',
    altar: '祭坛', rest: '休息', treasure: '宝箱', boss: 'BOSS', empty: '空',
  };
  return m[t] ?? t;
}
