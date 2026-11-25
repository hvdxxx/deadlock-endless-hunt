import Phaser from 'phaser'
import { Css, Depth, Fonts, Palette, SceneKeys } from '../config/gameConfig'
import {
  BULLET_STATS,
  SMOKE_BOMB,
  WAVE_RULES,
  TEXTURE_KEYS,
} from '../config/balanceConfig'
import { Haze } from '../entities/Haze'
import { Enemy } from '../entities/Enemy'
import { Bullet } from '../entities/Bullet'
import { WaveEvents, WaveManager } from '../systems/WaveManager'
import type { EnemySpawn } from '../systems/WaveManager'
import { UpgradeManager } from '../systems/UpgradeManager'
import { HUD } from '../ui/HUD'
import { VirtualJoystick } from '../ui/VirtualJoystick'
import { ArenaBackdrop } from '../ui/ArenaBackdrop'
import { UpgradeScreen } from '../ui/UpgradeScreen'
import { GameOverScreen } from '../ui/GameOverScreen'
import { GameState } from '../types'
import type { RunStats, UpgradeDefinition, WaveInfo } from '../types'

interface KeyBindings {
  readonly up: Phaser.Input.Keyboard.Key
  readonly down: Phaser.Input.Keyboard.Key
  readonly left: Phaser.Input.Keyboard.Key
  readonly right: Phaser.Input.Keyboard.Key
  readonly cursorUp: Phaser.Input.Keyboard.Key
  readonly cursorDown: Phaser.Input.Keyboard.Key
  readonly cursorLeft: Phaser.Input.Keyboard.Key
  readonly cursorRight: Phaser.Input.Keyboard.Key
  readonly ability: Phaser.Input.Keyboard.Key
}

/**
 * The arena: owns the run state machine (PLAYING / UPGRADE / GAME_OVER),
 * the entities, the wave manager and every HUD surface.
 */
export class ArenaScene extends Phaser.Scene {
  private state: GameState = GameState.Playing
  private haze!: Haze
  private enemies!: Phaser.Physics.Arcade.Group
  private bullets!: Phaser.Physics.Arcade.Group
  private waveManager!: WaveManager
  private readonly upgradeManager = new UpgradeManager()
  private hud!: HUD
  private joystick!: VirtualJoystick
  private backdrop!: ArenaBackdrop
  private keys?: KeyBindings
  private upgradeScreen?: UpgradeScreen
  private gameOverScreen?: GameOverScreen
  private smokeVisual?: Phaser.GameObjects.Image
  private hazeAura!: Phaser.GameObjects.Image
  private sparkEmitter!: Phaser.GameObjects.Particles.ParticleEmitter
  private soulEmitter!: Phaser.GameObjects.Particles.ParticleEmitter

  private souls = 0
  private stats: RunStats = { wavesCleared: 0, kills: 0, soulsEarned: 0 }
  private smokeReadyAt = 0
  private smokeExpiresAt = 0
  private waveClearPending = false

  constructor() {
    super(SceneKeys.Arena)
  }

