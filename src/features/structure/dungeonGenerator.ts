import { loadChunk, loadSchematic } from "src/core/structurePlacer/loadschematic";
import { DungeonEntrance } from "./dungeons/dungeonEntrance";
import { DungeonSource } from "./Dungeon";
import { Vec3 } from "src/core/types";
import Promise, { PolyfillPromise } from "src/core/api/promise";
import { getWorldData, setWorldData } from "src/core/api/dbHelper";

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
        promise = loadSchematic(source.path, origin, 32);
        break;

      case "copy":
        promise = this._placeDungeonWithCopyChunk(source, origin);
        break;
    }

    return promise.then(() => {
      this.dungeonType.onPlaced(origin);
      this._saveGeneratedChunk(regionKey);
    });
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
    if (!generatedChunks) return;

    setWorldData("generatedChunkKeys", `${generatedChunks},${regionKey}`);
  }
}