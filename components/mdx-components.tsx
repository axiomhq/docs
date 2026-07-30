import { Children, cloneElement, createElement, isValidElement } from 'react';
import { cn } from '@/lib/utils';
import type { AnchorHTMLAttributes, ComponentProps, ImgHTMLAttributes, ReactElement, ReactNode } from 'react';
import type { MDXComponents } from 'mdx/types';
import defaultComponents from 'fumadocs-ui/mdx';
import { Accordion as FumaAccordion, Accordions } from 'fumadocs-ui/components/accordion';
import { Card, Cards } from 'fumadocs-ui/components/card';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { Tab as FumaTab, Tabs as FumaTabs } from 'fumadocs-ui/components/tabs';
import { ImageZoom } from 'fumadocs-ui/components/image-zoom';
import { docIconStrokeWidth, resolveDocIcon } from '@/lib/doc-icons';
import { ZoneLink } from '@/components/zone-link';
import { PlaygroundLink } from '@/components/playground-link';
import { withDocsBasePath, withoutDocsBasePath } from '@/lib/docs-paths';
import { PlaceholderPre as InteractivePlaceholderPre } from './placeholder-code';
import { HeadingAnchor } from './heading-anchor';
import { LanguageComparisons } from './language-comparisons';

// play.axiom.co links come in two shapes: runnable APL query links
// (…/query?initForm=…) that render as the compact "Run in Playground" button
// beside a code block, and plain prose links to the demo homepage, which should
// render as ordinary text links rather than a stray mono pill.
function isPlaygroundQueryLink(href: string): boolean {
  return href.startsWith('https://play.axiom.co/') && href.includes('/query');
}

// Content retains root-relative paths from the Mintlify layout. Pages and public assets both live
// in this app's /docs zone, so normalize them before handing navigation to Next.js.
function DocsLink({ href = '', children, className, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const target = withoutDocsBasePath(href);
  if (target.startsWith('/') || target.startsWith('#')) return <ZoneLink href={target} prefetch={false} className={className} {...props}>{children}</ZoneLink>;
  if (isPlaygroundQueryLink(target)) {
    return <PlaygroundLink href={target} className={className} {...props}>{children}</PlaygroundLink>;
  }
  return <a href={target} className={className} {...props}>{children}</a>;
}

// NOTE: content authors write raw JSX <img> tags (118 of them), which MDX renders
// directly and does NOT route through this override — so this only handles the single
// file using markdown ![](…) syntax. Inline icons are sized by the .inline-icon rule
// in globals.css, not here.
function DocsImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  const imageProps = props as ComponentProps<typeof ImageZoom>;
  const src = typeof imageProps.src === 'string' ? withDocsBasePath(imageProps.src) : imageProps.src;
  return <ImageZoom {...imageProps} src={src} />;
}

function DocsVideo({ src, ...props }: ComponentProps<'video'>) {
  return <video {...props} src={typeof src === 'string' ? withDocsBasePath(src) : src} />;
}

function DocsSource({ src, ...props }: ComponentProps<'source'>) {
  return <source {...props} src={typeof src === 'string' ? withDocsBasePath(src) : src} />;
}

function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return '';
}

function PlaceholderPre(props: ComponentProps<'pre'>) {
  return <InteractivePlaceholderPre {...props} source={textOf(props.children)} />;
}

// The left rule carries the notice's meaning, so each variant only has to supply
// --notice-accent; everything else is shared. Unknown types fall back to info,
// matching the old CSS where the base rule set the default accent.
const NOTICE_ACCENT: Record<string, string> = {
  info: 'doc-notice-info [--notice-accent:var(--color-info)]',
  idea: 'doc-notice-idea [--notice-accent:var(--color-accent)]',
  warn: 'doc-notice-warn [--notice-accent:var(--color-warning)]',
  error: 'doc-notice-error [--notice-accent:var(--color-destructive)]',
  success: 'doc-notice-success [--notice-accent:var(--color-success)]',
};

function Notice({ children, title, type = 'info' }: { children: ReactNode; title?: ReactNode; type?: 'info' | 'warn' | 'error' | 'success' | 'idea' }) {
  const accent = NOTICE_ACCENT[type] ?? `doc-notice-${type} [--notice-accent:var(--color-info)]`;
  return <aside className={cn('doc-notice my-6 mx-0 py-[15px] px-4 border-l-3 border-l-(--notice-accent) rounded-[3px] bg-(--bg-inert) text-(--text-secondary) font-sans text-[14px] leading-[22px] font-[450] tracking-[-.005em]', accent)}>{title && <strong className="block mb-[5px] text-(--text-primary) font-semibold">{title}</strong>}<div>{children}</div></aside>;
}

function Frame({ children, caption }: { children: ReactNode; caption?: ReactNode }) {
  return <figure className="doc-frame my-6 mx-0 p-2 border border-(--border-primary) rounded-[4px] bg-(--bg-surface)">{children}{caption && <figcaption className="pt-2 px-1 pb-[2px] text-(--text-quaternary) text-[12px]">{caption}</figcaption>}</figure>;
}

