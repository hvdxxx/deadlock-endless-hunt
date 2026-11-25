import Phaser from 'phaser'
import { Css, Fonts, SceneKeys } from '../config/gameConfig'
import { ArenaBackdrop } from '../ui/ArenaBackdrop'
import { Button } from '../ui/Button'

/**
 * Main menu: title, play button and short control reference.
 */
export class MenuScene extends Phaser.Scene {
  private backdrop!: ArenaBackdrop
  private title!: Phaser.GameObjects.Text
  private subtitle!: Phaser.GameObjects.Text
  private tagline!: Phaser.GameObjects.Text
  private controls!: Phaser.GameObjects.Text
  private footer!: Phaser.GameObjects.Text
  private playButton!: Button

  constructor() {
    super(SceneKeys.Menu)
  }

  create(): void {
    const { width, height } = this.scale

    this.backdrop = new ArenaBackdrop(this)
    this.backdrop.resize(width, height)

    this.title = this.add
      .text(width / 2, height * 0.3, 'DEADLOCK', {
        fontFamily: Fonts.title,
        fontSize: '72px',
        color: Css.bone,
      })
      .setOrigin(0.5)
      .setDepth(10)

    this.subtitle = this.add
      .text(width / 2, height * 0.3 + 62, 'E N D L E S S   H U N T', {
        fontFamily: Fonts.ui,
        fontSize: '20px',
        color: Css.ember,
      })
      .setOrigin(0.5)
      .setDepth(10)

    this.tagline = this.add
      .text(width / 2, height * 0.3 + 106, 'Survive the waves. Spend the souls. Hunt forever.', {
        fontFamily: Fonts.ui,
        fontSize: '15px',
        color: Css.muted,
      })
      .setOrigin(0.5)
      .setDepth(10)

    this.controls = this.add
      .text(
        width / 2,
        height * 0.62,
        [
          'W A S D  /  ARROW KEYS   —   MOVE',
          'Q   —   SMOKE BOMB  (12s cooldown, 2s invulnerability)',
          'MOBILE   —   TOUCH STICK + ABILITY BUTTON',
          'AUTO-FIRE   —   ALWAYS TARGETS THE NEAREST CHASER',
        ].join('\n'),
        {
          fontFamily: Fonts.mono,
          fontSize: '14px',
          color: Css.dim,
          align: 'center',
          lineSpacing: 10,
        },
      )
      .setOrigin(0.5)
      .setDepth(10)

    this.footer = this.add
      .text(width / 2, height - 26, 'PHASE 1  ·  PLAYABLE MVP', {
        fontFamily: Fonts.ui,
        fontSize: '11px',
        color: Css.dim,
      })
      .setOrigin(0.5)
      .setDepth(10)

    this.playButton = new Button(this, {
      x: width / 2,
      y: height * 0.44 + 40,
      width: 280,
      height: 56,
      label: 'PLAY',
      variant: 'primary',
      fontSize: 22,
      depth: 11,
      onClick: () => this.scene.start(SceneKeys.Arena),
    })

    this.applyLayout(width, height)

    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this)
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.applyLayout(gameSize.width, gameSize.height)
  }

  private applyLayout(width: number, height: number): void {
    const titleSize = Phaser.Math.Clamp(width * 0.075, 34, 78)
    const titleY = height * 0.24
    const subtitleY = titleY + titleSize * 0.82
    const taglineY = subtitleY + 34
    const playY = taglineY + 96
    const controlsY = Math.max(playY + 96, height * 0.72)

    this.backdrop.resize(width, height)
    this.title.setPosition(width / 2, titleY).setFontSize(titleSize)
    this.subtitle.setPosition(width / 2, subtitleY)
    this.tagline.setPosition(width / 2, taglineY)
    this.controls.setPosition(width / 2, controlsY)
    this.footer.setPosition(width / 2, height - 18)
    this.playButton.setPosition(width / 2, playY)
  }

  private handleShutdown(): void {
    this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this)
    this.playButton.destroy()
    this.backdrop.destroy()
  }
}
