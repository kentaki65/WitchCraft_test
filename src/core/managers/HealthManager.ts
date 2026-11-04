import * as Types from "@bloxd";
import { Vec3 } from "../types";
import { getDistance, normalize } from "src/utils/math";
import { setInterval, clearInterval } from "@plugins/helpers";
import { Biome } from "../worldgen/types";
import { world } from "./worldGenerator";

interface PlayerState {
  hunger: number,
  thirst: number,
  temp: number,
}

type ItemMetadata =
  | Partial<Types._TypeOf["BlockMetadataItem"]>
  | Partial<Types._TypeOf["NonBlockMetadataItem"]>;

function isNonBlockMetadata(
  meta: ItemMetadata
): meta is Partial<Types._TypeOf["NonBlockMetadataItem"]> {
  return "eatable" in meta;
}

//
export class SurvivalManager {
  private readonly playerId: Types.PlayerId;
  private readonly tempMin = -30;
  private readonly tempMax = 50;
  private readonly reach = 10;
  private readonly hungerDistance = 250;

  private readonly snowBallIcons = [
    "Red Paintball",
    "Orange Paintball",
    "Yellow Paintball",
    "Snowball",
    "Light Blue Paintball",
    "Cyan Paintball",
    "Blue Paintball"
  ];

  private readonly biomeTemperature: Record<Biome, number> = {
    Jungle: 32,
    Desert: 42,
    FrozenBadlandsPlains: -10,
    CactusDesert: 35,
    RedDesert: 48,
    Plains: 22,
    MaplePlains: 18,
    TallGrassPlains: 24,
    SnowyPlains: -8,
    Forest: 20,
    CherryForest: 19,
    PearForest: 21,
    AutumnForest: 14,
    PumpkinForest: 16,
    FrozenBadlandsForest: -12,
    PineForest: 8,
    SnowyPineForest: -15,
    RollingHills: 17,
    SnowyMountains: -25,
    BlueForest: 5,
  };

  private emptyLine_water: string;
  private emptyLine_hunger: string;
  private space_water: string;

  private count: number = 0;
  private traveledDistance = 0;

  private prevPos: Vec3;
  private playerState: PlayerState = {
    hunger: 8,
    thirst: 8,
    temp: 25,
  }

  constructor(playerId: Types.PlayerId, isMobile: boolean) {
    this.playerId = playerId;
    this.prevPos = api.getPosition(playerId);

    const pc_water = 18; const pc_hunger = 14;
    const mobile_water = 9; const mobile_hunger = 7;
    const space_pc = 18; const space_mobile = 9;

    this.emptyLine_water = this.makeRepeatString("\n", isMobile ? mobile_water : pc_water);
    this.emptyLine_hunger = this.makeRepeatString("\n", isMobile ? mobile_hunger : pc_hunger)
    this.space_water = this.makeRepeatString("\u3000", isMobile ? space_mobile : space_pc);

    setInterval(() => {
      this.count++;
      if (this.playerState.hunger === 8) {
        api.setClientOption(playerId, "healthRegenStartAfter", 0);
      } else {
        api.setClientOption(playerId, "healthRegenStartAfter", Number.MAX_SAFE_INTEGER);
      }

      // 100ms
      this.checkDistance();

      // 200ms
      if (this.count % 2 === 0) {
        this.updateUI();
      }

      // 300ms
      if (this.count % 3 === 0) {
        this.updateTemperature();
      }

      // 500ms
      if (this.count % 5 === 0) {
        this.updateTemperatureTint();
        this.updateSurvivalEffects();
      }

      // 5000ms
      if (
        this.count % 50 === 0 &&
        this.playerState.temp > 50 &&
        Math.random() < 0.5
      ) {
        this.updateStats("thirst", -1);
      }

      // 60000ms
      if (
        this.count % 600 === 0 &&
        Math.random() < 0.5
      ) {
        this.updateStats("thirst", -1);
      }

    }, 100, playerId);
  }

  setStats<K extends keyof PlayerState>(
    key: K,
    value: PlayerState[K]
  ): void {
    if (key === "hunger" || key === "thirst") {
      this.playerState[key] = Math.max(0, Math.min(8, value));
      return;
    }

    if (key === "temp") {
      this.playerState.temp = Math.max(
        this.tempMin,
        Math.min(this.tempMax, value)
      );
    }
  }

  updateStats<K extends keyof PlayerState>(
    key: K,
    delta: number
  ): void {
    this.setStats(key, this.playerState[key] + delta);
  }

  makeRepeatString(str: string, amount: number) {
    return str.repeat(amount);
  }

  makeIcons(
    count: number, max: number,
    fullIcon: Types.IngameIconName | Types.BlockName,
    emptyIcon: Types.IngameIconName | Types.BlockName
  ): Types.StyledIcon[] {
    return Array.from({ length: max }, (_, i) => ({
      icon: i < count ? fullIcon : emptyIcon,
      style: { fontSize: "40px" }
    } as Types.StyledIcon));
  }

