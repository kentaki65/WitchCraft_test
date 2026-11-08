import Promise from "../api/promise";
import { PolyfillPromise, PromiseLike as CustomPromiseLike } from "../api/promise";
import { forceLoadChunk, setTimeout } from "@plugins/helpers";
import { TICK_CONFIG } from "../constance";
import { world } from "../managers/worldGenerator";
import { SchematicName } from "../types";

type Vec3 = [number, number, number];

interface TerrainColumns {
  indexes: Int32Array[];
  newHeights: Int32Array[];
  maxHeights: Int32Array[];
  count: number;
}

interface ChunkCopies {
  positions: Int32Array[];
  count: number;
  minChunk: Vec3;
}

const TEMP_ORIGIN: Vec3 = [-1024, -512, -1024];
const TERRAIN_MARGIN = 16;
const DEFAULT_TERRAIN_DEPTH = 32;
const DATA_PAGE_SIZE = 4096;

let placementInProgress = false;

function chunkStart(coordinate: number): number {
  return Math.floor(coordinate / 32) * 32;
}

function chunkKey(x: number, y: number, z: number): string {
  return `${x},${y},${z}`;
}

function pagedValue(pages: Int32Array[], index: number, pageSize: number): number {
  return pages[Math.floor(index / pageSize)][index % pageSize];
}

function loadChunk(x: number, y: number, z: number): CustomPromiseLike<void> {
  return new Promise<void>((resolve, reject) => {
    try {
      forceLoadChunk(x, y, z, resolve);
    } catch (error: unknown) {
      reject(error);
    }
  });
}

function copyChunks(copies: ChunkCopies, reverse: boolean): CustomPromiseLike<void> {
  return new Promise<void>((resolve, reject) => {
    let index = 0;
    const copyNext = (): void => {
      if (index >= copies.count) {
        resolve();
        return;
      }

      const pageIndex = Math.floor(index / DATA_PAGE_SIZE);
      const positionIndex = index % DATA_PAGE_SIZE * 3;
      const source: Vec3 = [
        copies.positions[pageIndex][positionIndex],
        copies.positions[pageIndex][positionIndex + 1],
        copies.positions[pageIndex][positionIndex + 2],
      ];
      const temporary: Vec3 = [
        TEMP_ORIGIN[0] + source[0] - copies.minChunk[0],
        TEMP_ORIGIN[1] + source[1] - copies.minChunk[1],
        TEMP_ORIGIN[2] + source[2] - copies.minChunk[2],
      ];
      Promise.all([
        loadChunk(source[0], source[1], source[2]),
        loadChunk(temporary[0], temporary[1], temporary[2]),
      ]).then(() => {
        try {
          if (reverse) api.copyChunk(temporary, source);
          else api.copyChunk(source, temporary);
          index++;
          setTimeout(copyNext, 0);
        } catch (error: unknown) {
          reject(error);
        }
      }, reject);
    };
    copyNext();
  });
}

