import Phaser from 'phaser'
import { CHASER_STATS, WAVE_RULES } from '../config/balanceConfig'
import type { WaveInfo } from '../types'

export const WaveEvents = {
  WaveStart: 'wave-start',
  WaveCleared: 'wave-cleared',
} as const

export interface EnemySpawn {
  readonly x: number
  readonly y: number
  readonly maxHp: number
  readonly moveSpeed: number
}

export interface WaveManagerHandlers {
  readonly spawnEnemy: (spawn: EnemySpawn) => void
  readonly nextSpawnPoint: () => { x: number; y: number }
}

/**
 * Owns wave pacing: how many chasers exist, how hard they are, when they appear
 * and when the wave is officially over. Single source of truth for timers.
 */
export class WaveManager extends Phaser.Events.EventEmitter {
  private readonly scene: Phaser.Scene
  private readonly handlers: WaveManagerHandlers

  private wave = 0
  private toSpawn = 0
  private alive = 0
  private waveActive = false
  private spawnTimer: Phaser.Time.TimerEvent | null = null

  constructor(scene: Phaser.Scene, handlers: WaveManagerHandlers) {
    super()
    this.scene = scene
    this.handlers = handlers
  }

  get waveNumber(): number {
    return this.wave
  }

  get enemiesRemaining(): number {
    return this.toSpawn + this.alive
  }

  get isActive(): boolean {
    return this.waveActive
  }

  buildInfo(wave: number): WaveInfo {
    const totalEnemies = WAVE_RULES.firstWaveEnemies + (wave - 1) * WAVE_RULES.enemiesAddedPerWave
    const enemyHp = Math.round(CHASER_STATS.maxHp * Math.pow(WAVE_RULES.hpGrowthPerWave, wave - 1))
    const enemySpeed = Math.min(
      WAVE_RULES.speedCap,
      CHASER_STATS.moveSpeed + (wave - 1) * WAVE_RULES.speedGrowthPerWave,
    )
    const spawnIntervalMs = Math.max(
      WAVE_RULES.minSpawnIntervalMs,
      WAVE_RULES.baseSpawnIntervalMs - (wave - 1) * WAVE_RULES.spawnIntervalReductionMs,
    )

    return { wave, totalEnemies, enemyHp, enemySpeed, spawnIntervalMs }
  }

  startWave(wave: number): void {
    this.stopTimer()

    this.wave = wave
    this.toSpawn = 0
    this.alive = 0
    this.waveActive = true

    const info = this.buildInfo(wave)
    this.toSpawn = info.totalEnemies

    this.emit(WaveEvents.WaveStart, info)
    this.scheduleSpawn(info.spawnIntervalMs)
  }

  /** Called by the arena whenever a chaser leaves the fight. */
  notifyEnemyRemoved(): void {
    this.alive = Math.max(0, this.alive - 1)
    this.tryComplete()
  }

  destroy(): void {
    this.stopTimer()
    this.removeAllListeners()
  }

  private scheduleSpawn(delayMs: number): void {
    this.spawnTimer = this.scene.time.addEvent({
      delay: delayMs,
      callback: this.handleSpawnTick,
      callbackScope: this,
    })
  }

  private stopTimer(): void {
    if (this.spawnTimer) {
      this.spawnTimer.remove(false)
      this.spawnTimer = null
    }
  }

  private handleSpawnTick(): void {
    this.spawnTimer = null

    if (!this.waveActive) {
      return
    }

    const info = this.buildInfo(this.wave)

    if (this.toSpawn > 0) {
      this.toSpawn -= 1
      this.alive += 1

      const point = this.handlers.nextSpawnPoint()
      this.handlers.spawnEnemy({
        x: point.x,
        y: point.y,
        maxHp: info.enemyHp,
        moveSpeed: info.enemySpeed,
      })

      this.scheduleSpawn(info.spawnIntervalMs)
      return
    }

    this.tryComplete()
  }

  private tryComplete(): void {
    if (!this.waveActive || this.toSpawn > 0 || this.alive > 0) {
      return
    }

    this.waveActive = false
    this.stopTimer()
    this.emit(WaveEvents.WaveCleared, this.wave)
  }
}