  create(): void {
    this.resetRunState()

    const { width, height } = this.scale
    this.physics.world.setBounds(0, 0, width, height)
    this.cameras.main.setBounds(0, 0, width, height)
    this.physics.resume()

    this.backdrop = new ArenaBackdrop(this)
    this.backdrop.resize(width, height)

    this.haze = new Haze(this, width / 2, height / 2)

    this.hazeAura = this.add
      .image(this.haze.x, this.haze.y, TEXTURE_KEYS.hazeAura)
      .setDepth(Depth.player - 1)
      .setBlendMode(Phaser.BlendModes.ADD)

    this.tweens.add({
      targets: this.hazeAura,
      scale: { from: 0.92, to: 1.04 },
      alpha: { from: 0.85, to: 1 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    this.bullets = this.physics.add.group({ allowGravity: false })
    this.enemies = this.physics.add.group({ allowGravity: false })

    this.sparkEmitter = this.add
      .particles(0, 0, TEXTURE_KEYS.spark, {
        speed: { min: 60, max: 240 },
        lifespan: { min: 180, max: 420 },
        scale: { start: 0.9, end: 0 },
        alpha: { start: 1, end: 0 },
        quantity: 0,
        emitting: false,
        blendMode: Phaser.BlendModes.ADD,
      })
      .setDepth(Depth.fx)

    this.soulEmitter = this.add
      .particles(0, 0, TEXTURE_KEYS.soul, {
        speed: { min: 30, max: 120 },
        lifespan: { min: 300, max: 620 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 0.9, end: 0 },
        quantity: 0,
        emitting: false,
        blendMode: Phaser.BlendModes.ADD,
      })
      .setDepth(Depth.fx)

    this.waveManager = new WaveManager(this, {
      spawnEnemy: (spawn) => this.spawnEnemy(spawn),
      nextSpawnPoint: () => this.pickSpawnPoint(),
    })
    this.waveManager.on(WaveEvents.WaveStart, this.handleWaveStart, this)
    this.waveManager.on(WaveEvents.WaveCleared, this.handleWaveCleared, this)

    this.keys = this.createKeys()
    this.joystick = new VirtualJoystick(this)
    this.joystick.layout(width, height)
    this.hud = new HUD(this, () => this.useSmokeBomb())

    this.physics.add.overlap(this.bullets, this.enemies, this.onBulletHitEnemy, undefined, this)
    this.physics.add.overlap(this.haze, this.enemies, this.onEnemyTouch, undefined, this)
    this.physics.add.collider(this.enemies, this.enemies)

    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this)

    this.waveManager.startWave(1)
    this.refreshHud()
  }

  update(time: number, _delta: number): void {
    if (this.state !== GameState.Playing) {
      return
    }

    if (this.keys && Phaser.Input.Keyboard.JustDown(this.keys.ability)) {
      this.useSmokeBomb()
    }

    const movement = this.readMovement()
    this.haze.setMoveInput(movement.x, movement.y)
    this.hazeAura.setPosition(this.haze.x, this.haze.y)

    this.updateSmoke(time)
    this.updateEnemies(time)
    this.updateBullets(time)
    this.tryAutoShoot(time)
    this.refreshHud()
  }

  private resetRunState(): void {
    this.state = GameState.Playing
    this.souls = 0
    this.stats = { wavesCleared: 0, kills: 0, soulsEarned: 0 }
    this.smokeReadyAt = 0
    this.smokeExpiresAt = 0
    this.waveClearPending = false
    this.upgradeScreen = undefined
    this.gameOverScreen = undefined
    this.smokeVisual = undefined
  }

  private createKeys(): KeyBindings | undefined {
    const keyboard = this.input.keyboard

    if (!keyboard) {
      return undefined
    }

    const cursors = keyboard.createCursorKeys()

    return {
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      cursorUp: cursors.up,
      cursorDown: cursors.down,
      cursorLeft: cursors.left,
      cursorRight: cursors.right,
      ability: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
    }
  }

  private readMovement(): { x: number; y: number } {
    let x = 0
    let y = 0

    if (this.keys) {
      if (this.keys.left.isDown || this.keys.cursorLeft.isDown) {
        x -= 1
      }
      if (this.keys.right.isDown || this.keys.cursorRight.isDown) {
        x += 1
      }
      if (this.keys.up.isDown || this.keys.cursorUp.isDown) {
        y -= 1
      }
      if (this.keys.down.isDown || this.keys.cursorDown.isDown) {
        y += 1
      }
    }

    x += this.joystick.directionX
    y += this.joystick.directionY

    return { x, y }
  }

  private updateEnemies(time: number): void {
    const smokeActive = this.isSmokeActive(time)
    const smoke = this.smokeVisual

    for (const child of this.enemies.getChildren()) {
      const enemy = child as Enemy

      if (!enemy.active) {
        continue
      }

      const inSmoke =
        smokeActive &&
        smoke !== undefined &&
        Phaser.Math.Distance.Between(enemy.x, enemy.y, smoke.x, smoke.y) <= SMOKE_BOMB.radius

      enemy.chase(this.haze.x, this.haze.y, inSmoke ? SMOKE_BOMB.slowFactor : 1, time)
    }
  }

  private updateBullets(time: number): void {
    for (const child of [...this.bullets.getChildren()]) {
      const bullet = child as Bullet

      if (!bullet.active) {
        continue
      }

      if (bullet.isExpired(time) || this.isOutsideWorld(bullet)) {
        bullet.destroy()
      }
    }
  }

  private tryAutoShoot(time: number): void {
    if (!this.haze.canShootAt(time)) {
      return
    }

    const target = this.findNearestEnemy()

    if (!target) {
      return
    }

    this.haze.nextShotAt = time + this.haze.fireIntervalMs
    this.haze.faceTowards(target.x, target.y)

    const angle = Phaser.Math.Angle.Between(this.haze.x, this.haze.y, target.x, target.y)
    const muzzleX = this.haze.x + Math.cos(angle) * BULLET_STATS.muzzleOffset
    const muzzleY = this.haze.y + Math.sin(angle) * BULLET_STATS.muzzleOffset

    const bullet = new Bullet(this, muzzleX, muzzleY, angle, this.haze.bulletSpeed, this.haze.damage)
    this.bullets.add(bullet)
    bullet.setVelocity(
    Math.cos(angle) * this.haze.bulletSpeed,
    Math.sin(angle) * this.haze.bulletSpeed
    )
    this.sparkEmitter.explode(2, muzzleX, muzzleY)
  }

  private findNearestEnemy(): Enemy | null {
    let nearest: Enemy | null = null
    let bestDistance = this.haze.range * this.haze.range

    for (const child of this.enemies.getChildren()) {
      const enemy = child as Enemy

      if (!enemy.active) {
        continue
      }

      const distance = Phaser.Math.Distance.Squared(this.haze.x, this.haze.y, enemy.x, enemy.y)

      if (distance < bestDistance) {
        bestDistance = distance
        nearest = enemy
      }
    }

    return nearest
  }

  private readonly onBulletHitEnemy: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    bulletObject,
    enemyObject,
  ) => {
    const bullet = bulletObject as Bullet
    const enemy = enemyObject as Enemy

    if (!bullet.active || !enemy.active) {
      return
    }

    const killed = enemy.applyDamage(bullet.damage, this.time.now)
    this.sparkEmitter.explode(5, bullet.x, bullet.y)
    bullet.destroy()

    if (killed) {
      this.killEnemy(enemy)
    }
  }

  private readonly onEnemyTouch: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    _hazeObject,
    enemyObject,
  ) => {
    if (this.state !== GameState.Playing) {
      return
    }

    const enemy = enemyObject as Enemy

    if (!enemy.active) {
      return
    }

    const now = this.time.now

    if (!enemy.canContact(now) || this.isSmokeActive(now)) {
      return
    }

    if (!this.haze.takeDamage(enemy.damage, now)) {
      return
    }

    enemy.startContactCooldown(now)
    this.hud.flashDamage()
    this.cameras.main.shake(120, 0.004)

    if (!this.haze.isAlive()) {
      this.handlePlayerDeath()
    }
  }

