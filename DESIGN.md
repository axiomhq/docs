---
name: Axiom Docs
description: A precise, technical documentation system built on Fumadocs and made unmistakably Axiom.
colors:
  axiom-orange: "#da5c2b"
  graphite-canvas: "#0a0a0a"
  graphite-surface: "#171717"
  graphite-raised: "#1e1e1e"
  graphite-overlay: "#262626"
  signal-white: "#fafafa"
  soft-white: "#e5e5e5"
  muted-gray: "#a3a3a3"
  quiet-gray: "#737373"
  paper-white: "#ffffff"
  graphite-copy: "#404040"
  destructive-red: "#f87171"
  warning-amber: "#f59e0b"
  success-green: "#10b981"
  information-blue: "#3b82f6"
typography:
  display:
    fontFamily: "Geist, -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif"
    fontSize: "44px"
    fontWeight: 600
    lineHeight: "48px"
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Geist, -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 600
    lineHeight: "42px"
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Geist, -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: "31px"
    letterSpacing: "-0.022em"
  body:
    fontFamily: "Geist, -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: "normal"
  label:
    fontFamily: "Geist Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "12px"
    fontWeight: 450
    lineHeight: "16px"
    letterSpacing: "normal"
  code:
    fontFamily: "Geist Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "20px"
    letterSpacing: "normal"
rounded:
  hairline: "2px"
  compact: "3px"
  control: "4px"
  relaxed: "6px"
  surface: "8px"
spacing:
  hairline: "1px"
  xxs: "2px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
  3xl: "40px"
  4xl: "48px"
  5xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.signal-white}"
    textColor: "{colors.graphite-canvas}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "7px 10px"
    height: "30px"
  button-secondary:
    backgroundColor: "{colors.graphite-surface}"
    textColor: "{colors.soft-white}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "6px 10px"
    height: "28px"
  search-field:
    backgroundColor: "{colors.graphite-surface}"
    textColor: "{colors.muted-gray}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "40px"
  navigation-item:
    backgroundColor: "{colors.graphite-canvas}"
    textColor: "{colors.muted-gray}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "6px 10px"
    height: "28px"
---

# Design System: Axiom Docs

## Overview

**Creative North Star: "The Precision Instrument"**

Axiom Docs should feel like a well-calibrated instrument for technical work: exact without being brittle, information-dense without becoming noisy, and quiet enough that the reader's task remains dominant. Fumadocs supplies the documentation infrastructure; the visible system is Axiom's own, expressed through graphite surfaces, precise typography, compact controls, and a deliberately scarce orange signal.

The composition is centered around reading and scanning. Long-form articles use comfortable measure and strong vertical rhythm, while navigation, tables, query examples, and API controls become denser where comparison speed matters. The system is flat by default and gains depth through tonal layers, hairline borders, and clear state changes—not decorative effects.

It must never read as a stock Fumadocs theme, a generic documentation template, or a sparse marketing page. Every component should earn its space and expose its purpose immediately.

**Key Characteristics:**

- Precise, technical, and confident.
- Dark-first graphite surfaces with a complete light counterpart.
- Restrained Axiom Orange used as an interaction signal.
- Geist for fluent reading; Geist Mono for technical texture and control labels.
- Compact 2–4px working radii and a 4px spacing rhythm.
- Flat tonal layering, hairline borders, and shadows reserved for floating UI.
- Comfortable prose paired with dense, scan-friendly reference components.

## Colors

The palette behaves like instrument markings on graphite: neutral surfaces carry the work, white establishes hierarchy, and Axiom Orange identifies the point of interaction.

### Primary

- **Axiom Orange:** The brand and interaction accent. Use it for active tab indicators, focus emphasis, selected feedback, query highlights, and other small signals—not for large background fields.

### Secondary

- **Information Blue:** Reserved for semantic information and field focus where the implementation already uses a conventional input state. It is not the product's primary interaction color.
- **Success Green, Warning Amber, and Destructive Red:** Reserved for method badges, validation, notices, and true status communication.

### Neutral