function CodeGroup({ children }: { children: ReactNode }) {
  return <div className="code-group my-6 mx-0 overflow-hidden border border-(--border-primary) rounded-[4px]">{children}</div>;
}

function Accordion({ children, title }: { children: ReactNode; title: ReactNode }) {
  return <Accordions type="single"><FumaAccordion title={title}>{children}</FumaAccordion></Accordions>;
}

function AccordionGroup({ children }: { children: ReactNode }) {
  const items = Children.toArray(children).filter(isValidElement) as ReactElement<{ children?: ReactNode; title?: ReactNode }>[];
  return <div className="accordion-group"><Accordions type="single">{items.map((item, index) => <FumaAccordion key={index} title={item.props.title}>{item.props.children}</FumaAccordion>)}</Accordions></div>;
}

function QueryLanguageComparisons({ children }: { children: ReactNode }) {
  const items = Children.toArray(children).filter(isValidElement) as ReactElement<{ children?: ReactNode; title?: ReactNode }>[];
  return <LanguageComparisons titles={items.map((item) => textOf(item.props.title))}>{items.map((item, index) => <div key={index}>{item.props.children}</div>)}</LanguageComparisons>;
}

function Tabs({ children }: { children: ReactNode }) {
  const tabs = Children.toArray(children).filter(isValidElement) as ReactElement<{ title?: string; value?: string }>[];
  const items = tabs.map((tab, index) => tab.props.title ?? `Tab ${index + 1}`);
  return <div className="docs-tabs"><FumaTabs items={items}>{tabs.map((tab, index) => cloneElement(tab, { ...tab.props, value: items[index] }))}</FumaTabs></div>;
}

function containsPlaygroundLink(node: ReactNode): boolean {
  if (!isValidElement(node)) return false;
  const props = node.props as { children?: ReactNode; href?: string };
  if (props.href && isPlaygroundQueryLink(props.href)) return true;
  return Children.toArray(props.children).some(containsPlaygroundLink);
}

function Tab({ children, value }: { children: ReactNode; title?: string; value?: string }) {
  const content: ReactNode[] = [];
  Children.toArray(children).forEach((child, index) => {
    if (containsPlaygroundLink(child) && content.length > 0) {
      const query = content.pop();
      content.push(<div className="query-example relative mt-[11px]" key={`query-${index}`}>{query}{child}</div>);
      return;
    }
    content.push(child);
  });
  return <FumaTab value={value}>{content}</FumaTab>;
}

function Field({ children, path, type, required }: { children: ReactNode; path?: string; type?: string; required?: boolean }) {
  return <div className="api-field my-4 mx-0 py-4 px-0 border-t border-t-(--border-secondary)"><div className="api-field-heading flex items-center gap-2"><code>{path}</code>{type && <span className="text-(--text-quaternary) font-mono text-[10px] leading-[14px] font-[450]">{type}</span>}{required && <strong className="text-(--red-400) font-mono text-[10px] leading-[14px] font-[450]">required</strong>}</div>{children}</div>;
}

export function Icon({ icon, iconType }: { icon?: string; iconType?: string }) {
  // Looked up from a static map rather than constructed, so createElement is used
  // instead of JSX — assigning it to a capitalised local trips react-hooks/static-components.
  const glyph = resolveDocIcon(icon);

  if (!glyph) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[docs] <Icon icon="${icon ?? ''}"> has no lucide mapping; nothing rendered.`);
    }
    return null;
  }

  return createElement(glyph, {
    className: 'doc-icon w-[1.05em] h-[1.05em] my-0 mx-[.1em] inline-block align-[-.16em] flex-none text-(--text-secondary)',
    strokeWidth: docIconStrokeWidth(iconType),
    'aria-hidden': true,
    focusable: 'false',
  });
}

export function Info(props: { children: ReactNode; title?: ReactNode }) {
  return <Notice {...props} type="info" />;
}

export function Warning(props: { children: ReactNode; title?: ReactNode }) {
  return <Notice {...props} type="warn" />;
}

export const mdxComponents: MDXComponents = {
  ...defaultComponents,
  pre: PlaceholderPre,
  a: DocsLink,
  img: DocsImage,
  video: DocsVideo,
  source: DocsSource,
  h1: (props) => <HeadingAnchor as="h1" {...props} />,
  h2: (props) => <HeadingAnchor as="h2" {...props} />,
  h3: (props) => <HeadingAnchor as="h3" {...props} />,
  h4: (props) => <HeadingAnchor as="h4" {...props} />,
  h5: (props) => <HeadingAnchor as="h5" {...props} />,
  h6: (props) => <HeadingAnchor as="h6" {...props} />,
  Accordion,
  AccordionGroup,
  LanguageComparisons: QueryLanguageComparisons,
  CodeGroup,
  Tabs,
  Tab,
  Steps,
  Step,
  Card,
  CardGroup: Cards,
  Cards,
  Frame,
  Icon,
  Info,
  Note: (props) => <Notice {...props} type="info" />,
  Tip: (props) => <Notice {...props} type="idea" />,
  Warning,
  CallOut: Notice,
  ParamField: Field,
  ResponseField: Field,
};
