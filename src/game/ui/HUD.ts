import Phaser from 'phaser'
import { Css, Depth, Fonts, Palette } from '../config/gameConfig'
import { SMOKE_BOMB } from '../config/balanceConfig'

export interface HudState {
  readonly wave: number
  readonly enemiesRemaining: number
  readonly souls: number
  readonly hp: number
  readonly maxHp: number
  readonly smokeRemainingMs: number
}

interface HudLayout {
  readonly width: number
  readonly height: number
  readonly hpBarWidth: number
  readonly hpBarHeight: number
  readonly hpBarX: number
  readonly hpBarY: number
  readonly abilityX: number
  readonly abilityY: number
}

const ABILITY_RADIUS = 40
const PADDING = 26

/**
 * Canvas HUD: HP bar, souls, wave, hostiles, smoke bomb cooldown gauge and the
 * red damage vignette. The ability gauge doubles as the mobile ability button.
 */
export class HUD {
  private readonly scene: Phaser.Scene
  private readonly onAbility: () => void

  private readonly textLayer: Phaser.GameObjects.Text[] = []
  private readonly frame: Phaser.GameObjects.Graphics
  private readonly hpBar: Phaser.GameObjects.Graphics
  private readonly abilityGauge: Phaser.GameObjects.Graphics
  private readonly damageVignette: Phaser.GameObjects.Rectangle
  private readonly abilityHitArea: Phaser.GameObjects.Rectangle

  private readonly waveText: Phaser.GameObjects.Text
  private readonly hostilesText: Phaser.GameObjects.Text
  private readonly soulsText: Phaser.GameObjects.Text
  private readonly soulsLabel: Phaser.GameObjects.Text
  private readonly hpLabel: Phaser.GameObjects.Text
  private readonly abilityCooldownText: Phaser.GameObjects.Text
  private readonly abilityCaption: Phaser.GameObjects.Text

  private layoutRect: HudLayout
  private lastSignature = ''
  private smokeRemainingMs = 0
  private hp = 100
  private maxHp = 100

  constructor(scene: Phaser.Scene, onAbility: () => void) {
    this.scene = scene
    this.onAbility = onAbility

    this.layoutRect = this.computeLayout(scene.scale.width, scene.scale.height)

    this.damageVignette = scene.add
      .rectangle(0, 0, 10, 10, Palette.blood, 0)
      .setOrigin(0, 0)
      .setDepth(Depth.hud + 3)

    this.frame = scene.add.graphics().setDepth(Depth.hud)
    this.hpBar = scene.add.graphics().setDepth(Depth.hud + 1)
    this.abilityGauge = scene.add.graphics().setDepth(Depth.hud + 1)

    this.waveText = this.makeText(22, Css.ember, Fonts.ui)
    this.hostilesText = this.makeText(14, Css.muted, Fonts.ui)
    this.soulsText = this.makeText(26, Css.soul, Fonts.mono)
    this.soulsLabel = this.makeText(12, Css.muted, Fonts.ui)
    this.hpLabel = this.makeText(14, Css.bone, Fonts.ui)
    this.abilityCooldownText = this.makeText(26, Css.bone, Fonts.mono)
    this.abilityCaption = this.makeText(11, Css.muted, Fonts.ui)

    this.abilityCooldownText.setOrigin(0.5)
    this.abilityCaption.setOrigin(0.5)
    this.soulsLabel.setOrigin(1, 0)
    this.soulsText.setOrigin(1, 0)
    this.soulsLabel.setText('SOULS')
    this.abilityCaption.setText('SMOKE BOMB')
    this.waveText.setText('WAVE 01')
    this.hostilesText.setText('HOSTILES 0')
    this.soulsText.setText('0')
    this.hpLabel.setText('HP 100 / 100')

    this.abilityHitArea = scene.add
      .rectangle(0, 0, ABILITY_RADIUS * 2, ABILITY_RADIUS * 2, Palette.bone, 0.001)
      .setDepth(Depth.hud + 2)
      .setInteractive({ useHandCursor: true })

    this.abilityHitArea.on('pointerdown', () => this.onAbility())

    this.layout(scene.scale.width, scene.scale.height)
  }

  layout(width: number, height: number): void {
    this.layoutRect = this.computeLayout(width, height)

    this.waveText.setPosition(PADDING, 20)
    this.hostilesText.setPosition(PADDING, 50)
    this.soulsLabel.setPosition(width - PADDING, 20)
    this.soulsText.setPosition(width - PADDING, 34)
    this.hpLabel.setPosition(PADDING, height - 82)
    this.abilityCooldownText.setPosition(this.layoutRect.abilityX, this.layoutRect.abilityY)
    this.abilityCaption.setPosition(this.layoutRect.abilityX, this.layoutRect.abilityY + ABILITY_RADIUS + 16)

    this.abilityHitArea.setPosition(this.layoutRect.abilityX, this.layoutRect.abilityY)
    this.damageVignette.setPosition(0, 0).setSize(width, height)

    this.lastSignature = ''
    this.redraw()
  }

