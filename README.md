Welcome to Axiom’s [documentation repo](https://github.com/axiomhq/axiom-co). It contains everything under the [axiom.co/docs](https://axiom.co/docs) subpath. It’s a collaborative space open to feedback and contributions.

The repo is based on the Mintlify framework and the content is in Markdown format. For more information, see [Mintlify documentation](https://mintlify.com/docs/text).

## Setup

1. Install the latest LTS version of [Node.js](https://nodejs.org/en/download/package-manager).
2. Install [Vale](https://vale.sh/vale-cli/installation/).
3. Fork this repo, and then clone it. For more information, see the [GitHub documentation](https://docs.github.com/en/get-started/exploring-projects-on-github/contributing-to-a-project).
4. Go to the root folder in your terminal, and run the following to install Node dependencies:

    ```
    npm i
    ```

5. Run the following in your terminal to sync the Vale style packages.

    ```
    vale sync
    ```

Optional: install the following VS Code extensions:
- [Code Spell Checker](https://marketplace.visualstudio.com/items?itemName=streetsidesoftware.code-spell-checker)
- [MDX](https://marketplace.visualstudio.com/items?itemName=unifiedjs.vscode-mdx)
- [Vale VSCode](https://marketplace.visualstudio.com/items?itemName=ChrisChinchilla.vale-vscode)

## Build locally

Run the following in your terminal to build the documentation locally:

```
npm run mintlify dev
```

## Check for broken links

Run the following in your terminal to check for broken links:

```
npm run mintlify broken-links
```

## Ensure consistent style

Run the following in your terminal to check the style of a file:

```
vale example.mdx
```

Run the following in your terminal to check the style of all files in the current folder and its subfolders:

```
vale .
```

## Contribute

We value your input and invite you to help us make the Axiom documentation even better. Here’s how you can get involved:

1. Rate pages. Hit the 👍/👎 button on any page to let us know what you like and what you don’t.
2. Leave feedback. Click **Raise issue** on any documentation page to create a GitHub issue where you can share thoughts and suggestions.
3. Suggest edits. Found a typo or outdated information? Click **Suggest edits** directly on the page.
4. Contribute content. If you have in-depth knowledge or unique use cases, we encourage you to contribute by writing new sections or enhancing existing ones. Before contributing, please read the [contribution guidelines](/.github/CONTRIBUTING.md) and the [code of conduct](/.github/CODE_OF_CONDUCT.md).

## Troubleshooting

- If the local build fails, run `mintlify install` to re-install dependencies.
- If a page loads as a 404, make sure you run the local build in the root folder where the file `mint.json` is present.