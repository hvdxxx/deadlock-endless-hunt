import Phaser from 'phaser'
import { SceneKeys } from '../config/gameConfig'
import { TEXTURE_KEYS } from '../config/balanceConfig'

/**
 * Generates every visual as a procedural texture. No external art,
 * no extracted Deadlock assets: geometry only.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Boot)
  }

  create(): void {
    this.buildHazeTexture()
    this.buildHazeAuraTexture()
    this.buildChaserTexture()
    this.buildBulletTexture()
    this.buildSmokeTexture()
    this.buildSparkTexture()
    this.buildSoulTexture()

    this.scene.start(SceneKeys.Menu)
  }

  private makeGraphics(): Phaser.GameObjects.Graphics {
    return this.make.graphics({ x: 0, y: 0 }, false)
  }

  private buildHazeTexture(): void {
    const g = this.makeGraphics()

    g.fillStyle(0xff8a3d, 0.09)
    g.fillCircle(22, 22, 21)
    g.fillStyle(0x120c22, 0.95)
    g.fillCircle(22, 22, 15)
    g.lineStyle(2, 0xff8a3d, 0.85)
    g.strokeCircle(22, 22, 14)
    g.fillStyle(0x2a1b45, 1)
    g.fillCircle(22, 22, 9.5)
    g.fillStyle(0xffc46b, 0.95)
    g.fillCircle(22, 22, 4.5)
    g.fillStyle(0xffd39a, 0.9)
    g.fillTriangle(34, 22, 27, 18.6, 27, 25.4)
    g.fillStyle(0x0d0918, 0.9)
    g.fillTriangle(22, 5, 16.5, 14, 27.5, 14)

    g.generateTexture(TEXTURE_KEYS.haze, 44, 44)
    g.destroy()
  }

  private buildHazeAuraTexture(): void {
    const g = this.makeGraphics()

    for (let i = 10; i >= 1; i -= 1) {
      g.fillStyle(0xff8a3d, 0.022)
      g.fillCircle(80, 80, (78 / 10) * i)
    }

    g.fillStyle(0xffc46b, 0.05)
    g.fillCircle(80, 80, 18)

    g.generateTexture(TEXTURE_KEYS.hazeAura, 160, 160)
    g.destroy()
  }

  private buildChaserTexture(): void {
    const g = this.makeGraphics()
    const cx = 20
    const cy = 20

    g.fillStyle(0xd63c4a, 0.1)
    g.fillCircle(cx, cy, 19)
    g.fillStyle(0x2b1a26, 1)
    g.fillCircle(cx, cy, 11)
    g.lineStyle(2, 0xd63c4a, 0.8)
    g.strokeCircle(cx, cy, 11)

    for (let i = 0; i < 3; i += 1) {
      const angle = (i * Math.PI * 2) / 3
      const tipX = cx + Math.cos(angle) * 18
      const tipY = cy + Math.sin(angle) * 18
      const leftX = cx + Math.cos(angle + 0.45) * 9
      const leftY = cy + Math.sin(angle + 0.45) * 9
      const rightX = cx + Math.cos(angle - 0.45) * 9
      const rightY = cy + Math.sin(angle - 0.45) * 9

      g.fillStyle(0xd63c4a, 0.55)
      g.fillTriangle(tipX, tipY, leftX, leftY, rightX, rightY)
    }

    g.fillStyle(0xff5d6c, 1)
    g.fillCircle(cx + 5, cy, 2.6)

    g.generateTexture(TEXTURE_KEYS.chaser, 40, 40)
    g.destroy()
  }

  private buildBulletTexture(): void {
    const g = this.makeGraphics()

    g.fillStyle(0xff8a3d, 0.18)
    g.fillCircle(9, 9, 8)
    g.lineStyle(1, 0xffc46b, 0.5)
    g.strokeCircle(9, 9, 6)
    g.fillStyle(0xffd39a, 1)
    g.fillCircle(9, 9, 3.6)

    g.generateTexture(TEXTURE_KEYS.bullet, 18, 18)
    g.destroy()
  }

  private buildSmokeTexture(): void {
    const g = this.makeGraphics()
    const center = 128

    for (let i = 0; i < 16; i += 1) {
      const angle = (i / 16) * Math.PI * 2
      const distance = 26 + (i % 4) * 20
      const radius = 62 + (i % 5) * 12

      g.fillStyle(i % 2 === 0 ? 0x8a93b8 : 0x5d6884, 0.05)
      g.fillCircle(center + Math.cos(angle) * distance, center + Math.sin(angle) * distance, radius)
    }

    g.fillStyle(0x9aa4c0, 0.05)
    g.fillCircle(center, center, 88)

    g.generateTexture(TEXTURE_KEYS.smoke, 256, 256)
    g.destroy()
  }

  private buildSparkTexture(): void {
    const g = this.makeGraphics()

    g.fillStyle(0xffffff, 0.35)
    g.fillCircle(5, 5, 4.2)
    g.fillStyle(0xffd39a, 1)
    g.fillCircle(5, 5, 2.6)

    g.generateTexture(TEXTURE_KEYS.spark, 10, 10)
    g.destroy()
  }

  private buildSoulTexture(): void {
    const g = this.makeGraphics()

    g.fillStyle(0x7fe9ff, 0.35)
    g.fillCircle(8, 8, 7)
    g.fillStyle(0x7fe9ff, 0.95)
    g.fillTriangle(8, 1, 14, 8, 8, 15)
    g.fillTriangle(8, 1, 2, 8, 8, 15)
    g.fillStyle(0xffffff, 0.9)
    g.fillCircle(8, 8, 2)

    g.generateTexture(TEXTURE_KEYS.soul, 16, 16)
    g.destroy()
  }
}
