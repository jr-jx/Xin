#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()

function readText(file) {
	const fullPath = path.join(root, file)
	return existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : ''
}

function readJson(file) {
	const text = readText(file)
	return text ? JSON.parse(text) : null
}

function unquote(value) {
	return value.trim().replace(/^['"]|['"]$/g, '')
}

function parseWorkspaceCatalogs(text) {
	const catalogs = { catalog: {} }
	let section = null
	let catalogName = null

	for (const line of text.split(/\r?\n/)) {
		if (!line.trim() || line.trim().startsWith('#'))
			continue

		if (/^catalog:\s*$/.test(line)) {
			section = 'catalog'
			catalogName = 'catalog'
			continue
		}

		if (/^catalogs:\s*$/.test(line)) {
			section = 'catalogs'
			catalogName = null
			continue
		}

		if (section === 'catalog' && line.startsWith('  ') && !line.startsWith('    ')) {
			const match = line.match(/^\s{2}(.+?):\s*(.+)$/)
			if (match)
				catalogs.catalog[unquote(match[1])] = unquote(match[2])
			continue
		}

		if (section === 'catalogs') {
			const catalogMatch = line.match(/^\s{2}([A-Za-z0-9_-]+):\s*$/)
			if (catalogMatch) {
				catalogName = catalogMatch[1]
				catalogs[catalogName] = catalogs[catalogName] ?? {}
				continue
			}

			const depMatch = line.match(/^\s{4}(.+?):\s*(.+)$/)
			if (catalogName && depMatch)
				catalogs[catalogName][unquote(depMatch[1])] = unquote(depMatch[2])
		}
	}

	return catalogs
}

function parsePatchedDependencies(text) {
	const patched = {}
	let inPatched = false
	for (const line of text.split(/\r?\n/)) {
		if (/^patchedDependencies:\s*$/.test(line)) {
			inPatched = true
			continue
		}
		if (inPatched && line && !line.startsWith('  '))
			break
		const match = inPatched ? line.match(/^\s{2}(.+?):\s*(.+)$/) : null
		if (match)
			patched[unquote(match[1])] = unquote(match[2])
	}
	return patched
}

function findCatalog(catalogs, packageName) {
	for (const [name, deps] of Object.entries(catalogs)) {
		if (Object.hasOwn(deps, packageName))
			return { catalogName: name, version: deps[packageName] }
	}
	return null
}

function dependencyKind(packageJson, packageName) {
	if (Object.hasOwn(packageJson?.dependencies ?? {}, packageName))
		return 'dependencies'
	if (Object.hasOwn(packageJson?.devDependencies ?? {}, packageName))
		return 'devDependencies'
	if (Object.hasOwn(packageJson?.optionalDependencies ?? {}, packageName))
		return 'optionalDependencies'
	if (Object.hasOwn(packageJson?.peerDependencies ?? {}, packageName))
		return 'peerDependencies'
	return null
}

const packageJson = readJson('package.json')
const workspaceText = readText('pnpm-workspace.yaml')
const catalogs = parseWorkspaceCatalogs(workspaceText)
const patchedDependencies = parsePatchedDependencies(workspaceText)
const requested = process.argv.slice(2)
const directNames = Object.keys({
	...(packageJson?.dependencies ?? {}),
	...(packageJson?.devDependencies ?? {}),
	...(packageJson?.optionalDependencies ?? {}),
	...(packageJson?.peerDependencies ?? {}),
}).sort()
const names = requested.length > 0 ? requested : directNames

const packages = names.map((name) => {
	const kind = dependencyKind(packageJson, name)
	const declaredRange = kind ? packageJson[kind][name] : null
	const catalog = findCatalog(catalogs, name)
	const catalogManaged = Boolean(declaredRange?.startsWith('catalog:') || catalog)
	const patchedPath = patchedDependencies[name] ?? null

	return {
		name,
		directDependency: Boolean(kind),
		dependencyField: kind,
		declaredRange,
		catalogManaged,
		catalogName: catalog?.catalogName ?? (declaredRange === 'catalog:' ? 'catalog' : null),
		currentCatalogRange: catalog?.version ?? null,
		patched: Boolean(patchedPath),
		patchFile: patchedPath,
		editFile: catalogManaged ? 'pnpm-workspace.yaml' : (kind ? 'package.json' : null),
		notes: [
			catalogManaged ? 'Update the catalog entry instead of replacing catalog:* in package.json.' : null,
			patchedPath ? 'Inspect the patch before upgrading and confirm it still applies after install.' : null,
			kind ? null : 'Not declared directly in package.json; check whether it is transitive before adding it.',
		].filter(Boolean),
	}
})

console.log(JSON.stringify({
	packageManager: packageJson?.packageManager ?? null,
	sourceFiles: ['package.json', 'pnpm-workspace.yaml', 'pnpm-lock.yaml'],
	commands: {
		inspectOutdated: 'pnpm outdated',
		checkLatest: 'pnpm info <pkg> version',
		checkPeers: 'pnpm info <pkg> peerDependencies',
		refreshLockfile: 'pnpm install',
		verify: ['pnpm build'],
	},
	patchedDependencies,
	packages,
}, null, 2))

