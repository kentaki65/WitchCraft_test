import type * as Types from "@bloxd";
import { setInterval, clearInterval, setTimeout, TimeoutId, clearTimeout, IntervalId } from "@plugins/helpers";
import { asyncAnimate } from "../../core/api/animateHelper";
import { CustomButtonManager } from "../../core/managers/KeyManager";
import { MagicButtonKeyId, magicButtonKeyIds } from "./magicManager";

//子が絶対持ってるものは abstractで
//持ってるやつと持ってないやつがあるのは空実装にしてoverrideする

export type RodSettings =
  | {
    useThirdParsonView: boolean;
    needCharge: false;
    minCharge?: number;
  }
  | {
    useThirdParsonView: boolean;
    needCharge: true;
    minCharge: number;
  };

export abstract class MagicSystem<TSkill extends number = number> {
  protected playerId: Types.PlayerId;

  public timeoutId: TimeoutId;
  public intervalId: IntervalId;

  protected abstract readonly itemName: string;
  protected abstract readonly rodSettings: Record<TSkill, RodSettings>;
  protected abstract readonly skills: readonly TSkill[];

  protected slot = 0;
  protected charging = false;
  protected chargeStart = 0;
  protected cooldown = 0;
  protected currentMode: TSkill;
  protected crouching = false;
  protected keyManager: CustomButtonManager;

  constructor(playerId: Types.PlayerId, initialMode: TSkill, keyManager: CustomButtonManager) {
    this.currentMode = initialMode;
    this.playerId = playerId;
    this.keyManager = keyManager;
  }

  public deactiveButton(id: MagicButtonKeyId): void {
    this.keyManager.delete(id);
  }

  public deactivate(): void {
    api.log("what is this?");
    
    api.log("1: cancelCharging start");
    this.cancelCharging();
    api.log("2: cancelCharging end");

    api.log("3: animateEntity start");
    api.animateEntity(this.playerId, {
      loop: false,
      animationDurationMs: 1,
      nodeAnimations: {
        ArmRightMesh: {
          timeline: [
            {
              timeFraction: 0,
              rotation: {
                lerpMode: "catmull-rom-spline",
                point: [0, 0, 0]
              }
            },
          ]
        }
      }
    });
    api.log("4: animateEntity end");

    this.clearTimers();
    api.log("5: clearTimers end");
  }

  protected switchMode(): void {
    const index = this.skills.indexOf(this.currentMode);
    const nextIndex = (index + 1) % this.skills.length;

    this.currentMode = this.skills[nextIndex];
  }

  protected isCrouching(): boolean {
    return api.isPlayerCrouching(this.playerId);
  }

  calcPoint(chargeTime: number): number {
    const point = Math.min(20, Math.floor(chargeTime / 250));
    return point;
  }

  calcDamage(chargeTime: number): number {
    const damage = Math.min(100, 10 + Math.floor(chargeTime / 1000) * 5);
    return damage;
  }

  protected updateCrouching(): void {
    const crouching = this.isCrouching();
    if (crouching && !this.crouching) {
      this.switchMode();
    }

    this.crouching = crouching;
  }

  protected getChargeColor(chargeTime: number): string {
    const level = Math.min(8, Math.floor(chargeTime / 500));
    return ["white", "white", "lime", "lime", "yellow", "yellow", "orange", "orange", "red"][level];
  }

  protected startCharging(useThirdParsonView: boolean): void {
    if (this.charging) return;

    this.charging = true;
    this.chargeStart = api.now();
    this.startChargingAnimation(useThirdParsonView);
    api.initiateMiddleScreenBar(this.playerId, 5000, true, 0);
    api.setClientOption(this.playerId, `runningSpeed`, 2);
    api.setClientOption(this.playerId, `walkingSpeed`, 2)
  }

  protected resetMovement(): void {
    api.log("remove movement")
    api.setClientOption(this.playerId, "runningSpeed", 7);
    api.setClientOption(this.playerId, "walkingSpeed", 4);
  }