function terrainColumns(
  origin: Vec3,
  width: number,
  schemaDepth: number,
  targetY: number,
  depth: number,
  heights: Int32Array,
  minX: number,
  minZ: number,
  sizeZ: number,
): CustomPromiseLike<TerrainColumns> {
  const [originX, , originZ] = origin;
  const buildingMaxX = originX + width - 1;
  const buildingMaxZ = originZ + schemaDepth - 1;
  const indexes: Int32Array[] = [];
  const newHeights: Int32Array[] = [];
  const maxHeights: Int32Array[] = [];
  let count = 0;
  const maxX = originX + width + TERRAIN_MARGIN - 1;
  const maxZ = originZ + schemaDepth + TERRAIN_MARGIN - 1;

  return new Promise<TerrainColumns>((resolve, reject) => {
    let x = minX;
    let z = minZ;
    const processBatch = (): void => {
      try {
        let processed = 0;
        const deadline = Date.now() + TICK_CONFIG.executionBudgetMs;
        while (
          x <= maxX &&
          processed < TICK_CONFIG.preparationItemsPerTick &&
          Date.now() < deadline
        ) {
          const originalHeight = heights[(x - minX) * sizeZ + z - minZ];
          const dx = x < originX ? originX - x : x > buildingMaxX ? x - buildingMaxX : 0;
          const dz = z < originZ ? originZ - z : z > buildingMaxZ ? z - buildingMaxZ : 0;
          const distance = Math.sqrt(dx * dx + dz * dz);
          const t = Math.min(distance / TERRAIN_MARGIN, 1);
          const smoothT = t * t * (3 - 2 * t);
          const newHeight = Math.round(targetY + (originalHeight - targetY) * smoothT);

          if (newHeight !== originalHeight && Math.max(originalHeight, newHeight) >= targetY - depth) {
            const pageIndex = Math.floor(count / DATA_PAGE_SIZE);
            const pageOffset = count % DATA_PAGE_SIZE;
            if (pageOffset === 0) {
              indexes.push(new Int32Array(DATA_PAGE_SIZE));
              newHeights.push(new Int32Array(DATA_PAGE_SIZE));
              maxHeights.push(new Int32Array(DATA_PAGE_SIZE));
            }
            indexes[pageIndex][pageOffset] = (x - minX) * sizeZ + z - minZ;
            newHeights[pageIndex][pageOffset] = newHeight;
            maxHeights[pageIndex][pageOffset] = Math.max(originalHeight, newHeight);
            count++;
          }

          processed++;
          z++;
          if (z > maxZ) {
            z = minZ;
            x++;
          }
        }

        if (x > maxX) {
          resolve({
            indexes,
            newHeights,
            maxHeights,
            count,
          });
          return;
        }
        setTimeout(processBatch, 0);
      } catch (error: unknown) {
        reject(error);
      }
    };
    processBatch();
  });
}

function makeChunkCopies(
  columns: TerrainColumns,
  minX: number,
  minZ: number,
  sizeZ: number,
  minY: number,
): CustomPromiseLike<{
  copies: ChunkCopies;
}> {
  return new Promise((resolve, reject) => {
    const sourceChunks = new Map<string, Vec3>();
    let minChunkX = Infinity;
    let minChunkY = Infinity;
    let minChunkZ = Infinity;
    let sourceIterator: Iterator<Vec3> | undefined;
    let phase: "collect" | "measure" | "map" = "collect";
    let columnIndex = 0;
    let currentColumnLoaded = false;
    let currentChunkY = 0;
    let currentChunkMaxY = 0;
    let currentChunkX = 0;
    let currentChunkZ = 0;
    let sourceDone = false;
    const positions: Int32Array[] = [];
    let copyIndex = 0;

    const processBatch = (): void => {
      try {
        let processed = 0;
        const deadline = Date.now() + TICK_CONFIG.executionBudgetMs;
        if (phase === "collect") {
          while (
            columnIndex < columns.count &&
            processed < TICK_CONFIG.preparationItemsPerTick &&
            Date.now() < deadline
          ) {
            if (!currentColumnLoaded) {
              const columnIndexInMap = pagedValue(columns.indexes, columnIndex, DATA_PAGE_SIZE);
              const x = minX + Math.floor(columnIndexInMap / sizeZ);
              const z = minZ + columnIndexInMap % sizeZ;
              currentChunkX = chunkStart(x);
              currentChunkZ = chunkStart(z);
              currentChunkY = chunkStart(minY);
              currentChunkMaxY = chunkStart(pagedValue(columns.maxHeights, columnIndex, DATA_PAGE_SIZE));
              currentColumnLoaded = true;
            }
            sourceChunks.set(
              chunkKey(currentChunkX, currentChunkY, currentChunkZ),
              [currentChunkX, currentChunkY, currentChunkZ],
            );
            currentChunkY += 32;
            processed++;
            if (currentChunkY > currentChunkMaxY) {
              currentColumnLoaded = false;
              columnIndex++;
            }
          }

          if (columnIndex < columns.count) {
            setTimeout(processBatch, 0);
            return;
          }
          sourceIterator = sourceChunks.values();
          phase = "measure";
          processed = 0;
        }

        if (phase === "measure") {
          while (
            processed < TICK_CONFIG.preparationItemsPerTick &&
            Date.now() < deadline &&
            !sourceDone
          ) {
            const next = sourceIterator?.next();
            if (next === undefined || next.done) {
              sourceDone = true;
              break;
            }
            const source = next.value;
            minChunkX = Math.min(minChunkX, source[0]);
            minChunkY = Math.min(minChunkY, source[1]);
            minChunkZ = Math.min(minChunkZ, source[2]);
            processed++;
          }
          if (!sourceDone) {
            setTimeout(processBatch, 0);
            return;
          }
          if (minChunkX === Infinity) {
            resolve({
              copies: { positions, count: 0, minChunk: [0, 0, 0] },
            });
            sourceChunks.clear();
            return;
          }
          phase = "map";
          processed = 0;
          sourceIterator = sourceChunks.values();
          sourceDone = false;
        }

        while (
          processed < TICK_CONFIG.preparationItemsPerTick &&
          Date.now() < deadline &&
          !sourceDone
        ) {
          const next = sourceIterator?.next();
          if (next === undefined || next.done) {
            sourceDone = true;
            break;
          }
          const source = next.value;
          const pageIndex = Math.floor(copyIndex / DATA_PAGE_SIZE);
          const pageOffset = copyIndex % DATA_PAGE_SIZE * 3;
          if (pageOffset === 0) positions.push(new Int32Array(DATA_PAGE_SIZE * 3));
          positions[pageIndex][pageOffset] = source[0];
          positions[pageIndex][pageOffset + 1] = source[1];
          positions[pageIndex][pageOffset + 2] = source[2];
          copyIndex++;
          processed++;
        }

        if (sourceDone) {
          sourceChunks.clear();
          resolve({
            copies: {
              positions,
              count: copyIndex,
              minChunk: [minChunkX, minChunkY, minChunkZ],
            },
          });
          return;
        }
        setTimeout(processBatch, 0);
      } catch (error: unknown) {
        reject(error);
      }
    }
    processBatch();
  });
}

