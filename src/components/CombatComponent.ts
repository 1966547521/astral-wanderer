import { Component } from '../ecs/Component';

export class CombatComponent extends Component {
  baseDamage: number;
  currentAP: number;
  maxAP: number;
  isPlayer: boolean;
  isAlive: boolean;

  constructor(baseDamage: number, maxAP: number, isPlayer: boolean) {
    super();
    this.baseDamage = baseDamage;
    this.maxAP = maxAP;
    this.currentAP = maxAP;
    this.isPlayer = isPlayer;
    this.isAlive = true;
  }
}
