import Phaser from "phaser";
import { BASE_HEIGHT, BASE_WIDTH } from "../config/constants";
import {
  cloneStageLayoutConfig,
  type StageCollisionFootprint,
  type StageLayoutConfig,
  type StagePropConfig,
} from "../config/levels/street95Zone1";
import { cloneSpawnZones, type StageSpawnZoneConfig } from "../config/levels/street95Zone1Spawns";
import { depthLayers } from "../config/visual/depthLayers";
import {
  SCALE_TIER_ORDER,
  STAGE_PROP_SCALE_REFERENCE,
  resolveScaleReference,
  type ScaleTier,
} from "../config/visual/scaleSystem";

type EditorTool = "prop" | "collision" | "spawn" | "zone" | "lane";
type ZoneAnchor = "triggerX" | "leftBarrierX" | "rightBarrierX";
type LaneAnchor = "topY" | "bottomY" | "playerSpawnY";

const EDITOR_TOOLS: EditorTool[] = ["prop", "collision", "spawn", "zone", "lane"];
const PROP_TEXTURE_OPTIONS = ["prop_booth_front", "prop_container", "prop_crate"] as const;
const SCALE_OPTIONS: ScaleTier[] = SCALE_TIER_ORDER;

interface EditorKeyMap {
  toggle: Phaser.Input.Keyboard.Key;
  cycleTool: Phaser.Input.Keyboard.Key;
  add: Phaser.Input.Keyboard.Key;
  remove: Phaser.Input.Keyboard.Key;
  exportData: Phaser.Input.Keyboard.Key;
  copyData: Phaser.Input.Keyboard.Key;
  previous: Phaser.Input.Keyboard.Key;
  next: Phaser.Input.Keyboard.Key;
  increase: Phaser.Input.Keyboard.Key;
  decrease: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  fast: Phaser.Input.Keyboard.Key;
  camLeft: Phaser.Input.Keyboard.Key;
  camRight: Phaser.Input.Keyboard.Key;
  one: Phaser.Input.Keyboard.Key;
  two: Phaser.Input.Keyboard.Key;
  three: Phaser.Input.Keyboard.Key;
}

interface LevelEditorConfig {
  layout: StageLayoutConfig;
  spawnZones: StageSpawnZoneConfig[];
}

export class LevelEditor {
  private readonly scene: Phaser.Scene;
  private readonly keys: EditorKeyMap;
  private readonly overlay: Phaser.GameObjects.Graphics;
  private readonly panelBg: Phaser.GameObjects.Rectangle;
  private readonly panelText: Phaser.GameObjects.Text;
  private readonly mapWidthPx: number;
  private readonly mapHeightPx: number;
  private readonly cameraPanSpeed = 340;
  private readonly nudgeRepeatMs = 68;

  private active = false;
  private toolIndex = 0;
  private pointerWasDown = false;
  private pointerWorldX = 0;
  private pointerWorldY = 0;
  private statusMessage = "F2 abre el editor";
  private statusUntil = 0;
  private lastExport = "";

  private selectedPropIndex = 0;
  private selectedCollisionIndex = 0;
  private selectedZoneIndex = 0;
  private selectedSpawnIndex = 0;
  private selectedZoneAnchor: ZoneAnchor = "triggerX";
  private selectedLaneAnchor: LaneAnchor = "playerSpawnY";

  private readonly layout: StageLayoutConfig;
  private readonly spawnZones: StageSpawnZoneConfig[];

  constructor(scene: Phaser.Scene, config: LevelEditorConfig) {
    this.scene = scene;
    this.layout = cloneStageLayoutConfig(config.layout);
    this.spawnZones = cloneSpawnZones(config.spawnZones);
    this.mapWidthPx = this.layout.mapWidthTiles * this.layout.tileSize;
    this.mapHeightPx = this.layout.mapHeightTiles * this.layout.tileSize;

    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error("Keyboard input is required for LevelEditor.");
    }
    this.keys = keyboard.addKeys({
      toggle: Phaser.Input.Keyboard.KeyCodes.F2,
      cycleTool: Phaser.Input.Keyboard.KeyCodes.TAB,
      add: Phaser.Input.Keyboard.KeyCodes.N,
      remove: Phaser.Input.Keyboard.KeyCodes.BACKSPACE,
      exportData: Phaser.Input.Keyboard.KeyCodes.G,
      copyData: Phaser.Input.Keyboard.KeyCodes.B,
      previous: Phaser.Input.Keyboard.KeyCodes.Q,
      next: Phaser.Input.Keyboard.KeyCodes.E,
      increase: Phaser.Input.Keyboard.KeyCodes.R,
      decrease: Phaser.Input.Keyboard.KeyCodes.F,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      fast: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      camLeft: Phaser.Input.Keyboard.KeyCodes.A,
      camRight: Phaser.Input.Keyboard.KeyCodes.D,
      one: Phaser.Input.Keyboard.KeyCodes.ONE,
      two: Phaser.Input.Keyboard.KeyCodes.TWO,
      three: Phaser.Input.Keyboard.KeyCodes.THREE,
    }) as EditorKeyMap;

