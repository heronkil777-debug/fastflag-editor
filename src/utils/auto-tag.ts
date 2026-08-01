/**
 * Auto-tagging utility.
 *
 * Suggests tags based on FastFlag name patterns.
 * This is a heuristic system — it provides smart defaults that users can override.
 *
 * Design decisions:
 * - Pattern matching is case-insensitive and order-independent
 * - A single flag can match multiple patterns → multiple tags
 * - "Unknown" is the fallback when no pattern matches
 * - Patterns are defined declaratively for easy extension
 * - The auto-tag function is pure (no side effects)
 */

/** Tag rule: maps a tag name to keyword patterns found in flag names. */
interface TagRule {
  /** The tag to assign when a pattern matches. */
  tag: string;
  /** Keywords that trigger this tag. Case-insensitive substring match. */
  keywords: string[];
  /** If true, this tag is assigned when NO other rule matches. */
  isFallback?: boolean;
}

/**
 * Comprehensive tag rules for Roblox FastFlags.
 *
 * Order matters: first match wins for the same tag, but multiple tags
 * can be assigned to a single flag (different rules can match).
 *
 * To add a new tag category: add a new entry to this array.
 * To add a new keyword: append to the existing keywords array.
 */
const TAG_RULES: TagRule[] = [
  {
    tag: 'Performance',
    keywords: [
      'perf',
      'fps',
      'frame',
      'speed',
      'memory',
      'cache',
      'async',
      'thread',
      'batch',
      'budget',
      'throttle',
      'maxfps',
      'framerate',
      'optimization',
      'optimize',
      'fast',
      'cull',
      'skip',
      'lazy',
      'defer',
      'reduce',
      'limit',
      'pool',
      'cap',
      'ratelimit',
      'instant',
      'preempt',
      'priorit',
      'schedul',
      'multithread',
      'parallel',
      'job',
      'wait',
      'timeout',
      'stall',
      'hitch',
      'lag',
      'buffer',
      'stream',
      'chunk',
      'incremental',
    ],
  },
  {
    tag: 'Graphics',
    keywords: [
      'render',
      'graphic',
      'shadow',
      'texture',
      'mesh',
      'lighting',
      'material',
      'shader',
      'voxel',
      'particle',
      'posteffect',
      'bloom',
      'ambient',
      'quality',
      'resolution',
      'antialias',
      'msaa',
      'aniso',
      'color',
      'pixel',
      'vertex',
      'fragment',
      'draw',
      'paint',
      'visual',
      'vfx',
      'glow',
      'reflect',
      'refract',
      'specular',
      'diffuse',
      'emissive',
      'opacity',
      'transparency',
      'blend',
      'terrain',
      'sky',
      'fog',
      'atmosphere',
      'sun',
      'moon',
      'water',
      'ocean',
      'cloud',
      'shadowmap',
      'depthbuffer',
      'rendertarget',
      'framebuffer',
      'gbuffer',
      'hdr',
      'ldr',
      'tone',
      'exposure',
      'gamma',
      'srgb',
      'linear',
      'raster',
      'ray',
      'trace',
      'globalillum',
      'gi',
      'ao',
      'ssao',
      'bloom',
      'lens',
      'dof',
      'motionblur',
      'taa',
      'fxaa',
      'smaa',
      'supersampl',
      'upscale',
      'dlss',
      'fsr',
    ],
  },
  {
    tag: 'Fix',
    keywords: [
      'fix',
      'bug',
      'crash',
      'patch',
      'workaround',
      'disable',
      'hack',
      'mitigate',
      'resolve',
      'repair',
      'correct',
      'revert',
      'rollback',
      'safeguard',
      'guard',
      'clamp',
      'validate',
      'sanitize',
      'bounds',
      'overflow',
      'underflow',
      'null',
      'divide',
      'infinity',
      'nan',
      'assert',
      'check',
    ],
  },
  {
    tag: 'UI',
    keywords: [
      'ui',
      'gui',
      'menu',
      'button',
      'input',
      'mouse',
      'keyboard',
      'touch',
      'chat',
      'notification',
      'screen',
      'display',
      'hud',
      'overlay',
      'dialog',
      'modal',
      'tooltip',
      'dropdown',
      'scroll',
      'list',
      'grid',
      'panel',
      'tab',
      'sidebar',
      'toolbar',
      'navbar',
      'header',
      'footer',
      'avatar',
      'badge',
      'icon',
      'label',
      'text',
      'font',
      'size',
      'scale',
      'zoom',
      'dpi',
      'accessibility',
      'a11y',
      'cursor',
      'pointer',
      'click',
      'drag',
      'hover',
      'focus',
      'select',
      'copy',
      'paste',
      'contextmenu',
      'radial',
      'healthbar',
      'nametag',
      'leaderboard',
      'inventory',
    ],
  },
  {
    tag: 'LOD',
    keywords: [
      'lod',
      'level',
      'distance',
      'farclip',
      'cull',
      'stream',
      'mipmap',
      'impostor',
      'billboard',
      'simplify',
      'detail',
      'fade',
      'popin',
      'popout',
      'occlusion',
      'visibility',
      'renderdistance',
      'drawdistance',
      'viewdist',
    ],
  },
  {
    tag: 'Experimental',
    keywords: [
      'experimental',
      'debug',
      'beta',
      'preview',
      'test',
      'dev',
      'internal',
      'prototype',
      'wip',
      'tentative',
      'lab',
      'unstable',
      'risky',
      'advanced',
      'poweruser',
      'danger',
    ],
  },
  {
    tag: 'Unknown',
    keywords: [],
    isFallback: true,
  },
];

/**
 * Analyzes a flag name and returns suggested tags.
 *
 * @param name - The FastFlag name (e.g. "FIntRenderShadowQuality")
 * @returns Array of suggested tag strings. Always returns at least ["Unknown"].
 *
 * @example
 * suggestTags("FIntRenderShadowQuality") // → ["Graphics"]
 * suggestTags("FFlagFixLighting")         // → ["Fix", "Graphics"]
 * suggestTags("FIntUIScale")              // → ["UI"]
 * suggestTags("DFIntTaskScheduler")       // → ["Performance"]
 * suggestTags("FFlagSomethingNew")        // → ["Unknown"]
 */
export function suggestTags(name: string): string[] {
  const lower = name.toLowerCase();
  const matchedTags: string[] = [];

  for (const rule of TAG_RULES) {
    if (rule.isFallback) continue;

    for (const keyword of rule.keywords) {
      if (lower.includes(keyword)) {
        if (!matchedTags.includes(rule.tag)) {
          matchedTags.push(rule.tag);
        }
        break; // One keyword match is enough for this tag
      }
    }
  }

  // Fallback: if no tags matched, assign "Unknown"
  if (matchedTags.length === 0) {
    const fallback = TAG_RULES.find(r => r.isFallback);
    if (fallback) {
      matchedTags.push(fallback.tag);
    }
  }

  return matchedTags;
}

/**
 * Returns all available tag names (for display/filtering).
 */
export function getAllTagNames(): string[] {
  return TAG_RULES.filter(r => !r.isFallback).map(r => r.tag);
}
