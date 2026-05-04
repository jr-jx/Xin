# CLAUDE.md

Guidance for Claude Code (and similar AI assistants) working in this repository.

## Project Overview

`@everfu/xin` is a personal blog ("伍拾柒") built on **Nuxt 4**, content-driven via `@nuxt/content` (Markdown posts in `content/posts/`), with built-in comments and an Atom/OPML feed. Deployed to EdgeOne Pages.

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
- Root configs: `nuxt.config.ts`, `blog.config.ts`, `content.config.ts`, `eslint.config.mjs`, `stylelint.config.mjs`, `tsconfig.json`

## Configuration Entry Points

- **`blog.config.ts`** — site info, profile, menu, social, footer, built-in comments, feed limit, default category, license, beian.
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

EdgeOne Pages. Atom feed (`/atom.xml`) and OPML (`/efu.opml`) are prerendered. Public assets are gzip/brotli compressed via Nitro (`compressPublicAssets: true`).

## Notes for AI Assistants

- **Use `pnpm`** — not npm/yarn. Dependency versions resolve through catalog references (e.g. `"nuxt": "catalog:framework"`); changing a version means editing `pnpm-workspace.yaml`, not `package.json`.
- **Patches**: `patches/` modifies `@nuxtjs/mdc`, `@vue/shared`, `vue-tippy`. Re-check these when upgrading the corresponding packages.
- **Minimal edits**: respect existing code style and comments; do not reformat unrelated code.
- **Component imports**: rely on Nuxt auto-import; avoid manual imports for components/composables under `app/`.
- **Content additions**: new posts go in `content/posts/*.md` with the frontmatter above; date field drives ordering and feeds.
- **SEO/feeds**: changes to site identity belong in `blog.config.ts`; head defaults live in `nuxt.config.ts` under `app.head`.

## Change Log

- 2026-05-05: Added `edgeone.json` with EdgeOne Pages build command, output directory, Node version, response headers, and Cloud Functions native dependency configuration for Nuxt SSR deployment; verification: `jq . edgeone.json`, `git diff --check`, `pnpm build`.
- 2026-05-05: Embedded `tencent-edgeone-skill` under `.codex/skills/tencent-edgeone/` with EdgeOne API, acceleration, security, and observability references for in-repo EdgeOne Pages/KV/Function work; verification: `node .codex/skills/project/scripts/skill_doctor.mjs`.
- 2026-05-05: Moved comments and friends likes storage to EdgeOne Pages KV, adding `server/utils/edgeKv.ts` for the `XIN_COMMENTS_KV` binding with local `.data/edgeone-kv` fallback; removed Netlify Blobs and `netlify.toml`; moved comment/like rate limiting to KV; verification: `pnpm build`.
- 2026-05-04: Slimmed dependencies by removing `radash`, `parse-domain`, `aplayer`, `@nuxt/scripts`, `nuxt-content-twoslash` (and its patch), `plain-shiki`, and `zod-to-json-schema`; reimplemented throttle/debounce/domain parsing locally in `app/utils/async.ts` and `app/utils/link.ts`; split `@iconify/json` into per-collection `@iconify-json/*` packages with matching `nuxt.config.ts` icon `serverBundle.collections`; added vite `manualChunks` (shiki/katex/tippy/motion) and enabled nitro `minify` plus gzip+brotli asset compression; added `@shikijs/transformers`; appended `NODE_OPTIONS=--max-old-space-size=4096` to `netlify.toml`; verification: not run.
- 2026-05-03: Bumped catalog deps (`nuxt` 4.4.4, `zod` 4.4.2, `@iconify/json` 2.2.469, `@vueuse/motion` 3.0.3, `@nuxt/scripts` 1.0.6, `@vueuse/core` 14.3.0, `isomorphic-dompurify` 3.12.0), added a `nuxt-content-twoslash@0.4.0` patch, declared explicit vite `optimizeDeps.include` entries in `nuxt.config.ts`, and tweaked `.personality-image` positioning in `app/pages/about/index.vue` to bottom-align; verification: not run.
- 2026-05-02: Removed unused `getClientIp`, `hashIp`, and `encodeLink` helpers (and their imports) from `server/utils/comments.ts` and comment API routes, relying on the existing `rateLimit` IP handling; verification: not run.
- 2026-05-02: Expanded `netlify.toml` with explicit pnpm build command, Node 22 / pnpm 10.15.0 pins, long-cache headers for `/_nuxt` and `/assets`, XML content-type for `atom.xml`/`efu.opml`, and site-wide security headers; verification: not run.
- 2026-05-02: Replaced Twikoo with a built-in comment system, adding `server/api/comments/` routes, `server/utils/{adminAuth,comments,mailer,rateLimit,spam}.ts`, `app/components/post/comment/` UI and `useComments` composable, wiring `comments`/`comments-meta` Nitro storage plus SMTP/admin `runtimeConfig` in `nuxt.config.ts`, swapping `blog.config.ts` `twikoo` for a `comment` block, syncing `NUXT_COMMENT_*`/SMTP vars in `.env.example`, and moving `@netlify/blobs` to the pnpm catalog; verification: not run.
- 2026-05-02: Added a friends aggregation page at `/friends` and like endpoints (`server/api/friends.get.ts`, `likes.{get,post}.ts`) backed by Nitro storage (Netlify Blobs in prod, fs in dev) with `NUXT_IP_HASH_SALT`-hashed IP dedupe, plus `@netlify/blobs` dependency and `FriendItem` types; verification: not run.
- 2026-05-01: Migrated site icons to the Phosphor (`ph:`) namespace and refined header nav pill/dropdown bridging animation and text color tokens; verification: not run.
- 2026-05-01: Added the `commit-changelog` skill so explicit user requests for AI-created commits keep concise change log entries in `AGENT.md` and `CLAUDE.md`; verification: `node -e` format check passed.
- 2026-05-01: Committed project-level Codex skills for general project work, dependency maintenance, and AI-created commit logs; verification: `node .codex/skills/project/scripts/skill_doctor.mjs`, `node -e`.