    this.overlay = scene.add.graphics().setDepth(depthLayers.EDITOR_OVERLAY).setVisible(false);
    this.panelBg = scene.add
      .rectangle(8, 8, BASE_WIDTH - 16, 94, 0x050812, 0.84)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depthLayers.EDITOR_PANEL_BG)
      .setVisible(false);
    this.panelText = scene.add
      .text(14, 13, "", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#dbf5ff",
      })
      .setScrollFactor(0)
      .setDepth(depthLayers.EDITOR_PANEL_TEXT)
      .setVisible(false);
  }

  update(timeMs: number, deltaMs: number, camera: Phaser.Cameras.Scene2D.Camera): void {
    if (Phaser.Input.Keyboard.JustDown(this.keys.toggle)) {
      this.active = !this.active;
      this.overlay.setVisible(this.active);
      this.panelBg.setVisible(this.active);
      this.panelText.setVisible(this.active);
      this.setStatus(this.active ? "Editor activo" : "Editor inactivo", timeMs);
    }

    if (!this.active) {
      return;
    }

    this.updateCursor(camera);
    this.panCamera(deltaMs, camera);
    this.handleSelectionByPointer(timeMs);
    this.handleCommonActions(timeMs);
    this.handleToolAdjustments(timeMs);
    this.handleNudge(timeMs);
    this.sanitizeSelection();
    this.drawOverlay();
    this.updatePanelText(timeMs);
  }

  isActive(): boolean {
    return this.active;
  }

  getEditedLayout(): StageLayoutConfig {
    return cloneStageLayoutConfig(this.layout);
  }

  getEditedSpawnZones(): StageSpawnZoneConfig[] {
    return cloneSpawnZones(this.spawnZones);
  }

  destroy(): void {
    this.overlay.destroy();
    this.panelBg.destroy();
    this.panelText.destroy();
  }

  private currentTool(): EditorTool {
    return EDITOR_TOOLS[this.toolIndex]!;
  }

  private updateCursor(camera: Phaser.Cameras.Scene2D.Camera): void {
    const pointer = this.scene.input.activePointer;
    const worldX = camera.scrollX + pointer.x;
    const worldY = camera.scrollY + pointer.y;
    this.pointerWorldX = Phaser.Math.Clamp(Math.round(worldX), 0, this.mapWidthPx);
    this.pointerWorldY = Phaser.Math.Clamp(Math.round(worldY), 0, this.mapHeightPx);
  }

  private panCamera(deltaMs: number, camera: Phaser.Cameras.Scene2D.Camera): void {
    const movement = (this.cameraPanSpeed * deltaMs) / 1000;
    let dx = 0;
    if (this.keys.camLeft.isDown) {
      dx -= movement;
    }
    if (this.keys.camRight.isDown) {
      dx += movement;
    }
    if (dx !== 0) {
      camera.scrollX = Phaser.Math.Clamp(camera.scrollX + dx, 0, Math.max(0, this.mapWidthPx - camera.width));
    }
  }

  private handleSelectionByPointer(timeMs: number): void {
    const pointerDown = this.scene.input.activePointer.leftButtonDown();
    if (pointerDown && !this.pointerWasDown) {
      this.pickAtCursor();
      this.setStatus("Seleccion actualizada", timeMs);
    }
    this.pointerWasDown = pointerDown;
  }

  private handleCommonActions(timeMs: number): void {
    if (Phaser.Input.Keyboard.JustDown(this.keys.cycleTool)) {
      this.toolIndex = (this.toolIndex + 1) % EDITOR_TOOLS.length;
      this.setStatus(`Herramienta: ${this.currentToolLabel()}`, timeMs);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.add)) {
      this.addAtCursor();
      this.setStatus("Elemento creado", timeMs);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.remove)) {
      this.removeSelected();
      this.setStatus("Elemento borrado", timeMs);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.exportData)) {
      this.lastExport = this.buildExportText();
      console.log(`[LEVEL_EDITOR_EXPORT]\n${this.lastExport}`);
      this.setStatus("Export generado en consola (tecla G)", timeMs);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.copyData)) {
      this.copyExportToClipboard(timeMs);
    }
  }

  private handleToolAdjustments(timeMs: number): void {
    if (Phaser.Input.Keyboard.JustDown(this.keys.one)) {
      if (this.currentTool() === "zone") {
        this.selectedZoneAnchor = "triggerX";
        this.setStatus("Zona: editando trigger", timeMs);
      } else if (this.currentTool() === "lane") {
        this.selectedLaneAnchor = "topY";
        this.setStatus("Lane: editando topY", timeMs);
      }
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.two)) {
      if (this.currentTool() === "zone") {
        this.selectedZoneAnchor = "leftBarrierX";
        this.setStatus("Zona: editando leftBarrierX", timeMs);
      } else if (this.currentTool() === "lane") {
        this.selectedLaneAnchor = "bottomY";
        this.setStatus("Lane: editando bottomY", timeMs);
      }
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.three)) {
      if (this.currentTool() === "zone") {
        this.selectedZoneAnchor = "rightBarrierX";
        this.setStatus("Zona: editando rightBarrierX", timeMs);
      } else if (this.currentTool() === "lane") {
        this.selectedLaneAnchor = "playerSpawnY";
        this.setStatus("Lane: editando playerSpawnY", timeMs);
      }
    }

    switch (this.currentTool()) {
      case "prop":
        this.handlePropAdjustments();
        break;
      case "collision":
        this.handleCollisionAdjustments();
        break;
      case "spawn":
        this.handleSpawnAdjustments();
        break;
      case "zone":
        this.handleZoneAdjustments(timeMs);
        break;
      case "lane":
        this.handleLaneAdjustments(timeMs);
        break;
      default:
        break;
    }
  }

  private handlePropAdjustments(): void {
    const selected = this.layout.props[this.selectedPropIndex];
    if (!selected) {
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.previous)) {
      const index = PROP_TEXTURE_OPTIONS.indexOf(selected.textureKey as (typeof PROP_TEXTURE_OPTIONS)[number]);
      const nextIndex = index <= 0 ? PROP_TEXTURE_OPTIONS.length - 1 : index - 1;
      selected.textureKey = PROP_TEXTURE_OPTIONS[nextIndex]!;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.next)) {
      const index = PROP_TEXTURE_OPTIONS.indexOf(selected.textureKey as (typeof PROP_TEXTURE_OPTIONS)[number]);
      const nextIndex = index < 0 || index >= PROP_TEXTURE_OPTIONS.length - 1 ? 0 : index + 1;
      selected.textureKey = PROP_TEXTURE_OPTIONS[nextIndex]!;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.increase)) {
      const currentIndex = SCALE_OPTIONS.indexOf(selected.scaleTier);
      selected.scaleTier = SCALE_OPTIONS[Math.min(SCALE_OPTIONS.length - 1, currentIndex + 1)]!;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.decrease)) {
      const currentIndex = SCALE_OPTIONS.indexOf(selected.scaleTier);
      selected.scaleTier = SCALE_OPTIONS[Math.max(0, currentIndex - 1)]!;
    }
  }

  private handleCollisionAdjustments(): void {
    const selected = this.layout.collisionFootprints[this.selectedCollisionIndex];
    if (!selected) {
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.previous)) {
      selected.width = Math.max(6, selected.width - 2);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.next)) {
      selected.width = Math.min(200, selected.width + 2);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.increase)) {
      selected.height = Math.min(120, selected.height + 2);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.decrease)) {
      selected.height = Math.max(6, selected.height - 2);
    }
  }

  private handleSpawnAdjustments(): void {
    if (this.spawnZones.length < 2) {
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.previous)) {
      this.moveSpawnToAdjacentZone(-1);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.next)) {
      this.moveSpawnToAdjacentZone(1);
    }
  }

  private handleZoneAdjustments(timeMs: number): void {
    if (Phaser.Input.Keyboard.JustDown(this.keys.previous)) {
      this.cycleZone(-1);
      this.setStatus("Zona anterior", timeMs);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.next)) {
      this.cycleZone(1);
      this.setStatus("Zona siguiente", timeMs);
    }
  }

  private handleLaneAdjustments(timeMs: number): void {
    if (Phaser.Input.Keyboard.JustDown(this.keys.previous)) {
      this.cycleLaneAnchor(-1);
      this.setStatus("Lane anchor anterior", timeMs);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.next)) {
      this.cycleLaneAnchor(1);
      this.setStatus("Lane anchor siguiente", timeMs);
    }
  }

  private handleNudge(timeMs: number): void {
    const keyboard = this.scene.input.keyboard;
    if (!keyboard) {
      return;
    }

    const step = this.keys.fast.isDown ? 8 : 1;
    let dx = 0;
    let dy = 0;
    if (keyboard.checkDown(this.keys.left, this.nudgeRepeatMs)) {
      dx -= step;
    }
    if (keyboard.checkDown(this.keys.right, this.nudgeRepeatMs)) {
      dx += step;
    }
    if (keyboard.checkDown(this.keys.up, this.nudgeRepeatMs)) {
      dy -= step;
    }
    if (keyboard.checkDown(this.keys.down, this.nudgeRepeatMs)) {
      dy += step;
    }

    if (dx === 0 && dy === 0) {
      return;
    }

    switch (this.currentTool()) {
      case "prop": {
        const selected = this.layout.props[this.selectedPropIndex];
        if (!selected) {
          return;
        }
        selected.x = Phaser.Math.Clamp(selected.x + dx, 0, this.mapWidthPx);
        selected.y = Phaser.Math.Clamp(selected.y + dy, 0, this.mapHeightPx);
        break;
      }
      case "collision": {
        const selected = this.layout.collisionFootprints[this.selectedCollisionIndex];
        if (!selected) {
          return;
        }
        selected.x = Phaser.Math.Clamp(selected.x + dx, 0, this.mapWidthPx);
        selected.y = Phaser.Math.Clamp(selected.y + dy, 0, this.mapHeightPx);
        break;
      }
      case "spawn": {
        const spawn = this.currentSpawn();
        if (!spawn) {
          return;
        }
        spawn.x = Phaser.Math.Clamp(spawn.x + dx, 0, this.mapWidthPx);
        spawn.y = Phaser.Math.Clamp(spawn.y + dy, 0, this.mapHeightPx);
        break;
      }
      case "zone": {
        const zone = this.spawnZones[this.selectedZoneIndex];
        if (!zone) {
          return;
        }
        zone[this.selectedZoneAnchor] = Phaser.Math.Clamp(zone[this.selectedZoneAnchor] + dx, 0, this.mapWidthPx);
        break;
      }
      case "lane": {
        if (!this.layout.walkLane) {
          return;
        }
        this.layout.walkLane[this.selectedLaneAnchor] = Phaser.Math.Clamp(
          this.layout.walkLane[this.selectedLaneAnchor] + dy,
          0,
          this.mapHeightPx,
        );
        this.enforceLaneOrder();
        break;
      }
      default:
        break;
    }
    this.setStatus(`Movido (${step}px)`, timeMs);
  }

  private addAtCursor(): void {
    switch (this.currentTool()) {
      case "prop": {
        const prop: StagePropConfig = {
          id: this.nextId("prop", this.layout.props.map((entry) => entry.id)),
          textureKey: PROP_TEXTURE_OPTIONS[0],
          x: this.pointerWorldX,
          y: this.pointerWorldY,
          originX: 0.5,
          originY: 1,
          scaleTier: STAGE_PROP_SCALE_REFERENCE.scaleTier,
          spriteSpecId: STAGE_PROP_SCALE_REFERENCE.spriteSpecId,
          depthOffset: 0,
        };
        this.layout.props.push(prop);
        this.selectedPropIndex = this.layout.props.length - 1;
        break;
      }
      case "collision": {
        const footprint: StageCollisionFootprint = {
          id: this.nextId("obstacle", this.layout.collisionFootprints.map((entry) => entry.id)),
          x: this.pointerWorldX,
          y: this.pointerWorldY,
          width: 28,
          height: 10,
          color: 0x42d5ff,
        };
        this.layout.collisionFootprints.push(footprint);
        this.selectedCollisionIndex = this.layout.collisionFootprints.length - 1;
        break;
      }
      case "spawn": {
        if (this.spawnZones.length === 0) {
          this.addAtCursorAsZoneFallback();
        }
        const zone = this.spawnZones[this.selectedZoneIndex] ?? this.spawnZones[0];
        if (!zone) {
          return;
        }
        zone.spawns.push({ x: this.pointerWorldX, y: this.pointerWorldY });
        this.selectedZoneIndex = this.spawnZones.indexOf(zone);
        this.selectedSpawnIndex = zone.spawns.length - 1;
        break;
      }
      case "zone": {
        const centerX = Phaser.Math.Clamp(this.pointerWorldX, 60, this.mapWidthPx - 60);
        const leftX = Phaser.Math.Clamp(centerX - 120, 0, this.mapWidthPx);
        const rightX = Phaser.Math.Clamp(centerX + 120, 0, this.mapWidthPx);
        this.spawnZones.push({
          id: this.nextId("zone", this.spawnZones.map((entry) => entry.id)),
          triggerX: centerX,
          lockType: "full_lock",
          leftBarrierX: leftX,
          rightBarrierX: rightX,
          spawns: [{ x: centerX, y: this.layout.walkLane?.playerSpawnY ?? this.pointerWorldY }],
        });
        this.selectedZoneIndex = this.spawnZones.length - 1;
        this.selectedSpawnIndex = 0;
        break;
      }
      case "lane":
      default:
        break;
    }
  }

  private removeSelected(): void {
    switch (this.currentTool()) {
      case "prop":
        if (this.layout.props.length > 0) {
          this.layout.props.splice(this.selectedPropIndex, 1);
          this.selectedPropIndex = Math.max(0, Math.min(this.selectedPropIndex, this.layout.props.length - 1));
        }
        break;
      case "collision":
        if (this.layout.collisionFootprints.length > 0) {
          this.layout.collisionFootprints.splice(this.selectedCollisionIndex, 1);
          this.selectedCollisionIndex = Math.max(
            0,
            Math.min(this.selectedCollisionIndex, this.layout.collisionFootprints.length - 1),
          );
        }
        break;
      case "spawn": {
        const zone = this.spawnZones[this.selectedZoneIndex];
        if (!zone || zone.spawns.length === 0) {
          return;
        }
        zone.spawns.splice(this.selectedSpawnIndex, 1);
        this.selectedSpawnIndex = Math.max(0, Math.min(this.selectedSpawnIndex, zone.spawns.length - 1));
        break;
      }
      case "zone":
        if (this.spawnZones.length > 0) {
          this.spawnZones.splice(this.selectedZoneIndex, 1);
          this.selectedZoneIndex = Math.max(0, Math.min(this.selectedZoneIndex, this.spawnZones.length - 1));
          this.selectedSpawnIndex = 0;
        }
        break;
      case "lane":
      default:
        break;
    }
  }

  private pickAtCursor(): void {
    switch (this.currentTool()) {
      case "prop": {
        let bestDistance = Number.POSITIVE_INFINITY;
        let bestIndex = this.selectedPropIndex;
        this.layout.props.forEach((entry, index) => {
          const distance = Phaser.Math.Distance.Between(entry.x, entry.y, this.pointerWorldX, this.pointerWorldY);
          if (distance < bestDistance) {
            bestDistance = distance;
            bestIndex = index;
          }
        });
        this.selectedPropIndex = bestIndex;
        break;
      }
      case "collision": {
        let bestScore = Number.POSITIVE_INFINITY;
        let bestIndex = this.selectedCollisionIndex;
        this.layout.collisionFootprints.forEach((entry, index) => {
          const left = entry.x - entry.width * 0.5;
          const right = entry.x + entry.width * 0.5;
          const top = entry.y - entry.height * 0.5;
          const bottom = entry.y + entry.height * 0.5;
          const inside =
            this.pointerWorldX >= left &&
            this.pointerWorldX <= right &&
            this.pointerWorldY >= top &&
            this.pointerWorldY <= bottom;
          const distance = inside ? 0 : Phaser.Math.Distance.Between(entry.x, entry.y, this.pointerWorldX, this.pointerWorldY);
          if (distance < bestScore) {
            bestScore = distance;
            bestIndex = index;
          }
        });
        this.selectedCollisionIndex = bestIndex;
        break;
      }
      case "spawn": {
        let bestDistance = Number.POSITIVE_INFINITY;
        let bestZoneIndex = this.selectedZoneIndex;
        let bestSpawnIndex = this.selectedSpawnIndex;
        this.spawnZones.forEach((zone, zoneIndex) => {
          zone.spawns.forEach((spawn, spawnIndex) => {
            const distance = Phaser.Math.Distance.Between(spawn.x, spawn.y, this.pointerWorldX, this.pointerWorldY);
            if (distance < bestDistance) {
              bestDistance = distance;
              bestZoneIndex = zoneIndex;
              bestSpawnIndex = spawnIndex;
            }
          });
        });
        this.selectedZoneIndex = bestZoneIndex;
        this.selectedSpawnIndex = bestSpawnIndex;
        break;
      }
      case "zone": {
        let bestDistance = Number.POSITIVE_INFINITY;
        let bestZoneIndex = this.selectedZoneIndex;
        let bestAnchor: ZoneAnchor = this.selectedZoneAnchor;
        this.spawnZones.forEach((zone, zoneIndex) => {
          (["triggerX", "leftBarrierX", "rightBarrierX"] as ZoneAnchor[]).forEach((anchor) => {
            const distance = Math.abs(zone[anchor] - this.pointerWorldX);
            if (distance < bestDistance) {
              bestDistance = distance;
              bestZoneIndex = zoneIndex;
              bestAnchor = anchor;
            }
          });
        });
        this.selectedZoneIndex = bestZoneIndex;
        this.selectedZoneAnchor = bestAnchor;
        break;
      }
      case "lane": {
        if (!this.layout.walkLane) {
          return;
        }
        const topDistance = Math.abs(this.layout.walkLane.topY - this.pointerWorldY);
        const bottomDistance = Math.abs(this.layout.walkLane.bottomY - this.pointerWorldY);
        const spawnDistance = Math.abs(this.layout.walkLane.playerSpawnY - this.pointerWorldY);
        if (topDistance <= bottomDistance && topDistance <= spawnDistance) {
          this.selectedLaneAnchor = "topY";
        } else if (bottomDistance <= topDistance && bottomDistance <= spawnDistance) {
          this.selectedLaneAnchor = "bottomY";
        } else {
          this.selectedLaneAnchor = "playerSpawnY";
        }
        break;
      }
      default:
        break;
    }
  }

  private drawOverlay(): void {
    this.overlay.clear();
    this.overlay.lineStyle(1, 0xffffff, 0.16);
    this.overlay.strokeRect(0, 0, this.mapWidthPx, this.mapHeightPx);

    this.drawLaneOverlay();
    this.drawZoneOverlay();
    this.drawCollisionOverlay();
    this.drawPropOverlay();

    this.overlay.lineStyle(1, 0xffffff, 0.7);
    this.overlay.lineBetween(this.pointerWorldX - 6, this.pointerWorldY, this.pointerWorldX + 6, this.pointerWorldY);
    this.overlay.lineBetween(this.pointerWorldX, this.pointerWorldY - 6, this.pointerWorldX, this.pointerWorldY + 6);
  }

  private drawPropOverlay(): void {
    this.layout.props.forEach((prop, index) => {
      const isSelected = this.currentTool() === "prop" && index === this.selectedPropIndex;
      const color = isSelected ? 0xffee88 : 0x53d8ff;
      const alpha = isSelected ? 1 : 0.5;
      const size = this.getPropSize(prop);
      const left = prop.x - prop.originX * size.width;
      const top = prop.y - prop.originY * size.height;
      this.overlay.lineStyle(1, color, alpha);
      this.overlay.strokeRect(left, top, size.width, size.height);
      this.overlay.fillStyle(color, alpha);
      this.overlay.fillCircle(prop.x, prop.y, isSelected ? 3 : 2);
    });
  }

  private drawCollisionOverlay(): void {
    this.layout.collisionFootprints.forEach((footprint, index) => {
      const isSelected = this.currentTool() === "collision" && index === this.selectedCollisionIndex;
      const color = isSelected ? 0xffc46f : 0x64ff9e;
      const alpha = isSelected ? 1 : 0.48;
      const left = footprint.x - footprint.width * 0.5;
      const top = footprint.y - footprint.height * 0.5;
      this.overlay.lineStyle(1, color, alpha);
      this.overlay.strokeRect(left, top, footprint.width, footprint.height);
      this.overlay.fillStyle(color, alpha);
      this.overlay.fillCircle(footprint.x, footprint.y, isSelected ? 3 : 2);
    });
  }

  private drawZoneOverlay(): void {
    const laneTop = this.layout.walkLane?.topY ?? 0;
    const laneBottom = this.layout.walkLane?.bottomY ?? this.mapHeightPx;

    this.spawnZones.forEach((zone, zoneIndex) => {
      const isZoneSelected = zoneIndex === this.selectedZoneIndex;
      this.overlay.lineStyle(1, 0xf762ff, isZoneSelected ? 0.95 : 0.45);
      this.overlay.lineBetween(zone.triggerX, laneTop, zone.triggerX, laneBottom);
      this.overlay.lineStyle(1, 0x63d4ff, isZoneSelected ? 0.9 : 0.42);
      this.overlay.lineBetween(zone.leftBarrierX, laneTop, zone.leftBarrierX, laneBottom);
      this.overlay.lineBetween(zone.rightBarrierX, laneTop, zone.rightBarrierX, laneBottom);

      zone.spawns.forEach((spawn, spawnIndex) => {
        const isSpawnSelected = this.currentTool() === "spawn" && isZoneSelected && spawnIndex === this.selectedSpawnIndex;
        const color = isSpawnSelected ? 0xfff17a : 0xff5f97;
        this.overlay.fillStyle(color, isSpawnSelected ? 0.95 : 0.62);
        this.overlay.fillCircle(spawn.x, spawn.y, isSpawnSelected ? 4 : 3);
      });

      if (this.currentTool() === "zone" && isZoneSelected) {
        const anchorX = zone[this.selectedZoneAnchor];
        this.overlay.lineStyle(2, 0xfff17a, 1);
        this.overlay.lineBetween(anchorX, 0, anchorX, this.mapHeightPx);
      }
    });
  }

  private drawLaneOverlay(): void {
    const lane = this.layout.walkLane;
    if (!lane) {
      return;
    }
    this.overlay.lineStyle(1, 0x3fbdff, 0.8);
    this.overlay.lineBetween(0, lane.topY, this.mapWidthPx, lane.topY);
    this.overlay.lineStyle(1, 0xff9857, 0.8);
    this.overlay.lineBetween(0, lane.bottomY, this.mapWidthPx, lane.bottomY);
    this.overlay.lineStyle(1, 0xffec72, 0.8);
    this.overlay.lineBetween(0, lane.playerSpawnY, this.mapWidthPx, lane.playerSpawnY);

    if (this.currentTool() === "lane") {
      this.overlay.lineStyle(2, 0xfff17a, 1);
      this.overlay.lineBetween(0, lane[this.selectedLaneAnchor], this.mapWidthPx, lane[this.selectedLaneAnchor]);
    }
  }

  private updatePanelText(timeMs: number): void {
    const tool = this.currentToolLabel();
    const common = "Tab herramienta | N crear | Backspace borrar | Flechas mover | Shift x8 | A/D camara";
    const exportHint = "G exporta a consola | B copia export";

    const detailLines: string[] = [];
    detailLines.push(`TOOL ${tool}`);
    detailLines.push(common);
    detailLines.push(exportHint);
    detailLines.push(`Cursor ${this.pointerWorldX},${this.pointerWorldY}`);

    if (this.currentTool() === "prop") {
      const prop = this.layout.props[this.selectedPropIndex];
      if (prop) {
        const scale = resolveScaleReference({ scaleTier: prop.scaleTier, spriteSpecId: prop.spriteSpecId });
        detailLines.push(`Q/E textura | R/F escala | SEL ${prop.id} ${prop.textureKey} ${prop.scaleTier} (${scale}x)`);
        detailLines.push(`Pos ${Math.round(prop.x)},${Math.round(prop.y)} Origin ${prop.originX},${prop.originY}`);
      }
    } else if (this.currentTool() === "collision") {
      const collision = this.layout.collisionFootprints[this.selectedCollisionIndex];
      if (collision) {
        detailLines.push(`Q/E ancho | R/F alto | SEL ${collision.id}`);
        detailLines.push(`Pos ${Math.round(collision.x)},${Math.round(collision.y)} Size ${collision.width}x${collision.height}`);
      }
    } else if (this.currentTool() === "spawn") {
      const zone = this.spawnZones[this.selectedZoneIndex];
      const spawn = this.currentSpawn();
      if (zone && spawn) {
        detailLines.push(`Q/E mueve spawn entre zonas | SEL ${zone.id} spawn_${this.selectedSpawnIndex + 1}`);
        detailLines.push(`Pos ${Math.round(spawn.x)},${Math.round(spawn.y)}`);
      }
    } else if (this.currentTool() === "zone") {
      const zone = this.spawnZones[this.selectedZoneIndex];
      if (zone) {
        detailLines.push(`1 trigger | 2 left | 3 right | Q/E cambia zona | SEL ${zone.id}`);
        detailLines.push(`Trigger ${zone.triggerX} Left ${zone.leftBarrierX} Right ${zone.rightBarrierX}`);
      }
    } else if (this.currentTool() === "lane") {
      const lane = this.layout.walkLane;
      if (lane) {
        detailLines.push(`1 top | 2 bottom | 3 spawn | Q/E cambia anchor`);
        detailLines.push(`top ${lane.topY} bottom ${lane.bottomY} spawn ${lane.playerSpawnY} | edit ${this.selectedLaneAnchor}`);
      }
    }

    if (timeMs <= this.statusUntil) {
      detailLines.push(`Estado: ${this.statusMessage}`);
    }
    this.panelText.setText(detailLines);
    this.panelBg.height = Math.max(92, 10 + detailLines.length * 12);
  }

  private currentToolLabel(): string {
    return this.currentTool().toUpperCase();
  }

  private currentSpawn(): { x: number; y: number } | null {
    const zone = this.spawnZones[this.selectedZoneIndex];
    if (!zone) {
      return null;
    }
    const spawn = zone.spawns[this.selectedSpawnIndex];
    return spawn ?? null;
  }

  private moveSpawnToAdjacentZone(offset: number): void {
    const zone = this.spawnZones[this.selectedZoneIndex];
    if (!zone) {
      return;
    }
    const spawn = zone.spawns[this.selectedSpawnIndex];
    if (!spawn) {
      return;
    }
    const targetZoneIndex = Phaser.Math.Wrap(this.selectedZoneIndex + offset, 0, this.spawnZones.length);
    const targetZone = this.spawnZones[targetZoneIndex];
    if (!targetZone) {
      return;
    }
    zone.spawns.splice(this.selectedSpawnIndex, 1);
    targetZone.spawns.push(spawn);
    this.selectedZoneIndex = targetZoneIndex;
    this.selectedSpawnIndex = targetZone.spawns.length - 1;
  }

  private cycleZone(offset: number): void {
    if (this.spawnZones.length === 0) {
      return;
    }
    this.selectedZoneIndex = Phaser.Math.Wrap(this.selectedZoneIndex + offset, 0, this.spawnZones.length);
    const zone = this.spawnZones[this.selectedZoneIndex];
    if (zone && zone.spawns.length > 0) {
      this.selectedSpawnIndex = Math.min(this.selectedSpawnIndex, zone.spawns.length - 1);
    } else {
      this.selectedSpawnIndex = 0;
    }
  }

  private cycleLaneAnchor(offset: number): void {
    const anchors: LaneAnchor[] = ["topY", "bottomY", "playerSpawnY"];
    const index = anchors.indexOf(this.selectedLaneAnchor);
    const nextIndex = Phaser.Math.Wrap(index + offset, 0, anchors.length);
    this.selectedLaneAnchor = anchors[nextIndex]!;
  }

  private setStatus(message: string, nowMs: number): void {
    this.statusMessage = message;
    this.statusUntil = nowMs + 1700;
  }

  private sanitizeSelection(): void {
    this.selectedPropIndex = Phaser.Math.Clamp(this.selectedPropIndex, 0, Math.max(0, this.layout.props.length - 1));
    this.selectedCollisionIndex = Phaser.Math.Clamp(
      this.selectedCollisionIndex,
      0,
      Math.max(0, this.layout.collisionFootprints.length - 1),
    );
    this.selectedZoneIndex = Phaser.Math.Clamp(this.selectedZoneIndex, 0, Math.max(0, this.spawnZones.length - 1));

    const zone = this.spawnZones[this.selectedZoneIndex];
    if (!zone || zone.spawns.length === 0) {
      this.selectedSpawnIndex = 0;
    } else {
      this.selectedSpawnIndex = Phaser.Math.Clamp(this.selectedSpawnIndex, 0, zone.spawns.length - 1);
    }
  }

  private enforceLaneOrder(): void {
    const lane = this.layout.walkLane;
    if (!lane) {
      return;
    }
    lane.topY = Phaser.Math.Clamp(lane.topY, 0, this.mapHeightPx);
    lane.bottomY = Phaser.Math.Clamp(lane.bottomY, 0, this.mapHeightPx);
    lane.playerSpawnY = Phaser.Math.Clamp(lane.playerSpawnY, 0, this.mapHeightPx);
    if (lane.topY >= lane.bottomY) {
      lane.bottomY = Math.min(this.mapHeightPx, lane.topY + 1);
    }
    lane.playerSpawnY = Phaser.Math.Clamp(lane.playerSpawnY, lane.topY, lane.bottomY);
  }

  private getPropSize(prop: StagePropConfig): { width: number; height: number } {
    const texture = this.scene.textures.get(prop.textureKey);
    const source = texture?.getSourceImage() as { width?: number; height?: number } | undefined;
    const scale = resolveScaleReference({ scaleTier: prop.scaleTier, spriteSpecId: prop.spriteSpecId });
    const width = (source?.width ?? 32) * scale;
    const height = (source?.height ?? 48) * scale;
    return { width, height };
  }

  private addAtCursorAsZoneFallback(): void {
    const centerX = Phaser.Math.Clamp(this.pointerWorldX, 60, this.mapWidthPx - 60);
    this.spawnZones.push({
      id: this.nextId("zone", this.spawnZones.map((entry) => entry.id)),
      triggerX: centerX,
      lockType: "full_lock",
      leftBarrierX: Phaser.Math.Clamp(centerX - 80, 0, this.mapWidthPx),
      rightBarrierX: Phaser.Math.Clamp(centerX + 80, 0, this.mapWidthPx),
      spawns: [],
    });
    this.selectedZoneIndex = this.spawnZones.length - 1;
  }

  private nextId(prefix: string, existing: string[]): string {
    let idx = existing.length + 1;
    let candidate = `${prefix}_${idx}`;
    while (existing.includes(candidate)) {
      idx += 1;
      candidate = `${prefix}_${idx}`;
    }
    return candidate;
  }

  private buildExportText(): string {
    const layoutJson = JSON.stringify(this.layout, null, 2);
    const zonesJson = JSON.stringify(this.spawnZones, null, 2);
    return [
      "import type { StageLayoutConfig } from \"./street95Zone1\";",
      "import type { StageSpawnZoneConfig } from \"./street95Zone1Spawns\";",
      "",
      `export const street95Zone1Layout: StageLayoutConfig = ${layoutJson};`,
      "",
      `export const street95Zone1Spawns: StageSpawnZoneConfig[] = ${zonesJson};`,
      "",
      `// viewport: ${BASE_WIDTH}x${BASE_HEIGHT}, map: ${this.mapWidthPx}x${this.mapHeightPx}`,
    ].join("\n");
  }

  private copyExportToClipboard(nowMs: number): void {
    if (!this.lastExport) {
      this.lastExport = this.buildExportText();
    }
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      this.setStatus("Clipboard no disponible en este contexto", nowMs);
      return;
    }
    void navigator.clipboard
      .writeText(this.lastExport)
      .then(() => this.setStatus("Export copiado al portapapeles", nowMs))
      .catch(() => this.setStatus("No se pudo copiar; usa la consola", nowMs));
  }
}
