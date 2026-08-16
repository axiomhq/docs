import type { Element, ElementContent, Root, RootContent } from 'hast';

const PLAYGROUND_ORIGIN = 'https://play.axiom.co/';

type Node = RootContent | Root;

/**
 * Content authors write `[Run in Playground](https://play.axiom.co/…)` as a
 * paragraph directly after a code fence. This plugin removes that paragraph
 * and stamps the href onto the preceding code block's `pre` as
 * `data-playground`, so the block component can seat the pill in its header —
 * no content changes. Playground links not adjacent to a code block stay in
 * the prose.
 */
export function rehypePlaygroundCode() {
  return (tree: Root) => {
    walk(tree);
  };
}

function walk(node: Node) {
  if (!('children' in node) || !Array.isArray(node.children)) return;
  const children = node.children as ElementContent[];

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    // Recurse into anything with children — inside <Tabs> the blocks live
    // under mdxJsxFlowElement nodes, not plain elements.
    if ('children' in child && Array.isArray(child.children)) {
      walk(child as unknown as Node);
    }

    const pre = resolvePre(child);
    if (!pre) continue;

    // The paragraph may be separated from the block by whitespace text nodes.
    let next = i + 1;
    while (
      next < children.length &&
      children[next].type === 'text' &&
      !(children[next] as { value: string }).value.trim()
    ) {
      next++;
    }

    const href = soloPlaygroundHref(children[next]);
    if (!href) continue;

    pre.properties = { ...pre.properties, dataPlayground: href };
    children.splice(next, 1);
  }
}

/**
 * rehype-code swaps each fence for shiki's fragment — a nested `root` whose
 * child is the highlighted `pre` — so a code block at page level is either a
 * bare pre or such a fragment.
 */
function resolvePre(node: ElementContent | Root | undefined): Element | null {
  if (!node) return null;
  if (node.type === 'element') {
    return node.tagName === 'pre' ? node : null;
  }
  if ((node as { type: string }).type === 'root' && 'children' in node) {
    const meaningful = (node.children as ElementContent[]).filter(
      (child) => !(child.type === 'text' && child.value.trim() === ''),
    );
    if (meaningful.length === 1) return resolvePre(meaningful[0]);
  }
  return null;
}

/** The paragraph counts only when the playground link is its sole content. */
function soloPlaygroundHref(node: ElementContent | undefined): string | null {
  if (!node || node.type !== 'element' || node.tagName !== 'p') return null;
  const meaningful = node.children.filter(
    (child) => !(child.type === 'text' && child.value.trim() === ''),
  );
  if (meaningful.length !== 1) return null;
  const [link] = meaningful;
  if (link.type !== 'element' || link.tagName !== 'a') return null;
  const href = link.properties?.href;
  return typeof href === 'string' && href.startsWith(PLAYGROUND_ORIGIN)
    ? href
    : null;
}
