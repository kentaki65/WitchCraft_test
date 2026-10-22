import type * as Types from "@bloxd";
type ButtonRegistration = { setting: Types.CustomButtonType, callback: () => void };

export class CustomButtonManager {
  protected playerId: Types.PlayerId;
  protected customButtons: Map<string, ButtonRegistration>;

  constructor(playerId: Types.PlayerId) {
    this.playerId = playerId;
    this.customButtons = new Map();
  }

  add(newSetting: ButtonRegistration): void {
    this.customButtons.set(newSetting.setting.id, newSetting);
    this.update();
  }

  update() {
    api.setClientOption(this.playerId, "customButtons", Array.from(this.customButtons.values(), e => e.setting))
  }

  handleOnPressKey(pressedKeyId: string): void {
    const button = this.customButtons.get(pressedKeyId);
    if (button) button.callback();
  }

  delete(id: string): boolean {
    const deleted = this.customButtons.delete(id);
    if (deleted) this.update();

    return deleted;
  }
}