import { setTimeout } from "@plugins/helpers";

function playEffect(center, playerId) {
	const count = 25;
	const radius = 3;

	for (let i = 0; i < count; i++) {
		const angle = Math.random() * Math.PI * 2;
		const elevation = Math.random();

		const horizontalRadius =
			radius * Math.sqrt(1 - elevation * elevation);

		const offset = [
			Math.cos(angle) * horizontalRadius,
			radius * elevation,
			Math.sin(angle) * horizontalRadius,
		];

		const pos = [
			center[0] + offset[0],
			center[1] + offset[1],
			center[2] + offset[2],
		];

		// 対象に向かって鋭く降下
		const dir = [
			-offset[0],
			-offset[1] - 2,
			-offset[2],
		];

		const length = Math.hypot(...dir);
		const normalizedDir = dir.map(v => v / length);

		api.playParticleEffect({
			texture: "drift",
			pos1: pos,
			pos2: pos,
			dir1: normalizedDir,
			dir2: normalizedDir,

			minLifeTime: 0.15,
			maxLifeTime: 0.22,

			minEmitPower: 20,
			maxEmitPower: 26,

			minSize: 0.06,
			maxSize: 0.18,

			gravity: [0, -12, 0],

			velocityGradients: [
				{ timeFraction: 0, factor: 1, factor2: 1 },
				{ timeFraction: 1, factor: 0.4, factor2: 0.4 },
			],

			colorGradients: [
				{
					timeFraction: 0,
					minColor: [180, 0, 0, 0.8],
					maxColor: [255, 20, 30, 1],
				},
			],

			blendMode: 3,
			manualEmitCount: 15,
		});
	}
	setTimeout(() => {
		api.playParticleEffect({
			dir1: [-1, -1, -1],
			dir2: [1, 1, 1],
			pos1: center,
			pos2: [center[0], center[1] - 2.5, center[2]],
			texture: "generic_2",
			minLifeTime: 0.2,
			maxLifeTime: 0.5,
			minEmitPower: 1.5,
			maxEmitPower: 8,
			minSize: 0.6,
			maxSize: 0.8,
			manualEmitCount: 25,
			gravity: [0, -25, 0],
			colorGradients: [
				{
					timeFraction: 0,
					minColor: [255, 255, 255, 1],
					maxColor: [227, 227, 227, 1],
				},
				{
					timeFraction: 0.4,
					minColor: [196, 48, 40, 1],
					maxColor: [155, 36, 33, 1],
				},
				{
					timeFraction: 1,
					minColor: [196, 48, 40, 1],
					maxColor: [155, 36, 33, 1],
				},
			],
			velocityGradients: [
				{
					timeFraction: 0,
					factor: 2,
					factor2: 2,
				},
				{
					timeFraction: 1,
					factor: 0.5,
					factor2: 0.5,
				},
			],
			blendMode: 1,
			hideDist: 120,
		});
		api.playSound(playerId, "rpgKnifeSlice1", 1, 1);
		api.playSound(playerId, "rpgKnifeSlice2", 1, 1);
	}, 300);
}


onPlayerClick = (playerId, wasAltClick) => {
	const [x, y, z] = api.getPosition(playerId);
	const { dir: [dx, dy, dz] } = api.getPlayerFacingInfo(playerId);

	const dist = 10;
	const fromPos = [
		x + dx * dist,
		y + dy * dist,
		z + dz * dist,
	];

	const targets = api.getEntitiesInRect(
		fromPos.map(n => n - 10),
		fromPos.map(n => n + 10),
	).filter(n => n !== playerId);

	if (targets.length > 0) {
		const [x, y, z] = api.getPosition(targets[0]);
		playEffect([x, y + 2.5, z], playerId);
	}
};