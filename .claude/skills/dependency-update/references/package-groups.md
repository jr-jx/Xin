# Xin Package Groups

Use these groups when deciding whether packages should be updated together.

## Framework

Catalog: `framework`

- `nuxt`
- `vue`
- `vue-router`
- `typescript`
- `@types/node`
- `sass-embedded`

Consider peer compatibility across Nuxt, Vue, Vue Router, TypeScript, and Node types.

## Content

Catalog: `content`

- `@nuxt/content`
- `nuxt-content-twoslash`
- `@shikijs/colorized-brackets`
- `plain-shiki`
- `remark-math`
- `remark-reading-time`
- `rehype-katex`
- `zod`
- `zod-to-json-schema`
- `better-sqlite3`

Content upgrades can affect Markdown parsing, highlighting, frontmatter schema, generated database behavior, and article rendering.

## UI

Catalog: `ui`

- `@nuxt/icon`
- `@nuxt/image`
- `@nuxtjs/color-mode`
- `nuxt-aos`
- `vue-tippy`
- Iconify packages

For `vue-tippy`, inspect `patches/vue-tippy.patch`.

## Quality

Catalog: `quality`

- `eslint`
- `@antfu/eslint-config`
- `@nuxt/eslint`
- `stylelint`
- `@zinkawaii/stylelint-config`

After updating these, run `pnpm lint:fix` and check whether config formats changed.

## Utility

Catalog: `util`

- `@pinia/nuxt`
- `pinia`
- `@vueuse/core`
- `@nuxt/scripts`
- `date-fns`
- `fast-xml-parser`
- `parse-domain`
- `radash`
- `unplugin-yaml`
- `ci-info`
- `aplayer`

Utility upgrades are usually narrower, but still verify build output when used by server routes or Nuxt plugins.
