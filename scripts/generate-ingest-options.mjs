import { readFile, writeFile } from "node:fs/promises";
import YAML from "yaml";

const generateList = async () => {
  const data = await readFile("mint.json", "utf-8");
  const mint = JSON.parse(data);
  // get the collectors, technologies and any send-data method but also include integrations
  let groups = mint.navigation[1].pages.filter((p) => p.group);
  // unfortunately the integration group has other stuff than sending data
  // so we need to filter it out.
  groups.push({
    group: "Apps & Integrations",
    pages: [
      "apps/cloudflare-logpush",
      "apps/netlify",
      "apps/tailscale",
      "apps/vercel",
    ],
  });
  // the API and CLI group is not included in the navigation
  // so we need to add it manually
  groups.push({
    group: "Other",
    pages: ["restapi/introduction", "reference/cli"],
  });

  const options = await Promise.all(
    groups.map(async (group) => {
      group.pages = await Promise.all(
        group.pages.map(async (path) => {
          return await parsePageInfo(path, group.group);
        }),
      );

      return group.pages;
    }),
  );

  // overide rest api name to be more descriptive
  options[options.length - 1][0].name = "REST API";

  return options.flat();
};

const parsePageInfo = async (path, group) => {
  const f = await readFile(`${path}.mdx`, { encoding: "utf-8" });
  // capture frontmatter header only
  const text = f.match(/---([\s\S]*?)---/)[0];
  const data = YAML.parse(text.replaceAll("---", ""));

  // rename sidebarTitle to name
  data.name = data.sidebarTitle;
  delete data.sidebarTitle;

  return {
    group,
    url: `https://axiom.co/docs/${path}`,
    ...data,
  };
};

const main = async () => {
  const ingestOptions = await generateList();
  console.log("------");
  console.log(
    `found ${ingestOptions.length} ingest options categorized as follows:`,
  );
  // print stats
  const stats = {};
  for (const opt of ingestOptions) {
    if (stats[opt.group]) {
      stats[opt.group] += 1;
    } else {
      stats[opt.group] = 1;
    }
  }
  for (const key of Object.keys(stats)) {
    console.log(`\t${key}: ${stats[key]} options`);
  }

  console.log("------");
  // print popular items
  const popularItems = ingestOptions.filter((opt) => opt.isPopular);
  console.log(`popular items (${popularItems.length}):`);
  popularItems
    .sort((a, b) => a.popularityOrder - b.popularityOrder)
    .map((opt) => {
      console.log(`\t${opt.popularityOrder}. ${opt.name}`);
    });
  console.log("------");
  console.log("writing result to file...");
  await writeFile(
    "ingest-options.json",
    JSON.stringify(ingestOptions),
    "utf-8",
  );
  console.log("done, result written to => ingest-options.json");
};

await main();
