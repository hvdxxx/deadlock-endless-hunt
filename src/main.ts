import Phaser from 'phaser'
import './style.css'
import { baseGameConfig } from './game/config/gameConfig'
import { BootScene } from './game/scenes/BootScene'
import { MenuScene } from './game/scenes/MenuScene'
import { ArenaScene } from './game/scenes/ArenaScene'

const config: Phaser.Types.Core.GameConfig = {
  ...baseGameConfig,
  scene: [BootScene, MenuScene, ArenaScene],
}

const game = new Phaser.Game(config)

if (import.meta.env.DEV) {
  // Dev-only hook so automated checks can inspect the running game.
  ;(window as unknown as { __deadlock?: Phaser.Game }).__deadlock = game
}