function regenerateTerrain(
  columns: TerrainColumns,
  minChunk: Vec3,
  minX: number,
  minZ: number,
  sizeZ: number,
  minY: number,
): CustomPromiseLike<void> {
  const blockNames = new Map<number, string>();
  const maxRectRunLength = 359;
  let columnIndex = 0;
  let y = minY;
  let columnX = 0;
  let columnZ = 0;
  let columnMaxY = 0;
  let columnGenerator: ((y: number) => number) | undefined;
  let runStartY = 0;
  let runEndY = 0;
  let runBlockName: string | undefined;
  let runTemporaryX = 0;
  let runTemporaryZ = 0;
  let runX = 0;
  let runZ = 0;

  const loadColumn = (): void => {
    const mapIndex = pagedValue(columns.indexes, columnIndex, DATA_PAGE_SIZE);
    columnX = minX + Math.floor(mapIndex / sizeZ);
    columnZ = minZ + mapIndex % sizeZ;
    columnMaxY = pagedValue(columns.maxHeights, columnIndex, DATA_PAGE_SIZE);
    y = minY;
    columnGenerator = world.TerrainBlocks.createColumnGenerator(
      columnX,
      columnZ,
      pagedValue(columns.newHeights, columnIndex, DATA_PAGE_SIZE),
    );
  };

  if (columns.count > 0) loadColumn();

  return new Promise<void>((resolve, reject) => {
    const flushRun = (): void => {
      if (runBlockName === undefined) return;
      api.setBlockRect(
        [runTemporaryX, TEMP_ORIGIN[1] + runStartY - minChunk[1], runTemporaryZ],
        [runTemporaryX, TEMP_ORIGIN[1] + runEndY - minChunk[1], runTemporaryZ],
        runBlockName,
      );
      runBlockName = undefined;
    };

    const processBatch = (): void => {
      try {
        let processed = 0;
        let rectanglesPlaced = 0;
        const deadline = Date.now() + TICK_CONFIG.executionBudgetMs;
        while (
          columnIndex < columns.count &&
          processed < TICK_CONFIG.terrainBlocksPerTick &&
          rectanglesPlaced < TICK_CONFIG.terrainRectanglesPerTick &&
          Date.now() < deadline
        ) {
          if (columnGenerator === undefined) loadColumn();
          const blockId = columnGenerator!(y);
          let blockName = blockNames.get(blockId);
          if (blockName === undefined) {
            blockName = api.blockIdToBlockName(blockId);
            blockNames.set(blockId, blockName);
          }

          const temporaryX = TEMP_ORIGIN[0] + columnX - minChunk[0];
          const temporaryZ = TEMP_ORIGIN[2] + columnZ - minChunk[2];
          const sameColumn = runX === columnX && runZ === columnZ;
          if (
            runBlockName !== undefined &&
            (!sameColumn || runBlockName !== blockName || runEndY - runStartY + 1 >= maxRectRunLength)
          ) {
            flushRun();
            rectanglesPlaced++;
          }

          if (runBlockName === undefined) {
            runStartY = y;
            runEndY = y;
            runBlockName = blockName;
            runTemporaryX = temporaryX;
            runTemporaryZ = temporaryZ;
            runX = columnX;
            runZ = columnZ;
          } else {
            runEndY = y;
          }

          y++;
          processed++;
          if (y > columnMaxY) {
            columnGenerator = undefined;
            columnIndex++;
            if (columnIndex < columns.count) loadColumn();
          }
        }
        if (columnIndex >= columns.count) {
          if (runBlockName !== undefined) {
            if (rectanglesPlaced >= TICK_CONFIG.terrainRectanglesPerTick) {
              setTimeout(processBatch, 0);
              return;
            }
            flushRun();
          }
          resolve();
          return;
        }
        setTimeout(processBatch, 0);
      } catch (error: unknown) {
        reject(error);
      }
    };
    processBatch();
  });
}