  private killEnemy(enemy: Enemy): void {
    const { x, y } = enemy
    const reward = enemy.soulsReward

    enemy.destroy()
    this.waveManager.notifyEnemyRemoved()
    this.stats.kills += 1
    this.addSouls(reward)
    this.sparkEmitter.explode(9, x, y)
    this.soulEmitter.explode(4, x, y)
  }

  private spawnEnemy(spawn: EnemySpawn): void {
    const enemy = new Enemy(this, spawn.x, spawn.y, spawn.maxHp, spawn.moveSpeed)
    this.enemies.add(enemy)

    const ring = this.add
      .circle(spawn.x, spawn.y, 24)
      .setStrokeStyle(2, Palette.blood, 0.7)
      .setDepth(Depth.fx)

    this.tweens.add({
      targets: ring,
      scale: 2.1,
      alpha: 0,
      duration: 420,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    })
  }

  private pickSpawnPoint(): { x: number; y: number } {
    const width = this.scale.width
    const height = this.scale.height
    const centerX = width / 2
    const centerY = height / 2
    const safeRadius = Math.min(width, height) * WAVE_RULES.safeZoneRatio
    const margin = WAVE_RULES.spawnMargin

    for (let attempt = 0; attempt < 24; attempt += 1) {
      const edge = Phaser.Math.Between(0, 3)
      let x: number = margin
      let y: number = margin

      if (edge === 0) {
        x = Phaser.Math.Between(margin, Math.max(margin + 1, width - margin))
        y = margin
      } else if (edge === 1) {
        x = width - margin
        y = Phaser.Math.Between(margin, Math.max(margin + 1, height - margin))
      } else if (edge === 2) {
        x = Phaser.Math.Between(margin, Math.max(margin + 1, width - margin))
        y = height - margin
      } else {
        x = margin
        y = Phaser.Math.Between(margin, Math.max(margin + 1, height - margin))
      }

      const fromCenter = Phaser.Math.Distance.Between(x, y, centerX, centerY)
      const fromPlayer = Phaser.Math.Distance.Between(x, y, this.haze.x, this.haze.y)

      if (fromCenter >= safeRadius && fromPlayer >= WAVE_RULES.minDistanceFromPlayer) {
        return { x, y }
      }
    }

    return { x: margin, y: margin }
  }

