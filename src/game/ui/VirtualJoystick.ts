import Phaser from 'phaser'
import { Depth, Palette } from '../config/gameConfig'

export function supportsTouchInput(): boolean {
  return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0
}

/**
 * Touch thumbstick. Inactive it sits in the bottom-left corner; pressing inside
 * the left half of the screen re-anchors it under the thumb and reports a
 * normalized direction vector. It never eats clicks on HUD buttons on the right.
 */
export class VirtualJoystick {
  private readonly scene: Phaser.Scene
  private readonly base: Phaser.GameObjects.Arc
  private readonly knob: Phaser.GameObjects.Arc
  private readonly radius: number
  private readonly maxKnobOffset: number

  private enabled: boolean
  private pointerId: number | null = null
  private homeX = 0
  private homeY = 0
  private inputX = 0
  private inputY = 0

  constructor(scene: Phaser.Scene, radius = 70) {
    this.scene = scene
    this.radius = radius
    this.maxKnobOffset = radius * 0.62
    this.enabled = supportsTouchInput()

    this.base = scene.add
      .circle(0, 0, radius, 0x14203a, 0.35)
      .setStrokeStyle(2, Palette.steel, 0.55)
      .setDepth(Depth.hud)
    this.knob = scene.add
      .circle(0, 0, radius * 0.42, Palette.ember, 0.32)
      .setStrokeStyle(2, Palette.ember, 0.8)
      .setDepth(Depth.hud + 1)

    this.base.setVisible(this.enabled)
    this.knob.setVisible(this.enabled)

    scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.handlePointerDown, this)
    scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.handlePointerMove, this)
    scene.input.on(Phaser.Input.Events.POINTER_UP, this.handlePointerUp, this)
    scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.handlePointerUp, this)
  }

  layout(width: number, height: number): void {
    this.homeX = Math.max(this.radius + 28, Math.min(width * 0.18, 190))
    this.homeY = height - this.radius - 104

    if (this.pointerId === null) {
      this.resetToHome()
    }
  }

  get directionX(): number {
    return this.inputX
  }

  get directionY(): number {
    return this.inputY
  }

  get isActive(): boolean {
    return this.pointerId !== null
  }

  destroy(scene: Phaser.Scene): void {
    scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.handlePointerDown, this)
    scene.input.off(Phaser.Input.Events.POINTER_MOVE, this.handlePointerMove, this)
    scene.input.off(Phaser.Input.Events.POINTER_UP, this.handlePointerUp, this)
    scene.input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.handlePointerUp, this)

    this.base.destroy()
    this.knob.destroy()
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (!this.enabled || this.pointerId !== null) {
      return
    }

    const width = this.scene.scale.width
    const height = this.scene.scale.height

    if (pointer.x > width * 0.5 || pointer.y < height * 0.3) {
      return
    }

    this.pointerId = pointer.id
    this.base.setPosition(pointer.x, pointer.y)
    this.knob.setPosition(pointer.x, pointer.y)
    this.updateInput(0, 0)
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.pointerId) {
      return
    }

    this.knob.setPosition(pointer.x, pointer.y)
    this.updateInput(pointer.x - this.base.x, pointer.y - this.base.y)
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.pointerId) {
      return
    }

    this.pointerId = null
    this.updateInput(0, 0)
    this.resetToHome()
  }

  private updateInput(deltaX: number, deltaY: number): void {
    const distance = Math.hypot(deltaX, deltaY)

    if (distance < 8) {
      this.inputX = 0
      this.inputY = 0
      return
    }

    const clamped = Math.min(distance, this.maxKnobOffset)
    this.inputX = (deltaX / distance) * (clamped / this.maxKnobOffset)
    this.inputY = (deltaY / distance) * (clamped / this.maxKnobOffset)
  }

  private resetToHome(): void {
    this.base.setPosition(this.homeX, this.homeY)
    this.knob.setPosition(this.homeX, this.homeY)
  }
}
