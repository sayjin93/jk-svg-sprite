# Changelog

All notable changes to this project are documented in this file.

## 1.0.1 — 2026-09-24

### Maintenance

* This changelog is now included in the published package.
* Updated dependencies: `js-yaml` 5.4.2, `yargs` 18.2.0.
* Updated development dependencies: `eslint` 10.11.0, `vitest` and `@vitest/coverage-v8` 5.0.1,
  `sass` 1.105.0.

## 1.0.0 — 2026-09-10

Initial release.

### Features

* Five sprite modes: `css`, `view`, `defs`, `symbol` and `stack`.
* Stylesheet rendering via [Mustache](https://mustache.github.io/) templates, in CSS, Sass, LESS
  and Stylus, plus optional HTML example documents.
* Shape alignment and duplication driven by a YAML descriptor.
* Meta data injection (`title` / `description`) from a YAML descriptor.
* SVG optimisation through [SVGO](https://github.com/svg/svgo), with custom transforms supported.
* Shape ID and CSS class namespacing to prevent collisions between sprited shapes.
* Command line interface (`jk-svg-sprite`) alongside the programmatic API.

### Technical

* ESM-only (`"type": "module"` with an `exports` map). Requires Node.js 22 or newer;
  Node 22.12+ can also `require()` the package.
* 11 runtime dependencies.
* Test suite runs on [Vitest](https://vitest.dev/), including visual regression coverage that
  rasterises generated sprites in Chromium and compares them against reference images.
