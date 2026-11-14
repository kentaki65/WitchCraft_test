import type { Parameters } from "../../core/types";
import { PointGenerator } from "./PointGenerator";

export class DungeonManager {
  private pointGenerator: PointGenerator;

  constructor() {
    this.pointGenerator = new PointGenerator();
  }

  onPlayerRequestChunk(...args: Parameters<typeof onPlayerRequestChunk>){
    this.pointGenerator.onPlayerRequestChunk(...args);
  }  
}