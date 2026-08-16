import {
  Children,
  cloneElement,
  createElement,
  isValidElement,
} from "react";
import { cn } from "@/lib/utils";
import type {
  AnchorHTMLAttributes,
  ComponentProps,
  ImgHTMLAttributes,
  ReactElement,
  ReactNode,
} from "react";
import type { MDXComponents } from "mdx/types";
import defaultComponents from "fumadocs-ui/mdx";
import { Card, Cards } from "fumadocs-ui/components/card";
import { Step, Steps } from "fumadocs-ui/components/steps";
import {
  Tab as FumaTab,
  Tabs as FumaTabs,
} from "fumadocs-ui/components/tabs";
import { ImageZoom } from "fumadocs-ui/components/image-zoom";
import { DOC_ICON_STROKE_WIDTH, resolveDocIcon } from "@/lib/doc-icons";
import { ZoneLink } from "@/components/zone-link";
import { PlaygroundLink } from "@/components/playground-link";
import {
  withDocsBasePath,
  withoutDocsBasePath,
} from "@/lib/docs-paths";
import { PlaceholderPre as InteractivePlaceholderPre } from "./placeholder-code";
import { HeadingAnchor } from "./heading-anchor";
import { LanguageComparisons } from "./language-comparisons";
import { Mermaid } from "./mermaid";
import { AppCard, AppCards } from "./app-cards";
import { Notice } from "./notice";
import { Accordion, AccordionGroup } from "./mdx-accordion";

// play.axiom.co links come in two shapes: runnable APL query links
// (…/query?initForm=…) that render as the compact "Run in Playground" button
// beside a code block, and plain prose links to the demo homepage, which should
// render as ordinary text links rather than a stray mono pill.
function isPlaygroundQueryLink(href: string): boolean {
  return (
    href.startsWith("https://play.axiom.co/") &&
    href.includes("/query")
  );
}

// Content retains root-relative paths from the Mintlify layout. Pages and public assets both live
// in this app's /docs zone, so normalize them before handing navigation to Next.js.
function DocsLink({
  href = "",
  children,
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const target = withoutDocsBasePath(href);
  if (target.startsWith("/") || target.startsWith("#"))
    return (
      <ZoneLink
        href={target}
        prefetch={false}
        className={className}
        {...props}
      >
        {children}
      </ZoneLink>
    );
  if (isPlaygroundQueryLink(target)) {
    return (
      <PlaygroundLink href={target} className={className} {...props}>
        {children}
      </PlaygroundLink>
    );
  }
  return (
    <a href={target} className={className} {...props}>
      {children}
    </a>
  );
}

// Raw JSX <img> tags in content bypass this override. This handles Markdown
// image syntax and applies the docs base path before enabling zoom.
function DocsImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  const imageProps = props as ComponentProps<typeof ImageZoom>;
  const src =
    typeof imageProps.src === "string"
      ? withDocsBasePath(imageProps.src)
      : imageProps.src;
  return <ImageZoom {...imageProps} src={src} />;
}

function DocsVideo({ src, ...props }: ComponentProps<"video">) {
  return (
    <video
      {...props}
      src={typeof src === "string" ? withDocsBasePath(src) : src}
    />
  );
}

function DocsSource({ src, ...props }: ComponentProps<"source">) {
  return (
    <source
      {...props}
      src={typeof src === "string" ? withDocsBasePath(src) : src}
    />
  );
}

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number")
    return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node))
    return textOf(node.props.children);
  return "";
}

function PlaceholderPre(props: ComponentProps<"pre">) {
  return (
    <InteractivePlaceholderPre
      {...props}
      source={textOf(props.children)}
    />
  );
}

// Borderless media: the screenshot itself is the surface — no padded box.
// Captions hang beneath with a └ tick, like an annotation off the image.
function Frame({
  children,
  caption,
}: {
  children: ReactNode;
  caption?: ReactNode;
}) {
  return (
    <figure className="doc-frame my-6 mx-0 p-0 [&_img]:w-full [&_img]:rounded-md [&_video]:w-full [&_video]:rounded-md">
      {children}
      {caption && (
        <figcaption className="mt-2 flex items-start gap-1.5 pl-1 text-(--text-quaternary) font-sans text-[12px] leading-[17px]">
          <span
            aria-hidden="true"
            className="flex-none font-mono leading-[15px]"
          >
            └
          </span>
          <span className="min-w-0">{caption}</span>
        </figcaption>
      )}
    </figure>
  );
}

