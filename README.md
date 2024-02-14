# Mintlify Starter Kit

Click on `Use this template` to copy the Mintlify starter kit. The starter kit contains examples including

- Guide pages
- Navigation
- Customizations
- API Reference pages
- Use of popular components

### Development

Install the [Mintlify CLI](https://www.npmjs.com/package/mintlify) to preview the documentation changes locally. To install, use the following command

```
npm i -g mintlify
```

Run the following command at the root of your documentation (where mint.json is)

```
mintlify dev
```

### Publishing Changes

Install our Github App to autopropagate changes from youre repo to your deployment. Changes will be deployed to production automatically after pushing to the default branch. Find the link to install on your dashboard. 

#### Troubleshooting

- Mintlify dev isn't running - Run `mintlify install` it'll re-install dependencies.
- Page loads as a 404 - Make sure you are running in a folder with `mint.json`

npm i # install deps
npm run mintlify dev # build mintlify locally
npm run vale sync # sync packages defined in .vale.ini
npm run vale . # check all included files in subfolders

Vale VSCode
https://marketplace.visualstudio.com/items?itemName=ChrisChinchilla.vale-vscode

MDX
https://marketplace.visualstudio.com/items?itemName=unifiedjs.vscode-mdx

Code Spell Checker
https://marketplace.visualstudio.com/items?itemName=streetsidesoftware.code-spell-checker

- Images with a unknown size use `![Alt tag](/img.png)` syntax
- Images with a specific size like icons use `<Image width={32} height={32}> syntax`