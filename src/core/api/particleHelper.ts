//@ts-nocheck
import { setTimeout } from "@plugins/helpers"

/* ---------------------------- 型 ---------------------------- */

type V3 = [number, number, number]
export type Mat = number[]
export type Gradient = [number, number][]
export type Emitter = [
	life: number,
	pos: Mat,
	dir: Mat | 0,
	alpha: Gradient,
	velocity?: Gradient,
	spread?: number,
	gravity?: number,
]
export type Layer = [
	texture: string,
	colorA: V3,
	colorB: V3,
	options: { minSize: number; maxSize: number; blendMode: number },
	scale: number,
	points: number[],
	emitters: Emitter[],
]

export interface StagedOptions {
	generateMs: number
	/**
	 * 元データで収縮が始まる時刻 (秒、発射からの相対)。
	 * 今のデータでは 5.1 (収縮用エミッターの出現位置 = 0.894736 × 5.7)
	 */
	contractAtSec: number
	marginMs?: number
}

export interface StudioOptions {
	sliceMs?: number
	sound?: string | null
	soundEvery?: number
	idlePollMs?: number
	autoLoop?: boolean
	stepIntervalMs?: number
	maxParticlesPerStep?: number
	staged?: StagedOptions
	onDone?: () => void
	onContract?: () => void
	onFinish?: () => void
}

/* ------------------------- 前処理 --------------------------- */

type VelocityKeys = { timeFraction: number; factor: number; factor2: number }[]

interface PreparedEmitter {
	life: number
	pos: Mat
	dir: Mat | null
	alpha: Gradient
	spread: number
	power: number
	gravity: V3
	velocity: VelocityKeys
	velocityRaw: Gradient
}

interface PreparedLayer {
	texture: string
	a: V3
	b: V3
	blendMode: number
	minSize: number
	sizeRange: number
	scale: number
	points: number[]
	emitters: PreparedEmitter[]
	maxLifeMs: number
}

const cache = new WeakMap<Layer[], PreparedLayer[]>()

const toVelocityKeys = (g: Gradient): VelocityKeys =>
	g.map(([t, x]) => ({ timeFraction: t, factor: x, factor2: x }))

const prepare = (layers: Layer[]): PreparedLayer[] => {
	const hit = cache.get(layers)
	if (hit) return hit

	const result = layers.map(([texture, a, b, o, scale, points, emitters]): PreparedLayer => {
		let maxLife = 0
		const prepared = emitters.map(([life, pos, dir, alpha, velocity, spread, gravity]): PreparedEmitter => {
			if (life > maxLife) maxLife = life
			const velocityRaw = velocity || [[0, 1]]
			return {
				life,
				pos,
				dir: dir || null,
				alpha,
				spread: spread || 0,
				power: dir ? 1 : 0,
				gravity: [0, gravity || 0, 0],
				velocity: toVelocityKeys(velocityRaw),
				velocityRaw,
			}
		})
		return {
			texture, a, b, scale, points,
			blendMode: o.blendMode,
			minSize: o.minSize,
			sizeRange: o.maxSize - o.minSize,
			emitters: prepared,
			maxLifeMs: maxLife * 1000,
		}
	})

	cache.set(layers, result)
	return result
}

/* ---------------------- 収縮開始の時間ずらし ---------------------- */

/** 収縮開始の時間ずらしを丸める単位 (ms)。種類を絞ってキャッシュを効かせる */
const QUANT_MS = 50
/** この秒数より前のキーは「生成側」として動かさない */
const HOLD_EPS = 0.02
/** 待ち時間を挟むとき、値が違う場合に入れるキーの手前幅 (秒) */
const GAP = 0.001

interface Variant {
	life: number
	alpha: Gradient
	velocity: VelocityKeys
}

/**
 * 収縮開始 (tauC 秒) より後のキーを delta 秒後ろへずらし、その間は値を保持する。
 * tauC より前のキーは生成後からの経過時間のまま。寿命は delta だけ延びる。
 */
