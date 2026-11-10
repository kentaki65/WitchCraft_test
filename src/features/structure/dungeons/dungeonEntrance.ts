import { randomNumber, randomUniqueNumber } from "src/utils/math";
import { Dungeon } from "../Dungeon";

export class DungeonEntrance extends Dungeon {
  constructor() {
    super({
      source: {
        type: "schematic",
        path: "dungeonEntrance.bloxdschem"
      },
      biomes: [], //["CherryForest"]
      y: 0,
      weight: 10,
      minDistance: 500,
      onPlaced: (origin) => {
        api.log("placed");
      }
    });

    this.chestPositions = (function () {
      const random = randomUniqueNumber(0, 45);
      
      return [{
        position: [-21, 0, -15],
        overrides: [
          {
            [random()]: {
              itemName: "Diamond Key",
              customDisplayName: "Dungeon Key",
              customDescription: "ダンジョンで何かを呼び出すために使う...",
              customAttributes: {
                isTrueDungeonKey: true,

              }
            }
          }
        ]
      }]
    })();

    this.spawnerPositions = [];
  }
}