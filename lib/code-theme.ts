import type { ThemeRegistration } from 'shiki';

/**
 * `axiom-dark` — the branded Shiki theme. Accents sit on the design system's
 * own orange ramp (styles/tokens.css): the brand fill (#DA5C2B) is too dark to
 * read as vivid in thin glyphs, so text tokens use the scale's text-oriented
 * steps — keywords on orange-10, constants on orange-11 (the same value as
 * --color-accent-text) — with lighter apricot/sand steps of the same hue for
 * functions and strings, and warm grays for everything structural. The editor
 * background is irrelevant (the docs strip it); tune tokens here.
 */
export const axiomCodeDark: ThemeRegistration = {
  name: 'axiom-dark',
  type: 'dark',
  colors: {
    'editor.background': '#0a0a0a',
    'editor.foreground': '#d4cfc9',
  },
  settings: [
    // Default token color (anything unmatched).
    { settings: { foreground: '#d4cfc9' } },
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: '#78726b', fontStyle: 'italic' },
    },
    {
      // Strings are the most common accent in config-heavy docs — the
      // calmest step on the ramp so examples never turn into orange walls.
      scope: [
        'string',
        'string.quoted',
        'punctuation.definition.string',
        'string.regexp',
        'markup.inline.raw',
      ],
      settings: { foreground: '#f9c096' },
    },
    {
      // TOML/INI section headers ([sinks.debug]) — the structural anchors of
      // config examples, and the only shot at brand color in files that have
      // no keywords at all.
      scope: ['entity.name.section'],
      settings: { foreground: '#fa7440' },
    },
    {
      // orange-11: the system's accent-text tone.
      scope: [
        'constant.numeric',
        'constant.language',
        'constant.character',
        'constant.other',
        'keyword.other.unit',
      ],
      settings: { foreground: '#ffa057' },
    },
    {
      // The hero, on orange-10: the brand hue at text-legible luminance.
      scope: [
        'keyword',
        'keyword.control',
        'keyword.operator.new',
        'keyword.operator.expression',
        'storage',
        'storage.type',
        'storage.modifier',
      ],
      settings: { foreground: '#fa7440' },
    },
    {
      scope: [
        'entity.name.function',
        'support.function',
        'meta.function-call entity.name.function',
        'variable.function',
      ],
      settings: { foreground: '#ffbd91' },
    },
    {
      // A lighter sibling of the keyword hero — SPL and SQL grammars scope
      // their command words (table, sort) here, so it must read vivid too.
      scope: [
        'entity.name.type',
        'entity.name.class',
        'entity.other.inherited-class',
        'support.type',
        'support.class',
        'entity.name.namespace',
      ],
      settings: { foreground: '#ff8f5e' },
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
      settings: { foreground: '#eae5df' },
    },
    {
      scope: ['variable', 'variable.parameter', 'variable.other'],
      settings: { foreground: '#cac4bd' },
    },
    {
      scope: ['keyword.operator', 'punctuation', 'meta.brace'],
      settings: { foreground: '#8d867e' },
    },
    {
      // Diffs — semantic color, but earthy so it stays in the palette.
      scope: ['markup.inserted'],
      settings: { foreground: '#b0c493' },
    },
    {
      scope: ['markup.deleted'],
      settings: { foreground: '#ff6d4f' },
    },
    {
      scope: ['markup.changed'],
      settings: { foreground: '#f3a878' },
    },
    {
      scope: ['markup.heading', 'markup.bold'],
      settings: { foreground: '#f7f4f1', fontStyle: 'bold' },
    },
    {
      scope: ['markup.italic'],
      settings: { fontStyle: 'italic' },
    },
    {
      // Shell prompts / built-ins lean on the constant step.
      scope: ['support.constant', 'constant.other.symbol'],
      settings: { foreground: '#ffa057' },
    },
  ],
};

/**
 * `axiom-light` — light-mode counterpart the docs need (www is dark-only).
 * Scope-for-scope mirror of `axiom-dark` on the light orange scale: keywords
 * take orange-11 light (the light theme's --color-accent-text), and the rest
 * of the ramp is darkened until every token clears AA (>=4.5:1) on the light
 * code surface; relative intensity is preserved.
 */
export const axiomCodeLight: ThemeRegistration = {
  name: 'axiom-light',
  type: 'light',
  colors: {
    'editor.background': '#fafafa',
    'editor.foreground': '#44403b',
  },
  settings: [
    { settings: { foreground: '#44403b' } },
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: '#7c766e', fontStyle: 'italic' },
    },
    {
      scope: [
        'string',
        'string.quoted',
        'punctuation.definition.string',
        'string.regexp',
        'markup.inline.raw',
      ],
      settings: { foreground: '#8a5f33' },
    },
    {
      // TOML/INI section headers — see axiomCodeDark.
      scope: ['entity.name.section'],
      settings: { foreground: '#cc4e00' },
    },
    {
      scope: [
        'constant.numeric',
        'constant.language',
        'constant.character',
        'constant.other',
        'keyword.other.unit',
      ],
      settings: { foreground: '#a5561d' },
    },
    {
      // orange-11 light: the system's accent-text tone for light surfaces.
      scope: [
        'keyword',
        'keyword.control',
        'keyword.operator.new',
        'keyword.operator.expression',
        'storage',
        'storage.type',
        'storage.modifier',
      ],
      settings: { foreground: '#cc4e00' },
    },
    {
      scope: [
        'entity.name.function',
        'support.function',
        'meta.function-call entity.name.function',
        'variable.function',
      ],
      settings: { foreground: '#a34e20' },
    },
    {
      // Vivid like the dark theme's type step (see axiomCodeDark) while
      // staying AA on the light surface.
      scope: [
        'entity.name.type',
        'entity.name.class',
        'entity.other.inherited-class',
        'support.type',
        'support.class',
        'entity.name.namespace',
      ],
      settings: { foreground: '#b34a10' },
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
      settings: { foreground: '#2e2a26' },
    },
    {
      scope: ['variable', 'variable.parameter', 'variable.other'],
      settings: { foreground: '#55504a' },
    },
    {
      scope: ['keyword.operator', 'punctuation', 'meta.brace'],
      settings: { foreground: '#79726b' },
    },
    {
      scope: ['markup.inserted'],
      settings: { foreground: '#5f7a45' },
    },
    {
      scope: ['markup.deleted'],
      settings: { foreground: '#b5301c' },
    },
    {
      scope: ['markup.changed'],
      settings: { foreground: '#a5561d' },
    },
    {
      scope: ['markup.heading', 'markup.bold'],
      settings: { foreground: '#171412', fontStyle: 'bold' },
    },
    {
      scope: ['markup.italic'],
      settings: { fontStyle: 'italic' },
    },
    {
      scope: ['support.constant', 'constant.other.symbol'],
      settings: { foreground: '#a5561d' },
    },
  ],
};
