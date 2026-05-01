# Dependency Update Workflow

## 1. Identify Ownership

Run:

```bash
node .codex/skills/dependency-update/scripts/dependency_plan.mjs <package...>
```

Read the output:

- `catalogManaged: true` means the editable version source is `pnpm-workspace.yaml`.
- `catalogName` tells which catalog section owns the version.
- `patched: true` means inspect the matching file in `patches/` before upgrading.
- `directDependency: false` means the package may be transitive or absent; avoid adding it unless the user asked for a new direct dependency.

## 2. Check Latest Versions

Version freshness is time-sensitive. Verify current registry data before choosing a target:

```bash
pnpm outdated
pnpm info <pkg> version
pnpm info <pkg> peerDependencies
```

Use official release notes or package docs for major framework upgrades when compatibility matters, especially Nuxt, Vue, TypeScript, `@nuxt/content`, and lint tooling.

## 3. Edit Source Of Truth

For `catalog:*` entries in `package.json`, edit the matching catalog entry in `pnpm-workspace.yaml`.

Examples:

- `nuxt: catalog:framework` -> `pnpm-workspace.yaml` under `catalogs.framework.nuxt`
- `@nuxt/content: catalog:content` -> `catalogs.content["@nuxt/content"]`
- `lint-staged: catalog:` -> top-level `catalog.lint-staged`

Only edit `package.json` when:

- adding or removing a direct dependency;
- changing a dependency that is not catalog-managed;
- changing scripts or package metadata by explicit request.

Never hand-edit `pnpm-lock.yaml`; regenerate it with pnpm.

## 4. Patch Review

Before upgrading a patched package:

```bash
sed -n '1,220p' patches/<patch-file>
```

After install/update, confirm whether the patch still applies. If pnpm reports patch conflicts, either refresh the patch deliberately or stop and explain the conflict.

Patched packages currently declared:

- `@nuxtjs/mdc` -> `patches/@nuxtjs__mdc.patch`
- `@vue/shared` -> `patches/@vue__shared.patch`
- `vue-tippy` -> `patches/vue-tippy.patch`

## 5. Install And Verify

Typical sequence:

```bash
pnpm install
pnpm build
```

Use `pnpm lint:fix` when lint/style packages or configs change.

Use `pnpm generate` when upgrades may affect static output, route rules, Atom/OPML routes, or Netlify generation.

If install scripts or native dependencies fail, preserve the exact error and inspect package-specific requirements before changing versions again.
