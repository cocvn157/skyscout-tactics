import type { Coordinate, MapId } from '../types/telemetry';

export interface MapZone {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: 'site' | 'lane' | 'spawn' | 'mid' | 'teleporter';
  siteCode?: 'A' | 'B' | 'C';
}

export interface MapObstacle {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MapTeleporterLink {
  id: string;
  label: string;
  from: Coordinate;
  to: Coordinate;
}

export interface TacticalMapBlueprint {
  id: MapId;
  name: string;
  subtitle: string;
  sites: Array<'A' | 'B' | 'C'>;
  zones: MapZone[];
  obstacles: MapObstacle[];
  teleporters?: MapTeleporterLink[];
  callouts: Array<{ label: string; x: number; y: number }>;
  defaultPlantAnchors: Record<'A' | 'B' | 'C', Coordinate>;
  attackSpawnCenter: Coordinate;
  defenseSpawnCenter: Coordinate;
}

export const MAP_BLUEPRINTS: Record<MapId, TacticalMapBlueprint> = {
  ascent: {
    id: 'ascent',
    name: 'Ascent',
    subtitle: 'Mid-dominant 2-site fortress with mechanical doors & Market control',
    sites: ['A', 'B'],
    attackSpawnCenter: { x: 50, y: 90 },
    defenseSpawnCenter: { x: 50, y: 11 },
    defaultPlantAnchors: {
      A: { x: 76, y: 26 },
      B: { x: 22, y: 27 },
      C: { x: 50, y: 27 },
    },
    zones: [
      { id: 'def-spawn', label: 'DEF SPAWN', x: 35, y: 4, w: 30, h: 12, kind: 'spawn' },
      { id: 'atk-spawn', label: 'ATK SPAWN', x: 32, y: 84, w: 36, h: 12, kind: 'spawn' },
      { id: 'a-site', label: 'A SITE', x: 67, y: 18, w: 23, h: 22, kind: 'site', siteCode: 'A' },
      { id: 'b-site', label: 'B SITE', x: 10, y: 18, w: 23, h: 22, kind: 'site', siteCode: 'B' },
      { id: 'a-main', label: 'A MAIN', x: 74, y: 45, w: 15, h: 32, kind: 'lane' },
      { id: 'a-tree', label: 'TREE / GARDEN', x: 57, y: 22, w: 10, h: 16, kind: 'lane' },
      { id: 'b-main', label: 'B MAIN', x: 11, y: 45, w: 14, h: 33, kind: 'lane' },
      { id: 'market', label: 'MARKET', x: 34, y: 24, w: 13, h: 18, kind: 'mid' },
      { id: 'mid-courtyard', label: 'MID COURTYARD', x: 38, y: 44, w: 24, h: 28, kind: 'mid' },
      { id: 'catwalk', label: 'CATWALK', x: 54, y: 36, w: 12, h: 18, kind: 'mid' },
    ],
    obstacles: [
      { x: 26, y: 22, w: 7, h: 12 },
      { x: 48, y: 48, w: 7, h: 10 },
      { x: 75, y: 28, w: 6, h: 6 },
      { x: 18, y: 26, w: 6, h: 7 },
      { x: 64, y: 44, w: 8, h: 24 },
      { x: 26, y: 44, w: 10, h: 24 },
    ],
    callouts: [
      { label: 'Heaven A', x: 72, y: 14 },
      { label: 'Dice / Gen', x: 78, y: 31 },
      { label: 'Pizza', x: 46, y: 34 },
      { label: 'Tiles', x: 42, y: 66 },
      { label: 'Boathouse', x: 15, y: 14 },
      { label: 'Lobby A', x: 74, y: 80 },
      { label: 'Lobby B', x: 22, y: 80 },
    ],
  },
  haven: {
    id: 'haven',
    name: 'Haven',
    subtitle: '3-site macro battlefield demanding fast Garage & Link rotations',
    sites: ['A', 'B', 'C'],
    attackSpawnCenter: { x: 50, y: 90 },
    defenseSpawnCenter: { x: 50, y: 10 },
    defaultPlantAnchors: {
      A: { x: 80, y: 26 },
      B: { x: 50, y: 30 },
      C: { x: 18, y: 25 },
    },
    zones: [
      { id: 'def-spawn', label: 'DEF SPAWN', x: 35, y: 4, w: 30, h: 11, kind: 'spawn' },
      { id: 'atk-spawn', label: 'ATK SPAWN', x: 32, y: 84, w: 36, h: 12, kind: 'spawn' },
      { id: 'c-site', label: 'C SITE', x: 8, y: 17, w: 21, h: 22, kind: 'site', siteCode: 'C' },
      { id: 'b-site', label: 'B SITE', x: 40, y: 21, w: 20, h: 19, kind: 'site', siteCode: 'B' },
      { id: 'a-site', label: 'A SITE', x: 71, y: 17, w: 21, h: 22, kind: 'site', siteCode: 'A' },
      { id: 'c-long', label: 'C LONG', x: 9, y: 44, w: 12, h: 35, kind: 'lane' },
      { id: 'garage', label: 'GARAGE', x: 25, y: 34, w: 13, h: 20, kind: 'mid' },
      { id: 'mid-window', label: 'MID WINDOW', x: 42, y: 44, w: 16, h: 24, kind: 'mid' },
      { id: 'a-short', label: 'A SHORT', x: 64, y: 40, w: 11, h: 26, kind: 'lane' },
      { id: 'a-long', label: 'A LONG', x: 79, y: 42, w: 12, h: 36, kind: 'lane' },
    ],
    obstacles: [
      { x: 22, y: 42, w: 5, h: 28 },
      { x: 38, y: 42, w: 4, h: 22 },
      { x: 59, y: 42, w: 5, h: 24 },
      { x: 75, y: 42, w: 4, h: 22 },
      { x: 47, y: 28, w: 6, h: 6 },
      { x: 15, y: 24, w: 6, h: 6 },
      { x: 78, y: 24, w: 6, h: 6 },
    ],
    callouts: [
      { label: 'C Link', x: 30, y: 18 },
      { label: 'A Link', x: 65, y: 18 },
      { label: 'Grass / Courtyard', x: 49, y: 69 },
      { label: 'Sewers', x: 69, y: 68 },
      { label: 'C Lobby', x: 16, y: 80 },
    ],
  },
  bind: {
    id: 'bind',
    name: 'Bind',
    subtitle: 'No-Mid teleporter rotation map — high-velocity Hookah & Showers control',
    sites: ['A', 'B'],
    attackSpawnCenter: { x: 50, y: 90 },
    defenseSpawnCenter: { x: 50, y: 11 },
    defaultPlantAnchors: {
      A: { x: 76, y: 26 },
      B: { x: 22, y: 26 },
      C: { x: 50, y: 26 },
    },
    zones: [
      { id: 'def-spawn', label: 'DEF SPAWN', x: 36, y: 4, w: 28, h: 12, kind: 'spawn' },
      { id: 'atk-spawn', label: 'ATK SPAWN', x: 32, y: 84, w: 36, h: 12, kind: 'spawn' },
      { id: 'b-site', label: 'B SITE', x: 10, y: 18, w: 24, h: 22, kind: 'site', siteCode: 'B' },
      { id: 'a-site', label: 'A SITE', x: 66, y: 18, w: 24, h: 22, kind: 'site', siteCode: 'A' },
      { id: 'b-long', label: 'B LONG', x: 8, y: 45, w: 12, h: 33, kind: 'lane' },
      { id: 'hookah', label: 'HOOKAH', x: 24, y: 43, w: 14, h: 20, kind: 'lane' },
      { id: 'a-short', label: 'A SHORT', x: 55, y: 42, w: 14, h: 26, kind: 'lane' },
      { id: 'showers', label: 'A SHOWERS', x: 78, y: 44, w: 13, h: 32, kind: 'lane' },
      { id: 'tp-a-to-b', label: 'TP A→B', x: 58, y: 36, w: 7, h: 7, kind: 'teleporter' },
      { id: 'tp-b-to-a', label: 'TP B→A', x: 14, y: 41, w: 7, h: 7, kind: 'teleporter' },
    ],
    obstacles: [
      { x: 39, y: 20, w: 22, h: 48 },
      { x: 20, y: 45, w: 4, h: 24 },
      { x: 70, y: 45, w: 7, h: 24 },
      { x: 18, y: 26, w: 7, h: 6 },
      { x: 74, y: 25, w: 7, h: 6 },
    ],
    teleporters: [
      { id: 'tp-ab', label: 'TP Short→Hookah', from: { x: 61, y: 39 }, to: { x: 31, y: 50 } },
      { id: 'tp-ba', label: 'TP Long→A Lobby', from: { x: 17, y: 44 }, to: { x: 62, y: 74 } },
    ],
    callouts: [
      { label: 'Elbow', x: 34, y: 15 },
      { label: 'Lamps (U-Hall)', x: 62, y: 24 },
      { label: 'Garden', x: 15, y: 77 },
      { label: 'Market', x: 46, y: 76 },
      { label: 'Heaven A', x: 72, y: 13 },
    ],
  },
};
