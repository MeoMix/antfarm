class Component {
  public id: number;
  public data: any;

  constructor(id: number, data: any) {
    this.id = id;
    this.data = data;
  }
}

class Entity {
  public id: number;
  public components: Component[];

  constructor(id: number, components: Component[]) {
    this.id = id;
    this.components = components;
  }
}

type EntityMap = {
  [id: number]: Entity;
};

type EntityList = Entity[];

type System = (entities: EntityList) => void;

class EntityComponentSystem {
  public entities: EntityMap;
  public systems: System[];
  public nextEntityId: number;
  public nextComponentId: number;

  constructor() {
    this.entities = {};
    this.systems = [];
    this.nextEntityId = 0;
    this.nextComponentId = 0;
  }

  public addEntity(entity: Entity) {
    this.entities[entity.id] = entity;
  }

  public addSystem(system: System) {
    this.systems.push(system);
  }

  public update() {
    const entities: EntityList = Object.values(this.entities);
    this.systems.forEach(system => system(entities));
  }

  public createEntity(components: Component[]): Entity {
    const id = this.nextEntityId++;
    return new Entity(id, components);
  }

  public createComponent(data: any): Component {
    const id = this.nextComponentId++;
    return new Component(id, data);
  }
}

export const createEntityComponentSystem = (): EntityComponentSystem => new EntityComponentSystem();
