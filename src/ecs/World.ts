import { Entity } from './Entity';
import { Component } from './Component';
import { System } from './System';

export class World {
  private entities: Map<number, Entity> = new Map();
  private components: Map<new () => Component, Map<number, Component>> = new Map();
  private systems: System[] = [];

  createEntity(): Entity {
    const entity = new Entity();
    this.entities.set(entity.id, entity);
    return entity;
  }

  removeEntity(entityId: number): void {
    this.entities.delete(entityId);
    for (const componentMap of this.components.values()) {
      componentMap.delete(entityId);
    }
  }

  addComponent<T extends Component>(entityId: number, component: T): void {
    const ctor = component.constructor as new () => T;
    if (!this.components.has(ctor)) {
      this.components.set(ctor, new Map());
    }
    component.entityId = entityId;
    this.components.get(ctor)!.set(entityId, component);
  }

  getComponent<T extends Component>(entityId: number, ctor: new () => T): T | undefined {
    const map = this.components.get(ctor);
    return map?.get(entityId) as T | undefined;
  }

  removeComponent<T extends Component>(entityId: number, ctor: new () => T): void {
    const map = this.components.get(ctor);
    map?.delete(entityId);
  }

  getEntitiesWith<T extends Component>(ctor: new () => T): number[] {
    const map = this.components.get(ctor);
    return map ? Array.from(map.keys()) : [];
  }

  getComponentsOfType<T extends Component>(ctor: new () => T): T[] {
    const map = this.components.get(ctor);
    return map ? Array.from(map.values()) as T[] : [];
  }

  addSystem(system: System): void {
    this.systems.push(system);
  }

  update(deltaTime: number): void {
    for (const system of this.systems) {
      system.update(deltaTime);
    }
  }

  clear(): void {
    this.entities.clear();
    this.components.clear();
    this.systems = [];
  }
}
