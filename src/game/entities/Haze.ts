import Phaser from 'phaser'
import { Depth } from '../config/gameConfig'
import { HAZE_STATS, PLAYER_HIT_INVULNERABILITY_MS, UPGRADE_EFFECTS } from '../config/balanceConfig'

/**
 * Haze, the hunter. Owns her own combat stats so upgrades can mutate them
 * without the scene knowing the numbers.
 */
export class Haze extends Phaser.Physics.Arcade.Image {
  hp: number = HAZE_STATS.maxHp
  maxHp: number = HAZE_STATS.maxHp
  damage: number = HAZE_STATS.damage
  fireIntervalMs: number = HAZE_STATS.fireIntervalMs
  moveSpeed: number = HAZE_STATS.moveSpeed
  bulletSpeed: number = HAZE_STATS.bulletSpeed
  range: number = HAZE_STATS.range
  nextShotAt = 0

  private invulnerableUntil = 0

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'haze')

    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.setDepth(Depth.player)
    this.setCollideWorldBounds(true)

    const body = this.body as Phaser.Physics.Arcade.Body
    const offset = this.width / 2 - HAZE_STATS.bodyRadius
    body.setCircle(HAZE_STATS.bodyRadius, offset, offset)
  }

  setMoveInput(x: number, y: number): void {
    const length = Math.hypot(x, y)

    if (length < 0.001) {
      this.setVelocity(0, 0)
      return
    }

    this.setVelocity((x / length) * this.moveSpeed, (y / length) * this.moveSpeed)
  }

  faceTowards(x: number, y: number): void {
    this.setRotation(Phaser.Math.Angle.Between(this.x, this.y, x, y))
  }

  canShootAt(now: number): boolean {
    return now >= this.nextShotAt
  }

  isInvulnerable(now: number): boolean {
    return now < this.invulnerableUntil
  }

  takeDamage(amount: number, now: number): boolean {
    if (this.isInvulnerable(now) || this.hp <= 0) {
      return false
    }

    this.invulnerableUntil = now + PLAYER_HIT_INVULNERABILITY_MS
    this.hp = Math.max(0, this.hp - amount)
    this.flash()

    return true
  }

  heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount)
  }

  isAlive(): boolean {
    return this.hp > 0
  }

  applyDamageUpgrade(): void {
    this.damage *= UPGRADE_EFFECTS.damageMultiplier
  }

  applyAttackSpeedUpgrade(): void {
    this.fireIntervalMs = Math.max(
      UPGRADE_EFFECTS.minFireIntervalMs,
      this.fireIntervalMs / UPGRADE_EFFECTS.fireRateMultiplier,
    )
  }

  applyVitalityUpgrade(): void {
    this.maxHp += UPGRADE_EFFECTS.vitalityHp
    this.heal(UPGRADE_EFFECTS.vitalityHp)
  }

  applyMoveSpeedUpgrade(): void {
    this.moveSpeed *= UPGRADE_EFFECTS.moveSpeedMultiplier
  }

  private flash(): void {
    this.setTint(0xff8899)
    this.scene.time.delayedCall(140, () => {
      if (this.active) {
        this.clearTint()
      }
    })
  }
}