function CodeGroup({ children }: { children: ReactNode }) {
  return (
    <div className="code-group my-6 mx-0 overflow-hidden border border-(--border-primary) rounded-md [&>*]:m-0! [&>*]:border-0! [&>*]:rounded-none! [&>*]:border-b! [&>*]:border-b-(--border-primary)! [&>*:last-child]:border-b-0!">
      {children}
    </div>
  );
}

function QueryLanguageComparisons({
  children,
}: {
  children: ReactNode;
}) {
  const items = Children.toArray(children).filter(
    isValidElement,
  ) as ReactElement<{ children?: ReactNode; title?: ReactNode }>[];
  return (
    <LanguageComparisons
      titles={items.map((item) => textOf(item.props.title))}
    >
      {items.map((item, index) => (
        <div key={index}>{item.props.children}</div>
      ))}
    </LanguageComparisons>
  );
}

// Restyles fumadocs' Tabs internals. The `!` markers mirror the rules this
// replaces: fumadocs styles the same properties with data/aria variants.
// Hover is scoped to :not([aria-selected=true]) because the hover and selected
// colour rules tie on specificity — unscoped, emit order would decide.
function Tabs({ children }: { children: ReactNode }) {
  const tabs = Children.toArray(children).filter(
    isValidElement,
  ) as ReactElement<{ title?: string; value?: string }>[];
  const items = tabs.map(
    (tab, index) => tab.props.title ?? `Tab ${index + 1}`,
  );
  return (
    <div
      className={cn(
        "docs-tabs my-5 mx-0",
        "[&>div]:m-0! [&>div]:overflow-hidden [&>div]:border! [&>div]:border-(--border-primary)! [&>div]:rounded-[4px]! [&>div]:bg-(--bg-surface)!",
        "[&>div>[role='tablist']]:min-h-[38px] [&>div>[role='tablist']]:overflow-x-auto [&>div>[role='tablist']]:py-0! [&>div>[role='tablist']]:px-2.5! [&>div>[role='tablist']]:items-stretch [&>div>[role='tablist']]:gap-0.5! [&>div>[role='tablist']]:border-b [&>div>[role='tablist']]:border-b-(--border-primary) [&>div>[role='tablist']]:bg-(--bg-emph-tertiary) max-sm:[&>div>[role='tablist']]:min-h-11",
        "[&>div>[role='tablist']>[role='tab']]:relative [&>div>[role='tablist']>[role='tab']]:shrink-0 [&>div>[role='tablist']>[role='tab']]:py-0! [&>div>[role='tablist']>[role='tab']]:px-2! [&>div>[role='tablist']>[role='tab']]:border-0! [&>div>[role='tablist']>[role='tab']]:text-(--text-secondary)! [&>div>[role='tablist']>[role='tab']]:font-mono! [&>div>[role='tablist']>[role='tab']]:text-[11px]! [&>div>[role='tablist']>[role='tab']]:leading-4! [&>div>[role='tablist']>[role='tab']]:font-medium! max-sm:[&>div>[role='tablist']>[role='tab']]:min-h-11",
        "[&>div>[role='tablist']>[role='tab']:hover:not([aria-selected='true'])]:text-(--text-primary)!",
        "[&>div>[role='tablist']>[role='tab'][aria-selected='true']]:text-(--text-primary)!",
        "[&>div>[role='tablist']>[role='tab'][aria-selected='true']]:after:absolute [&>div>[role='tablist']>[role='tab'][aria-selected='true']]:after:right-2 [&>div>[role='tablist']>[role='tab'][aria-selected='true']]:after:-bottom-px [&>div>[role='tablist']>[role='tab'][aria-selected='true']]:after:left-2 [&>div>[role='tablist']>[role='tab'][aria-selected='true']]:after:h-0.5 [&>div>[role='tablist']>[role='tab'][aria-selected='true']]:after:bg-(--color-accent) [&>div>[role='tablist']>[role='tab'][aria-selected='true']]:after:content-['']",
        "[&>div>[role='tabpanel']]:p-3! [&>div>[role='tabpanel']]:rounded-none! [&>div>[role='tabpanel']]:bg-(--bg-surface)! [&>div>[role='tabpanel']]:text-[14px]! [&>div>[role='tabpanel']]:leading-[22px]!",
        "[&>div>[role='tabpanel']>*]:my-0! [&>div>[role='tabpanel']>*+*]:mt-[10px]!",
        "[&>div>[role='tabpanel']_:is(figure[data-rehype-pretty-code-figure],figure.shiki)]:rounded-[4px]! [&>div>[role='tabpanel']_:is(figure[data-rehype-pretty-code-figure],figure.shiki)]:shadow-none!",
        "[&>div>[role='tabpanel']>div.relative.overflow-auto:has(>table)]:mt-[10px]! [&>div>[role='tabpanel']>div.relative.overflow-auto:has(>table)]:mb-0! [&>div>[role='tabpanel']>div.relative.overflow-auto:has(>table)]:rounded-[4px]!",
      )}
    >
      <FumaTabs items={items}>
        {tabs.map((tab, index) =>
          cloneElement(tab, { ...tab.props, value: items[index] }),
        )}
      </FumaTabs>
    </div>
  );
}

