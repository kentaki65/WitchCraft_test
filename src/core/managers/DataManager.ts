export class DataManager<T extends object> {
  constructor(
    private data: T,
    private onUpdated: (data: T) => void = () => {},
  ) {}

  get(): T {
    return this.data;
  }

  set(data: T): void {
    this.data = data;
    this.onUpdated(this.data);
  }

  update(data: Partial<T>): void {
    Object.assign(this.data, data);
    this.onUpdated(this.data);
  }
}