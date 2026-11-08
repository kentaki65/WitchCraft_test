import { Dungeon } from "../Dungeon";

export class DungeonEntrance extends Dungeon {
  constructor(){
    super({
      source: {
        type: "schematic",
        path: "dungeonEntrance.bloxdschem"
      },
      biomes: [],
      y: 0,
      weight: 10,
      minDistance: 500,
      onPlaced: (origin) => {

      }
    });

    this.chestPositions = [];
    this.spawnerPositions = [];
  }
}