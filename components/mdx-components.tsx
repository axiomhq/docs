import { Children, cloneElement, createElement, isValidElement } from 'react';
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

// Content retains root-relative paths from the Mintlify layout. Pages and public assets both live
// in this app's /docs zone, so normalize them before handing navigation to Next.js.
function DocsLink({ href = '', children, className, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const target = withoutDocsBasePath(href);
  if (target.startsWith('/') || target.startsWith('#')) return <ZoneLink href={target} prefetch={false} className={className} {...props}>{children}</ZoneLink>;
  if (target.startsWith('https://play.axiom.co/')) {
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

function Notice({ children, title, type = 'info' }: { children: ReactNode; title?: ReactNode; type?: 'info' | 'warn' | 'error' | 'success' | 'idea' }) {
  return <aside className={`doc-notice doc-notice-${type}`}>{title && <strong>{title}</strong>}<div>{children}</div></aside>;
}

function Frame({ children, caption }: { children: ReactNode; caption?: ReactNode }) {
  return <figure className="doc-frame">{children}{caption && <figcaption>{caption}</figcaption>}</figure>;
}

function CodeGroup({ children }: { children: ReactNode }) {
  return <div className="code-group">{children}</div>;
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
  if (props.href?.startsWith('https://play.axiom.co/')) return true;
  return Children.toArray(props.children).some(containsPlaygroundLink);
}

function Tab({ children, value }: { children: ReactNode; title?: string; value?: string }) {
  const content: ReactNode[] = [];
  Children.toArray(children).forEach((child, index) => {
    if (containsPlaygroundLink(child) && content.length > 0) {
      const query = content.pop();
      content.push(<div className="query-example" key={`query-${index}`}>{query}{child}</div>);
      return;
    }
    content.push(child);
  });
  return <FumaTab value={value}>{content}</FumaTab>;
}

function Field({ children, path, type, required }: { children: ReactNode; path?: string; type?: string; required?: boolean }) {
  return <div className="api-field"><div className="api-field-heading"><code>{path}</code>{type && <span>{type}</span>}{required && <strong>required</strong>}</div>{children}</div>;
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
    className: 'doc-icon',
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
