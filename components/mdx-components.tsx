import {
  Children,
  cloneElement,
  createElement,
  isValidElement,
} from "react";
import type {
  AnchorHTMLAttributes,
  ComponentProps,
  ImgHTMLAttributes,
  ReactElement,
  ReactNode,
} from "react";
import type { MDXComponents } from "mdx/types";
import defaultComponents from "fumadocs-ui/mdx";
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
import { IconCard } from "./icon-card";
import {
  INTEGRATION_ICONS,
  IntegrationIcon,
} from "./integration-icons";
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
    <figure className="doc-frame my-6 mx-0 p-0 [&_img]:w-full [&_img]:rounded-md [&_img]:border [&_img]:border-(--border-primary) [&_video]:w-full [&_video]:rounded-md [&_video]:border [&_video]:border-(--border-primary)">
      {children}
      {caption && (
        <figcaption className="mt-2 flex items-start gap-1.5 pl-1 text-(--text-quaternary) font-mono text-[13px]">
          <span
            aria-hidden="true"
            className="flex-none leading-[18px]"
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

// Content cards reuse the landing quick-card (IconCard), same as AppCard.
// The Font Awesome icon names content passes resolve brand marks first, then
// lucide — a bare string would otherwise render as literal text in the chip.
function Card({
  title,
  icon,
  href,
  children,
}: {
  title?: ReactNode;
  icon?: string;
  href?: string;
  children?: ReactNode;
}) {
  const brand = Boolean(icon && icon in INTEGRATION_ICONS);
  const glyph = !brand ? resolveDocIcon(icon) : undefined;
  return (
    <IconCard
      className="not-prose"
      title={title}
      href={href}
      description={children}
      gap="md"
      icon={
        brand ? (
          <IntegrationIcon slug={icon!} size={20} />
        ) : glyph ? (
          createElement(glyph, {
            size: 20,
            strokeWidth: DOC_ICON_STROKE_WIDTH,
            "aria-hidden": true,
          })
        ) : undefined
      }
    />
  );
}

// Restyled by the unlayered `.docs-tabs` rules in globals.css: the shell,
// tab strip, and panel mirror the article code-field chrome.
function Tabs({ children }: { children: ReactNode }) {
  const tabs = Children.toArray(children).filter(
    isValidElement,
  ) as ReactElement<{ title?: string; value?: string }>[];
  const items = tabs.map(
    (tab, index) => tab.props.title ?? `Tab ${index + 1}`,
  );
  return (
    <div className="docs-tabs my-5 mx-0">
      <FumaTabs items={items}>
        {tabs.map((tab, index) =>
          cloneElement(tab, { ...tab.props, value: items[index] }),
        )}
      </FumaTabs>
    </div>
  );
}

// Playground pills live inside the code-block header itself — the
// rehype-playground-code plugin hoists adjacent links onto the pre at
// compile time — so tabs need no special pairing.
function Tab({
  children,
  value,
}: {
  children: ReactNode;
  title?: string;
  value?: string;
}) {
  return <FumaTab value={value}>{children}</FumaTab>;
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
  CardGroup: AppCards,
  Cards: AppCards,
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
