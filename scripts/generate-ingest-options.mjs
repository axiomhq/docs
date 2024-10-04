import { readFile, writeFile } from "node:fs/promises";
import YAML from "yaml";

const generateList = async () => {
  const data = await readFile("mint.json", "utf-8");
  const mint = JSON.parse(data);
  const groups = mint.navigation[1].pages.filter((p) => p.group);

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

  return options.flat();
};

const parsePageInfo = async (path, group) => {
  const f = await readFile(`${path}.mdx`, { encoding: "utf-8" });
  // capture frontmatter header only
  const text = f.match(/---([\s\S]*?)---/)[0];
  const data = YAML.parse(text.replaceAll("---", ""));
  return {
    group,
    url: `https://axiom.co/docs/${path}`,
    ...data,
  };
};

const main = async () => {
  const ingestOptions = await generateList();
  console.log(ingestOptions);

  console.log("writing result to file...");
  await writeFile(
    "ingest-options.json",
    JSON.stringify(ingestOptions),
    "utf-8",
  );
  console.log("result written to => ingest-options.json");
  console.log("done");
};

await main();