const warpGradient = (g: Gradient, life: number, newLife: number, tauC: number, delta: number): Gradient => {
	const out: Gradient = []
	let lastBefore: number | null = null
	let gapFilled = false

	for (const [f, v] of g) {
		const tau = f * life
		if (tau < tauC - HOLD_EPS) {
			out.push([tau / newLife, v])
			lastBefore = v
			continue
		}
		const shifted = tau + delta
		// 待ち時間の間は直前の値を保つ (線形補間で値が動いてしまうのを防ぐ)
		if (!gapFilled && lastBefore !== null && lastBefore !== v) {
			out.push([(shifted - GAP) / newLife, lastBefore])
		}
		gapFilled = true
		out.push([shifted / newLife, v])
	}
	return out
}

const warpEmitter = (e: PreparedEmitter, tauC: number, delta: number): Variant => {
	// 収縮開始より前に寿命が尽きるエミッター (生成の演出) はそのまま
	if (e.life < tauC - HOLD_EPS) return e
	const life = e.life + delta
	return {
		life,
		alpha: warpGradient(e.alpha, e.life, life, tauC, delta),
		velocity: toVelocityKeys(warpGradient(e.velocityRaw, e.life, life, tauC, delta)),
	}
}

/* ------------------------- 本体 ----------------------------- */

interface Job {
	layer: PreparedLayer
	/** 次に処理する points のインデックス (3の倍数) */
	i: number
	/** staged: この層の生成開始 (ms、生成開始からの相対) */
	start: number
	/** staged: この層の生成にかける時間 (ms) */
	span: number
}

export class ParticleStudio {
	/** true のときだけ進行する */
	enabled = true
	/** シーンの置き場所 (play 中でも変更可) */
	origin: readonly [number, number, number]

	private readonly layers: PreparedLayer[]
	private jobs: Job[] = []
	private looping = false
	/** play / cancel のたびに増える。古い onFinish / onContract を無効にする */
	private runId = 0
	/** 最後のパーティクルが消える時刻 */
	private endAt = 0
	private soundCount = 0

	private readonly sliceMs: number
	private readonly sound: string | null
	private readonly soundEvery: number
	private readonly idlePollMs: number
	private readonly autoLoop: boolean
	private readonly stepIntervalMs: number
	private readonly maxParticlesPerStep: number
	/** この時刻になるまで step() は何もしない */
	private nextAt = 0
	/** 予算が足りない step でも後ろの層が飢えないよう、先頭の層を毎回ずらす */
	private rotation = 0

	private readonly staged: { generateMs: number; contractAtSec: number; marginMs: number } | null
	/** staged: 生成開始時刻 */
	private genStart = 0
	/** staged: エミッターごとの時間ずらし済みデータ (ずらし量の段階ごと) */
	private readonly variants = new Map<PreparedEmitter, Map<number, Variant>>()

	private readonly onDone?: () => void
	private readonly onContract?: () => void
	private readonly onFinish?: () => void

	constructor(layers: Layer[], origin: readonly [number, number, number], options: StudioOptions = {}) {
		this.layers = prepare(layers)
		this.origin = origin
		this.sliceMs = options.sliceMs ?? 2
		this.sound = options.sound === undefined ? "croneHurt1" : options.sound
		this.soundEvery = Math.max(1, options.soundEvery ?? 1)
		this.idlePollMs = options.idlePollMs ?? 50
		this.autoLoop = options.autoLoop ?? true
		this.stepIntervalMs = options.stepIntervalMs ?? 0
		// 1点も出せずに止まらないよう、最大エミッター数を下限にする
		let maxEmitters = 1
		for (const layer of this.layers) {
			if (layer.emitters.length > maxEmitters) maxEmitters = layer.emitters.length
		}
		this.maxParticlesPerStep = Math.max(options.maxParticlesPerStep ?? Infinity, maxEmitters)
		const st = options.staged
		this.staged = st
			? { generateMs: st.generateMs, contractAtSec: st.contractAtSec, marginMs: st.marginMs ?? 500 }
			: null
		this.onDone = options.onDone
		this.onContract = options.onContract
		this.onFinish = options.onFinish
	}

	/** 点の発射中か (一時停止中も true) */
	get playing(): boolean {
		return this.jobs.length > 0
	}

	/** 最初から描き始める (delayMs 後から進行)。描画中に呼ぶと最初からやり直し */
	play(delayMs = 0): void {
		this.runId++
		this.endAt = 0
		const now = api.now()
		this.nextAt = now + delayMs
		this.genStart = now + delayMs
		this.jobs = this.layers.map((layer) => ({ layer, i: 0, start: 0, span: 0 }))
		if (this.staged) this.assignWindows(this.staged.generateMs)
		if (this.autoLoop && !this.looping) {
			this.looping = true
			this.loop()
		}
	}

