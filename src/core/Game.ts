import { World } from '../ecs/World';
import { EventBus } from './EventBus';
import { StateMachine } from './StateMachine';
import { Renderer } from '../render/Renderer';
import { SaveManager } from '../utils/SaveManager';
import { UIManager } from '../ui/UIManager';
import { DungeonSystem } from '../systems/DungeonSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { getShardById } from '../data/shards';
import type { PlayerStats, EquippedShards, ShardSlot } from '../types';
import type { IDungeonManager } from '../dungeon/IDungeonManager';

export class Game {
  public world: World;
  public events: EventBus;
  public stateMachine: StateMachine;
  public renderer: Renderer;
  public saveManager: SaveManager;
  public uiManager: UIManager;

  public dungeonSystem: IDungeonManager | null = null;
  public combatSystem: CombatSystem | null = null;

  public player: PlayerStats = {
    maxHP: 100,
    currentHP: 100,
    currentShield: 0,
    maxAP: 3,
    currentAP: 3,
    baseDamage: 10,
    stardust: 0,
  };

  public equippedShards: EquippedShards = {
    primary_weapon: null,
    secondary_weapon: null,
    armor: null,
    accessory1: null,
    accessory2: null,
    resonator: null,
  };

  public currentCharacter: string = 'flame_wanderer';
  public temporalCrystals: number = 0;
  public runNumber: number = 0;

  private canvas: HTMLCanvasElement;
  private lastTime: number = 0;
  private isRunning: boolean = false;
  private animationFrameId: number = 0;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.resizeCanvas();

    this.world = new World();
    this.events = new EventBus();
    this.stateMachine = new StateMachine();
    this.renderer = new Renderer(this.canvas);
    this.saveManager = new SaveManager();
    this.uiManager = new UIManager(this);

    window.addEventListener('resize', () => this.resizeCanvas());
  }

  private resizeCanvas(): void {
    const width = Math.min(window.innerWidth, 1280);
    const height = Math.min(window.innerHeight, 720);
    this.canvas.width = width;
    this.canvas.height = height;
    if (this.renderer) {
      this.renderer.resize(width, height);
    }
  }

  async init(): Promise<void> {
    this.registerStates();
    this.loadMetaProgress();
    this.stateMachine.setState('main_menu');
  }

  private registerStates(): void {
    this.stateMachine.register('main_menu', {
      enter: () => {
        this.events.emit('state:main_menu');
      },
      update: () => {
        this.renderer.clear();
        this.uiManager.renderMainMenu();
      },
    });

    this.stateMachine.register('exploring', {
      enter: () => {
        this.events.emit('state:exploring');
      },
      update: () => {
        this.renderer.clear();
        this.uiManager.renderMap();
      },
    });

    this.stateMachine.register('battle', {
      enter: () => {
        this.events.emit('state:battle');
      },
      update: () => {
        this.renderer.clear();
        this.uiManager.renderBattle();
      },
    });

    this.stateMachine.register('game_over', {
      enter: () => {
        this.events.emit('state:game_over');
      },
      update: () => {
        this.renderer.clear();
        this.uiManager.renderGameOver();
      },
    });

    this.stateMachine.register('victory', {
      enter: () => {
        this.events.emit('state:victory');
      },
      update: () => {
        this.renderer.clear();
        this.uiManager.renderVictory();
      },
    });

    this.stateMachine.register('event', {
      enter: () => { this.events.emit('state:event'); },
      update: () => {
        this.renderer.clear();
        this.uiManager.renderEvent();
      },
    });

    this.stateMachine.register('shop', {
      enter: () => { this.events.emit('state:shop'); },
      update: () => {
        this.renderer.clear();
        this.uiManager.renderShop();
      },
    });

    this.stateMachine.register('rest_site', {
      enter: () => { this.events.emit('state:rest_site'); },
      update: () => {
        this.renderer.clear();
        this.uiManager.renderRest();
      },
    });

    this.stateMachine.register('altar', {
      enter: () => { this.events.emit('state:altar'); },
      update: () => {
        this.renderer.clear();
        this.uiManager.renderAltar();
      },
    });

    this.stateMachine.register('treasure_room', {
      enter: () => { this.events.emit('state:treasure_room'); },
      update: () => {
        this.renderer.clear();
        this.uiManager.renderTreasure();
      },
    });

    this.stateMachine.register('character_select', {
      enter: () => { this.events.emit('state:character_select'); },
      update: () => {
        this.renderer.clear();
        this.uiManager.renderCharacterSelect();
      },
    });
  }

  startRun(): void {
    this.runNumber++;
    this.player.currentHP = this.player.maxHP;
    this.player.currentShield = 0;
    this.player.currentAP = 3;
    this.player.stardust = 0;

    const dungeonSystem = new DungeonSystem({
      onStateChange: (state) => this.stateMachine.setState(state),
      onRoomEntered: (roomType) => {
        if (roomType === 'combat' || roomType === 'elite' || roomType === 'boss') {
          this.combatSystem?.startBattle(roomType, dungeonSystem.currentFloor);
        }
      },
      onVictory: () => this.endRun(true),
    });
    this.dungeonSystem = dungeonSystem;
    this.world.addSystem(dungeonSystem);
    dungeonSystem.generateFloor();

    this.combatSystem = new CombatSystem(this);
    this.world.addSystem(this.combatSystem);

    const shard = getShardById('void_blade');
    if (shard) {
      this.equippedShards.primary_weapon = shard;
    }

    this.stateMachine.setState('exploring');
  }

  endRun(victory: boolean): void {
    const floor = this.dungeonSystem?.currentFloor ?? 0;
    this.world.clear();
    this.dungeonSystem = null;
    this.combatSystem = null;
    const crystals = victory ? 50 + floor * 10 : Math.max(5, floor * 8);
    this.temporalCrystals += crystals;
    this.saveManager.save('temporalCrystals', this.temporalCrystals);
    this.saveManager.save('runNumber', this.runNumber);
    this.stateMachine.setState(victory ? 'victory' : 'game_over');
  }

  private loadMetaProgress(): void {
    this.temporalCrystals = this.saveManager.load<number>('temporalCrystals') ?? 0;
    this.runNumber = this.saveManager.load<number>('runNumber') ?? 0;
  }

  private gameLoop = (timestamp: number): void => {
    if (!this.isRunning) return;
    const deltaTime = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;

    this.stateMachine.update(deltaTime);

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  }

  stop(): void {
    this.isRunning = false;
    cancelAnimationFrame(this.animationFrameId);
  }
}
