import type { GameState } from '../types';

type StateEnterCallback = () => void;
type StateUpdateCallback = (deltaTime: number) => void;
type StateExitCallback = () => void;

interface StateConfig {
  enter?: StateEnterCallback;
  update?: StateUpdateCallback;
  exit?: StateExitCallback;
}

export class StateMachine {
  private states: Map<GameState, StateConfig> = new Map();
  private currentState: GameState | null = null;

  register(state: GameState, config: StateConfig): void {
    this.states.set(state, config);
  }

  setState(newState: GameState): void {
    if (this.currentState !== null) {
      const prevConfig = this.states.get(this.currentState);
      prevConfig?.exit?.();
    }
    this.currentState = newState;
    const config = this.states.get(newState);
    config?.enter?.();
  }

  update(deltaTime: number): void {
    if (this.currentState !== null) {
      const config = this.states.get(this.currentState);
      config?.update?.(deltaTime);
    }
  }

  getCurrentState(): GameState | null {
    return this.currentState;
  }
}