  update(state: HudState): void {
    this.smokeRemainingMs = state.smokeRemainingMs
    this.hp = state.hp
    this.maxHp = state.maxHp

    const signature = [
      state.wave,
      state.enemiesRemaining,
      state.souls,
      Math.ceil(state.hp),
      Math.ceil(state.maxHp),
      Math.ceil(state.smokeRemainingMs / 100),
    ].join('|')

    if (signature === this.lastSignature) {
      return
    }

    this.lastSignature = signature

    this.waveText.setText(`WAVE ${state.wave.toString().padStart(2, '0')}`)
    this.hostilesText.setText(`HOSTILES ${state.enemiesRemaining}`)
    this.soulsText.setText(state.souls.toString())
    this.hpLabel.setText(`HP ${Math.max(0, Math.ceil(state.hp))} / ${Math.ceil(state.maxHp)}`)

    const ready = state.smokeRemainingMs <= 0
    this.abilityCooldownText.setText(ready ? 'Q' : Math.ceil(state.smokeRemainingMs / 1000).toString())
    this.abilityCooldownText.setColor(ready ? Css.emberBright : Css.muted)

    this.redraw()
  }

  flashDamage(): void {
    this.scene.tweens.killTweensOf(this.damageVignette)
    this.damageVignette.setAlpha(0.45)
    this.scene.tweens.add({
      targets: this.damageVignette,
      alpha: 0,
      duration: 320,
      ease: 'Quad.easeOut',
    })
  }

  destroy(): void {
    this.frame.destroy()
    this.hpBar.destroy()
    this.abilityGauge.destroy()
    this.damageVignette.destroy()
    this.abilityHitArea.destroy()

    for (const text of this.textLayer) {
      text.destroy()
    }

    this.textLayer.length = 0
  }

  private computeLayout(width: number, height: number): HudLayout {
    return {
      width,
      height,
      hpBarWidth: Math.min(340, Math.max(180, width * 0.3)),
      hpBarHeight: 18,
      hpBarX: PADDING,
      hpBarY: height - 52,
      abilityX: width - 84,
      abilityY: height - 92,
    }
  }

  private makeText(size: number, color: string, family: string): Phaser.GameObjects.Text {
    const text = this.scene.add
      .text(0, 0, '', { fontFamily: family, fontSize: `${size}px`, color })
      .setDepth(Depth.hud + 2)
    this.textLayer.push(text)

    return text
  }

  private redraw(): void {
    const { width, height, hpBarX, hpBarY, hpBarWidth, hpBarHeight, abilityX, abilityY } = this.layoutRect
    const smokeFraction = Phaser.Math.Clamp(1 - this.smokeRemainingMs / SMOKE_BOMB.cooldownMs, 0, 1)
    const homeWidth = Math.min(400, width * 0.72)

    this.frame.clear()
    this.frame.fillStyle(Palette.voidBlack, 0.4)
    this.frame.fillRect(0, 0, 220, 78)
    this.frame.fillRect(width - 200, 0, 200, 78)
    this.frame.fillRect(0, height - 106, homeWidth, 106)
    this.frame.lineStyle(1, Palette.steel, 0.35)
    this.frame.lineBetween(0, 78, 220, 78)
    this.frame.lineBetween(width - 200, 78, width, 78)
    this.frame.lineBetween(0, height - 106, homeWidth, height - 106)

    const hpFraction = this.maxHp > 0 ? Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1) : 0
    const hpColor = hpFraction > 0.5 ? Palette.ember : Palette.blood

    this.hpBar.clear()
    this.hpBar.fillStyle(Palette.deepBlue, 0.9)
    this.hpBar.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight)
    this.hpBar.fillStyle(hpColor, 0.95)
    this.hpBar.fillRect(hpBarX + 2, hpBarY + 2, Math.max(0, (hpBarWidth - 4) * hpFraction), hpBarHeight - 4)
    this.hpBar.lineStyle(1, Palette.steel, 0.85)
    this.hpBar.strokeRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight)

    this.abilityGauge.clear()
    this.abilityGauge.fillStyle(Palette.deepBlue, 0.85)
    this.abilityGauge.fillCircle(abilityX, abilityY, ABILITY_RADIUS)
    this.abilityGauge.lineStyle(2, smokeFraction >= 1 ? Palette.ember : Palette.steel, 0.85)
    this.abilityGauge.strokeCircle(abilityX, abilityY, ABILITY_RADIUS)

    if (this.smokeRemainingMs > 0) {
      const start = -Math.PI / 2
      this.abilityGauge.lineStyle(4, Palette.ember, 0.5)
      this.abilityGauge.beginPath()
      this.abilityGauge.arc(abilityX, abilityY, ABILITY_RADIUS - 5, start, start + Math.PI * 2 * smokeFraction, false)
      this.abilityGauge.strokePath()
    } else {
      this.abilityGauge.lineStyle(3, Palette.emberBright, 0.75)
      this.abilityGauge.strokeCircle(abilityX, abilityY, ABILITY_RADIUS - 6)
    }

    this.abilityGauge.fillStyle(Palette.smokeGray, 0.25)
    this.abilityGauge.fillCircle(abilityX - 9, abilityY - 12, 9)
    this.abilityGauge.fillCircle(abilityX + 6, abilityY - 16, 6)
    this.abilityGauge.fillCircle(abilityX + 2, abilityY - 5, 11)
  }
}
