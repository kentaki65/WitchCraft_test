import { randomString } from "../../utils/randomString";

export class Modifiable<T> {
  private modifiers: Map<string, T>;

  constructor() {
    this.modifiers = new Map();
  }

  public addModifier(modifier: T) {
    const id = randomString(8);
    this.modifiers.set(id, modifier);
    return id;
  }

  public removeModifier(id: string) {
    this.modifiers.delete(id);
  }

  public getModifiers(): IterableIterator<T> {
    return this.modifiers.values();
  }
}