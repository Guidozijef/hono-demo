# Workspace Overview

This repository is a multi‑project workspace containing several related but independent packages. An AI agent should be aware of the scope and boundaries of each so you don’t accidentally mix up build commands or import paths.

- **`jhc-web`** – a Vue 3/Vite web frontend used by the business. Heavy use of map libraries (Cesium, OpenLayers via custom plugins) and UI tooling; configured with PNPM, ESLint/Prettier/Stylelint, `husky` and `commitizen` (`cz-git` / conventional commits).
- **`jhc-wxapp`** – a WeChat mini‑program built with Taro 4 + Vue 3 + NutUI. Scripts set `PRE_ENV` to choose DEV/TEST/PROD.
- **`jgis`** – a shared GIS library (2D/3D) authored in TypeScript. Uses Vite to bundle and exports ESM/CJS builds under `dist`; path alias `@` → `src`.
- **`jgis-docs`** – documentation site for the `jgis` library, written in Markdown and Vue components.
- **`my-app`** – a small Hono‑based Node server example with MySQL. It’s primarily for rapid API prototyping and learning.

The agent should treat each folder as a standalone project. Don’t assume a single `package.json` or shared build tool across them.

---

## Common Technologies & Conventions

- **TypeScript** is used almost everywhere. All projects declare `tsconfig.json` and target `ESNext`/`NodeNext`.
- **ESM imports** are the norm (`import … from '…'`). `module` fields in `package.json` are populated accordingly.
- **Package management** typically uses `pnpm`; some legacy scripts (batch files under `jhc-web/bin`) still call `yarn` but you can ignore them when adding new packages.
- **Linting & Formatting**: The web projects have elaborate ESLint/Prettier/Stylelint setups. `lint-staged` and Husky hooks auto‑format on commit. Commit messages follow conventional‑commit style (`git cz` / `npm run commit`).
- **Path aliases**: only `jgis` uses the `@` → `src` alias in its tsconfig; other projects use relative paths.
- **Environment variables**: `jhc-wxapp` uses `PRE_ENV`. `my-app/src/db.ts` expects cloud env vars for database connection when deployed (hard coded defaults are present for development).
- **Validation patterns**: `my-app` employs `zod` schemas and `@hono/zod-validator` to validate JSON payloads.
- **Middleware**: `my-app` registers global middleware (`app.use('*', logger())`) and route‑specific JWT checks using `hono/jwt`.

> _Note:_ there are **no automated tests** in these projects (`jgis`'s `test` script is a placeholder). When adding new code, update or add tests where appropriate, but don’t search for existing suites—they don’t exist.

---

## Key Development Workflows

1. **`my-app` (Hono server)**
   ```sh
   cd my-app
   npm install        # or pnpm install
   npm run dev        # starts HTTP server on http://localhost:3000
   ```
   - Edit `src/index.ts` for routes. `db.ts` configures a MySQL pool.  
   - No build step; it’s run directly by Node.

2. **`jhc-web` (Vue frontend)**
   ```sh
   cd jhc-web
   pnpm install
   pnpm run dev       # Vite dev server
   pnpm run build:prod  # production build
   ```
   - Batch scripts exist (`bin/build.bat`, etc.) but they simply call the above.
   - Lint/format using `pnpm run lint`, `pnpm run format`.
   - Commit with `pnpm run commit` to get conventional commit prompts.

3. **`jhc-wxapp` (mini-app)**
   ```sh
   cd jhc-wxapp
   npm install
   npm run dev        # taro build --watch, sets PRE_ENV=dev
   npm run build:prod # PRE_ENV=prod taro build
   ```
   - The `taro` CLI handles compilation to the mini‑program format.
   - Source files live under `src/` like a normal Vue project.

4. **`jgis` library**
   ```sh
   cd jgis
   pnpm install
   pnpm run build     # runs `vite build`; output in dist/
   ```
   - Consumes `src/2d` and `src/3d` modules; check `package.json` exports for published API shape.
   - Documentation lives in `jgis-docs`, but the library code is the source of truth.

5. **`jgis-docs`**
   - Static site built from Markdown/ Vue components. No special commands shown but `pnpm run dev` or similar likely exist (inspect its package.json if needed).

---

## Architecture & Data Flow Highlights

- **Frontend ↔ backend**: `jhc-web` and `jhc-wxapp` consume APIs similar to those exposed by `my-app`; look at `src/` in each to see example fetch/axios usage.
- **GIS library** (`jgis`) is completely isolated; other projects may import it as a dependency via local file reference or from npm when published.
- **Database access** is centralized in `my-app/src/db.ts` using `mysql2/promise`; SQL queries use placeholder `?` to avoid injection.

---

## Useful Files & Locations

| Purpose | Path |
|---------|------|
| Hono server routes | `my-app/src/index.ts` |
| MySQL pool config | `my-app/src/db.ts` |
| Vue frontend entry | `jhc-web/src/main.ts` (not shown, but typical)
| Taro mini-app config | `jhc-wxapp/src/app.ts` and `project.config.json` |
| GIS library core | `jgis/src/index.ts` + `2d/` `3d/` subfolders |
| Documentation | `jgis-docs/docs/` and `jgis-docs/guide/` |

---

### Tips for the Agent

- When editing code, make sure you’re in the correct project directory. Imports are usually relative to that project’s `src` folder; cross‑project imports are rare.
- Re-run lint/format scripts before suggesting commits; they’re enforced by pre‑commit hooks.
- Don’t attempt to modify `package.json` versions in unrelated projects unless you fully understand the release process.
- If you run into build errors, check the individual project’s `tsconfig.json` or `vite.config.*`—each has its own quirks (e.g. path aliases in `jgis`).

---

Please review and tell me if any section feels unclear or if you need examples added for a specific subfolder.