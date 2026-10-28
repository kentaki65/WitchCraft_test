import type * as Types from "@bloxd";

export class CustomButtonManager {
  private playerId: Types.PlayerId;
  private customButtons: Map<string, Types.CustomButtonType>;

  constructor(playerId: Types.PlayerId) {
    this.playerId = playerId;
    this.customButtons = new Map();
  }

  add(newSetting: Types.CustomButtonType): void {
    this.customButtons.set(newSetting.id, newSetting);
    this.update();
  }

  edit<K extends keyof Types.CustomButtonType>(
    id: string,
    key: K, 
    newValue: Types.CustomButtonType[K]
  ): void {
    const oldValue = this.customButtons.get(id);
    if(oldValue !== undefined) {
      this.add({...oldValue, [key]: newValue});
    }
  }

  update() {
    api.setClientOption(this.playerId, "customButtons", Array.from(this.customButtons.values()))
  }

  delete(id: string): boolean {
    const deleted = this.customButtons.delete(id);
    if (deleted) this.update();

    return deleted;
  }
}