	/** 中止。発射済みのものはそのままで、onDone / onContract / onFinish は呼ばれない */
	cancel(): void {
		this.runId++
		this.jobs = []
	}

	/** 1回分の進行。enabled が false なら何もしない。発射中なら true を返す */
	// アロー関数: setInterval(studio.step, ...) のように this なしで渡しても動く
	step = (): boolean => {
		const jobs = this.jobs
		if (!this.enabled || jobs.length === 0) return jobs.length > 0

		const now = api.now()
		if (now < this.nextAt) return true
		this.nextAt = now + this.stepIntervalMs

		if (this.staged) return this.stepStaged(now)

		// 全層で共有する予算。開始位置をずらして、特定の層だけが先に消費しないようにする
		let budget = this.maxParticlesPerStep
		const count = jobs.length
		const first = this.rotation++ % count
		for (let n = 0; n < count && budget > 0; n++) {
			budget = this.advance(jobs[(first + n) % count], budget)
		}

		let w = 0
		for (let n = 0; n < count; n++) {
			const job = jobs[n]
			if (job.i < job.layer.points.length) jobs[w++] = job
		}
		jobs.length = w

		if (w === 0) this.emissionDone()
		return w > 0
	}

	private loop = (): void => {
		this.step()
		if (this.jobs.length === 0) {
			this.looping = false
			return
		}
		setTimeout(this.loop, this.enabled ? 1 : this.idlePollMs)
	}

	private emissionDone(): void {
		this.onDone?.()

		const id = this.runId
		const st = this.staged
		const onContract = this.onContract
		if (st && onContract) {
			const at = this.genStart + st.generateMs + st.marginMs + st.contractAtSec * 1000
			setTimeout(() => {
				if (id === this.runId) onContract()
			}, Math.max(0, at - api.now()))
		}

		const onFinish = this.onFinish
		if (!onFinish) return
		setTimeout(() => {
			if (id === this.runId) onFinish()
		}, Math.max(0, this.endAt - api.now()))
	}

	/** 1層を、時間予算と個数予算の範囲で進める。残りの個数予算を返す */
	private advance(job: Job, budget: number): number {
		const layer = job.layer
		const points = layer.points
		const len = points.length
		const cost = layer.emitters.length // 1点で出るパーティクル数
		const start = api.now()

		while (job.i < len && budget >= cost) {
			this.emit(layer, points, job.i, 0)
			job.i += 3
			budget -= cost
			if (api.now() - start >= this.sliceMs) break
		}

		if (job.i >= len) this.markLayerEnd(layer)
		return budget
	}

	/** 層の発射が終わった時点で、最後のパーティクルが消える時刻を更新 */
	private markLayerEnd(layer: PreparedLayer): void {
		let end = api.now() + layer.maxLifeMs
		const st = this.staged
		if (st) {
			// 収縮側のパーティクルは全点が同じ時刻に消える
			const aligned = this.genStart + st.generateMs + st.marginMs + layer.maxLifeMs
			if (aligned > end) end = aligned
		}
		if (end > this.endAt) this.endAt = end
	}

	/* ----------------------- staged ----------------------- */

	/** 層ごとの生成時間枠を、粒子数 (点×エミッター) に比例して順番に割り当てる */
	private assignWindows(generateMs: number): void {
		let total = 0
		for (const job of this.jobs) total += (job.layer.points.length / 3) * job.layer.emitters.length

		let cursor = 0
		for (const job of this.jobs) {
			const weight = (job.layer.points.length / 3) * job.layer.emitters.length
			job.start = cursor
			job.span = total > 0 ? (generateMs * weight) / total : 0
			cursor += job.span
		}
	}

