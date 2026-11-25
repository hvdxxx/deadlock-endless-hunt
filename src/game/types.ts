export const GameState = {
  Menu: 'MENU',
  Playing: 'PLAYING',
  Upgrade: 'UPGRADE',
  GameOver: 'GAME_OVER',
} as const

export type GameState = (typeof GameState)[keyof typeof GameState]

export type UpgradeId = 'weaponDamage' | 'attackSpeed' | 'vitality' | 'moveSpeed'

export interface UpgradeDefinition {
  readonly id: UpgradeId
  readonly name: string
  readonly description: string
  readonly cost: number
}

export interface WaveInfo {
  readonly wave: number
  readonly totalEnemies: number
  readonly enemyHp: number
  readonly enemySpeed: number
  readonly spawnIntervalMs: number
}

export interface RunStats {
  wavesCleared: number
  kills: number
  soulsEarned: number
}
