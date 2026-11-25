import Phaser from 'phaser'
import { Css, Depth, Fonts, Palette } from '../config/gameConfig'
import type { UpgradeDefinition } from '../types'
import { Button } from './Button'

export interface UpgradeScreenOptions {
  readonly wave: number
  readonly souls: number
  readonly choices: readonly UpgradeDefinition[]
  readonly onPurchase: (definition: UpgradeDefinition) => void
  readonly onContinue: () => void
}

interface CardView {
  readonly definition: UpgradeDefinition
  readonly background: Phaser.GameObjects.Rectangle
  readonly name: Phaser.GameObjects.Text
  readonly description: Phaser.GameObjects.Text
  readonly cost: Phaser.GameObjects.Text
  readonly buy: Button
}

/**
 * Between-wave shop. Three rolled upgrades, one purchase, always a way out.
 */
export class UpgradeScreen {
  private readonly scene: Phaser.Scene
  private readonly options: UpgradeScreenOptions

  private readonly dim: Phaser.GameObjects.Rectangle
  private readonly panel: Phaser.GameObjects.Rectangle
  private readonly title: Phaser.GameObjects.Text
  private readonly subtitle: Phaser.GameObjects.Text
  private readonly souls: Phaser.GameObjects.Text
  private readonly cards: CardView[] = []
  private readonly continueButton: Button

  private locked = false

  constructor(scene: Phaser.Scene, options: UpgradeScreenOptions) {
    this.scene = scene
    this.options = options

    const width = scene.scale.width
    const height = scene.scale.height

    this.dim = scene.add
      .rectangle(0, 0, width, height, Palette.voidBlack, 0.82)
      .setOrigin(0, 0)
      .setDepth(Depth.overlayDim)
    this.dim.setInteractive()

    this.panel = scene.add
      .rectangle(width / 2, height / 2, width - 48, height - 48, Palette.abyss, 0.9)
      .setStrokeStyle(1, Palette.steel, 0.7)
      .setDepth(Depth.overlayPanel)

    this.title = this.makeText('UPGRADE', 40, Css.ember, Fonts.title)
    this.subtitle = this.makeText(`WAVE ${options.wave} CLEARED`, 14, Css.muted, Fonts.ui)
    this.souls = this.makeText(`SOULS ${options.souls}`, 20, Css.soul, Fonts.mono)

    for (const definition of options.choices) {
      const background = scene.add
        .rectangle(0, 0, 260, 240, Palette.deepBlue, 0.7)
        .setStrokeStyle(1, Palette.steel, 0.8)
        .setDepth(Depth.overlayPanel + 1)

      const name = this.makeText(definition.name, 19, Css.bone, Fonts.ui).setOrigin(0, 0)
      const description = this.makeText(definition.description, 13, Css.muted, Fonts.ui).setOrigin(0, 0)
      const cost = this.makeText(`${definition.cost} SOULS`, 14, Css.soul, Fonts.mono).setOrigin(0, 0)

      const buy = new Button(scene, {
        x: 0,
        y: 0,
        width: 200,
        height: 38,
        label: this.affordable(definition) ? 'BUY' : 'NOT ENOUGH SOULS',
        variant: 'primary',
        fontSize: 15,
        depth: Depth.overlayButton,
        onClick: () => this.purchase(definition),
      })

      buy.setEnabled(this.affordable(definition))

      this.cards.push({ definition, background, name, description, cost, buy })
    }

    this.continueButton = new Button(scene, {
      x: width / 2,
      y: height - 58,
      width: Math.min(320, width - 96),
      height: 44,
      label: 'CONTINUE WITHOUT UPGRADE',
      variant: 'ghost',
      fontSize: 14,
      depth: Depth.overlayButton,
      onClick: () => this.continueWithoutPurchase(),
    })

    this.layout(width, height)
  }

  layout(width: number, height: number): void {
    this.dim.setSize(width, height)
    this.panel.setPosition(width / 2, height / 2).setSize(width - 48, height - 48)

    this.title.setPosition(width / 2, 62)
    this.subtitle.setPosition(width / 2, 104)
    this.souls.setPosition(width / 2, 126)

    const columns = width < 860 ? 1 : 3
    const gap = columns === 1 ? 14 : 22
    const cardWidth = columns === 1 ? Math.min(width - 96, 470) : Math.min(300, (width - 120 - gap * 2) / 3)
    const cardHeight =
      columns === 1
        ? Math.max(116, Math.min(168, (height - 320) / 3 - gap))
        : Math.max(200, Math.min(244, height - 330))
    const totalWidth = columns === 1 ? cardWidth : cardWidth * 3 + gap * 2
    const startX = (width - totalWidth) / 2
    const cardsTop = columns === 1 ? 178 : 190

    this.cards.forEach((card, index) => {
      const column = columns === 1 ? 0 : index
      const row = columns === 1 ? index : 0
      const x = startX + column * (cardWidth + gap) + cardWidth / 2
      const y = cardsTop + row * (cardHeight + gap) + cardHeight / 2
      const left = x - cardWidth / 2 + 18

      card.background.setPosition(x, y).setSize(cardWidth, cardHeight)
      card.name.setPosition(left, y - cardHeight / 2 + 20).setWordWrapWidth(cardWidth - 36)
      card.description.setPosition(left, y - cardHeight / 2 + 54).setWordWrapWidth(cardWidth - 36)
      card.cost.setPosition(left, y + cardHeight / 2 - 88)
      card.buy.setPosition(x, y + cardHeight / 2 - 32)
      card.buy.resize(cardWidth - 36)
    })

    this.continueButton.setPosition(width / 2, height - 58)
    this.continueButton.resize(Math.min(320, width - 96))
  }

  destroy(): void {
    this.dim.destroy()
    this.panel.destroy()
    this.title.destroy()
    this.subtitle.destroy()
    this.souls.destroy()
    this.continueButton.destroy()

    for (const card of this.cards) {
      card.background.destroy()
      card.name.destroy()
      card.description.destroy()
      card.cost.destroy()
      card.buy.destroy()
    }
  }

  private affordable(definition: UpgradeDefinition): boolean {
    return this.options.souls >= definition.cost
  }

  private purchase(definition: UpgradeDefinition): void {
    if (this.locked || !this.affordable(definition)) {
      return
    }

    this.locked = true

    for (const card of this.cards) {
      card.buy.setEnabled(false)
    }

    this.continueButton.setEnabled(false)
    this.options.onPurchase(definition)
  }

  private continueWithoutPurchase(): void {
    if (this.locked) {
      return
    }

    this.locked = true
    this.options.onContinue()
  }

  private makeText(value: string, size: number, color: string, family: string): Phaser.GameObjects.Text {
    return this.scene.add
      .text(0, 0, value, { fontFamily: family, fontSize: `${size}px`, color })
      .setOrigin(0.5)
      .setDepth(Depth.overlayContent)
  }
}