function containsPlaygroundLink(node: ReactNode): boolean {
  if (!isValidElement(node)) return false;
  const props = node.props as { children?: ReactNode; href?: string };
  if (props.href && isPlaygroundQueryLink(props.href)) return true;
  return Children.toArray(props.children).some(
    containsPlaygroundLink,
  );
}

// Overlays the "Run in Playground" pill and the copy button on the code block's
// top-right corner; the copy button sits left of the pill and gets a backdrop
// so it stays legible over code.
function Tab({
  children,
  value,
}: {
  children: ReactNode;
  title?: string;
  value?: string;
}) {
  const content: ReactNode[] = [];
  Children.toArray(children).forEach((child, index) => {
    if (containsPlaygroundLink(child) && content.length > 0) {
      const query = content.pop();
      content.push(
        <div
          className={cn(
            "query-example relative mt-[11px]",
            "[&>figure]:m-0!",
            "[&>p:has(>.playground-link)]:absolute [&>p:has(>.playground-link)]:z-2 [&>p:has(>.playground-link)]:top-[7px] [&>p:has(>.playground-link)]:right-2 [&>p:has(>.playground-link)]:m-0!",
            // The pill overlays the code-block header's right side; push the
            // header copy button out from under it.
            "[&_[data-code-copy]]:mr-[158px]",
          )}
          key={`query-${index}`}
        >
          {query}
          {child}
        </div>,
      );
      return;
    }
    content.push(child);
  });
  return <FumaTab value={value}>{content}</FumaTab>;
}

function Field({
  children,
  path,
  type,
  required,
}: {
  children: ReactNode;
  path?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="api-field my-4 mx-0 py-4 px-0 border-t border-t-(--border-secondary)">
      <div className="api-field-heading flex items-center gap-2">
        <code>{path}</code>
        {type && (
          <span className="text-(--text-quaternary) font-mono text-[10px] leading-[14px] font-[450]">
            {type}
          </span>
        )}
        {required && (
          <strong className="text-(--red-400) font-mono text-[10px] leading-[14px] font-[450]">
            required
          </strong>
        )}
      </div>
      {children}
    </div>
  );
}

// `iconType` (Font Awesome weight) is still accepted from content but no
// longer varies the stroke — every icon renders at the shared hairline width.
export function Icon({
  icon,
}: {
  icon?: string;
  iconType?: string;
}) {
  // Looked up from a static map rather than constructed, so createElement is used
  // instead of JSX — assigning it to a capitalised local trips react-hooks/static-components.
  const glyph = resolveDocIcon(icon);

  if (!glyph) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[docs] <Icon icon="${icon ?? ""}"> has no lucide mapping; nothing rendered.`,
      );
    }
    return null;
  }

  return createElement(glyph, {
    className:
      "doc-icon w-[1.05em] h-[1.05em] my-0 mx-[.1em] inline-block align-[-.16em] flex-none text-(--text-primary)",
    strokeWidth: DOC_ICON_STROKE_WIDTH,
    "aria-hidden": true,
    focusable: "false",
  });
}

export function Info(props: {
  children: ReactNode;
  title?: ReactNode;
}) {
  return <Notice {...props} type="info" />;
}

export function Warning(props: {
  children: ReactNode;
  title?: ReactNode;
}) {
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
  Mermaid,
  AppCard,
  AppCards,
  Note: (props) => <Notice {...props} type="info" />,
  Tip: (props) => <Notice {...props} type="idea" />,
  Warning,
  CallOut: Notice,
  ParamField: Field,
  ResponseField: Field,
};
