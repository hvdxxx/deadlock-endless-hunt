import Phaser from 'phaser'
import { Depth } from '../config/gameConfig'
import { BULLET_STATS } from '../config/balanceConfig'

/**
 * A real projectile. It travels, it collides, it deals damage.
 * Lifetime and out-of-bounds cleanup are driven by the arena scene.
 */
export class Bullet extends Phaser.Physics.Arcade.Image {
  readonly damage: number

  private readonly expiresAt: number

  constructor(scene: Phaser.Scene, x: number, y: number, angle: number, speed: number, damage: number) {
    super(scene, x, y, 'bullet')

    this.damage = damage
    this.expiresAt = scene.time.now + BULLET_STATS.lifespanMs

    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.setDepth(Depth.bullet)
    this.setRotation(angle)
    this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)

    const body = this.body as Phaser.Physics.Arcade.Body
    const offset = this.width / 2 - BULLET_STATS.radius
    body.setCircle(BULLET_STATS.radius, offset, offset)
    body.setAllowGravity(false)
  }

  isExpired(now: number): boolean {
    return now >= this.expiresAt
  }
}