  protected startChargingAnimation(useThirdParsonView: boolean) {
    api.setCameraZoom(this.playerId, 1);
    api.setClientOption(this.playerId, "cameraPositionOffset", [0, 1, 0]);

    asyncAnimate(this.playerId, {
      loop: false,
      animationDurationMs: 800,
      nodeAnimations: {
        ArmRightMesh: {
          timeline: [
            {
              timeFraction: 0,
              rotation: {
                lerpMode: "catmull-rom-spline",
                point: [0, 0, 0]
              }
            },
            {
              timeFraction: 0.6,
              rotation: {
                lerpMode: "catmull-rom-spline",
                point: [-0.8, 0.5, -0.3]
              }
            },
            {
              timeFraction: 1,
              rotation: {
                lerpMode: "catmull-rom-spline",
                // 甲を合わせる
                point: [-1.2, 0.8, -0.5]
              }
            }
          ]
        },

        ArmLeftMesh: {
          timeline: [
            {
              timeFraction: 0,
              rotation: {
                lerpMode: "catmull-rom-spline",
                point: [0, 0, 0]
              }
            },
            {
              timeFraction: 0.6,
              rotation: {
                lerpMode: "catmull-rom-spline",
                point: [-0.8, -0.5, 0.3]
              }
            },
            {
              timeFraction: 1,
              rotation: {
                lerpMode: "catmull-rom-spline",
                // 甲を合わせる
                point: [-1.2, -0.8, 0.5]
              }
            }
          ]
        }
      }
    }).then(() => {
      this.duringChargeAnimation()
    })
  }

  protected duringChargeAnimation() {
    api.animateEntity(this.playerId, {
      loop: true,
      animationDurationMs: 1200,
      nodeAnimations: {
        ArmRightMesh: {
          timeline: [
            {
              timeFraction: 0,
              rotation: {
                lerpMode: "catmull-rom-spline",
                point: [-1.2, 0.8, -0.5]
              }
            },
            {
              timeFraction: 0.25,
              rotation: {
                lerpMode: "catmull-rom-spline",
                // 右手：上
                point: [-1.0, 0.8, -0.5]
              }
            },
            {
              timeFraction: 0.5,
              rotation: {
                lerpMode: "catmull-rom-spline",
                // 右手：下
                point: [-1.4, 0.8, -0.5]
              }
            },
            {
              timeFraction: 0.75,
              rotation: {
                lerpMode: "catmull-rom-spline",
                // 右手：上
                point: [-1.0, 0.8, -0.5]
              }
            },
            {
              timeFraction: 1,
              rotation: {
                lerpMode: "catmull-rom-spline",
                // 右手：下
                point: [-1.4, 0.8, -0.5]
              }
            }
          ]
        },

        ArmLeftMesh: {
          timeline: [
            {
              timeFraction: 0,
              rotation: {
                lerpMode: "catmull-rom-spline",
                point: [-1.2, -0.8, 0.5]
              }
            },
            {
              timeFraction: 0.25,
              rotation: {
                lerpMode: "catmull-rom-spline",
                // 左手：下
                point: [-1.4, -0.8, 0.5]
              }
            },
            {
              timeFraction: 0.5,
              rotation: {
                lerpMode: "catmull-rom-spline",
                // 左手：上
                point: [-1.0, -0.8, 0.5]
              }
            },
            {
              timeFraction: 0.75,
              rotation: {
                lerpMode: "catmull-rom-spline",
                // 左手：下
                point: [-1.4, -0.8, 0.5]
              }
            },
            {
              timeFraction: 1,
              rotation: {
                lerpMode: "catmull-rom-spline",
                // 左手：上
                point: [-1.0, -0.8, 0.5]
              }
            }
          ]
        }
      }
    });
  }

  protected finishChargingAnimation() {
    asyncAnimate(this.playerId, {
      loop: false,
      animationDurationMs: 1200,
      nodeAnimations: {
        ArmRightMesh: {
          timeline: [
            {
              timeFraction: 0,
              rotation: {
                lerpMode: "catmull-rom-spline",
                // 溜めた状態
                point: [-1.3, 0.8, -0.5]
              }
            },
            {
              timeFraction: 0.25,
              rotation: {
                lerpMode: "catmull-rom-spline",
                // 一瞬引いて力を溜める
                point: [-1.6, 0.9, -0.6]
              }
            },
            {
              timeFraction: 0.5,
              rotation: {
                lerpMode: "catmull-rom-spline",
                // 一気に前へ振り出す
                point: [-2.4, 0.2, -0.7]
              }
            },
            {
              timeFraction: 0.7,
              rotation: {
                lerpMode: "catmull-rom-spline",
                // 魔法を撃ち出した状態
                point: [-2.8, 0.0, -0.8]
              }
            },
            {
              timeFraction: 1,
              rotation: {
                lerpMode: "catmull-rom-spline",
                // 反動で少し戻す
                point: [-2.5, 0.1, -0.7]
              }
            }
          ]
        },

        ArmLeftMesh: {
          timeline: [
            {
              timeFraction: 0,
              rotation: {
                lerpMode: "catmull-rom-spline",
                // 溜めた状態
                point: [-1.3, -0.8, 0.5]
              }
            },
            {
              timeFraction: 0.25,
              rotation: {
                lerpMode: "catmull-rom-spline",
                // 一瞬引いて力を溜める
                point: [-1.6, -0.9, 0.6]
              }
            },
            {
              timeFraction: 0.5,
              rotation: {
                lerpMode: "catmull-rom-spline",
                // 一気に前へ振り出す
                point: [-2.4, -0.2, 0.7]
              }
            },
            {
              timeFraction: 0.7,
              rotation: {
                lerpMode: "catmull-rom-spline",
                // 魔法を撃ち出した状態
                point: [-2.8, 0.0, 0.8]
              }
            },
            {
              timeFraction: 1,
              rotation: {
                lerpMode: "catmull-rom-spline",
                // 反動で少し戻す
                point: [-2.5, -0.1, 0.7]
              }
            }
          ]
        }
      }
    }).then(() => {
      api.setCameraZoom(this.playerId, 0);
      api.setClientOptionToDefault(this.playerId, "cameraPositionOffset");
    })
  }

