import { create } from 'zustand';

export type VariantId =
  | 'clean'
  | 'playful'
  | 'blueprint'
  | 'topographic'
  | 'neon'
  | 'void'
  | 'deep-sea'
  | 'monolith'
  | 'liquid'
  | 'glassy'
  | 'retro-terminal'
  | 'analog'
  | 'interference';

export type VariantGroup = 'light' | 'dark' | 'experimental';

export type VariantConfig = {
  id: VariantId;
  label: string;
  group: VariantGroup;
  bg: string;
  accent: string;
  textColor: string;
  textSecondary: string;
  tagline: string | null;
  statement: string | null;
  cascadeSpeed: number;
  cascadeArcHeight: number;
  cascadeHandSpacing: number;
  cascadePosition:
    | 'center'
    | 'center-right'
    | 'center-left'
    | 'left'
    | 'right';
  showHands: boolean;
  objectMode: 'default' | 'wireframe' | 'glow' | 'outline' | 'monochrome';
  zoneOrder: string[];
  drawIllustration:
    | 'automation'
    | 'neural'
    | 'circuit'
    | 'contour'
    | 'architectural'
    | null;
  tracePattern: string;
  fieldPreset:
    | 'drift'
    | 'bioluminescent'
    | 'firefly'
    | 'contour'
    | 'swarm'
    | 'interference'
    | null;
  noisePreset: 'grain' | 'scanlines' | 'paper' | 'film' | 'moire' | null;
  noiseZones: string[];
  decayMode:
    | 'glitch'
    | 'ascii'
    | 'vhs'
    | 'dissolve'
    | 'neon-flicker'
    | null;
  mirrorDistortion: 'blur' | 'wave' | 'color-shift' | 'compress' | null;
  splitPanels: 2 | 3 | 4 | null;
  typewriterText: string | null;
  loadAnimation: string;
  specialFont: string | null;
  glassMode: boolean;
  flowingLineColor: string;
  flowingLineGlow: boolean;
};

