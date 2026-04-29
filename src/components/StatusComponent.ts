import { Component } from '../ecs/Component';
import type { StatusEffectInstance } from '../types';

export class StatusComponent extends Component {
  effects: StatusEffectInstance[] = [];

  addEffect(type: StatusEffectInstance['type'], turns: number, value?: number): void {
    const existing = this.effects.find((e) => e.type === type);
    if (existing) {
      existing.remainingTurns = Math.max(existing.remainingTurns, turns);
      if (value !== undefined) existing.value = value;
    } else {
      this.effects.push({ type, remainingTurns: turns, value });
    }
  }

  removeEffect(type: StatusEffectInstance['type']): void {
    this.effects = this.effects.filter((e) => e.type !== type);
  }

  hasEffect(type: StatusEffectInstance['type']): boolean {
    return this.effects.some((e) => e.type === type);
  }

  tickEffects(): void {
    this.effects = this.effects.filter((e) => {
      e.remainingTurns--;
      return e.remainingTurns > 0;
    });
  }
}
