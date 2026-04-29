import { Component } from '../ecs/Component';

export class HealthComponent extends Component {
  maxHP: number;
  currentHP: number;
  currentShield: number;

  constructor(maxHP: number) {
    super();
    this.maxHP = maxHP;
    this.currentHP = maxHP;
    this.currentShield = 0;
  }
}
