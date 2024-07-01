Welcome to Axiom’s [documentation repo](https://github.com/axiomhq/axiom-co). It’s a collaborative space open to feedback and contributions.

The documentation is based on the [Mintlify](https://mintlify.com/) framework.

## Setup

1. Install the latest LTS version of [Node.js](https://nodejs.org/en/download/package-manager).
2. Install [Vale](https://vale.sh/docs/vale-cli/installation/).
3. Clone this repository.
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

## Troubleshooting

- If the local build fails, run `mintlify install` to re-install dependencies.
- If a page loads as a 404, make sure you run the local build in the root folder where the file `mint.json` is present.