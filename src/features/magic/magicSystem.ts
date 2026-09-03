import type * as Types from "@bloxd";
import { S } from "../../core/scheduler";

//子が絶対持ってるものは abstractで
//持ってるやつと持ってないやつがあるのは空実装にしてoverrideする

export abstract class MagicSystem {
  protected playerId: Types.PlayerId;
  protected abstract readonly itemName: string;
  public readonly schedulerTag: string;

  protected readonly MIN_CHARGE = [500, 2000] as const;
  protected slot = 0;
  protected charging = false;
  protected chargeStart = 0;
  protected cooldown = 0;
  protected currentMode: 0 | 1 = 0;
  protected crouching = false;

  constructor(playerId: Types.PlayerId) {
    this.playerId = playerId;
    this.schedulerTag = `magic:${this.playerId}`;
  }

  public deactivate(): void {
    this.cancelCharging();
    S.stop(this.schedulerTag);
  }

  protected switchMode(): void {
    this.currentMode = this.currentMode === 0 ? 1 : 0;
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

  protected startCharging(): void {
    if (this.charging) return;

    this.charging = true;
    this.chargeStart = api.now();
    this.startChargingAnimation();
    api.initiateMiddleScreenBar(this.playerId, 5000, true, 0);
    api.setClientOption(this.playerId, `runningSpeed`, 2);
    api.setClientOption(this.playerId, `walkingSpeed`, 2)
  }

  protected resetMovement(): void {
    api.setClientOption(this.playerId, "runningSpeed", 7);
    api.setClientOption(this.playerId, "walkingSpeed", 4);
  }

  protected startChargingAnimation() {
    S.stop(`cameraReset: ${this.playerId}`);
    api.setCameraZoom(this.playerId, 1);
    api.setClientOption(this.playerId, "cameraPositionOffset", [0, 1, 0]);

    api.animateEntity(this.playerId, {
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
    });
    S.run(() => {
      this.duringChargeAnimation()
    }, 16);
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
    api.animateEntity(this.playerId, {
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
    });

    S.run(() => {
      api.setCameraZoom(this.playerId, 0);
      api.setClientOptionToDefault(this.playerId, "cameraPositionOffset");
    }, 20, `cameraReset: ${this.playerId}`);
  }

  protected diffCharging(): number {
    return api.now() - this.chargeStart;
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

    this.charging = false;
    api.removeMiddleScreenBar(this.playerId);
    this.resetMovement();
  }

  public onEquip(): void {
    api.setClientOption(
      this.playerId,
      "touchscreenActionButton",
      [{ icon: this.itemName }]
    );
  }

  public onPlayerDeath(): void {
    this.cancelCharging();
    S.stop(this.schedulerTag);
    this.cooldown = api.now();
  }

  abstract castFirstSpell(chargeTime: number): void;
  abstract castSecondSpell(chargeTime: number): void;
  abstract tick: (...args: any[]) => void;
  abstract onPlayerAltAction: (...args: any[]) => void;
  abstract onPlayerClick: (...args: any[]) => void;
  abstract onPlayerClickUp: (...args: any[]) => void;
  abstract onTouchscreenActionButton: (...args: any[]) => void;
}