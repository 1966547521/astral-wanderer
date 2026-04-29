export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private stars: Array<{ x: number; y: number; r: number; twinkle: number; speed: number }> = [];
  private nebulaParticles: Array<{ x: number; y: number; r: number; alpha: number; dx: number; dy: number }> = [];
  private frameCount: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2D context');
    this.ctx = ctx;
    this.width = canvas.width;
    this.height = canvas.height;
    this.initStars();
  }

  get context(): CanvasRenderingContext2D { return this.ctx; }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.initStars();
  }

  private initStars(): void {
    this.stars = [];
    for (let i = 0; i < 80; i++) {
      this.stars.push({
        x: Math.random() * this.width, y: Math.random() * this.height,
        r: Math.random() * 1.5 + 0.5, twinkle: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.02 + 0.005,
      });
    }
    this.nebulaParticles = [];
    for (let i = 0; i < 15; i++) {
      this.nebulaParticles.push({
        x: Math.random() * this.width, y: Math.random() * this.height,
        r: Math.random() * 60 + 40, alpha: Math.random() * 0.03 + 0.01,
        dx: Math.random() * 0.3 - 0.15, dy: Math.random() * 0.3 - 0.15,
      });
    }
  }

  clear(): void {
    this.frameCount++;
    this.ctx.fillStyle = '#141428';
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.drawStarfield();
  }

  private drawStarfield(): void {
    for (const p of this.nebulaParticles) {
      const g = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      g.addColorStop(0, `rgba(50,35,80,${p.alpha * 1.5})`);
      g.addColorStop(0.5, `rgba(30,18,60,${p.alpha * 0.7})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      this.ctx.fillStyle = g;
      this.ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    }
    for (const s of this.stars) {
      s.twinkle += s.speed;
      const alpha = 0.5 + 0.5 * Math.abs(Math.sin(s.twinkle));
      this.ctx.fillStyle = `rgba(220,235,255,${alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  drawRect(x: number, y: number, w: number, h: number, color: string, alpha = 1): void {
    this.ctx.globalAlpha = alpha; this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, w, h); this.ctx.globalAlpha = 1;
  }

  drawRoundedRect(x: number, y: number, w: number, h: number, r: number, color: string, alpha = 1): void {
    this.ctx.globalAlpha = alpha; this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y); this.ctx.lineTo(x + w - r, y);
    this.ctx.arcTo(x + w, y, x + w, y + r, r);
    this.ctx.lineTo(x + w, y + h - r); this.ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    this.ctx.lineTo(x + r, y + h); this.ctx.arcTo(x, y + h, x, y + h - r, r);
    this.ctx.lineTo(x, y + r); this.ctx.arcTo(x, y, x + r, y, r);
    this.ctx.fill(); this.ctx.globalAlpha = 1;
  }

  drawRoundedOutline(x: number, y: number, w: number, h: number, r: number, color: string, lw = 2): void {
    this.ctx.strokeStyle = color; this.ctx.lineWidth = lw;
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y); this.ctx.lineTo(x + w - r, y);
    this.ctx.arcTo(x + w, y, x + w, y + r, r);
    this.ctx.lineTo(x + w, y + h - r); this.ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    this.ctx.lineTo(x + r, y + h); this.ctx.arcTo(x, y + h, x, y + h - r, r);
    this.ctx.lineTo(x, y + r); this.ctx.arcTo(x, y, x + r, y, r);
    this.ctx.stroke();
  }

  drawRectOutline(x: number, y: number, w: number, h: number, color: string, lw = 2): void {
    this.ctx.strokeStyle = color; this.ctx.lineWidth = lw; this.ctx.strokeRect(x, y, w, h);
  }

  drawText(text: string, x: number, y: number, color: string, fs = 16, align: CanvasTextAlign = 'left'): void {
    this.ctx.fillStyle = color;
    this.ctx.font = `${fs}px "Segoe UI", "Microsoft YaHei", sans-serif`;
    this.ctx.textAlign = align; this.ctx.textBaseline = 'top'; this.ctx.fillText(text, x, y);
  }

  drawTextBold(text: string, x: number, y: number, color: string, fs = 16, align: CanvasTextAlign = 'left'): void {
    this.ctx.fillStyle = color;
    this.ctx.font = `bold ${fs}px "Segoe UI", "Microsoft YaHei", sans-serif`;
    this.ctx.textAlign = align; this.ctx.textBaseline = 'top'; this.ctx.fillText(text, x, y);
  }

  drawHPBar(x: number, y: number, w: number, h: number, current: number, max: number): void {
    this.drawRoundedRect(x, y, w, h, 4, '#252540', 1);
    const ratio = Math.max(0, current / max);
    let c = '#44cc66'; if (ratio <= 0.25) c = '#e04040'; else if (ratio <= 0.5) c = '#e0a040';
    this.drawRoundedRect(x, y, ratio * w, h, 4, c, 1);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = `bold 11px "Segoe UI", "Microsoft YaHei", sans-serif`;
    this.ctx.textAlign = 'center'; this.ctx.textBaseline = 'top';
    this.ctx.fillText(`${current}/${max}`, x + w / 2, y + h / 2 - 5);
  }

  drawShieldBar(x: number, y: number, w: number, shield: number): void {
    if (shield <= 0) return;
    const shW = Math.min(w * 0.6, w * (shield / 30));
    this.drawRoundedRect(x, y - 4, shW, 8, 3, '#4499dd', 0.9);
    this.ctx.fillStyle = '#aaddff';
    this.ctx.font = `bold 10px "Segoe UI", "Microsoft YaHei", sans-serif`;
    this.ctx.textAlign = 'left'; this.ctx.fillText(`盾 ${shield}`, x + shW + 5, y - 6);
  }

  drawAP(x: number, y: number, current: number, max: number): void {
    for (let i = 0; i < max; i++) {
      const r = 7, cx = x + i * 22 + r, cy = y + r;
      this.ctx.beginPath(); this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
      if (i < current) { this.ctx.fillStyle = '#ffcc00'; this.ctx.fill(); this.ctx.strokeStyle = '#ff9900'; this.ctx.lineWidth = 1; this.ctx.stroke(); }
      else { this.ctx.strokeStyle = '#333'; this.ctx.lineWidth = 1; this.ctx.stroke(); }
    }
  }

  drawLine(x1: number, y1: number, x2: number, y2: number, color: string, lw = 2): void {
    this.ctx.strokeStyle = color; this.ctx.lineWidth = lw;
    this.ctx.beginPath(); this.ctx.moveTo(x1, y1); this.ctx.lineTo(x2, y2); this.ctx.stroke();
  }

  drawDashLine(x1: number, y1: number, x2: number, y2: number, color: string, lw = 1): void {
    this.ctx.strokeStyle = color; this.ctx.lineWidth = lw;
    this.ctx.setLineDash([4, 4]);
    this.ctx.beginPath(); this.ctx.moveTo(x1, y1); this.ctx.lineTo(x2, y2); this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  drawPlayerCharacter(cx: number, cy: number, scale: number, color: string): void {
    const s = scale; this.ctx.save(); this.ctx.translate(cx, cy);
    this.ctx.fillStyle = color; this.ctx.globalAlpha = 0.15;
    this.ctx.beginPath(); this.ctx.arc(0, 0, 40 * s, 0, Math.PI * 2); this.ctx.fill(); this.ctx.globalAlpha = 1;
    this.ctx.fillStyle = '#1a1a3a'; this.ctx.strokeStyle = color; this.ctx.lineWidth = 2;
    this.ctx.beginPath(); this.ctx.arc(0, -5 * s, 18 * s, 0, Math.PI * 2); this.ctx.fill(); this.ctx.stroke();
    this.ctx.fillStyle = color; this.ctx.beginPath(); this.ctx.arc(0, -8 * s, 6 * s, 0, Math.PI * 2); this.ctx.fill();
    this.ctx.fillStyle = '#1a1a3a'; this.ctx.strokeStyle = color; this.ctx.lineWidth = 2;
    this.ctx.beginPath(); this.ctx.moveTo(-12 * s, 10 * s); this.ctx.lineTo(0, -5 * s); this.ctx.lineTo(12 * s, 10 * s); this.ctx.lineTo(18 * s, 35 * s); this.ctx.lineTo(0, 25 * s); this.ctx.lineTo(-18 * s, 35 * s); this.ctx.closePath(); this.ctx.fill(); this.ctx.stroke();
    this.ctx.strokeStyle = color; this.ctx.lineWidth = 2;
    this.ctx.beginPath(); this.ctx.moveTo(-18 * s, 20 * s); this.ctx.lineTo(-25 * s, 40 * s); this.ctx.stroke();
    this.ctx.beginPath(); this.ctx.moveTo(18 * s, 20 * s); this.ctx.lineTo(25 * s, 40 * s); this.ctx.stroke();
    this.ctx.restore();
  }

  drawEnemyShape(cx: number, cy: number, scale: number, isBoss: boolean, isElite: boolean): void {
    const s = scale; this.ctx.save(); this.ctx.translate(cx, cy);
    const color = isBoss ? '#e04040' : isElite ? '#d08040' : '#8060c0';
    this.ctx.fillStyle = color; this.ctx.globalAlpha = 0.1;
    this.ctx.beginPath(); this.ctx.arc(0, 0, (isBoss ? 50 : 30) * s, 0, Math.PI * 2); this.ctx.fill(); this.ctx.globalAlpha = 1;
    this.ctx.strokeStyle = color; this.ctx.lineWidth = 2; this.ctx.beginPath();
    if (isBoss) {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const r1 = 22 * s, r2 = i % 2 === 0 ? 35 * s : 22 * s;
        if (i === 0) this.ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
        else this.ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
        this.ctx.lineTo(Math.cos(a + 0.3) * r2, Math.sin(a + 0.3) * r2);
      } this.ctx.closePath();
    } else {
      this.ctx.moveTo(0, -20 * s); this.ctx.lineTo(15 * s, 10 * s); this.ctx.lineTo(10 * s, 20 * s); this.ctx.lineTo(-10 * s, 20 * s); this.ctx.lineTo(-15 * s, 10 * s); this.ctx.closePath();
    }
    this.ctx.stroke(); this.ctx.fillStyle = color; this.ctx.globalAlpha = 0.4; this.ctx.fill(); this.ctx.globalAlpha = 1;
    this.ctx.fillStyle = color; this.ctx.beginPath(); this.ctx.arc(0, isBoss ? 0 : -3 * s, (isBoss ? 8 : 5) * s, 0, Math.PI * 2); this.ctx.fill();
    this.ctx.restore();
  }

  drawShardCard(x: number, y: number, w: number, h: number, title: string, cost: number, desc: string, rarityColor: string, disabled: boolean): void {
    const r = 6, bg = disabled ? '#1a1a30' : '#222240', bd = disabled ? '#444' : rarityColor;
    this.drawRoundedRect(x, y, w, h, r, bg, 0.95); this.drawRoundedOutline(x, y, w, h, r, bd, 1.5);
    if (!disabled) {
      this.ctx.strokeStyle = rarityColor; this.ctx.globalAlpha = 0.2; this.ctx.lineWidth = 4;
      this.ctx.beginPath(); this.ctx.moveTo(x + r, y); this.ctx.lineTo(x + w - r, y); this.ctx.stroke(); this.ctx.globalAlpha = 1;
    }
    this.ctx.textAlign = 'left'; this.ctx.textBaseline = 'top';
    this.ctx.fillStyle = disabled ? '#555' : rarityColor;
    this.ctx.font = `bold 13px "Segoe UI", "Microsoft YaHei", sans-serif`; this.ctx.fillText(title, x + 8, y + 6);
    this.ctx.fillStyle = disabled ? '#444' : '#ffcc00';
    this.ctx.font = `bold 10px "Segoe UI", "Microsoft YaHei", sans-serif`; this.ctx.fillText(`${cost} AP`, x + 8, y + 24);
    this.ctx.fillStyle = disabled ? '#444' : '#888';
    this.ctx.font = `9px "Segoe UI", "Microsoft YaHei", sans-serif`; this.ctx.fillText(desc, x + 8, y + 40);
  }

  drawGridCell(x: number, y: number, w: number, h: number, type: string, explored: boolean, isCurrent: boolean, isAdj: boolean): void {
    const r = 4, pad = 3;
    const innerX = x + pad, innerY = y + pad, innerW = w - pad * 2, innerH = h - pad * 2;

    if (!explored) {
      this.drawCastleStone(innerX, innerY, innerW, innerH, '#2a2a38', '#3a3c48', false);
      this.ctx.fillStyle = 'rgba(0,0,0,0.2)'; this.ctx.fillRect(innerX, innerY, innerW, innerH);
      this.drawRoundedRect(x, y, w, h, r, '#181828', 0.88);
      this.drawRoundedOutline(x, y, w, h, r, isAdj ? '#60ff80' : '#3a3a48', isAdj ? 2.5 : 1.5);
      this.ctx.fillStyle = isAdj ? '#60ff80' : '#555';
      this.ctx.font = `bold ${Math.min(16, h * 0.32)}px "Segoe UI", "Microsoft YaHei", sans-serif`;
      this.ctx.textAlign = 'center'; this.ctx.textBaseline = 'top';
      this.ctx.fillText('?', x + w / 2, y + h / 2 - 8);
      if (isAdj) {
        this.ctx.fillStyle = '#60ff80'; this.ctx.font = `bold 10px "Segoe UI", "Microsoft YaHei", sans-serif`;
        this.ctx.fillText('进入', x + w / 2, y + h / 2 + 12);
      }
      return;
    }

    if (type === 'empty') {
      this.drawCastleStone(innerX, innerY, innerW, innerH, '#3a3a46', '#454555', true);
      if (isCurrent) { this.drawRoundedOutline(x, y, w, h, r, '#e8c050', 2); }
      else { this.drawRoundedOutline(x, y, w, h, r, 'rgba(70,70,85,0.5)', 1); }
      const cx = x + w / 2, cy = y + h / 2 - 4;
      this.ctx.strokeStyle = 'rgba(120,120,140,0.6)'; this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.moveTo(cx - 7, cy - 7); this.ctx.lineTo(cx + 7, cy + 7);
      this.ctx.moveTo(cx + 7, cy - 7); this.ctx.lineTo(cx - 7, cy + 7);
      this.ctx.stroke();
      return;
    }

    const typeInfo = castleRoomTheme(type);
    const stoneBg = isCurrent ? typeInfo.stoneLight : typeInfo.stone;
    const accentColor = isCurrent ? '#e8c050' : isAdj ? '#60ff80' : typeInfo.accent;

    this.drawCastleStone(innerX, innerY, innerW, innerH, stoneBg, typeInfo.mortar, explored);

    this.drawCastleBattlements(x, y, w, h, accentColor, isCurrent || isAdj ? 1 : 0.5);

    this.drawRoundedOutline(x, y, w, h, r, accentColor, isCurrent ? 2.5 : isAdj ? 2 : 1);

    const fs = Math.max(11, Math.min(14, h * 0.36));
    this.ctx.fillStyle = typeInfo.iconBg;
    this.ctx.globalAlpha = 0.85;
    this.ctx.fillRect(x + w / 2 - 10, y + h * 0.25 - 10, 20, 20);
    this.ctx.globalAlpha = 1;
    this.drawTextBold(typeInfo.icon, x + w / 2, y + h * 0.25 - 8, '#fff', fs, 'center');
    this.drawText(typeInfo.label, x + w / 2, y + h * 0.58, 'rgba(200,200,210,0.7)', 9, 'center');
  }

  private drawCastleStone(x: number, y: number, w: number, h: number, stoneColor: string, mortarColor: string, drawMortar: boolean): void {
    this.ctx.fillStyle = stoneColor;
    this.ctx.fillRect(x, y, w, h);

    if (!drawMortar) return;

    const brickH = Math.floor(h / 4);
    this.ctx.strokeStyle = mortarColor;
    this.ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const by = y + i * brickH;
      this.ctx.beginPath(); this.ctx.moveTo(x + 2, by); this.ctx.lineTo(x + w - 2, by); this.ctx.stroke();
    }

    for (let row = 0; row < 4; row++) {
      const rowY = y + row * brickH;
      const offset = (row % 2) * (w * 0.22);
      for (let col = 0; col < 3; col++) {
        const bx = x + offset + col * (w * 0.35) + w * 0.08;
        if (bx < x + w - 4) {
          this.ctx.beginPath();
          this.ctx.moveTo(bx, rowY + 2);
          this.ctx.lineTo(bx, rowY + brickH - 1);
          this.ctx.stroke();
        }
      }
    }
  }

  private drawCastleBattlements(x: number, y: number, w: number, h: number, color: string, alpha: number): void {
    this.ctx.strokeStyle = color;
    this.ctx.globalAlpha = alpha;
    this.ctx.lineWidth = 1.2;

    const notchW = Math.min(w * 0.18, 18);
    const notchH = Math.min(h * 0.08, 6);
    const count = 3;
    const totalW = count * notchW;
    const startX = x + (w - totalW) / 2;
    const topY = y + 2;

    for (let i = 0; i < count; i++) {
      const nx = startX + i * notchW;
      this.ctx.beginPath();
      this.ctx.moveTo(nx, topY); this.ctx.lineTo(nx, topY - notchH);
      this.ctx.lineTo(nx + notchW * 0.6, topY - notchH); this.ctx.lineTo(nx + notchW * 0.6, topY);
      this.ctx.stroke();
    }

    this.ctx.globalAlpha = 1;
  }

  drawPanel(x: number, y: number, w: number, h: number, title: string, titleColor = '#c8a050'): void {
    this.drawRoundedRect(x, y, w, h, 8, 'rgba(18,22,42,0.9)', 1);
    this.drawRoundedOutline(x, y, w, h, 8, 'rgba(55,55,90,0.6)');
    if (title) {
      this.ctx.strokeStyle = 'rgba(55,55,90,0.45)'; this.ctx.lineWidth = 1;
      this.ctx.beginPath(); this.ctx.moveTo(x + 12, y + 32); this.ctx.lineTo(x + w - 12, y + 32); this.ctx.stroke();
      this.ctx.fillStyle = titleColor;
      this.ctx.font = `bold 13px "Segoe UI", "Microsoft YaHei", sans-serif`;
      this.ctx.textAlign = 'left'; this.ctx.fillText(title, x + 14, y + 10);
    }
  }

  drawOverlayPanel(x: number, y: number, w: number, h: number, borderColor: string): void {
    this.drawRoundedRect(x, y, w, h, 12, 'rgba(16,20,40,0.95)', 1);
    this.drawRoundedOutline(x, y, w, h, 12, borderColor, 2);
    const g = this.ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, 'rgba(50,50,90,0.1)'); g.addColorStop(1, 'rgba(14,16,32,0)');
    this.ctx.fillStyle = g; this.ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  }
}

