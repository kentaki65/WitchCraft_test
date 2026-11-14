import type * as Types from "@bloxd";
import type { PlayerDbKeys, PlayerData, WorldDbKeys, WorldData } from "../types";

/**
 * データを JSONにしてLobbyDbに保存します
 * 新しい保存キーを追加する場合は `WorldData` にプロパティを追加してください
 * `WorldDbKeys` は `WorldData` のキーから自動的に決まります
 *
 * @param key 保存するワールドデータのキー
 * @param data キーに対応するデータ
 */
export function setWorldData<K extends WorldDbKeys>(
  key: K, data: WorldData[K]
): void {
  const json = JSON.stringify(data);
  api.setLobbyDbValue(key, json);
}

/**
 * 保存済みのワールドデータを取得します
 * キーが存在しない場合や保存値を JSON として解析できない場合は `undefined` を返します
 *
 * @param key 取得するワールドデータのキー
 * @returns キーに対応するデータ。取得または解析できない場合は `undefined`
 */
export function getWorldData<K extends WorldDbKeys>(
  key: K
): WorldData[K] | undefined {
  const raw = api.getLobbyDbValue(key);
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as WorldData[K]
    } catch {
      return undefined;
    }
  }

  return undefined;
}

/**
 * プレイヤーデータを JSON にして保存します
 * 新しい保存キーを追加する場合は `PlayerData` にプロパティを追加してください。
 * `PlayerDbKeys` は `PlayerData` のキーから自動的に決まります。
 *
 * @param playerId 対象プレイヤーの ID
 * @param key 保存するプレイヤーデータのキー
 * @param data キーに対応するデータ
 */
export function setPlayerData<K extends PlayerDbKeys>(
  playerId: Types.PlayerId,
  key: K,
  data: PlayerData[K]
): void {
  const json = JSON.stringify(data);
  if (!json) return;
  api.setPlayerDbValue(playerId, key, json);
}

/**
 * 指定したプレイヤーの保存済みデータを取得します。
 * キーが存在しない場合や保存値を JSON として解析できない場合は `undefined` を返します。
 *
 * @param playerId 対象プレイヤーの ID
 * @param key 取得するプレイヤーデータのキー
 * @returns キーに対応するデータ。取得または解析できない場合は `undefined`
 */
export function getPlayerData<K extends PlayerDbKeys>(
  playerId: Types.PlayerId,
  key: K
): PlayerData[K] | undefined {
  const raw = api.getPlayerDbValue(playerId, key);
  if (raw === undefined) return;

  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as PlayerData[K]
    } catch {
      return undefined;
    }
  }

  return undefined;
}