- **Graphite Canvas:** The canonical dark page background and the deepest layer.
- **Graphite Surface:** The default dark control, code, and contained-content surface.
- **Graphite Raised:** The dark hover and nested-surface layer.
- **Graphite Overlay:** The dark popover and dialog layer.
- **Signal White and Soft White:** Primary and secondary dark-theme text, respectively.
- **Muted Gray and Quiet Gray:** Supporting text, metadata, breadcrumbs, inactive navigation, and low-priority chrome.
- **Paper White:** The light-theme surface and inverse text reference.
- **Graphite Copy:** The primary long-form copy value in light mode.

### Named Rules

**The Orange Signal Rule.** Orange marks an actionable or selected point and should occupy less than 10% of a typical screen. Its rarity gives it authority.

**The Contrast Ladder Rule.** Headings, strong text, body copy, metadata, and disabled content must remain visibly distinct. Never flatten them into one gray.

**The Semantic Color Rule.** Blue, green, amber, and red communicate state only. Never let them compete with Axiom Orange as brand accents.

## Typography

**Display Font:** Geist (with system sans-serif fallbacks)

**Body Font:** Geist (with system sans-serif fallbacks)

**Label/Mono Font:** Geist Mono, with SF Mono and Menlo fallbacks; APL/MPL syntax titles may use the dedicated system-monospace query stack.

**Character:** Geist keeps long technical prose open and highly legible; Geist Mono adds exactness to code, labels, breadcrumbs, values, and reference controls. Weight and contrast create hierarchy before size does.

### Hierarchy

- **Display** (600, 44px, 48px): Landing-page statements only; reduce to 36px/40px on phones.
- **Headline** (600, 34px, 42px): Article titles; use the query monospace treatment for APL/MPL function and operator pages.
- **Title** (600, 24px, 31px): Primary article sections with balanced wrapping.
- **Body** (400, 15px, 1.75): Long-form reading at a maximum article measure of 720px and a practical text measure around 65–75 characters.
- **Intro** (400, 17px, 27px): The first article summary; lower contrast than the title and more open than body copy.
- **UI** (450–600, 13px, 16px): Navigation and compact controls.
- **Label** (450–600, 10–12px, 14–16px): Breadcrumbs, table headers, metadata, and compact technical chrome; uppercase only when the label is genuinely categorical.
- **Code** (400, 12px, 20px): Multiline code and API samples; inline code scales to the surrounding prose.

### Named Rules

**The Reading First Rule.** Long-form text stays within 65–75 characters, uses a generous 1.75 line height, and never inherits compact UI leading.

**The Mono With Purpose Rule.** Monospace means code, query syntax, identifiers, values, or technical chrome. It is never a blanket aesthetic applied to ordinary prose.

**The Hierarchy Before Scale Rule.** Use weight, contrast, and spacing before reaching for oversized typography.

## Elevation

The system is flat by default. Canvas, surface, raised, and overlay tones establish depth; a one-pixel border clarifies edges. Shadows are prohibited on ordinary cards, code blocks, tables, buttons, and navigation. They are reserved for floating menus and modal dialogs where separation from the page is structurally necessary.

### Shadow Vocabulary

- **Overlay:** A hairline outline plus a compact 8px/24px ambient shadow for menus and popovers.
- **Dialog:** A hairline outline plus a deeper 24px/48px ambient shadow for modal search and assistant surfaces.
- **Focus:** A two-stage ring that separates the control from the canvas and then communicates keyboard focus; orange is preferred for documentation controls, with semantic blue retained for established API form focus.

### Named Rules

**The Flat-by-Default Rule.** If a surface is part of normal document flow, it gets tonal contrast and a hairline border—not a drop shadow.

**The Structural Shadow Rule.** A shadow is allowed only when the element floats above unrelated content and must communicate that change in layer.

## Components

### Buttons

- **Shape:** Compact rectangular controls with restrained corners (3–4px in the documentation UI).
- **Primary:** High-contrast inverse fill, 30px tall, with 10px horizontal padding and a 600-weight compact label.
- **Hover / Focus:** Shift one tonal step or reduce opacity slightly; keyboard focus uses a clearly visible two-pixel orange outline without moving layout.
- **Secondary / Ghost:** Hairline border or transparent fill, graphite tonal hover, and no decorative shadow.

### Chips

