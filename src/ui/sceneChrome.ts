import Phaser from "phaser";
import { getUiThemeTokens } from "../config/ui/uiTheme";

interface PanelOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  depth?: number;
  fillColor?: number;
  fillAlpha?: number;
  borderColor?: number;
  borderAlpha?: number;
  borderWidth?: number;
  topAccentColor?: number;
  topAccentHeight?: number;
}

interface SceneTitleOptions {
  x: number;
  y: number;
  title: string;
  subtitle?: string;
  description?: string;
  titleSize?: string;
  subtitleSize?: string;
  descriptionSize?: string;
}

interface SceneBackdropOptions {
  variant?: "title" | "menu" | "intro" | "loading";
  includeOrb?: boolean;
}

interface FooterHintOptions {
  text: string;
  y: number;
  accentColor?: number;
  depth?: number;
}

export interface PanelBuild {
  container: Phaser.GameObjects.Container;
  fill: Phaser.GameObjects.Rectangle;
  border: Phaser.GameObjects.Rectangle;
  topAccent?: Phaser.GameObjects.Rectangle;
}

export function hexColor(value: string): number {
  return Number.parseInt(value.replace("#", "0x"), 16);
}

export function createSceneBackdrop(scene: Phaser.Scene, options: SceneBackdropOptions = {}): void {
  const theme = getUiThemeTokens();
  const { width, height } = scene.scale;
  const variant = options.variant ?? "menu";
  const upperBandColor =
    variant === "intro"
      ? hexColor(theme.palette.bgTertiary)
      : variant === "loading"
        ? hexColor(theme.palette.panelElevated)
        : hexColor(theme.palette.bgSecondary);
  const lowerBandColor = variant === "title" ? 0x12091f : hexColor(theme.panel.overlayFill);
  const gridAlpha = variant === "loading" ? 0.14 : variant === "intro" ? 0.16 : 0.22;

  scene.add.rectangle(width * 0.5, height * 0.5, width, height, hexColor(theme.palette.bgPrimary), 1).setOrigin(0.5);
  scene.add.rectangle(width * 0.5, height * 0.37, width, 112, upperBandColor, 0.52).setOrigin(0.5);
  scene.add.rectangle(width * 0.5, height * 0.66, width, 88, lowerBandColor, 0.72).setOrigin(0.5);

  const grid = scene.add.graphics().setDepth(1);
  grid.lineStyle(1, hexColor(theme.palette.accentBlue), gridAlpha);
  for (let y = 88; y < height; y += 18) {
    grid.lineBetween(0, y, width, y);
  }

  if (options.includeOrb) {
    const orbColor = variant === "intro" ? hexColor(theme.palette.accentPink) : hexColor(theme.palette.accentGold);
    const orb = scene.add.circle(width - 68, 52, 20, orbColor, 0.75).setDepth(0);
    scene.tweens.add({
      targets: orb,
      alpha: 0.48,
      duration: theme.motion.pulseSlowMs,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    });
  }
}

export function createFooterHint(scene: Phaser.Scene, options: FooterHintOptions): Phaser.GameObjects.Container {
  const theme = getUiThemeTokens();
  const width = 276;
  const x = Math.floor((scene.scale.width - width) * 0.5);
  const accentColor = options.accentColor ?? hexColor(theme.palette.accentGold);
  const panel = createPanel(scene, {
    x,
    y: options.y,
    width,
    height: 18,
    depth: options.depth,
    fillColor: hexColor(theme.panel.overlayFill),
    fillAlpha: 0.86,
    borderColor: hexColor(theme.panel.mutedBorder),
    borderAlpha: 0.55,
    borderWidth: 1,
    topAccentColor: accentColor,
    topAccentHeight: 1,
  });
  const label = scene.add.text(width * 0.5, 5, options.text, {
    fontFamily: theme.typography.families.uiBody,
    fontSize: theme.typography.caption,
    color: theme.palette.textSecondary,
    stroke: theme.textStroke.light.color,
    strokeThickness: theme.textStroke.light.thickness,
  });
  label.setOrigin(0.5, 0);
  panel.container.add(label);
  return panel.container;
}

export function createPanel(scene: Phaser.Scene, options: PanelOptions): PanelBuild {
  const theme = getUiThemeTokens();
  const container = scene.add.container(options.x, options.y);
  if (options.depth !== undefined) {
    container.setDepth(options.depth);
  }

  const fill = scene.add
    .rectangle(0, 0, options.width, options.height, options.fillColor ?? hexColor(theme.palette.panelFill), options.fillAlpha ?? theme.panel.fillAlpha)
    .setOrigin(0, 0);
  const border = scene.add
    .rectangle(0, 0, options.width, options.height, options.borderColor ?? hexColor(theme.palette.accentBlue), 0)
    .setOrigin(0, 0)
    .setStrokeStyle(options.borderWidth ?? theme.panel.borderWidth, options.borderColor ?? hexColor(theme.palette.accentBlue), options.borderAlpha ?? theme.panel.borderAlpha);

  container.add([fill, border]);

  let topAccent: Phaser.GameObjects.Rectangle | undefined;
  if (options.topAccentColor !== undefined) {
    topAccent = scene.add
      .rectangle(0, 0, options.width, options.topAccentHeight ?? 2, options.topAccentColor, 1)
      .setOrigin(0, 0);
    container.add(topAccent);
  }

  return { container, fill, border, topAccent };
}

export function createSceneTitle(scene: Phaser.Scene, options: SceneTitleOptions): Phaser.GameObjects.Container {
  const theme = getUiThemeTokens();
  const container = scene.add.container(options.x, options.y);

  const title = scene.add.text(0, 0, options.title, {
    fontFamily: theme.typography.families.uiTitle,
    fontSize: options.titleSize ?? theme.typography.title,
    color: theme.palette.textPrimary,
    stroke: theme.textStroke.medium.color,
    strokeThickness: theme.textStroke.medium.thickness,
  });
  title.setOrigin(0.5, 0);
  container.add(title);

  let currentY = title.height + 4;

  if (options.subtitle) {
    const subtitle = scene.add.text(0, currentY, options.subtitle, {
      fontFamily: theme.typography.families.uiBody,
      fontSize: options.subtitleSize ?? theme.typography.subtitle,
      color: theme.palette.textSecondary,
      stroke: theme.textStroke.light.color,
      strokeThickness: theme.textStroke.light.thickness,
    });
    subtitle.setOrigin(0.5, 0);
    container.add(subtitle);
    currentY += subtitle.height + 4;
  }

  if (options.description) {
    const description = scene.add.text(0, currentY, options.description, {
      fontFamily: theme.typography.families.uiBody,
      fontSize: options.descriptionSize ?? theme.typography.body,
      color: theme.palette.textPrimary,
      stroke: theme.textStroke.light.color,
      strokeThickness: theme.textStroke.light.thickness,
    });
    description.setOrigin(0.5, 0);
    container.add(description);
  }

  return container;
}
