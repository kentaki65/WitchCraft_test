import type * as Types from "@bloxd";

export class CustomButtonManager {
  protected playerId: Types.PlayerId;
  protected customButtons: Map<string, Types.CustomButtonType>;

  constructor(playerId: Types.PlayerId) {
    this.playerId = playerId;
    this.customButtons = new Map();
  }

  add(newSetting: Types.CustomButtonType): void {
    this.customButtons.set(newSetting.id, newSetting);
    this.update();
  }

  update() {
    api.setClientOption(this.playerId, "customButtons", Array.from(this.customButtons.values()))
  }

  handleOnPressKey(pressedKeyId: string): void {
    const button = this.customButtons.get(pressedKeyId);
  }

  delete(id: string): boolean {
    const deleted = this.customButtons.delete(id);
    if (deleted) this.update();

    return deleted;
  }
}