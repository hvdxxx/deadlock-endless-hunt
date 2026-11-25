import Phaser from 'phaser'
import { Css, Depth, Fonts, Palette } from '../config/gameConfig'
import type { RunStats } from '../types'
import { Button } from './Button'

export interface GameOverScreenOptions {
  readonly stats: RunStats
  readonly onRestart: () => void
  readonly onMenu: () => void
}

/**
 * Final run summary: waves, kills, souls earned, restart and menu.
 */
export class GameOverScreen {
  private readonly scene: Phaser.Scene
  private readonly dim: Phaser.GameObjects.Rectangle
  private readonly panel: Phaser.GameObjects.Rectangle
  private readonly title: Phaser.GameObjects.Text
  private readonly subtitle: Phaser.GameObjects.Text
  private readonly statRows: Phaser.GameObjects.Text[] = []
  private readonly restartButton: Button
  private readonly menuButton: Button

  constructor(scene: Phaser.Scene, options: GameOverScreenOptions) {
    this.scene = scene

    const width = scene.scale.width
    const height = scene.scale.height

    this.dim = scene.add
      .rectangle(0, 0, width, height, Palette.voidBlack, 0.86)
      .setOrigin(0, 0)
      .setDepth(Depth.overlayDim)
    this.dim.setInteractive()

    this.panel = scene.add
      .rectangle(width / 2, height / 2, Math.min(560, width - 48), Math.min(460, height - 48), Palette.abyss, 0.92)
      .setStrokeStyle(1, Palette.blood, 0.7)
      .setDepth(Depth.overlayPanel)

    this.title = this.makeText('HUNT ENDED', 46, Css.blood, Fonts.title)
    this.subtitle = this.makeText('HAZE HAS FALLEN', 14, Css.muted, Fonts.ui)

    const statRows: ReadonlyArray<readonly [string, number, string]> = [
      ['WAVES CLEARED', options.stats.wavesCleared, Css.bone],
      ['ENEMIES KILLED', options.stats.kills, Css.bone],
      ['SOULS EARNED', options.stats.soulsEarned, Css.soul],
    ]

    for (const [label, value, color] of statRows) {
      this.statRows.push(this.makeText(`${label.padEnd(16)}${String(value).padStart(4)}`, 19, color, Fonts.mono))
    }

    this.restartButton = new Button(scene, {
      x: width / 2,
      y: height / 2 + 110,
      width: 260,
      height: 48,
      label: 'RESTART HUNT',
      variant: 'primary',
      depth: Depth.overlayButton,
      onClick: options.onRestart,
    })

    this.menuButton = new Button(scene, {
      x: width / 2,
      y: height / 2 + 170,
      width: 260,
      height: 44,
      label: 'MAIN MENU',
      variant: 'ghost',
      fontSize: 16,
      depth: Depth.overlayButton,
      onClick: options.onMenu,
    })

    this.layout(width, height)
  }

  layout(width: number, height: number): void {
    this.dim.setSize(width, height)
    this.panel.setPosition(width / 2, height / 2).setSize(Math.min(560, width - 48), Math.min(460, height - 48))

    this.title.setPosition(width / 2, height / 2 - 150)
    this.subtitle.setPosition(width / 2, height / 2 - 110)

    this.statRows.forEach((row, index) => {
      row.setPosition(width / 2, height / 2 - 50 + index * 32)
    })

    this.restartButton.setPosition(width / 2, height / 2 + 90)
    this.menuButton.setPosition(width / 2, height / 2 + 148)
  }

  destroy(): void {
    this.dim.destroy()
    this.panel.destroy()
    this.title.destroy()
    this.subtitle.destroy()
    this.restartButton.destroy()
    this.menuButton.destroy()

    for (const row of this.statRows) {
      row.destroy()
    }
  }

  private makeText(value: string, size: number, color: string, family: string): Phaser.GameObjects.Text {
    return this.scene.add
      .text(0, 0, value, { fontFamily: family, fontSize: `${size}px`, color })
      .setOrigin(0.5)
      .setDepth(Depth.overlayContent)
  }
}
