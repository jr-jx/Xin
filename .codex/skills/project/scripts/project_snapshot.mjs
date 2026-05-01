#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
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

function listFiles(dir, predicate = () => true) {
	const fullDir = path.join(root, dir)
	if (!existsSync(fullDir))
		return []
	const entries = []
	for (const name of readdirSync(fullDir)) {
		const relative = path.join(dir, name)
		const full = path.join(root, relative)
		const stat = statSync(full)
		if (stat.isDirectory()) {
			entries.push(...listFiles(relative, predicate))
		}
		else if (predicate(relative)) {
			entries.push(relative)
		}
	}
	return entries.sort()
}

function extractNuxtModules(text) {
	const match = text.match(/modules:\s*\[([\s\S]*?)\]/m)
	if (!match)
		return []
	return [...match[1].matchAll(/['"`]([^'"`]+)['"`]/g)].map(item => item[1])
}

function extractCssEntries(text) {
	const match = text.match(/css:\s*\[([\s\S]*?)\]/m)
	if (!match)
		return []
	return [...match[1].matchAll(/['"`]([^'"`]+)['"`]/g)].map(item => item[1])
}

function extractRouteRules(text) {
	const match = text.match(/routeRules:\s*\{([\s\S]*?)\n\t\}/m)
	if (!match)
		return []
	return [...match[1].matchAll(/^\t\t['"`](\/[^'"`]+)['"`]\s*:/gm)].map(item => item[1])
}

function extractCatalogNames(text) {
	const names = new Set()
	let inCatalogs = false
	for (const line of text.split(/\r?\n/)) {
		if (/^catalog:\s*$/.test(line)) {
			names.add('catalog')
			inCatalogs = false
			continue
		}
		if (/^catalogs:\s*$/.test(line)) {
			inCatalogs = true
			continue
		}
		if (inCatalogs && line && !line.startsWith('  ')) {
			inCatalogs = false
			continue
		}
		const match = inCatalogs ? line.match(/^\s{2}([A-Za-z0-9_-]+):\s*$/) : null
		if (match)
			names.add(match[1])
	}
	return [...names]
}

function pageRouteFromFile(file) {
	let route = file
		.replace(/^app\/pages/, '')
		.replace(/\.(vue|ts|js|md)$/, '')
		.replace(/\/index$/, '/')
		.replace(/\[([^\]]+)\]/g, ':$1')
	if (!route.startsWith('/'))
		route = `/${route}`
	return route.replace(/\/+/g, '/')
}

function serverRouteFromFile(file) {
	return `/${file
		.replace(/^server\/(?:api|routes)\//, '')
		.replace(/\.(get|post|put|delete|patch)\.ts$/, '')
		.replace(/\.ts$/, '')
		.replace(/\/index$/, '')}`
}

const packageJson = readJson('package.json')
const workspaceText = readText('pnpm-workspace.yaml')
const nuxtConfig = readText('nuxt.config.ts')
const contentConfig = readText('content.config.ts')

const appPages = listFiles('app/pages', file => /\.(vue|ts|js|md)$/.test(file)).map(pageRouteFromFile)
const serverRoutes = [
	...listFiles('server/api', file => /\.ts$/.test(file)).map(serverRouteFromFile),
	...listFiles('server/routes', file => /\.ts$/.test(file)).map(serverRouteFromFile),
].sort()

const dependencies = packageJson
	? { ...packageJson.dependencies, ...packageJson.devDependencies }
	: {}
const catalogManagedCount = Object.values(dependencies).filter(version => String(version).startsWith('catalog:')).length

const summary = {
	name: packageJson?.name ?? 'unknown',
	version: packageJson?.version ?? 'unknown',
	packageManager: packageJson?.packageManager ?? 'unknown',
	stack: ['Nuxt 4', 'Vue 3', 'TypeScript', '@nuxt/content', 'Pinia', 'Nitro', 'SCSS'],
	scripts: packageJson?.scripts ?? {},
	catalogs: extractCatalogNames(workspaceText),
	catalogManagedDependencies: catalogManagedCount,
	patchedDependencies: [...workspaceText.matchAll(/^\s{2}'?([^':\n]+)'?:\s*patches\/(.+)$/gm)].map(match => `${match[1]} -> patches/${match[2]}`),
	nuxtModules: extractNuxtModules(nuxtConfig),
	globalCss: extractCssEntries(nuxtConfig),
	routeRules: extractRouteRules(nuxtConfig),
	contentCollections: [...contentConfig.matchAll(/^\t\t([A-Za-z0-9_-]+):\s*defineCollection/gm)].map(match => match[1]),
	routes: {
		pages: appPages,
		server: serverRoutes,
	},
	keyFiles: [
		'blog.config.ts',
		'nuxt.config.ts',
		'content.config.ts',
		'app/app.config.ts',
		'netlify.toml',
		'server/routes/atom.xml.get.ts',
		'server/routes/efu.opml.get.ts',
	].map(file => ({ file, exists: existsSync(path.join(root, file)) })),
}

console.log(JSON.stringify(summary, null, 2))