  protected diffCharging(): number {
    return api.now() - this.chargeStart;
  }

  protected clearTimers(): void {
    api.log("cleared timers")
    //if (this.timeoutId) clearTimeout(this.timeoutId);
    //if (this.intervalId) clearInterval(this.intervalId);
  }

  protected stopCharging(): number | undefined {
    if (!this.charging) return undefined;

    this.charging = false;
    this.resetMovement();
    this.finishChargingAnimation();
    return this.diffCharging();
  }

  public cancelCharging(): void {
    if (!this.charging) return;

    api.log("cancel charging")
    this.charging = false;
    api.removeMiddleScreenBar(this.playerId);
    this.resetMovement();
  }

  public onEquip(): void {
    this.deactiveButton(magicButtonKeyIds.switchMagic);

    api.setClientOption(
      this.playerId,
      "touchscreenActionButton",
      [{ icon: this.itemName }]
    );
  }

  public onPlayerDeath(): void {
    this.cancelCharging();
    this.clearTimers();
    this.cooldown = api.now();
  }

  onPlayerPressedButton(buttonId: string): void {
    if (buttonId === magicButtonKeyIds.switchMagic) this.switchMode();
  }

  onPlayerClick(): void {
    this.startCharging(this.rodSettings[this.currentMode].useThirdParsonView);
  }

  onPlayerClickUp(): void {
    const chargeTime = this.stopCharging();
    if (chargeTime === undefined || chargeTime < (this.rodSettings[this.currentMode]?.minCharge || 0)) return;

    if (!this.crouching) this.castFirstSpell(chargeTime);
    else this.castSecondSpell(chargeTime);
  }

  onPlayerAltAction(): void {
    this.startCharging(this.rodSettings[this.currentMode].useThirdParsonView);
  }

  onTouchscreenActionButton(playerId: Types.PlayerId, touchDown: boolean): void {
    if (touchDown) {
      this.startCharging(this.rodSettings[this.currentMode].useThirdParsonView);
    } else {
      const chargeTime = this.stopCharging();
      if (chargeTime === undefined || chargeTime < (this.rodSettings[this.currentMode]?.minCharge || 0)) return;

      if (!this.crouching) this.castFirstSpell(chargeTime);
      else this.castSecondSpell(chargeTime);
    }
  }

  tick(): void {
    this.updateCrouching();
    if (!this.charging) return;

    const chargeTime = this.diffCharging();
    const color = this.getChargeColor(chargeTime);

    api.shakePlayerCamera(this.playerId, chargeTime / 1e5, 50);
    api.sendFlyingMiddleMessage(this.playerId, [
      { icon: `fa-solid fa-crosshairs`, style: { color, opacity: 0.3 } },
      { str: `\n`.repeat(3) }
    ], 0, 100)

    if (chargeTime > 5000) {
      if (!this.crouching) this.castFirstSpell(chargeTime);
      else this.castSecondSpell(chargeTime);

      this.chargeStart = api.now();
      api.initiateMiddleScreenBar(this.playerId, 5000, true, 0)
      api.setClientOption(this.playerId, `runningSpeed`, 2);
      api.setClientOption(this.playerId, `walkingSpeed`, 2);
    }
  }

  abstract castFirstSpell(chargeTime: number): void;
  abstract castSecondSpell(chargeTime: number): void;
}