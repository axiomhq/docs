import type { ElementContent, Root, RootContent } from 'hast';

const PLAYGROUND_ORIGIN = 'https://play.axiom.co/';

type Node = RootContent | Root;

/**
 * Content authors write `[Run in Playground](https://play.axiom.co/…)` as a
 * paragraph directly after a code fence. This plugin removes that paragraph
 * and stamps the href onto the preceding `pre` as `data-playground`, so the
 * code-block component can seat the pill in its header — no content changes.
 * Playground links that are not adjacent to a code block stay in the prose.
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
    if (child.type !== 'element' || child.tagName !== 'pre') continue;

    // The paragraph may be separated from the pre by whitespace text nodes.
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

    child.properties = { ...child.properties, dataPlayground: href };
    children.splice(next, 1);
  }
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
