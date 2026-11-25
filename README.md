<div align="center">
<img src="public/icon-128.png" alt="logo"/>
<h1> Minimalist Chrome/Firefox/Safari Extension Boilerplate with<br/>React + Vite + TypeScript + TailwindCSS</h1>

<h5>
This template repository is a side product of my Chrome Extension <a target="_blank" rel="noopener noreferrer" href="https://chrome.google.com/webstore/detail/supatabs/icbcnjlaegndjabnjbaeihnnmidbfigk">Supatabs</a>.
<br />
If you tend to have tons of tabs open, or are a OneTab user, make sure to check it out <a target="_blank" rel="noopener noreferrer" href="https://chrome.google.com/webstore/detail/supatabs/icbcnjlaegndjabnjbaeihnnmidbfigk">here</a>!
</h5>

<h5>Supatabs is an example and showcase of what you can develop with this template. (anything you want, really 🚀)</h5>

</div>

## Table of Contents

- [Intro](#intro)
- [Features](#features)
- [Usage](#usage)
  - [Getting Started](#gettingStarted) 
  - [Safari (macOS)](#safari)
  - [Customization](#customization)
  - [Publish](#publish)
- [Tech Docs](#tech)
- [Credit](#credit)
- [Contributing](#contributing)


## Intro <a name="intro"></a>
This boilerplate is meant to be a minimal quick start for creating Chrome, Firefox, and macOS Safari extensions using React, TypeScript, and Tailwind CSS.

It includes all possible pages such as **new tab**, **dev panel**, **pop up**, etc., as well as corresponding manifest settings by default.
You will likely have to customize/delete some of the pages (see docs below).

You can build Manifest V3 extensions for Chrome and Firefox, as well as a compiled macOS Safari artifact for Apple’s web extension packager.

If you are looking for a React focused way to access the local storage, I also implemented a chrome local/sync storage hook. The hook works
well with this template. [Check it out here](https://gist.github.com/JohnBra/c81451ea7bc9e77f8021beb4f198ab96).

## Features <a name="features"></a>
- [React 18](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [i18n (optional)](https://developer.chrome.com/docs/extensions/reference/api/i18n)
- [ESLint](https://eslint.org/)
- [Chrome Extension Manifest Version 3](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Github Action](https://github.com/JohnBra/vite-web-extension/actions/workflows/ci.yml) to build and zip your extension (manual trigger)

## Usage <a name="usage"></a>

### Getting Started <a name="gettingStarted"></a>

#### Developing and building
This template comes with build configs for Chrome and Firefox. The `dev` command
defaults to Chrome, while `build` creates both Chrome and Firefox production
builds.

1. Clone this repository or click "Use this template"
2. Change `name` and `description` in `manifest.json`
3. Run `yarn` or `npm i` (use Node.js 20.19+ or 22.12+ for Vite 7)
4. Run `yarn dev[:chrome|:firefox]`, or `npm run dev[:chrome|:firefox]`

Running a `dev` command will build your extension and watch for changes in the 
source files. Changing the source files will refresh the corresponding 
`dist_<chrome|firefox>` folder.

To create an optimized production build, run `yarn build[:chrome|:firefox]`, or
`npm run build[:chrome|:firefox]`.

#### Safari (macOS) build and packaging <a name="safari"></a>

Build the Safari artifact with:

```sh
yarn build:safari
```

This creates `dist_safari`, a compiled extension directory containing `manifest.json`
and its bundled resources. Pass this directory to Apple’s packager; do not pass
the source `manifest.json.ts` file.

The extension’s module background and header-modification rules require Safari
16.4 or later. Users must enable the extension in Safari and grant it website
access for YouTube (and Holodex where requested) in Safari’s extension settings
or from the toolbar permission prompt. Safari requires user-granted site access
for `modifyHeaders` rules, in addition to the declared
`declarativeNetRequestWithHostAccess` permission.

One existing header rule uses the DNR `initiatorDomains` condition, which is not
listed among Apple’s documented Safari DNR conditions. Safari may reject that
rule; rule installation is handled independently, so its failure does not
prevent other rules from being attempted or the context-menu and toolbar-action
handlers from initializing. The exact header behavior must be verified in Safari.

On macOS with Xcode installed, run the packager from the repository root (the
flags shown are available in current Xcode versions; check `--help` if your
installed version differs):

```sh
xcrun safari-web-extension-packager "$PWD/dist_safari" \
  --macos-only --copy-resources --no-open --no-prompt
```

The packager creates an Xcode project. `--copy-resources` copies the extension
files into that project, so rerun the packager or refresh the copied resources
after rebuilding `dist_safari`. Native packaging and runtime behavior have not
been validated as part of this repository’s build checks.

Apple also provides a Safari Web Extension Packager in App Store Connect. It
accepts the complete extension directory contents from a browser and requires
an Apple Developer Program account and an app record; see [Apple’s packaging
documentation](https://developer.apple.com/documentation/safariservices/packaging-a-web-extension-for-safari)
and [App Store Connect packaging instructions](https://developer.apple.com/documentation/safariservices/packaging-and-distributing-safari-web-extensions-with-app-store-connect).

#### Load your extension
For Chrome
1. Open - Chrome browser
2. Access - [chrome://extensions](chrome://extensions)
3. Tick - Developer mode
4. Find - Load unpacked extension
5. Select - `dist_chrome` folder in this project (after dev or build)

For Firefox
1. Open - Firefox browser
2. Access - [about:debugging#/runtime/this-firefox](about:debugging#/runtime/this-firefox)
3. Click - Load temporary Add-on
4. Select - any file in `dist_firefox` folder (i.e. `manifest.json`) in this project (after dev or build)

### Customization <a name="customization"></a>

#### Adding / removing pages
The template includes **all** of the extension pages (i.e. New Tab, Dev Panel, Popup, etc.).
You will likely have to customize it to fit your needs.

E.g. you don't want the newtab page to activate whenever you open a new tab:
1. remove the directory `newtab` and its contents in `src/pages`
2. remove `chrome_url_overrides: { newtab: 'src/pages/newtab/index.html' },` in `manifest.json`

If you need to declare pages in addition to the manifest pages, e.g. a custom `app` page, create a 
new folder in the `pages` directory and add the corresponding `.html`, `.tsx` and `.css` 
files (see `options/*` for an example to copy). Then include the root html in the `vite.config.base.ts` 
file under `build.rollupOptions.input` like so:

```typescript
// ...
build: {
   rollupOptions: {
      input: {
         app: resolve(pagesDir, "app", "index.html"),
      },
      output: {
         entryFileNames: (chunk) => `src/pages/${chunk.name}/index.js`,
      },
   },
}
// ...
```

#### Styling
CSS files in the `src/pages/*` directories are not necessary. They are left in there in case you want 
to use it in combination with Tailwind CSS. **Feel free to delete them**.

Tailwind can be configured as usual in the `tailwind.config.cjs` file. See doc link below.

#### Internationalization (i18n)
To enable internationalization set the `localize` flag in the `vite.config.base.ts` to `true`.

The template includes a directory `locales` with a basic setup for english i18n. Enabling i18n
will pull the name and description for your extension from the english translation files instead
of the manifest.

Follow the instructions in the [official docs](https://developer.chrome.com/docs/extensions/reference/api/i18n#description) 
to add other translations and retrieve them in the extension.

If you don't need i18n you can ignore the `locales` directory until you need it, as it won't
be copied into the build folder unless the `localize` flag is set to `true`.

### Publish your extension to the CWS<a name="publish"></a>
To upload an extension to the Chrome store you have to pack (zip) it and then upload it to your item 
in the Chrome Web Store.

This repo includes a Github Action Workflow to create a 
[optimized prod build and the zip file](https://github.com/JohnBra/vite-web-extension/actions/workflows/ci.yml).

To run the workflow do the following:
1. Go to the **"Actions"** tab in your forked repository from this template
2. In the left sidebar click on **"Build and Zip Chrome Extension"**
3. Click on **"Run Workflow"** and select the main branch, then **"Run Workflow"**
4. Refresh the page and click the most recent run
5. In the summary page **"Artifacts"** section click on the generated **"vite-web-extension-chrome"**
6. Upload this file to the Chrome Web Store as described [here](https://developer.chrome.com/docs/webstore/publish/)

# Tech Docs <a name="tech"></a>
- [Vite](https://vitejs.dev/)
- [Vite Plugin](https://vitejs.dev/guide/api-plugin.html)
- [Chrome Extension with manifest 3](https://developer.chrome.com/docs/extensions/mv3/)
- [Chrome Extension i18n](https://developer.chrome.com/docs/extensions/reference/api/i18n#description)
- [Rollup](https://rollupjs.org/guide/en/)
- [@crxjs/vite-plugin](https://crxjs.dev/vite-plugin)
- [Tailwind CSS](https://tailwindcss.com/docs/configuration)

# Credit <a name="credit"></a>
Heavily inspired by [Jonghakseo's vite chrome extension boilerplate](https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite). 
It uses SASS instead of TailwindCSS and is ~~slightly~~ _a lot_ less minimalist in case you want to check it out.

# Contributing <a name="contributing"></a>
Feel free to open PRs or raise issues!
