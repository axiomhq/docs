import type { ThemeRegistration } from 'shiki';

/**
 * `axiom-dark` — the branded Shiki theme, copied from www/src/lib/code-theme.ts.
 * Grayscale base with every accent drawn from the brand-orange family, so code
 * blocks sit on-palette instead of the blue/purple of stock themes. The editor
 * background is irrelevant (the docs strip it); tune tokens here.
 */
export const axiomCodeDark: ThemeRegistration = {
  name: 'axiom-dark',
  type: 'dark',
  colors: {
    'editor.background': '#0a0a0a',
    'editor.foreground': '#b8b8b8',
  },
  settings: [
    // Default token color (anything unmatched).
    { settings: { foreground: '#b8b8b8' } },
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: '#6f6f6f', fontStyle: 'italic' },
    },
    {
      scope: [
        'string',
        'string.quoted',
        'punctuation.definition.string',
        'string.regexp',
        'markup.inline.raw',
      ],
      settings: { foreground: '#ffc799' },
    },
    {
      scope: [
        'constant.numeric',
        'constant.language',
        'constant.character',
        'constant.other',
        'keyword.other.unit',
      ],
      settings: { foreground: '#ffb27d' },
    },
    {
      scope: [
        'keyword',
        'keyword.control',
        'keyword.operator.new',
        'keyword.operator.expression',
        'storage',
        'storage.type',
        'storage.modifier',
      ],
      settings: { foreground: '#ff8a4c' },
    },
    {
      scope: [
        'entity.name.function',
        'support.function',
        'meta.function-call entity.name.function',
        'variable.function',
      ],
      settings: { foreground: '#ffad66' },
    },
    {
      scope: [
        'entity.name.type',
        'entity.name.class',
        'entity.other.inherited-class',
        'support.type',
        'support.class',
        'entity.name.namespace',
      ],
      settings: { foreground: '#e6875a' },
    },
    {
      // JSON keys / object properties / HTML attributes — quiet, near-white,
      // so string values carry the orange. Unlike www, `entity.name.tag` sits
      // here too: in the YAML/TOML grammars that dominate docs config examples
      // it scopes the keys, and orange keys turned whole files orange.
      scope: [
        'support.type.property-name',
        'variable.other.property',
        'variable.other.object.property',
        'entity.other.attribute-name',
        'entity.name.tag',
        'meta.object-literal.key',
      ],
      settings: { foreground: '#dedede' },
    },
    {
      scope: ['variable', 'variable.parameter', 'variable.other'],
      settings: { foreground: '#cccccc' },
    },
    {
      scope: ['keyword.operator', 'punctuation', 'meta.brace'],
      settings: { foreground: '#8f8f8f' },
    },
    {
      // Diffs — keep meaning, but warm.
      scope: ['markup.inserted'],
      settings: { foreground: '#ffc799' },
    },
    {
      scope: ['markup.deleted'],
      settings: { foreground: '#ff6b4c' },
    },
    {
      scope: ['markup.changed'],
      settings: { foreground: '#ffad66' },
    },
    {
      scope: ['markup.heading', 'markup.bold'],
      settings: { foreground: '#ffffff', fontStyle: 'bold' },
    },
    {
      scope: ['markup.italic'],
      settings: { fontStyle: 'italic' },
    },
    {
      // Shell prompts / built-ins lean on the keyword orange.
      scope: ['support.constant', 'constant.other.symbol'],
      settings: { foreground: '#ffb27d' },
    },
  ],
};

/**
 * `axiom-light` — light-mode counterpart the docs need (www is dark-only).
 * Scope-for-scope mirror of `axiom-dark` with the orange ramp darkened until
 * every token clears AA (>=4.5:1) on the light code surface; relative
 * intensity is preserved (keywords most vivid, strings softest).
 */
export const axiomCodeLight: ThemeRegistration = {
  name: 'axiom-light',
  type: 'light',
  colors: {
    'editor.background': '#fafafa',
    'editor.foreground': '#404040',
  },
  settings: [
    { settings: { foreground: '#404040' } },
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: '#737373', fontStyle: 'italic' },
    },
    {
      scope: [
        'string',
        'string.quoted',
        'punctuation.definition.string',
        'string.regexp',
        'markup.inline.raw',
      ],
      settings: { foreground: '#8f530f' },
    },
    {
      scope: [
        'constant.numeric',
        'constant.language',
        'constant.character',
        'constant.other',
        'keyword.other.unit',
      ],
      settings: { foreground: '#b45309' },
    },
    {
      scope: [
        'keyword',
        'keyword.control',
        'keyword.operator.new',
        'keyword.operator.expression',
        'storage',
        'storage.type',
        'storage.modifier',
      ],
      settings: { foreground: '#c2410c' },
    },
    {
      scope: [
        'entity.name.function',
        'support.function',
        'meta.function-call entity.name.function',
        'variable.function',
      ],
      settings: { foreground: '#b8461d' },
    },
    {
      scope: [
        'entity.name.type',
        'entity.name.class',
        'entity.other.inherited-class',
        'support.type',
        'support.class',
        'entity.name.namespace',
      ],
      settings: { foreground: '#9a3412' },
    },
    {
      // JSON keys / object properties / HTML attributes — quiet, near-black,
      // so string values carry the orange. `entity.name.tag` deliberately sits
      // here (see axiomCodeDark).
      scope: [
        'support.type.property-name',
        'variable.other.property',
        'variable.other.object.property',
        'entity.other.attribute-name',
        'entity.name.tag',
        'meta.object-literal.key',
      ],
      settings: { foreground: '#262626' },
    },
    {
      scope: ['variable', 'variable.parameter', 'variable.other'],
      settings: { foreground: '#525252' },
    },
    {
      scope: ['keyword.operator', 'punctuation', 'meta.brace'],
      settings: { foreground: '#737373' },
    },
    {
      scope: ['markup.inserted'],
      settings: { foreground: '#8f530f' },
    },
    {
      scope: ['markup.deleted'],
      settings: { foreground: '#b91c1c' },
    },
    {
      scope: ['markup.changed'],
      settings: { foreground: '#b45309' },
    },
    {
      scope: ['markup.heading', 'markup.bold'],
      settings: { foreground: '#0a0a0a', fontStyle: 'bold' },
    },
    {
      scope: ['markup.italic'],
      settings: { fontStyle: 'italic' },
    },
    {
      scope: ['support.constant', 'constant.other.symbol'],
      settings: { foreground: '#b45309' },
    },
  ],
};