  private useSmokeBomb(): void {
    if (this.state !== GameState.Playing) {
      return
    }

    const now = this.time.now

    if (now < this.smokeReadyAt) {
      return
    }

    this.smokeReadyAt = now + SMOKE_BOMB.cooldownMs
    this.smokeExpiresAt = now + SMOKE_BOMB.durationMs

    this.smokeVisual?.destroy()

    const smoke = this.add
      .image(this.haze.x, this.haze.y, TEXTURE_KEYS.smoke)
      .setDepth(Depth.smoke)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0)
      .setScale(SMOKE_BOMB.visualScale * 0.55)

    this.smokeVisual = smoke

    this.tweens.add({
      targets: smoke,
      alpha: 0.85,
      scale: SMOKE_BOMB.visualScale,
      duration: 220,
      ease: 'Quad.easeOut',
    })

    this.sparkEmitter.explode(12, this.haze.x, this.haze.y)
    this.refreshHud()
  }

  private updateSmoke(time: number): void {
    if (!this.smokeVisual) {
      return
    }

    this.smokeVisual.setPosition(this.haze.x, this.haze.y)

    if (time >= this.smokeExpiresAt) {
      this.fadeOutSmoke()
    }
  }

  private fadeOutSmoke(): void {
    const smoke = this.smokeVisual

    if (!smoke) {
      return
    }

    this.smokeVisual = undefined

    this.tweens.add({
      targets: smoke,
      alpha: 0,
      duration: 240,
      ease: 'Quad.easeOut',
      onComplete: () => smoke.destroy(),
    })
  }

  private isSmokeActive(time: number): boolean {
    return time < this.smokeExpiresAt
  }

  private isOutsideWorld(bullet: Bullet): boolean {
    const margin = 80

    return (
      bullet.x < -margin ||
      bullet.y < -margin ||
      bullet.x > this.scale.width + margin ||
      bullet.y > this.scale.height + margin
    )
  }

  private addSouls(amount: number): void {
    this.souls += amount
    this.stats.soulsEarned += amount
  }

  private handleWaveStart(info: WaveInfo): void {
    this.showBanner(`WAVE ${info.wave}`, `${info.totalEnemies} CHASERS INBOUND`)
  }

  private handleWaveCleared(wave: number): void {
    if (this.state !== GameState.Playing || this.waveClearPending) {
      return
    }

    this.waveClearPending = true
    this.stats.wavesCleared = wave
    this.addSouls(WAVE_RULES.clearSoulReward)
    this.refreshHud()

    this.time.delayedCall(WAVE_RULES.upgradeDelayMs, () => {
      if (this.state === GameState.Playing) {
        this.openUpgradeScreen()
      }
    })
  }

  private openUpgradeScreen(): void {
    this.state = GameState.Upgrade
    this.haze.setVelocity(0, 0)
    this.physics.pause()
    this.fadeOutSmoke()
    this.smokeExpiresAt = 0

    this.upgradeScreen = new UpgradeScreen(this, {
      wave: this.waveManager.waveNumber,
      souls: this.souls,
      choices: this.upgradeManager.getChoices(3),
      onPurchase: (definition) => this.purchaseUpgrade(definition),
      onContinue: () => this.startNextWave(),
    })
  }

  private purchaseUpgrade(definition: UpgradeDefinition): void {
    if (this.state !== GameState.Upgrade) {
      return
    }

    if (this.souls < definition.cost) {
      return
    }

    this.souls -= definition.cost
    this.upgradeManager.apply(definition.id, this.haze)
    this.startNextWave()
  }

  private startNextWave(): void {
    if (this.state !== GameState.Upgrade) {
      return
    }

    this.upgradeScreen?.destroy()
    this.upgradeScreen = undefined
    this.waveClearPending = false
    this.state = GameState.Playing
    this.physics.resume()
    this.haze.nextShotAt = this.time.now + 150

    this.waveManager.startWave(this.waveManager.waveNumber + 1)
    this.refreshHud()
  }

  private handlePlayerDeath(): void {
    if (this.state === GameState.GameOver) {
      return
    }

    this.state = GameState.GameOver
    this.haze.setVelocity(0, 0)
    this.physics.pause()
    this.fadeOutSmoke()
    this.smokeExpiresAt = 0
    this.cameras.main.shake(260, 0.009)

    this.time.delayedCall(320, () => {
      this.gameOverScreen = new GameOverScreen(this, {
        stats: this.stats,
        onRestart: () => this.scene.restart(),
        onMenu: () => this.scene.start(SceneKeys.Menu),
      })
    })
  }

  private showBanner(title: string, subtitle: string): void {
    const { width, height } = this.scale

    const titleText = this.add
      .text(width / 2, height * 0.26, title, {
        fontFamily: Fonts.title,
        fontSize: '34px',
        color: Css.emberBright,
      })
      .setOrigin(0.5)
      .setDepth(Depth.hud + 5)
      .setAlpha(0)

    const subtitleText = this.add
      .text(width / 2, height * 0.26 + 34, subtitle, {
        fontFamily: Fonts.mono,
        fontSize: '13px',
        color: Css.muted,
      })
      .setOrigin(0.5)
      .setDepth(Depth.hud + 5)
      .setAlpha(0)

    this.tweens.add({
      targets: [titleText, subtitleText],
      alpha: 1,
      duration: 180,
      yoyo: true,
      hold: 620,
      onComplete: () => {
        titleText.destroy()
        subtitleText.destroy()
      },
    })
  }

  private refreshHud(): void {
    this.hud.update({
      wave: this.waveManager.waveNumber,
      enemiesRemaining: this.waveManager.enemiesRemaining,
      souls: this.souls,
      hp: this.haze.hp,
      maxHp: this.haze.maxHp,
      smokeRemainingMs: Math.max(0, this.smokeReadyAt - this.time.now),
    })
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const width = gameSize.width
    const height = gameSize.height

    this.physics.world.setBounds(0, 0, width, height)
    this.cameras.main.setBounds(0, 0, width, height)
    this.backdrop.resize(width, height)
    this.hud.layout(width, height)
    this.joystick.layout(width, height)
    this.upgradeScreen?.layout(width, height)
    this.gameOverScreen?.layout(width, height)

    this.haze.setPosition(
      Phaser.Math.Clamp(this.haze.x, 24, Math.max(24, width - 24)),
      Phaser.Math.Clamp(this.haze.y, 24, Math.max(24, height - 24)),
    )
  }

  private handleShutdown(): void {
    this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this)
    this.waveManager?.destroy()
    this.waveManager?.off(WaveEvents.WaveStart, this.handleWaveStart, this)
    this.waveManager?.off(WaveEvents.WaveCleared, this.handleWaveCleared, this)
    this.joystick?.destroy(this)
    this.hud?.destroy()
    this.upgradeScreen?.destroy()
    this.gameOverScreen?.destroy()
    this.backdrop?.destroy()
    this.smokeVisual?.destroy()
    this.hazeAura?.destroy()
  }
}