function placeSchematicChunks(path: string, origin: Vec3, dimensions: Vec3): CustomPromiseLike<void> {
  const [width, height, depth] = dimensions;
  return new Promise<void>((resolve, reject) => {
    let x = 0;
    let y = 0;
    let z = 0;
    const placeNext = (): void => {
      try {
        api.setChunkAsSchematic(path, [x, y, z], [origin[0] + x, origin[1] + y, origin[2] + z]);
        z += 32;
        if (z >= depth) {
          z = 0;
          y += 32;
        }
        if (y >= height) {
          y = 0;
          x += 32;
        }
        if (x >= width) {
          resolve();
          return;
        }
        setTimeout(placeNext, 0);
      } catch (error: unknown) {
        reject(error);
      }
    }
    placeNext();
  });
}

export function loadSchematic(
  path: SchematicName,
  origin: Vec3,
  terrainDepth = DEFAULT_TERRAIN_DEPTH,
): PolyfillPromise<void> {
  if (placementInProgress) return Promise.reject(new Error("A structure placement is already in progress"));
  placementInProgress = true;

  return new Promise<void>((resolve, reject) => {
    try {
      const dimensions = api.getSchematicDimensions(path);
      const [width, height, schemaDepth] = dimensions;
      const [originX, originY, originZ] = origin;
      if (
        !dimensions.every(value => Number.isInteger(value) && value > 0) ||
        !origin.every(value => Number.isInteger(value)) ||
        origin.some(value => value % 32 !== 0) ||
        !Number.isInteger(terrainDepth) ||
        terrainDepth < 0
      ) {
        throw new TypeError("Invalid schematic dimensions, origin, or terrain depth");
      }

      const minX = originX - TERRAIN_MARGIN;
      const maxX = originX + width + TERRAIN_MARGIN - 1;
      const minZ = originZ - TERRAIN_MARGIN;
      const maxZ = originZ + schemaDepth + TERRAIN_MARGIN - 1;
      const targetY = originY - 1;

      world.async.getHeightMap({ min: [minX, minZ], max: [maxX, maxZ] })
        .then((heights: Int32Array) => {
        const sizeZ = maxZ - minZ + 1;
        return terrainColumns(
          origin,
          width,
          schemaDepth,
          targetY,
          terrainDepth,
          heights,
          minX,
          minZ,
          sizeZ,
        ).then(columns => {
          return makeChunkCopies(columns, minX, minZ, sizeZ, targetY - terrainDepth).then(({ copies }) =>
            copyChunks(copies, false)
              .then(() => regenerateTerrain(
                columns,
                copies.minChunk,
                minX,
                minZ,
                sizeZ,
                targetY - terrainDepth,
              ))
              .then(() => copyChunks(copies, true))
              .then(() => placeSchematicChunks(path, origin, dimensions)),
          );
        });
      })
        .then(resolve, reject);
    } catch (error: unknown) {
      reject(error);
    }
  }).finally(() => {
    placementInProgress = false;
  });
}