import type { PlayerId, MobId } from "@bloxd";
import { setTimeout } from "@plugins/helpers";
import type { Parameters } from "../types";
import { Promise } from "./promise";
import type { PolyfillPromise } from "./promise";

type AnimateEntitySchema = Parameters<typeof api.animateEntity>[1];

export function asyncAnimate(
  lifeformId: PlayerId | MobId,
  animationSchema: AnimateEntitySchema
): PolyfillPromise<void> {
  return new Promise<void>((resolve) => {
    const duration =
      typeof animationSchema === "object" &&
        animationSchema !== null &&
        "animationDurationMs" in animationSchema
        ? animationSchema.animationDurationMs
        : typeof animationSchema === "object" &&
          animationSchema !== null &&
          "animation_length" in animationSchema
          ? animationSchema.animation_length * 1000
          : 1000;

    api.animateEntity(lifeformId, animationSchema);
    setTimeout(() => resolve(), duration);
  });
}
