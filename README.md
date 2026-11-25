# Deadlock: Endless Hunt

Phase 1 playable MVP — a 2D survivor-like / roguelite arena built with **Phaser 4**, TypeScript and Vite.

Haze auto-fires at the nearest chaser while the player moves, dodges, clears waves, earns souls and buys one upgrade between waves. Every run ends in a statistics screen and can be restarted instantly.

## Tech stack

- Phaser **4.2.1** (pinned, WebGL renderer with Canvas fallback via `Phaser.AUTO`)
- TypeScript (strict, no `any`)
- Vite
- HTML5 Canvas — every visual is generated procedurally with Phaser Graphics, no external art assets

## Run

```bash
npm install
npm run dev
```

Build and preview:

```bash
npm run build
npm run preview
```

## Controls

| Action | Desktop | Mobile |
| --- | --- | --- |
| Move | `W A S D` / arrow keys | virtual thumbstick (bottom-left half) |
| Smoke Bomb | `Q` | ability button (bottom-right) |
| Shoot | automatic, nearest chaser in range | automatic |
| Shop | `BUY` one upgrade or `CONTINUE WITHOUT UPGRADE` | same |

## Game loop

1. Chasers spawn in waves from outside the central safe zone.
2. Haze auto-fires real projectiles at the nearest living chaser.
3. Kills award souls (10 per kill, +50 per cleared wave).
4. Every cleared wave opens the upgrade shop: three offers, 50 souls each, one purchase.
5. Chasers get tougher and faster with each wave until Haze dies.
6. Game over shows waves cleared, kills and souls earned — then restart.

## Mechanics

- **Haze**: 100 HP, 12 damage, 400 ms attack interval, 180 move speed, 550 bullet speed, 450 range, 700 ms invulnerability after taking a hit.
- **Smoke Bomb**: 12 s cooldown, 2 s duration, slows chasers inside the cloud to 35%, makes Haze invulnerable while active.
- **Chaser**: 25 HP (+15% per wave), 10 contact damage on a 900 ms per-enemy cooldown, 65 move speed (capped at 130), 10 souls.
- **Upgrades**: Weapon Damage +20%, Attack Speed +15% (shorter interval), Vitality +25 max HP and heals 25, Movement Speed +10%.

## Project structure

```
src/
  main.ts
  game/
    config/      gameConfig.ts, balanceConfig.ts
    scenes/      BootScene.ts, MenuScene.ts, ArenaScene.ts
    entities/    Haze.ts, Enemy.ts, Bullet.ts
    systems/     WaveManager.ts, UpgradeManager.ts
    ui/          HUD.ts, UpgradeScreen.ts, GameOverScreen.ts, Button.ts,
                 VirtualJoystick.ts, ArenaBackdrop.ts
    types.ts
```

Run state machine: `MENU → PLAYING ⇄ UPGRADE → GAME_OVER → MENU / PLAYING`.
Wave logic is timer-driven, physics is paused in `UPGRADE`/`GAME_OVER`, and scene restart resets all run data without duplicating timers.

## Out of scope for Phase 1

No inventory, item affixes, passive tree, bosses, meta progression, persistence, accounts, multiplayer or Telegram integration. Original Deadlock assets are not used — all art is procedural geometry.
