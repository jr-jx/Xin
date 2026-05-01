# CLAUDE.md

Guidance for Claude Code (and similar AI assistants) working in this repository.

## Project Overview

`@everfu/xin` is a personal blog ("伍拾柒") built on **Nuxt 4**, content-driven via `@nuxt/content` (Markdown posts in `content/posts/`), with Twikoo comments and an Atom/OPML feed. Deployed to Netlify.

## Tech Stack

- **Framework**: Nuxt 4, Vue 3, TypeScript
- **Content**: `@nuxt/content` + Shiki + `nuxt-content-twoslash`, KaTeX, remark/rehype plugins
- **State**: Pinia (`@pinia/nuxt`)
- **UI**: `@nuxt/icon` (ri, mdi, material-symbols, carbon, ph, devicon, skill-icons), `@nuxt/image`, `@vueuse/motion`, `vue-tippy`
- **Styling**: SCSS (`sass-embedded`), `@nuxtjs/color-mode` (system/light/dark)
- **Tooling**: ESLint (`@antfu/eslint-config`), Stylelint (`@zinkawaii/stylelint-config`), `simple-git-hooks` + `lint-staged`
- **Package manager**: `pnpm@10.15.0` with workspace catalogs (`pnpm-workspace.yaml`)

## Common Commands

```bash
pnpm dev        # start dev server (http://localhost:3000)
pnpm build      # production build
pnpm generate   # static site generation
pnpm preview    # preview production build
pnpm lint:fix   # eslint --fix + stylelint --fix
```

`pnpm install` runs `postinstall` → `nuxt prepare && simple-git-hooks`.

## Repository Structure

- `app/` — Nuxt 4 app source
  - `components/` — auto-imported; `components/partial/` uses `U` prefix
  - `composables/`, `stores/`, `utils/`, `types/`, `plugins/`
  - `pages/`, `layouts/default.vue`
  - `assets/css/` — `main.scss`, `color.scss`, `post.scss`, `reusable.scss`, `animation.scss`, `_variable.scss`
  - `app.vue`, `app.config.ts`, `feeds.ts`
- `content/posts/` — Markdown articles
- `server/` — Nitro server
  - `api/search/` — search endpoint(s)
  - `routes/atom.xml.get.ts`, `routes/efu.opml.get.ts`
- `public/` — static assets (`favicon.ico`, `robots.txt`, `assets/atom.css`, `assets/atom.xsl`)
- `patches/` — pnpm patches for `@nuxtjs/mdc`, `@vue/shared`, `vue-tippy`
- Root configs: `nuxt.config.ts`, `blog.config.ts`, `content.config.ts`, `eslint.config.mjs`, `stylelint.config.mjs`, `netlify.toml`, `tsconfig.json`

## Configuration Entry Points

- **`blog.config.ts`** — site info, profile, menu, social, footer, Twikoo, feed limit, default category, license, beian.
- **`nuxt.config.ts`** — modules, CSS pipeline, SCSS auto-import of `_variable.scss`, route rules (`/atom.xml`, `/efu.opml` prerendered; `/favicon.ico` redirect), icon server bundle, runtime config (build time, node/platform, CI detection).
- **`app/app.config.ts`** — runtime app config.
- **`content.config.ts`** — `@nuxt/content` collection schemas.

## Conventions

- **Indentation**: tabs (see `.editorconfig`).
- **Components**: auto-imported from `~/components`; partial components prefixed with `U` (e.g. `<UButton />`).
- **SCSS**: `@/assets/css/_variable.scss` is auto-prepended to every SCSS file via Vite `additionalData`.
- **Content frontmatter**: `title`, `description`, `date`, `categories`, `tags`, `draft`, `image`.
- **Linting**: ESLint follows `@antfu/eslint-config`; stylelint follows `@zinkawaii/stylelint-config`. Run `pnpm lint:fix` before committing.
- **Console/debugger**: stripped in production via Terser (`drop_console`, `drop_debugger`).

## Git Hooks

`simple-git-hooks` installs a `pre-commit` hook running `lint-staged`:
- `*.{js,ts,vue}` → `eslint --fix`
- `*.{scss,vue}` → `stylelint --fix`

## Deployment

Netlify (`netlify.toml`). Atom feed (`/atom.xml`) and OPML (`/efu.opml`) are prerendered. Public assets are gzip/brotli compressed via Nitro (`compressPublicAssets: true`).

## Notes for AI Assistants

- **Use `pnpm`** — not npm/yarn. Dependency versions resolve through catalog references (e.g. `"nuxt": "catalog:framework"`); changing a version means editing `pnpm-workspace.yaml`, not `package.json`.
- **Patches**: `patches/` modifies `@nuxtjs/mdc`, `@vue/shared`, `vue-tippy`. Re-check these when upgrading the corresponding packages.
- **Minimal edits**: respect existing code style and comments; do not reformat unrelated code.
- **Component imports**: rely on Nuxt auto-import; avoid manual imports for components/composables under `app/`.
- **Content additions**: new posts go in `content/posts/*.md` with the frontmatter above; date field drives ordering and feeds.
- **SEO/feeds**: changes to site identity belong in `blog.config.ts`; head defaults live in `nuxt.config.ts` under `app.head`.

## Change Log

- 2026-05-01: Migrated site icons to the Phosphor (`ph:`) namespace and refined header nav pill/dropdown bridging animation and text color tokens; verification: not run.
- 2026-05-01: Added the `commit-changelog` skill so explicit user requests for AI-created commits keep concise change log entries in `AGENT.md` and `CLAUDE.md`; verification: `node -e` format check passed.
- 2026-05-01: Committed project-level Codex skills for general project work, dependency maintenance, and AI-created commit logs; verification: `node .codex/skills/project/scripts/skill_doctor.mjs`, `node -e`.
