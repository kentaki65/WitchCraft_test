import { loadChunk, loadSchematic } from "src/core/structurePlacer/loadschematic";
import { DungeonEntrance } from "./dungeons/dungeonEntrance";
import { DungeonSource } from "./Dungeon";
import { Vec3 } from "src/core/types";
import Promise, { PolyfillPromise } from "src/core/api/promise";
import { getWorldData, setWorldData } from "src/core/api/dbHelper";
import { getLootChestContents } from "../lootchest/LootChest";
import { Rarity } from "../lootchest/types";

export type DungeonType = DungeonEntrance;

export class DungeonGenerator {
  private dungeonType: DungeonType;

  constructor(dungeon: DungeonType) {
    this.dungeonType = dungeon;
  }

  placeDungeon(regionKey: string, origin: Vec3): PolyfillPromise<void> {
    const source = this.dungeonType.source;
    let promise: PolyfillPromise<void>;

    switch (source.type) {
      case "schematic":
        api.log("loadschematic", origin)
        promise = loadSchematic(source.path, origin, 32);
        break;

      case "copy":
        promise = this._placeDungeonWithCopyChunk(source, origin);
        break;
    }

    return promise.then(() => {
      this.dungeonType.onPlaced(origin);
      this._placeChestContents(origin);

      this._saveGeneratedChunk(regionKey);
    })
  }

  private _placeDungeonWithCopyChunk(
    source: Extract<DungeonSource, { type: "copy" }>,
    origin: Vec3,
  ): PolyfillPromise<void> {
    const size = source.size;
    const fromPos = origin;

    const toPos = [0, 0, 0];

    return new Promise<void>((resolve, reject) => {
      const fromChunks: Vec3[] = [];
      const toChunks: Vec3[] = [];

      let x = 0;
      let y = 0;
      let z = 0;

      while (x < size[0]) {
        fromChunks.push([
          fromPos[0] + x * 32,
          fromPos[1] + y * 32,
          fromPos[2] + z * 32
        ]);

        toChunks.push([
          toPos[0] + x * 32,
          toPos[1] + y * 32,
          toPos[2] + z * 32
        ]);

        z++;
        if (z >= size[2]) {
          z = 0;
          y++;
          if (y >= size[1]) {
            y = 0;
            x++;
          }
        }
      }

      Promise.all([
        ...fromChunks.map(pos => loadChunk(...pos)),
        ...toChunks.map(pos => loadChunk(...pos))
      ]).then(() => {
        for (let i = 0; i < fromChunks.length; i++) {
          api.copyChunk(fromChunks[i], toChunks[i]);
        }
        resolve();
      }).catch(reject);
    });
  }

  private _saveGeneratedChunk(regionKey: string) {
    //`${regionX}|${regionZ}`のような形式が返ってくる
    const generatedChunks = getWorldData("generatedChunkKeys");
    if (!generatedChunks) {
      setWorldData("generatedChunkKeys", regionKey);
    };

    setWorldData("generatedChunkKeys", `${generatedChunks},${regionKey}`);
  }

  private _placeChestContents(origin: Vec3) {
    if (!this.dungeonType.chestPositions) return;
    const chest = this.dungeonType.chestPositions;

    for (const { position, overrides } of chest) {
      const worldPos: Vec3 = [
        origin[0] - position[0],
        position[1] + origin[1],
        origin[2] - position[2],
      ];
      loadChunk(...worldPos).then(() => {
        const block = api.getBlock(worldPos);
        api.log(block);

        if (block !== "Chest") {
          api.log(worldPos);
          api.setBlock(worldPos, "Chest")
        }

        const chestContents = getLootChestContents({ pos: worldPos, quality: Rarity.EPIC });

        api.setBlockData(...worldPos, {
          persisted: {
            chestStr: JSON.stringify(chestContents)
          }
        });

        for (const override of overrides) {
          Object.entries(override).forEach(([index, attr]) => {
            api.setStandardChestItemSlot(worldPos, Number(index), attr.itemName, 1, undefined, {
              customDisplayName: attr.customDisplayName,
              customDescription: attr.customDescription,
              //customAttributes: attr.customAttributes
            })
          })
        }
      })
    }
  }
}