import Phaser from 'phaser'
import { Depth, Palette } from '../config/gameConfig'
import { WAVE_RULES } from '../config/balanceConfig'

/**
 * Procedural gothic-occult arena floor: dark grid, occult safe ring,
 * corner brackets and a cheap fake vignette. Redrawn on every resize.
 */
export class ArenaBackdrop {
  private readonly floor: Phaser.GameObjects.Graphics
  private readonly shade: Phaser.GameObjects.Graphics

  constructor(scene: Phaser.Scene) {
    this.floor = scene.add.graphics().setDepth(Depth.backdrop)
    this.shade = scene.add.graphics().setDepth(Depth.backdrop + 1)
  }

  resize(width: number, height: number): void {
    this.drawFloor(width, height)
    this.drawShade(width, height)
  }

  destroy(): void {
    this.floor.destroy()
    this.shade.destroy()
  }

  private drawFloor(width: number, height: number): void {
    const g = this.floor
    const centerX = width / 2
    const centerY = height / 2

    g.clear()

    g.fillStyle(Palette.abyss, 1)
    g.fillRect(0, 0, width, height)

    const glowRadius = Math.max(width, height) * 0.62
    for (let i = 5; i >= 1; i -= 1) {
      g.fillStyle(Palette.deepBlue, 0.07)
      g.fillCircle(centerX, centerY, (glowRadius / 5) * i)
    }

    const step = 64
    g.lineStyle(1, 0x1c2c45, 0.4)
    for (let x = step; x < width; x += step) {
      g.lineBetween(x, 0, x, height)
    }
    for (let y = step; y < height; y += step) {
      g.lineBetween(0, y, width, y)
    }

    const safeRadius = Math.min(width, height) * WAVE_RULES.safeZoneRatio
    g.lineStyle(1, Palette.ember, 0.16)
    g.strokeCircle(centerX, centerY, safeRadius)
    g.lineStyle(1, Palette.ember, 0.07)
    g.strokeCircle(centerX, centerY, safeRadius * 0.68)
    g.strokeCircle(centerX, centerY, safeRadius * 1.32)

    const runeSize = 14
    g.fillStyle(Palette.ember, 0.22)
    g.fillTriangle(centerX, centerY - runeSize, centerX - runeSize, centerY + runeSize * 0.6, centerX + runeSize, centerY + runeSize * 0.6)
    g.fillStyle(Palette.voidBlack, 0.9)
    g.fillTriangle(
      centerX,
      centerY - runeSize * 0.35,
      centerX - runeSize * 0.5,
      centerY + runeSize * 0.55,
      centerX + runeSize * 0.5,
      centerY + runeSize * 0.55,
    )

    g.lineStyle(2, Palette.steel, 0.75)
    g.strokeRect(8, 8, width - 16, height - 16)

    const bracket = 54
    const inset = 18
    g.lineStyle(3, Palette.ember, 0.5)
    g.beginPath()
    g.moveTo(inset, inset + bracket)
    g.lineTo(inset, inset)
    g.lineTo(inset + bracket, inset)
    g.moveTo(width - inset - bracket, inset)
    g.lineTo(width - inset, inset)
    g.lineTo(width - inset, inset + bracket)
    g.moveTo(width - inset, height - inset - bracket)
    g.lineTo(width - inset, height - inset)
    g.lineTo(width - inset - bracket, height - inset)
    g.moveTo(inset + bracket, height - inset)
    g.lineTo(inset, height - inset)
    g.lineTo(inset, height - inset - bracket)
    g.strokePath()
  }

  private drawShade(width: number, height: number): void {
    const g = this.shade
    g.clear()

    for (let i = 1; i <= 4; i += 1) {
      const band = i * 26
      g.fillStyle(Palette.voidBlack, 0.07)
      g.fillRect(0, 0, width, band)
      g.fillRect(0, height - band, width, band)
      g.fillRect(0, 0, band, height)
      g.fillRect(width - band, 0, band, height)
    }
  }
}
