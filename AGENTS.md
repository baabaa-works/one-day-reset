# Repository Guidelines

## Project Structure & Module Organization

This is a Git repository with a native HTML workbench in `index.html`, social entry UI in `assets/growth.js` and `assets/growth.css`, browser flow checks in `tests/`, and a dependency-free preview server in `scripts/preview.cjs`. Preserve the existing `one-day-reset-tw-v1` storage and backup format.

When adding the initial implementation, keep application code, tests, and static assets clearly separated. Suggested directories are `src/`, `tests/`, and `assets/`; these are proposed conventions, not existing paths. Document installation and local setup in `README.md`.

## Build, Test, and Development Commands

Use `node scripts/preview.cjs` for local preview and `node --check assets/growth.js` for JavaScript syntax validation. Browser verification uses Playwright CLI `run-code --filename=tests/browser-flow.js` and `tests/mobile-check.js`; see README for exact commands. There is no dependency install, build, or lint step.

When introducing tooling, document the exact installation, local development, build, lint, and test commands here. Commit the relevant configuration and dependency lockfile alongside the implementation.

## Coding Style & Naming Conventions

Use native JavaScript, HTML and CSS with descriptive names and small modules. Avoid adding a framework for the social entry flow. Keep new modules consistently indented and document any new commands in README.

## Testing Guidelines

Playwright CLI flow checks live in `tests/`; no coverage threshold is configured. Test observable behavior, privacy boundaries, legacy backup round trips and important failure cases. Run targeted checks for small changes and broader integration checks for changes spanning modules. Record any checks that could not run and explain why. Tests must use isolated local browser storage, never production data.

## Commit & Pull Request Guidelines

There is no Git history from which to infer commit conventions. After Git is initialized, use concise, imperative messages, such as `Add initial project setup`. Validate each independently reversible change before committing it.

Pull requests should explain the purpose, scope, and validation results. Link relevant issues and include screenshots for visible UI changes. Identify remaining limitations. Do not push, publish, deploy, or modify production without explicit authorization.

## Agent Workflow & Configuration

Inspect existing work before editing. Prefer focused changes and reuse verified results. For major changes, implement and review one representative flow before expanding. Never commit credentials; document required configuration using example values.