	/** 層を配列の順に1つずつ、予定時刻が来た点から出す */
	private stepStaged(now: number): boolean {
		const st = this.staged as NonNullable<ParticleStudio["staged"]>
		const jobs = this.jobs
		const elapsed = now - this.genStart
		if (elapsed < 0) return true

		// 収縮開始 (= 生成終了 + 余裕 + contractAtSec) までの残りに合わせた、待ち時間の延長量
		const delta = st.generateMs + st.marginMs - elapsed
		const bucket = delta > 0 ? Math.round(delta / QUANT_MS) : 0

		let budget = this.maxParticlesPerStep
		let timeUp = false
		const startT = api.now()

		while (jobs.length > 0 && budget > 0 && !timeUp) {
			const job = jobs[0]
			const layer = job.layer
			const points = layer.points
			const len = points.length
			const cost = layer.emitters.length
			const total = len / 3

			while (job.i < len && budget >= cost) {
				// 予定時刻前なら終了 (層の順序を守るため、後ろの層も待つ)
				if (job.start + (job.i / 3 / total) * job.span > elapsed) return true
				this.emit(layer, points, job.i, bucket)
				job.i += 3
				budget -= cost
				if (api.now() - startT >= this.sliceMs) {
					timeUp = true
					break
				}
			}

			// この層が終わっていなければ今回はここまで (次の層へは進まない)
			if (job.i < len) return true
			this.markLayerEnd(layer)
			jobs.shift()
		}

		if (jobs.length === 0) {
			this.emissionDone()
			return false
		}
		return true
	}

	private variant(e: PreparedEmitter, bucket: number): Variant {
		let byBucket = this.variants.get(e)
		if (!byBucket) {
			byBucket = new Map()
			this.variants.set(e, byBucket)
		}
		let v = byBucket.get(bucket)
		if (!v) {
			const st = this.staged as NonNullable<ParticleStudio["staged"]>
			v = warpEmitter(e, st.contractAtSec, (bucket * QUANT_MS) / 1000)
			byBucket.set(bucket, v)
		}
		return v
	}

	/** points[i..i+2] の1点から、全エミッターのパーティクルを発射 */
	private emit(L: PreparedLayer, d: number[], i: number, bucket: number): void {
		const x = d[i], y = d[i + 1], z = d[i + 2]
		const q = L.scale
		const ox = this.origin[0], oy = this.origin[1], oz = this.origin[2]

		const k = Math.random()
		const r = Math.round(L.a[0] + (L.b[0] - L.a[0]) * k)
		const g = Math.round(L.a[1] + (L.b[1] - L.a[1]) * k)
		const b = Math.round(L.a[2] + (L.b[2] - L.a[2]) * k)
		const size = L.minSize + L.sizeRange * Math.random()

		let soundPos: V3 | null = null

		for (const e of L.emitters) {
			const m = e.pos
			const p: V3 = [
				m[3] + (m[0] * x + m[1] * y + m[2] * z) / q + ox,
				m[7] + (m[4] * x + m[5] * y + m[6] * z) / q + oy,
				m[11] + (m[8] * x + m[9] * y + m[10] * z) / q + oz,
			]
			if (!soundPos) soundPos = p

			let dx = 0, dy = 1, dz = 0
			const v = e.dir
			if (v) {
				dx = v[3] + (v[0] * x + v[1] * y + v[2] * z) / q
				dy = v[7] + (v[4] * x + v[5] * y + v[6] * z) / q
				dz = v[11] + (v[8] * x + v[9] * y + v[10] * z) / q
			}
			const s = e.spread

			// staged: 収縮開始に合わせて時間をずらしたデータ (bucket 0 なら元のまま)
			const w: Variant = bucket > 0 ? this.variant(e, bucket) : e
			const alpha = w.alpha
			const colors = new Array(alpha.length)
			for (let n = 0; n < alpha.length; n++) {
				const col = [r, g, b, alpha[n][1]]
				colors[n] = { timeFraction: alpha[n][0], minColor: col, maxColor: col }
			}

			api.playParticleEffect({
				manualEmitCount: 1,
				texture: L.texture,
				blendMode: L.blendMode,
				pos1: p, pos2: p,
				minSize: size, maxSize: size,
				dir1: [dx - s, dy - s, dz - s],
				dir2: [dx + s, dy + s, dz + s],
				minEmitPower: e.power, maxEmitPower: e.power,
				minLifeTime: w.life, maxLifeTime: w.life,
				gravity: e.gravity,
				colorGradients: colors,
				velocityGradients: w.velocity,
			} as never)
		}

		// 効果音は1点につき1回 (最初のエミッターの位置)
		if (this.sound && soundPos && this.soundCount++ % this.soundEvery === 0) {
			api.broadcastSound(this.sound, 1, 1, { playerIdOrPos: soundPos })
		}
	}
}