import { describe, expect, it } from 'vitest';
import type { Element, Root } from 'hast';
import { rehypePlaygroundCode } from '@/lib/rehype-playground-code';

const PLAY_URL = 'https://play.axiom.co/axiom-play-qf1k/query?initForm=%7B%7D';

const pre = (): Element => ({
  type: 'element',
  tagName: 'pre',
  properties: {},
  children: [],
});

const playgroundParagraph = (href = PLAY_URL): Element => ({
  type: 'element',
  tagName: 'p',
  properties: {},
  children: [
    {
      type: 'element',
      tagName: 'a',
      properties: { href },
      children: [{ type: 'text', value: 'Run in Playground' }],
    },
  ],
});

const run = (tree: Root) => {
  rehypePlaygroundCode()(tree);
  return tree;
};

describe('rehypePlaygroundCode', () => {
  it('hoists an adjacent playground link onto the pre and removes the paragraph', () => {
    const block = pre();
    const tree: Root = {
      type: 'root',
      children: [block, { type: 'text', value: '\n' }, playgroundParagraph()],
    };
    run(tree);
    expect(block.properties.dataPlayground).toBe(PLAY_URL);
    expect(tree.children).toHaveLength(2);
    expect(tree.children.some((child) => child.type === 'element' && child.tagName === 'p')).toBe(false);
  });

  it('reaches blocks nested inside MDX JSX containers like <Tabs>', () => {
    const block = pre();
    const tree = {
      type: 'root',
      children: [
        {
          type: 'mdxJsxFlowElement',
          name: 'Tab',
          attributes: [],
          children: [block, playgroundParagraph()],
        },
      ],
    } as unknown as Root;
    run(tree);
    expect(block.properties.dataPlayground).toBe(PLAY_URL);
  });

  it('leaves non-adjacent and non-playground links alone', () => {
    const block = pre();
    const prose: Element = {
      type: 'element',
      tagName: 'p',
      properties: {},
      children: [{ type: 'text', value: 'Some words between.' }],
    };
    const external = playgroundParagraph('https://example.com/query');
    const tree: Root = { type: 'root', children: [block, prose, playgroundParagraph(), external] };
    run(tree);
    expect(block.properties.dataPlayground).toBeUndefined();
    expect(tree.children).toHaveLength(4);
  });

  it('ignores paragraphs with more than just the link', () => {
    const block = pre();
    const paragraph = playgroundParagraph();
    paragraph.children.push({ type: 'text', value: ' and more prose' });
    const tree: Root = { type: 'root', children: [block, paragraph] };
    run(tree);
    expect(block.properties.dataPlayground).toBeUndefined();
    expect(tree.children).toHaveLength(2);
  });
});
