import Phaser from 'phaser'
import { Css, Depth, Fonts, Palette } from '../config/gameConfig'

export type ButtonVariant = 'primary' | 'ghost' | 'danger'

interface VariantStyle {
  readonly fill: number
  readonly fillAlpha: number
  readonly hoverAlpha: number
  readonly stroke: number
  readonly text: string
}

const VARIANTS: Record<ButtonVariant, VariantStyle> = {
  primary: { fill: Palette.ember, fillAlpha: 0.16, hoverAlpha: 0.34, stroke: Palette.ember, text: Css.emberBright },
  ghost: { fill: Palette.steel, fillAlpha: 0.14, hoverAlpha: 0.28, stroke: Palette.steel, text: Css.bone },
  danger: { fill: Palette.blood, fillAlpha: 0.18, hoverAlpha: 0.36, stroke: Palette.blood, text: '#ffb8c0' },
}

export interface ButtonOptions {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  readonly label: string
  readonly onClick: () => void
  readonly variant?: ButtonVariant
  readonly fontSize?: number
  readonly depth?: number
}

/**
 * Minimal canvas button: rectangle + label. Used by menu, upgrade cards and
 * the game over screen so all clickable surfaces behave the same way.
 */
export class Button {
  private readonly style: VariantStyle
  private readonly rect: Phaser.GameObjects.Rectangle
  private readonly text: Phaser.GameObjects.Text
  private enabled = true
  private hovered = false

  constructor(scene: Phaser.Scene, options: ButtonOptions) {
    const depth = options.depth ?? Depth.overlayButton
    this.style = VARIANTS[options.variant ?? 'primary']

    this.rect = scene.add
      .rectangle(options.x, options.y, options.width, options.height, this.style.fill, this.style.fillAlpha)
      .setStrokeStyle(2, this.style.stroke, 0.9)
      .setDepth(depth)
      .setInteractive({ useHandCursor: true })

    this.text = scene.add
      .text(options.x, options.y, options.label, {
        fontFamily: Fonts.ui,
        fontSize: `${options.fontSize ?? 18}px`,
        color: this.style.text,
      })
      .setOrigin(0.5)
      .setDepth(depth + 1)

    this.rect.on('pointerover', () => {
      this.hovered = true
      this.paint()
    })
    this.rect.on('pointerout', () => {
      this.hovered = false
      this.paint()
    })
    this.rect.on('pointerdown', () => {
      if (this.enabled) {
        options.onClick()
      }
    })
  }

  setPosition(x: number, y: number): void {
    this.rect.setPosition(x, y)
    this.text.setPosition(x, y)
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    this.rect.setAlpha(enabled ? 1 : 0.4)
    this.text.setAlpha(enabled ? 1 : 0.45)

    if (enabled) {
      this.rect.setInteractive({ useHandCursor: true })
    } else {
      this.rect.disableInteractive()
    }
  }

  setLabel(label: string): void {
    this.text.setText(label)
  }

  resize(width: number, height?: number): void {
    this.rect.setSize(width, height ?? this.rect.height)
  }

  destroy(): void {
    this.rect.destroy()
    this.text.destroy()
  }

  private paint(): void {
    const alpha = this.hovered ? this.style.hoverAlpha : this.style.fillAlpha
    this.rect.setFillStyle(this.style.fill, alpha)
    this.rect.setStrokeStyle(this.hovered ? 3 : 2, this.style.stroke, 0.95)
  }
}
