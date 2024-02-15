## Initial setup

1. Install Node.js.
2. Clone this repo.
3. Go to the root folder in your terminal, and run the following to install Node dependencies:

    ```
    npm i
    ```

4. Install the following VS Code extensions:
    - [Vale VSCode](https://marketplace.visualstudio.com/items?itemName=ChrisChinchilla.vale-vscode)
    - [MDX](https://marketplace.visualstudio.com/items?itemName=unifiedjs.vscode-mdx)
    - [Code Spell Checker](https://marketplace.visualstudio.com/items?itemName=streetsidesoftware.code-spell-checker)

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

## Check style

Run the following in your terminal to check the style of a file:

```
npm run vale example.mdx
```

Run the following in your terminal to check the style of all files in the current folder and its subfolders:

```
npm run vale .
```

## Update Vale

Run the following in your terminal to sync the style packages defined in `.vale.ini`. Only do this if the packages are outdated or broken.

```
npm run vale sync
```

## Troubleshoot Mintlify

- Mintlify dev isn't running - Run `mintlify install` it'll re-install dependencies.
- Page loads as a 404 - Make sure you are running in a folder with `mint.json`