import { defaultShikiFactory } from 'fumadocs-core/highlight/shiki/full';
import kusto from 'shiki/langs/kusto.mjs';

/**
 * Shiki has no MPL or PromQL grammar. Registering the kusto grammar under
 * those names on fumadocs' shared highlighter keeps the fence language intact,
 * so code-block headers label `mpl` and `promql` fences correctly.
 */
export async function registerQueryLanguages() {
  const highlighter = await defaultShikiFactory.getOrInit();
  await highlighter.loadLanguage(
    ...kusto.map((grammar) => ({
      ...grammar,
      name: 'mpl',
      scopeName: 'source.mpl',
      aliases: ['promql'],
    })),
  );
}
