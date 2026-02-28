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

export interface PanelBuild {
  container: Phaser.GameObjects.Container;
  fill: Phaser.GameObjects.Rectangle;
  border: Phaser.GameObjects.Rectangle;
  topAccent?: Phaser.GameObjects.Rectangle;
}

function hexColor(value: string): number {
  return Number.parseInt(value.replace("#", "0x"), 16);
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
    fontFamily: "monospace",
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
      fontFamily: "monospace",
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
      fontFamily: "monospace",
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
