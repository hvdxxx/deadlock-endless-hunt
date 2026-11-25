import Phaser from 'phaser'

export const SceneKeys = {
  Boot: 'Boot',
  Menu: 'Menu',
  Arena: 'Arena',
} as const

export const Depth = {
  backdrop: 0,
  smoke: 6,
  enemy: 10,
  player: 15,
  bullet: 20,
  fx: 25,
  hud: 100,
  overlayDim: 200,
  overlayPanel: 201,
  overlayContent: 202,
  overlayButton: 203,
} as const

export const Palette = {
  voidBlack: 0x05060a,
  abyss: 0x0a0f1a,
  deepBlue: 0x101a2e,
  slate: 0x1b2740,
  steel: 0x2c3a55,
  ember: 0xff8a3d,
  emberBright: 0xffc46b,
  blood: 0xd63c4a,
  bloodBright: 0xff5d6c,
  soul: 0x7fe9ff,
  bone: 0xe6ebf7,
  muted: 0x8b96b3,
  smokeGray: 0x9aa4c0,
} as const

export const Css = {
  bone: '#e6ebf7',
  muted: '#8b96b3',
  ember: '#ff9a4d',
  emberBright: '#ffd39a',
  soul: '#7fe9ff',
  blood: '#ff5d6c',
  dim: '#5d6884',
} as const

export const Fonts = {
  title: 'Georgia, "Times New Roman", serif',
  ui: '"Segoe UI", Roboto, system-ui, sans-serif',
  mono: 'Consolas, "Courier New", monospace',
} as const

export const baseGameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#05060a',
  banner: false,
  render: {
    antialias: true,
    roundPixels: false,
    pixelArt: false,
    powerPreference: 'high-performance',
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: '100%',
    height: '100%',
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  input: {
    activePointers: 3,
  },
} satisfies Phaser.Types.Core.GameConfig