- **Style:** Use only for compact status, source, or API-method metadata. Corners stay at 3px; labels are 8–11px monospace or compact sans.
- **State:** Color communicates the method or status and is paired with text. Avoid pill shapes for navigation or ordinary actions.

### Cards / Containers

- **Corner Style:** Restrained 4px corners for search results, code, frames, tables, and API surfaces.
- **Background:** Canvas, surface, or raised neutral tokens according to nesting depth.
- **Shadow Strategy:** None in document flow; follow the Elevation rules for overlays only.
- **Border:** One-pixel neutral borders define grouping. Semantic notices are the deliberate exception: they use a 2–3px semantic left rule and a subtle inert background.
- **Internal Padding:** Usually 12–16px; larger landing-page regions create separation with whitespace instead of card chrome.

### Inputs / Fields

- **Style:** Dark canvas or surface fill, one-pixel border, 4px radius, and compact 12–15px type. Search may read as a full-width prompt; API credentials remain clearly labeled fields.
- **Focus:** Visible border and ring with sufficient contrast. Placeholder text must remain readable and secondary to entered content.
- **Error / Disabled:** Use semantic color plus text or state attributes; never rely on color alone. Credential fields retain privacy annotations and session-only persistence.

### Navigation

- **Style:** The fixed 56px header, 260px desktop sidebar, and floating table of contents form one hierarchy. Header tabs are compact sans labels; sidebar groups and breadcrumbs use monospace technical chrome.
- **States:** Hover uses a subtle tonal shift. Active items gain stronger text weight and a raised neutral background; orange appears only in small selected indicators where established.
- **Mobile:** Below the desktop breakpoint, top-level sections and the page hierarchy share one drawer. Never expose two competing hamburger menus.

### Search and Assistant

Search and Ask AI share one modal entry point. The dialog uses a strong structural border, a 4px radius, and the dialog shadow; mode tabs, the query field, ranked results, assistant messages, sources, and composer remain visually distinct through dividers and tonal layers. Search must feel immediate, while the assistant loads only when requested and remains grounded in documentation sources.

### Code and Query Controls

Code samples use a surface background, 4px corners, high-contrast syntax themes, and copy controls that appear on hover or focus. Tabs use a compact monospace label and a short orange active indicator. Query examples and API samples share this language while retaining their specific actions and density.

### Tables and API Schemas

Tables are compact, bordered, and scan-oriented. Headers use small monospace labels on an inert surface; body rows use readable sans copy, consistent 7–12px cell padding, and hairline separators. Nested API schema children are visibly indented, and locations or method metadata occupy dedicated columns or badges.

## Do's and Don'ts

### Do:

- **Do** make Fumadocs infrastructure disappear behind an unmistakably Axiom visual system.
- **Do** use Axiom Orange as a scarce interaction signal and keep status colors semantic.
- **Do** preserve the contrast ladder between headings, body copy, metadata, code, and disabled states in both themes.
- **Do** keep ordinary controls and containers at 3–4px radii with a compact 4px spacing rhythm.
- **Do** center the reading experience in the viewport, protect 720px article measure, and keep the landing-page TOC column reserved even when empty.
- **Do** use tonal layers and one-pixel borders for structure; reserve shadows for floating menus and dialogs.
- **Do** keep documentation, query reference, and API reference coherent while preserving their distinct controls and density.
- **Do** meet WCAG 2.2 AA, including keyboard access, visible focus, contrast, semantic structure, and reduced-motion behavior.

### Don't:

- **Don't** ship a stock Fumadocs theme whose framework defaults are more visible than Axiom's identity.
- **Don't** reproduce Mintlify's visual language or information architecture; Mintlify is migration context, not a design target.
- **Don't** create generic documentation templates with oversized rounded cards, pill-heavy controls, decorative shadows, or blue-as-default interaction color.
- **Don't** flatten the contrast hierarchy and make body copy, headings, labels, and code feel equally prominent.
- **Don't** use sparse marketing-page treatments that sacrifice technical density, navigation depth, or fast scanning.
- **Don't** add ornamental effects that compete with reading, including gratuitous gradients, glassmorphism, and animation without a functional purpose.
- **Don't** add a second mobile navigation trigger or detach top-level sections from the documentation hierarchy.
- **Don't** hide essential code actions from keyboard users even when pointer users reveal them on hover.
