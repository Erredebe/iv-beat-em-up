export interface ControlHints {
  keyboard: string[];
  gamepad: string[];
}

export const DEFAULT_CONTROL_HINTS: ControlHints = {
  keyboard: [
    "Mover: Flechas",
    "Ataque: Z",
    "Salto: X",
    "Especial: C (consume vida)",
    "Pausa/Ayuda: ESC",
    "Debug hitboxes: F1",
  ],
  gamepad: [
    "Mover: D-Pad / Stick izq.",
    "Ataque: A / Cross",
    "Salto: B / Circle",
    "Especial: X / Square / LT",
    "Pausa/Ayuda: Start / Options",
  ],
};

