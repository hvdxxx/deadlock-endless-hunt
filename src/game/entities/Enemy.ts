import Phaser from 'phaser'
import { Depth, Palette } from '../config/gameConfig'
import { CHASER_STATS } from '../config/balanceConfig'

/**
 * Chaser: the only enemy of the MVP. It walks straight at Haze,
 * hits on contact with its own cooldown and drops souls when killed.
 */
export class Enemy extends Phaser.Physics.Arcade.Image {
  hp: number
  readonly maxHp: number
  damage: number = CHASER_STATS.damage
  soulsReward: number = CHASER_STATS.soulsReward
  moveSpeed: number

  private nextContactAt = 0
  private flashUntil = 0

  constructor(scene: Phaser.Scene, x: number, y: number, maxHp: number, moveSpeed: number) {
    super(scene, x, y, 'chaser')

    this.hp = maxHp
    this.maxHp = maxHp
    this.moveSpeed = moveSpeed

    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.setDepth(Depth.enemy)
    this.setCollideWorldBounds(true)

    const body = this.body as Phaser.Physics.Arcade.Body
    const offset = this.width / 2 - CHASER_STATS.bodyRadius
    body.setCircle(CHASER_STATS.bodyRadius, offset, offset)
  }

  chase(targetX: number, targetY: number, speedFactor: number, now: number): void {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY)
    const speed = this.moveSpeed * speedFactor

    this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
    this.setRotation(angle)
    this.refreshTint(now, speedFactor < 1)
  }

  /** Returns true when this hit killed the chaser. */
  applyDamage(amount: number, now: number): boolean {
    this.hp -= amount
    this.flashUntil = now + CHASER_STATS.hitFlashMs

    return this.hp <= 0
  }

  canContact(now: number): boolean {
    return now >= this.nextContactAt
  }

  startContactCooldown(now: number): void {
    this.nextContactAt = now + CHASER_STATS.contactCooldownMs
  }

  private refreshTint(now: number, slowed: boolean): void {
    if (now < this.flashUntil) {
      this.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL)
      return
    }

    if (slowed) {
      this.setTint(Palette.soul)
    } else {
      this.clearTint()
    }
  }
}
