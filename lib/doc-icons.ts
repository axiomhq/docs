import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Mintlify rendered <Icon> as a Font Awesome glyph (masked SVGs from its CDN, e.g.
// fontawesome/v7.2.0/light/clock.svg). The Fumadocs migration replaced it with a
// placeholder that showed the icon name's first letter in a bordered box, so 130
// instruction sentences across 36 files lost their glyph — and distinct icons collided,
// with arrow-up and arrow-down both rendering as "A" in the same list.
//
// Every name below is one that content actually uses. Kept as data so a test can assert
// content never references a name that has no mapping.
export const FA_TO_LUCIDE = {
  'arrow-down': 'ArrowDown',
  'arrow-up': 'ArrowUp',
  'brackets-curly': 'Braces',
  'calendar-clock': 'CalendarClock',
  'calendar-days': 'CalendarDays',
  'chart-scatter': 'ChartScatter',
  'chevron-down': 'ChevronDown',
  clock: 'Clock',
  'clock-rotate-left': 'History',
  diamond: 'Diamond',
  'ellipsis-vertical': 'EllipsisVertical',
  function: 'SquareFunction',
  gear: 'Settings',
  hexagon: 'Hexagon',
  house: 'House',
  'pen-to-square': 'SquarePen',
  pencil: 'Pencil',
  percent: 'Percent',
  plus: 'Plus',
  scissors: 'Scissors',
  'sidebar-flip': 'PanelRight',
  // Two tracks with round knobs — lucide Settings2, not SlidersHorizontal (three tracks
  // with rectangular ticks). Checked against the real Font Awesome light asset.
  'sliders-simple': 'Settings2',
  stopwatch: 'Timer',
  table: 'Table',
  trash: 'Trash',
  'up-right-and-down-left-from-center': 'Maximize2',
  upload: 'Upload',
  user: 'User',
} as const satisfies Record<string, keyof typeof LucideIcons>;

export type DocIconName = keyof typeof FA_TO_LUCIDE;

export function resolveDocIcon(icon: string | undefined): LucideIcon | undefined {
  if (!icon || !(icon in FA_TO_LUCIDE)) return undefined;
  return LucideIcons[FA_TO_LUCIDE[icon as DocIconName]] as LucideIcon;
}

// Lucide ships a single outline weight, so Font Awesome's weights become stroke widths.
export function docIconStrokeWidth(iconType: string | undefined) {
  if (iconType === 'solid') return 2.25;
  if (iconType?.includes('light')) return 1.5;
  return 1.75;
}
