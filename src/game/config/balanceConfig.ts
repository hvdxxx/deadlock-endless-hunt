import type { UpgradeDefinition } from '../types'

export const HAZE_STATS = {
  maxHp: 100,
  damage: 12,
  fireIntervalMs: 400,
  moveSpeed: 180,
  bulletSpeed: 550,
  range: 450,
  bodyRadius: 15,
} as const

export const BULLET_STATS = {
  radius: 5,
  lifespanMs: 2200,
  muzzleOffset: 20,
} as const

export const SMOKE_BOMB = {
  cooldownMs: 12000,
  durationMs: 2000,
  radius: 175,
  slowFactor: 0.35,
  visualScale: 1.45,
} as const

export const CHASER_STATS = {
  maxHp: 25,
  damage: 10,
  moveSpeed: 65,
  soulsReward: 10,
  bodyRadius: 14,
  contactCooldownMs: 900,
  hitFlashMs: 80,
} as const

export const PLAYER_HIT_INVULNERABILITY_MS = 700

export const WAVE_RULES = {
  firstWaveEnemies: 6,
  enemiesAddedPerWave: 3,
  hpGrowthPerWave: 1.15,
  speedGrowthPerWave: 5,
  speedCap: 130,
  baseSpawnIntervalMs: 750,
  spawnIntervalReductionMs: 45,
  minSpawnIntervalMs: 320,
  clearSoulReward: 50,
  safeZoneRatio: 0.26,
  spawnMargin: 46,
  minDistanceFromPlayer: 240,
  upgradeDelayMs: 700,
} as const

export const ECONOMY = {
  soulsPerKill: 10,
  upgradeCost: 50,
} as const

export const UPGRADE_EFFECTS = {
  damageMultiplier: 1.2,
  fireRateMultiplier: 1.15,
  vitalityHp: 25,
  moveSpeedMultiplier: 1.1,
  minFireIntervalMs: 90,
} as const

export const UPGRADE_DEFS: readonly UpgradeDefinition[] = [
  {
    id: 'weaponDamage',
    name: 'Weapon Damage',
    description: 'Bullets strike 20% harder. Every hit digs deeper.',
    cost: ECONOMY.upgradeCost,
  },
  {
    id: 'attackSpeed',
    name: 'Attack Speed',
    description: '+15% fire rate. Shorter interval between shots, higher DPS.',
    cost: ECONOMY.upgradeCost,
  },
  {
    id: 'vitality',
    name: 'Vitality',
    description: '+25 max HP, and heals 25 HP instantly.',
    cost: ECONOMY.upgradeCost,
  },
  {
    id: 'moveSpeed',
    name: 'Movement Speed',
    description: '+10% movement speed. Outrun the hunt.',
    cost: ECONOMY.upgradeCost,
  },
]

export const TEXTURE_KEYS = {
  haze: 'haze',
  hazeAura: 'hazeAura',
  chaser: 'chaser',
  bullet: 'bullet',
  smoke: 'smoke',
  spark: 'spark',
  soul: 'soul',
} as const