export const VARIANTS: Record<VariantId, VariantConfig> = {
  clean: {
    id: 'clean',
    label: 'Clean',
    group: 'light',
    bg: '#fafaf9',
    accent: '#3b82f6',
    textColor: '#18181b',
    textSecondary: '#71717a',
    tagline: 'Systems. Interfaces. Things that think.',
    statement: 'Complexity is interesting.',
    cascadeSpeed: 2.2,
    cascadeArcHeight: 260,
    cascadeHandSpacing: 200,
    cascadePosition: 'center-right',
    showHands: true,
    objectMode: 'default',
    zoneOrder: ['hero', 'breath', 'draw', 'field', 'trace', 'footer'],
    drawIllustration: 'automation',
    tracePattern: 'flowingArcs',
    fieldPreset: 'drift',
    noisePreset: null,
    noiseZones: [],
    decayMode: null,
    mirrorDistortion: null,
    splitPanels: null,
    typewriterText: null,
    loadAnimation: 'staggered',
    specialFont: null,
    glassMode: false,
    flowingLineColor: '#3b82f6',
    flowingLineGlow: false,
  },

  playful: {
    id: 'playful',
    label: 'Playful',
    group: 'light',
    bg: '#fafaf9',
    accent: '#f59e0b',
    textColor: '#18181b',
    textSecondary: '#71717a',
    tagline: 'I build things and throw them around.',
    statement: 'Throw.',
    cascadeSpeed: 3.5,
    cascadeArcHeight: 280,
    cascadeHandSpacing: 260,
    cascadePosition: 'center',
    showHands: true,
    objectMode: 'default',
    zoneOrder: [
      'hero',
      'field',
      'draw',
      'split',
      'trace',
      'breath',
      'footer',
    ],
    drawIllustration: 'automation',
    tracePattern: 'explosiveBurst',
    fieldPreset: 'drift',
    noisePreset: 'grain',
    noiseZones: ['field'],
    decayMode: null,
    mirrorDistortion: null,
    splitPanels: 3,
    typewriterText: null,
    loadAnimation: 'explosive',
    specialFont: null,
    glassMode: false,
    flowingLineColor: '#f59e0b',
    flowingLineGlow: false,
  },

  blueprint: {
    id: 'blueprint',
    label: 'Blueprint',
    group: 'light',
    bg: '#f0f4ff',
    accent: '#1d4ed8',
    textColor: '#1e3a5f',
    textSecondary: '#3b6cb5',
    tagline: 'Drafted. Measured. Built.',
    statement: null,
    cascadeSpeed: 2.5,
    cascadeArcHeight: 260,
    cascadeHandSpacing: 240,
    cascadePosition: 'right',
    showHands: true,
    objectMode: 'outline',
    zoneOrder: ['hero', 'draw', 'breath', 'trace', 'field', 'footer'],
    drawIllustration: 'architectural',
    tracePattern: 'geometricGrid',
    fieldPreset: 'contour',
    noisePreset: null,
    noiseZones: [],
    decayMode: null,
    mirrorDistortion: null,
    splitPanels: null,
    typewriterText: null,
    loadAnimation: 'grid-plot',
    specialFont: null,
    glassMode: false,
    flowingLineColor: '#1d4ed8',
    flowingLineGlow: false,
  },

  topographic: {
    id: 'topographic',
    label: 'Topographic',
    group: 'light',
    bg: '#faf7f2',
    accent: '#b45309',
    textColor: '#44403c',
    textSecondary: '#78716c',
    tagline: 'Mapping the terrain.',
    statement: null,
    cascadeSpeed: 2.0,
    cascadeArcHeight: 260,
    cascadeHandSpacing: 240,
    cascadePosition: 'center-left',
    showHands: true,
    objectMode: 'default',
    zoneOrder: ['hero', 'breath', 'draw', 'field', 'trace', 'footer'],
    drawIllustration: 'contour',
    tracePattern: 'contourDense',
    fieldPreset: 'contour',
    noisePreset: 'paper',
    noiseZones: ['all'],
    decayMode: null,
    mirrorDistortion: null,
    splitPanels: null,
    typewriterText: null,
    loadAnimation: 'contour-expand',
    specialFont: null,
    glassMode: false,
    flowingLineColor: '#b45309',
    flowingLineGlow: false,
  },

  neon: {
    id: 'neon',
    label: 'Neon',
    group: 'dark',
    bg: '#0a0a0a',
    accent: '#f43f5e',
    textColor: '#fafaf9',
    textSecondary: '#fda4af',
    tagline: 'Live wire.',
    statement: 'Build.',
    cascadeSpeed: 3.0,
    cascadeArcHeight: 260,
    cascadeHandSpacing: 240,
    cascadePosition: 'left',
    showHands: true,
    objectMode: 'glow',
    zoneOrder: [
      'hero',
      'trace',
      'draw',
      'field',
      'decay',
      'breath',
      'footer',
    ],
    drawIllustration: 'circuit',
    tracePattern: 'circuitPaths',
    fieldPreset: 'drift',
    noisePreset: 'grain',
    noiseZones: ['trace', 'decay'],
    decayMode: 'neon-flicker',
    mirrorDistortion: null,
    splitPanels: null,
    typewriterText: null,
    loadAnimation: 'flicker-on',
    specialFont: null,
    glassMode: false,
    flowingLineColor: '#f43f5e',
    flowingLineGlow: true,
  },

  void: {
    id: 'void',
    label: 'Void',
    group: 'dark',
    bg: '#000000',
    accent: '#ffffff',
    textColor: '#ffffff',
    textSecondary: '#444444',
    tagline: null,
    statement: null,
    cascadeSpeed: 1.8,
    cascadeArcHeight: 260,
    cascadeHandSpacing: 240,
    cascadePosition: 'center',
    showHands: true,
    objectMode: 'glow',
    zoneOrder: ['hero', 'field', 'breath', 'trace', 'footer'],
    drawIllustration: null,
    tracePattern: 'voidSpiral',
    fieldPreset: 'firefly',
    noisePreset: null,
    noiseZones: [],
    decayMode: null,
    mirrorDistortion: null,
    splitPanels: null,
    typewriterText: null,
    loadAnimation: 'ignition',
    specialFont: null,
    glassMode: false,
    flowingLineColor: '#ffffff',
    flowingLineGlow: true,
  },

  'deep-sea': {
    id: 'deep-sea',
    label: 'Deep Sea',
    group: 'dark',
    bg: '#020617',
    accent: '#06b6d4',
    textColor: '#94a3b8',
    textSecondary: '#475569',
    tagline: 'Below the surface.',
    statement: null,
    cascadeSpeed: 1.2,
    cascadeArcHeight: 260,
    cascadeHandSpacing: 240,
    cascadePosition: 'center',
    showHands: true,
    objectMode: 'default',
    zoneOrder: ['hero', 'field', 'breath', 'draw', 'trace', 'footer'],
    drawIllustration: 'neural',
    tracePattern: 'depthWaves',
    fieldPreset: 'bioluminescent',
    noisePreset: 'grain',
    noiseZones: ['all'],
    decayMode: null,
    mirrorDistortion: null,
    splitPanels: null,
    typewriterText: null,
    loadAnimation: 'depth-rise',
    specialFont: null,
    glassMode: false,
    flowingLineColor: '#06b6d4',
    flowingLineGlow: false,
  },

  monolith: {
    id: 'monolith',
    label: 'Monolith',
    group: 'dark',
    bg: '#000000',
    accent: '#ff0000',
    textColor: '#ffffff',
    textSecondary: '#666666',
    tagline: 'One color. No compromise.',
    statement: 'Build.',
    cascadeSpeed: 1.5,
    cascadeArcHeight: 260,
    cascadeHandSpacing: 240,
    cascadePosition: 'center',
    showHands: true,
    objectMode: 'monochrome',
    zoneOrder: [
      'hero',
      'breath',
      'draw',
      'breath',
      'trace',
      'footer',
    ],
    drawIllustration: 'architectural',
    tracePattern: 'minimalCross',
    fieldPreset: null,
    noisePreset: null,
    noiseZones: [],
    decayMode: null,
    mirrorDistortion: null,
    splitPanels: null,
    typewriterText: null,
    loadAnimation: 'minimal',
    specialFont: null,
    glassMode: false,
    flowingLineColor: '#ff0000',
    flowingLineGlow: false,
  },

  liquid: {
    id: 'liquid',
    label: 'Liquid',
    group: 'experimental',
    bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #ec4899 100%)',
    accent: '#ec4899',
    textColor: '#fafaf9',
    textSecondary: '#f9a8d4',
    tagline: 'Everything flows.',
    statement: null,
    cascadeSpeed: 2.5,
    cascadeArcHeight: 260,
    cascadeHandSpacing: 240,
    cascadePosition: 'center',
    showHands: true,
    objectMode: 'default',
    zoneOrder: [
      'hero',
      'draw',
      'breath',
      'field',
      'mirror',
      'trace',
      'footer',
    ],
    drawIllustration: 'neural',
    tracePattern: 'organicTendrils',
    fieldPreset: 'swarm',
    noisePreset: null,
    noiseZones: [],
    decayMode: null,
    mirrorDistortion: 'wave',
    splitPanels: null,
    typewriterText: null,
    loadAnimation: 'melt-in',
    specialFont: null,
    glassMode: false,
    flowingLineColor: '#ec4899',
    flowingLineGlow: false,
  },

  glassy: {
    id: 'glassy',
    label: 'Glassy',
    group: 'experimental',
    bg: '#0f172a',
    accent: '#8b5cf6',
    textColor: '#fafaf9',
    textSecondary: '#94a3b8',
    tagline: 'Building through the noise.',
    statement: 'Through the noise.',
    cascadeSpeed: 2.0,
    cascadeArcHeight: 260,
    cascadeHandSpacing: 240,
    cascadePosition: 'center',
    showHands: true,
    objectMode: 'default',
    zoneOrder: [
      'hero',
      'draw',
      'field',
      'split',
      'breath',
      'trace',
      'footer',
    ],
    drawIllustration: 'circuit',
    tracePattern: 'organicTendrils',
    fieldPreset: 'drift',
    noisePreset: 'grain',
    noiseZones: ['all'],
    decayMode: null,
    mirrorDistortion: null,
    splitPanels: 4,
    typewriterText: null,
    loadAnimation: 'materialize',
    specialFont: null,
    glassMode: true,
    flowingLineColor: '#8b5cf6',
    flowingLineGlow: false,
  },

  'retro-terminal': {
    id: 'retro-terminal',
    label: 'Retro Terminal',
    group: 'experimental',
    bg: '#0a0a0a',
    accent: '#22c55e',
    textColor: '#22c55e',
    textSecondary: '#166534',
    tagline: '> trajan --status\nONLINE. BUILDING.',
    statement: '// the system is the product',
    cascadeSpeed: 2.0,
    cascadeArcHeight: 260,
    cascadeHandSpacing: 240,
    cascadePosition: 'right',
    showHands: true,
    objectMode: 'wireframe',
    zoneOrder: [
      'hero',
      'typewriter',
      'field',
      'decay',
      'trace',
      'footer',
    ],
    drawIllustration: 'circuit',
    tracePattern: 'geometricGrid',
    fieldPreset: 'drift',
    noisePreset: 'scanlines',
    noiseZones: ['all'],
    decayMode: 'ascii',
    mirrorDistortion: null,
    splitPanels: null,
    typewriterText:
      'the system was always more interesting than the output',
    loadAnimation: 'terminal-print',
    specialFont: 'var(--font-jetbrains-mono)',
    glassMode: false,
    flowingLineColor: '#22c55e',
    flowingLineGlow: false,
  },

  analog: {
    id: 'analog',
    label: 'Analog',
    group: 'experimental',
    bg: '#1a1814',
    accent: '#d97706',
    textColor: '#e8e0d0',
    textSecondary: '#a89f8f',
    tagline: 'Signal and noise.',
    statement: '// rewind',
    cascadeSpeed: 2.5,
    cascadeArcHeight: 260,
    cascadeHandSpacing: 240,
    cascadePosition: 'center',
    showHands: true,
    objectMode: 'default',
    zoneOrder: [
      'hero',
      'draw',
      'decay',
      'field',
      'breath',
      'trace',
      'footer',
    ],
    drawIllustration: 'circuit',
    tracePattern: 'signalNoise',
    fieldPreset: 'drift',
    noisePreset: 'film',
    noiseZones: ['all'],
    decayMode: 'vhs',
    mirrorDistortion: null,
    splitPanels: null,
    typewriterText: null,
    loadAnimation: 'vhs-lock',
    specialFont: null,
    glassMode: false,
    flowingLineColor: '#d97706',
    flowingLineGlow: false,
  },

  interference: {
    id: 'interference',
    label: 'Interference',
    group: 'experimental',
    bg: '#fafafa',
    accent: '#18181b',
    textColor: '#18181b',
    textSecondary: '#71717a',
    tagline: 'Pattern recognition.',
    statement: null,
    cascadeSpeed: 2.5,
    cascadeArcHeight: 260,
    cascadeHandSpacing: 240,
    cascadePosition: 'center',
    showHands: true,
    objectMode: 'monochrome',
    zoneOrder: [
      'hero',
      'field',
      'trace',
      'mirror',
      'draw',
      'breath',
      'footer',
    ],
    drawIllustration: 'architectural',
    tracePattern: 'interferenceGrid',
    fieldPreset: 'interference',
    noisePreset: 'moire',
    noiseZones: ['all'],
    decayMode: null,
    mirrorDistortion: 'blur',
    splitPanels: null,
    typewriterText: null,
    loadAnimation: 'moire-generate',
    specialFont: null,
    glassMode: false,
    flowingLineColor: '#18181b',
    flowingLineGlow: false,
  },
};

export const VARIANT_GROUPS: Record<VariantGroup, VariantId[]> = {
  light: ['clean', 'playful', 'blueprint', 'topographic'],
  dark: ['neon', 'void', 'deep-sea', 'monolith'],
  experimental: [
    'liquid',
    'glassy',
    'retro-terminal',
    'analog',
    'interference',
  ],
};

type VariantStore = {
  activeVariantId: VariantId;
  setVariant: (id: VariantId) => void;
  config: VariantConfig;
};

export const useVariantStore = create<VariantStore>((set) => ({
  activeVariantId: 'clean',
  config: VARIANTS.clean,
  setVariant: (id) => set({ activeVariantId: id, config: VARIANTS[id] }),
}));
