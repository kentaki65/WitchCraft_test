
import type { PlayerId, MobId, TimeColorGradient } from "@bloxd";
import type { Vec3 } from "../../core/types";

export type WeatherType = "rain" | "snow" | "clear";

export class WeatherManager {
  private currentWeather: WeatherType = "clear";
  private readonly weatherEntities = new Set<MobId>();

  getCurrentWeather(): WeatherType {
    return this.currentWeather;
  }

  setWeather(type: WeatherType): void {
    if (this.currentWeather === type) return;

    this.clearWeather();
    this.currentWeather = type;

    if (type === "clear") return;

    for (const playerId of api.getPlayerIds()) {
      this.applyWeather(playerId);
    }
  }

  onPlayerJoin(playerId: PlayerId): void {
    if (this.currentWeather !== "clear") {
      this.applyWeather(playerId);
    }
  }

  private rgbToHex(rgb: Vec3) {
    return '#' + rgb
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  };

  private applyWeather(playerId: PlayerId): void {
    api.setClientOption(playerId, "fogChunkDistanceOverride", -0.1);

    this.applyWeatherSettings(this.currentWeather);
    
    this.spawnWeatherEffect(
      playerId,
      this.currentWeather === "rain"
    );
  }

  private applyWeatherSettings(type: WeatherType): void {
    const isCloud = type !== "clear";

    for (const playerId of api.getPlayerIds()) {
      api.setClientOption(
        playerId,
        "skyLightColourOverride",
        this.rgbToHex(isCloud ? [113, 115, 117] : [0, 0, 0]),
      );

      api.setClientOption(playerId, "skyBox", {
        type: "earth",
        turbidity: isCloud ? 1000 : 0,
        luminance: isCloud ? 0 : 0.75,
        azimuth: isCloud ? 0.2 : 0,
        infiniteDistance: false,
        vertexTint: isCloud ? [169, 169, 169] : [255, 255, 255],
      });
    }
  }

  private spawnWeatherEffect(
    playerId: PlayerId,
    isRain: boolean
  ): void {
    const colorGradients: TimeColorGradient[] = isRain
      ? [
        {
          timeFraction: 0,
          minColor: [150, 180, 255, 0.8],
          maxColor: [180, 200, 255, 1],
        },
        {
          timeFraction: 1,
          minColor: [150, 180, 255, 0.1],
          maxColor: [180, 200, 255, 0.2],
        },
      ]
      : [
        {
          timeFraction: 0,
          minColor: [255, 255, 255, 0.8],
          maxColor: [255, 255, 255, 1],
        },
        {
          timeFraction: 1,
          minColor: [255, 255, 255, 0.1],
          maxColor: [255, 255, 255, 0.2],
        },
      ];

    const texture = isRain ? "drift" : "critical_hit";
    const dir1: Vec3 = isRain ? [0, -1, 0] : [0.2, -1, 0];
    const dir2: Vec3 = isRain ? [0, -1, 0] : [-0.2, -1, 0];

    const entityId = api.attemptCreateMeshEntity("ParticleEmitter", {
      dir1,
      dir2,
      texture,
      minLifeTime: 10,
      maxLifeTime: 20,
      emitRate: 1000,
      minEmitPower: 50,
      maxEmitPower: 50,
      minSize: 0.3,
      maxSize: 0.5,
      gravity: [0, -20, 0],
      width: 50,
      height: 1,
      depth: 50,
      colorGradients,
      velocityGradients: [
        { timeFraction: 0, factor: 1, factor2: 1 },
      ],
      blendMode: 1,
      hideDist: 1000,
    });

    if (!entityId) {
      api.log("天候エンティティの生成に失敗しました");
      return;
    }

    api.addFollowingEntityToPlayer(
      playerId,
      entityId,
      [0, 25, 0]
    );

    this.weatherEntities.add(entityId);
  }

  private clearWeather(): void {
    for (const entityId of this.weatherEntities) {
      api.deleteMeshEntity(entityId);
    }

    this.weatherEntities.clear();

    for (const playerId of api.getPlayerIds()) {
      api.setClientOption(
        playerId,
        "fogChunkDistanceOverride",
        10
      );
    }
  }
}
