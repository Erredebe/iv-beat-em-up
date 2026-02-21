import Phaser from "phaser";
import { INPUT_BUFFER_MS } from "../config/constants";
import { DEFAULT_CONTROL_HINTS } from "../config/ui/controlHints";

export type InputAction =
  | "up"
  | "down"
  | "left"
  | "right"
  | "attack"
  | "jump"
  | "special"
  | "pause"
  | "ui_confirm";

const GAMEPAD_AXES_DEADZONE = 0.24;

export class InputManager {
  private readonly scene: Phaser.Scene;
  private readonly keys: Record<InputAction, Phaser.Input.Keyboard.Key>;
  private readonly bufferedAt = new Map<InputAction, number>();
  private readonly previousGamepadButtons = new Map<number, boolean[]>();
  private nowMs = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error("Keyboard input is required for InputManager.");
    }

    this.keys = keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      attack: Phaser.Input.Keyboard.KeyCodes.Z,
      jump: Phaser.Input.Keyboard.KeyCodes.X,
      special: Phaser.Input.Keyboard.KeyCodes.C,
      pause: Phaser.Input.Keyboard.KeyCodes.ESC,
      ui_confirm: Phaser.Input.Keyboard.KeyCodes.ENTER,
    }) as Record<InputAction, Phaser.Input.Keyboard.Key>;

    keyboard.on("keydown", (event: KeyboardEvent) => {
      if (event.code === "NumpadEnter") {
        this.bufferedAt.set("ui_confirm", this.nowMs);
      }
    });
  }

  update(timeMs: number): void {
    this.nowMs = timeMs;
    this.captureKeyboardEdges();
    this.captureGamepadEdges();
  }

  isDown(action: InputAction): boolean {
    return this.keys[action].isDown || this.isGamepadActionDown(action);
  }

  consumeBuffered(action: InputAction, windowMs = INPUT_BUFFER_MS): boolean {
    const pressedAt = this.bufferedAt.get(action);
    if (pressedAt === undefined || this.nowMs - pressedAt > windowMs) {
      return false;
    }

    this.bufferedAt.delete(action);
    return true;
  }

  consumeBufferedChord(actions: InputAction[], windowMs = INPUT_BUFFER_MS): boolean {
    for (const action of actions) {
      const pressedAt = this.bufferedAt.get(action);
      if (pressedAt === undefined || this.nowMs - pressedAt > windowMs) {
        return false;
      }
    }

    for (const action of actions) {
      this.bufferedAt.delete(action);
    }
    return true;
  }

  consumeChord(actions: InputAction[], windowMs = INPUT_BUFFER_MS): boolean {
    return this.consumeBufferedChord(actions, windowMs);
  }

  getMoveVector(): Phaser.Math.Vector2 {
    let x = 0;
    let y = 0;

    if (this.isDown("left")) {
      x -= 1;
    }
    if (this.isDown("right")) {
      x += 1;
    }
    if (this.isDown("up")) {
      y -= 1;
    }
    if (this.isDown("down")) {
      y += 1;
    }

    const pads = this.scene.input.gamepad?.gamepads ?? [];
    for (const pad of pads) {
      if (!pad || !pad.connected) {
        continue;
      }

      if (Math.abs(pad.leftStick.x) > GAMEPAD_AXES_DEADZONE) {
        x += pad.leftStick.x;
      }
      if (Math.abs(pad.leftStick.y) > GAMEPAD_AXES_DEADZONE) {
        y += pad.leftStick.y;
      }
    }

    const vector = new Phaser.Math.Vector2(x, y);
    if (vector.lengthSq() > 1) {
      vector.normalize();
    }
    return vector;
  }

  hasAnyInputDown(): boolean {
    return (
      this.isDown("left") ||
      this.isDown("right") ||
      this.isDown("up") ||
      this.isDown("down") ||
      this.isDown("attack") ||
      this.isDown("jump") ||
      this.isDown("special") ||
      this.isDown("pause") ||
      this.isDown("ui_confirm")
    );
  }

  getBindingHints(): { keyboard: string[]; gamepad: string[] } {
    return {
      keyboard: [...DEFAULT_CONTROL_HINTS.keyboard],
      gamepad: [...DEFAULT_CONTROL_HINTS.gamepad],
    };
  }

  private captureKeyboardEdges(): void {
    for (const action of Object.keys(this.keys) as InputAction[]) {
      if (Phaser.Input.Keyboard.JustDown(this.keys[action])) {
        this.bufferedAt.set(action, this.nowMs);
      }
    }
  }

  private captureGamepadEdges(): void {
    const pads = this.scene.input.gamepad?.gamepads ?? [];
    for (const pad of pads) {
      if (!pad || !pad.connected) {
        continue;
      }

      const previousState = this.previousGamepadButtons.get(pad.index) ?? [];
      for (let i = 0; i < pad.buttons.length; i += 1) {
        const pressed = pad.buttons[i].pressed;
        const wasPressed = previousState[i] ?? false;
        if (pressed && !wasPressed) {
          this.bufferGamepadButton(i);
        }
        previousState[i] = pressed;
      }
      this.previousGamepadButtons.set(pad.index, previousState);
    }
  }

  private bufferGamepadButton(buttonIndex: number): void {
    if (buttonIndex === 0) {
      this.bufferedAt.set("attack", this.nowMs);
    } else if (buttonIndex === 1) {
      this.bufferedAt.set("jump", this.nowMs);
    } else if (buttonIndex === 2 || buttonIndex === 4 || buttonIndex === 6) {
      this.bufferedAt.set("special", this.nowMs);
    } else if (buttonIndex === 9) {
      this.bufferedAt.set("pause", this.nowMs);
    } else if (buttonIndex === 3) {
      this.bufferedAt.set("ui_confirm", this.nowMs);
    }
  }

  private isGamepadActionDown(action: InputAction): boolean {
    const pads = this.scene.input.gamepad?.gamepads ?? [];
    for (const pad of pads) {
      if (!pad || !pad.connected) {
        continue;
      }

      if (action === "left" && (pad.left || pad.leftStick.x < -GAMEPAD_AXES_DEADZONE)) {
        return true;
      }
      if (action === "right" && (pad.right || pad.leftStick.x > GAMEPAD_AXES_DEADZONE)) {
        return true;
      }
      if (action === "up" && (pad.up || pad.leftStick.y < -GAMEPAD_AXES_DEADZONE)) {
        return true;
      }
      if (action === "down" && (pad.down || pad.leftStick.y > GAMEPAD_AXES_DEADZONE)) {
        return true;
      }
      if (action === "attack" && pad.buttons[0]?.pressed) {
        return true;
      }
      if (action === "jump" && pad.buttons[1]?.pressed) {
        return true;
      }
      if (action === "special" && (pad.buttons[2]?.pressed || pad.buttons[4]?.pressed || pad.buttons[6]?.pressed)) {
        return true;
      }
      if (action === "pause" && pad.buttons[9]?.pressed) {
        return true;
      }
      if (action === "ui_confirm" && pad.buttons[3]?.pressed) {
        return true;
      }
    }

    return false;
  }
}
