import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(readFileSync(path.join(projectRoot, "package.json"), "utf8"));
const expectedMatches = [
  [ "*://*.holodex.net/*" ],
  [ "*://*.youtube.com/live_chat*" ],
  [ "*://*.youtube.com/*" ],
  [ "*://*.youtube.com/embed/*" ],
];

function listFiles(directory, rootDirectory = directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory()
      ? listFiles(fullPath, rootDirectory)
      : [ path.relative(rootDirectory, fullPath).split(path.sep).join("/") ];
  });
}

function toGlobRegex(glob) {
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, ".*")
    .replace(/\*/g, "[^/]*");
  return new RegExp(`^${ escaped }$`);
}

function assertFileExists(outputDirectory, relativePath, label) {
  const normalizedPath = relativePath.replace(/^\/+/, "").split("?")[0];
  assert.ok(normalizedPath, `${ label } must have a non-empty path`);
  assert.ok(
    existsSync(path.resolve(outputDirectory, normalizedPath)),
    `${ label } does not exist: ${ relativePath }`,
  );
}

function assertResourceExists(files, resource, label) {
  const pattern = toGlobRegex(resource);
  assert.ok(files.some((file) => pattern.test(file)), `${ label } has no matching file: ${ resource }`);
}

function assertReferencedAssets(outputDirectory, manifest, files, browser) {
  const paths = [];
  const add = (value, label) => {
    if (typeof value === "string") paths.push({ value, label });
  };

  add(manifest.background?.service_worker, `${ browser } background service worker`);
  for (const script of manifest.background?.scripts ?? []) add(script, `${ browser } background script`);
  add(manifest.options_ui?.page, `${ browser } options page`);
  add(manifest.options_page, `${ browser } options page`);
  for (const icon of Object.values(manifest.icons ?? {})) add(icon, `${ browser } icon`);
  for (const icon of Object.values(manifest.action?.default_icon ?? {})) add(icon, `${ browser } action icon`);
  for (const contentScript of manifest.content_scripts ?? []) {
    for (const script of contentScript.js ?? []) add(script, `${ browser } content script`);
    for (const style of contentScript.css ?? []) add(style, `${ browser } content style`);
  }

  for (const { value, label } of paths) assertFileExists(outputDirectory, value, label);

  const webAccessibleResources = (manifest.web_accessible_resources ?? []).flatMap((entry) => entry.resources ?? []);
  for (const resource of webAccessibleResources) assertResourceExists(files, resource, `${ browser } web-accessible resource`);

  for (const { value, label } of paths.filter(({ label }) => label.includes("content script"))) {
    const source = readFileSync(path.resolve(outputDirectory, value), "utf8");
    const extensionUrls = [
      ...source.matchAll(/chrome\.runtime\.getURL\(["']([^"']+)["']\)/g),
      ...source.matchAll(/(["'])\/(assets\/[^"']+\.js)\1/g),
    ];

    for (const match of extensionUrls) {
      const resource = match[2] ?? match[1];
      assertFileExists(outputDirectory, resource, `${ label } imported asset`);
      assert.ok(
        webAccessibleResources.some((pattern) => toGlobRegex(pattern).test(resource)),
        `${ label } imported asset is not web-accessible: ${ resource }`,
      );
    }
  }

  if (browser === "safari") {
    const serviceWorker = manifest.background?.service_worker;
    assert.ok(serviceWorker, "Safari must use a service worker background entry");
    assert.equal(manifest.background.type, "module", "Safari background must be an ES module");
    const source = readFileSync(path.resolve(outputDirectory, serviceWorker), "utf8");
    assert.doesNotMatch(source, /\bimportScripts\s*\(/, "Safari background loader must not use importScripts");
    const workerImports = [ ...source.matchAll(/\bimport\s*["']([^"']+)["']/g) ];
    assert.ok(workerImports.length > 0, "Safari service-worker loader must import the compiled background bundle");
    for (const [, importedPath] of workerImports) {
      assertFileExists(outputDirectory, path.posix.join(path.posix.dirname(serviceWorker), importedPath), "Safari background module");
    }
  }
}

for (const browser of [ "safari", "chrome", "firefox" ]) {
  const outputDirectory = path.join(projectRoot, `dist_${ browser }`);
  assert.ok(existsSync(outputDirectory), `Missing dist_${ browser }; build all targets before validation`);
  const files = listFiles(outputDirectory);
  const manifest = JSON.parse(readFileSync(path.join(outputDirectory, "manifest.json"), "utf8"));

  assert.equal(manifest.version, packageJson.version, `${ browser } manifest version must match package.json`);
  assert.equal(manifest.manifest_version, 3, `${ browser } must emit Manifest V3`);
  assert.ok(manifest.background?.service_worker || manifest.background?.scripts?.length, `${ browser } background entry is required`);
  assert.equal(manifest.content_scripts?.length, expectedMatches.length, `${ browser } content-script count changed`);
  assert.deepEqual(
    manifest.content_scripts.map(({ matches }) => matches),
    expectedMatches,
    `${ browser } content-script matches changed`,
  );

  if (browser === "safari") {
    assert.equal(manifest.browser_specific_settings, undefined, "Safari manifest must not include Firefox metadata");
    assert.ok(manifest.permissions?.includes("declarativeNetRequestWithHostAccess"), "Safari must retain header-rule permission");
  }

  assertReferencedAssets(outputDirectory, manifest, files, browser);
  console.log(`dist_${ browser }: manifest and referenced background, content-script, UI, icon, and web-accessible assets validated (${ files.length } files)`);
}