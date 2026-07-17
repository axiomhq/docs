import { Children, cloneElement, isValidElement } from 'react';
import type { AnchorHTMLAttributes, ComponentProps, ImgHTMLAttributes, ReactElement, ReactNode } from 'react';
import type { MDXComponents } from 'mdx/types';
import Link from 'next/link';
import defaultComponents from 'fumadocs-ui/mdx';
import { Accordion as FumaAccordion, Accordions } from 'fumadocs-ui/components/accordion';
import { Callout } from 'fumadocs-ui/components/callout';
import { Card, Cards } from 'fumadocs-ui/components/card';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { Tab as FumaTab, Tabs as FumaTabs } from 'fumadocs-ui/components/tabs';
import { ImageZoom } from 'fumadocs-ui/components/image-zoom';
import { PlaceholderPre } from './placeholder-code';

function DocsLink({ href = '', ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const target = href.startsWith('/') && !href.startsWith('/docs/') && !href.startsWith('/doc-assets/') && !href.startsWith('/llms') ? `/docs${href}` : href;
  if (target.startsWith('/') || target.startsWith('#')) return <Link href={target} {...props} />;
  return <a href={target} {...props} />;
}

function DocsImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  return <ImageZoom {...(props as ComponentProps<typeof ImageZoom>)} />;
}

function Notice({ children, title, type = 'info' }: { children: ReactNode; title?: ReactNode; type?: 'info' | 'warn' | 'error' | 'success' | 'idea' }) {
  return <Callout title={title} type={type}>{children}</Callout>;
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
  return <div className="accordion-group">{children}</div>;
}

function Tabs({ children }: { children: ReactNode }) {
  const tabs = Children.toArray(children).filter(isValidElement) as ReactElement<{ title?: string; value?: string }>[];
  const items = tabs.map((tab, index) => tab.props.title ?? `Tab ${index + 1}`);
  return <FumaTabs items={items}>{tabs.map((tab, index) => cloneElement(tab, { ...tab.props, value: items[index] }))}</FumaTabs>;
}

function Tab({ children, value }: { children: ReactNode; title?: string; value?: string }) {
  return <FumaTab value={value}>{children}</FumaTab>;
}

function Field({ children, path, type, required }: { children: ReactNode; path?: string; type?: string; required?: boolean }) {
  return <div className="api-field"><div className="api-field-heading"><code>{path}</code>{type && <span>{type}</span>}{required && <strong>required</strong>}</div>{children}</div>;
}

export function Icon({ icon }: { icon?: string }) {
  return <span className="doc-icon" aria-hidden="true">{icon?.slice(0, 1).toUpperCase() ?? '◆'}</span>;
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
  Accordion,
  AccordionGroup,
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
