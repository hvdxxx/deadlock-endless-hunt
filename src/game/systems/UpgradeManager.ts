import { UPGRADE_DEFS } from '../config/balanceConfig'
import type { Haze } from '../entities/Haze'
import type { UpgradeDefinition, UpgradeId } from '../types'

/**
 * Holds the upgrade pool, rolls the offers and mutates Haze stats.
 * Souls and the "one purchase per wave" rule live in the arena scene.
 */
export class UpgradeManager {
  getChoices(count = 3): UpgradeDefinition[] {
    const pool = [...UPGRADE_DEFS]

    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      const current = pool[i]
      pool[i] = pool[j]
      pool[j] = current
    }

    return pool.slice(0, Math.min(count, pool.length))
  }

  apply(id: UpgradeId, haze: Haze): void {
    switch (id) {
      case 'weaponDamage':
        haze.applyDamageUpgrade()
        break
      case 'attackSpeed':
        haze.applyAttackSpeedUpgrade()
        break
      case 'vitality':
        haze.applyVitalityUpgrade()
        break
      case 'moveSpeed':
        haze.applyMoveSpeedUpgrade()
        break
    }
  }
}