  updateSurvivalEffects() {
    const thirstLow = this.playerState.thirst <= 3;
    const hungerLow = this.playerState.hunger <= 3;

    if (thirstLow && !hungerLow) {
      api.applyEffect(this.playerId, "Slowness", 2000, {
        inbuiltLevel: 8
      });
    } else if (!thirstLow && hungerLow) {
      api.applyEffect(this.playerId, "Weakness", 2000, {
        inbuiltLevel: 8
      });
    } else if (thirstLow && hungerLow) {
      api.attemptApplyDamage({
        eId: this.playerId,
        hitEId: this.playerId,
        attemptedDmgAmt: 5,
        withItem: "Dirt"
      });
    }
  }

  checkDistance(): void {
    const pos = api.getPosition(this.playerId);
    this.traveledDistance += getDistance(pos, this.prevPos);
    this.prevPos = pos;

    while (this.traveledDistance >= this.hungerDistance) {
      this.updateStats("hunger", -1);
      this.traveledDistance -= this.hungerDistance;
    }
  }

  updateTemperature() {
    const [x, _, z] = api.getPosition(this.playerId);
    const biome = world.getBiome(x, z);

    const targetTemp = this.biomeTemperature[biome];
    const currentTemp = this.playerState.temp;

    const difference = targetTemp - currentTemp;

    if (Math.abs(difference) < 0.1) this.setStats("temp", targetTemp);
    else this.updateStats("temp", difference * 0.1);
  }

  updateTemperatureTint() {
    const t = this.playerState.temp;
    const center = 25;
    let r = 0, g = 0, b = 0, a = 0;

    const chestplate = api.getItemSlot(this.playerId, 47);
    const hasHydrated = api.getEffects(this.playerId).includes("Hydrated");

    if (t > 40) {
      if (!hasHydrated) {
        api.applyEffect(this.playerId, "Heatstroke", 1000, { icon: "Heat Resistance" });
        api.attemptApplyDamage({ eId: this.playerId, hitEId: this.playerId, attemptedDmgAmt: 5, withItem: "Fireball" });
      }
    } else if (t < 0) {
      if (chestplate?.name !== "Fur Chestplate") {
        api.applyEffect(this.playerId, "Frostbite", 1000, { icon: "Frozen" });
        api.attemptApplyDamage({ eId: this.playerId, hitEId: this.playerId, attemptedDmgAmt: 5, withItem: "Iceball" });
      }
    }

    if (t > center) {
      const intensity = Math.min((t - center) / 40, 1);
      r = 1; g = 0.25; b = 0; a = 0.3 * intensity;
    } else if (t < center) {
      const intensity = Math.min((center - t) / 40, 1);
      r = 0; g = 0.5; b = 1; a = 0.3 * intensity;
    }

    api.setClientOption(this.playerId, "cameraTint", [r, g, b, a]);
  }

  updateHungerBar() {

  }

  updateThirstBar() {

  }

  updateUI() {
    // this.updateHungerBar();
    // this.updateThirstBar();
    const waterIcons = this.makeIcons(this.playerState.thirst, 8, "Water Bottle", "Empty Bottle");
    const foodIcons = this.makeIcons(this.playerState.hunger, 8, "Steak", "Ball");

    api.sendFlyingMiddleMessage(this.playerId, [
      this.emptyLine_water,
      ...waterIcons,
      { str: "\n" },
      ...foodIcons,
      this.space_water,
    ], 0, 250);

    const temp = this.playerState.temp;

    const idx = Math.round(
      (this.tempMax - temp) /
      ((this.tempMax - this.tempMin) / (this.snowBallIcons.length - 1))
    );

    const iconName = this.snowBallIcons[
      Math.max(0, Math.min(idx, this.snowBallIcons.length - 1))
    ];

    api.sendFlyingMiddleMessage(this.playerId, [
      this.emptyLine_hunger,
      { str: "\u3000\u3000" + Math.trunc(temp) + "\u2103\n", style: { fontSize: "20px" } },
      { icon: iconName, style: { fontSize: "120px" } },
    ], 0, 250);
  }

  onPlayerFinishChargingItem(playerId: Types.PlayerId, used: boolean, itemName: string, ...args: any[]) {
    if (!used) return;

    const meta = api.getInitialItemMetadata(itemName);
    if (!isNonBlockMetadata(meta)) return;

    const { eatHealAmt, afterEatenItem } = meta;
    if (eatHealAmt !== undefined) {
      const health = api.getHealth(playerId);
      if (health !== 100) {
        this.updateStats("hunger", 1);
        api.applyHealthChange(playerId, -eatHealAmt);
      } else {
        this.updateStats("hunger", 1);
      }
    } else if (afterEatenItem && itemName === "Water Bottle") {
      this.updateStats("thirst", 2);
    }
  }

  onPlayerAltAction(...args: any[]) {
    const thirst = this.playerState.thirst;
    if (thirst >= 8) return;

    const { camPos, dir } = api.getPlayerFacingInfo(this.playerId);
    const lookDir = normalize(dir);
    if (!lookDir) return;

    for (let i = 1; i <= this.reach; i++) {
      const pos = [
        Math.floor(camPos[0] + lookDir[0] * i),
        Math.floor(camPos[1] + lookDir[1] * i),
        Math.floor(camPos[2] + lookDir[2] * i)
      ];

      const blockName = api.getBlock(pos);

      if (blockName === "Water" && !api.getBlockSolidity(pos)) {
        this.updateStats("thirst", 1);
        api.playSound(this.playerId, "bucketFill3", 1, 1);
        break;
      }
    }
  }
}