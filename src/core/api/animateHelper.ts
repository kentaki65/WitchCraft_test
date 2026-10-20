import { PlayerId } from "@bloxd";
import { setTimeout } from "@plugins/helpers";
import { Parameters } from "../types";
import { Promise } from "./promise";
import type { PolyfillPromise } from "./promise";

type AnimateEntitySchema = Parameters<typeof api.animateEntity>[1];

export function asyncAnimate(
  playerId: PlayerId,
  animationSchema: AnimateEntitySchema
): PolyfillPromise<void> {
  return new Promise<void>((resolve) => {
    const duration =
      animationSchema && "animationDurationMs" in animationSchema
        ? animationSchema.animationDurationMs
        : 1000;

    api.animateEntity(playerId, animationSchema);
    setTimeout(() => resolve(), duration);
  });
}