interface CastleTheme {
  stone: string;
  stoneLight: string;
  mortar: string;
  accent: string;
  icon: string;
  iconBg: string;
  label: string;
}

function castleRoomTheme(t: string): CastleTheme {
  const themes: Record<string, CastleTheme> = {
    start:    { stone: '#4a4a50', stoneLight: '#5c5c62', mortar: '#5e5e64', accent: '#99aacc', icon: 'S', iconBg: '#6699cc', label: '起点' },
    combat:   { stone: '#484446', stoneLight: '#585254', mortar: '#5c585a', accent: '#bb6655', icon: '!', iconBg: '#cc6655', label: '战斗' },
    elite:    { stone: '#4a4446', stoneLight: '#5a5254', mortar: '#5e585a', accent: '#cc7740', icon: 'E', iconBg: '#cc7740', label: '精英' },
    shop:     { stone: '#464846', stoneLight: '#545854', mortar: '#585c58', accent: '#66bb66', icon: '$', iconBg: '#55bb55', label: '商店' },
    rest:     { stone: '#46464a', stoneLight: '#54545a', mortar: '#58585e', accent: '#77aabb', icon: 'R', iconBg: '#55aabb', label: '休息' },
    treasure: { stone: '#4a4844', stoneLight: '#5a5652', mortar: '#5e5a56', accent: '#ddbb40', icon: 'T', iconBg: '#ddbb40', label: '宝箱' },
    altar:    { stone: '#48464c', stoneLight: '#58545e', mortar: '#5a5660', accent: '#aa77dd', icon: '&', iconBg: '#9966dd', label: '祭坛' },
    boss:     { stone: '#4c4242', stoneLight: '#5e4e4e', mortar: '#625656', accent: '#ee5555', icon: 'B', iconBg: '#ee4444', label: 'BOSS' },
  };
  return themes[t] ?? themes.combat;
}
