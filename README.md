# Nixpkgs Tracker Extension

Browser extension to show which branch a Nixpkgs PR is merged into.

Based on [nixpkgs-tracker](https://github.com/ocfox/nixpkgs-tracker).

- [Get from Chrome Web Store](https://chromewebstore.google.com/detail/nixpkgs-tracker/jgjgjgjgjgjgjgjgjgjgjgjgjgjgjgjg)
- [Get from Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/nixpkgs-tracker/)

## Features

- Adds the branch the PR is currently merged into to the "Merged" pill on PR pages in `nixpkgs`.
- Allows providing a GitHub token to avoid rate limiting.

## Development

### Prerequisites

- [pnpm](https://pnpm.io/installation)

### Build

1.  Install dependencies:
    ```sh
    pnpm install
    ```
2.  Build the extension for Chrome and Firefox:
    ```sh
    pnpm build
    ```
    This will create `content_script.js` in the `chrome` and `firefox` directories.

### Watch for changes

To automatically rebuild the extension when you make changes to the source code, you can use the `watch` script:

```sh
pnpm watch
```

## Installation

### Chrome

1.  Navigate to `chrome://extensions`.
2.  Enable "Developer mode".
3.  Click "Load unpacked".
4.  Select the `chrome` directory in this repository.

### Firefox

1.  Navigate to `about:debugging`.
2.  Click "This Firefox".
3.  Click "Load Temporary Add-on...".
4.  Select the `firefox/manifest.json` file in this repository.
