export class InputManager {
  public keys: { [code: string]: boolean } = {}
  public keysJustPressed: { [code: string]: boolean } = {}
  
  public mouseDeltaX = 0
  public mouseDeltaY = 0
  public isPointerLocked = false
  public cameraDistance = 4.5

  private targetElement: HTMLElement | null = null

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleKeyUp = this.handleKeyUp.bind(this)
    this.handleMouseMove = this.handleMouseMove.bind(this)
    this.handlePointerLockChange = this.handlePointerLockChange.bind(this)
    this.handleWheel = this.handleWheel.bind(this)

    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
    window.addEventListener('mousemove', this.handleMouseMove)
    document.addEventListener('pointerlockchange', this.handlePointerLockChange)
    window.addEventListener('wheel', this.handleWheel, { passive: true })
  }

  public attachToElement(element: HTMLElement) {
    this.targetElement = element
  }

  public requestPointerLock() {
    if (this.targetElement && !this.isPointerLocked) {
      try {
        this.targetElement.requestPointerLock()
      } catch (err) {
        console.warn('Pointer lock request error:', err)
      }
    }
  }

  public releasePointerLock() {
    if (this.isPointerLocked) {
      document.exitPointerLock()
    }
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (!this.keys[e.code]) {
      this.keysJustPressed[e.code] = true
    }
    this.keys[e.code] = true

    // Prevent default scrolling for game keys
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) {
      e.preventDefault()
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    this.keys[e.code] = false
  }

  private handleMouseMove(e: MouseEvent) {
    if (this.isPointerLocked) {
      this.mouseDeltaX += e.movementX
      this.mouseDeltaY += e.movementY
    }
  }

  private handlePointerLockChange() {
    this.isPointerLocked = document.pointerLockElement === this.targetElement
  }

  private handleWheel(e: WheelEvent) {
    this.cameraDistance = Math.max(2.0, Math.min(12.0, this.cameraDistance + e.deltaY * 0.005))
  }

  public isActionActive(action: 'forward' | 'backward' | 'left' | 'right' | 'sprint' | 'jump' | 'crouch' | 'handbrake'): boolean {
    switch (action) {
      case 'forward':
        return !!(this.keys['KeyW'] || this.keys['ArrowUp'])
      case 'backward':
        return !!(this.keys['KeyS'] || this.keys['ArrowDown'])
      case 'left':
        return !!(this.keys['KeyA'] || this.keys['ArrowLeft'])
      case 'right':
        return !!(this.keys['KeyD'] || this.keys['ArrowRight'])
      case 'sprint':
        return !!(this.keys['ShiftLeft'] || this.keys['ShiftRight'])
      case 'jump':
      case 'handbrake':
        return !!this.keys['Space']
      case 'crouch':
        return !!this.keys['KeyC']
      default:
        return false
    }
  }

  public wasKeyJustPressed(code: string): boolean {
    return !!this.keysJustPressed[code]
  }

  public update() {
    // Reset frame-specific inputs
    this.mouseDeltaX = 0
    this.mouseDeltaY = 0
    this.keysJustPressed = {}
  }

  public destroy() {
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
    window.removeEventListener('mousemove', this.handleMouseMove)
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange)
    window.removeEventListener('wheel', this.handleWheel)
  }
}

export const gameInput = new InputManager()
